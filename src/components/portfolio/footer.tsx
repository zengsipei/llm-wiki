import { siteConfig } from "@/data/portfolio";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white mt-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted">
        <p>
          &copy; {siteConfig.year} {siteConfig.name}
        </p>
        <p className="flex items-center gap-1">
          用 {siteConfig.builtWith} 构建
          <Heart size={12} className="text-red-400 fill-red-400" />
        </p>
      </div>
    </footer>
  );
}
