"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { nextInvoiceNumber } from "./queries";

// All writes happen in Server Actions — no API routes to wire up for the
// UI itself. Forms post straight to these functions.

export interface FormState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function refreshAll() {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/invoices");
}

// ---------- Clients ----------

export async function createClient(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  if (!name) return { error: "Client name is required." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  getDb()
    .prepare("INSERT INTO clients (name, email, contact) VALUES (?, ?, ?)")
    .run(name, email, contact);
  refreshAll();
  redirect("/clients");
}

export async function updateClient(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  if (!name) return { error: "Client name is required." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  getDb()
    .prepare("UPDATE clients SET name = ?, email = ?, contact = ? WHERE id = ?")
    .run(name, email, contact, id);
  refreshAll();
  redirect("/clients");
}

export async function deleteClient(id: number): Promise<void> {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM invoices WHERE client_id = ?")
    .get(id) as { n: number };
  if (row.n > 0) {
    // A client with invoices is never deleted silently — the UI filters
    // this button out, and the guard here is the second line of defence.
    throw new Error("This client has invoices and cannot be deleted.");
  }
  db.prepare("DELETE FROM clients WHERE id = ?").run(id);
  refreshAll();
}

// ---------- Invoices ----------

interface ParsedItem {
  description: string;
  quantity: number;
  rate_cents: number;
}

function parseItems(formData: FormData): ParsedItem[] | { error: string } {
  const descs = formData.getAll("item_desc").map((v) => String(v).trim());
  const qtys = formData.getAll("item_qty").map((v) => Number(v));
  const rates = formData.getAll("item_rate").map((v) => Number(v));
  const items: ParsedItem[] = [];
  for (let i = 0; i < descs.length; i++) {
    if (!descs[i] && !qtys[i] && !rates[i]) continue; // blank row
    if (!descs[i]) return { error: "Every line item needs a description." };
    if (!(qtys[i] > 0)) return { error: "Quantities must be greater than zero." };
    if (!(rates[i] >= 0)) return { error: "Rates cannot be negative." };
    items.push({
      description: descs[i],
      quantity: qtys[i],
      rate_cents: Math.round(rates[i] * 100),
    });
  }
  if (items.length === 0)
    return { error: "Add at least one line item to the invoice." };
  return items;
}

function parseInvoiceFields(formData: FormData) {
  const clientId = Number(formData.get("client_id"));
  const issueDate = String(formData.get("issue_date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!clientId) return { error: "Choose a client." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate))
    return { error: "Issue date is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    return { error: "Due date is required." };
  if (dueDate < issueDate)
    return { error: "Due date cannot be before the issue date." };
  return { clientId, issueDate, dueDate, notes };
}

export async function createInvoice(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const fields = parseInvoiceFields(formData);
  if ("error" in fields) return fields;
  const items = parseItems(formData);
  if (!Array.isArray(items)) return items;

  const db = getDb();
  const number = nextInvoiceNumber();
  const insert = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO invoices (number, client_id, issue_date, due_date, status, notes)
         VALUES (?, ?, ?, ?, 'draft', ?)`
      )
      .run(number, fields.clientId, fields.issueDate, fields.dueDate, fields.notes);
    const invoiceId = Number(info.lastInsertRowid);
    const addItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, description, quantity, rate_cents)
       VALUES (?, ?, ?, ?)`
    );
    for (const it of items)
      addItem.run(invoiceId, it.description, it.quantity, it.rate_cents);
    return invoiceId;
  });
  const id = insert();
  refreshAll();
  redirect(`/invoices/${id}`);
}

export async function updateInvoice(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const fields = parseInvoiceFields(formData);
  if ("error" in fields) return fields;
  const items = parseItems(formData);
  if (!Array.isArray(items)) return items;

  const db = getDb();
  const run = db.transaction(() => {
    db.prepare(
      `UPDATE invoices SET client_id = ?, issue_date = ?, due_date = ?, notes = ?
       WHERE id = ?`
    ).run(fields.clientId, fields.issueDate, fields.dueDate, fields.notes, id);
    db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
    const addItem = db.prepare(
      `INSERT INTO invoice_items (invoice_id, description, quantity, rate_cents)
       VALUES (?, ?, ?, ?)`
    );
    for (const it of items)
      addItem.run(id, it.description, it.quantity, it.rate_cents);
  });
  run();
  refreshAll();
  redirect(`/invoices/${id}`);
}

export async function setInvoiceStatus(
  id: number,
  status: "draft" | "sent" | "paid"
): Promise<void> {
  getDb()
    .prepare("UPDATE invoices SET status = ? WHERE id = ?")
    .run(status, id);
  refreshAll();
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: number): Promise<void> {
  getDb().prepare("DELETE FROM invoices WHERE id = ?").run(id);
  refreshAll();
  redirect("/invoices");
}
