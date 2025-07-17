
import Image from "next/image";

/* const logos = [
  { name: "Legal Firm One", src: "https://placehold.co/150x60.png?text=Firm+Alpha", dataAiHint: "law firm logo" },
  { name: "Tech Innovators Co.", src: "https://placehold.co/150x60.png?text=InnovateLLP", dataAiHint: "tech company logo" },
  { name: "Corporate Solutions Ltd.", src: "https://placehold.co/150x60.png?text=CorpLegal+Global", dataAiHint: "corporate logo" },
  { name: "Advocate Chambers Group", src: "https://placehold.co/150x60.png?text=Chambers+United", dataAiHint: "legal chambers logo" },
  { name: "Justice Tech", src: "https://placehold.co/150x60.png?text=JusticeTech", dataAiHint: "legal tech logo" },
]; */

const TrustedBySection = () => {
  return (
    <section id="trusted-by" className="py-16 bg-[#F9FBFD]"> 
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-4 font-heading">
          Why Lexamplify?
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-12 max-w-2xl mx-auto font-body">
          We are committed to empowering legal professionals with tools that are not just technologically advanced, but also intuitive and deeply integrated into the realities of legal practice in India.
        </p>
        
      </div>
    </section>
  );
};

export default TrustedBySection;
