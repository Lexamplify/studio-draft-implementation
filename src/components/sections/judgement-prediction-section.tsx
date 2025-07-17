
import { JudgementPredictionForm } from "@/components/judgement-prediction-form";
import { Lightbulb } from "lucide-react";

const JudgementPredictionSection = () => {
  return (
    <section id="ai-prediction" className="bg-background text-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
           <div className="flex justify-center mb-4">
             <Lightbulb className="h-12 w-12 text-primary" />
           </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            AI Judgment Prediction
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Curious about potential outcomes? Enter a type of legal argument and let our AI provide an estimated judgment prediction based on prevailing case law analysis.
          </p>
           <p className="text-sm text-muted-foreground/80 mt-2 max-w-3xl mx-auto">
            (This is an experimental feature for informational purposes and not legal advice.)
          </p>
        </div>
        <div className="max-w-2xl mx-auto bg-card p-8 sm:p-10 rounded-xl shadow-2xl">
          <JudgementPredictionForm />
        </div>
      </div>
    </section>
  );
};

export default JudgementPredictionSection;
