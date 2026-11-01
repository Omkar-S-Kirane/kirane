import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { DEVELOPER_UNIVERSE_PLANETS } from '@/data/developerUniverse'
import { PlanetInformationCard } from './PlanetInformationCard'

afterEach(cleanup)

const planet = (id: string) => {
  const found = DEVELOPER_UNIVERSE_PLANETS.find((item) => item.id === id)
  if (!found) throw new Error(`missing planet ${id}`)
  return found
}

describe('PlanetInformationCard', () => {
  it('presents the technology with a clear hierarchy', () => {
    render(
      <I18nProvider>
        <PlanetInformationCard
          planet={planet('react')}
          relatedNames={['JavaScript', 'TypeScript', 'HTML5', 'CSS3']}
          mode="sheet"
        />
      </I18nProvider>,
    )

    const card = screen.getByRole('complementary', {
      name: 'Selected planet: React',
    })
    expect(card).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'React' })).toBeInTheDocument()
    expect(screen.getByText('Frontend Development')).toBeInTheDocument()
    expect(screen.getByText('4+ years')).toBeInTheDocument()
    expect(screen.getByText('12+')).toBeInTheDocument()
    expect(screen.getByText('Advanced')).toBeInTheDocument()
    expect(screen.getByText('Component Architecture')).toBeInTheDocument()
    expect(
      screen.getByText('JavaScript, TypeScript, HTML5, CSS3'),
    ).toBeInTheDocument()
  })

  it('says when a statistic is not specified', () => {
    render(
      <I18nProvider>
        <PlanetInformationCard
          planet={planet('aws')}
          relatedNames={[]}
          mode="sheet"
        />
      </I18nProvider>,
    )

    expect(screen.getAllByText('Not specified')).toHaveLength(2)
    expect(screen.getByText('Learning')).toBeInTheDocument()
  })

  it('can be dismissed in the mobile sheet layout', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <I18nProvider>
        <PlanetInformationCard
          planet={planet('git')}
          relatedNames={['GitHub']}
          mode="sheet"
          onClose={onClose}
        />
      </I18nProvider>,
    )

    await user.click(
      screen.getByRole('button', { name: 'Close technology details' }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
