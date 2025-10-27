import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border-light">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Lexamplify
            </h1>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Button className="bg-foreground hover:bg-foreground/90 text-white rounded-lg">
              Login
            </Button>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;