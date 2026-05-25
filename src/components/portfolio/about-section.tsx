import { siteConfig, bio } from "@/data/portfolio";
import FadeIn from "@/components/portfolio/fade-in";
import { MapPin, Mail, ExternalLink, MessageCircle } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            关于我
          </h2>
          <p className="text-center text-muted mb-10">
            一些个人介绍
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100">
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {siteConfig.initials}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{siteConfig.name}</h3>
                  <p className="text-sm text-muted">{siteConfig.title}</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                {bio.summary}
              </p>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span>{siteConfig.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MessageCircle size={16} className="text-primary shrink-0" />
                  <span>{siteConfig.status}</span>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-stone-100 mb-6" />

              {/* Contact links */}
              <div className="flex flex-col gap-3">
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-3 text-sm text-muted hover:text-primary transition-colors no-underline group"
                >
                  <span className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Mail size={16} className="text-primary" />
                  </span>
                  {siteConfig.email}
                </a>
                <a
                  href={siteConfig.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted hover:text-primary transition-colors no-underline group"
                >
                  <span className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <ExternalLink size={16} className="text-primary" />
                  </span>
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
