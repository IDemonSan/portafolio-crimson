export interface Metric {
  id: string
  title: string
  value: string
  description: string
  /** Icon identifier: briefcase, building, code, map, layers */
  icon: string
  accent?: "crimson" | "ember" | "none"
  span?: "sm" | "md" | "lg" | "xl"
}

export interface Profile {
  name: string
  initials: string
  title: string
  tagline: string
  subtitle: string
  /** Primary bio paragraph (shown first in About section) */
  bio: string
  /** Optional secondary bio paragraph (shown after philosophy quote) */
  bioExtra?: string
  /** Optional philosophy/motto quote displayed between bio paragraphs */
  philosophyQuote?: string
  /** Grid of metric cards displayed in About section */
  aboutMetrics?: Metric[]
  location: string
  email: string
  phone: string
  /** Support multiple emails — first is primary */
  emails?: string[]
  /** Support multiple phones — first is primary */
  phones?: string[]
  ruc: string
  rnpActive: boolean
  availability: string[]
  social: {
    github: string
    linkedin: string
    whatsapp: string
    portfolio: string
  }
  skills: string[]
  /** How many skills to show before a "See more" toggle (0 = show all) */
  visibleSkillsCount?: number
  education: Education[]
  resumeUrl: string
  /** URL for a custom logo/image shown in the header instead of initials */
  headerImage?: string
}

export interface Education {
  institution: string
  degree: string
  period: string
  status: string
}

export interface Experience {
  id: string
  role: string
  company: string
  period: string
  description: string
  highlights: string[]
  technologies: string[]
}

export interface ProjectLink {
  github?: string
  demo?: string
}

export interface Project {
  id: string
  title: string
  description: string
  problem: string
  solution: string
  technologies: string[]
  links?: ProjectLink
  badges?: string[]
  featured: boolean
}

export interface TechCategory {
  category: string
  icon: string
  items: TechItem[]
}

export interface TechItem {
  name: string
}
