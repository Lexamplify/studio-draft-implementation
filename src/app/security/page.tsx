'use client';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Shield, Lock, Database, FileCheck, Server, Key } from 'lucide-react';

export default function SecurityPage() {
  return (
    <main className="flex-grow">
      <Header />
      
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-primary/20 rounded-full">
                  <Shield className="h-24 w-24 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Security Architecture
              </h1>
              <p className="text-xl text-gray-300">
                Your data security is our top priority
              </p>
            </div>

            <div className="space-y-12">
              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Bank-Grade Encryption</h2>
                    <p className="text-gray-300 leading-relaxed">
                      All data at rest and in transit is secured using AES-256 encryption, 
                      the same standard used by financial institutions. Your sensitive legal 
                      documents are protected with military-grade security protocols.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <Database className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Data Isolation</h2>
                    <p className="text-gray-300 leading-relaxed">
                      Each firm's data is completely isolated in its own secure vault. 
                      There is no cross-contamination between different clients or firms. 
                      Your confidential client information never mingles with other organizations' data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <FileCheck className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">You Own Your Data</h2>
                    <p className="text-gray-300 leading-relaxed">
                      You are the data owner. We are the processor. You maintain complete control 
                      over your data and can export it at any time. Our platform ensures your 
                      data remains yours, with full transparency and access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <Server className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Secure Infrastructure</h2>
                    <p className="text-gray-300 leading-relaxed">
                      Our infrastructure is built on industry-leading cloud platforms with 
                      SOC 2 Type II compliance, regular security audits, and 99.9% uptime guarantees. 
                      We follow strict access control policies and maintain comprehensive audit logs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <Key className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold mb-3">Access Control</h2>
                    <p className="text-gray-300 leading-relaxed">
                      Multi-factor authentication ensures only authorized personnel can access 
                      your data. Role-based access control allows you to manage permissions 
                      within your firm, ensuring the right people see the right information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-400 mb-4">
                Have security questions? We're here to help.
              </p>
              <p className="text-gray-300">
                Contact us at <a href="mailto:security@lexamplify.com" className="text-primary hover:underline">security@lexamplify.com</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}


