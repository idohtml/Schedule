import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AnimatedText } from "@/components/animated-text";
import { SOCIAL_LINKS } from "@/lib/constants";
import { FlipperLink } from "@/components/flipper-link";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center relative"
          style={{
            backgroundImage: "url('/apollo.avif')",
            maskImage: "url('/image-mask.svg')",
            WebkitMaskImage: "url('/image-mask.svg')",
            maskSize: "100% auto",
            WebkitMaskSize: "100% auto",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
        <div className="absolute bottom-0 left-40 p-4 text-white max-w-xl md:max-w-2xl lg:max-w-7xl">
          <AnimatedText
            text="Empowering businesses through modern technology, guided by precision, creativity, and innovation."
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 block"
          />
          <AnimatedText
            text="Inspired by Apollo, the God of knowledge and clarity, we bring forward-thinking digital solutions that help businesses grow with confidence."
            className="text-lg font-light block lg:max-w-prose text-muted"
            startDelay={1.05}
          />
        </div>
        <Button
          size="icon"
          variant="outline"
          className="absolute border-2 border-black cursor-pointer hover:bg-transparent size-16 rounded-full top-32 right-10"
        >
          <motion.div
            whileHover={{ rotate: -45, scale: 1.5 }}
            transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
          >
            <ArrowRightIcon className="size-10" />
          </motion.div>
        </Button>

        <div
          className="absolute bottom-0 left-0 p-4 flex items-center gap-4 z-50"
          style={{
            transform: "rotate(90deg) translateX(-100%)",
            transformOrigin: "bottom left",
          }}
        >
          {SOCIAL_LINKS.map((link) => (
            <Button asChild key={link.name} variant="link">
              <Link
                key={link.name}
                to={link.url}
                className="text-black text-2xl"
              >
                <FlipperLink>{link.name}</FlipperLink>
              </Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
