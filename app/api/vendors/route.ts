import { createClient } from "@/lib/supabase/server";
import db from "@/lib/prisma";

// ✅ GET: obtener todos los vendors
export async function GET() {
  try {
    const vendors = await db.vendor.findMany({
      orderBy: { name: "asc" },
    });

    return new Response(JSON.stringify(vendors), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error al obtener vendors:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ✅ POST: crear vendor autenticado
export async function POST(req: Request) {
  try {
    // 👇 agregamos "await" acá
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();

    if (!body.name) {
      return new Response(
        JSON.stringify({ error: "Falta el nombre del comercio" }),
        { status: 400 }
      );
    }

    const vendor = await db.vendor.create({
      data: {
        name: body.name,
        address: body.address ?? null,
        openingHours: body.openingHours ?? null,
        closingHours: body.closingHours ?? null,
        ownerId: user.id, // 🔗 vínculo con el usuario Supabase
      },
    });

    return new Response(JSON.stringify(vendor), {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error al crear vendor:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

// ✅ OPTIONS: soporte CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
