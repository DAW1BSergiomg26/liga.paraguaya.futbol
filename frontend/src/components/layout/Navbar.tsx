"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useId } from "react";
import { usePathname } from "next/navigation";
import { getSavedToken, setAuthToken } from "@/lib/api";

/* ─── Logo animado 3D ─── */
function MagicSoccerLogo() {
  const uid = useId();

  return (
    <Link
      href="/"
      className="relative flex items-center gap-3 group no-underline py-2 px-3 rounded-xl transition-all duration-300 hover:bg-white/5"
    >
      {/* Balón 3D interactivo */}
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* Aura mágica */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-emerald-400 opacity-40 blur-md group-hover:opacity-90 group-hover:scale-125 transition-all duration-500 animate-pulse" />

        <div className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-spin-3d"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id={`${uid}-ball`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#64748B" />
              </radialGradient>
            </defs>

            {/* Esfera base */}
            <circle cx="50" cy="50" r="48" fill={`url(#${uid}-ball)`} stroke="#0F172A" strokeWidth="3"/>

            {/* Pentágono central */}
            <polygon points="50,28 66,38 60,56 40,56 34,38" fill="#0F172A" stroke="#334155" strokeWidth="1"/>

            {/* Costuras */}
            <path d="M50,28 L50,6 M66,38 L88,30 M60,56 L82,76 M40,56 L18,76 M34,38 L12,30" stroke="#0F172A" strokeWidth="3" strokeLinecap="round"/>

            {/* Paneles laterales */}
            <polygon points="50,6 63,14 50,24 37,14" fill="#0F172A" opacity="0.9"/>
            <polygon points="88,30 94,48 80,56 80,36" fill="#0F172A" opacity="0.9"/>
            <polygon points="82,76 64,84 60,56 80,56" fill="#0F172A" opacity="0.9"/>
            <polygon points="18,76 36,84 40,56 20,56" fill="#0F172A" opacity="0.9"/>
            <polygon points="12,30 6,48 20,56 20,36" fill="#0F172A" opacity="0.9"/>

            {/* Brillo especular */}
            <ellipse cx="38" cy="28" rx="12" ry="6" fill="#FFFFFF" opacity="0.6" transform="rotate(-20 38 28)"/>
          </svg>
        </div>
      </div>

      {/* Texto marca */}
      <div className="flex flex-col">
        <span className="text-2xl font-black tracking-wider text-white group-hover:text-yellow-400 transition-colors duration-300 drop-shadow-md">
          <span className="text-blue-500 group-hover:text-emerald-400 transition-colors">Liga</span> PY
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
        <MagicSoccerLogo />

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
