import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PuzzlePiece {
  id: number;
  label: string;
  data: string;
  matched: boolean;
  matchScore: number;
}

const SLOTS = [
  { label: "Edge Detection" },
  { label: "Color Pattern" },
  { label: "Shape Match" },
  { label: "Texture" },
  { label: "Symmetry" },
  { label: "Frequency" },
];

const DATA_LABELS = ["pixel cluster", "gradient map", "contour line", "hue histogram", "edge vector", "noise sample"];

export default function JigsawVisualization() {
  const [pieces, setPieces] = useState<PuzzlePiece[]>(
    SLOTS.map((_, i) => ({ id: i, label: SLOTS[i].label, data: DATA_LABELS[i], matched: false, matchScore: 0 }))
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "testing" | "snapping" | "done">("idle");
  const [autoPlay, setAutoPlay] = useState(false);

  const resetPieces = () => {
    setPieces(SLOTS.map((_, i) => ({ id: i, label: SLOTS[i].label, data: DATA_LABELS[i], matched: false, matchScore: 0 })));
    setActiveIndex(-1);
    setPhase("idle");
  };

  useEffect(() => {
    if (!autoPlay) return;
    if (phase === "done") { setAutoPlay(false); return; }

    const next = pieces.findIndex(p => !p.matched);
    if (next === -1) { setPhase("done"); return; }

    const timer1 = setTimeout(() => { setActiveIndex(next); setPhase("testing"); }, 300);
    const timer2 = setTimeout(() => {
      setPieces(prev => prev.map((p, i) => i === next ? { ...p, matchScore: 0.6 + Math.random() * 0.4 } : p));
    }, 800);
    const timer3 = setTimeout(() => {
      setPhase("snapping");
      setPieces(prev => prev.map((p, i) => i === next ? { ...p, matched: true } : p));
    }, 1400);
    const timer4 = setTimeout(() => { setActiveIndex(-1); setPhase("idle"); }, 1900);

    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
  }, [autoPlay, phase, pieces]);

  const allMatched = pieces.every(p => p.matched);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gradient">🧩 Pattern Recognition</h2>
        <div className="flex gap-2">
          <button onClick={() => { resetPieces(); setAutoPlay(true); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity">
            {allMatched ? "Replay" : "▶ Solve"}
          </button>
          <button onClick={resetPieces} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs">
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-rows-[auto_1fr] gap-3 min-h-0">
        {/* Slots grid */}
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map((slot, i) => {
            const piece = pieces[i];
            const isActive = i === activeIndex;
            return (
              <motion.div
                key={i}
                className={`relative rounded-lg border-2 border-dashed p-3 text-center transition-colors ${
                  piece.matched
                    ? "border-primary/60 bg-primary/10 glow-primary"
                    : isActive
                    ? "border-accent/60 bg-accent/5"
                    : "border-border bg-secondary/30"
                }`}
                animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <p className="text-xs font-semibold text-foreground">{slot.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">slot</p>
                {piece.matched && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg"
                  >
                    <div className="text-center">
                      <p className="text-[10px] font-mono text-primary">{piece.data}</p>
                      <p className="text-[10px] text-success font-bold">✓ snapped</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Unmatched pieces tray */}
        <div className="bg-card rounded-lg border border-border p-3">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Incoming Data Pieces</p>
          <div className="flex flex-wrap gap-2">
            {pieces.filter(p => !p.matched).map((piece) => {
              const isActive = piece.id === activeIndex;
              return (
                <motion.div
                  key={piece.id}
                  layout
                  className={`px-3 py-2 rounded-lg border text-center ${
                    isActive
                      ? "border-accent bg-accent/10 glow-accent"
                      : "border-border bg-secondary"
                  }`}
                  animate={isActive ? { y: [-2, 2, -2] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <p className="text-[10px] font-mono text-primary font-semibold">{piece.data}</p>
                  {piece.matchScore > 0 && !piece.matched && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-mono text-accent">
                      {(piece.matchScore * 100).toFixed(0)}% match
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
            {pieces.every(p => p.matched) && (
              <p className="text-xs text-success font-semibold">All patterns recognized! ✨</p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { icon: "🧩", text: "Pieces = incoming data" },
          { icon: "🔲", text: "Slots = learned patterns" },
          { icon: "📊", text: "Score = pattern fit" },
          { icon: "✅", text: "Snap = decision" },
        ].map(item => (
          <div key={item.text} className="flex gap-2 items-center text-[10px] text-muted-foreground">
            <span>{item.icon}</span><span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
