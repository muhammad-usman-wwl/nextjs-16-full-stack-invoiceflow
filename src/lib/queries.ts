import { getDb } from "./db";

// Read-side queries used by the pages (Server Components) and by the
// /api route handlers. Invoice totals are computed in SQL from the
// line items, so the number on screen is always the number in the data.

export interface Client {
  id: number;
  name: string;
  email: string;
  contact: string;
  created_at: string;
}

export interface ClientWithStats extends Client {
  invoice_count: number;
  billed_cents: number;
}

export interface Invoice {
  id: number;
  number: string;
  client_id: number;
  client_name: string;
  issue_date: string;
  due_date: string;
  status: "draft" | "sent" | "paid";
  notes: string;
  total_cents: number;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  rate_cents: number;
}

const INVOICE_SELECT = `
  SELECT i.id, i.number, i.client_id, c.name AS client_name,
         i.issue_date, i.due_date, i.status, i.notes,
         COALESCE(SUM(it.quantity * it.rate_cents), 0) AS total_cents
  FROM invoices i
  JOIN clients c ON c.id = i.client_id
  LEFT JOIN invoice_items it ON it.invoice_id = i.id
`;

export function listClients(): ClientWithStats[] {
  return getDb()
    .prepare(
      `SELECT c.*,
              COUNT(DISTINCT i.id) AS invoice_count,
              COALESCE(SUM(it.quantity * it.rate_cents), 0) AS billed_cents
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       LEFT JOIN invoice_items it ON it.invoice_id = i.id
       GROUP BY c.id
       ORDER BY c.name`
    )
    .all() as ClientWithStats[];
}

export function getClient(id: number): Client | undefined {
  return getDb()
    .prepare("SELECT * FROM clients WHERE id = ?")
    .get(id) as Client | undefined;
}

export function listInvoices(opts: {
  q?: string;
  status?: string;
}): Invoice[] {
  const rows = getDb()
    .prepare(
      `${INVOICE_SELECT}
       GROUP BY i.id
       ORDER BY i.issue_date DESC, i.id DESC`
    )
    .all() as Invoice[];

  let out = rows;
  const q = (opts.q ?? "").trim().toLowerCase();
  if (q) {
    out = out.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.client_name.toLowerCase().includes(q)
    );
  }
  const status = opts.status ?? "all";
  if (status === "overdue") {
    const today = new Date().toISOString().slice(0, 10);
    out = out.filter((r) => r.status === "sent" && r.due_date < today);
  } else if (status !== "all") {
    out = out.filter((r) => r.status === status);
  }
  return out;
}

export function getInvoice(id: number): Invoice | undefined {
  return getDb()
    .prepare(`${INVOICE_SELECT} WHERE i.id = ? GROUP BY i.id`)
    .get(id) as Invoice | undefined;
}

export function getInvoiceItems(invoiceId: number): InvoiceItem[] {
  return getDb()
    .prepare(
      "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id"
    )
    .all(invoiceId) as InvoiceItem[];
}

export interface DashboardStats {
  clientCount: number;
  invoiceCount: number;
  billedCents: number;
  collectedCents: number;
  outstandingCents: number;
  overdueCents: number;
  overdueCount: number;
  draftCount: number;
}

export function getDashboardStats(): DashboardStats {
  const invoices = listInvoices({});
  const today = new Date().toISOString().slice(0, 10);
  const sum = (list: Invoice[]) =>
    list.reduce((acc, r) => acc + r.total_cents, 0);
  const paid = invoices.filter((r) => r.status === "paid");
  const sent = invoices.filter((r) => r.status === "sent");
  const overdue = sent.filter((r) => r.due_date < today);
  return {
    clientCount: listClients().length,
    invoiceCount: invoices.length,
    billedCents: sum(invoices),
    collectedCents: sum(paid),
    outstandingCents: sum(sent),
    overdueCents: sum(overdue),
    overdueCount: overdue.length,
    draftCount: invoices.filter((r) => r.status === "draft").length,
  };
}

export function nextInvoiceNumber(): string {
  const row = getDb()
    .prepare("SELECT MAX(number) AS maxn FROM invoices")
    .get() as { maxn: string | null };
  if (!row.maxn) return "INV-1001";
  const n = parseInt(row.maxn.replace(/\D/g, ""), 10);
  return "INV-" + (n + 1);
}
