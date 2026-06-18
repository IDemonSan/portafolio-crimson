"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  FolderKanban,
  Briefcase,
  User,
  Layers,
  LogOut,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Github,
  Settings,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = { message: string; type: "success" | "error" } | null

const TABS = [
  { id: "projects", label: "Proyectos", icon: FolderKanban },
  { id: "experience", label: "Experiencia", icon: Briefcase },
  { id: "profile", label: "Perfil", icon: User },
  { id: "techstack", label: "Stack Técnico", icon: Layers },
]

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("projects")
  const [data, setData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastType>(null)
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUser, setGithubUser] = useState<string | null>(null)
  const [repoOwner, setRepoOwner] = useState("")
  const [repoName, setRepoName] = useState("")
  const [repoBranch, setRepoBranch] = useState("")
  const [showRepoSettings, setShowRepoSettings] = useState(false)
  const router = useRouter()

  // Load data
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_token")
    if (!stored) {
      router.push("/admin/login")
      return
    }
    setToken(stored)

    fetch("/api/admin/data", {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No autorizado")
        return res.json()
      })
      .then((json) => {
        if (json.success) setData(json.data)
        else throw new Error(json.error)
      })
      .catch(() => {
        sessionStorage.removeItem("admin_token")
        router.push("/admin/login")
      })
      .finally(() => setLoading(false))
  }, [router])

  // Check GitHub connection status
  useEffect(() => {
    fetch("/api/admin/github/status")
      .then((r) => r.json())
      .then((res) => {
        if (res.connected) {
          setGithubConnected(true)
          setGithubUser(res.user)
        }
      })
      .catch(() => {})
  }, [])

  // Load repo config from sessionStorage
  useEffect(() => {
    const storedOwner = sessionStorage.getItem("github_repo_owner")
    const storedName = sessionStorage.getItem("github_repo_name")
    const storedBranch = sessionStorage.getItem("github_repo_branch")
    if (storedOwner) setRepoOwner(storedOwner)
    if (storedName) setRepoName(storedName)
    if (storedBranch) setRepoBranch(storedBranch)
  }, [])

  // Handle GitHub OAuth result from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const githubParam = params.get("github")
    const userParam = params.get("user")
    if (githubParam === "connected" && userParam) {
      setGithubConnected(true)
      setGithubUser(userParam)
      showToast(`✅ Conectado a GitHub como ${userParam}`, "success")
      // Clean URL without reloading
      window.history.replaceState({}, "", "/admin")
    } else if (githubParam === "error") {
      const reason = params.get("reason") || "unknown"
      showToast(`❌ Error conectando GitHub: ${reason}`, "error")
      window.history.replaceState({}, "", "/admin")
    }
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
  }

  const saveRepoConfig = () => {
    sessionStorage.setItem("github_repo_owner", repoOwner)
    sessionStorage.setItem("github_repo_name", repoName)
    sessionStorage.setItem("github_repo_branch", repoBranch)
    showToast("✅ Configuración de GitHub guardada", "success")
    setShowRepoSettings(false)
  }

  const saveFile = useCallback(
    async (file: string, content: any) => {
      if (!token) return
      setSaving(file)

      try {
        const res = await fetch("/api/admin/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            file,
            content,
            repoOwner,
            repoName,
            repoBranch,
          }),
        })

        const json = await res.json()

        if (json.success) {
          if (json.downloadable) {
            // Production mode - offer file download
            const blob = new Blob([json.content], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = window.document.createElement("a")
            a.href = url
            a.download = json.filename
            a.click()
            URL.revokeObjectURL(url)
            // Show the actual error/reason from the API
            showToast(json.message || `⚠️ ${file} exportado. Descárgalo y haz commit manualmente.`, "error")
          } else {
            showToast(`✅ ${file} guardado correctamente`, "success")
            // Update local data
            setData((prev) => ({ ...prev, [file.replace(".json", "")]: content }))
          }
        } else {
          showToast(`❌ Error: ${json.error}`, "error")
        }
      } catch {
        showToast("❌ Error de conexión al guardar", "error")
      } finally {
        setSaving(null)
      }
    },
    [token]
  )

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-crimson animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-elevated-dark flex items-center gap-2 text-sm font-medium",
              toast.type === "success"
                ? "bg-accent-crimson text-white"
                : "bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/20"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-theme bg-bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden",
              data.profile?.headerImage
                ? "bg-bg-elevated border border-theme"
                : "bg-accent-crimson"
            )}>
              {data.profile?.headerImage ? (
                <Image
                  src={data.profile.headerImage}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain p-0.5"
                />
              ) : (
                <span className="text-white font-bold text-xs">
                  {data.profile?.initials || "AD"}
                </span>
              )}
            </div>
            <h1 className="font-bold text-primary text-lg">Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* GitHub Connection */}
            <div className="hidden sm:flex items-center gap-2">
              {githubConnected ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {githubUser}
                  </span>
                  <button
                    onClick={() => setShowRepoSettings(!showRepoSettings)}
                    className="p-1.5 rounded-lg text-xs text-secondary hover:text-primary hover:bg-bg-elevated transition-colors"
                    title="Configurar repositorio"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <a
                  href="/api/admin/github/connect"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-bg-elevated border border-theme transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  Conectar GitHub
                </a>
              )}
            </div>
            <span className="text-xs text-muted hidden sm:block">
              {data.profile?.name}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-secondary hover:text-primary hover:bg-bg-elevated transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Repo Settings Panel */}
        <AnimatePresence>
          {showRepoSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-theme bg-bg-elevated"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <h3 className="text-sm font-semibold text-primary mb-3">Configurar Repositorio GitHub</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-[0.65rem] text-muted block mb-0.5">Owner</label>
                    <input
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                      placeholder="ej: IDemonSan"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-muted block mb-0.5">Repositorio</label>
                    <input
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                      placeholder="ej: portafolio-crimson"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-muted block mb-0.5">Rama</label>
                    <input
                      value={repoBranch}
                      onChange={(e) => setRepoBranch(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                      placeholder="main"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={saveRepoConfig} className="btn-crimson text-xs py-1.5 px-3">
                    Guardar configuración
                  </button>
                  {repoOwner && repoName ? (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {repoOwner}/{repoName} · {repoBranch}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">
                      Sin configurar — los cambios se descargarán manualmente
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "bg-accent-crimson text-white shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                    : "text-secondary hover:text-primary hover:bg-bg-elevated border border-theme"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "projects" && (
              <ProjectsEditor
                projects={data.projects || []}
                onSave={(content) => saveFile("projects.json", content)}
                saving={saving === "projects.json"}
              />
            )}
            {activeTab === "experience" && (
              <ExperienceEditor
                experience={data.experience || []}
                onSave={(content) => saveFile("experience.json", content)}
                saving={saving === "experience.json"}
              />
            )}
            {activeTab === "profile" && (
              <ProfileEditor
                profile={data.profile || {}}
                onSave={(content) => saveFile("profile.json", content)}
                saving={saving === "profile.json"}
              />
            )}
            {activeTab === "techstack" && (
              <TechStackEditor
                techStack={data["tech-stack"] || []}
                onSave={(content) => saveFile("tech-stack.json", content)}
                saving={saving === "tech-stack.json"}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============ PROJECTS EDITOR ============
function ProjectsEditor({
  projects,
  onSave,
  saving,
}: {
  projects: any[]
  onSave: (data: any[]) => void
  saving: boolean
}) {
  const [items, setItems] = useState<any[]>(projects)

  const addItem = () => {
    const newItem = {
      id: `proyecto-${Date.now()}`,
      title: "Nuevo Proyecto",
      description: "",
      problem: "",
      solution: "",
      technologies: [],
      featured: false,
    }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    if (confirm("¿Eliminar este proyecto?")) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    setItems(updated)
  }

  const updateArrayField = (index: number, field: string, arrStr: string) => {
    const arr = arrStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    updateItem(index, field, arr)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Proyectos</h2>
          <p className="text-sm text-muted">{items.length} proyectos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addItem} className="btn-outline text-sm">
            + Nuevo
          </button>
          <button
            onClick={() => onSave(items)}
            disabled={saving}
            className="btn-crimson text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((project: any, index: number) => (
          <div key={project.id || index} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted font-mono">#{index + 1}</span>
                <input
                  value={project.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  className="font-bold text-primary bg-transparent border-none focus:outline-none focus:ring-0 text-base w-full"
                  placeholder="Título del proyecto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.featured}
                    onChange={(e) => updateItem(index, "featured", e.target.checked)}
                    className="rounded border-theme text-accent-crimson focus:ring-accent-crimson"
                  />
                  Destacado
                </label>
                <button
                  onClick={() => removeItem(index)}
                  className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted block mb-1">ID</label>
                <input
                  value={project.id}
                  onChange={(e) => updateItem(index, "id", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">
                  Enlace GitHub
                </label>
                <input
                  value={project.links?.github || ""}
                  onChange={(e) =>
                    updateItem(index, "links", {
                      ...project.links,
                      github: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted block mb-1">Descripción</label>
                <textarea
                  value={project.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Problema</label>
                <textarea
                  value={project.problem}
                  onChange={(e) => updateItem(index, "problem", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Solución</label>
                <textarea
                  value={project.solution}
                  onChange={(e) => updateItem(index, "solution", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1">
                  Tecnologías (separadas por coma)
                </label>
                <input
                  value={project.technologies?.join(", ") || ""}
                  onChange={(e) => updateArrayField(index, "technologies", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                  placeholder="React, Node.js, PostgreSQL"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">
                  Badges (separados por coma)
                </label>
                <input
                  value={project.badges?.join(", ") || ""}
                  onChange={(e) => updateArrayField(index, "badges", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                  placeholder="React Native, Producción"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ EXPERIENCE EDITOR ============
function ExperienceEditor({
  experience,
  onSave,
  saving,
}: {
  experience: any[]
  onSave: (data: any[]) => void
  saving: boolean
}) {
  const [items, setItems] = useState<any[]>(experience)

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `exp-${Date.now()}`,
        role: "Nuevo Rol",
        company: "Empresa",
        period: "Mes Año – Mes Año",
        description: "",
        highlights: [""],
        technologies: [],
      },
    ])
  }

  const removeItem = (index: number) => {
    if (confirm("¿Eliminar esta experiencia?")) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const update = (index: number, field: string, value: any) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    setItems(updated)
  }

  const updateHighlights = (itemIndex: number, arr: string[]) => {
    update(itemIndex, "highlights", arr)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Experiencia</h2>
          <p className="text-sm text-muted">{items.length} experiencias</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addItem} className="btn-outline text-sm">
            + Nueva
          </button>
          <button
            onClick={() => onSave(items)}
            disabled={saving}
            className="btn-crimson text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((exp: any, index: number) => (
          <div key={exp.id || index} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted font-mono">#{index + 1}</span>
                <input
                  value={exp.role}
                  onChange={(e) => update(index, "role", e.target.value)}
                  className="font-bold text-primary bg-transparent border-none focus:outline-none text-base"
                />
              </div>
              <button
                onClick={() => removeItem(index)}
                className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg"
              >
                Eliminar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted block mb-1">Empresa</label>
                <input
                  value={exp.company}
                  onChange={(e) => update(index, "company", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Período</label>
                <input
                  value={exp.period}
                  onChange={(e) => update(index, "period", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                  placeholder="Enero 2024 – Presente"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">
                  Tecnologías (coma)
                </label>
                <input
                  value={exp.technologies?.join(", ") || ""}
                  onChange={(e) =>
                    update(
                      index,
                      "technologies",
                      e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-muted block mb-1">
                Descripción narrativa
              </label>
              <textarea
                value={exp.description}
                onChange={(e) => update(index, "description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">Logros</label>
              <div className="space-y-2">
                {(exp.highlights || []).map((h: string, hIndex: number) => (
                  <div key={hIndex} className="flex gap-2">
                    <input
                      value={h}
                      onChange={(e) => {
                        const highlights = [...(exp.highlights || [])]
                        highlights[hIndex] = e.target.value
                        updateHighlights(index, highlights)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                      placeholder="Describe un logro específico..."
                    />
                    <button
                      onClick={() => {
                        const highlights = (exp.highlights || []).filter(
                          (_: any, i: number) => i !== hIndex
                        )
                        updateHighlights(index, highlights)
                      }}
                      className="px-2 text-xs text-muted hover:text-accent-crimson"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    updateHighlights(index, [...(exp.highlights || []), ""])
                  }
                  className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Agregar logro
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ PROFILE EDITOR ============
function ProfileEditor({
  profile,
  onSave,
  saving,
}: {
  profile: any
  onSave: (data: any) => void
  saving: boolean
}) {
  const [form, setForm] = useState<any>(profile)

  const update = (field: string, value: any) => {
    setForm({ ...form, [field]: value })
  }

  const updateSocial = (field: string, value: string) => {
    setForm({
      ...form,
      social: { ...(form.social || {}), [field]: value },
    })
  }

  const addEducation = () => {
    setForm({
      ...form,
      education: [
        ...(form.education || []),
        { institution: "", degree: "", period: "", status: "" },
      ],
    })
  }

  const updateEducation = (index: number, field: string, value: string) => {
    const edu = [...(form.education || [])]
    edu[index] = { ...edu[index], [field]: value }
    setForm({ ...form, education: edu })
  }

  const removeEducation = (index: number) => {
    setForm({
      ...form,
      education: (form.education || []).filter((_: any, i: number) => i !== index),
    })
  }

  // Array helpers
  const addArrayItem = (field: string, emptyValue: any = "") => {
    setForm({ ...form, [field]: [...(form[field] || []), emptyValue] })
  }

  const removeArrayItem = (field: string, index: number) => {
    setForm({
      ...form,
      [field]: (form[field] || []).filter((_: any, i: number) => i !== index),
    })
  }

  const updateArrayItem = (field: string, index: number, value: string) => {
    const arr = [...(form[field] || [])]
    arr[index] = value
    setForm({ ...form, [field]: arr })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Perfil Profesional</h2>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="btn-crimson text-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar
        </button>
      </div>

      {/* ====== HERO / INICIO ====== */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
          <span className="text-[0.65rem] font-semibold text-accent-crimson uppercase tracking-widest">
            Hero / Inicio
          </span>
          <span className="text-[0.6rem] text-muted">— Encabezado principal y datos básicos</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted block mb-1">Nombre completo</label>
            <input
              value={form.name || ""}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                Logo / Imagen del header
              </label>
              <input
                value={form.headerImage || ""}
                onChange={(e) => update("headerImage", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                placeholder="/IDemon-San-Icon.svg — ruta o URL de imagen"
              />
              <p className="text-[0.6rem] text-muted mt-0.5">
                Ruta relativa (ej: /mi-logo.svg) o URL absoluta. WebP, PNG, SVG.
              </p>
            </div>
          <div>
            <label className="text-xs text-muted block mb-1">Iniciales (fallback si no hay imagen)</label>
            <input
              value={form.initials || ""}
              onChange={(e) => update("initials", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Título profesional</label>
            <input
              value={form.title || ""}
              onChange={(e) => update("title", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Tagline (frase corta)</label>
            <input
              value={form.tagline || ""}
              onChange={(e) => update("tagline", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted block mb-1">Subtítulo (línea debajo del badge)</label>
            <input
              value={form.subtitle || ""}
              onChange={(e) => update("subtitle", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">URL del CV descargable</label>
            <input
              value={form.resumeUrl || ""}
              onChange={(e) => update("resumeUrl", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              placeholder="/cv-brandon-huerta.txt"
            />
          </div>
        </div>
      </div>

      {/* ====== SOBRE MÍ ====== */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
          <span className="text-[0.65rem] font-semibold text-accent-crimson uppercase tracking-widest">
            Sobre Mí
          </span>
          <span className="text-[0.6rem] text-muted">— Bio, filosofía, ubicación, skills y formación</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted block mb-1">Bio / Descripción personal</label>
            <textarea
              value={form.bio || ""}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Frase de filosofía / lema</label>
            <input
              value={form.philosophyQuote || ""}
              onChange={(e) => update("philosophyQuote", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              placeholder="2 horas de planificación ahorran 2 semanas de código"
            />
            <p className="text-[0.6rem] text-muted mt-0.5">
              Se muestra como: Mi filosofía: &ldquo;{form.philosophyQuote || '...'}&rdquo;.
            </p>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Bio adicional (segundo párrafo)</label>
            <textarea
              value={form.bioExtra || ""}
              onChange={(e) => update("bioExtra", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 resize-none"
              placeholder="Diseño limpio, patrones sólidos y código que otros puedan mantener."
            />
            <p className="text-[0.6rem] text-muted mt-0.5">
              Se muestra después de la frase de filosofía.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">Ubicación</label>
              <input
                value={form.location || ""}
                onChange={(e) => update("location", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Skills visibles inicialmente</label>
              <input
                type="number"
                min={0}
                value={form.visibleSkillsCount ?? 8}
                onChange={(e) => update("visibleSkillsCount", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              />
              <p className="text-[0.6rem] text-muted mt-0.5">
                0 = mostrar todas. El resto muestra N skills + botón &quot;Ver más&quot;.
              </p>
            </div>
          </div>

          {/* Skills como lista agregable/eliminable */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">
                Tecnologías / Skills ({form.skills?.length || 0})
              </label>
              <button
                onClick={() => addArrayItem("skills", "")}
                className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg transition-colors"
              >
                + Agregar skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map((skill: string, index: number) => (
                <div key={index} className="flex items-center gap-1">
                  <input
                    value={skill}
                    onChange={(e) => updateArrayItem("skills", index, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 w-auto min-w-[100px]"
                    placeholder="Skill"
                  />
                  <button
                    onClick={() => removeArrayItem("skills", index)}
                    className="p-1 text-xs text-muted hover:text-accent-crimson"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====== MÉTRICAS / INDICADORES ====== */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
          <span className="text-[0.65rem] font-semibold text-accent-crimson uppercase tracking-widest">
            Métricas / Indicadores
          </span>
          <span className="text-[0.6rem] text-muted">— Tarjetas de métricas en la sección Sobre Mí</span>
        </div>
        <div className="space-y-4">
          {(form.aboutMetrics || []).map((metric: any, index: number) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-bg-elevated border border-theme"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted font-mono">#{index + 1}</span>
                <button
                  onClick={() => {
                    const updated = [...(form.aboutMetrics || [])]
                    updated.splice(index, 1)
                    setForm({ ...form, aboutMetrics: updated })
                  }}
                  className="p-1 text-xs text-muted hover:text-accent-crimson"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[0.6rem] text-muted block mb-0.5">ID (identificador único)</label>
                  <input
                    value={metric.id || ""}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], id: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                    placeholder="exp"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] text-muted block mb-0.5">Título</label>
                  <input
                    value={metric.title || ""}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], title: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                    placeholder="Experiencia Técnica"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] text-muted block mb-0.5">Valor</label>
                  <input
                    value={metric.value || ""}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], value: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                    placeholder="+3 años"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[0.6rem] text-muted block mb-0.5">Descripción corta</label>
                  <input
                    value={metric.description || ""}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], description: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                    placeholder="Desarrollo profesional en sectores público y privado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-[0.6rem] text-muted block mb-0.5">Icono</label>
                  <select
                    value={metric.icon || "code"}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], icon: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none"
                  >
                    <option value="briefcase">Briefcase (maletín)</option>
                    <option value="building">Building (edificio)</option>
                    <option value="code">Code (código)</option>
                    <option value="map">Map (mapa)</option>
                    <option value="layers">Layers (capas)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[0.6rem] text-muted block mb-0.5">Color de acento</label>
                  <select
                    value={metric.accent || "none"}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], accent: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none"
                  >
                    <option value="none">Ninguno</option>
                    <option value="crimson">Crimson (rojo)</option>
                    <option value="ember">Ember (ámbar)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[0.6rem] text-muted block mb-0.5">Span (columnas)</label>
                  <select
                    value={metric.span || "sm"}
                    onChange={(e) => {
                      const updated = [...(form.aboutMetrics || [])]
                      updated[index] = { ...updated[index], span: e.target.value }
                      setForm({ ...form, aboutMetrics: updated })
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none"
                  >
                    <option value="sm">1 columna</option>
                    <option value="md">2 columnas</option>
                    <option value="lg">3 columnas</option>
                    <option value="xl">4 columnas</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const updated = [...(form.aboutMetrics || [])]
              updated.push({
                id: `metric-${Date.now()}`,
                title: "Nueva Métrica",
                value: "Valor",
                description: "Descripción",
                icon: "code",
                accent: "none",
                span: "sm",
              })
              setForm({ ...form, aboutMetrics: updated })
            }}
            className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-3 py-1.5 rounded-lg transition-colors"
          >
            + Agregar métrica
          </button>
        </div>
      </div>

      {/* ====== FORMACIÓN (dentro de Sobre Mí) ====== */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
          <span className="text-[0.65rem] font-semibold text-accent-crimson uppercase tracking-widest">
            Formación
          </span>
          <span className="text-[0.6rem] text-muted">— Educación (dentro de Sobre Mí)</span>
        </div>
        <div className="space-y-3">
          {(form.education || []).map((edu: any, index: number) => (
            <div
              key={index}
              className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-bg-elevated"
            >
              <div className="flex-1 min-w-[150px]">
                <label className="text-[0.6rem] text-muted block mb-0.5">Institución</label>
                <input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, "institution", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-[0.6rem] text-muted block mb-0.5">Título</label>
                <input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
              <div className="w-28">
                <label className="text-[0.6rem] text-muted block mb-0.5">Periodo</label>
                <input
                  value={edu.period}
                  onChange={(e) => updateEducation(index, "period", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
              <div className="w-24">
                <label className="text-[0.6rem] text-muted block mb-0.5">Estado</label>
                <input
                  value={edu.status}
                  onChange={(e) => updateEducation(index, "status", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-card border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                />
              </div>
              <button
                onClick={() => removeEducation(index)}
                className="p-1.5 text-xs text-muted hover:text-accent-crimson mb-0.5"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addEducation}
            className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-3 py-1.5 rounded-lg transition-colors"
          >
            + Agregar formación
          </button>
        </div>
      </div>

      {/* ====== CONTACTO ====== */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
          <span className="text-[0.65rem] font-semibold text-accent-crimson uppercase tracking-widest">
            Contacto Profesional
          </span>
          <span className="text-[0.6rem] text-muted">— Correos, teléfonos, RUC, RNP, disponibilidad</span>
        </div>
        <div className="space-y-4">
          {/* Emails múltiples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">
                Correos electrónicos ({form.emails?.length || 0})
              </label>
              <button
                onClick={() => addArrayItem("emails", "")}
                className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg transition-colors"
              >
                + Agregar email
              </button>
            </div>
            <div className="space-y-2">
              {(form.emails || []).map((email: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={email}
                    onChange={(e) => updateArrayItem("emails", index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                    placeholder="correo@ejemplo.com"
                  />
                  <button
                    onClick={() => removeArrayItem("emails", index)}
                    className="p-1.5 text-xs text-muted hover:text-accent-crimson"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!form.emails?.length && (
                <p className="text-xs text-muted italic">
                  Sin correos. Agrega al menos uno para que el formulario de contacto funcione.
                </p>
              )}
            </div>
          </div>

          {/* Teléfonos múltiples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">
                Teléfonos / WhatsApp ({form.phones?.length || 0})
              </label>
              <button
                onClick={() => addArrayItem("phones", "")}
                className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg transition-colors"
              >
                + Agregar teléfono
              </button>
            </div>
            <div className="space-y-2">
              {(form.phones || []).map((phone: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={phone}
                    onChange={(e) => updateArrayItem("phones", index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
                    placeholder="999888777"
                  />
                  <button
                    onClick={() => removeArrayItem("phones", index)}
                    className="p-1.5 text-xs text-muted hover:text-accent-crimson"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!form.phones?.length && (
                <p className="text-xs text-muted italic">
                  Sin teléfonos registrados.
                </p>
              )}
            </div>
          </div>

          {/* Campos legacy (respaldo) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-theme">
            <div>
              <label className="text-xs text-muted block mb-1">
                Email principal (legacy)
              </label>
              <input
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                Teléfono principal (legacy)
              </label>
              <input
                value={form.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">RUC</label>
              <input
                value={form.ruc || ""}
                onChange={(e) => update("ruc", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-primary cursor-pointer pt-5">
                <input
                  type="checkbox"
                  checked={form.rnpActive || false}
                  onChange={(e) => update("rnpActive", e.target.checked)}
                  className="rounded border-theme text-accent-crimson focus:ring-accent-crimson"
                />
                RNP Activo
              </label>
            </div>
          </div>

          {/* Disponibilidad como lista agregable/eliminable */}
          <div className="pt-3 border-t border-theme">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">
                Disponibilidad ({form.availability?.length || 0})
              </label>
              <button
                onClick={() => addArrayItem("availability", "")}
                className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg transition-colors"
              >
                + Agregar opción
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.availability || []).map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-1">
                  <input
                    value={item}
                    onChange={(e) => updateArrayItem("availability", index, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 w-auto min-w-[130px]"
                    placeholder="Freelance, Remoto..."
                  />
                  <button
                    onClick={() => removeArrayItem("availability", index)}
                    className="p-1 text-xs text-muted hover:text-accent-crimson"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====== REDES SOCIALES ====== */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
          <span className="text-[0.65rem] font-semibold text-accent-crimson uppercase tracking-widest">
            Redes Sociales
          </span>
          <span className="text-[0.6rem] text-muted">— GitHub, LinkedIn, WhatsApp, Portfolio (Hero / Contacto)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted block mb-1">GitHub</label>
            <input
              value={form.social?.github || ""}
              onChange={(e) => updateSocial("github", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">LinkedIn</label>
            <input
              value={form.social?.linkedin || ""}
              onChange={(e) => updateSocial("linkedin", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">WhatsApp</label>
            <input
              value={form.social?.whatsapp || ""}
              onChange={(e) => updateSocial("whatsapp", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Portfolio URL</label>
            <input
              value={form.social?.portfolio || ""}
              onChange={(e) => updateSocial("portfolio", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ TECH STACK EDITOR ============
function TechStackEditor({
  techStack,
  onSave,
  saving,
}: {
  techStack: any[]
  onSave: (data: any[]) => void
  saving: boolean
}) {
  const [items, setItems] = useState<any[]>(techStack)

  const addCategory = () => {
    setItems([...items, { category: "Nueva Categoría", icon: "server", items: [] }])
  }

  const removeCategory = (index: number) => {
    if (confirm("¿Eliminar esta categoría y todas sus tecnologías?")) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateCategory = (index: number, field: string, value: any) => {
    const updated = [...items]
    ;(updated[index] as any)[field] = value
    setItems(updated)
  }

  const addTech = (catIndex: number) => {
    const updated = [...items]
    ;(updated[catIndex] as any).items = [
      ...(updated[catIndex]?.items || []),
      { name: "" },
    ]
    setItems(updated)
  }

  const removeTech = (catIndex: number, techIndex: number) => {
    const updated = [...items]
    ;(updated[catIndex] as any).items = (updated[catIndex]?.items || []).filter(
      (_: any, i: number) => i !== techIndex
    )
    setItems(updated)
  }

  const updateTech = (catIndex: number, techIndex: number, value: string) => {
    const updated = [...items]
    ;(updated[catIndex] as any).items[techIndex] = { name: value }
    setItems(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Stack Técnico</h2>
          <p className="text-sm text-muted">{items.length} categorías</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addCategory} className="btn-outline text-sm">
            + Categoría
          </button>
          <button
            onClick={() => onSave(items)}
            disabled={saving}
            className="btn-crimson text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((cat: any, catIndex: number) => (
          <div key={catIndex} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted font-mono">#{catIndex + 1}</span>
                <input
                  value={cat.category}
                  onChange={(e) => updateCategory(catIndex, "category", e.target.value)}
                  className="font-bold text-primary bg-transparent border-none focus:outline-none text-base"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Icono:</span>
                <select
                  value={cat.icon}
                  onChange={(e) => updateCategory(catIndex, "icon", e.target.value)}
                  className="px-2 py-1 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none"
                >
                  <option value="server">Server</option>
                  <option value="monitor">Monitor</option>
                  <option value="database">Database</option>
                  <option value="wrench">Wrench</option>
                  <option value="layout">Layout</option>
                </select>
                <button
                  onClick={() => removeCategory(catIndex)}
                  className="text-xs text-accent-crimson hover:bg-accent-crimson-subtle px-2 py-1 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(cat.items || []).map((tech: any, techIndex: number) => (
                <div key={techIndex} className="flex items-center gap-1">
                  <input
                    value={tech.name}
                    onChange={(e) => updateTech(catIndex, techIndex, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-theme text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-crimson/30 w-32"
                    placeholder="Tecnología"
                  />
                  <button
                    onClick={() => removeTech(catIndex, techIndex)}
                    className="p-1 text-xs text-muted hover:text-accent-crimson"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addTech(catIndex)}
                className="px-3 py-1.5 rounded-lg border border-dashed border-theme text-xs text-muted hover:text-accent-crimson hover:border-accent-crimson/30 transition-colors"
              >
                + Agregar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
