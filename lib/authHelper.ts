import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createSupabaseClient();
}

export async function authenticateUser() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    return data.user;
  } catch (err) {
    console.error("authenticateUser error:", err);
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
}
