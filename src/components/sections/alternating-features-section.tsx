
import Image from "next/image";

const AlternatingFeaturesSection = () => {
  return (
    <section id="alternating-features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Personalized AI */}
        <div className="mb-32">
          <div className="text-left mb-16">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="bg-muted rounded-xl w-full flex items-center justify-center p-4">
                <div className="relative w-full h-72 md:h-96 lg:h-[520px]">
                  <Image src="/Images/Intelligent_Search (1).png" alt="AI Assistant & Intelligent Search" fill className="object-contain rounded-xl" />
                </div>
              </div>
              
              <div>
              <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">AI Assistant & Intelligent Search</div>

                <h2 className="font-serif text-4xl lg:text-6xl font-bold mb-8 text-foreground leading-tight">Your Intelligent Legal Research Partner</h2>
                <p className="text-xl text-muted-foreground leading-relaxed mb-6">Chat with an intelligent AI assistant trained on Indian law. Get instant answers to legal queries, case law summaries, document analysis, and strategic advice.</p>
                <p className="text-xl text-muted-foreground leading-relaxed">Our AI-powered research engine scans millions of documents in seconds, delivering accurate and contextually relevant case law, statutes, and legal articles. All results are grounded in verified legal sources for maximum reliability. Your AI partner is available 24/7 to support your practice.</p>
              </div>
              
     
            </div>
          </div>
        </div>

        {/* Intelligent Search (content left, image right) */}
        <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
          <div>
            <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">Intelligent Search</div>
            <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">Rapid Research, Grounded Results</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">Our AI-powered research engine scans millions of documents in seconds, delivering accurate and contextually relevant case law, statutes, and legal articles. All results are grounded in verified legal sources for maximum reliability.</p>
          </div>
          <div className="bg-muted rounded-xl w-full flex items-center justify-center p-4">
            <div className="relative w-full h-72 md:h-96 lg:h-[520px]">
              <Image src="/Images/Intelligent_Search (1).png" alt="Intelligent Search" fill className="object-contain rounded-xl" />
            </div>
          </div>
        </div>

        {/* Efficient Drafting (image left, content right) */}
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="bg-muted rounded-xl w-full flex items-center justify-center p-4">
            <div className="relative w-full h-72 md:h-96 lg:h-[520px]">
              <Image src="/Images/Effecient_Draft (1).png" alt="Efficient Drafting" fill className="object-contain rounded-xl" />
            </div>
          </div>
          <div>
            <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">Efficient Drafting</div>
            <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">Automated Document Drafting</h3>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">Generate precise first drafts of legal documents, from notices to petitions, in minutes. Our AI understands Indian legal nuances, helping you save time and reduce errors in your drafting process.</p>
          </div>
        </div>

        {/* Organized Workflow (content left, image right) */}
        <div className="mt-32">
          <div className="text-left mb-16">
            <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">Organized Workflow</div>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">Strategic Case Management</h3>
                <p className="text-xl text-muted-foreground leading-relaxed">Organize case files, track deadlines, and manage client communication effortlessly. Lexamplify provides a centralized hub for all your case-related activities, ensuring nothing falls through the cracks.</p>
              </div>
              <div className="bg-muted rounded-xl w-full flex items-center justify-center p-4">
                <div className="relative w-full h-72 md:h-96 lg:h-[520px]">
                  <Image src="/Images/Organized_Workflow (1).png" alt="Organized Workflow" fill className="object-contain rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlternatingFeaturesSection;
