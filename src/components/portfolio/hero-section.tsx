import { siteConfig } from "@/data/portfolio";
import FadeIn from "@/components/portfolio/fade-in";
import { MapPin, Code2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="section min-h-[80vh] flex items-center justify-center"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
        <FadeIn>
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mb-6 shadow-lg">
              {siteConfig.initials}
            </div>

            {/* Name */}
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
              {siteConfig.name}
            </h1>

            {/* Title */}
            <div className="flex items-center gap-4 text-lg text-muted mb-6">
              <span className="flex items-center gap-1.5">
                <Code2 size={18} />
                {siteConfig.title}
              </span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={18} />
                {siteConfig.location}
              </span>
            </div>

            {/* CTA hint */}
            <p className="text-muted text-sm">
              欢迎联系，简历私聊
            </p>

            {/* Scroll hint */}
            <div className="mt-12 animate-bounce">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-stone-400"
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
