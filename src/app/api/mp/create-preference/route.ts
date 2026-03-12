import { MercadoPagoConfig, Preference } from "mercadopago";
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

const PLANS: Record<string, { title: string; price: number }> = {
  pro: { title: "Finnan Pro - Mensal", price: 19.9 },
  premium: { title: "Finnan Premium - Mensal", price: 39.9 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, userId, userEmail } = body;

    if (!plan || !userId || !userEmail) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const planInfo = PLANS[plan];
    if (!planInfo) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const mp = getMpClient();
    const supabaseAdmin = getSupabaseAdmin();

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `finnan_${plan}`,
            title: planInfo.title,
            quantity: 1,
            unit_price: planInfo.price,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: userEmail,
        },
        metadata: {
          user_id: userId,
          plan,
        },
        back_urls: {
          success: `${appUrl}/dashboard/plans?status=success&plan=${plan}`,
          failure: `${appUrl}/dashboard/plans?status=failure`,
          pending: `${appUrl}/dashboard/plans?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/mp/webhook`,
        external_reference: `${userId}|${plan}`,
      },
    });

    // Save preference id
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: "free",
          status: "pending",
          mp_preference_id: result.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id,
    });
  } catch (error: unknown) {
    console.error("MP create preference error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
