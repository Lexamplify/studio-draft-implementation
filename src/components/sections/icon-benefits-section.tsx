
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, Edit3, FolderGit2 } from "lucide-react"; 

const benefits = [
  {
    icon: <Navigation className="h-10 w-10 text-primary" />,
    title: "Intuitive Navigation",
    description: "Easily find the tools and information you need with a clear, user-friendly interface designed for legal professionals.",
  },
  {
    icon: <Edit3 className="h-10 w-10 text-primary" />,
    title: "Streamlined Case Workflow",
    description: "Manage your cases from start to finish with tools that simplify drafting, research, and client communication.",
  },
  {
    icon: <FolderGit2 className="h-10 w-10 text-primary" />,
    title: "Organized Document Hub",
    description: "Keep all your case documents, notes, and correspondence securely organized and accessible anytime, anywhere.",
  },
];

const IconBenefitsSection = () => {
  return (
    <section id="icon-benefits" className="bg-[#E9EEF5] text-foreground"> 
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary font-heading">
            Effortless Navigation, Simple & Intuitive
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto font-body">
            Lexamplify is designed to be powerful yet easy to use, ensuring you can focus on your legal work, not on learning complex software.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl border-transparent hover:border-primary/30">
              <CardHeader className="items-center text-center pt-8">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                  {benefit.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-foreground font-heading">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center px-6 pb-8">
                <p className="text-muted-foreground text-sm font-body">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IconBenefitsSection;
