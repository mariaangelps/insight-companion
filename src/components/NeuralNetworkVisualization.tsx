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
  signalProgress: number; // 0-1 for traveling signal animation
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
            weight: Math.random() * 2 - 1, active: false, signalProgress: 0,
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
  const [activatedNeurons, setActivatedNeurons] = useState<Set<string>>(new Set());
  const [signalPulses, setSignalPulses] = useState<Array<{ id: string; x1: number; y1: number; x2: number; y2: number; color: string }>>([]);
  const [step, setStep] = useState(0); // 0=idle, 1=input lit, 2+=propagating layers
  
  const prevTrigger = useRef(0);
  const animFrameRef = useRef<number>(0);

  const LAYER_LABELS = ["Input\n(features)", "Hidden 1", "Hidden 2", "Output\n(class)"];

  useEffect(() => {
    if (triggerForward === 0 || triggerForward === prevTrigger.current) return;
    prevTrigger.current = triggerForward;
    if (propagating) return;
    forwardPass();
  }, [triggerForward]);

  const forwardPass = useCallback(() => {
    setPropagating(true);
    setResultText(null);
    setActivatedNeurons(new Set());
    setSignalPulses([]);
    setStep(0);

    // Step 1: Light up input neurons one by one
    setNetwork(prev => ({
      ...prev,
      neurons: prev.neurons.map(n => ({ ...n, activation: 0 })),
      connections: prev.connections.map(c => ({ ...c, active: false, signalProgress: 0 })),
    }));

    // Animate input neurons appearing
    const inputCount = featureNames.length;
    let inputIdx = 0;

    const lightInputs = () => {
      if (inputIdx < inputCount) {
        const idx = inputIdx;
        setActivatedNeurons(prev => new Set(prev).add(`0-${idx}`));
        setNetwork(prev => ({
          ...prev,
          neurons: prev.neurons.map(n => {
            if (n.layer === 0 && n.index === idx) {
              return { ...n, activation: inputActivations[idx] || 0 };
            }
            return n;
          }),
        }));
        setStep(1);
        inputIdx++;
        setTimeout(lightInputs, 120);
      } else {
        // All inputs lit, start layer propagation
        setTimeout(() => propagateLayerByLayer(1), 400);
      }
    };

    setTimeout(lightInputs, 200);
  }, [propagating, inputActivations, network, categoryId, outputLabels, featureNames]);

  const propagateLayerByLayer = useCallback((layer: number) => {
    const { layers } = network;

    if (layer >= layers.length) {
      // Final: bias the correct output
      setNetwork(prev => {
        const targetIdx = categoryId ? CATEGORY_OUTPUT_MAP[categoryId] : -1;
        const updatedNeurons = prev.neurons.map(n => {
          if (n.layer !== layers.length - 1) return n;
          if (targetIdx >= 0 && n.index === targetIdx) {
            return { ...n, activation: 0.85 + Math.random() * 0.14 };
          }
          if (targetIdx >= 0) {
            return { ...n, activation: Math.random() * 0.3 };
          }
          return n;
        });

        const outputs = updatedNeurons.filter(n => n.layer === layers.length - 1);
        const maxN = outputs.reduce((a, b) => a.activation > b.activation ? a : b);
        const confidence = (maxN.activation * 100).toFixed(1);
        const winnerLabel = outputLabels[maxN.index];

        // Mark winner neuron
        setActivatedNeurons(prev => {
          const next = new Set(prev);
          next.add(`winner-${maxN.id}`);
          return next;
        });

        setResultText(
          categoryId === "custom"
            ? `Custom image → ${winnerLabel} — ${confidence}%`
            : `Classified as ${winnerLabel} — ${confidence}%`
        );

        return { ...prev, neurons: updatedNeurons };
      });

      setPropagating(false);
      setCurrentLayer(-1);
      setStep(0);
      return;
    }

    // Step: animate signals traveling along connections to this layer
    setCurrentLayer(layer);
    setStep(layer + 1);

    // Phase 1: Show signal pulses traveling
    const neuronMap = new Map(network.neurons.map(n => [n.id, n]));
    const layerConnections = network.connections
      .filter(c => {
        const toNeuron = neuronMap.get(c.to);
        return toNeuron && toNeuron.layer === layer;
      })
      .map(c => {
        const from = neuronMap.get(c.from)!;
        const to = neuronMap.get(c.to)!;
        return {
          id: `${c.from}-${c.to}`,
          x1: from.x, y1: from.y,
          x2: to.x, y2: to.y,
          color: c.weight > 0 ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)",
        };
      });

    setSignalPulses(layerConnections);

    // Phase 2: After signal travel, activate connections and compute neurons
    setTimeout(() => {
      setSignalPulses([]);

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

        // Mark newly activated neurons
        updatedNeurons.filter(n => n.layer === layer).forEach(n => {
          setActivatedNeurons(prev => new Set(prev).add(n.id));
        });

        return {
          ...prev,
          neurons: updatedNeurons,
          connections: prev.connections.map(c => {
            const toNeuron = updatedNeurons.find(n => n.id === c.to);
            return {
              ...c,
              active: toNeuron?.layer === layer,
              signalProgress: toNeuron?.layer === layer ? 1 : c.signalProgress,
            };
          }),
        };
      });

      setTimeout(() => propagateLayerByLayer(layer + 1), 600);
    }, 700);
  }, [network, categoryId, outputLabels]);

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
            {propagating ? "Processing..." : "⚡ Re-run"}
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mb-3">
        ← Image features become <span className="text-primary font-semibold">input neurons</span>. The network classifies the pattern.
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
            {/* Glow filters */}
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Signal pulse gradient */}
            <radialGradient id="signal-dot">
              <stop offset="0%" stopColor="hsl(192 90% 70%)" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(192 90% 55%)" stopOpacity="0" />
            </radialGradient>
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

          {/* Connections */}
          {connections.map((conn, i) => {
            const from = neuronMap.get(conn.from)!;
            const to = neuronMap.get(conn.to)!;
            const isActive = conn.active;
            return (
              <motion.line
                key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isActive
                  ? (conn.weight > 0 ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)")
                  : "hsl(220 14% 20%)"
                }
                strokeWidth={isActive ? Math.abs(conn.weight) * 2.5 + 0.5 : Math.abs(conn.weight) * 0.6 + 0.15}
                initial={false}
                animate={{
                  strokeOpacity: isActive ? 0.85 : 0.08,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            );
          })}

          {/* Traveling signal pulses */}
          {signalPulses.map((pulse) => (
            <motion.circle
              key={pulse.id}
              r={3}
              fill={pulse.color}
              filter="url(#glow-cyan)"
              initial={{ cx: pulse.x1, cy: pulse.y1, opacity: 0.9 }}
              animate={{ cx: pulse.x2, cy: pulse.y2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          ))}

          {/* Neurons */}
          {neurons.map(n => {
            const isInput = n.layer === 0;
            const isOutput = n.layer === network.layers.length - 1;
            const isWinner = isOutput && n.activation === maxOutput && maxOutput > 0.1;
            const r = 13;
            const hasValue = n.activation > 0.01;
            const justActivated = activatedNeurons.has(n.id);

            return (
              <g key={n.id}>
                {/* Ripple effect on activation */}
                {justActivated && hasValue && (
                  <motion.circle
                    cx={n.x} cy={n.y} r={r}
                    fill="none"
                    stroke={isWinner ? "hsl(150 70% 45%)" : isInput ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)"}
                    strokeWidth={2}
                    initial={{ r: r, opacity: 0.8 }}
                    animate={{ r: r + 12, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                )}

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

                {/* Main neuron circle */}
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
                  initial={false}
                  animate={{
                    scale: justActivated && hasValue ? [1, 1.15, 1] : 1,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* Value text */}
                <text x={n.x} y={n.y + 3} textAnchor="middle" fill="hsl(210 20% 92%)" fontSize={7} fontFamily="JetBrains Mono">
                  {hasValue ? n.activation.toFixed(2) : "—"}
                </text>

                {/* Input labels */}
                {isInput && (
                  <text x={n.x - 20} y={n.y + 3} textAnchor="end"
                    fill={hasValue ? "hsl(192 90% 55%)" : "hsl(215 12% 35%)"} fontSize={8} fontFamily="Space Grotesk"
                    fontWeight={hasValue ? 600 : 400}>
                    {featureNames[n.index]}
                  </text>
                )}

                {/* Output labels */}
                {isOutput && (
                  <motion.text
                    x={n.x + 20} y={n.y + 3} textAnchor="start"
                    fill={isWinner ? "hsl(150 70% 45%)" : "hsl(215 12% 55%)"} fontSize={9}
                    fontFamily="Space Grotesk" fontWeight={isWinner ? 700 : 400}
                    initial={false}
                    animate={{ scale: isWinner ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
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
              <p className="text-muted-foreground text-xs mt-1">Image features will feed the network</p>
            </div>
          </div>
        )}
      </div>

      {/* Step indicator */}
      {propagating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2"
        >
          {LAYER_LABELS.map((label, i) => (
            <motion.div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                currentLayer >= i || (step > i + 1)
                  ? "bg-primary"
                  : currentLayer === i
                    ? "bg-primary/60"
                    : "bg-border"
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
