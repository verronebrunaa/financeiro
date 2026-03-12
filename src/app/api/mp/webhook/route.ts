import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getMpClient() {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mercado Pago sends different notification types
    if (body.type === "payment" || body.action === "payment.updated") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const mp = getMpClient();
      const supabaseAdmin = getSupabaseAdmin();
      const payment = new Payment(mp);
      const paymentData = await payment.get({ id: paymentId });

      if (!paymentData.external_reference) {
        return NextResponse.json({ received: true });
      }

      const [userId, plan] = paymentData.external_reference.split("|");

      if (paymentData.status === "approved") {
        // Calculate period end (30 days from now)
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            mp_payment_id: String(paymentId),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" },
        );
      } else if (
        paymentData.status === "rejected" ||
        paymentData.status === "cancelled"
      ) {
        // Revert to free plan
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "free",
            status: "active",
            mp_payment_id: null,
            current_period_start: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to MP so it doesn't retry indefinitely
    return NextResponse.json({ received: true });
  }
}
