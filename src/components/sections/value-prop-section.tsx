
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Zap, Users, TrendingUp, Scale, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// This file is currently not used in page.tsx as per the new Figma design.
// It has been replaced by AlternatingFeaturesSection and IconBenefitsSection.
// Keeping the content for now in case it's needed later or for a different page.

const valueProps = [
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: "Accelerate Your Workflow",
    description: "Dramatically reduce time spent on research, drafting, and case preparation with AI-powered automation and intelligent suggestions.",
    link: "#features",
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: "Enhance Accuracy & Outcomes",
    description: "Leverage data-driven insights and comprehensive legal knowledge to build stronger arguments and improve case success rates.",
    link: "#ai-prediction",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Seamless Collaboration",
    description: "Work efficiently with your team in a unified CaseSpace™, sharing documents, notes, and updates in real-time, securely.",
    link: "#features", // Link to CaseSpace feature
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Secure & Confidential",
    description: "Built with bank-grade security and data privacy at its core, ensuring your client data and case information remain protected.",
    link: "#", // General link or no link
  },
];

const ValuePropSection = () => {
  return (
    <section id="value-prop" className="bg-background text-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            Why Choose Lexamplify?
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Lexamplify is more than just a tool; it's your strategic partner in navigating the complexities of modern legal practice in India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {valueProps.map((prop) => (
            <Card key={prop.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-xl overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 bg-muted/30 p-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {prop.icon}
                </div>
                <div>
                  <CardTitle className="font-sans text-xl font-semibold text-foreground mb-1">{prop.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <p className="text-muted-foreground text-sm mb-4">{prop.description}</p>
              </CardContent>
              {prop.link && prop.link !== "#" && (
                 <div className="p-6 pt-0 mt-auto">
                    <Button variant="link" asChild className="text-primary p-0 h-auto">
                        <Link href={prop.link}>
                            Learn More <ChevronsRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                 </div>
              )}
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16">
            <Button asChild size="lg" className="text-lg py-3 px-8 transition-all duration-300 ease-in-out hover:shadow-primary/30 hover:scale-105 group">
                <Link href="#contact">
                    Request a Personalized Demo
                    <ChevronsRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
            </Button>
        </div>

      </div>
    </section>
  );
};

export default ValuePropSection;

