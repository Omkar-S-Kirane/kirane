/**
 * environment.mjs — Runtime environment validation.
 *
 * Checks Node.js version, npm version, detects OS / architecture,
 * and reports findings.  Returns a structured result so the
 * orchestrator can decide whether to continue.
 */

import { execSync } from 'node:child_process'
import { arch, platform, release } from 'node:os'
import { env } from 'node:process'
import * as log from './logger.mjs'

// ── Version requirements ──────────────────────────────────────
const REQUIRED_NODE_MAJOR = 22
const REQUIRED_NPM_MAJOR = 10

/**
 * Parse a semver-ish string into { major, minor, patch }.
 * @param {string} version — e.g. "22.4.1" or "v22.4.1"
 * @returns {{ major: number, minor: number, patch: number }}
 */
function parseSemver(version) {
  const match = version
    .trim()
    .replace(/^v/i, '')
    .match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return { major: 0, minor: 0, patch: 0 }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

/**
 * Detect the current npm version.
 * @returns {string}
 */
function getNpmVersion() {
  try {
    return execSync('npm --version', { encoding: 'utf8' }).trim()
  } catch {
    return '0.0.0'
  }
}

/**
 * Detect friendly OS name.
 * @returns {string}
 */
function getOsName() {
  const names = {
    darwin: 'macOS',
    linux: 'Linux',
    win32: 'Windows',
    freebsd: 'FreeBSD',
  }
  return names[platform()] ?? platform()
}

/**
 * Detect whether common Node version managers are active.
 * @returns {string | null}
 */
function detectVersionManager() {
  if (env.NVM_DIR) return 'nvm'
  if (env.FNM_DIR || env.FNM_MULTISHELL_PATH) return 'fnm'
  if (env.VOLTA_HOME) return 'volta'
  if (env.ASDF_DIR) return 'asdf'
  if (env.MISE_DATA_DIR || env.MISE_CONFIG_DIR) return 'mise'
  return null
}

/**
 * Run all environment validations.
 *
 * @returns {{
 *   passed: boolean,
 *   node: { version: string, major: number, ok: boolean },
 *   npm:  { version: string, major: number, ok: boolean },
 *   os:   { name: string, platform: string, arch: string, release: string },
 *   versionManager: string | null,
 * }}
 */
export function validateEnvironment() {
  log.step('Environment validation')

  // ── Node.js ───────────────────────────────────────────────
  const nodeVersion = process.version
  const nodeParsed = parseSemver(nodeVersion)
  const nodeOk = nodeParsed.major >= REQUIRED_NODE_MAJOR

  if (nodeOk) {
    log.success(`Node.js ${nodeVersion}`)
  } else {
    log.error(`Node.js ${nodeVersion} — requires >= ${REQUIRED_NODE_MAJOR}.0.0`)
  }

  // ── npm ───────────────────────────────────────────────────
  const npmVersion = getNpmVersion()
  const npmParsed = parseSemver(npmVersion)
  const npmOk = npmParsed.major >= REQUIRED_NPM_MAJOR

  if (npmOk) {
    log.success(`npm ${npmVersion}`)
  } else {
    log.error(`npm ${npmVersion} — requires >= ${REQUIRED_NPM_MAJOR}.0.0`)
  }

  // ── OS / arch ─────────────────────────────────────────────
  const osName = getOsName()
  const osArch = arch()
  const osRelease = release()
  log.success(`${osName} ${osArch} (${osRelease})`)

  // ── Version manager ───────────────────────────────────────
  const versionManager = detectVersionManager()
  if (versionManager) {
    log.info(`Node version manager detected: ${versionManager}`)
  }

  // ── Suggestions on failure ────────────────────────────────
  const passed = nodeOk && npmOk

  if (!nodeOk) {
    const manager = versionManager ?? 'nvm'
    log.errorReport({
      title: 'Node.js version too old',
      message: `Found ${nodeVersion}, but this project requires Node.js >= ${REQUIRED_NODE_MAJOR}.`,
      suggestion: `Install or switch to Node.js ${REQUIRED_NODE_MAJOR} using your version manager.`,
      command:
        manager === 'nvm'
          ? `nvm install ${REQUIRED_NODE_MAJOR} && nvm use ${REQUIRED_NODE_MAJOR}`
          : manager === 'fnm'
            ? `fnm install ${REQUIRED_NODE_MAJOR} && fnm use ${REQUIRED_NODE_MAJOR}`
            : manager === 'volta'
              ? `volta install node@${REQUIRED_NODE_MAJOR}`
              : `${manager} install node ${REQUIRED_NODE_MAJOR}`,
    })
  }

  if (!npmOk) {
    log.errorReport({
      title: 'npm version too old',
      message: `Found npm ${npmVersion}, but this project requires npm >= ${REQUIRED_NPM_MAJOR}.`,
      suggestion:
        'Upgrade npm, or install a Node.js version that ships with a newer npm.',
      command: `npm install -g npm@latest`,
    })
  }

  return {
    passed,
    node: { version: nodeVersion, major: nodeParsed.major, ok: nodeOk },
    npm: { version: npmVersion, major: npmParsed.major, ok: npmOk },
    os: {
      name: osName,
      platform: platform(),
      arch: osArch,
      release: osRelease,
    },
    versionManager,
  }
}
