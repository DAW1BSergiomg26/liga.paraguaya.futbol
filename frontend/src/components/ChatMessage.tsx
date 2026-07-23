import Image from "next/image";

interface ChatMessageProps {
  username: string;
  nombre: string;
  imagen: string;
  contenido: string;
  created_at: string;
}

export default function ChatMessage({ username, nombre, imagen, contenido, created_at }: ChatMessageProps) {
  return (
    <div className="flex gap-2 py-2 px-3 hover:bg-bg-terciario/30 rounded-lg transition-colors">
      <Image
        src={imagen || `https://ui-avatars.com/api/?name=${nombre}&background=1f2937&color=fff`}
        alt={nombre}
        width={32}
        height={32}
        loading="lazy"
        className="w-8 h-8 rounded-full mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-apf-rojo truncate">
            {nombre}
          </span>
          <span className="text-xs text-texto-apagado shrink-0">
            {new Date(created_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-sm text-texto-secundario break-words">{contenido}</p>
      </div>
    </div>
  );
}
