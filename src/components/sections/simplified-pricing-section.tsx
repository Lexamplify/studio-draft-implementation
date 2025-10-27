
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SimplifiedPricingSection = () => {
  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing for Your Practice
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the plan that fits your firm's needs, from solo practitioners to large enterprises. No hidden fees, no surprises.
          </p>

          {/* Plan Tabs */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="bg-white px-8 py-4 rounded-xl shadow-md border-2 border-primary/20">
              <span className="text-xl font-semibold text-foreground">Solo Practitioner</span>
            </div>
            <div className="bg-white px-8 py-4 rounded-xl shadow-md border-2 border-primary/20">
              <span className="text-xl font-semibold text-foreground">Law Firm & Enterprise</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button asChild size="lg" className="group text-lg py-3 px-8">
            <Link href="/pricing">
              View All Plans & Features
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SimplifiedPricingSection;


