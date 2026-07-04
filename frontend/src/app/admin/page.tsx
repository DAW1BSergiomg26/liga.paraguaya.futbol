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
      <div className="p-8 rounded-2xl border border-white/10 bg-[#0a1628]/80">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#1a2a3a] border border-white/10 text-white focus:outline-none focus:border-[#76e4f7]"
              placeholder="Ingresá tu API Key"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-[#76e4f7] text-black font-semibold hover:bg-[#5ac8df] transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
