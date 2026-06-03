// @ts-nocheck
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const DEPOSIT_PCT = 5; // 5% of car price

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userData.user;

    const { thread_id } = await req.json();
    if (!thread_id || typeof thread_id !== 'string') {
      return new Response(JSON.stringify({ error: 'thread_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: thread, error: threadErr } = await admin
      .from('inquiry_threads')
      .select('id, user_id, car_id, car:cars(id, make, model, year, price, image_url)')
      .eq('id', thread_id)
      .maybeSingle();

    if (threadErr || !thread) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (thread.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const car: any = thread.car;
    if (!car?.price) {
      return new Response(JSON.stringify({ error: 'Car price unavailable' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const depositCents = Math.round((Number(car.price) * DEPOSIT_PCT / 100) * 100);
    const stripe = new Stripe(stripeKey);

    let origin = req.headers.get('origin');
    if (!origin) {
      const referer = req.headers.get('referer');
      if (referer) {
        try {
          origin = new URL(referer).origin;
        } catch (_) {
          // ignore
        }
      }
    }
    if (!origin) {
      origin = 'http://localhost:8080';
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: depositCents,
          product_data: {
            name: `Reservation Deposit — ${car.year} ${car.make} ${car.model}`,
            description: `${DEPOSIT_PCT}% refundable deposit to reserve this vehicle.`,
            images: car.image_url ? [car.image_url] : undefined,
          },
        },
      }],
      success_url: `${origin}/inquiries?thread=${thread_id}&deposit=success`,
      cancel_url: `${origin}/inquiries?thread=${thread_id}&deposit=canceled`,
      metadata: {
        thread_id,
        car_id: car.id,
        user_id: user.id,
        deposit_pct: String(DEPOSIT_PCT),
      },
    });

    await admin.from('reservations').insert({
      thread_id,
      car_id: car.id,
      user_id: user.id,
      amount_cents: depositCents,
      currency: 'usd',
      deposit_pct: DEPOSIT_PCT,
      status: 'pending',
      stripe_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('create-deposit-checkout error', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

