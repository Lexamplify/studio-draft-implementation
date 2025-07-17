
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const founders = [
  {
    name: "Saurabh Bishnoi",
    role: "Tech Lead & AI Architect",
    imageUrl: "https://placehold.co/300x300.png",
    dataAiHint: "male professional portrait",
    bio: "Expert in AI development and scalable system architecture, driving Lexamplify's technological innovation.",
  },
  {
    name: "Yashraj Singh",
    role: "Research Lead (AI/ML PhD)",
    imageUrl: "https://placehold.co/300x300.png",
    dataAiHint: "male academic portrait",
    bio: "Specializes in NLP and machine learning, bridging cutting-edge research with practical legal tech solutions for India.",
  },
  {
    name: "Yugesh Kumar",
    role: "Business & Operations (MBA)",
    imageUrl: "https://placehold.co/300x300.png",
    dataAiHint: "male business portrait",
    bio: "Oversees business strategy, operations, and market growth, ensuring Lexamplify meets the evolving needs of legal professionals.",
  },
];

const AboutUsSection = () => {
  return (
    <section id="about" className="bg-secondary text-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
             <Users className="h-12 w-12 text-primary" />
           </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">
            Meet the Visionaries Behind Lexamplify
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
            Founded by three engineers united by a passion for legal technology and a shared history of innovation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {founders.map((founder) => (
            <Card key={founder.name} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 bg-card rounded-xl">
              <CardHeader className="pt-8">
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-primary/20 shadow-md">
                  <Image
                    src={founder.imageUrl}
                    alt={founder.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={founder.dataAiHint}
                  />
                </div>
                <CardTitle className="font-sans text-xl font-semibold text-foreground">{founder.name}</CardTitle>
                <p className="text-primary font-medium text-sm">{founder.role}</p>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <p className="text-muted-foreground text-sm">{founder.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center bg-card p-8 md:p-12 rounded-xl shadow-xl border border-border">
          <h3 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
            Our Origin Story
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-4">
            As college friends, we embarked on a journey to address real-world challenges within the Indian legal system. Lexamplify is born from our shared vision to empower legal professionals through transformative technology, making justice more accessible and efficient for all.
          </p>
          <p className="mt-4 text-sm text-accent-foreground font-medium bg-accent/10 text-accent px-4 py-2 rounded-md inline-block">
            Fun Fact: Our collaboration began with an award-winning project during a national-level college hackathon!
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
