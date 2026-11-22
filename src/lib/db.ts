import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// InvoiceFlow database layer.
// One SQLite file on disk (data/invoiceflow.db) — no hosted database,
// no account, no API key. Money is stored as INTEGER cents so totals
// are always exact.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "invoiceflow.db");

type DB = InstanceType<typeof Database>;

const globalForDb = globalThis as unknown as { __invoiceDb?: DB };

function createDb(): DB {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      contact    TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      number     TEXT NOT NULL UNIQUE,
      client_id  INTEGER NOT NULL REFERENCES clients(id),
      issue_date TEXT NOT NULL,
      due_date   TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'sent', 'paid')),
      notes      TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoice_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity    REAL NOT NULL DEFAULT 1,
      rate_cents  INTEGER NOT NULL DEFAULT 0
    );
  `);
  seed(db);
  return db;
}

function seed(db: DB) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM clients").get() as {
    n: number;
  };
  if (count.n > 0) return;

  const addClient = db.prepare(
    "INSERT INTO clients (name, email, contact) VALUES (?, ?, ?)"
  );
  const clients: Array<[string, string, string]> = [
    ["Bright Bean Coffee Co.", "orders@brightbean.co", "Alex Reed"],
    ["Northpeak Traders", "hello@northpeaktraders.com", "Jamie Cole"],
    ["PixelWorks Studio", "team@pixelworks.design", "Robin Fox"],
    ["GreenLeaf Landscaping", "info@greenleaf.co", "Sam Ortiz"],
    ["Harbor Fitness", "frontdesk@harborfitness.co", "Casey Kim"],
  ];
  clients.forEach((c) => addClient.run(...c));

  const addInvoice = db.prepare(
    `INSERT INTO invoices (number, client_id, issue_date, due_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const addItem = db.prepare(
    `INSERT INTO invoice_items (invoice_id, description, quantity, rate_cents)
     VALUES (?, ?, ?, ?)`
  );

  // [number, clientId, issued, due, status, notes, items:[desc, qty, rateCents]]
  const invoices: Array<
    [string, number, string, string, string, string, Array<[string, number, number]>]
  > = [
    ["INV-1001", 1, "2026-10-03", "2026-10-17", "paid", "Thank you for your business.",
      [["Website menu redesign", 1, 45000], ["Photo editing pack", 10, 1250]]],
    ["INV-1002", 2, "2026-10-10", "2026-10-24", "paid", "",
      [["Inventory spreadsheet cleanup", 6, 4000]]],
    ["INV-1003", 3, "2026-10-21", "2026-11-04", "sent", "Payment due within 14 days.",
      [["Landing page build", 1, 90000], ["Copywriting", 4, 7500]]],
    ["INV-1004", 4, "2026-11-02", "2026-11-16", "sent", "",
      [["Booking form integration", 1, 35000]]],
    ["INV-1005", 5, "2026-11-08", "2026-12-08", "sent", "Payment due within 30 days.",
      [["Class schedule page", 1, 60000], ["Trainer profile cards", 5, 6000]]],
    ["INV-1006", 1, "2026-11-12", "2026-12-12", "draft", "",
      [["Holiday promo banner set", 3, 4500]]],
    ["INV-1007", 2, "2026-11-15", "2026-12-15", "sent", "Monthly retainer — November.",
      [["Monthly support retainer", 1, 50000]]],
    ["INV-1008", 3, "2026-11-18", "2026-12-18", "draft", "",
      [["Logo refresh concepts", 2, 15000]]],
  ];

  const insertAll = db.transaction(() => {
    for (const [number, clientId, issued, due, status, notes, items] of invoices) {
      const info = addInvoice.run(number, clientId, issued, due, status, notes);
      const invoiceId = Number(info.lastInsertRowid);
      for (const [desc, qty, rate] of items) addItem.run(invoiceId, desc, qty, rate);
    }
  });
  insertAll();
}

export function getDb(): DB {
  if (!globalForDb.__invoiceDb) {
    globalForDb.__invoiceDb = createDb();
  }
  return globalForDb.__invoiceDb;
}
