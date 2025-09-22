const ProductHighlights = () => {
    return (
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
  
          {/* Personalized AI Section */}
          <div className="mb-32">
            <div className="text-left mb-16">
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-8">
                Personalized AI
              </p>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="font-serif text-4xl lg:text-6xl font-bold mb-8 text-foreground leading-tight">
                    Tailored to Your Expertise
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Lexamplify adapts to your specific area of law, providing relevant insights, document templates, and case law that match your unique practice needs. Stop sifting through irrelevant information and focus on what matters.
                  </p>
                </div>
  
                {/* Image placeholder */}
                <div className="bg-muted rounded-xl h-50 w-full flex items-center justify-center p-4">
                  <img
                    src="src/components/ui/images/Personalized_AI.png"
                    alt="Personalized AI"
                    className="max-h-50 max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
  
          {/* Features Section */}
          <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
            <div className="bg-accent-muted rounded-xl p-12 lg:p-16">
              <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">
                Intelligent Search
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">
                Rapid Research, Grounded Results
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our AI-powered research engine scans millions of documents in seconds, delivering accurate and contextually relevant case law, statutes, and legal articles. All results are grounded in verified legal sources for maximum reliability.
              </p>
            </div>
  
            {/* Image placeholder */}
            <div className="bg-muted rounded-xl h-64 w-full flex items-center justify-center p-4">
              <img
                src="src/components/ui/images/Intelligent_Search.png"
                alt="Outlook Interface Mockup"
                className="max-h-82 max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
  
          {/* Document Consistency Section */}
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            {/* Image placeholder */}
            <div className="bg-muted rounded-xl h-64 w-full flex items-center justify-center p-4">
              <img
                src="src/components/ui/images/Effecient_Draft.png"
                alt="Document Analysis Interface"
                className="max-h-82 max-w-full object-contain rounded-xl"
              />
            </div>
  
            <div className="order-1 lg:order-2">
              <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">
                Efficient Drafting
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">
                Automated Document Drafting
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Generate precise first drafts of legal documents, from notices to petitions, in minutes. Our AI understands Indian legal nuances, helping you save time and reduce errors in your drafting process.
              </p>
            </div>
          </div>
  
          {/* Projects Section */}
          <div className="mt-32">
            <div className="text-left mb-16">
              <div className="bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-8">
                Organized Workflow
              </div>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">
                    Strategic Case Management
                  </h3>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Organize case files, track deadlines, and manage client communication effortlessly. Lexamplify provides a centralized hub for all your case-related activities, ensuring nothing falls through the cracks.
                  </p>
                </div>
  
                {/* Image placeholder */}
                <div className="bg-muted rounded-xl h-64 w-full flex items-center justify-center p-4">
                  <img
                    src="src/components/ui/images/Organized_Workflow.png"
                    alt="Project Dashboard Mockup"
                    className="max-h-82 max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
  
        </div>
      </section>
    );
  };
  
  export default ProductHighlights;