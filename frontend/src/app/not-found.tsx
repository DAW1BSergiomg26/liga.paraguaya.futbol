"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 space-y-6">
        <div className="text-6xl">🏟️</div>
        <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-barlow-condensed)]">
          Cancha no encontrada
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          Esta página no existe en nuestra liga. ¿Quizás te equivocaste de
          cancha?
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#CC001C] hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1a]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
