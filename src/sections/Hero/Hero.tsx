import { motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { fadeInUp, staggerChildren } from '@/lib/animations/motion-variants'

export function Hero() {
  return (
    <section className="flex min-h-svh items-center pt-16">
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
            Creative Developer
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl font-medium tracking-tight text-fg sm:text-7xl lg:text-8xl"
          >
            KIRANE
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="max-w-lg text-lg leading-relaxed text-fg-muted"
          >
            Crafting thoughtful digital experiences with clean code and
            purposeful design.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex gap-4 pt-4">
            <Button variant="primary">View Work</Button>
            <Button variant="secondary">
              <ArrowDown className="mr-2 h-4 w-4" />
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
