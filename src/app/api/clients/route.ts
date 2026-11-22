import { NextResponse } from "next/server";
import { listClients } from "@/lib/queries";

// GET /api/clients — client list with per-client billing totals, as JSON.
export async function GET() {
  const clients = listClients().map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    contact: c.contact,
    invoiceCount: c.invoice_count,
    totalBilled: c.billed_cents / 100,
  }));
  return NextResponse.json({ count: clients.length, clients });
}
