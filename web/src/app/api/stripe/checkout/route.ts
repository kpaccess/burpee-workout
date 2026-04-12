import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { firebaseUserId: userId },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      subscription_data: {
        metadata: { firebaseUserId: userId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
