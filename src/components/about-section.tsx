"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Briefcase, Building2, Map, Code, Layers, GraduationCap, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile, Metric } from "@/types"
import profileData from "@/data/profile.json"
import { useTranslations } from "@/components/language-provider"

const profile = profileData as Profile

function SkillsSection() {
  const { t } = useTranslations()
  const visibleCount = profile.visibleSkillsCount || 0
  const [showAll, setShowAll] = useState(false)
  const skills = profile.skills || []
  const displayedSkills = showAll || visibleCount === 0 ? skills : skills.slice(0, visibleCount)
  const hasMore = visibleCount > 0 && skills.length > visibleCount

  if (skills.length === 0) return null

  return (
    <div className="mt-6 pt-6 border-t border-theme">
      <h4 className="text-sm font-semibold text-primary mb-3">
        {t("about.skills")}
      </h4>
      <div className="flex flex-wrap gap-2">
        {displayedSkills.map((skill) => (
          <span key={skill} className="tech-tag text-xs">
            {skill}
          </span>
        ))}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="tech-tag text-xs cursor-pointer hover:border-accent-crimson/30 flex items-center gap-1"
          >
            +{skills.length - visibleCount} {t("about.showMore")}
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
        {showAll && hasMore && (
          <button
            onClick={() => setShowAll(false)}
            className="tech-tag text-xs cursor-pointer hover:border-accent-crimson/30 flex items-center gap-1"
          >
            {t("about.showLess")}
            <ChevronUp className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

const metrics: Metric[] = profile.aboutMetrics || []

const iconMap: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  building: Building2,
  code: Code,
  map: Map,
  layers: Layers,
}

const spanMap: Record<string, string> = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-2",
  lg: "col-span-1 md:col-span-3",
  xl: "col-span-1 md:col-span-4",
}

export function AboutSection() {
  const { t } = useTranslations()
  return (
    <section id="about" className="section">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <h2 className="section-title">{t("about.title")}</h2>
          <p className="section-subtitle">{t("about.subtitle")}</p>
        </motion.div>

        {/* Bio + Metrics side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-8 h-full">
              <h3 className="text-lg font-bold text-primary mb-4">
                {profile.name}
              </h3>
              <p className="text-secondary leading-relaxed mb-4">
                {profile.bio}
              </p>
              {profile.philosophyQuote && (
                <p className="text-secondary leading-relaxed mb-4">
                  Mi filosofía:{" "}
                  <em className="text-accent-crimson">
                    &ldquo;{profile.philosophyQuote}&rdquo;
                  </em>
                  .
                </p>
              )}
              {profile.bioExtra && (
                <p className="text-secondary leading-relaxed">
                  {profile.bioExtra}
                </p>
              )}

              {/* Education */}
              {profile.education.length > 0 && (
                <div className="mt-8 pt-6 border-t border-theme">
                  <h4 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-accent-crimson" />
                    {t("about.education")}
                  </h4>
                  {profile.education.map((edu) => (
                    <div
                      key={edu.institution}
                      className="flex items-start gap-3 mb-3 last:mb-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-accent-crimson mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {edu.degree}
                        </p>
                        <p className="text-xs text-muted">
                          {edu.institution} · {edu.period} · {edu.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <SkillsSection />
            </div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {metrics.map((metric, index) => {
                const Icon = iconMap[metric.icon] || Code
                const span = spanMap[metric.span || "sm"]

                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                    className={cn(
                      "glass-card p-5 group relative overflow-hidden",
                      span,
                      "lg:col-span-1"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                        metric.accent === "crimson"
                          ? "bg-gradient-to-br from-accent-crimson/5 to-transparent"
                          : metric.accent === "ember"
                            ? "bg-gradient-to-br from-accent-ember/5 to-transparent"
                            : "bg-gradient-to-br from-bg-hover/50 to-transparent"
                      )}
                    />
                    <div className="relative z-10 flex items-start gap-4">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0",
                          metric.accent === "crimson"
                            ? "bg-accent-crimson-subtle text-accent-crimson"
                            : metric.accent === "ember"
                              ? "bg-accent-ember-subtle text-accent-ember"
                              : "bg-bg-elevated text-secondary"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-muted font-medium tracking-wider uppercase mb-0.5">
                          {metric.title}
                        </div>
                        <h3 className="text-2xl font-bold text-primary mb-1 tracking-tight">
                          {metric.value}
                        </h3>
                        <p className="text-xs text-secondary leading-relaxed">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
