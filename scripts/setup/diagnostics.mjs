/**
 * diagnostics.mjs — Diagnose common dependency and environment issues.
 *
 * Runs after dependency installation to surface potential problems
 * early and provide actionable fix suggestions.
 *
 * SAFETY:
 *   • Read-only — never modifies files or runs repair commands.
 *   • Suggestions are printed for the developer to run manually.
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as log from './logger.mjs'

/**
 * @typedef {{
 *   severity: 'error' | 'warning' | 'info',
 *   title: string,
 *   message: string,
 *   suggestion?: string,
 *   command?: string,
 * }} Diagnostic
 */

/**
 * Check for peer dependency warnings.
 * @param {string} projectRoot
 * @returns {Diagnostic[]}
 */
function checkPeerDeps(projectRoot) {
  /** @type {Diagnostic[]} */
  const diagnostics = []

  try {
    const output = execSync('npm ls --all --json 2>/dev/null', {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 30_000,
    })
    const tree = JSON.parse(output)

    if (tree.problems && tree.problems.length > 0) {
      const peerIssues = tree.problems.filter((p) => p.includes('peer dep'))
      if (peerIssues.length > 0) {
        diagnostics.push({
          severity: 'warning',
          title: 'Peer dependency issues detected',
          message: `${peerIssues.length} peer dependency warning(s) found.`,
          suggestion:
            'Run npm ls to review.  These are typically non-blocking.',
          command: 'npm ls 2>&1 | grep "peer dep"',
        })
      }
    }
  } catch {
    // npm ls can exit non-zero with warnings — that's expected
  }

  return diagnostics
}

/**
 * Check for known conflicting or duplicate packages.
 * @param {string} projectRoot
 * @returns {Diagnostic[]}
 */
function checkDuplicates(projectRoot) {
  /** @type {Diagnostic[]} */
  const diagnostics = []

  try {
    const output = execSync('npm ls react --json 2>/dev/null', {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 15_000,
    })
    const tree = JSON.parse(output)

    // Check for multiple React versions (common source of hook errors)
    const reactVersions = new Set()
    function walk(deps) {
      if (!deps) return
      for (const [name, info] of Object.entries(deps)) {
        if (name === 'react' && info.version) {
          reactVersions.add(info.version)
        }
        if (info.dependencies) walk(info.dependencies)
      }
    }
    walk(tree.dependencies)

    if (reactVersions.size > 1) {
      diagnostics.push({
        severity: 'error',
        title: 'Multiple React versions detected',
        message: `Found React versions: ${[...reactVersions].join(', ')}. This will cause hook errors.`,
        suggestion:
          'Ensure all packages depend on the same React major version.',
        command: 'npm ls react',
      })
    }
  } catch {
    // Silently skip — npm ls failing is handled elsewhere
  }

  return diagnostics
}

/**
 * Check for outdated lockfile format.
 * @param {string} projectRoot
 * @returns {Diagnostic[]}
 */
function checkLockfileVersion(projectRoot) {
  /** @type {Diagnostic[]} */
  const diagnostics = []
  const lockPath = join(projectRoot, 'package-lock.json')

  if (!existsSync(lockPath)) return diagnostics

  try {
    const raw = readFileSync(lockPath, 'utf8')
    const lock = JSON.parse(raw)

    if (lock.lockfileVersion && lock.lockfileVersion < 3) {
      diagnostics.push({
        severity: 'warning',
        title: 'Outdated lockfile format',
        message: `package-lock.json uses lockfileVersion ${lock.lockfileVersion}. npm 10+ uses version 3.`,
        suggestion:
          'The lockfile will be upgraded automatically on the next npm install.',
      })
    }
  } catch {
    diagnostics.push({
      severity: 'warning',
      title: 'Lockfile parse error',
      message: 'Could not parse package-lock.json. It may be corrupted.',
      suggestion:
        'Consider deleting it manually and running npm install to regenerate.',
      command: 'rm package-lock.json && npm install',
    })
  }

  return diagnostics
}

/**
 * Check disk space (basic heuristic).
 * @returns {Diagnostic[]}
 */
function checkDiskSpace() {
  /** @type {Diagnostic[]} */
  const diagnostics = []

  try {
    const output = execSync("df -P . | tail -1 | awk '{print $4}'", {
      encoding: 'utf8',
      timeout: 5000,
    })
    const availableKb = parseInt(output.trim(), 10)

    // Warn if less than 500 MB available
    if (!isNaN(availableKb) && availableKb < 512_000) {
      diagnostics.push({
        severity: 'warning',
        title: 'Low disk space',
        message: `Only ${Math.round(availableKb / 1024)} MB available. Builds may fail.`,
        suggestion: 'Free up disk space before continuing.',
      })
    }
  } catch {
    // df might not work on all platforms — skip silently
  }

  return diagnostics
}

/**
 * Check for .env files that may need manual setup.
 * @param {string} projectRoot
 * @returns {Diagnostic[]}
 */
function checkEnvFiles(projectRoot) {
  /** @type {Diagnostic[]} */
  const diagnostics = []

  const examplePath = join(projectRoot, '.env.example')
  const envPath = join(projectRoot, '.env')

  if (existsSync(examplePath) && !existsSync(envPath)) {
    diagnostics.push({
      severity: 'info',
      title: 'Environment file needed',
      message: 'An .env.example file exists but no .env file was found.',
      suggestion: 'Copy the example file and fill in the required values.',
      command: 'cp .env.example .env',
    })
  }

  return diagnostics
}

/**
 * Run all diagnostic checks and report findings.
 *
 * @param {string} projectRoot
 * @returns {{ passed: boolean, diagnostics: Diagnostic[] }}
 */
export function runDiagnostics(projectRoot) {
  log.step('Diagnostics')

  /** @type {Diagnostic[]} */
  const allDiagnostics = [
    ...checkPeerDeps(projectRoot),
    ...checkDuplicates(projectRoot),
    ...checkLockfileVersion(projectRoot),
    ...checkDiskSpace(),
    ...checkEnvFiles(projectRoot),
  ]

  const errors = allDiagnostics.filter((d) => d.severity === 'error')
  const warnings = allDiagnostics.filter((d) => d.severity === 'warning')
  const infos = allDiagnostics.filter((d) => d.severity === 'info')

  if (allDiagnostics.length === 0) {
    log.success('No issues found')
  } else {
    for (const d of errors) {
      log.errorReport({
        title: d.title,
        message: d.message,
        suggestion: d.suggestion,
        command: d.command,
      })
    }
    for (const d of warnings) {
      log.warning(`${d.title}: ${d.message}`)
      if (d.suggestion) log.detail(d.suggestion)
      if (d.command) log.detail(`$ ${d.command}`)
    }
    for (const d of infos) {
      log.info(`${d.title}: ${d.message}`)
      if (d.suggestion) log.detail(d.suggestion)
      if (d.command) log.detail(`$ ${d.command}`)
    }
  }

  return {
    passed: errors.length === 0,
    diagnostics: allDiagnostics,
  }
}
