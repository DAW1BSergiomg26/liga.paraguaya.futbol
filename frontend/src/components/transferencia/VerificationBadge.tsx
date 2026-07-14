"use client";

const COLORS: Record<number, string> = {
  1: "bg-red-500/20 text-red-400",
  2: "bg-orange-500/20 text-orange-400",
  3: "bg-yellow-500/20 text-yellow-400",
  4: "bg-lime-500/20 text-lime-400",
  5: "bg-green-500/20 text-green-400",
};

export default function VerificationBadge({ level }: { level: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[level] || COLORS[3]}`}>
      <span className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? "bg-current" : "bg-current/20"}`} />
        ))}
      </span>
      {level}/5
    </span>
  );
}
