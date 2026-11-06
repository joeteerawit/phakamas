import { motion, useReducedMotion } from 'motion/react'
import { useStageBleed } from '../../../ui/stage/Stage'

const COMIC = '/assets/comic'
const layer = 'pointer-events-none absolute select-none'

// Stage pixels. Negative delays start each loop part-way through so the scene is alive on arrival.
const clouds = [
  { top: 40, width: 320, duration: 70, delay: -20 },
  { top: 160, width: 210, duration: 95, delay: -60 },
  { top: 95, width: 260, duration: 120, delay: -95 },
]

const flowers = [
  { left: 1560, top: 700, width: 170, delay: 0 },
  { left: 1760, top: 790, width: 130, delay: -1.3 },
  { left: 120, top: 760, width: 150, delay: -2.1 },
  { left: 640, top: 810, width: 120, delay: -0.7 },
]

const flyers = [
  { src: 'decor-bird.webp', top: 210, width: 130, duration: 24, delay: -4 },
  { src: 'decor-bee.webp', top: 815, width: 90, duration: 17, delay: -11 },
  { src: 'decor-bee.webp', top: 250, width: 70, duration: 21, delay: -17 },
]

/**
 * The Step 1 scene: a busy, moving meadow scaled to cover the window (docs/comic-art.md). It sits behind
 * the sign and buttons so nothing crosses the words. CSS and Motion transforms only; reduced motion stills it.
 */
export function CoverDecor() {
  const still = useReducedMotion()
  const bleed = useStageBleed()
  const decor = (src: string) => `${COMIC}/${src}`

  return (
    <div data-testid="cover-decor" className="absolute inset-0" style={{ transform: `scale(${bleed.scale})` }}>
      <img src={decor('cover-scene.webp')} alt="" draggable={false} className={`${layer} inset-0 size-full`} />
      <img src={decor('decor-sun.webp')} alt="" draggable={false} className={`${layer} top-[24px] left-[1030px] w-[180px] animate-sun-pulse motion-reduce:animate-none`} />
      {clouds.map((cloud) => (
        <img
          key={cloud.top}
          src={decor('decor-cloud.webp')}
          alt=""
          draggable={false}
          className={`${layer} left-0 animate-cloud-drift will-change-transform motion-reduce:animate-none`}
          style={{ top: cloud.top, width: cloud.width, animationDuration: `${cloud.duration}s`, animationDelay: `${cloud.delay}s` }}
        />
      ))}

      <img src={decor('decor-elephant.webp')} alt="" draggable={false} className={`${layer} top-[440px] left-[1540px] w-[250px] animate-amble motion-reduce:animate-none`} />

      <motion.img
        src={decor('cover-tree.webp')}
        alt=""
        draggable={false}
        className={`${layer} top-[-24px] left-[-300px] w-[970px] origin-top`}
        animate={still ? undefined : { rotate: [-1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
      <img src={decor('cover-tree.webp')} alt="" draggable={false} className={`${layer} top-0 right-[-380px] w-[970px] -scale-x-100`} />

      {flowers.map((flower) => (
        <img
          key={flower.left}
          src={decor('decor-flowers.webp')}
          alt=""
          draggable={false}
          className={`${layer} origin-bottom animate-sway motion-reduce:animate-none`}
          style={{ left: flower.left, top: flower.top, width: flower.width, animationDelay: `${flower.delay}s` }}
        />
      ))}

      <img src={decor('decor-rabbit.webp')} alt="" draggable={false} className={`${layer} top-[770px] left-[1000px] w-[120px] origin-bottom animate-hop motion-reduce:animate-none`} />
      <img src={decor('decor-butterfly.webp')} alt="" draggable={false} className={`${layer} top-[640px] left-[1620px] w-[80px] animate-flutter motion-reduce:animate-none`} />
      <img src={decor('decor-butterfly.webp')} alt="" draggable={false} className={`${layer} top-[800px] left-[320px] w-[64px] animate-flutter motion-reduce:animate-none [animation-delay:-3s]`} />

      {flyers.map((flyer) => (
        <div
          key={flyer.top}
          className={`${layer} left-0 animate-fly-across will-change-transform motion-reduce:hidden`}
          style={{ top: flyer.top, animationDuration: `${flyer.duration}s`, animationDelay: `${flyer.delay}s` }}
        >
          <img src={decor(flyer.src)} alt="" draggable={false} className="animate-fly-bob" style={{ width: flyer.width }} />
        </div>
      ))}

      <img src={decor('cover-bushes.webp')} alt="" draggable={false} className={`${layer} bottom-[-30px] left-[-40px] w-[1020px]`} />
      <img src={decor('cover-bushes.webp')} alt="" draggable={false} className={`${layer} right-[-40px] bottom-[-30px] w-[900px] -scale-x-100`} />
    </div>
  )
}
