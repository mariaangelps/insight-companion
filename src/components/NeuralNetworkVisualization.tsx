import { useState, useCallback } from "react";
import { motion } from "framer-motion";

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
}

const LAYERS = [4, 6, 6, 3];
const LAYER_LABELS = ["Input", "Hidden 1", "Hidden 2", "Output"];
const OUTPUT_LABELS = ["Cat", "Dog", "Bird"];
const WIDTH = 460;
const HEIGHT = 400;
const PX = 60;
const PY = 30;

function buildNetwork() {
  const neurons: Neuron[] = [];
  const connections: Connection[] = [];
  const layerSpacing = (WIDTH - PX * 2) / (LAYERS.length - 1);

  LAYERS.forEach((count, li) => {
    const h = HEIGHT - PY * 2;
    const spacing = h / (count + 1);
    for (let ni = 0; ni < count; ni++) {
      const neuron: Neuron = {
        id: `${li}-${ni}`, layer: li, index: ni,
        x: PX + li * layerSpacing, y: PY + (ni + 1) * spacing,
        activation: 0, bias: Math.random() * 0.4 - 0.2,
      };
      neurons.push(neuron);
      if (li > 0) {
        for (let pi = 0; pi < LAYERS[li - 1]; pi++) {
          connections.push({ from: `${li - 1}-${pi}`, to: neuron.id, weight: Math.random() * 2 - 1, active: false });
        }
      }
    }
  });
  return { neurons, connections };
}

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

export default function NeuralNetworkVisualization() {
  const [{ neurons, connections }, setNetwork] = useState(buildNetwork);
  const [propagating, setPropagating] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(-1);
  const [inputValues, setInputValues] = useState([0.8, 0.3, 0.6, 0.9]);

  const forwardPass = useCallback(() => {
    if (propagating) return;
    setPropagating(true);
    setCurrentLayer(0);

    setNetwork(prev => ({
      ...prev,
      neurons: prev.neurons.map(n => n.layer === 0 ? { ...n, activation: inputValues[n.index] } : { ...n, activation: 0 }),
    }));

    let layer = 1;
    const propagateLayer = () => {
      if (layer >= LAYERS.length) { setPropagating(false); setCurrentLayer(-1); return; }
      const currentL = layer;
      setCurrentLayer(currentL);

      setNetwork(prev => {
        const map = new Map(prev.neurons.map(n => [n.id, n]));
        const updatedNeurons = prev.neurons.map(n => {
          if (n.layer !== currentL) return n;
          let sum = n.bias;
          prev.connections.filter(c => c.to === n.id).forEach(c => {
            const from = map.get(c.from);
            if (from) sum += from.activation * c.weight;
          });
          return { ...n, activation: sigmoid(sum) };
        });
        return {
          neurons: updatedNeurons,
          connections: prev.connections.map(c => ({ ...c, active: updatedNeurons.find(n => n.id === c.to)?.layer === currentL })),
        };
      });
      layer++;
      setTimeout(propagateLayer, 600);
    };
    setTimeout(propagateLayer, 400);
  }, [propagating, inputValues]);

  const randomizeInputs = () => {
    setInputValues([Math.random(), Math.random(), Math.random(), Math.random()].map(v => +v.toFixed(2)));
  };

  const neuronMap = new Map(neurons.map(n => [n.id, n]));
  const outputNeurons = neurons.filter(n => n.layer === LAYERS.length - 1);
  const maxOutput = Math.max(...outputNeurons.map(n => n.activation));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gradient">🧠 Neural Network</h2>
        <div className="flex gap-2">
          <button onClick={randomizeInputs} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs">
            🎲 Random
          </button>
          <button onClick={forwardPass} disabled={propagating}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs disabled:opacity-50">
            {propagating ? "Running..." : "⚡ Forward"}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden min-h-0">
        <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
          {/* Layer labels */}
          {LAYERS.map((_, li) => (
            <text key={li} x={PX + li * ((WIDTH - PX * 2) / (LAYERS.length - 1))} y={HEIGHT - 8}
              textAnchor="middle" fill={currentLayer === li ? "hsl(192 90% 55%)" : "hsl(215 12% 55%)"}
              fontSize={10} fontFamily="Space Grotesk" fontWeight={currentLayer === li ? 700 : 400}>
              {LAYER_LABELS[li]}
            </text>
          ))}

          {/* Connections */}
          {connections.map((conn, i) => {
            const from = neuronMap.get(conn.from)!;
            const to = neuronMap.get(conn.to)!;
            return (
              <motion.line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={conn.active ? (conn.weight > 0 ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)") : "hsl(220 14% 20%)"}
                strokeWidth={conn.active ? Math.abs(conn.weight) * 2 + 0.5 : Math.abs(conn.weight) * 0.8 + 0.2}
                strokeOpacity={conn.active ? 0.8 : 0.12}
                animate={{ strokeOpacity: conn.active ? 0.8 : 0.12 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Neurons */}
          {neurons.map(n => {
            const isOutput = n.layer === LAYERS.length - 1;
            const isWinner = isOutput && n.activation === maxOutput && maxOutput > 0;
            const r = 14;
            return (
              <g key={n.id}>
                {n.activation > 0.01 && (
                  <motion.circle cx={n.x} cy={n.y} r={r + 5} fill="none"
                    stroke={isWinner ? "hsl(150 70% 45%)" : "hsl(192 90% 55%)"} strokeWidth={1.5}
                    initial={{ opacity: 0 }} animate={{ opacity: n.activation * 0.4 }}
                  />
                )}
                <circle cx={n.x} cy={n.y} r={r}
                  fill={`hsl(192 90% ${15 + n.activation * 40}%)`}
                  stroke={isWinner ? "hsl(150 70% 45%)" : currentLayer === n.layer ? "hsl(192 90% 55%)" : "hsl(220 14% 25%)"}
                  strokeWidth={isWinner ? 2.5 : 1.5}
                />
                <text x={n.x} y={n.y + 3.5} textAnchor="middle" fill="hsl(210 20% 92%)" fontSize={8} fontFamily="JetBrains Mono">
                  {n.activation > 0.01 ? n.activation.toFixed(2) : "—"}
                </text>
                {n.layer === 0 && (
                  <text x={n.x - 22} y={n.y + 3.5} textAnchor="end" fill="hsl(192 90% 55%)" fontSize={9} fontFamily="JetBrains Mono">
                    {inputValues[n.index]}
                  </text>
                )}
                {isOutput && (
                  <text x={n.x + 22} y={n.y + 3.5} textAnchor="start"
                    fill={isWinner ? "hsl(150 70% 45%)" : "hsl(215 12% 55%)"} fontSize={10}
                    fontFamily="Space Grotesk" fontWeight={isWinner ? 700 : 400}>
                    {OUTPUT_LABELS[n.index]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { icon: "⚡", title: "Activation", desc: "Weighted sum + sigmoid" },
          { icon: "🔗", title: "Weights", desc: "Blue +, Purple −" },
          { icon: "🎯", title: "Output", desc: "Highest = prediction" },
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
