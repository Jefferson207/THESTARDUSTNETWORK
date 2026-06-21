import { NextRequest, NextResponse } from "next/server";
import { adminAuthConfigured, validAdminCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!validAdminCredentials(username, password)) return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ error: "No se pudo validar el acceso." }, { status: 400 });
  }
}
