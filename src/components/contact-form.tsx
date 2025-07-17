
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, {message: "Name seems too long."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  inquiryType: z.enum(["Demo", "Waitlist", "Partnership", "Feedback", "Other"]),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(1000, { message: "Message must not exceed 1000 characters." }),
});

type ContactFormValues = z.infer<typeof formSchema>;

async function submitContactForm(data: ContactFormValues): Promise<{ success: boolean; message: string }> {
  console.log("Form data submitted:", data);
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (data.email.includes("fail")) {
    return { success: false, message: "Submission failed. Please try again." };
  }
  return { success: true, message: "Thank you for reaching out! We'll be in touch shortly." };
}


export function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      inquiryType: "Waitlist",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    try {
      const result = await submitContactForm(data);

      if (result.success) {
        toast({
          title: "Message Sent!",
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error:string) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 sm:p-10"> {/* Increased padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Rohan Sharma" {...field} className="bg-input focus:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground">Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g., rohan.sharma@example.com" {...field} className="bg-input focus:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Organization and Role fields removed */}
        <FormField
          control={form.control}
          name="inquiryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-card-foreground">Primary Interest</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input focus:ring-primary">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Waitlist">Join Waitlist for Early Access</SelectItem>
                  <SelectItem value="Demo">Request a Personalized Demo</SelectItem>
                  <SelectItem value="Partnership">Partnership Inquiry</SelectItem>
                  <SelectItem value="Feedback">Provide Feedback</SelectItem>
                  <SelectItem value="Other">Other Inquiry</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-card-foreground">Your Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us how we can help, or any specific questions you have..."
                  className="resize-none bg-input focus:ring-primary"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-3 transition-all duration-300 ease-in-out hover:shadow-lg group" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Send Message
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
