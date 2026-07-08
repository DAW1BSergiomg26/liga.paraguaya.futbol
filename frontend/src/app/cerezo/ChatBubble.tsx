interface ChatBubbleProps {
  role: "user" | "assistant";
  message: string;
}

export default function ChatBubble({ role, message }: ChatBubbleProps) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "assistant" && (
        <div className="w-8 h-8 rounded-full bg-[#76e4f7]/20 flex items-center justify-center text-[#76e4f7] text-xs font-bold shrink-0 mr-2 mt-1">
          C
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          role === "user"
            ? "bg-[#76e4f7] text-black rounded-br-md"
            : "bg-[#0a1628] border border-white/10 text-[#f8fafc] rounded-bl-md"
        }`}
      >
        {message}
      </div>
      {role === "user" && (
        <div className="w-8 h-8 rounded-full bg-[#76e4f7] flex items-center justify-center text-black text-xs font-bold shrink-0 ml-2 mt-1">
          U
        </div>
      )}
    </div>
  );
}
