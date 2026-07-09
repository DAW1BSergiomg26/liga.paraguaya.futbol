"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-24">
      <h2 className="text-2xl font-bold text-derrota mb-4">Algo salió mal</h2>
      <p className="text-texto-secundario mb-6">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-py-rojo rounded-lg hover:bg-py-rojo-oscuro transition text-white">
        Intentar de nuevo
      </button>
    </div>
  );
}
