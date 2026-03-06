import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JigsawVisualization from "@/components/JigsawVisualization";
import NeuralNetworkVisualization from "@/components/NeuralNetworkVisualization";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient tracking-tight">
            How Neural Networks Think
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Interactive visualizations of pattern recognition & neural network mechanics
          </p>
        </header>

        <Tabs defaultValue="jigsaw" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="jigsaw" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              🧩 Pattern Recognition
            </TabsTrigger>
            <TabsTrigger value="neural" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              🧠 Neural Network
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jigsaw">
            <JigsawVisualization />
          </TabsContent>

          <TabsContent value="neural">
            <NeuralNetworkVisualization />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
