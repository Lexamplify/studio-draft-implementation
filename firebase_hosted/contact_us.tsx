import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactUs = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="bg-primary p-12 rounded-2xl text-white">
            <h2 className="font-serif text-4xl font-bold">
              Contact Details
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Reach out to us via the form or through the channels below. We look forward to hearing from you.
            </p>
            <div className="mt-10 space-y-6">
              <div className="flex items-center gap-x-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:contact@lexamplify.com" className="text-lg">
                  contact@lexamplify.com
                </a>
              </div>
              <div className="flex items-center gap-x-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg">New Delhi, India</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-12 rounded-2xl">
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="full-name" className="block text-sm font-semibold leading-6 text-gray-900">
                    Full Name
                  </label>
                  <div className="mt-2.5">
                    <Input
                      type="text"
                      name="full-name"
                      id="full-name"
                      autoComplete="name"
                      placeholder="e.g., Rohan Sharma"
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900">
                    Email Address
                  </label>
                  <div className="mt-2.5">
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      placeholder="e.g., rohan.sharma@example.com"
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="primary-interest" className="block text-sm font-semibold leading-6 text-gray-900">
                    Primary Interest
                  </label>
                  <div className="mt-2.5">
                    <select
                      id="primary-interest"
                      name="primary-interest"
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    >
                      <option>Join Waitlist for Early Access</option>
                      <option>Request a Personalized Demo</option>
                      <option>Share Your Thoughts</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                    Your Message
                  </label>
                  <div className="mt-2.5">
                    <Textarea
                      name="message"
                      id="message"
                      rows={4}
                      placeholder="Tell us how we can help, or any specific questions you have..."
                      className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
