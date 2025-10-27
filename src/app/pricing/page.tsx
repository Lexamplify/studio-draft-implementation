'use client';

import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  const plans = [
    {
      name: 'Solo Plan',
      price: '$99',
      period: '/month',
      description: 'For solo practitioners and small teams.',
      cta: 'Start Free Trial',
      popular: false,
      features: [
        '1 User',
        'Full AI Assistant',
        'Up to 5 Cases',
        'Smart Calendar',
        'Basic Templates',
        'Email Support',
        '14-Day Free Trial',
      ],
    },
    {
      name: 'Firm Plan',
      price: '$199',
      period: '/user/month',
      description: 'For growing firms that need collaboration.',
      cta: 'Get Started',
      popular: true,
      features: [
        'Unlimited Users',
        'Unlimited Cases',
        'Shared Templates',
        'Team Collaboration',
        'Advanced AI Features',
        'Priority Support',
        'Custom Integrations',
        '14-Day Free Trial',
      ],
    },
    {
      name: 'Enterprise Plan',
      price: 'Custom',
      period: '',
      description: 'For large firms with custom security and data needs.',
      cta: 'Contact Sales',
      popular: false,
      features: [
        'Everything in Firm',
        'Dedicated AI Models',
        'On-prem Options',
        'Custom Integrations',
        '24/7 Support',
        'Dedicated Account Manager',
        'Custom SLAs',
      ],
    },
  ];

  return (
    <main className="flex-grow">
      <Header />
      
      <section className="bg-background py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Find the Plan That Fits Your Practice
            </h1>
            <p className="text-lg text-muted-foreground">
              All plans start with a 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-2 border-primary shadow-xl scale-105' : 'border'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    size="lg"
                    className="w-full mb-6"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    <Link href="/login">{plan.cta}</Link>
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


