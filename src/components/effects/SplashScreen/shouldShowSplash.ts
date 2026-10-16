/** sessionStorage key — splash only shows once per browser session */
const SESSION_KEY = 'kirane-splash-shown'

/**
 * Returns `true` if the splash has not yet been shown in this browser session.
 * Called synchronously during initial render.
 */
export function shouldShowSplash(): boolean {
  try {
    return !sessionStorage.getItem(SESSION_KEY)
  } catch {
    // If sessionStorage is unavailable, show the splash
    return true
  }
}

/**
 * Mark the splash as shown for the remainder of this browser session.
 */
export function markSplashShown(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // sessionStorage may be unavailable — safe to ignore
  }
}
