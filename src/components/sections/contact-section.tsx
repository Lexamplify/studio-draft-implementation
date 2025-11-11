"use client";

import { ContactForm } from "@/components/contact-form";
import { Mail, MapPin, MessageSquareHeart } from "lucide-react";
import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ContactSection = () => {
  const { toast } = useToast();
  const [demoEmail, setDemoEmail] = useState("");
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!demoEmail || !demoEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingDemo(true);
    try {
      const demoData = {
        email: demoEmail,
        inquiryType: "Demo",
        source: "demo-banner",
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "contacts"), demoData);
      console.log("Demo request saved to Firestore");

      toast({
        title: "Demo Request Submitted!",
        description: "We'll be in touch shortly to schedule your demo.",
      });

      setDemoEmail("");
    } catch (error) {
      console.error("Error saving demo request:", error);
      toast({
        title: "Error",
        description: "Failed to submit demo request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  return (
    <section id="contact" className="bg-background"> 
      <div className="container mx-auto px-6">
        {/* Book a Demo Banner */}
        <div className="mb-16 rounded-3xl bg-black text-white p-10 md:p-16 text-center">
          <h3 className="text-4xl md:text-5xl font-heading mb-6">Book a Demo</h3>
          <form onSubmit={handleDemoSubmit} className="mx-auto max-w-xl flex flex-col sm:flex-row items-stretch gap-3">
            <input 
              type="email" 
              placeholder="name@firm.com" 
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              className="flex-1 rounded-full bg-neutral-900 border border-white/10 px-5 py-3.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20" 
              required
            />
            <button 
              type="submit"
              disabled={isSubmittingDemo}
              className="rounded-full bg-white text-black px-6 py-3.5 font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmittingDemo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        </div>
        <div className="text-center mb-16">
          {/* <div className="flex justify-center mb-4 animate-fade-in">
             <MessageSquareHeart className="h-12 w-12 text-primary" />
           </div> */}
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary animate-fade-in">
            Ready to Amplify Your Practice?
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto animate-slide-in-up animation-delay-300">
            Join the waitlist for early access, request a personalized demo, or simply share your thoughts. We're eager to connect with you!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
          {/* Left Card: Contact Details */}
          <div className="flex flex-col h-full space-y-8 bg-primary text-primary-foreground p-8 sm:p-10 rounded-xl shadow-lg animate-fade-in animation-delay-300"> 
            <div>
              <h3 className="text-2xl font-serif font-semibold text-primary-foreground mb-4">Contact Details</h3>
              <p className="text-primary-foreground/90 mb-6">
                Reach out to us via the form or through the channels below. We look forward to hearing from you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary-foreground" />
                  <a href="mailto:contact@lexamplify.com" className="text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                    contact@lexamplify.com
                  </a>
                </div>
                 <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                  <span className="text-primary-foreground">New Delhi, India</span>
                </div>
              </div>
            </div>
            <div className="flex-grow"></div> {/* Spacer to push content up if card is taller */}
            {/* Connect Hours section removed */}
          </div>

          {/* Right Card: Form */}
          <div className="bg-card p-0 rounded-xl shadow-xl overflow-hidden border border-border animate-fade-in animation-delay-300"> 
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

