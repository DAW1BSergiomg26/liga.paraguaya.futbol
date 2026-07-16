"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, setAuthToken } from "@/lib/api";
import type { AuthUser } from "@/types";
import PageHeader from "@/components/ui/PageHeader";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent("auth-changed"));
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-texto-secundario">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <PageHeader titulo="Mi Perfil" subtitulo="Información de tu cuenta" />
      <div className="max-w-xl mx-auto px-4 pb-12">
        <div className="bg-bg-secundario/80 border border-borde-sutil rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-terciario border border-borde-marca flex items-center justify-center text-2xl font-bold text-apf-rojo">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-texto-principal">{user.name}</h2>
              <p className="text-texto-secundario text-sm">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-borde-sutil">
              <span className="text-texto-secundario">Email</span>
              <span className="text-texto-principal">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-borde-sutil">
              <span className="text-texto-secundario">Puntos</span>
              <span className="text-dorado-medalla font-bold">{user.puntos}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg border border-derrota/40 text-derrota hover:bg-derrota/10 transition text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
