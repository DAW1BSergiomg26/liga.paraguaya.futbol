"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-24">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal</h2>
      <p className="text-gray-400 mb-6">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
        Intentar de nuevo
      </button>
    </div>
  );
}
