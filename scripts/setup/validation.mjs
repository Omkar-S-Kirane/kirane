/**
 * validation.mjs — Project configuration and quality-gate validation.
 *
 * Validates that required configuration files and scripts exist,
 * then optionally runs the project's quality gates: typecheck,
 * lint, test, and build.
 *
 * SAFETY:
 *   • Never disables TypeScript checks to hide errors.
 *   • Never disables lint rules to bypass failures.
 *   • Never deletes source files to make validation pass.
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as log from './logger.mjs'

// ── Required files ────────────────────────────────────────────
const REQUIRED_FILES = [
  { path: 'package.json', label: 'package.json' },
  { path: 'tsconfig.json', label: 'tsconfig.json' },
  { path: 'tsconfig.app.json', label: 'tsconfig.app.json' },
  { path: 'tsconfig.node.json', label: 'tsconfig.node.json' },
  { path: 'vite.config.ts', label: 'vite.config.ts' },
  { path: '.oxlintrc.json', label: '.oxlintrc.json (linter config)' },
  { path: '.prettierrc', label: '.prettierrc (formatter config)' },
  { path: 'src/main.tsx', label: 'src/main.tsx (entry point)' },
]

// ── Required scripts ──────────────────────────────────────────
const REQUIRED_SCRIPTS = [
  'dev',
  'build',
  'typecheck',
  'lint',
  'test',
  'format',
  'format:check',
  'preview',
]

/**
 * Validate that all required configuration files exist.
 *
 * @param {string} projectRoot
 * @returns {{ passed: boolean, missing: string[] }}
 */
export function validateConfig(projectRoot) {
  log.step('Configuration validation')

  const missing = []

  for (const file of REQUIRED_FILES) {
    const fullPath = join(projectRoot, file.path)
    if (existsSync(fullPath)) {
      log.success(file.label)
    } else {
      log.error(`Missing: ${file.label}`)
      missing.push(file.path)
    }
  }

  // ── Check scripts ───────────────────────────────────────────
  let pkg
  try {
    const raw = execSync(
      `node -e "process.stdout.write(JSON.stringify(require('./package.json')))"`,
      { cwd: projectRoot, encoding: 'utf8' },
    )
    pkg = JSON.parse(raw)
  } catch {
    log.error('Could not read package.json')
    return { passed: false, missing: ['package.json'] }
  }

  const scripts = pkg.scripts ?? {}
  const missingScripts = REQUIRED_SCRIPTS.filter((s) => !scripts[s])

  if (missingScripts.length === 0) {
    log.success(`All ${REQUIRED_SCRIPTS.length} required scripts present`)
  } else {
    for (const s of missingScripts) {
      log.error(`Missing script: "${s}"`)
    }
  }

  const passed = missing.length === 0 && missingScripts.length === 0
  return {
    passed,
    missing: [...missing, ...missingScripts.map((s) => `script:${s}`)],
  }
}

/**
 * Run a single npm script as a quality gate.
 *
 * @param {string} projectRoot
 * @param {string} scriptName — e.g. "typecheck"
 * @param {string} label      — Human-readable label for output
 * @returns {{ passed: boolean, output: string, durationMs: number }}
 */
function runQualityGate(projectRoot, scriptName, label) {
  const start = Date.now()
  try {
    const output = execSync(`npm run ${scriptName} --silent`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120_000, // 2 minute timeout per gate
    })
    const durationMs = Date.now() - start
    log.success(`${label}  (${(durationMs / 1000).toFixed(1)}s)`)
    return { passed: true, output, durationMs }
  } catch (err) {
    const durationMs = Date.now() - start
    const output = err.stderr ?? err.stdout ?? String(err)
    log.error(`${label}  (${(durationMs / 1000).toFixed(1)}s)`)

    // Show a concise extract of the error
    const lines = output.split('\n').filter((l) => l.trim())
    const preview = lines.slice(0, 8).join('\n')
    if (preview) {
      log.detail('First errors:')
      for (const line of lines.slice(0, 8)) {
        log.detail(`  ${line.trim()}`)
      }
      if (lines.length > 8) {
        log.detail(`  … and ${lines.length - 8} more line(s)`)
      }
    }

    return { passed: false, output, durationMs }
  }
}

/**
 * Run all quality gates: typecheck, lint, test, build.
 *
 * @param {string} projectRoot
 * @param {{ skipTests?: boolean }} options
 * @returns {{
 *   passed: boolean,
 *   results: Record<string, { passed: boolean, durationMs: number }>,
 * }}
 */
export function runQualityGates(projectRoot, options = {}) {
  log.step('Quality gates')

  const gates = [
    { script: 'typecheck', label: 'TypeScript type checking' },
    { script: 'lint', label: 'Linting (Oxlint)' },
    ...(options.skipTests ? [] : [{ script: 'test', label: 'Tests (Vitest)' }]),
    { script: 'build', label: 'Production build (Vite)' },
  ]

  if (options.skipTests) {
    log.info('Tests skipped (--skip-tests)')
  }

  /** @type {Record<string, { passed: boolean, durationMs: number }>} */
  const results = {}
  let allPassed = true

  for (const gate of gates) {
    const result = runQualityGate(projectRoot, gate.script, gate.label)
    results[gate.script] = {
      passed: result.passed,
      durationMs: result.durationMs,
    }
    if (!result.passed) {
      allPassed = false
    }
  }

  if (options.skipTests) {
    results.test = { passed: true, durationMs: 0 }
  }

  return { passed: allPassed, results }
}
