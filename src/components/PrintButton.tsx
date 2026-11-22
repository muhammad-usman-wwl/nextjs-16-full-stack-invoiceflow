"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
    >
      Print / Save as PDF
    </button>
  );
}
