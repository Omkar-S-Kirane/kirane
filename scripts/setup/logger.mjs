/**
 * logger.mjs — Structured terminal output for the setup system.
 *
 * Provides coloured, levelled logging with step tracking and
 * a final summary table.  Colour output is automatically disabled
 * when stdout is not a TTY or when the NO_COLOR env var is set.
 */

import { env, stdout } from 'node:process'

// ── Colour support ────────────────────────────────────────────
const supportsColour = stdout.isTTY && !env.NO_COLOR && env.TERM !== 'dumb'

const colour = (code) => (supportsColour ? `\x1b[${code}m` : '')
const reset = colour('0')
const bold = colour('1')
const dim = colour('2')
const red = colour('31')
const green = colour('32')
const yellow = colour('33')
const blue = colour('34')
const cyan = colour('36')

// ── Symbols ───────────────────────────────────────────────────
const symbols = {
  tick: supportsColour ? '✔' : 'OK',
  cross: supportsColour ? '✖' : 'FAIL',
  warning: supportsColour ? '⚠' : 'WARN',
  info: supportsColour ? 'ℹ' : 'INFO',
  arrow: supportsColour ? '→' : '->',
  bullet: supportsColour ? '•' : '-',
}

// ── Step tracking ─────────────────────────────────────────────
let currentStep = 0
let totalSteps = 0

/**
 * Initialise step tracking.
 * @param {number} total — Total number of top-level phases.
 */
export function setTotalSteps(total) {
  totalSteps = total
  currentStep = 0
}

/**
 * Advance to the next step and print a phase header.
 * @param {string} title — Phase title, e.g. "Environment validation".
 */
export function step(title) {
  currentStep++
  const counter =
    totalSteps > 0 ? `${dim}[${currentStep}/${totalSteps}]${reset} ` : ''
  console.log(`\n${counter}${bold}${cyan}${title}${reset}`)
  console.log(`${dim}${'─'.repeat(Math.min(60, title.length + 10))}${reset}`)
}

// ── Logging helpers ───────────────────────────────────────────

/**
 * Print a success message.
 * @param {string} message
 */
export function success(message) {
  console.log(`  ${green}${symbols.tick}${reset}  ${message}`)
}

/**
 * Print an error message.
 * @param {string} message
 */
export function error(message) {
  console.error(`  ${red}${symbols.cross}${reset}  ${message}`)
}

/**
 * Print a warning message.
 * @param {string} message
 */
export function warning(message) {
  console.log(`  ${yellow}${symbols.warning}${reset}  ${message}`)
}

/**
 * Print an informational message.
 * @param {string} message
 */
export function info(message) {
  console.log(`  ${blue}${symbols.info}${reset}  ${message}`)
}

/**
 * Print a detail line (indented, dimmed).
 * @param {string} message
 */
export function detail(message) {
  console.log(`     ${dim}${symbols.arrow} ${message}${reset}`)
}

/**
 * Print a blank line.
 */
export function blank() {
  console.log()
}

// ── Banners ───────────────────────────────────────────────────

/**
 * Print the opening banner.
 * @param {string} projectName
 * @param {string} version
 */
export function banner(projectName, version) {
  console.log()
  console.log(
    `${bold}${cyan}  ${projectName}${reset} ${dim}v${version}${reset}  ${dim}— Project Setup${reset}`,
  )
  console.log(`${dim}  ${'─'.repeat(50)}${reset}`)
}

/**
 * Print a final summary of all phases.
 * @param {{ phase: string, status: 'pass' | 'fail' | 'skip', detail?: string }[]} results
 * @param {number} durationMs — Total elapsed time in milliseconds.
 */
export function summary(results, durationMs) {
  const seconds = (durationMs / 1000).toFixed(1)
  const allPassed = results.every((r) => r.status !== 'fail')

  console.log()
  console.log(`${bold}  Summary${reset}  ${dim}(${seconds}s)${reset}`)
  console.log(`${dim}  ${'─'.repeat(50)}${reset}`)

  for (const r of results) {
    let icon
    let colour_code
    switch (r.status) {
      case 'pass':
        icon = symbols.tick
        colour_code = green
        break
      case 'fail':
        icon = symbols.cross
        colour_code = red
        break
      case 'skip':
        icon = symbols.bullet
        colour_code = dim
        break
    }
    const extra = r.detail ? ` ${dim}${r.detail}${reset}` : ''
    console.log(`  ${colour_code}${icon}${reset}  ${r.phase}${extra}`)
  }

  console.log()
  if (allPassed) {
    console.log(
      `  ${green}${bold}Setup complete.${reset}  The project is ready for development.`,
    )
    console.log(
      `  ${dim}Run ${reset}npm run dev${dim} to start the dev server.${reset}`,
    )
  } else {
    console.log(
      `  ${red}${bold}Setup finished with errors.${reset}  Review the output above for details.`,
    )
  }
  console.log()
}

// ── Error report ──────────────────────────────────────────────

/**
 * Print a structured error report with context and a suggested fix.
 * @param {{ title: string, message: string, suggestion?: string, command?: string }} report
 */
export function errorReport({ title, message, suggestion, command }) {
  console.log()
  console.log(`  ${red}${bold}${symbols.cross} ${title}${reset}`)
  console.log(`  ${red}${message}${reset}`)
  if (suggestion) {
    console.log(`  ${yellow}${symbols.arrow} ${suggestion}${reset}`)
  }
  if (command) {
    console.log(`  ${dim}  $ ${command}${reset}`)
  }
  console.log()
}
