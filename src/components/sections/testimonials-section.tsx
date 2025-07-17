
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonial = {
  quote: "We are a future-focused law firm and have been looking for an AI solution that understands the Indian legal system. Lexamplify has been a game-changer – truly built by lawyers, for lawyers. It's a must-have for any modern Indian law firm.",
  name: "Mr. Rohan Mehra",
  title: "Managing Partner, Lex Legal Chambers",
  imageUrl: "https://placehold.co/800x600.png", // Using a larger placeholder for the side image
  dataAiHint: "modern office interior", // Hint for the background image, not a portrait
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="bg-secondary py-16 md:py-24">
      <div className="container mx-auto px-6">
        <Card className="bg-card text-card-foreground shadow-xl rounded-xl overflow-hidden md:grid md:grid-cols-2 items-center border-transparent">
          <div className="relative h-64 md:h-full w-full md:aspect-[3/4]">
            <Image
              src={testimonial.imageUrl}
              alt="Professional legal environment"
              layout="fill"
              objectFit="cover"
              data-ai-hint={testimonial.dataAiHint}
            />
          </div>
          <div className="p-8 md:p-12 lg:p-16">
            <Quote className="h-10 w-10 text-primary/60 mb-6" />
            <blockquote className="text-xl md:text-2xl font-medium text-foreground leading-relaxed mb-6">
              "{testimonial.quote}"
            </blockquote>
            <div className="mt-6">
              <p className="font-semibold text-lg text-foreground">{testimonial.name}</p>
              <p className="text-md text-primary">{testimonial.title}</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default TestimonialsSection;
