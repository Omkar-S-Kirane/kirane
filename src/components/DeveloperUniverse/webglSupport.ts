/**
 * Detects whether WebGL can be used before the 3D chunk is loaded, so that
 * unsupported devices go straight to the lightweight fallback instead of
 * failing inside the renderer.
 */
export function detectWebGLSupport(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2') ?? canvas.getContext('webgl') ?? null
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
