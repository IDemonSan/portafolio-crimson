"use client"

import { motion } from "framer-motion"
import { Calendar, CheckCircle, ArrowRight } from "lucide-react"
import type { Experience, Profile } from "@/types"
import experienceData from "@/data/experience.json"
import profileData from "@/data/profile.json"
import { useTranslations } from "@/components/language-provider"

const experiences = experienceData as Experience[]
const profile = profileData as Profile

function ExperienceItem({
  experience,
  index,
  isLast,
  t,
}: {
  experience: Experience
  index: number
  isLast: boolean
  t: (key: string) => string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.12,
        ease: "easeOut",
      }}
      className="relative pl-10 md:pl-12 pb-12 group last:pb-0"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] md:left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-accent-crimson/40 via-accent-crimson/10 to-transparent group-hover:via-accent-crimson/30 transition-colors" />
      )}

      {/* Timeline dot */}
      <div className="absolute left-0 md:left-1 top-1.5 w-[30px] h-[30px] rounded-full bg-bg-card border-2 border-accent-crimson/40 flex items-center justify-center group-hover:border-accent-crimson transition-colors duration-300">
        <div className="w-2.5 h-2.5 rounded-full bg-accent-crimson group-hover:scale-125 transition-transform duration-300" />
      </div>

      {/* Content card */}
      <div className="glass-card p-6 group-hover:border-accent-crimson/20 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-primary">{experience.role}</h3>
            <p className="text-accent-crimson font-medium text-sm">{experience.company}</p>
          </div>
          <div className="flex items-center gap-1.5 text-muted text-sm">
            <Calendar className="w-4 h-4" />
            <span>{experience.period}</span>
          </div>
        </div>

        {/* Description narrative */}
        <p className="text-secondary mb-5 leading-relaxed">{experience.description}</p>

        {/* Highlights */}
        <div className="space-y-2.5 mb-5">
          {experience.highlights.map((highlight, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-secondary">
              <CheckCircle className="w-4 h-4 text-accent-crimson mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{highlight}</span>
            </div>
          ))}
        </div>

        {/* Technologies */}
        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-theme">
          <span className="text-xs text-muted mr-1 self-center">{t("experience.stack")}</span>
          {experience.technologies.map((tech) => (
            <span key={tech} className="tech-tag">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function ExperienceSection() {
  const { t } = useTranslations()
  return (
    <section id="experience" className="section bg-bg-secondary/30">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <h2 className="section-title">{t("experience.title")}</h2>
          <p className="section-subtitle">
            {t("experience.subtitle")}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {experiences.map((exp, index) => (
            <ExperienceItem
              key={exp.id}
              experience={exp}
              index={index}
              isLast={index === experiences.length - 1}
              t={t}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <a href={profile.resumeUrl} download className="btn-outline group">
            {t("experience.cta")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
