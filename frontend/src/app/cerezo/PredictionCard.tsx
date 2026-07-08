interface PredictionCardProps {
  localWinPct: number;
  drawPct: number;
  visitorWinPct: number;
  confidence: string;
  totalPartidos?: number;
}

export default function PredictionCard({ localWinPct, drawPct, visitorWinPct, confidence, totalPartidos }: PredictionCardProps) {
  const confidenceColors: Record<string, string> = {
    alta: "text-green-400",
    media: "text-yellow-400",
    baja: "text-gray-400",
  };

  return (
    <div className="max-w-[80%] rounded-2xl p-4 bg-[#0a1628] border border-white/10 text-sm space-y-3">
      <p className="text-[#76e4f7] font-semibold text-xs uppercase tracking-wider">Predicción</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden flex">
          <div className="h-full bg-green-500" style={{ width: `${localWinPct}%` }} />
          <div className="h-full bg-yellow-500" style={{ width: `${drawPct}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${visitorWinPct}%` }} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>Local {localWinPct}%</span>
        <span>Empate {drawPct}%</span>
        <span>Visitante {visitorWinPct}%</span>
      </div>
      <div className={`text-xs ${confidenceColors[confidence] || "text-gray-400"}`}>
        Confianza: {confidence}
        {totalPartidos !== undefined && ` · ${totalPartidos} partidos`}
      </div>
    </div>
  );
}
