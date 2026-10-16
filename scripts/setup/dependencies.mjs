/**
 * dependencies.mjs — Dependency installation with diagnostics.
 *
 * Prefers `npm ci` for deterministic, reproducible installs when a
 * valid package-lock.json exists.  Falls back to `npm install` when
 * the lockfile is missing or stale.
 *
 * SAFETY:
 *   • Never deletes package-lock.json automatically.
 *   • Never deletes node_modules as the first troubleshooting step.
 *   • Never runs npm install with --force.
 *   • Never runs npm audit fix --force.
 */

import { execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import * as log from './logger.mjs'

/**
 * Check whether a lockfile exists and is roughly in sync with
 * package.json (modified more recently or at the same time).
 *
 * @param {string} projectRoot
 * @returns {{ exists: boolean, fresh: boolean }}
 */
function checkLockfile(projectRoot) {
  const lockPath = join(projectRoot, 'package-lock.json')
  const pkgPath = join(projectRoot, 'package.json')

  if (!existsSync(lockPath)) {
    return { exists: false, fresh: false }
  }

  try {
    const lockMtime = statSync(lockPath).mtimeMs
    const pkgMtime = statSync(pkgPath).mtimeMs
    return { exists: true, fresh: lockMtime >= pkgMtime }
  } catch {
    return { exists: true, fresh: false }
  }
}

/**
 * Check whether node_modules exists and contains the expected
 * top-level packages from package.json.
 *
 * @param {string} projectRoot
 * @returns {{ exists: boolean, valid: boolean, missing: string[] }}
 */
function checkNodeModules(projectRoot) {
  const nmPath = join(projectRoot, 'node_modules')
  if (!existsSync(nmPath)) {
    return { exists: false, valid: false, missing: [] }
  }

  // Quick sanity check: do top-level dependency folders exist?
  let pkg
  try {
    const raw = execSync(
      `node -e "process.stdout.write(JSON.stringify(require('./package.json')))"`,
      {
        cwd: projectRoot,
        encoding: 'utf8',
      },
    )
    pkg = JSON.parse(raw)
  } catch {
    return { exists: true, valid: false, missing: [] }
  }

  const allDeps = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]

  const missing = allDeps.filter((dep) => !existsSync(join(nmPath, dep)))

  return {
    exists: true,
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Run npm ci or npm install.
 *
 * @param {string} projectRoot
 * @param {'ci' | 'install'} strategy
 * @returns {{ ok: boolean, output: string }}
 */
function runInstall(projectRoot, strategy) {
  const cmd = strategy === 'ci' ? 'npm ci' : 'npm install'
  log.info(`Running ${cmd}…`)

  try {
    const output = execSync(cmd, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300_000, // 5 minute timeout
    })
    return { ok: true, output }
  } catch (err) {
    return { ok: false, output: err.stderr ?? err.stdout ?? String(err) }
  }
}

/**
 * Install project dependencies.
 *
 * @param {string} projectRoot — Absolute path to the project.
 * @returns {{
 *   passed: boolean,
 *   strategy: 'ci' | 'install' | 'skip',
 *   lockfile: { exists: boolean, fresh: boolean },
 *   nodeModules: { exists: boolean, valid: boolean, missing: string[] },
 *   error?: string,
 * }}
 */
export function installDependencies(projectRoot) {
  log.step('Dependency installation')

  // ── 1. Assess current state ───────────────────────────────
  const lockfile = checkLockfile(projectRoot)
  const nodeModules = checkNodeModules(projectRoot)

  if (lockfile.exists) {
    log.success('package-lock.json found')
    if (!lockfile.fresh) {
      log.warning('Lockfile may be out of sync with package.json (older mtime)')
    }
  } else {
    log.warning('No package-lock.json found — will use npm install')
  }

  if (nodeModules.exists && nodeModules.valid) {
    log.success('node_modules present and contains all declared packages')
  } else if (nodeModules.exists && !nodeModules.valid) {
    log.warning(
      `node_modules exists but is missing: ${nodeModules.missing.slice(0, 5).join(', ')}${nodeModules.missing.length > 5 ? ` (+${nodeModules.missing.length - 5} more)` : ''}`,
    )
  } else {
    log.info('node_modules not found — fresh install required')
  }

  // ── 2. Choose strategy ────────────────────────────────────
  let strategy
  if (lockfile.exists && lockfile.fresh) {
    strategy = 'ci'
  } else {
    strategy = 'install'
  }

  // ── 3. Install ────────────────────────────────────────────
  const result = runInstall(projectRoot, strategy)

  if (result.ok) {
    log.success(`Dependencies installed successfully (npm ${strategy})`)
  } else {
    // If npm ci failed, try npm install as fallback
    if (strategy === 'ci') {
      log.warning('npm ci failed — falling back to npm install')
      log.detail('This may happen when the lockfile is out of sync.')

      const fallback = runInstall(projectRoot, 'install')
      if (fallback.ok) {
        strategy = 'install'
        log.success(
          'Dependencies installed successfully (npm install fallback)',
        )
      } else {
        log.error('Dependency installation failed')
        return {
          passed: false,
          strategy,
          lockfile,
          nodeModules,
          error: fallback.output,
        }
      }
    } else {
      log.error('Dependency installation failed')
      return {
        passed: false,
        strategy,
        lockfile,
        nodeModules,
        error: result.output,
      }
    }
  }

  // ── 4. Post-install verification ──────────────────────────
  const postCheck = checkNodeModules(projectRoot)
  if (!postCheck.valid) {
    log.warning(
      `Post-install check: some packages may still be missing — ${postCheck.missing.slice(0, 3).join(', ')}`,
    )
  }

  return {
    passed: true,
    strategy,
    lockfile,
    nodeModules: postCheck,
  }
}
