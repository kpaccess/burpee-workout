import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

// setDoc with merge:true works whether the doc exists or not
async function updateFirestoreUser(
  firebaseUserId: string,
  data: Record<string, unknown>,
) {
  if (!db) return;
  const userRef = doc(db, "users", firebaseUserId);
  await setDoc(userRef, data, { merge: true });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
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
        const session = event.data.object as Record<string, any>;
        const firebaseUserId = session.metadata?.firebaseUserId;
        if (firebaseUserId) {
          await updateFirestoreUser(firebaseUserId, {
            isPro: true,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: "active",
          });
        }
        break;
      }

      // Subscription renewed successfully
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Record<string, any>;
        const sub = await stripe.subscriptions.retrieve(
          invoice.subscription as string,
        );
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
        const invoice = event.data.object as Record<string, any>;
        const sub = await stripe.subscriptions.retrieve(
          invoice.subscription as string,
        );
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
        const sub = event.data.object as Record<string, any>;
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
