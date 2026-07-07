import Stripe from 'stripe';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY || '';

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export const PRICING_PLANS = {
  FREE: {
    id: 'price_free',
    name: 'Free',
    price: 0,
    features: [
      '50 messages per day',
      'Basic AI responses',
      'Standard support'
    ]
  },
  PRO: {
    id: 'price_pro_monthly',
    name: 'Pro',
    price: 9.99,
    interval: 'month' as const,
    features: [
      'Unlimited messages',
      'Advanced AI responses',
      'Priority support',
      'File attachments',
      'Export conversations'
    ]
  },
  ENTERPRISE: {
    id: 'price_enterprise_monthly',
    name: 'Enterprise',
    price: 29.99,
    interval: 'month' as const,
    features: [
      'Everything in Pro',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ]
  }
};

export async function createCheckoutSession(userId: string, priceId: string) {
  if (!stripe) throw new Error('Stripe not configured');

  const subscription = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${window.location.origin}/pricing`,
    customer_email: userId,
    metadata: {
      userId,
    },
  });

  return subscription;
}

export async function createPortalSession(customerId: string) {
  if (!stripe) throw new Error('Stripe not configured');

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: window.location.origin,
  });

  return url;
}
