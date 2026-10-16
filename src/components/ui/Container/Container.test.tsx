import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Container } from './Container'

afterEach(cleanup)

describe('Container', () => {
  it('supports full-width, page-gutter, safe-area-aware layouts without centering', () => {
    render(
      <Container
        maxWidth="full"
        padding="page"
        centered={false}
        safeArea
      >
        Splash content
      </Container>,
    )

    const container = screen.getByText('Splash content')

    expect(container.className).toContain('max-w-none')
    expect(container.className).not.toContain('mx-auto')
    expect(container).toHaveStyle({
      paddingInlineStart:
        'max(var(--layout-page-gutter), env(safe-area-inset-left, 0px))',
      paddingInlineEnd:
        'max(var(--layout-page-gutter), env(safe-area-inset-right, 0px))',
    })
  })
})
