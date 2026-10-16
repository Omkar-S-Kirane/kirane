type CriticalFontSet = Pick<FontFaceSet, 'load' | 'ready'>

/** Load the variable face used by the splash and hero, falling back safely. */
export async function waitForCriticalFonts(
  fonts: CriticalFontSet | undefined,
): Promise<void> {
  if (!fonts) return

  try {
    await fonts.load('500 16px "Space Grotesk"')
    await fonts.ready
  } catch {
    // Font failures leave the existing system font stack available.
  }
}
