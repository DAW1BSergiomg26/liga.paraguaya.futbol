"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedToken, setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem("admin_api_key"));
    setTokenState(getSavedToken());
  }, []);

  function handleLogout() {
    setAuthToken(null);
    setTokenState(null);
    setMenuOpen(false);
    router.push("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const navLinks = (
    <>
      <Link href="/clubes" onClick={closeMenu} className="hover:text-white transition">Clubes</Link>
      <Link href="/partidos" onClick={closeMenu} className="hover:text-white transition">Partidos</Link>
      <Link href="/tabla" onClick={closeMenu} className="hover:text-white transition">Tabla</Link>
      <Link href="/predicciones" onClick={closeMenu} className="hover:text-white transition">Predicciones</Link>
      {isAdmin && (
        <Link href="/admin/partidos" onClick={closeMenu} className="text-[#76e4f7] hover:text-white transition">Admin</Link>
      )}
      {token ? (
        <button onClick={handleLogout} className="text-gray-400 hover:text-white transition text-xs">
          Salir
        </button>
      ) : (
        <Link href="/login" onClick={closeMenu} className="px-3 py-1.5 rounded-lg bg-[#76e4f7] text-black font-semibold text-xs hover:brightness-110 transition">
          Ingresar
        </Link>
      )}
    </>
  );

  return (
    <nav className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          ⚽ Liga PY
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          {navLinks}
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white transition"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-300 bg-[#0a1628]/95 backdrop-blur-sm">
          {navLinks}
        </div>
      )}
    </nav>
  );
}
