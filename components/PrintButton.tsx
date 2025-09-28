"use client";

export default function PrintButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
      title="Print this page"
    >
      Print
    </button>
  );
}
