import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Neuron {
  id: string;
  layer: number;
  index: number;
  x: number;
  y: number;
  activation: number;
  bias: number;
}

interface Connection {
  from: string;
  to: string;
  weight: number;
  active: boolean;
  drawn: boolean; // whether this connection has been "drawn" yet
}

interface Props {
  inputActivations: number[];
  triggerForward: number;
  featureNames: string[];
  outputLabels: string[];
  categoryId: string | null;
}

const HIDDEN = [8, 6];
const WIDTH = 480;
const HEIGHT = 420;
const PX = 70;
const PY = 20;

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

function buildNetwork(inputCount: number, outputCount: number) {
  const layers = [inputCount, ...HIDDEN, outputCount];
  const neurons: Neuron[] = [];
  const connections: Connection[] = [];
  const layerSpacing = (WIDTH - PX * 2) / (layers.length - 1);

  layers.forEach((count, li) => {
    const h = HEIGHT - PY * 2 - 30;
    const spacing = h / (count + 1);
    for (let ni = 0; ni < count; ni++) {
      neurons.push({
        id: `${li}-${ni}`, layer: li, index: ni,
        x: PX + li * layerSpacing, y: PY + (ni + 1) * spacing,
        activation: 0, bias: Math.random() * 0.6 - 0.3,
      });
      if (li > 0) {
        for (let pi = 0; pi < layers[li - 1]; pi++) {
          connections.push({
            from: `${li - 1}-${pi}`, to: `${li}-${ni}`,
            weight: Math.random() * 2 - 1, active: false, drawn: false,
          });
        }
      }
    }
  });
  return { neurons, connections, layers };
}

const CATEGORY_OUTPUT_MAP: Record<string, number> = {
  face: 0, animal: 1, landscape: 2, food: 3, custom: -1,
};

export default function NeuralNetworkVisualization({ inputActivations, triggerForward, featureNames, outputLabels, categoryId }: Props) {
  const [network, setNetwork] = useState(() => buildNetwork(featureNames.length, outputLabels.length));
  const [currentLayer, setCurrentLayer] = useState(-1);
  const [propagating, setPropagating] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [visibleNeurons, setVisibleNeurons] = useState<Set<string>>(new Set());
  const [activeConnectionIdx, setActiveConnectionIdx] = useState(-1); // which connection is currently being drawn
  const [phase, setPhase] = useState<"idle" | "building" | "activating" | "result">("idle");
  
  const prevTrigger = useRef(0);
  const cancelRef = useRef(false);

  const LAYER_LABELS = ["Input\n(features)", "Hidden 1", "Hidden 2", "Output\n(class)"];

  useEffect(() => {
    if (triggerForward === 0 || triggerForward === prevTrigger.current) return;
    prevTrigger.current = triggerForward;
    if (propagating) return;
    forwardPass();
  }, [triggerForward]);

  const forwardPass = useCallback(() => {
    cancelRef.current = false;
    setPropagating(true);
    setResultText(null);
    setVisibleNeurons(new Set());
    setActiveConnectionIdx(-1);
    setPhase("building");
    setCurrentLayer(-1);

    // Reset network
    setNetwork(prev => ({
      ...prev,
      neurons: prev.neurons.map(n => ({ ...n, activation: 0 })),
      connections: prev.connections.map(c => ({ ...c, active: false, drawn: false })),
    }));

    // Phase 1: Show input neurons one by one
    const inputCount = featureNames.length;
    let inputIdx = 0;

    const showInputNeurons = () => {
      if (cancelRef.current) return;
      if (inputIdx < inputCount) {
        const idx = inputIdx;
        setVisibleNeurons(prev => new Set(prev).add(`0-${idx}`));
        setNetwork(prev => ({
          ...prev,
          neurons: prev.neurons.map(n =>
            n.layer === 0 && n.index === idx
              ? { ...n, activation: inputActivations[idx] || 0 }
              : n
          ),
        }));
        inputIdx++;
        setTimeout(showInputNeurons, 100);
      } else {
        // Phase 2: Draw connections layer by layer, connection by connection
        setTimeout(() => drawConnectionsForLayer(1), 300);
      }
    };

    setTimeout(showInputNeurons, 150);
  }, [propagating, inputActivations, network, categoryId, outputLabels, featureNames]);

  const drawConnectionsForLayer = useCallback((layer: number) => {
    if (cancelRef.current) return;
    const { layers } = network;

    if (layer >= layers.length) {
      // All layers drawn — now show result
      finalizeResult();
      return;
    }

    setCurrentLayer(layer);
    setPhase("activating");

    // First show the target neurons for this layer
    const targetNeurons = network.neurons.filter(n => n.layer === layer);
    targetNeurons.forEach((n, i) => {
      setTimeout(() => {
        if (cancelRef.current) return;
        setVisibleNeurons(prev => new Set(prev).add(n.id));
      }, i * 60);
    });

    // Then draw connections one by one with staggered timing
    const neuronMap = new Map(network.neurons.map(n => [n.id, n]));
    const layerConns = network.connections.filter(c => {
      const toN = neuronMap.get(c.to);
      return toN && toN.layer === layer;
    });

    // Draw connections in batches (groups of 3-4 for speed)
    const batchSize = 4;
    let batchIdx = 0;

    const drawBatch = () => {
      if (cancelRef.current) return;
      const start = batchIdx * batchSize;
      const end = Math.min(start + batchSize, layerConns.length);
      
      if (start >= layerConns.length) {
        // All connections for this layer drawn — compute activations
        setTimeout(() => {
          if (cancelRef.current) return;
          computeLayerActivations(layer);
          setTimeout(() => drawConnectionsForLayer(layer + 1), 400);
        }, 200);
        return;
      }

      // Draw this batch of connections
      setNetwork(prev => ({
        ...prev,
        connections: prev.connections.map(c => {
          const matchIdx = layerConns.findIndex(lc => lc.from === c.from && lc.to === c.to);
          if (matchIdx >= start && matchIdx < end) {
            return { ...c, drawn: true, active: true };
          }
          return c;
        }),
      }));

      batchIdx++;
      setTimeout(drawBatch, 50); // Fast but visible
    };

    // Start drawing after neurons appear
    setTimeout(drawBatch, targetNeurons.length * 60 + 150);
  }, [network, categoryId, outputLabels]);

  const computeLayerActivations = useCallback((layer: number) => {
    setNetwork(prev => {
      const map = new Map(prev.neurons.map(n => [n.id, n]));
      const updatedNeurons = prev.neurons.map(n => {
        if (n.layer !== layer) return n;
        let sum = n.bias;
        prev.connections.filter(c => c.to === n.id).forEach(c => {
          const from = map.get(c.from);
          if (from) sum += from.activation * c.weight;
        });
        return { ...n, activation: sigmoid(sum) };
      });
      return { ...prev, neurons: updatedNeurons };
    });
  }, []);

  const finalizeResult = useCallback(() => {
    if (cancelRef.current) return;
    setPhase("result");
    
    setNetwork(prev => {
      const targetIdx = categoryId ? CATEGORY_OUTPUT_MAP[categoryId] : -1;
      const lastLayer = prev.layers.length - 1;
      const updatedNeurons = prev.neurons.map(n => {
        if (n.layer !== lastLayer) return n;
        if (targetIdx >= 0 && n.index === targetIdx) {
          return { ...n, activation: 0.85 + Math.random() * 0.14 };
        }
        if (targetIdx >= 0) {
          return { ...n, activation: Math.random() * 0.3 };
        }
        return n;
      });

      const outputs = updatedNeurons.filter(n => n.layer === lastLayer);
      const maxN = outputs.reduce((a, b) => a.activation > b.activation ? a : b);
      const confidence = (maxN.activation * 100).toFixed(1);
      const winnerLabel = outputLabels[maxN.index];

      setResultText(
        categoryId === "custom"
          ? `Custom image → ${winnerLabel} — ${confidence}%`
          : `Classified as ${winnerLabel} — ${confidence}%`
      );

      return { ...prev, neurons: updatedNeurons };
    });

    setPropagating(false);
    setCurrentLayer(-1);
  }, [categoryId, outputLabels]);

  const { neurons, connections } = network;
  const neuronMap = new Map(neurons.map(n => [n.id, n]));
  const outputNeurons = neurons.filter(n => n.layer === network.layers.length - 1);
  const maxOutput = Math.max(...outputNeurons.map(n => n.activation));
  const hasAnyInput = inputActivations.some(a => a > 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gradient">🧠 Neural Network</h2>
        {!hasAnyInput && (
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            Waiting for image analysis...
          </span>
        )}
        {hasAnyInput && (
          <button onClick={forwardPass} disabled={propagating}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-50">
            {propagating ? "Building network..." : "⚡ Re-run"}
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mb-3">
        ← Image features become <span className="text-primary font-semibold">input neurons</span>. Watch the network form connection by connection.
      </p>

      {/* Result banner */}
      <AnimatePresence>
        {resultText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mb-3 p-3 rounded-xl border-2 border-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)] text-center"
          >
            <p className="text-sm font-bold text-[hsl(var(--success))]">🎯 {resultText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0 relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer labels */}
          {network.layers.map((_, li) => {
            const x = PX + li * ((WIDTH - PX * 2) / (network.layers.length - 1));
            const lines = LAYER_LABELS[li].split("\n");
            return (
              <g key={`label-${li}`}>
                {lines.map((line, lineI) => (
                  <text key={lineI} x={x} y={HEIGHT - 20 + lineI * 12} textAnchor="middle"
                    fill={currentLayer === li ? "hsl(192 90% 55%)" : "hsl(215 12% 55%)"}
                    fontSize={9} fontFamily="Space Grotesk" fontWeight={currentLayer === li ? 700 : 400}>
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Connections — only render drawn ones, with draw animation */}
          {connections.map((conn, i) => {
            const from = neuronMap.get(conn.from)!;
            const to = neuronMap.get(conn.to)!;
            if (!conn.drawn) return null;

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);

            return (
              <motion.line
                key={`conn-${i}`}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={conn.weight > 0 ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)"}
                strokeWidth={Math.abs(conn.weight) * 1.8 + 0.3}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: conn.active ? 0.7 : 0.25 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                strokeDasharray={len}
                strokeDashoffset={0}
              />
            );
          })}

          {/* Neurons — only render visible ones */}
          {neurons.map(n => {
            const isVisible = visibleNeurons.has(n.id);
            const isInput = n.layer === 0;
            const isOutput = n.layer === network.layers.length - 1;
            const isWinner = isOutput && n.activation === maxOutput && maxOutput > 0.1 && phase === "result";
            const r = 13;
            const hasValue = n.activation > 0.01;

            if (!isVisible && phase !== "idle") return (
              <g key={n.id}>
                {/* Ghost placeholder */}
                <circle cx={n.x} cy={n.y} r={r}
                  fill="none" stroke="hsl(220 14% 18%)" strokeWidth={1} strokeDasharray="3 3" opacity={0.3}
                />
              </g>
            );

            if (!isVisible && phase === "idle") return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={r}
                  fill="hsl(220 14% 14%)" stroke="hsl(220 14% 25%)" strokeWidth={1.5}
                />
                <text x={n.x} y={n.y + 3} textAnchor="middle" fill="hsl(210 20% 92%)" fontSize={7} fontFamily="JetBrains Mono">—</text>
                {isInput && (
                  <text x={n.x - 20} y={n.y + 3} textAnchor="end"
                    fill="hsl(215 12% 35%)" fontSize={8} fontFamily="Space Grotesk" fontWeight={400}>
                    {featureNames[n.index]}
                  </text>
                )}
                {isOutput && (
                  <text x={n.x + 20} y={n.y + 3} textAnchor="start"
                    fill="hsl(215 12% 55%)" fontSize={9} fontFamily="Space Grotesk" fontWeight={400}>
                    {outputLabels[n.index]}
                  </text>
                )}
              </g>
            );

            return (
              <g key={n.id}>
                {/* Ripple on appear */}
                <motion.circle
                  cx={n.x} cy={n.y}
                  fill="none"
                  stroke={isWinner ? "hsl(150 70% 45%)" : isInput ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)"}
                  strokeWidth={2}
                  initial={{ r: r, opacity: 0.8 }}
                  animate={{ r: r + 15, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />

                {/* Glow ring */}
                {hasValue && (
                  <motion.circle cx={n.x} cy={n.y} r={r + 5} fill="none"
                    stroke={isWinner ? "hsl(150 70% 45%)" : isInput ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)"}
                    strokeWidth={1.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: n.activation * 0.5 }}
                    transition={{ duration: 0.4 }}
                    filter={isWinner ? "url(#glow-green)" : undefined}
                  />
                )}

                {/* Main neuron */}
                <motion.circle
                  cx={n.x} cy={n.y} r={r}
                  fill={hasValue
                    ? isInput
                      ? `hsl(192 90% ${15 + n.activation * 35}%)`
                      : isWinner
                        ? `hsl(150 60% ${20 + n.activation * 25}%)`
                        : `hsl(280 60% ${15 + n.activation * 30}%)`
                    : "hsl(220 14% 14%)"
                  }
                  stroke={isWinner ? "hsl(150 70% 45%)" : currentLayer === n.layer ? "hsl(192 90% 55%)" : "hsl(220 14% 25%)"}
                  strokeWidth={isWinner ? 2.5 : 1.5}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                />

                {/* Value */}
                <text x={n.x} y={n.y + 3} textAnchor="middle" fill="hsl(210 20% 92%)" fontSize={7} fontFamily="JetBrains Mono">
                  {hasValue ? n.activation.toFixed(2) : "—"}
                </text>

                {/* Labels */}
                {isInput && (
                  <text x={n.x - 20} y={n.y + 3} textAnchor="end"
                    fill={hasValue ? "hsl(192 90% 55%)" : "hsl(215 12% 35%)"} fontSize={8} fontFamily="Space Grotesk"
                    fontWeight={hasValue ? 600 : 400}>
                    {featureNames[n.index]}
                  </text>
                )}
                {isOutput && (
                  <motion.text
                    x={n.x + 20} y={n.y + 3} textAnchor="start"
                    fill={isWinner ? "hsl(150 70% 45%)" : "hsl(215 12% 55%)"} fontSize={9}
                    fontFamily="Space Grotesk" fontWeight={isWinner ? 700 : 400}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, scale: isWinner ? [1, 1.15, 1] : 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {outputLabels[n.index]} {isWinner ? "✓" : ""}
                  </motion.text>
                )}
              </g>
            );
          })}
        </svg>

        {!hasAnyInput && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Select an image to begin</p>
              <p className="text-muted-foreground text-xs mt-1">Watch the neural network build itself</p>
            </div>
          </div>
        )}
      </div>

      {/* Phase indicator */}
      {propagating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2"
        >
          {LAYER_LABELS.map((_, i) => (
            <motion.div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                currentLayer > i ? "bg-primary" : currentLayer === i ? "bg-primary/60" : "bg-border"
              }`}
              animate={currentLayer === i ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { icon: "🔵", title: "Input layer", desc: "Image feature values" },
          { icon: "🟣", title: "Hidden layers", desc: "Learn feature combos" },
          { icon: "🟢", title: "Output", desc: "Pattern classification" },
        ].map(item => (
          <div key={item.title} className="flex gap-2 items-start p-2 rounded-lg bg-secondary/50">
            <span className="text-sm">{item.icon}</span>
            <div>
              <p className="text-[10px] font-semibold text-foreground">{item.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
