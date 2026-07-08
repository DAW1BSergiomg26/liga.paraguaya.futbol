import { StatsSkeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12 p-8 rounded-2xl border border-white/10 bg-[#0a1628]/80 shadow-xl">
        <div className="h-4 bg-white/10 rounded animate-pulse w-48 mb-3" />
        <div className="h-10 bg-white/10 rounded animate-pulse w-96 mb-4" />
        <div className="h-5 bg-white/5 rounded animate-pulse w-64" />
      </div>

      <StatsSkeleton />
    </div>
  );
}