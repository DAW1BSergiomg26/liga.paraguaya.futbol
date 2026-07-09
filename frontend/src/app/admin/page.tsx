"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [key, setKey] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (key.trim()) {
      localStorage.setItem("admin_api_key", key.trim());
      router.push("/admin/partidos");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="p-8 rounded-2xl border border-borde-sutil bg-bg-secundario/80">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-texto-secundario block mb-1">API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-white focus:outline-none focus:border-py-rojo"
              placeholder="Ingresá tu API Key"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-py-rojo text-black font-semibold hover:bg-py-rojo-oscuro transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
