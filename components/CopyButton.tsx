"use client";
export default function CopyButton({ text, label="Copy", className="" }:
  { text: string; label?: string; className?: string }) {
  const onClick = async () => { try { await navigator.clipboard.writeText(text); } catch {} };
  return <button type="button" className={className} onClick={onClick}>{label}</button>;
}
