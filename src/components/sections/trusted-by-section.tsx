
import Image from "next/image";
import { Clock, MessageSquare, Search } from "lucide-react";

/* const logos = [
  { name: "Legal Firm One", src: "https://placehold.co/150x60.png?text=Firm+Alpha", dataAiHint: "law firm logo" },
  { name: "Tech Innovators Co.", src: "https://placehold.co/150x60.png?text=InnovateLLP", dataAiHint: "tech company logo" },
  { name: "Corporate Solutions Ltd.", src: "https://placehold.co/150x60.png?text=CorpLegal+Global", dataAiHint: "corporate logo" },
  { name: "Advocate Chambers Group", src: "https://placehold.co/150x60.png?text=Chambers+United", dataAiHint: "legal chambers logo" },
  { name: "Justice Tech", src: "https://placehold.co/150x60.png?text=JusticeTech", dataAiHint: "legal tech logo" },
]; */

const TrustedBySection = () => {
  return (
    <section id="trusted-by" className="py-24 lg:py-32 bg-white"> 
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Security</span>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mt-4 font-heading">Built on Trust</h2>
          <p className="text-center text-muted-foreground text-lg mt-3 max-w-3xl mx-auto font-body">Lexamplify ensures the security and privacy of your data with industry-leading measures.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#0b2575] text-white rounded-3xl p-8 shadow-2xl min-h-[200px] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><Clock className="h-5 w-5" /></span>
              <div className="text-2xl font-semibold font-heading">Zero Data Retention</div>
            </div>
            <p className="text-white/80 leading-relaxed">We enforce a strict zero-data-retention policy.</p>
          </div>
          <div className="bg-[#0b2575] text-white rounded-3xl p-8 shadow-2xl min-h-[200px] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><MessageSquare className="h-5 w-5" /></span>
              <div className="text-2xl font-semibold font-heading">Enterprise-Grade Security</div>
            </div>
            <p className="text-white/80 leading-relaxed">Industry level protection with SAML and SSO authentication.</p>
          </div>
          <div className="bg-[#0b2575] text-white rounded-3xl p-8 shadow-2xl min-h-[200px] flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><Search className="h-5 w-5" /></span>
              <div className="text-2xl font-semibold font-heading">Controlled Data Residency</div>
            </div>
            <p className="text-white/80 leading-relaxed">Strict geographical data residency measures for data processing.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
