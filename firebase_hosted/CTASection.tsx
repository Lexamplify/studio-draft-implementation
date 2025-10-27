import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CTASection = () => {
  return (
    <section id="contact" className="py-24">
      <div
        className="max-w-6xl mx-auto px-6 lg:px-8 text-center bg-black py-24"
        style={{ borderRadius: "30px" }}
      >
        <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl">
          Book a Demo
        </h2>
        <form className="mt-10 max-w-md mx-auto flex flex-col gap-4 sm:flex-row">
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>
          <Input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
            placeholder="louis@pearson-hardman.com"
          />
          <Button
            type="submit"
            className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Submit
          </Button>
        </form>
      </div>
    </section>
  );
};

export default CTASection;