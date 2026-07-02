export default function LoadingSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#76e4f7] border-t-transparent" />
      <span className="ml-3 text-gray-400">{text}</span>
    </div>
  );
}
