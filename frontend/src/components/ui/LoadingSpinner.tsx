export default function LoadingSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-py-rojo border-t-transparent" />
      <span className="ml-3 text-texto-secundario">{text}</span>
    </div>
  );
}
