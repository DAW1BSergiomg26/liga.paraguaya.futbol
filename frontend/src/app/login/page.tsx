"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginWithProvider, setAuthToken } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError("Completá todos los campos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const user = await loginWithProvider({ email: email.trim(), name: name.trim() });
      setAuthToken(user.token);
      router.push("/predicciones");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-2">Iniciar sesión</h1>
      <p className="text-texto-secundario mb-8">Ingresá tu email y nombre para empezar</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-texto-secundario mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-white placeholder-gray-500 focus:outline-none focus:border-apf-rojo"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm text-texto-secundario mb-1">Nombre</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-white placeholder-gray-500 focus:outline-none focus:border-apf-rojo"
            placeholder="Tu nombre"
            autoComplete="name"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 text-red-300 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-apf-rojo text-black font-semibold hover:brightness-110 transition disabled:opacity-50"
        >
          {saving ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-texto-apagado">
        <Link href="/" className="text-apf-rojo hover:underline">← Volver al inicio</Link>
      </p>
    </div>
  );
}
