"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser, registerUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser(email, name, password);
      } else {
        await loginUser(email, password);
      }
      window.dispatchEvent(new CustomEvent("auth-changed"));
      router.push("/predicciones");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al autenticar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-secundario/80 border border-borde-sutil rounded-2xl p-8">
        <h1 id="login-title" className="text-2xl font-bold text-texto-principal text-center mb-6 titulo-modulo">
          {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
        </h1>

        {/* Toggle */}
        <div className="flex mb-6 bg-bg-terciario rounded-lg p-1" role="tablist" aria-label="Modo de autenticación">
          <button
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-apf-rojo text-white" : "text-texto-secundario hover:text-white"}`}
          >
            Iniciar Sesión
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "register" ? "bg-apf-rojo text-white" : "text-texto-secundario hover:text-white"}`}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-4 px-4 py-2 rounded-lg bg-derrota/20 border border-derrota/30 text-derrota text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="login-title">
          {mode === "register" && (
            <div>
              <label htmlFor="login-name" className="block text-texto-secundario text-sm mb-1">Nombre</label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal focus:outline-none focus:border-apf-rojo transition"
              />
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-texto-secundario text-sm mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal focus:outline-none focus:border-apf-rojo transition"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-texto-secundario text-sm mb-1">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal focus:outline-none focus:border-apf-rojo transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-apf-rojo text-white font-bold hover:bg-apf-rojo-oscuro transition disabled:opacity-50"
          >
            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear Cuenta"}
          </button>
        </form>

        <p className="text-texto-apagado text-xs text-center mt-6">
          <Link href="/" className="text-apf-rojo hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
