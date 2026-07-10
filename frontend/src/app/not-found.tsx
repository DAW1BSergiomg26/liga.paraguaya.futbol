import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h2 className="text-6xl font-bold text-texto-apagado mb-4">404</h2>
      <p className="text-xl text-texto-secundario mb-6">Página no encontrada</p>
      <Link href="/" className="px-6 py-2 bg-apf-rojo rounded-lg hover:bg-apf-rojo-oscuro transition inline-block text-white">
        Volver al inicio
      </Link>
    </div>
  );
}
