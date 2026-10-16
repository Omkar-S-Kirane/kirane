import { motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { useTranslation } from '@/i18n'
import { fadeInUp, staggerChildren } from '@/lib/animations/motion-variants'

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="flex min-h-svh items-center pt-24">
      <Container className="flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="flex flex-col items-center gap-6"
        >
          <motion.p
            variants={fadeInUp}
            className="text-sm font-medium uppercase tracking-widest text-accent"
          >
            {t.hero.tagline}
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl font-medium tracking-tight text-fg sm:text-7xl lg:text-8xl"
          >
            {t.hero.heading}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="max-w-lg text-lg leading-relaxed text-fg-muted"
          >
            {t.hero.description}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex gap-4 pt-4">
            <Button variant="primary">{t.hero.viewWork}</Button>
            <Button variant="secondary">
              <ArrowDown className="mr-2 h-4 w-4" />
              {t.hero.learnMore}
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
