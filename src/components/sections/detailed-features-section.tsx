
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle, FileText, MessageSquare, BarChart2, CalendarClock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  imageAlt: string;
  dataAiHint: string;
  learnMoreLink: string;
}

const featureItems: FeatureItem[] = [
  {
    id: 'doc-automation',
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: 'Document Automation',
    description: 'Generate legal documents with AI precision.',
    longDescription: 'Rapidly create accurate first drafts of legal notices, petitions, affidavits, and more. Our AI understands Indian legal formats and requirements, significantly reducing drafting time and minimizing errors. Customize templates to fit your specific needs.',
    imageUrl: 'https://placehold.co/800x600.png?text=Doc+Automation+UI',
    imageAlt: 'Document Automation UI',
    dataAiHint: 'document generation interface',
    learnMoreLink: '#',
  },
  {
    id: 'legal-drafting',
    icon: <Brain className="h-6 w-6 text-primary" />, 
    title: 'AI Legal Drafting',
    description: 'Enhance your drafting with AI-powered suggestions.',
    longDescription: 'Go beyond templates with AI that suggests relevant clauses, checks for consistency, and helps refine your legal arguments within documents. Improve the quality and coherence of your legal writing with intelligent assistance.',
    imageUrl: 'https://placehold.co/800x600.png?text=AI+Drafting+UI',
    imageAlt: 'AI Legal Drafting UI',
    dataAiHint: 'ai writing assistant',
    learnMoreLink: '#',
  },
  {
    id: 'case-timeline',
    icon: <CalendarClock className="h-6 w-6 text-primary" />,
    title: 'Case Timeline',
    description: 'Visualize and manage case progress effectively.',
    longDescription: 'Track key dates, events, and deadlines with an interactive case timeline. Get a clear overview of case progress, set reminders, and ensure you never miss an important milestone. Share timelines with your team for better collaboration.',
    imageUrl: 'https://placehold.co/800x600.png?text=Case+Timeline+UI',
    imageAlt: 'Case Timeline UI',
    dataAiHint: 'gantt chart project',
    learnMoreLink: '#',
  },
  {
    id: 'ai-chat',
    icon: <MessageSquare className="h-6 w-6 text-primary" />,
    title: 'AI Chat Assistant',
    description: 'Get instant answers to your legal queries.',
    longDescription: 'Interact with an AI assistant trained on Indian law. Ask legal questions, get summaries of case law, or brainstorm legal strategies. Your AI chat partner is available 24/7 to support your research and analysis.',
    imageUrl: 'https://placehold.co/800x600.png?text=AI+Chat+UI',
    imageAlt: 'AI Chat UI',
    dataAiHint: 'chatbot interface conversation',
    learnMoreLink: '#',
  },
  {
    id: 'analytics',
    icon: <BarChart2 className="h-6 w-6 text-primary" />,
    title: 'Legal Analytics',
    description: 'Unlock data-driven insights for your practice.',
    longDescription: 'Gain valuable insights from past cases and legal trends. Understand success rates for different argument types, identify patterns in judgments, and make more informed strategic decisions for your cases and firm.',
    imageUrl: 'https://placehold.co/800x600.png?text=Analytics+Dashboard',
    imageAlt: 'Legal Analytics Dashboard',
    dataAiHint: 'data dashboard charts',
    learnMoreLink: '#',
  },
];

const DetailedFeaturesSection = () => {
  const [activeFeature, setActiveFeature] = useState<FeatureItem>(featureItems[0]);

  return (
    <section id="detailed-features" className="bg-background text-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            We have your back the whole way
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Lexamplify's comprehensive suite of AI-powered tools is designed to address every facet of your legal practice, simplifying complex tasks and enhancing your overall efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Left Column: Feature List */}
          <div className="md:col-span-1 space-y-2">
            {featureItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFeature(item)}
                className={cn(
                  "w-full text-left p-4 rounded-lg transition-all duration-200 ease-in-out flex items-start gap-3",
                  activeFeature.id === item.id
                    ? "bg-primary/10 shadow-md ring-2 ring-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <div className={cn("mt-1", activeFeature.id === item.id ? "text-primary" : "text-muted-foreground")}>
                  {item.icon}
                </div>
                <div>
                  <h4 className={cn("font-semibold mb-1", activeFeature.id === item.id ? "text-primary" : "text-foreground")}>{item.title}</h4>
                  <p className={cn("text-sm", activeFeature.id === item.id ? "text-primary/80" : "text-muted-foreground")}>{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Active Feature Details */}
          <div className="md:col-span-2">
            {activeFeature && (
              <div className="bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border/70">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-6 shadow-lg">
                  <Image
                    src={activeFeature.imageUrl}
                    alt={activeFeature.imageAlt}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={activeFeature.dataAiHint}
                    className="animate-fade-in"
                  />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-3">{activeFeature.title}</h3>
                <p className="text-muted-foreground mb-6 text-base leading-relaxed">{activeFeature.longDescription}</p>
                <Button asChild variant="default" className="group">
                  <Link href={activeFeature.learnMoreLink}>
                    <>
                      Learn More about {activeFeature.title}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailedFeaturesSection;
