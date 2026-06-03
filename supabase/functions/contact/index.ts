// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal('')),
  subject: z.string().trim().max(200, "Subject must be less than 200 characters").optional().or(z.literal('')),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters"),
});

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

// HTML escape helper to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Simple rate limiting using Supabase
async function checkRateLimit(supabase: any, email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', oneHourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to not block legitimate users
  }
  
  return (count || 0) < 3; // Max 3 submissions per hour
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    
    // Validate input with Zod
    const validationResult = contactSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          success: false 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, phone, subject, message } = validationResult.data;

    // Check rate limit
    const withinRateLimit = await checkRateLimit(supabase, email);
    if (!withinRateLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          success: false 
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Contact submission received', { timestamp: new Date().toISOString() });

    // Save to database
    const { data, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError.message);
      throw new Error('Failed to save message');
    }

    console.log('Message saved successfully', { id: data.id, timestamp: new Date().toISOString() });

    // Send email notification to you (with HTML escaping)
    const emailResponse = await resend.emails.send({
      from: "Zora Autos <onboarding@resend.dev>",
      to: ["newm5811@gmail.com"],
      subject: `New Contact Form Message: ${escapeHtml(subject || 'No Subject')}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject || 'No subject')}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${escapeHtml(message).replace(/\n/g, '<br>')}
        </div>
        <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
      `,
    });

    console.log('Email sent successfully', { timestamp: new Date().toISOString() });

    // Send confirmation email to customer (with HTML escaping)
    await resend.emails.send({
      from: "Zora Autos <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for contacting Zora Autos!",
      html: `
        <h2>Thank you for your message, ${escapeHtml(name)}!</h2>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${escapeHtml(message).replace(/\n/g, '<br>')}
        </div>
        <p>We typically respond within 24 hours during business hours.</p>
        <p>Best regards,<br>The Zora Autos Team</p>
        <p><small>Phone: 0530044589</small></p>
      `,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message sent successfully',
      id: data.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in contact function:", error.message || 'Unknown error');
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send message. Please try again later.',
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
