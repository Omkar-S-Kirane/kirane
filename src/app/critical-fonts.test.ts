import { describe, expect, it, vi } from 'vitest'
import { waitForCriticalFonts } from './critical-fonts'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('waitForCriticalFonts', () => {
  it('waits for the required face and the font set to settle', async () => {
    const faceLoad = deferred<FontFace[]>()
    const allFontsReady = deferred<FontFaceSet>()
    const fonts = {
      load: vi.fn(() => faceLoad.promise),
      ready: allFontsReady.promise,
    } as unknown as FontFaceSet
    let settled = false
    const waiting = waitForCriticalFonts(fonts).then(() => {
      settled = true
    })

    expect(fonts.load).toHaveBeenCalledWith('500 16px "Space Grotesk"')
    faceLoad.resolve([])
    await Promise.resolve()
    expect(settled).toBe(false)

    allFontsReady.resolve(fonts)
    await waiting
    expect(settled).toBe(true)
  })

  it('settles when the font face fails so a fallback font can be used', async () => {
    const fonts = {
      load: vi.fn().mockRejectedValue(new Error('Font unavailable')),
      ready: Promise.resolve({} as FontFaceSet),
    } as unknown as FontFaceSet

    await expect(waitForCriticalFonts(fonts)).resolves.toBeUndefined()
  })

  it('settles when the browser does not expose the FontFaceSet API', async () => {
    await expect(waitForCriticalFonts(undefined)).resolves.toBeUndefined()
  })
})
