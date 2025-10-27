import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="pt-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="py-24 lg:py-32 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-12">
            <span className="w-2 h-2 bg-accent rounded-full"></span>
            Backed by AI Innovation
          </div>
          
          {/* Headline */}
          <h1 className="font-serif text-5xl lg:text-7xl font-bold mb-8 text-foreground leading-tight max-w-5xl mx-auto">
            Amplify Your Legal Practice with AI
          </h1>
          
          {/* Subheading */}
          <p className="text-xl lg:text-2xl text-muted-foreground mb-16 max-w-4xl mx-auto leading-relaxed">
            Lexamplify leverages cutting-edge AI to streamline your legal workflows, from drafting and research to case management. Empower your practice, save time, and achieve better outcomes.
          </p>
          
          {/* CTA */}
          <Button 
            size="lg"
            className="bg-foreground hover:bg-foreground/90 text-white text-lg px-12 py-4 rounded-lg transition-all duration-300"
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;