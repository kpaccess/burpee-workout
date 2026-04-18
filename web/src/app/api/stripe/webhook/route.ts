import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import stripe from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

// Store a pending subscription keyed by email for users who paid before creating an account
async function storePendingSubscription(
  email: string,
  data: Record<string, unknown>,
) {
  const db = getAdminDb();
  const pendingRef = db.collection("pending_subscriptions").doc(email.toLowerCase());
  await pendingRef.set({ ...data, createdAt: new Date().toISOString() });
}

// Update (or create via merge) a user doc in Firestore
async function updateFirestoreUser(
  firebaseUserId: string,
  data: Record<string, unknown>,
) {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(firebaseUserId);
  await userRef.set(data, { merge: true });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Payment succeeded → unlock Pro
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const firebaseUserId = session.metadata?.firebaseUserId;
        if (firebaseUserId) {
          // Logged-in user: update their Firestore doc directly
          await updateFirestoreUser(firebaseUserId, {
            isPro: true,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: "active",
          });
        } else {
          // Guest checkout: store pending subscription by email so it can be
          // claimed when the user creates their account on the login page
          const customerEmail =
            session.customer_details?.email ?? session.customer_email;
          if (customerEmail) {
            await storePendingSubscription(customerEmail, {
              isPro: true,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: "active",
            });
          }
        }
        break;
      }

      // Subscription renewed successfully
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subscriptionId) {
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const firebaseUserId = sub.metadata?.firebaseUserId;
        if (firebaseUserId) {
          await updateFirestoreUser(firebaseUserId, {
            isPro: true,
            subscriptionStatus: "active",
          });
        }
        break;
      }

      // Payment failed → downgrade
      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subscriptionId) {
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const firebaseUserId = sub.metadata?.firebaseUserId;
        if (firebaseUserId) {
          await updateFirestoreUser(firebaseUserId, {
            isPro: false,
            subscriptionStatus: "past_due",
          });
        }
        break;
      }

      // Subscription canceled
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const firebaseUserId = sub.metadata?.firebaseUserId;
        if (firebaseUserId) {
          await updateFirestoreUser(firebaseUserId, {
            isPro: false,
            subscriptionStatus: "canceled",
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
