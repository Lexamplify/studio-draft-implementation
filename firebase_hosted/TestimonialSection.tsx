import { Clock, MessageSquare, Search } from "lucide-react";

const TestimonialsSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">
          Security
        </div>
        
        <h2 className="font-serif text-4xl lg:text-6xl font-bold mb-8 text-foreground leading-tight">
          Built on Trust
        </h2>
        
        <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
          Lexamplify ensures the security and privacy of your data with industry-leading measures.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-foreground text-white p-8 rounded-xl">
            <Clock className="w-8 h-8 mb-6 mx-auto" />
            <h3 className="text-xl font-bold mb-4">Zero Data Retention</h3>
            <p className="text-white/80 leading-relaxed">
              We enforce a strict zero-data-retention policy.
            </p>
          </div>
          
          <div className="bg-foreground text-white p-8 rounded-xl">
            <MessageSquare className="w-8 h-8 mb-6 mx-auto" />
            <h3 className="text-xl font-bold mb-4">Enterprise-Grade Security</h3>
            <p className="text-white/80 leading-relaxed">
              Industry level protection with SAML and SSO authentication.
            </p>
          </div>
          
          <div className="bg-foreground text-white p-8 rounded-xl">
            <Search className="w-8 h-8 mb-6 mx-auto" />
            <h3 className="text-xl font-bold mb-4">Controlled Data Residency</h3>
            <p className="text-white/80 leading-relaxed">
              Strict geographical data residency measures for data processing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 