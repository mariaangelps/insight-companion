import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURE_NAMES = ["Edges", "Color", "Shape", "Texture", "Symmetry", "Frequency"];

const CATEGORY_BIASES: Record<string, number[]> = {
  face:      [0.9, 0.6, 0.95, 0.5, 0.92, 0.4],
  animal:    [0.7, 0.8, 0.65, 0.85, 0.5, 0.6],
  landscape: [0.5, 0.9, 0.4, 0.7, 0.6, 0.8],
  fruit:     [0.6, 0.95, 0.85, 0.75, 0.8, 0.3],
  emotion:   [0.85, 0.5, 0.9, 0.45, 0.88, 0.35],
  text:      [0.95, 0.3, 0.7, 0.4, 0.6, 0.9],
  custom:    [0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
};

interface Props {
  imageUrl: string;
  categoryId: string;
  onFeaturesExtracted: (features: number[]) => void;
  onReset: () => void;
}

export default function ImageAnalyzer({ imageUrl, categoryId, onFeaturesExtracted, onReset }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(-1);
  const [features, setFeatures] = useState<number[]>([]);
  const [liveValues, setLiveValues] = useState<number[]>(Array(6).fill(0));
  const [done, setDone] = useState(false);
  const [scanLineY, setScanLineY] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    setScanning(false);
    setScanProgress(-1);
    setFeatures([]);
    setLiveValues(Array(6).fill(0));
    setDone(false);
    setScanLineY(0);
    clearTimers();

    const t = setTimeout(() => startScan(), 500);
    timersRef.current.push(t);
    return () => clearTimers();
  }, [imageUrl, categoryId]);

  // Animate live flickering numbers during scan
  useEffect(() => {
    if (!scanning) return;
    let frame = 0;
    const tick = () => {
      frame++;
      if (frame % 3 === 0) {
        setLiveValues(prev => prev.map((v, i) => {
          if (features[i] !== undefined) return features[i];
          if (i <= scanProgress) return +(Math.random()).toFixed(2);
          return 0;
        }));
        setScanLineY(prev => (prev + 2) % 100);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scanning, scanProgress, features]);

  const startScan = () => {
    setScanning(true);
    setScanProgress(0);
    setFeatures([]);
    setLiveValues(Array(6).fill(0));
    setDone(false);

    const biases = CATEGORY_BIASES[categoryId] || CATEGORY_BIASES.custom;

    const extractNext = (i: number) => {
      if (i >= FEATURE_NAMES.length) {
        setScanning(false);
        setDone(true);
        return;
      }
      setScanProgress(i);
      const t = setTimeout(() => {
        const score = Math.max(0.1, Math.min(1, biases[i] + (Math.random() * 0.2 - 0.1)));
        setFeatures(prev => {
          const next = [...prev, +score.toFixed(2)];
          setLiveValues(lv => lv.map((v, idx) => next[idx] !== undefined ? next[idx] : v));
          if (next.length === FEATURE_NAMES.length) {
            setTimeout(() => onFeaturesExtracted(next), 100);
          }
          return next;
        });
        extractNext(i + 1);
      }, 600);
      timersRef.current.push(t);
    };

    extractNext(0);
  };

  return (
    <div className="mt-4">
      {/* Image - bigger */}
      <div className="relative rounded-xl overflow-hidden border border-border mb-4">
        <img
          src={imageUrl}
          alt="Selected for analysis"
          className="w-full h-64 md:h-72 object-cover"
          crossOrigin="anonymous"
        />
        {/* Scan line overlay */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_hsl(var(--primary)),0_0_30px_hsl(var(--primary)/0.5)]"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
          </div>
        )}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            ✓ Analysis Complete
          </motion.div>
        )}
      </div>

      {/* Feature extraction grid with live numbers */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {FEATURE_NAMES.map((name, i) => {
          const extracted = features[i] !== undefined;
          const isActive = scanning && scanProgress === i;
          const displayValue = extracted ? features[i] : (scanning && i <= scanProgress ? liveValues[i] : 0);
          const showValue = extracted || (scanning && i <= scanProgress);

          return (
            <motion.div
              key={name}
              className={`rounded-lg border p-2.5 text-center transition-all ${
                extracted
                  ? "border-primary/60 bg-primary/10"
                  : isActive
                  ? "border-accent/60 bg-accent/10"
                  : "border-border bg-secondary/30"
              }`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.4, repeat: isActive ? Infinity : 0 }}
            >
              <p className="text-[10px] font-semibold text-foreground mb-0.5">{name}</p>
              {showValue ? (
                <motion.p
                  className={`text-sm font-mono font-bold ${extracted ? "text-primary" : "text-accent"}`}
                  key={extracted ? "final" : displayValue}
                  initial={extracted ? { scale: 1.3 } : {}}
                  animate={{ scale: 1 }}
                >
                  {displayValue.toFixed(2)}
                </motion.p>
              ) : (
                <p className="text-sm text-muted-foreground font-mono">—</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Reset / New image button */}
      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-all text-sm font-semibold text-foreground"
      >
        🔄 Select a New Image
      </button>
    </div>
  );
}
