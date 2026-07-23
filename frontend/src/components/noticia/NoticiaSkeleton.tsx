export function NoticiaSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-xl border border-borde-sutil bg-bg-secundario/60 overflow-hidden ${
            i === 0 ? "md:col-span-2 md:row-span-2" : ""
          }`}
        >
          <div className={`bg-white/[0.03] animate-pulse ${i === 0 ? "h-72" : "h-48"}`} />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
              <div className="h-4 w-12 bg-white/[0.04] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-white/[0.06] rounded animate-pulse w-full" />
              <div className="h-4 bg-white/[0.06] rounded animate-pulse w-3/4" />
            </div>
            {i === 0 && (
              <div className="space-y-2 pt-1">
                <div className="h-3 bg-white/[0.04] rounded animate-pulse w-full" />
                <div className="h-3 bg-white/[0.04] rounded animate-pulse w-5/6" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoticiaDetalleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[70vh] w-full bg-white/[0.03]" />
      <div className="max-w-3xl mx-auto px-4 -mt-32 relative z-10 space-y-8 pb-16">
        <div className="space-y-4">
          <div className="h-5 w-24 bg-white/[0.06] rounded-full" />
          <div className="h-12 bg-white/[0.06] rounded w-3/4" />
          <div className="h-12 bg-white/[0.06] rounded w-1/2" />
          <div className="flex gap-4 pt-2">
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
            <div className="h-4 w-32 bg-white/[0.04] rounded" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-white/[0.04] rounded" style={{ width: `${90 + (i % 3) * 3}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NoticiaRelacionadasSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-borde-sutil bg-bg-secundario/60 overflow-hidden animate-pulse">
          <div className="h-32 bg-white/[0.03]" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/[0.06] rounded w-16" />
            <div className="h-4 bg-white/[0.06] rounded w-full" />
            <div className="h-3 bg-white/[0.04] rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
