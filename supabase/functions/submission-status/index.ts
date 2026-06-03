// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  submissionId: string;
  newStatus: "approved" | "rejected";
  convertToListing?: boolean;
  additionalData?: {
    engine: string;
    exterior_color: string;
    interior_color: string;
    vin: string;
    features: string[];
    is_featured: boolean;
    description: string;
  };
}

const escapeHtml = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ---- AuthN/AuthZ: validate caller is an authenticated admin ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: isAdmin, error: roleError } = await authClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleError || isAdmin !== true) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Service-role client used only after admin verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submissionId, newStatus, convertToListing, additionalData }: StatusUpdateRequest = await req.json();

    if (!submissionId || (newStatus !== "approved" && newStatus !== "rejected")) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }

    console.log(`Processing status update for submission ${submissionId} to ${newStatus}`);

    const { data: submission, error: fetchError } = await supabase
      .from("car_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      return jsonResponse({ error: "Submission not found" }, 404);
    }

    const { error: updateError } = await supabase
      .from("car_submissions")
      .update({ status: newStatus })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return jsonResponse({ error: "Failed to update submission" }, 500);
    }

    let carListingId = null;

    if (newStatus === "approved" && convertToListing) {
      console.log("Converting submission to car listing...");
      
      const carData = {
        make: submission.make,
        model: submission.model,
        year: submission.year,
        price: submission.asking_price,
        condition: submission.condition,
        fuel_type: submission.fuel_type,
        transmission: submission.transmission || "automatic",
        is_hybrid: submission.is_hybrid || false,
        mileage: submission.mileage,
        image_url: submission.images?.[0] || "/placeholder.svg",
        images: submission.images || [],
        videos: [],
        description: additionalData?.description || submission.description || `${submission.year} ${submission.make} ${submission.model}`,
        engine: additionalData?.engine || "To be updated",
        exterior_color: additionalData?.exterior_color || "To be updated",
        interior_color: additionalData?.interior_color || "To be updated",
        vin: additionalData?.vin || `VIN-${submissionId.substring(0, 8).toUpperCase()}`,
        features: additionalData?.features || [],
        is_featured: additionalData?.is_featured || false,
      };

      const { data: newCar, error: insertError } = await supabase
        .from("cars")
        .insert([carData])
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating car listing:", insertError);
      } else {
        carListingId = newCar?.id;
        console.log("Car listing created with ID:", carListingId);
      }
    }

    const emailSubject = newStatus === "approved" 
      ? "🎉 Your Car Submission Has Been Approved!" 
      : "Update on Your Car Submission";

    const safeName = escapeHtml(submission.name);
    const safeMake = escapeHtml(submission.make);
    const safeModel = escapeHtml(submission.model);
    const safeYear = escapeHtml(submission.year);
    const safeCondition = escapeHtml(submission.condition);
    const safePrice = escapeHtml(Number(submission.asking_price).toLocaleString());

    const emailHtml = newStatus === "approved"
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">Congratulations, ${safeName}!</h1>
          <p>Great news! Your car submission has been <strong style="color: #16a34a;">approved</strong>.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Vehicle Details:</h3>
            <p><strong>Vehicle:</strong> ${safeYear} ${safeMake} ${safeModel}</p>
            <p><strong>Condition:</strong> ${safeCondition}</p>
            <p><strong>Asking Price:</strong> $${safePrice}</p>
          </div>
          ${carListingId ? '<p>Your car is now listed on our website and visible to potential buyers!</p>' : ''}
          <p>We will be in touch soon with next steps.</p>
          <p style="color: #6b7280; margin-top: 30px;">Best regards,<br>The Zora Autos Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Hello, ${safeName}</h1>
          <p>Thank you for submitting your car to Zora Autos.</p>
          <p>After careful review, we regret to inform you that your submission has been <strong style="color: #dc2626;">not approved</strong> at this time.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Submitted Vehicle:</h3>
            <p><strong>Vehicle:</strong> ${safeYear} ${safeMake} ${safeModel}</p>
            <p><strong>Condition:</strong> ${safeCondition}</p>
          </div>
          <p>This could be due to various factors such as vehicle condition, documentation, or current inventory needs.</p>
          <p>Feel free to reach out to us if you have any questions or would like to resubmit with updated information.</p>
          <p style="color: #6b7280; margin-top: 30px;">Best regards,<br>The Zora Autos Team</p>
        </div>
      `;

    try {
      await resend.emails.send({
        from: "Zora Autos <onboarding@resend.dev>",
        to: [submission.email],
        subject: emailSubject,
        html: emailHtml,
      });
      console.log("Email sent successfully");
    } catch (emailError: any) {
      console.error("Error sending email:", emailError?.message || emailError);
    }

    return jsonResponse(
      { success: true, message: `Submission ${newStatus}`, carListingId },
      200,
    );
  } catch (error: any) {
    console.error("Error in submission-status function:", error?.message || error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

serve(handler);

