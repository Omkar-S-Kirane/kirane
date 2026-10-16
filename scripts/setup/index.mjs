#!/usr/bin/env node

/**
 * index.mjs — Setup orchestrator for the KIRANE project.
 *
 * Usage:
 *   npm run setup                 Run the full setup pipeline
 *   npm run setup -- --help       Show usage information
 *   npm run setup -- --skip-tests Skip the test suite during quality gates
 *   npm run setup -- --install-only  Install deps and stop (no quality gates)
 *
 * Pipeline:
 *   1. Environment validation   — Node.js, npm, OS, architecture
 *   2. Dependency installation  — npm ci / npm install with diagnostics
 *   3. Diagnostics              — peer deps, lockfile, duplicates, disk
 *   4. Configuration validation — required files and scripts
 *   5. Quality gates            — typecheck → lint → test → build
 *
 * SAFETY:
 *   • Never deletes package-lock.json or node_modules automatically.
 *   • Never runs npm install with --force or npm audit fix --force.
 *   • Never modifies source files, Git history, or global npm config.
 *   • Never commits, pushes, or exposes credentials.
 *   • Never uses destructive cleanup or unrestricted retry loops.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installDependencies } from './dependencies.mjs'
import { runDiagnostics } from './diagnostics.mjs'
import { validateEnvironment } from './environment.mjs'
import * as log from './logger.mjs'
import { runQualityGates, validateConfig } from './validation.mjs'

// ── Resolve project root ──────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..', '..')

// ── Read project metadata ─────────────────────────────────────
let projectName = 'kirane'
let projectVersion = '0.0.0'

try {
  const pkg = JSON.parse(
    readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8'),
  )
  projectName = pkg.name ?? projectName
  projectVersion = pkg.version ?? projectVersion
} catch {
  // Fall back to defaults
}

// ── CLI argument parsing ──────────────────────────────────────
const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')
const skipTests = args.includes('--skip-tests')
const installOnly = args.includes('--install-only')

if (showHelp) {
  console.log(`
  ${projectName} — Project Setup

  Usage
    npm run setup                  Run the full setup pipeline
    npm run setup -- --help        Show this help message
    npm run setup -- --skip-tests  Skip test suite during quality gates
    npm run setup -- --install-only Install dependencies only (skip quality gates)

  Pipeline
    1. Environment validation    Node.js >= 22, npm >= 10, OS detection
    2. Dependency installation   Prefers npm ci; falls back to npm install
    3. Diagnostics               Peer deps, lockfile health, duplicates
    4. Configuration validation  Required files and scripts
    5. Quality gates             typecheck → lint → test → build

  Environment Variables
    NO_COLOR                     Disable coloured output
    CI                           Treated as a standard CI environment
`)
  process.exit(0)
}

// Check for unknown flags
const knownFlags = new Set(['--help', '-h', '--skip-tests', '--install-only'])
const unknownFlags = args.filter((a) => a.startsWith('-') && !knownFlags.has(a))
if (unknownFlags.length > 0) {
  log.error(`Unknown option(s): ${unknownFlags.join(', ')}`)
  log.info('Run npm run setup -- --help to see available options.')
  process.exit(1)
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now()
  const phaseCount = installOnly ? 3 : 5

  log.banner(projectName, projectVersion)
  log.setTotalSteps(phaseCount)

  /** @type {{ phase: string, status: 'pass' | 'fail' | 'skip', detail?: string }[]} */
  const results = []

  // ── Phase 1: Environment ────────────────────────────────────
  const envResult = validateEnvironment()
  results.push({
    phase: 'Environment validation',
    status: envResult.passed ? 'pass' : 'fail',
    detail: envResult.passed
      ? `Node ${envResult.node.version}, npm ${envResult.npm.version}`
      : undefined,
  })

  if (!envResult.passed) {
    log.summary(results, Date.now() - startTime)
    process.exit(1)
  }

  // ── Phase 2: Dependencies ───────────────────────────────────
  const depResult = installDependencies(PROJECT_ROOT)
  results.push({
    phase: 'Dependency installation',
    status: depResult.passed ? 'pass' : 'fail',
    detail: depResult.passed ? `via npm ${depResult.strategy}` : undefined,
  })

  if (!depResult.passed) {
    if (depResult.error) {
      log.errorReport({
        title: 'Dependency installation failed',
        message: depResult.error.slice(0, 500),
        suggestion:
          'Check your network connection and try again.  If the issue persists, delete node_modules and package-lock.json manually, then run npm install.',
      })
    }
    log.summary(results, Date.now() - startTime)
    process.exit(1)
  }

  // ── Phase 3: Diagnostics ────────────────────────────────────
  const diagResult = runDiagnostics(PROJECT_ROOT)
  results.push({
    phase: 'Diagnostics',
    status: diagResult.passed ? 'pass' : 'fail',
    detail:
      diagResult.diagnostics.length === 0
        ? 'clean'
        : `${diagResult.diagnostics.length} finding(s)`,
  })

  // ── Early exit for --install-only ───────────────────────────
  if (installOnly) {
    results.push({ phase: 'Configuration validation', status: 'skip' })
    results.push({ phase: 'Quality gates', status: 'skip' })
    log.summary(results, Date.now() - startTime)
    process.exit(diagResult.passed ? 0 : 1)
  }

  // ── Phase 4: Configuration ──────────────────────────────────
  const configResult = validateConfig(PROJECT_ROOT)
  results.push({
    phase: 'Configuration validation',
    status: configResult.passed ? 'pass' : 'fail',
    detail: configResult.passed
      ? `${REQUIRED_FILE_COUNT} files, ${REQUIRED_SCRIPT_COUNT} scripts`
      : `${configResult.missing.length} missing`,
  })

  // ── Phase 5: Quality gates ──────────────────────────────────
  const gateResult = runQualityGates(PROJECT_ROOT, { skipTests })
  const gateDetails = Object.entries(gateResult.results)
    .filter(([, r]) => r.passed && r.durationMs > 0)
    .map(([name, r]) => `${name} ${(r.durationMs / 1000).toFixed(1)}s`)
    .join(', ')

  results.push({
    phase: 'Quality gates',
    status: gateResult.passed ? 'pass' : 'fail',
    detail: gateResult.passed ? gateDetails : undefined,
  })

  // ── Summary ─────────────────────────────────────────────────
  const allPassed = results.every((r) => r.status !== 'fail')
  log.summary(results, Date.now() - startTime)
  process.exit(allPassed ? 0 : 1)
}

// ── Count constants (avoid importing from validation) ─────────
const REQUIRED_FILE_COUNT = 8
const REQUIRED_SCRIPT_COUNT = 8

main().catch((err) => {
  log.error(`Unexpected error: ${err.message}`)
  if (err.stack) {
    log.detail(err.stack.split('\n').slice(1, 4).join('\n'))
  }
  process.exit(1)
})
