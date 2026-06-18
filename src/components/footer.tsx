"use client"

import { Github, Linkedin, Mail } from "lucide-react"
import { usePathname } from "next/navigation"
import type { Profile } from "@/types"
import profileData from "@/data/profile.json"
import { useTranslations } from "@/components/language-provider"

const profile = profileData as Profile

export function Footer() {
  const { t } = useTranslations()
  const pathname = usePathname()
  // Hide footer on admin pages
  if (pathname?.startsWith("/admin")) return null
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-theme bg-bg-primary/50">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-2">{profile.name}</h3>
            <p className="text-sm text-secondary">{profile.title}</p>
            <p className="text-xs text-muted mt-1">{profile.location}</p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-primary mb-4 text-sm tracking-wider uppercase">
              {t("footer.nav")}
            </h4>
            <ul className="space-y-2 text-sm text-secondary">
              {[
                { labelKey: "nav.home", href: "#hero" },
                { labelKey: "nav.experience", href: "#experience" },
                { labelKey: "nav.projects", href: "#projects" },
                { labelKey: "nav.stack", href: "#tech" },
                { labelKey: "nav.contact", href: "#contact" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-accent-crimson transition-colors"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-primary mb-4 text-sm tracking-wider uppercase">
              {t("footer.connect")}
            </h4>
            <div className="flex gap-3">
              <a
                href={profile.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-theme bg-bg-card hover:border-accent-crimson/30 hover:text-accent-crimson hover:bg-accent-crimson-subtle transition-all"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href={profile.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-theme bg-bg-card hover:border-accent-crimson/30 hover:text-accent-crimson hover:bg-accent-crimson-subtle transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="p-2.5 rounded-xl border border-theme bg-bg-card hover:border-accent-crimson/30 hover:text-accent-crimson hover:bg-accent-crimson-subtle transition-all"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-theme pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {year} {profile.name}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}
