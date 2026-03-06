import JigsawVisualization from "@/components/JigsawVisualization";
import NeuralNetworkVisualization from "@/components/NeuralNetworkVisualization";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-6 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-tight">
          How Neural Networks Think
        </h1>
        <p className="text-muted-foreground mt-1">
          Interactive visualizations — pattern recognition meets neural network mechanics
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" style={{ minHeight: "calc(100vh - 140px)" }}>
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <JigsawVisualization />
        </div>
        <div className="bg-card/50 rounded-xl border border-border p-4">
          <NeuralNetworkVisualization />
        </div>
      </div>
    </div>
  );
};

export default Index;
