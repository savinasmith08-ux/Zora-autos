// @ts-nocheck
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

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
    const { data: reservation } = await admin
      .from('reservations')
      .select('id, user_id, thread_id, stripe_session_id, status, amount_cents, currency')
      .eq('thread_id', thread_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reservation?.stripe_session_id) {
      return new Response(JSON.stringify({ status: 'none' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(reservation.stripe_session_id);

    if (session.payment_status === 'paid') {
      const pi = typeof session.payment_intent === 'string' ? session.payment_intent : null;
      await admin
        .from('reservations')
        .update({ status: 'paid', stripe_payment_intent: pi })
        .eq('id', reservation.id);

      const amount = (reservation.amount_cents / 100).toFixed(2);
      await admin.from('inquiry_messages').insert({
        thread_id: reservation.thread_id,
        sender_id: reservation.user_id,
        body: `✅ Reservation deposit of ${reservation.currency.toUpperCase()} $${amount} received. The vehicle is now reserved.`,
        read_by_user: true,
        read_by_admin: false,
      });

      return new Response(JSON.stringify({ status: 'paid' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (session.status === 'expired') {
      await admin.from('reservations').update({ status: 'expired' }).eq('id', reservation.id);
    }

    return new Response(JSON.stringify({ status: session.payment_status }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('verify-deposit error', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

