import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          ⚽ Liga PY
        </Link>
        <div className="flex gap-6 text-sm font-medium text-gray-300">
          <Link href="/clubes" className="hover:text-white transition">Clubes</Link>
          <Link href="/partidos" className="hover:text-white transition">Partidos</Link>
          <Link href="/tabla" className="hover:text-white transition">Tabla</Link>
        </div>
      </div>
    </nav>
  );
}
