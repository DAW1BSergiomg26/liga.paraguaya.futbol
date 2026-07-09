import { ligas } from "@/data/ligas";

function LinkLiga({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-texto-secundario hover:text-py-rojo transition-colors duration-150"
    >
      {children}
    </a>
  );
}

export default function NavegadorLigas() {
  return (
    <div className="bg-bg-secundario rounded-xl border border-borde-sutil p-4">
      <h3 className="font-barlow text-lg font-semibold uppercase tracking-wide text-texto-principal mb-3">
        Otras Ligas
      </h3>
      <div className="space-y-3">
        {ligas.map((liga) => (
          <div key={liga.id}>
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">{liga.icono}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-texto-principal truncate">
                  {liga.nombre}
                </p>
                <div className="flex gap-2 mt-0.5">
                  <LinkLiga href={liga.urlResultados}>Resultados</LinkLiga>
                  <span className="text-borde-sutil">·</span>
                  <LinkLiga href={liga.urlPosiciones}>Posiciones</LinkLiga>
                  <span className="text-borde-sutil">·</span>
                  <LinkLiga href={liga.urlCalendario}>Calendario</LinkLiga>
                </div>
              </div>
            </div>
            {liga.id !== ligas[ligas.length - 1].id && (
              <hr className="mt-3 border-borde-sutil" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
