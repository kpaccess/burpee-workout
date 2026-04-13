import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail } = await req.json();

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 500 },
      );
    }

    // Use env var if set (production), otherwise derive from the incoming request origin (local dev)
    const { origin } = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    // Build session differently depending on whether the user is already logged in.
    // Avoids conditional spread, which can break Stripe's strict TS types.
    let session;
    if (userId) {
      // Logged-in: attach Firebase UID so the webhook updates their Firestore doc directly
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: userEmail ?? undefined,
        metadata: { firebaseUserId: userId },
        subscription_data: { metadata: { firebaseUserId: userId } },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } else {
      // Guest: no Firebase UID — Stripe collects the email, webhook stores a
      // pending_subscription by email that gets claimed at signup
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
