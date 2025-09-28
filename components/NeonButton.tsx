"use client";
export default function NeonButton({
  children, className = "", onClick, type = "button",
}: { children: React.ReactNode; className?: string; onClick?: () => void; type?: "button"|"submit"|"reset" }) {
  return <button type={type} onClick={onClick} className={`vf-btn vf-btn--primary ${className}`}>{children}</button>;
}
