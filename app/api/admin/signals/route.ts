import { NextRequest, NextResponse } from "next/server";
import { getSignals } from "@/lib/signals";
import type { Signal } from "@/lib/types";
import { adminAuthConfigured, validAdminCredentials } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validRequestCredentials(request: NextRequest) {
  return validAdminCredentials(request.headers.get("x-admin-username") || "", request.headers.get("x-admin-password") || "");
}

function ensureAdmin(request: NextRequest) {
  if (!adminAuthConfigured()) return NextResponse.json({ error: "Falta configurar ADMIN_PASSWORD en el servidor." }, { status: 503 });
  if (!validRequestCredentials(request)) return NextResponse.json({ error: "La sesion de administrador no es valida." }, { status: 401 });
  return null;
}

function filterSignals(signals: Signal[], request: NextRequest) {
  const search = clean(request.nextUrl.searchParams.get("search"), 120).toLowerCase();
  const interest = clean(request.nextUrl.searchParams.get("interest"), 140);
  const dateFrom = clean(request.nextUrl.searchParams.get("dateFrom"), 10);
  const dateTo = clean(request.nextUrl.searchParams.get("dateTo"), 10);
  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`).getTime() : 0;
  const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999Z`).getTime() : Number.POSITIVE_INFINITY;

  return signals.filter(signal => {
    const createdTime = new Date(signal.createdAt).getTime();
    const matchesSearch = !search || [signal.name, signal.email, signal.interest, signal.message].some(value => value.toLowerCase().includes(search));
    const matchesInterest = !interest || signal.interest === interest;
    const matchesDate = createdTime >= fromTime && createdTime <= toTime;
    return matchesSearch && matchesInterest && matchesDate;
  });
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function excel(signals: Signal[]) {
  const rows = signals.map(signal => `<tr><td>${escapeHtml(signal.date)}</td><td>${escapeHtml(signal.name)}</td><td>${escapeHtml(signal.email)}</td><td>${escapeHtml(signal.interest)}</td><td>${escapeHtml(signal.message)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr><th>Fecha</th><th>Nombre</th><th>Correo</th><th>Constelacion</th><th>Mensaje</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, max = 92) {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function pdf(signals: Signal[]) {
  const lines = ["Registros de senales", `Total: ${signals.length}`, ""];
  signals.slice(0, 80).forEach(signal => {
    lines.push(`${signal.date} | ${signal.name} | ${signal.email}`);
    lines.push(`Constelacion: ${signal.interest}`);
    wrapText(`Mensaje: ${signal.message}`).forEach(line => lines.push(line));
    lines.push("");
  });
  const contentLines = lines.slice(0, 180);
  const text = contentLines.map((line, index) => `BT /F1 9 Tf 40 ${790 - index * 12} Td (${pdfEscape(line)}) Tj ET`).join("\n");
  const stream = Buffer.from(text, "utf8");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${stream.length} >> stream\n${text}\nendstream endobj\n`,
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = objects.map(object => {
    const current = offset;
    offset += Buffer.byteLength(object, "utf8");
    return current;
  });
  const xrefStart = offset;
  const body = objects.join("");
  const table = `xref\n0 6\n0000000000 65535 f \n${xref.map(item => `${String(item).padStart(10, "0")} 00000 n `).join("\n")}\n`;
  const trailer = `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(`%PDF-1.4\n${body}${table}${trailer}`, "utf8");
}

export async function GET(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) return authError;

  try {
    const allSignals = await getSignals();
    const filtered = filterSignals(allSignals, request);
    const format = clean(request.nextUrl.searchParams.get("format"), 10);

    if (format === "excel") {
      return new NextResponse(excel(filtered), { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": "attachment; filename=senales-stardust.xls" } });
    }
    if (format === "pdf") {
      return new NextResponse(pdf(filtered), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=senales-stardust.pdf" } });
    }

    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(5, Number(request.nextUrl.searchParams.get("pageSize") || 10)));
    const start = (page - 1) * pageSize;
    const interests = Array.from(new Set(allSignals.map(signal => signal.interest))).filter(Boolean).sort();
    return NextResponse.json({
      signals: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      interests,
    });
  } catch (error) {
    console.error("Could not load signals", error);
    return NextResponse.json({ error: "No se pudieron cargar los registros." }, { status: 500 });
  }
}
