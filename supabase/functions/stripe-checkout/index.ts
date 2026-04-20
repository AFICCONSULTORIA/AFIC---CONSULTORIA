// Supabase Edge Function - Stripe Checkout
// Deploy: supabase functions deploy stripe-checkout

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Stripe keys from secrets
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const stripe = require('stripe')(stripeSecretKey)

    // Parse request body
    const { plan_id, billing_type, user_id } = await req.json()

    // Get plan from database
    const { data: plan, error: planError } = await supabase
      .from('afic_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      throw new Error('Plano não encontrado')
    }

    // Determine price
    const amount = billing_type === 'monthly' 
      ? plan.monthly_price * 100 // Convert to cents
      : plan.lifetime_price * 100

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: amount,
          recurring: billing_type === 'monthly' ? {
            interval: 'month',
          } : undefined,
        },
        quantity: 1,
      }],
      mode: billing_type === 'monthly' ? 'subscription' : 'payment',
      success_url: `${req.headers.get('origin')}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/?payment=cancelled`,
      customer_email: req.headers.get('user-email') || undefined,
      metadata: {
        plan_id,
        billing_type,
        user_id,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})