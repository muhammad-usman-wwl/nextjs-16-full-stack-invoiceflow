import { NextResponse, type NextRequest } from "next/server";
import { listInvoices } from "@/lib/queries";
import { effectiveStatus } from "@/lib/format";

// A classic route handler: the same data the pages render, exposed as
// JSON for anything that needs it (a mobile app, a script, a webhook
// consumer). GET /api/invoices?q=pixel&status=overdue
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const invoices = listInvoices({ q, status }).map((inv) => ({
    id: inv.id,
    number: inv.number,
    client: inv.client_name,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    status: effectiveStatus(inv.status, inv.due_date),
    total: inv.total_cents / 100,
  }));
  return NextResponse.json({ count: invoices.length, invoices });
}
