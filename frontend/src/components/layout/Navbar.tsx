"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSavedToken, setAuthToken } from "@/lib/api";

function NavLink({ href, children, active, onClick }: { href: string; children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative transition-colors duration-200 ${
        active ? "text-py-rojo" : "text-texto-secundario hover:text-white"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-px bg-py-rojo" />
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
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
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const links = [
    { href: "/clubes", label: "Clubes" },
    { href: "/partidos", label: "Partidos" },
    { href: "/tabla", label: "Tabla" },
    { href: "/predicciones", label: "Predicciones" },
    { href: "/cerezo", label: "Cerezo" },
  ];

  const navLinks = (
    <>
      {links.map((link) => (
        <NavLink key={link.href} href={link.href} active={isActive(link.href)} onClick={closeMenu}>
          {link.label}
        </NavLink>
      ))}
      {isAdmin && (
        <NavLink href="/admin/partidos" active={pathname.startsWith("/admin")} onClick={closeMenu}>
          Admin
        </NavLink>
      )}
      {token ? (
        <button onClick={handleLogout} className="text-texto-apagado hover:text-texto-secundario transition text-xs">
          Salir
        </button>
      ) : (
        <Link
          href="/login"
          onClick={closeMenu}
          className="px-3 py-1.5 rounded-lg bg-py-rojo text-white font-semibold text-xs hover:bg-py-rojo-oscuro transition"
        >
          Ingresar
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-bg-secundario" style={{ borderBottom: "2px solid", borderImage: "linear-gradient(90deg, #D52B1E, #FFFFFF, #0038A8) 1" }}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight relative">
          ⚽ Liga PY
          <span className="absolute -bottom-2 left-0 right-0 h-0.5 rounded" style={{ background: "linear-gradient(90deg, #D52B1E, #FFFFFF, #0038A8)" }} />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-texto-secundario hover:text-white transition"
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

      {/* Mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-borde-sutil px-4 py-4 flex flex-col gap-4 text-sm font-medium bg-bg-secundario">
          {navLinks}
        </div>
      )}
    </nav>
  );
}
