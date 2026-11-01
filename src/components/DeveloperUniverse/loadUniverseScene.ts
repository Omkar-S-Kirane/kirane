/**
 * Loads the WebGL scene chunk (three.js + React Three Fiber). Called lazily
 * by DeveloperUniverse, and early — once the hero has revealed — so the
 * scene is ready by the time a visitor scrolls into the Impact section.
 */
export function loadUniverseScene() {
  return import('./UniverseScene')
}

export function preloadUniverseScene(): void {
  loadUniverseScene().catch(() => {
    // A failed preload is retried by the lazy component when needed.
  })
}
