'use client';

import { Shield, Lock, Database, Globe, CheckCircle2, FileLock } from 'lucide-react';

const securityFeatures = [
  {
    icon: <Shield className="h-12 w-12" />,
    title: 'Zero Data Retention',
    description: 'We enforce a strict zero-data-retention policy ensuring your client information is never stored beyond necessary processing time.',
  },
  {
    icon: <Lock className="h-12 w-12" />,
    title: 'Enterprise-Grade Security',
    description: 'Industry-level protection with SAML and SSO authentication. Your data is protected with multi-layered security protocols.',
  },
  {
    icon: <Globe className="h-12 w-12" />,
    title: 'Controlled Data Residency',
    description: 'Strict geographical data residency measures ensuring your data stays within your jurisdiction and complies with local regulations.',
  },
  {
    icon: <Database className="h-12 w-12" />,
    title: 'AES-256 Encryption',
    description: 'Bank-grade encryption for data at rest and in transit. Your confidential information is protected with military-grade security.',
  },
  {
    icon: <CheckCircle2 className="h-12 w-12" />,
    title: 'SOC 2 Compliant',
    description: 'Regular security audits and compliance certifications ensure we maintain the highest standards of data protection.',
  },
  {
    icon: <FileLock className="h-12 w-12" />,
    title: 'You Own Your Data',
    description: 'Complete data ownership. Export your data anytime, with full transparency and control over your information.',
  },
];

const certifications = [
  { name: 'SOC 2 Type II', status: 'Certified' },
  { name: 'ISO 27001', status: 'Compliant' },
  { name: 'GDPR Ready', status: 'Compliant' },
  { name: 'Data Encryption', status: 'AES-256' },
];

const SecuritySection = () => {
  return (
    <section id="security" className="bg-gradient-to-b from-slate-50 to-white py-24 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #0b2575 0px, #0b2575 1px, transparent 1px, transparent 42px, #0b2575 42px)`,
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Security & Compliance
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Built with Security at the Core
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your client's confidential information deserves the highest level of protection. 
            LexAmplify is built from the ground up with enterprise-grade security measures.
          </p>
        </div>

        {/* Main Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-fade-in animation-delay-300">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-all duration-300 group hover:scale-105"
            >
              <div className="flex items-center justify-center mb-4 p-3 bg-primary/10 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                <div className="text-primary">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-heading">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certification Badges 
        <div className="bg-slate-900 text-white rounded-3xl p-12 shadow-2xl animate-fade-in animation-delay-600">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <h3 className="text-3xl font-bold">Certified & Compliant</h3>
            </div>
            <p className="text-slate-300 text-lg">
              Audited by industry-leading security firms to ensure the highest standards of data protection.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 text-center"
              >
                <div className="text-2xl font-bold mb-2">{cert.name}</div>
                <div className="text-sm text-green-400 font-medium">{cert.status}</div>
              </div>
            ))}
          </div>
        </div>*/}

        {/* Security Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in animation-delay-900">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Enterprise Trust
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Trusted by law firms, legal departments, and enterprises handling highly sensitive information. 
              Our security architecture is battle-tested by some of the most security-conscious organizations.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Multi-factor authentication (MFA)
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Role-based access control
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Comprehensive audit logs
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Single Sign-On (SSO) support
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileLock className="h-6 w-6 text-green-600" />
              Privacy First
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Privacy isn't an afterthought—it's built into every layer of our platform. 
              We adhere to strict privacy policies that respect attorney-client privilege and data sovereignty.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Attorney-client privilege protection
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                No cross-client data contamination
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Configurable retention policies
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                GDPR & data protection compliant
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center animate-fade-in animation-delay-1200">
          <p className="text-muted-foreground mb-4">
            Have security questions? We're here to help.
          </p>
          <p className="text-lg font-semibold">
            Contact our security team at{' '}
            <a href="mailto:security@lexamplify.com" className="text-primary hover:underline">
              security@lexamplify.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
