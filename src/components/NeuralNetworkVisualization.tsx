import { useState, useEffect, useCallback } from "react";
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

const LAYERS = [4, 6, 6, 3]; // input, hidden1, hidden2, output
const LAYER_LABELS = ["Input", "Hidden 1", "Hidden 2", "Output"];
const OUTPUT_LABELS = ["Cat", "Dog", "Bird"];
const WIDTH = 720;
const HEIGHT = 480;
const PADDING_X = 90;
const PADDING_Y = 50;

function buildNetwork() {
  const neurons: Neuron[] = [];
  const connections: Connection[] = [];
  const layerSpacing = (WIDTH - PADDING_X * 2) / (LAYERS.length - 1);

  LAYERS.forEach((count, li) => {
    const layerHeight = HEIGHT - PADDING_Y * 2;
    const neuronSpacing = layerHeight / (count + 1);
    for (let ni = 0; ni < count; ni++) {
      const neuron: Neuron = {
        id: `${li}-${ni}`,
        layer: li,
        index: ni,
        x: PADDING_X + li * layerSpacing,
        y: PADDING_Y + (ni + 1) * neuronSpacing,
        activation: 0,
        bias: Math.random() * 0.4 - 0.2,
      };
      neurons.push(neuron);

      if (li > 0) {
        for (let pi = 0; pi < LAYERS[li - 1]; pi++) {
          connections.push({
            from: `${li - 1}-${pi}`,
            to: neuron.id,
            weight: Math.random() * 2 - 1,
            active: false,
          });
        }
      }
    }
  });

  return { neurons, connections };
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export default function NeuralNetworkVisualization() {
  const [{ neurons, connections }, setNetwork] = useState(buildNetwork);
  const [propagating, setPropagating] = useState(false);
  const [currentLayer, setCurrentLayer] = useState(-1);
  const [inputValues, setInputValues] = useState([0.8, 0.3, 0.6, 0.9]);

  const forwardPass = useCallback(() => {
    if (propagating) return;
    setPropagating(true);
    setCurrentLayer(0);

    // Set input activations
    setNetwork(prev => {
      const ns = prev.neurons.map(n => {
        if (n.layer === 0) return { ...n, activation: inputValues[n.index] };
        return { ...n, activation: 0 };
      });
      return { ...prev, neurons: ns };
    });

    // Propagate layer by layer
    let layer = 1;
    const propagateLayer = () => {
      if (layer >= LAYERS.length) {
        setPropagating(false);
        setCurrentLayer(-1);
        return;
      }
      const currentL = layer;
      setCurrentLayer(currentL);

      setNetwork(prev => {
        const neuronMap = new Map(prev.neurons.map(n => [n.id, n]));
        const updatedNeurons = prev.neurons.map(n => {
          if (n.layer !== currentL) return n;
          let sum = n.bias;
          prev.connections.filter(c => c.to === n.id).forEach(c => {
            const fromN = neuronMap.get(c.from);
            if (fromN) sum += fromN.activation * c.weight;
          });
          return { ...n, activation: sigmoid(sum) };
        });
        const updatedConns = prev.connections.map(c => {
          const toN = updatedNeurons.find(n => n.id === c.to);
          return { ...c, active: toN?.layer === currentL };
        });
        return { neurons: updatedNeurons, connections: updatedConns };
      });

      layer++;
      setTimeout(propagateLayer, 700);
    };

    setTimeout(propagateLayer, 500);
  }, [propagating, inputValues]);

  const randomizeInputs = () => {
    setInputValues([Math.random(), Math.random(), Math.random(), Math.random()].map(v => +v.toFixed(2)));
  };

  const neuronMap = new Map(neurons.map(n => [n.id, n]));
  const outputNeurons = neurons.filter(n => n.layer === LAYERS.length - 1);
  const maxOutput = Math.max(...outputNeurons.map(n => n.activation));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Neural Network — Forward Pass</h2>
          <p className="text-muted-foreground mt-1">Watch activations propagate through layers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={randomizeInputs} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:opacity-80 transition-opacity">
            🎲 Random Input
          </button>
          <button
            onClick={forwardPass}
            disabled={propagating}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {propagating ? "Propagating..." : "⚡ Forward Pass"}
          </button>
        </div>
      </div>

      <div className="relative bg-card rounded-xl border border-border overflow-hidden" style={{ height: HEIGHT + 60 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT + 60}`}>
          {/* Layer labels */}
          {LAYERS.map((_, li) => {
            const x = PADDING_X + li * ((WIDTH - PADDING_X * 2) / (LAYERS.length - 1));
            return (
              <text key={`label-${li}`} x={x} y={HEIGHT + 30} textAnchor="middle"
                fill={currentLayer === li ? "hsl(192 90% 55%)" : "hsl(215 12% 55%)"}
                fontSize={12} fontFamily="Space Grotesk" fontWeight={currentLayer === li ? 700 : 400}>
                {LAYER_LABELS[li]}
              </text>
            );
          })}

          {/* Connections */}
          {connections.map((conn, i) => {
            const from = neuronMap.get(conn.from)!;
            const to = neuronMap.get(conn.to)!;
            const absWeight = Math.abs(conn.weight);
            const isPositive = conn.weight > 0;
            return (
              <motion.line
                key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={conn.active
                  ? isPositive ? "hsl(192 90% 55%)" : "hsl(280 70% 60%)"
                  : "hsl(220 14% 20%)"
                }
                strokeWidth={conn.active ? absWeight * 2.5 + 0.5 : absWeight * 1.2 + 0.3}
                strokeOpacity={conn.active ? 0.8 : 0.15}
                animate={{ strokeOpacity: conn.active ? 0.8 : 0.15 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Neurons */}
          {neurons.map(n => {
            const isActive = n.activation > 0.01;
            const isOutput = n.layer === LAYERS.length - 1;
            const isWinner = isOutput && n.activation === maxOutput && maxOutput > 0;
            const radius = 18;
            return (
              <g key={n.id}>
                {/* Glow */}
                {isActive && (
                  <motion.circle
                    cx={n.x} cy={n.y} r={radius + 6}
                    fill="none"
                    stroke={isWinner ? "hsl(150 70% 45%)" : "hsl(192 90% 55%)"}
                    strokeWidth={2}
                    initial={{ opacity: 0 }} animate={{ opacity: n.activation * 0.5 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
                <circle
                  cx={n.x} cy={n.y} r={radius}
                  fill={`hsl(192 90% ${15 + n.activation * 40}%)`}
                  stroke={isWinner ? "hsl(150 70% 45%)" : currentLayer === n.layer ? "hsl(192 90% 55%)" : "hsl(220 14% 25%)"}
                  strokeWidth={isWinner ? 3 : 1.5}
                />
                <text x={n.x} y={n.y + 4} textAnchor="middle"
                  fill="hsl(210 20% 92%)" fontSize={10} fontFamily="JetBrains Mono">
                  {n.activation > 0.01 ? n.activation.toFixed(2) : "—"}
                </text>
                {/* Input labels */}
                {n.layer === 0 && (
                  <text x={n.x - 30} y={n.y + 4} textAnchor="end"
                    fill="hsl(192 90% 55%)" fontSize={10} fontFamily="JetBrains Mono">
                    {inputValues[n.index]}
                  </text>
                )}
                {/* Output labels */}
                {isOutput && (
                  <text x={n.x + 30} y={n.y + 4} textAnchor="start"
                    fill={isWinner ? "hsl(150 70% 45%)" : "hsl(215 12% 55%)"} fontSize={11}
                    fontFamily="Space Grotesk" fontWeight={isWinner ? 700 : 400}>
                    {OUTPUT_LABELS[n.index]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: "⚡", title: "Activation", desc: "Each neuron fires based on weighted inputs + bias, passed through sigmoid" },
          { icon: "🔗", title: "Weights", desc: "Blue = positive connection, purple = negative. Thicker = stronger" },
          { icon: "🎯", title: "Output", desc: "The highest activation in the output layer becomes the prediction" },
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
