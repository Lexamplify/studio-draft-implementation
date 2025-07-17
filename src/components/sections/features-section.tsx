
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, CalendarDays, FileText, FolderKanban, Lightbulb, Library, Users, ShieldCheck, Zap } from "lucide-react";

// This file is currently not used in page.tsx as per the new Figma design.
// It can be repurposed or removed if the new sections (AlternatingFeatures, IconBenefits, DetailedFeatures) cover all needs.
// Keeping the content for now in case it's needed later or for a different page.

const features = [
  {
    icon: <FileText className="h-10 w-10 text-primary mb-4" />,
    title: "AI-Powered Drafting",
    description: "Generate precise legal documents, notices, and petitions efficiently, tailored to Indian legal nuances.",
  },
  {
    icon: <FolderKanban className="h-10 w-10 text-primary mb-4" />,
    title: "Unified Case Workspace",
    description: "Organize all case files, notes, and client communications in one secure, collaborative digital environment.",
  },
  {
    icon: <Library className="h-10 w-10 text-primary mb-4" />,
    title: "Intelligent Legal Research",
    description: "Access a vast database of Indian case law and statutes with AI-driven semantic search for faster, relevant results.",
  },
  {
    icon: <Lightbulb className="h-10 w-10 text-primary mb-4" />,
    title: "Strategic Argument Builder",
    description: "Construct compelling legal arguments by leveraging AI-driven insights and relevant case law precedents.",
  },
  {
    icon: <BrainCircuit className="h-10 w-10 text-primary mb-4" />,
    title: "Insightful Judgment Prediction",
    description: "Gain AI-driven foresight into potential case outcomes based on argument types and historical data analysis.",
  },
  {
    icon: <CalendarDays className="h-10 w-10 text-primary mb-4" />,
    title: "Smart Court Calendar",
    description: "Manage court dates, deadlines, and client meetings seamlessly with intelligent calendar integration.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            How Lexamplify Elevates Your Practice
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Discover a comprehensive suite of AI-powered tools designed to revolutionize your legal workflow, enhance productivity, and drive success.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col rounded-xl">
              <CardHeader className="items-center text-center pt-8">
                {feature.icon}
                <CardTitle className="font-sans text-xl font-semibold text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-grow px-6 pb-8">
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
