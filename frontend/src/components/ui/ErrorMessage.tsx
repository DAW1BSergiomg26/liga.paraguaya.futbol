"use client";

export default function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-12 px-6 rounded-xl border border-derrota/20 bg-derrota/5">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-derrota/10 mb-4">
        <svg className="w-6 h-6 text-derrota" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-derrota font-semibold text-lg mb-1">Algo salió mal</p>
      <p className="text-texto-secundary text-sm mb-4 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-bg-terciario border border-borde-sutil text-texto-principal text-sm font-medium hover:bg-bg-secundario hover:border-apf-rojo/30 transition"
        >
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}
