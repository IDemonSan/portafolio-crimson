import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { cookies } from "next/headers"
import {
  checkRateLimit,
  safeCompare,
  withSecurityHeaders,
} from "@/lib/rate-limiter"

const DATA_DIR = path.join(process.cwd(), "src", "data")

/**
 * Commit and push a file to GitHub using the GitHub API.
 * Supports both env var token (legacy) and OAuth cookie token.
 * Repo info can come from env vars or from the request body.
 */
async function commitToGitHub(
  file: string,
  rawContent: unknown,
  repoInfo: { owner?: string; repo?: string; branch?: string; token?: string } = {}
) {
  // Resolve token: cookie > env var
  const token = repoInfo.token || process.env.GITHUB_TOKEN
  // Resolve repo: request > env var
  const owner = repoInfo.owner || process.env.GITHUB_OWNER
  const repo = repoInfo.repo || process.env.GITHUB_REPO
  const branch = repoInfo.branch || process.env.GITHUB_BRANCH || "main"

  if (!token) {
    return { ok: false, error: "No hay token de GitHub. Conecta tu cuenta en el panel admin." }
  }
  if (!owner || !repo) {
    return { ok: false, error: "Faltan datos del repositorio (owner/repo). Configúralos en el panel admin." }
  }

  const jsonContent = JSON.stringify(rawContent, null, 2)
  const filePath = `src/data/${file}`
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`

  // 1. Get the current file SHA (if it exists)
  const getRes = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": `${owner}/${repo}`,
    },
    cache: "no-store",
  })

  let sha: string | undefined
  if (getRes.ok) {
    const current = await getRes.json()
    sha = current.sha
  }

  // 2. Create or update the file
  const contentEncoded = Buffer.from(jsonContent).toString("base64")
  const commitRes = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": `${owner}/${repo}`,
    },
    body: JSON.stringify({
      message: `Actualizar ${file} desde admin panel`,
      content: contentEncoded,
      sha,
      branch,
    }),
  })

  if (!commitRes.ok) {
    const errBody = await commitRes.text()
    return { ok: false, error: `GitHub API error ${commitRes.status}: ${errBody.substring(0, 300)}` }
  }

  return { ok: true, sha }
}

export async function POST(request: Request) {
  // Rate limiting: 20 saves per 15 min window
  const rateLimit = checkRateLimit(request, {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
    label: "admin-save",
  })

  if (rateLimit.limited) {
    return rateLimit.response!
  }

  // Auth check with constant-time comparison
  const authHeader = request.headers.get("authorization")
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret || !authHeader) {
    return withSecurityHeaders(
      NextResponse.json({ error: "No autorizado" }, { status: 401 })
    )
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  const isAuthenticated = safeCompare(token, adminSecret)

  if (!isAuthenticated) {
    return withSecurityHeaders(
      NextResponse.json({ error: "No autorizado" }, { status: 401 })
    )
  }

  try {
    const body = await request.json()
    const { file, content, repoOwner, repoName, repoBranch } = body

    if (!file || !content) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Faltan datos: file y content son requeridos" }, { status: 400 })
      )
    }

    // Validate filename to prevent directory traversal
    const validFiles = ["profile.json", "experience.json", "projects.json", "tech-stack.json"]
    if (!validFiles.includes(file)) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Archivo no válido" }, { status: 400 })
      )
    }

    // Check if running in production (Vercel)
    // DEBUG: set FORCE_GITHUB_COMMIT=true in .env.local to test GitHub commit locally
    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL || process.env.FORCE_GITHUB_COMMIT === "true"

    if (isProduction) {
      let githubToken: string | undefined
      let hasRepoFromBody: boolean
      let hasRepoFromEnv: boolean
      let resolvedOwner: string | undefined
      let resolvedRepo: string | undefined
      let resolvedBranch: string

      if (process.env.FORCE_GITHUB_COMMIT === "true" && process.env.NODE_ENV !== "production") {
        // Local testing: use env vars directly (no OAuth cookie available)
        githubToken = process.env.GITHUB_TOKEN
        hasRepoFromBody = !!(repoOwner && repoName)
        hasRepoFromEnv = !!(process.env.GITHUB_OWNER && process.env.GITHUB_REPO)
        resolvedOwner = repoOwner || process.env.GITHUB_OWNER
        resolvedRepo = repoName || process.env.GITHUB_REPO
        resolvedBranch = repoBranch || process.env.GITHUB_BRANCH || "main"
      } else {
        // Production: try OAuth cookie first, then env var
        const cookieStore = await cookies()
        const oauthToken = cookieStore.get("github_token")?.value
        githubToken = oauthToken || process.env.GITHUB_TOKEN
        hasRepoFromBody = !!(repoOwner && repoName)
        hasRepoFromEnv = !!(process.env.GITHUB_OWNER && process.env.GITHUB_REPO)
        resolvedOwner = repoOwner || process.env.GITHUB_OWNER
        resolvedRepo = repoName || process.env.GITHUB_REPO
        resolvedBranch = repoBranch || process.env.GITHUB_BRANCH || "main"
      }

      // Need BOTH a token AND repo info to commit
      const hasToken = !!githubToken
      const hasRepo = hasRepoFromBody || hasRepoFromEnv
      let commitError = ""

      if (hasToken && hasRepo) {
        const result = await commitToGitHub(file, content, {
          token: githubToken,
          owner: resolvedOwner,
          repo: resolvedRepo,
          branch: resolvedBranch,
        })

        if (result.ok) {
          return withSecurityHeaders(
            NextResponse.json({
              success: true,
              githubCommitted: true,
              message: `✅ ${file} guardado y subido a GitHub. Los cambios se desplegarán automáticamente.`,
            })
          )
        }

        // If commit fails, capture the error for the fallback message
        commitError = result.error ?? ""
        console.error("GitHub commit failed:", result.error)
      }

      // Build error message based on what failed
      let fallbackMessage = ""
      if (!hasToken && !hasRepo) {
        fallbackMessage = "❌ No hay token de GitHub ni datos del repositorio. Conecta tu cuenta GitHub desde el panel admin (botón \"Conectar GitHub\") o configura GITHUB_TOKEN en las variables de entorno."
      } else if (!hasToken) {
        fallbackMessage = "❌ No hay token de GitHub. Conecta tu cuenta desde el botón \"Conectar GitHub\" en el panel admin, o agrega GITHUB_TOKEN a las variables de entorno."
      } else if (!hasRepo) {
        fallbackMessage = "❌ Faltan datos del repositorio (owner/repo). Configúralos en el panel admin (engranaje ⚙️ junto al nombre de usuario de GitHub) o agrega GITHUB_OWNER y GITHUB_REPO a las variables de entorno."
      } else if (hasToken && hasRepo && commitError) {
        // The commit was attempted but failed - include the actual GitHub error
        fallbackMessage = `❌ GitHub API rechazó el commit: ${commitError}`
      } else {
        fallbackMessage = "❌ Error al conectar con GitHub. Descarga el archivo y haz commit manualmente."
      }

      const jsonContent = JSON.stringify(content, null, 2)
      return withSecurityHeaders(
        NextResponse.json({
          success: true,
          downloadable: true,
          filename: file,
          content: jsonContent,
          message: fallbackMessage,
        })
      )
    }

    // In development, write directly to filesystem
    const filePath = path.join(DATA_DIR, file)
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8")

    return withSecurityHeaders(
      NextResponse.json({ success: true, message: `${file} guardado correctamente` })
    )
  } catch (error) {
    console.error("Error saving data file:", error)
    return withSecurityHeaders(
      NextResponse.json({ error: "Error al guardar datos" }, { status: 500 })
    )
  }
}
