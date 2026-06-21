import { NextRequest, NextResponse } from "next/server";
import { adminAuthConfigured, validAdminCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar el acceso administrativo." }, { status: 503 });
  if (!validAdminCredentials(request.headers.get("x-admin-username") || "", request.headers.get("x-admin-password") || "")) return NextResponse.json({ error: "La sesión de administrador no es válida." }, { status: 401 });
  const uploadUrl = process.env.CPANEL_UPLOAD_URL;
  const uploadToken = process.env.CPANEL_UPLOAD_TOKEN;
  if (!uploadUrl || !uploadToken) return NextResponse.json({ error: "Falta configurar la conexión con cPanel." }, { status: 503 });
  try {
    const input = await request.formData();
    const file = input.get("file");
    if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Selecciona una imagen JPG, PNG o WebP de hasta 5 MB." }, { status: 400 });
    const outgoing = new FormData();
    outgoing.set("file", file, file.name);
    outgoing.set("token", uploadToken);
    const response = await fetch(uploadUrl, { method: "POST", body: outgoing, signal: AbortSignal.timeout(30000), cache: "no-store" });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "El servidor cPanel rechazó la imagen.");
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Could not upload article image", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo subir la imagen." }, { status: 502 });
  }
}
