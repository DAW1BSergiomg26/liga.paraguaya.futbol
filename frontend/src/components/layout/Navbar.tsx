"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getSavedToken, setAuthToken } from "@/lib/api";

/* ─── Logo animado ─── */
function AnimatedSoccerBall() {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute w-full h-full animate-logo-orbit">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full animate-logo-spin origin-center drop-shadow-lg"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
            <path d="M50 2 L50 98 M2 50 L98 50" stroke="#000000" strokeWidth="2" fill="none"/>
            <path d="M50 50 L30 80 L50 98 L70 80 Z" fill="#000000"/>
            <path d="M50 50 L30 20 L50 2 L70 20 Z" fill="#000000"/>
            <path d="M50 50 L80 70 L98 50 L80 30 Z" fill="#000000"/>
            <path d="M50 50 L20 70 L2 50 L20 30 Z" fill="#000000"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function AnimatedBrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-4 group no-underline">
      <div className="relative flex items-center justify-center h-16 w-32">
        <AnimatedSoccerBall />
        <span className="absolute text-3xl font-extrabold text-white z-10 group-hover:text-yellow-400 transition-colors duration-300">
          <span className="text-blue-500">Liga</span> PY
        </span>
      </div>
    </Link>
  );
}

const AUTH_EVENT = "auth-changed";

function authSubscribe(onChange: () => void): () => void {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getToken(): string | null {
  try { return getSavedToken() ?? null; } catch { return null; }
}

function getIsAdmin(): boolean {
  try { return !!localStorage.getItem("admin_api_key"); } catch { return false; }
}

function NavLink({ href, children, active, onClick }: { href: string; children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap transition-colors duration-200 ${
        active ? "text-apf-rojo" : "text-texto-secundario hover:text-white"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-px bg-apf-rojo" />
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const token = useSyncExternalStore(authSubscribe, getToken, () => null);
  const isAdmin = useSyncExternalStore(authSubscribe, getIsAdmin, () => false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
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
    { href: "/goleadores", label: "Goleadores" },
    { href: "/predicciones", label: "Predicciones" },
    { href: "/h2h", label: "H2H" },
    { href: "/tactico", label: "Tactico" },
    { href: "/cerezo", label: "Cerezo" },
    { href: "/red3d", label: "Red 3D" },
    { href: "/noticias", label: "Noticias" },
    { href: "/transferencias", label: "Transferencias" },
    { href: "/historial", label: "Historial" },
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
      {token && (
        <NavLink href="/perfil" active={isActive("/perfil")} onClick={closeMenu}>
          Perfil
        </NavLink>
      )}
      {token ? (
        <button onClick={handleLogout} aria-label="Cerrar sesión" className="text-texto-apagado hover:text-texto-secundario transition text-xs">
          Salir
        </button>
      ) : (
        <Link
          href="/login"
          onClick={closeMenu}
          className="px-3 py-1.5 rounded-lg bg-apf-rojo text-white font-semibold text-xs hover:bg-apf-rojo-oscuro transition"
        >
          Ingresar
        </Link>
      )}
    </>
  );

  return (
    <nav className="navbar-blur sticky top-0 z-50" style={{ borderBottom: "2px solid", borderImage: "linear-gradient(90deg, #CC001C, #FFFFFF, #00619E) 1" }}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <AnimatedBrandLogo />

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-texto-secundario hover:text-white transition"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
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
        <div id="mobile-menu" role="menu" aria-label="Menú de navegación" className="md:hidden border-t border-borde-sutil px-4 py-4 flex flex-col gap-4 text-sm font-medium navbar-blur">
          {navLinks}
        </div>
      )}
    </nav>
  );
}
