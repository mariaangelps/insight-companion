import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PuzzlePiece {
  id: number;
  label: string;
  data: string;
  matched: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  matchScore: number;
}

const SLOTS = [
  { label: "Edge Detection", x: 120, y: 100 },
  { label: "Color Pattern", x: 320, y: 100 },
  { label: "Shape Match", x: 520, y: 100 },
  { label: "Texture", x: 120, y: 280 },
  { label: "Symmetry", x: 320, y: 280 },
  { label: "Frequency", x: 520, y: 280 },
];

const DATA_LABELS = ["pixel cluster", "gradient map", "contour line", "hue histogram", "edge vector", "noise sample"];

const initialPieces: PuzzlePiece[] = SLOTS.map((slot, i) => ({
  id: i,
  label: slot.label,
  data: DATA_LABELS[i],
  matched: false,
  x: 50 + Math.random() * 600,
  y: 420 + Math.random() * 80,
  targetX: slot.x,
  targetY: slot.y,
  rotation: -20 + Math.random() * 40,
  matchScore: 0,
}));

export default function JigsawVisualization() {
  const [pieces, setPieces] = useState<PuzzlePiece[]>(initialPieces);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [phase, setPhase] = useState<"idle" | "testing" | "snapping" | "done">("idle");
  const [autoPlay, setAutoPlay] = useState(false);

  const resetPieces = () => {
    setPieces(initialPieces.map(p => ({ ...p, matched: false, matchScore: 0, x: 50 + Math.random() * 600, y: 420 + Math.random() * 80, rotation: -20 + Math.random() * 40 })));
    setActiveIndex(-1);
    setPhase("idle");
  };

  useEffect(() => {
    if (!autoPlay) return;
    if (phase === "done") { setAutoPlay(false); return; }

    const next = pieces.findIndex(p => !p.matched);
    if (next === -1) { setPhase("done"); return; }

    const timer1 = setTimeout(() => {
      setActiveIndex(next);
      setPhase("testing");
    }, 400);

    const timer2 = setTimeout(() => {
      setPieces(prev => prev.map((p, i) => i === next ? { ...p, matchScore: 0.6 + Math.random() * 0.4 } : p));
    }, 1000);

    const timer3 = setTimeout(() => {
      setPhase("snapping");
      setPieces(prev => prev.map((p, i) => i === next ? { ...p, matched: true, x: p.targetX, y: p.targetY, rotation: 0 } : p));
    }, 1800);

    const timer4 = setTimeout(() => {
      setActiveIndex(-1);
      setPhase("idle");
    }, 2400);

    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
  }, [autoPlay, phase, pieces]);

  const allMatched = pieces.every(p => p.matched);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Pattern Recognition → Jigsaw Puzzle</h2>
          <p className="text-muted-foreground mt-1">Watch data pieces find their matching pattern slots</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { resetPieces(); setAutoPlay(true); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            {allMatched ? "Replay" : "▶ Auto-Solve"}
          </button>
          <button onClick={resetPieces} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:opacity-80 transition-opacity">
            Reset
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-card rounded-xl border border-border overflow-hidden" style={{ height: 540 }}>
        <svg width="100%" height="100%" viewBox="0 0 700 540">
          {/* Slot outlines */}
          {SLOTS.map((slot, i) => {
            const piece = pieces[i];
            return (
              <g key={`slot-${i}`}>
                <rect
                  x={slot.x - 55} y={slot.y - 35} width={110} height={70} rx={10}
                  fill={piece.matched ? "hsl(192 90% 55% / 0.08)" : "hsl(220 14% 16%)"}
                  stroke={piece.matched ? "hsl(192 90% 55% / 0.5)" : "hsl(220 14% 25%)"}
                  strokeWidth={2}
                  strokeDasharray={piece.matched ? "0" : "6 4"}
                />
                <text x={slot.x} y={slot.y - 8} textAnchor="middle" fill="hsl(215 12% 55%)" fontSize={11} fontFamily="Space Grotesk">{slot.label}</text>
                <text x={slot.x} y={slot.y + 12} textAnchor="middle" fill="hsl(215 12% 40%)" fontSize={9} fontFamily="JetBrains Mono">slot</text>
              </g>
            );
          })}

          {/* Connection lines when testing */}
          {activeIndex >= 0 && !pieces[activeIndex].matched && (
            <motion.line
              x1={pieces[activeIndex].x} y1={pieces[activeIndex].y}
              x2={pieces[activeIndex].targetX} y2={pieces[activeIndex].targetY}
              stroke="hsl(192 90% 55% / 0.4)" strokeWidth={1.5} strokeDasharray="4 4"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
            />
          )}
        </svg>

        {/* Animated pieces as divs for better framer-motion support */}
        {pieces.map((piece, i) => (
          <motion.div
            key={piece.id}
            className={`absolute flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer select-none ${
              piece.matched
                ? "border-primary/60 bg-primary/10 glow-primary"
                : i === activeIndex
                ? "border-accent/80 bg-accent/10 glow-accent"
                : "border-border bg-secondary hover:border-primary/40"
            }`}
            style={{ width: 100, height: 60 }}
            animate={{
              x: piece.matched ? piece.targetX - 55 : i === activeIndex && phase === "testing" ? piece.targetX - 55 : piece.x - 50,
              y: piece.matched ? piece.targetY - 35 : i === activeIndex && phase === "testing" ? piece.targetY + 20 : piece.y - 30,
              rotate: piece.matched ? 0 : piece.rotation,
              scale: i === activeIndex ? 1.08 : 1,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <span className="text-[10px] font-mono text-primary font-semibold">{piece.data}</span>
            {piece.matchScore > 0 && !piece.matched && (
              <motion.span
                className="text-[10px] font-mono text-accent mt-0.5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                {(piece.matchScore * 100).toFixed(0)}% match
              </motion.span>
            )}
            {piece.matched && (
              <motion.span
                className="text-[10px] text-success font-semibold"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
              >
                ✓ snapped
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: "🧩", title: "Puzzle pieces", desc: "Incoming data fragments" },
          { icon: "🔲", title: "Puzzle slots", desc: "Learned pattern templates" },
          { icon: "📊", title: "Match score", desc: "How well the pattern fits" },
          { icon: "🔄", title: "Trying a slot", desc: "Testing a hypothesis" },
          { icon: "✅", title: "Snap into place", desc: "Decision confirmed" },
          { icon: "🌊", title: "New pieces", desc: "Generalization to new data" },
        ].map(item => (
          <div key={item.title} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/50">
            <span className="text-lg">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
