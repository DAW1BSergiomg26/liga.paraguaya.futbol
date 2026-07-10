export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="w-8 h-8 rounded-full bg-apf-rojo/20 flex items-center justify-center text-apf-rojo text-xs font-bold shrink-0 mr-2 mt-1">
        C
      </div>
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-bg-secundario border border-borde-sutil rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
