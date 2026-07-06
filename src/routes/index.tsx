import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Verifies } from "@/components/site/Verifies";
import { AttestationSample } from "@/components/site/AttestationSample";
import { BuyersAgents } from "@/components/site/BuyersAgents";
import { Stats } from "@/components/site/Stats";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Verifies />
        <AttestationSample />
        <BuyersAgents />
        <Stats />
      </main>
      <Footer />
    </div>
  );
}
