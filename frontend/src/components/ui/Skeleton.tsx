export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borde-sutil bg-bg-secundario/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-borde-sutil">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4">
                <div className="h-3 bg-white/10 rounded animate-pulse w-12 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-borde-sutil">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-4">
                  <div className="h-4 bg-texto-principal/5 rounded animate-pulse w-full" style={{ maxWidth: c === 1 ? "120px" : "40px" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
            <div className="h-5 bg-white/10 rounded animate-pulse w-32" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded animate-pulse w-24" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-20" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-28" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl bg-bg-secundario/60 border border-borde-sutil text-center">
          <div className="h-8 bg-white/10 rounded animate-pulse w-16 mx-auto mb-2" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function NoticiaSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-borde-sutil bg-bg-secundario/60 overflow-hidden">
          <div className="h-44 bg-white/5 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
            <div className="h-5 bg-white/10 rounded animate-pulse w-full" />
            <div className="h-5 bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GoleadorSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-borde-sutil bg-bg-secundario/60">
          <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-20" />
          </div>
          <div className="h-6 w-8 bg-white/10 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function HistorialSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((group) => (
        <div key={group}>
          <div className="h-6 bg-white/10 rounded animate-pulse w-24 mb-4" />
          <div className="overflow-x-auto rounded-xl border border-borde-sutil bg-bg-secundario/60">
            <div className="flex gap-4 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shrink-0 space-y-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse mx-auto" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrediccionSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl border border-borde-sutil bg-bg-secundario/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-20" />
            <div className="text-texto-apagado mx-1">vs</div>
            <div className="h-4 bg-white/10 rounded animate-pulse w-20" />
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          </div>
          <div className="h-8 bg-white/5 rounded animate-pulse w-16 mx-auto mb-2" />
          <div className="h-3 bg-white/5 rounded animate-pulse w-28 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export function SimuladorSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="h-5 bg-white/10 rounded animate-pulse w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-borde-sutil bg-bg-secundario/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse flex-1" />
            </div>
            <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
          </div>
        ))}
      </div>
      <div className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 space-y-4">
        <div className="h-6 bg-white/10 rounded animate-pulse w-32" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/5 text-center space-y-2">
              <div className="h-8 bg-white/10 rounded animate-pulse w-12 mx-auto" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-borde-sutil bg-bg-secundario/60">
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-white/10 rounded animate-pulse w-28" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-16" />
          </div>
          <div className="text-right space-y-1.5">
            <div className="h-5 bg-white/10 rounded animate-pulse w-10 ml-auto" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-14 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}