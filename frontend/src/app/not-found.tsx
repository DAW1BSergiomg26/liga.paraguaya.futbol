import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h2 className="text-6xl font-bold text-gray-600 mb-4">404</h2>
      <p className="text-xl text-gray-400 mb-6">Página no encontrada</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-block">
        Volver al inicio
      </Link>
    </div>
  );
}
