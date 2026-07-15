# Awwwards-Level Web Animation Guide

A comprehensive reference for creating award-winning, jaw-dropping frontend animations in 2026.

---

## 1. The Awwwards Formula — 8 Archetypes

Award-winning sites (Awwwards Site of the Day, FWA, CSS Design Awards) cluster into recognizable archetypes. Each demands different typography, color, layout, and animation strategies. Misidentifying the archetype is the first failure mode.

### 1.1 Minimalist
Extreme whitespace, 2–3 colors maximum, restrained animation philosophy. Hero section with Lenis smooth scroll, GSAP Flip for transitions, fade-ins (opacity 0→1, translateY 20px→0, 0.6–0.8s). Typography: Inter, Suisse Int'l, Neue Haas Grotesk, Söhne at 48–120px headlines.
- **Reference:** Terminal Industries (awwwards.com — Site of the Month Sep 2025 + Developer Award, studio REJOUICE+POPAGANDE)
- **Pattern:** Centered grid with full-bleed escape hatch (`grid-template-columns: 1fr min(65ch, 100%) 1fr`), Lenis smooth scroll, GSAP Flip for state transitions
- **Use case:** SaaS, luxury brands, architecture studios, high-end portfolios

### 1.2 Editorial / Magazine
Kinetic typography, variable font animations, scroll-driven reveals. Heavy SplitText (chars/words/lines) with mask property. Multi-column layouts with staggered content reveals. The framing device — persistent hero or sticky nav — is critical for editorial pacing.
- **Reference:** The Ringer, Epic Agency (epic.net), The Power of Storytelling by Noomo Agency (Awwwards SOTD Jun 2026)
- **Pattern:** Variable font weight shifts on scroll, line-by-line mask reveals, Lenis + ScrollTrigger for parallax text layers

### 1.3 3D / Immersive
Full-screen WebGL/WebGPU scenes, React Three Fiber, custom shaders, post-processing pipeline (bloom, DOF, chromatic aberration). Scroll-driven 3D camera choreography. Frequently uses GSAP + R3F synced via Lenis.
- **Reference:** Non-Linear Studio (non-linear.studio), Samsy (samsy.ninja — WebGPU 120+ FPS cyberpunk portfolio, Awwwards SOTD Oct 2025), Bilal Elmossaoui (bilal.show — scroll-driven 3D story), Bruno Simon (bruno-simon.com — interactive vehicle portfolio)
- **Pattern:** Camera position mapped to scroll progress via `useFrame` + `scrollY`, R3F `Float` for idle hover, `MeshTransmissionMaterial` for glass/iridescent effects

### 1.4 Bento Grid
Modular card layouts with micro-interactions on hover. Grid items scale, tilt, shift on interaction. Hover state: scale(1.05), z-index bump, siblings desaturate/grayscale. CSS `:has()` enables parent-aware child styling.
- **Reference:** Apple, Google, Spotify product pages, Koto (koto.com — Honorable Mention Awwwards Mar 2026)
- **Pattern:** `grid-item:not(:hover) { filter: grayscale(1); }`, ASM (Allergy Shovel Mining) effect — single bouncy element per interaction

### 1.5 Product / Showcase
Cinematic scroll story. Pinned sections, horizontal scroll panels, video/image reveals with clip-path. Apple-style product page choreography where 3D model rotation maps to scroll. GSAP timeline with ScrollTrigger pinning each section.
- **Reference:** Apple product pages (gold standard for 3D on the web — iPhone/MacBook product pages), Montage (montagebook.com — Awwwards featured product showcase)
- **Pattern:** `scrollTrigger: { pin: true, scrub: 1 }` per section, product 3D model rotates via `useFrame` driven by scroll progress

### 1.6 Playful / Experimental
WebGL canvas + DOM overlay. Custom cursors, magnetic buttons, morphing SVG icons, liquid distortion (displacement maps), Rive state machines for interactive characters. High interactivity with spring physics.
- **Reference:** BDSN Club (bdsn.club — experimental playground), Basement Studio (basement.studio — "we make cool shit that performs"), Immersive Garden (2025 Awwwards Agency of the Year)
- **Pattern:** Canvas particle background reacting to cursor, GSAP elastic easing on hover, Rive state machines for UI mascot/interactive elements

### 1.7 Data Visualization
Animated charts, scroll-driven infographics, canvas-rendered real-time data. Three.js particle networks + GSAP triggers. D3.js transitions, PixiJS for real-time data streams. WebGPU compute shaders for simulation-based visualizations.
- **Reference:** ESPN Sports Programming (awwwards.com — data-rich sports content)

### 1.8 Museum / Cultural
Full-screen image reveals, clip-path transitions, horizontal scroll galleries, film-roll effects. Parallax depth, slow cinematic pacing, ambient background video/motion.
- **Reference:** Frans Hals Museum (franshalsmuseum.nl), Cartier Watches & Wonders (Awwwards SOTD), 100 Lost Species
- **Pattern:** Film-roll horizontal scroll with Lenis, Lenis + GSAP cinematic experience with expanding video player and dramatic footer reveal

---

## 2. Core Animation Libraries

### GSAP (GreenSock Animation Platform) — The Undisputed King

The industry standard for production web animation. Used by Google, Apple, Disney, and the majority of Awwwards winners. **Now 100% free** (thanks to Webflow's acquisition).

```
npm install gsap @gsap/react
```

**Key features:**
- **Timelines** — Sequence animations with precise control (`gsap.timeline()`)
- **ScrollTrigger** — Scroll-driven animations with pinning, scrubbing, snapping, batch
- **SplitText** (free since GSAP 3.13) — Character/word/line-level text animations
- **MorphSVG** — Morph between any two SVG paths (even with different point counts)
- **Draggable+Inertia** — Drag interactions with momentum
- **Flip** — Animate elements from one layout state to another
- **MotionPath** — Animate objects along SVG paths
- **ScrollSmoother** — Premium smooth scrolling with native scroll integration

**Bundle:** ~23KB gzipped (core), ~60KB with plugins

```js
// Timeline with stagger
gsap.timeline()
  .from(".hero-title", { y: 100, opacity: 0, duration: 1 })
  .from(".hero-subtitle", { y: 50, opacity: 0, duration: 0.8 }, "-=0.5")
  .from(".hero-cta", { scale: 0, duration: 0.4, ease: "back.out(2)" }, "-=0.3");

// ScrollTrigger with scrub
gsap.to(".progress-bar", {
  width: "100%",
  scrollTrigger: {
    trigger: ".content",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    pin: true
  }
});
```

### Motion (formerly Framer Motion) — React's Natural Extension

React-native declarative animation library. Now the dominant choice for React developers. Best for UI animations, layout animations, and gesture-based interactions.

```
npm install motion
```

**Key features:**
- Declarative `motion` components with hybrid GPU-accelerated engine (120fps)
- `AnimatePresence` for enter/exit animations
- Layout animations (smooth DOM reordering via FLIP)
- Gesture animations (drag, hover, tap)
- Variants system for coordinated parent-child animations
- `useScroll`, `useSpring`, `useTransform` hooks
- `AnimateSharedLayout` for shared element transitions
- First-class JavaScript and Vue support

**Bundle:** ~18KB gzipped (core), ~46KB (full React)

```jsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  viewport={{ once: true, margin: "-100px" }}
>
  <h2>Reveal on scroll</h2>
</motion.div>

// Stagger children
<motion.ul variants={containerVariants} initial="hidden" whileInView="show">
  {items.map((item) => (
    <motion.li key={item} variants={itemVariants} />
  ))}
</motion.ul>

// Scroll-linked parallax
function ParallaxSection() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  return <motion.div style={{ y }} />;
}
```

### Three.js / React Three Fiber — 3D & WebGL

For 3D WebGL experiences — 3D scenes, particle systems, custom shaders, post-processing.

```
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

**Key features:**
- 3D rendering in the browser
- Custom GLSL shaders / TSL (Three Shading Language — JavaScript-based)
- GPU-accelerated particle systems (millions of points)
- 3D model loading (glTF, GLB via drei)
- Post-processing effects (bloom, DOF, SSAO, chromatic aberration)
- WebGPU renderer (universal since Safari 26, Sept 2025)
- Physics via @react-three/rapier

**Bundle:** ~60KB gzipped (Three.js core)

```jsx
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Scene({ scrollProgress }) {
  const mesh = useRef();
  useFrame(() => {
    mesh.current.rotation.y = scrollProgress * Math.PI * 2;
  });
  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[1, 0.4, 128, 64]} />
      <MeshTransmissionMaterial
        backside
        thickness={0.5}
        roughness={0.1}
        chromaticAberration={0.5}
        ior={1.5}
      />
    </mesh>
  );
}

<R3F.Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
  <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
    <Scene />
  </Float>
  <EffectComposer>
    <Bloom mipmapBlur luminanceThreshold={0.2} intensity={1.5} />
  </EffectComposer>
</R3F.Canvas>
```

### Anime.js v4
Lightweight (~17KB) with concise API. Great for SVG morphing, staggered animations, and utility animation.

```js
anime({
  targets: ".card",
  translateY: [40, 0],
  opacity: [0, 1],
  duration: 600,
  delay: anime.stagger(100),
  easing: "easeOutQuad"
});
```

### PixiJS — 2D WebGL/WebGPU Powerhouse

2D WebGL/WebGPU renderer for high-performance sprite/particle effects, image manipulation, and GPU-accelerated 2D scenes. ~100KB gzipped.

**PixiJS v8** introduced `ParticleContainer` and `Particle` classes — render 100K+ particles at 60fps by stripping away children, events, and filters overhead. Declare which properties are dynamic (updated every frame) vs static (set once) for GPU buffer optimization.

```js
import { ParticleContainer, Particle, Texture } from 'pixi.js';

const container = new ParticleContainer({
  dynamicProperties: {
    position: true,  // updated every frame
    rotation: false,  // set once
    color: false,
    vertex: false,
  }
});

for (let i = 0; i < 100000; i++) {
  const particle = new Particle({
    texture: Texture.from('spark.png'),
    x: Math.random() * 800,
    y: Math.random() * 600,
  });
  container.addParticle(particle);
}
app.stage.addChild(container);
```

**Limitations:** No `addChild()`, no events, no filters on individual particles. Use `addParticle()` / `removeParticle()` instead.

**PixiJS Particle Emitter** (`@pixi/particle-emitter`) — production particle system with behaviors (alpha, scale, rotation, color, acceleration, custom). Interactive editor at pixijs.github.io/pixi-particles-editor.

**WebGPU Renderer:** PixiJS v8 ships `WebGPURenderer` — silently falls back to WebGL 2 on unsupported browsers.

### Other Libraries Worth Knowing
| Library | Best For | Bundle |
|---------|----------|--------|
| **React Spring** | Physics-based React animations | ~12KB |
| **AutoAnimate** | Zero-config list/layout transitions | ~3KB |
| **Lottie / dotLottie** | Designer-created After Effects animations | ~60KB |
| **Rive** | State-machine interactive animations | ~80KB |
| **Spline** | Browser-based 3D design → web export | Varies |
| **Theatre.js** | Visual timeline editor + code | ~15KB |

---

## 3. Lenis — Smooth Scrolling (Industry Standard 2026)

Lenis by Darkroom Engineering has replaced Locomotive Scroll as the go-to smooth scroll library. Under 4KB gzipped, zero dependencies, runs on native scroll, maintains accessibility.

**Why Lenis over alternatives:**
- Locomotive Scroll: 12–24KB gzipped, uses CSS transforms (breaks position:sticky), no page search support
- GSAP ScrollSmoother: Premium/paid, heavier
- Lenis: Under 4KB, runs on main thread, supports position:sticky, native scrollbar, IntersectionObserver, CSS sticky

```
npm install lenis
```

```js
import Lenis from "lenis";

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: "vertical",
  smoothWheel: true,
  syncTouch: true, // replaces deprecated smoothTouch
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

### React Integration (lenis/react)

```jsx
"use client";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

export default function SmoothScroll({ children }) {
  const lenis = useLenis((lenis) => {
    // called every scroll
  });

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      {children}
    </ReactLenis>
  );
}
```

### Lenis + GSAP ScrollTrigger Sync (Critical!)

```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
```

### Lenis Data Attributes

```html
<button data-lenis-stop>Clicking stops scroll</button>
<button data-lenis-start>Clicking starts scroll</button>
<button data-lenis-toggle>Toggle scroll</button>
<div data-lenis-prevent style="overflow: auto">
  Scrollable inner area
</div>
```

---

## 4. GSAP ScrollTrigger — Scroll Choreography

### Core Mental Model

Every ScrollTrigger has three concepts:
1. **Trigger** — Which element controls the scroll logic
2. **Start** — When animation starts (e.g., `"top 80%"` — trigger top hits 80% of viewport)
3. **End** — When animation ends

### 10 Production-Ready Patterns

```js
// 1. Element Reveal on Scroll (most common)
gsap.from(".card", {
  scrollTrigger: { trigger: ".card", start: "top 85%", toggleActions: "play none none none" },
  opacity: 0, y: 40, duration: 0.8, ease: "expo.out"
});

// 2. Staggered Reveal for Multiple Elements
gsap.from(gsap.utils.toArray(".card"), {
  scrollTrigger: { trigger: ".cards-grid", start: "top 80%" },
  opacity: 0, y: 40, duration: 0.8, ease: "expo.out", stagger: 0.1
});

// 3. Scrub (scroll controls progress — forward & reverse)
gsap.to(".box", {
  x: 300, rotation: 360,
  scrollTrigger: {
    trigger: ".section",
    start: "top center", end: "bottom center",
    scrub: true // or scrub: 1 for 1-second smooth delay
  }
});

// 4. Pin + Timeline with Snap
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".pin-section", start: "top top", end: "+=2000",
    pin: true, scrub: 1,
    snap: { snapTo: "labels", duration: { min: 0.2, max: 3 } }
  }
});
tl.addLabel("start")
  .from(".box p", { scale: 0.3, rotation: 45, autoAlpha: 0, stagger: 0.1 })
  .addLabel("end");

// 5. Horizontal Scroll
const sections = gsap.utils.toArray(".panel");
gsap.to(sections, {
  xPercent: -100 * (sections.length - 1), ease: "none",
  scrollTrigger: {
    trigger: ".container", pin: true, scrub: 1, start: "top top",
    end: () => "+=" + (document.querySelector(".container").scrollWidth - window.innerWidth)
  }
});

// 6. Parallax
gsap.to(".parallax-bg", {
  y: -200, ease: "none",
  scrollTrigger: { trigger: ".section", start: "top bottom", end: "bottom top", scrub: true }
});

// 7. Batch Animations (performance-optimized for many elements)
ScrollTrigger.batch(".reveal", {
  onEnter: (elements) => gsap.from(elements, { opacity: 0, y: 50, stagger: 0.1 }),
  start: "top 85%"
});

// 8. Text Reveal by Lines (with SplitText)
import { SplitText } from "gsap/SplitText";
const split = SplitText.create(".headline", { type: "lines", mask: "lines" });
gsap.from(split.lines, {
  scrollTrigger: { trigger: ".headline", start: "top 80%" },
  yPercent: 100, opacity: 0, stagger: 0.05
});

// 9. Card Stacking
gsap.utils.toArray(".card").forEach((card, i) => {
  gsap.to(card, {
    scrollTrigger: { trigger: card, start: "top top", pin: true, scrub: true },
    y: `+=${i * 50}`, scale: 1 - i * 0.05, opacity: 1 - i * 0.15
  });
});

// 10. SVG Line Drawing on Scroll
gsap.to("path", {
  strokeDashoffset: 0,
  scrollTrigger: { trigger: "svg", start: "top 80%", end: "bottom 20%", scrub: true }
});
```

### ScrollTrigger + React (useGSAP)

```jsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function Section() {
  const container = useRef();
  useGSAP(() => {
    gsap.from(".box", {
      y: 100, opacity: 0, stagger: 0.1,
      scrollTrigger: { trigger: container.current, start: "top 80%" }
    });
  }, { scope: container, revertOnUpdate: true });

  return <div ref={container}>{/* ... */}</div>;
}
```

### Debugging with Markers

```js
scrollTrigger: {
  trigger: ".section",
  start: "top 80%",
  markers: true // shows start/end markers visually
}
```

---

## 5. CSS Scroll-Driven Animations (No JS, ~90% Support)

The View Timeline API (`animation-timeline: view()`) and Scroll Timeline API (`animation-timeline: scroll()`) are now production-ready in 2026. They run on the compositor thread (GPU-accelerated, no main thread jank) and replace entire categories of JavaScript.

**Browser support (2026):** Chrome 115+, Edge 115+, Firefox 126+, Safari 18+ — now universal across all major engines.

In 2026, the Scroll-driven Animations Specification has reached universal browser support. Sophisticated orchestrations are now possible without a single line of main-thread JavaScript.

### View Timeline — Trigger on Element Visibility

```css
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeSlideIn 1s ease both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Scroll Timeline — Tie Animation to Page Scroll

```css
.progress-bar {
  animation: grow linear;
  animation-timeline: scroll(root);
}

@keyframes grow {
  from { width: 0%; }
  to   { width: 100%; }
}
```

### Named Scroll Timelines

```css
.scroll-container {
  overflow-y: scroll;
  scroll-timeline: --container-scroll y;
}

.animated-element {
  animation: slide linear;
  animation-timeline: --container-scroll;
}
```

### Animation Range Keywords

- `entry` — Element entering viewport (0% = first visible pixel, 100% = fully entered)
- `exit` — Element leaving viewport
- `cover` — Element covering viewport space
- `contain` — Viewport containing the element

```css
.element {
  animation-timeline: view();
  animation-range: entry 10% cover 50%;
}
```

### Fallback Strategy

```css
/* Post-animation state as default (critical for Firefox!) */
.reveal { opacity: 1; transform: none; }

@supports (animation-timeline: view()) {
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    animation: fadeSlideIn 1s ease both;
    animation-timeline: view();
    animation-range: entry 0% cover 40%;
  }
}
```

### Advanced CSS Scroll-Driven Patterns

**Scroll-Driven Gallery (3D coverflow):**
```css
.gallery-item {
  view-timeline-name: --item;
  view-timeline-axis: inline;
  animation: coverflow linear;
  animation-timeline: --item;
}
@keyframes coverflow {
  entry 0% { transform: scale(0.5) rotateY(45deg); opacity: 0; }
  entry 100% { transform: scale(1) rotateY(0deg); opacity: 1; }
  exit 0% { transform: scale(1) rotateY(0deg); opacity: 1; }
  exit 100% { transform: scale(0.5) rotateY(-45deg); opacity: 0; }
}
```

**Scroll-Driven Gooey Island (Jhey pattern):**
```css
.gooey {
  filter: url(#goo);
  animation: morph-island linear;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}
@keyframes morph-island {
  from { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  to   { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
```

**Scroll Mask Indicators (fade-to-mist edge):**
```css
.scrollable {
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  mask-size: 100% 100%;
  animation: fade-edges linear;
  animation-timeline: scroll(self);
}
@keyframes fade-edges {
  entry 0%   { mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent); }
  exit 100%  { mask-image: none; }
}
```

**Scroll-Driven Grid with CSS-Doodle:**
```css
/* Combine with <css-doodle> web component for generative scroll-driven grid art */
css-doodle {
  animation: grid-morph linear;
  animation-timeline: scroll(root);
}
```

### Production Rules
1. Always use `animation-fill-mode: both` or elements snap back
2. `linear` easing is correct — user's scroll provides the easing
3. Do NOT set pre-animation state as default outside `@supports`
4. ~5-8% of desktop sessions still lack support — always provide fallback
5. Combine with `@media (prefers-reduced-motion: reduce)` for accessibility

### What You Can Replace
| JS Library | CSS Alternative |
|-----------|----------------|
| Intersection Observer | `animation-timeline: view()` |
| AOS.js | `animation-timeline: view()` + `animation-range` |
| GSAP ScrollTrigger (simple reveals) | `animation-timeline: view()` |
| Reading progress bars | `animation-timeline: scroll(root)` |
| Parallax (simple) | `animation-timeline: scroll()` with `translateY` |
| Coverflow/3D carousel JS | `view-timeline` + 3D transforms |

---

## 6. Text & Kinetic Typography

### GSAP SplitText (Character/Word/Line Level) — Free since 3.13

```js
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(SplitText);

// Wait for fonts before splitting!
document.fonts.ready.then(() => {
  // Character reveal on scroll
  const split = SplitText.create(".headline", { type: "chars" });
  gsap.from(split.chars, {
    opacity: 0, y: 40, duration: 0.6, stagger: 0.02, ease: "expo.out",
    scrollTrigger: { trigger: ".headline", start: "top 85%" }
  });

  // Line reveal with mask (3.13+)
  const splitLines = SplitText.create(".text", {
    type: "lines", mask: "lines",
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 100, opacity: 0, stagger: 0.05
      });
    }
  });
});
```

### React SplitText Pattern

```jsx
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

function AnimatedHeadline({ children }) {
  const container = useRef();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(() => {
    if (!fontsLoaded) return;
    const split = SplitText.create(container.current, { type: "chars" });
    gsap.from(split.chars, {
      opacity: 0, y: 40, duration: 0.6, stagger: 0.02, ease: "expo.out",
      scrollTrigger: { trigger: container.current, start: "top 85%" }
    });
    return () => split.revert();
  }, { scope: container, dependencies: [fontsLoaded] });

  return <h2 ref={container}>{children}</h2>;
}
```

### 7 SplitText Animation Styles

| Style | Properties | Feel |
|-------|-----------|------|
| **Fade** | opacity: 0→1 | Gentle reveal |
| **Scale** | scale(0.3)→1, rotate(15deg)→0 | Playful pop |
| **Blur** | filter: blur(10px)→0 | Cinematic focus |
| **Rotate** | rotateX(-90deg)→0 | 3D flip |
| **Clip mask** | overflow hidden + yPercent: 100→0 | Clean wipe |
| **Slide** | x: -50→0 | Directional |
| **Elastic** | ease: "elastic.out(1, 0.3)" | Bouncy spring |

### CSS-Only Text Reveals

```css
/* Clip reveal */
.text-reveal {
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  animation: reveal 1.5s ease forwards;
  animation-timeline: view();
  animation-range: entry 0% entry 80%;
}
@keyframes reveal {
  to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}

/* Mask reveal */
.text-mask {
  mask-image: linear-gradient(90deg, transparent 40%, black 60%);
  mask-size: 200% 100%;
  mask-position: 100% 0;
  animation: textReveal linear;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
@keyframes textReveal {
  from { mask-position: 100% 0; }
  to   { mask-position: 0% 0; }
}
```

### Variable Font Animation

```css
@keyframes weightShift {
  from { font-variation-settings: "wght" 100, "wdth" 75; }
  to   { font-variation-settings: "wght" 900, "wdth" 125; }
}

.animated-variable {
  animation: weightShift 2s ease infinite alternate;
  animation-timeline: view();
}
```

### Kinetic Typography — Glitch / Scramble Effect

```js
// GSAP ScrambleText effect
gsap.to(".glitch-text", {
  text: { value: "NEW MESSAGE", scramble: 0.3, speed: 0.5 },
  duration: 2, ease: "none"
});
```

### Kinetic Typography Best Practices
- **Readability first** — No matter how creative, if users can't read, the message is lost
- **Punchy words deserve more screen time** — Sync key moments with emphasis
- **Don't auto-play infinitely** — Users must be able to pause
- **Respect prefers-reduced-motion** — Essential for accessibility and Core Web Vitals
- **Performance:** Only animate `transform` and `opacity`
- **Mobile risk:** 63% of traffic is mobile; kinetic typography affects LCP and layout stability

---

## 7. SVG Animations

### Line Drawing (stroke-dasharray technique)

```css
path {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: draw 2s ease forwards;
  animation-timeline: view();
}
@keyframes draw {
  to { stroke-dashoffset: 0; }
}
```

```js
// Get path length via JS
const path = document.querySelector("path");
const length = path.getTotalLength();
path.style.setProperty("--path-length", length);
```

### SVG Morphing (GSAP MorphSVGPlugin)

```js
gsap.to("#icon", {
  morphSVG: "#icon-final",
  duration: 1, ease: "power2.inOut",
  scrollTrigger: { trigger: ".section", scrub: 1 }
});
```

### SVG Morphing (CSS only — matching point counts)

```css
@keyframes morph {
  0%   { d: path("M10 80 Q50 10 90 80"); }
  100% { d: path("M10 20 Q50 90 90 20"); }
}
path { animation: morph 2s ease infinite alternate; }
```

### GSAP MotionPath — Animate Along SVG Paths

```js
gsap.to(".plane", {
  motionPath: {
    path: "#flight-path", align: "#flight-path",
    alignOrigin: [0.5, 0.5], autoRotate: true
  },
  scrollTrigger: { trigger: ".section", scrub: 1 }
});
```

### SVG Filter Effects (no JS)

```css
.svg-glitch { filter: url(#glitch); }
```

```html
<filter id="glitch">
  <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise">
    <animate attributeName="baseFrequency" values="0.01;0.05;0.01" dur="0.2s" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

---

## 8. WebGL / GLSL Shader Effects

### Displacement / Bulge Distortion (Three.js)

```glsl
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float dist = distance(uv, uMouse);
  float bulge = 1.0 + 0.3 * exp(-dist * 10.0) * sin(uTime * 2.0);
  uv = uMouse + (uv - uMouse) * bulge;
  gl_FragColor = texture2D(uTexture, uv);
}
```

### Lens Distortion / RGB Shift / Chromatic Aberration

```glsl
vec2 uv = vUv;
float shift = 0.02 * sin(uTime);
float r = texture2D(uTexture, uv + vec2(shift, 0.0)).r;
float g = texture2D(uTexture, uv).g;
float b = texture2D(uTexture, uv - vec2(shift, 0.0)).b;
gl_FragColor = vec4(r, g, b, 1.0);
```

### Liquid / Fluid Distortion

```glsl
uniform float uTime;
uniform sampler2D uTexture;
varying vec2 vUv;

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float n = noise(uv * 5.0 + uTime * 0.3);
  uv += (n - 0.5) * 0.05 * sin(uTime * 0.5);
  gl_FragColor = texture2D(uTexture, uv);
}
```

### GPU Particle System (200K+ particles on GPU)

```js
const COUNT = 200_000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3);
const randoms = new Float32Array(COUNT * 3);

for (let i = 0; i < COUNT; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * 4;
  positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
  positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  positions[i*3+2] = r * Math.cos(phi);
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

// Vertex shader animates entirely on GPU — zero JS per-frame cost
```

### Curtains.js — WebGL for Images with Minimal Code

```js
const curtains = new Curtains({ container: "canvas" });
const plane = new Plane(curtains, document.querySelector("#my-image"), {
  vertexShader: vs, fragmentShader: fs
});
```

### React Three Fiber Post-Processing Pipeline

```jsx
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

<EffectComposer>
  <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
  <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.002, 0.002]} />
  <DepthOfField focusDistance={0.01} focalLength={0.02} bokehScale={2} />
</EffectComposer>
```

---

## 9. WebGPU — Next-Gen Browser Graphics (2026)

WebGPU has reached ~85% global browser support in 2026. It supersedes WebGL with direct access to Vulkan/Metal/Direct3D 12, compute shaders, and 20–50% faster performance.

**Key advantages over WebGL:**
- Compute shaders (GPU-accelerated physics, AI inference, data processing)
- Explicit memory management — no GPU memory leaks
- Multi-threaded rendering pipeline
- ~84% browser support (Chrome, Edge, Safari; Firefox in dev)

```js
async function initWebGPU() {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("webgpu");
  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "opaque"
  });
}
```

**Libraries using WebGPU:**
- **Three.js r171+** — WebGPU renderer (silently falls back to WebGL 2)
- **PixiJS v8** — WebGPURenderer for 2D
- **Babylon.js** — WebGPU support
- **Shaders** (shaders.com) — 90+ composable WebGPU effect components for React/Vue/Svelte/Solid. Aurora, RadialGradient, SineWave, Dither, Glass, Glow — declarative `<Shader>` wrapper handles canvas setup + render loop. Free open-source library + Pro preset collections with visual editor.
- **OpenShaders** (openshaders.com) — Free open-source community-driven directory of WebGPU shader components (Light Rays, Staggered Fade, etc.) — like ShadCN but for GPU effects.

```jsx
// Shaders.com component-based WebGPU — no GLSL/WGSL required
import { Shader, Aurora, SineWave, Dither } from 'shaders/react';

function HeroBackground() {
  return (
    <Shader style={{ width: '100%', height: '100vh' }}>
      <Aurora color="#4a00e0" speed={0.5} />
      <SineWave amplitude={0.03} frequency={2.4} />
      <Dither intensity={0.4} />
    </Shader>
  );
}
```

*Use case: particle systems with millions of particles, real-time ML in browser (Transformers.js via WebGPU compute), physics simulations, 120+ FPS 3D (samsy.ninja), declarative GPU effects without shader math (Shaders.com)*

---

## 10. View Transitions API — Page Transitions Without Libraries

The CSS View Transitions API hit Baseline Newly Available in late 2025. It allows SPA-like page transitions without JavaScript animation libraries.

### The 2026 View Transitions Landscape

Cross-document view transitions are now the industry standard for Multi-Page Applications (MPAs). The browser takes a "visual snapshot" of the outgoing page, loads the new page in the background, then performs a "live interpolation" between shared elements. Supported in Chrome 126+, Safari 18.2+, and Firefox (behind flags).

### Cross-Document (MPA) — CSS Only, 3 Lines

```css
@view-transition {
  navigation: auto;
}
```

Adds ~70ms to LCP on mobile — mitigate with Speculation Rules (prerendering). Also supports `<meta name="view-transition" content="same-origin">`.

### Same-Document (SPA) — JavaScript

```js
document.startViewTransition(() => {
  updateDOM(); // swap DOM state
});

// With async callback
async function navigate(url) {
  const content = await fetch(url).then(r => r.text());
  document.startViewTransition(() => {
    document.querySelector('main').innerHTML = content;
  });
}
```

### Customizing Transitions

```css
/* Full page transition — slide + fade */
::view-transition-old(root) {
  animation: slideOut 0.4s ease;
}
::view-transition-new(root) {
  animation: slideIn 0.4s ease;
}
@keyframes slideOut {
  to { transform: translateX(-30%); opacity: 0; }
}
@keyframes slideIn {
  from { transform: translateX(30%); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

/* Element morphing across pages — shared element transition */
.card-thumbnail { view-transition-name: hero-image; }
.article-header-img { view-transition-name: hero-image; }

/* Customize specific element morph animation */
::view-transition-group(hero-image) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Advanced Patterns

**Stack Navigator (like iOS):**
```css
/* Forward navigation — slide left */
::view-transition-old(root) {
  animation: 0.3s ease slideOut;
}
/* Back navigation — slide right */
html:active-view-transition-type(reverse) {
  ::view-transition-old(root) {
    animation: 0.3s ease slideLeftOut;
  }
  ::view-transition-new(root) {
    animation: 0.3s ease slideRightIn;
  }
}
```

**Circular Clip Reveal:**
```css
::view-transition-old(root) {
  animation: 0.5s ease circle-grow;
}
@keyframes circle-grow {
  from { clip-path: circle(0%); }
  to   { clip-path: circle(100%); }
}
```

**Conditional transitions via page swap events:**
```js
document.addEventListener('pageswap', (e) => {
  if (e.viewTransition && e.navigationType === 'traverse') {
    // Customize for back/forward navigation
  }
});
```

### Production Notes
- ~89% browser support in 2026 (cross-document: Chrome 126+, Safari 18.2+)
- Combine with Speculation Rules API to eliminate ~70ms LCP tax
- Add `prefers-reduced-motion` fallback
- Names must be unique in the DOM at any given time
- Best for: content sites, marketing pages, blogs, documentation, MPAs
- Full demo collection: view-transitions.chrome.dev

---

## 11. Parallax & Depth Effects

### CSS Pure Parallax (scroll-timeline)

```css
.layer-back  { animation: parallaxBack linear; animation-timeline: scroll(root); }
.layer-front { animation: parallaxFront linear; animation-timeline: scroll(root); }
@keyframes parallaxBack  { from { transform: translateY(-30%); } to { transform: translateY(0); } }
@keyframes parallaxFront { from { transform: translateY(10%); }  to { transform: translateY(-10%); } }
```

### GSAP ScrollTrigger Parallax

```js
gsap.to(".parallax-bg", {
  y: -200, ease: "none",
  scrollTrigger: { trigger: ".section", start: "top bottom", end: "bottom top", scrub: true }
});
```

### 3D Tilt on Mouse Move

```js
document.querySelector(".card").addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  gsap.to(card, {
    rotationY: x * 15, rotationX: -y * 15,
    transformPerspective: 1000, duration: 0.3
  });
});
card.addEventListener("mouseleave", () => {
  gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
});
```

### Data-Speed Parallax (Lenis/ScrollSmoother)

```html
<div data-speed="0.5"> <!-- Moves slower — background -->
<div data-speed="2.0"> <!-- Moves faster — foreground -->
```

---

## 12. Micro-Interactions

### Button Hover with Spring Physics

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
/>
```

### Magnetic Buttons (follow cursor)

```js
button.addEventListener("mousemove", (e) => {
  const rect = button.getBoundingClientRect();
  const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
  const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
  gsap.to(button, { x, y, duration: 0.3 });
});
button.addEventListener("mouseleave", () => {
  gsap.to(button, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
});
```

### Custom Cursor

```js
const cursor = document.querySelector(".custom-cursor");
document.addEventListener("mousemove", (e) => {
  gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15 });
});
document.querySelectorAll("a, button").forEach((el) => {
  el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
  el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
});
```

### Loading / Skeleton Animation

```css
.skeleton {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Form Micro-Interactions

```css
/* Input focus — label floats up */
.input-group:focus-within .label,
.input-group .input:not(:placeholder-shown) + .label {
  transform: translateY(-24px) scale(0.85);
  color: var(--accent);
}

/* Checkbox bounce */
.checkbox:checked + .checkmark {
  animation: bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes bounce {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
```

### Easing Cheat Sheet

| Easing | Feel | Use For |
|--------|------|---------|
| `ease-out` | Fast start, slow finish | Elements entering screen |
| `ease-in` | Slow start, fast finish | Elements leaving screen |
| `ease-in-out` | Smooth both ends | Looping, state toggles |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot bounce | Playful spring effects |
| `back.out(2)` | GSAP elastic | Cards, pop-ins |
| `elastic.out(1, 0.3)` | Bouncy spring | Fun interactions |
| `expo.out` | Fast deceleration | Scroll reveals |

### Timing Rules
- Most UI micro-animations: **120–220ms**
- Page transitions: **300–500ms**
- Scroll reveals: **600–1000ms**
- One bouncy element per interaction is enough

---

## 13. Rive vs Lottie — Interactive Vector Animation (2026)

Both tools have converged significantly. Lottie added state machines (dotLottie, late 2025) and AI-powered logic generation. Rive added runtime scripting and deeper data binding. The gap has narrowed, but key differences remain in architecture and production maturity.

| Aspect | Lottie (dotLottie) | Rive |
|--------|-------------------|------|
| File format | JSON / .lottie (compressed) | Binary .riv |
| Editor | After Effects + Bodymovin / Lottie Creator (web) | Rive Editor (all-in-one) |
| State machines | Yes (dotLottie, since late 2025) | Yes (native, mature, production-ready) |
| Interactive inputs | Yes (booleans, numbers, triggers) | Yes (booleans, numbers, triggers) |
| Data binding | Early stages (Motion Tokens) | Production-ready (bind to live data) |
| Runtime scripting | No | Yes |
| AI-assisted logic | Prompt-to-state-machine (Lottie Creator) | No |
| File size (icons) | 10–80KB JSON / 5–40KB dotLottie | 5–30KB binary |
| Runtime size (web) | ~60KB gzipped (lottie-web) | ~200KB gzipped (WASM + JS) |
| Rendering | SVG/Canvas 2D (CPU default) | WebGL/Metal (GPU-accelerated) |
| Editor learning curve | AE familiarity or Lottie Creator (intuitive) | New tool to learn (steeper for state machines) |
| Open source | Format + all runtimes fully open | Runtimes open, editor proprietary |
| Community size | Large (~16M+ users, 280K+ companies) | Growing rapidly |

**Lottie AI Features (Lottie Creator, 2026):**
- **Motion Copilot** — Prompt-to-keyframes with units (seconds, degrees), supports 14+ languages
- **Prompt to State Machines** — LLM generates visual node map with states, transitions, triggers
- **AI Theming** — Transform single animation into brand-ready variations
- **Motion Tokens** — Bind animation properties to real data (colors, text, transforms at runtime)

```js
// Lottie (lottie-react)
import Lottie from "lottie-react";
<Lottie animationData={animation} loop style={{ width: 200 }} />

// Rive (rive-react)
import { useRive, useStateMachineInput } from "rive-react";
const { RiveComponent } = useRive({
  src: "animation.riv", stateMachines: "StateMachine1", autoplay: true,
});
const hoverInput = useStateMachineInput(rive, "StateMachine1", "hover");
// Trigger state machine input on interaction
<button onMouseEnter={() => hoverInput.fire()}>Hover me</button>
```

**2026 Recommendation:**
- **Choose Lottie** if you need simple playback, your team uses After Effects, or you need widest platform compatibility. The AI Motion Copilot makes it accessible for non-animators.
- **Choose Rive** if you need interactive animations that respond to user input, application state, or live data at runtime — UI icons, micro-interactions, game-like characters, multi-state components.

---

## 14. Creative CSS Effects

### Glassmorphism

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}
```

### Clip-path Reveals

```css
.hero-image {
  clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
  animation: clipReveal 1.5s ease forwards;
  animation-timeline: view();
}
@keyframes clipReveal {
  to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
```

### Scroll-Driven Mask

```css
.image-mask {
  mask-image: linear-gradient(black, black);
  mask-size: 100% 200%;
  mask-position: 0 100%;
  animation: unmask linear;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}
@keyframes unmask {
  from { mask-position: 0 100%; }
  to   { mask-position: 0 0%; }
}
```

### Grid Hover Effects

```css
.grid-item {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.grid-item:hover {
  transform: scale(1.05); z-index: 1;
}
.grid-item:not(:hover) {
  filter: grayscale(1) blur(1px); opacity: 0.6;
}
```

### 3D Card Stack

```css
.card-stack { perspective: 1200px; }
.card {
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.card:hover {
  transform: rotateY(10deg) rotateX(5deg) translateZ(20px);
}
```

### Morphing Gradient Background

```css
.morphing-bg {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1);
  background-size: 400% 400%;
  animation: gradientMorph 15s ease infinite;
}
@keyframes gradientMorph {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Scroll-Driven Progress Bar (pure CSS)

```css
@property --scroll-progress {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}

body::before {
  content: "";
  position: fixed;
  top: 0; left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-secondary));
  z-index: 9999;
  animation: progressBar linear;
  animation-timeline: scroll(root);
}
@keyframes progressBar {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}
```

---

## 15. AI Tools for Animation (2026)

### AI Motion Design — Generation Tools
| Tool | Use Case | Cost |
|------|----------|------|
| **Lottie Creator** | AI Motion Copilot — prompt-to-keyframes with units | Free tier, paid Pro |
| **Lottie Creator** | Prompt-to-State-Machines — AI generates interactive logic | Free tier, paid Pro |
| **Rive** | State machine logic, interactive animation design | Free tier, paid Pro |
| **Runway Gen-4.5** | AI video generation, image-to-video with Motion Brush | $15+/mo |
| **Sora 2 (OpenAI)** | Highest quality AI video generation (20s clips) | Paid |
| **Veo 3.1 (Google)** | AI video with native audio | Paid |
| **Seedance 2.0** | Free AI video (1080p, no watermark) | Free tier |
| **Pika Labs** | Quick AI video/image-to-video | $10+/mo |
| **DeepMotion** | AI motion capture from video → 3D animation | Free/Paid |
| **HeyGen / D-ID** | AI avatar/narration videos | $24+/mo |
| **Cascadeur** | AI-assisted keyframe physics, auto-inbetweening | Free/Pro |
| **SVG Animate (svganimate.ai)** | AI SVG animation generator from text prompts | Free/Paid |
| **Runway Gen-4** | AI video generation, VFX | $15+/mo |

### AI-Assisted Frontend Development
| Tool | Use Case |
|------|----------|
| **GitHub Copilot** | Code completion, GSAP/R3F component generation |
| **Cursor / Windsurf** | AI-native IDE with animation code generation context |
| **Claude / GPT-4 / Gemini** | Generate GSAP/Three.js/R3F/WebGPU code from prompts |
| **Shaders.com MCP Server** | AI agent browses, installs, customizes WebGPU shader presets |
| **Locofy / TeleportHQ** | Design-to-code conversion with animation layers |
| **v0 / Bolt / Lovable** | Full-page generation from prompts with motion design |

### Prompting AI for Animation Code

```
Prompt for Claude/Copilot:
"Create a React component using GSAP ScrollTrigger and SplitText that reveals
a headline character-by-character as the user scrolls, with a 3D rotation
effect and staggered timing. Use useGSAP hook from @gsap/react."

Prompt for AI Shader Generation:
"Generate a WebGPU fragment shader (WGSL) for a fluid distortion effect
that reacts to mouse position and time, with iridescent color shifting."

Prompt for Shaders.com AI:
"Add a dark hero section background with moving aurora waves,
subtle sine wave distortion, and light grain dithering."
```

---

## 16. Performance & Best Practices

| Technique | Bundle Cost | Thread | FPS |
|-----------|------------|--------|-----|
| CSS animations/keyframes | 0KB | Compositor | 120fps |
| CSS view-timeline / scroll-timeline | 0KB | Compositor | 120fps |
| Web Animations API | 0KB | Compositor | 120fps |
| View Transitions API (CSS) | 0KB | Compositor | 120fps |
| GSAP | ~23KB gzipped | Main + compositor | 60fps |
| Motion (Framer Motion) | ~18KB gzipped | Main | 60fps |
| Three.js | ~60KB gzipped | GPU | 60fps |
| Lenis | ~4KB gzipped | Main rAF loop | 60fps |
| WebGPU | 0KB (browser API) | GPU | 120fps |

### Golden Rules
1. **CSS first** — Use CSS animations for fades, slides, scale, parallax. Zero JS cost.
2. **`transform` and `opacity` only** — Never animate `width`, `height`, `top`, `left` (trigger layout).
3. **`will-change` sparringly** — Promotes to compositor layer but eats GPU memory.
4. **Always respect `prefers-reduced-motion`** — WCAG 2.2 compliance.
5. **Lazy-load heavy libraries** — `dynamic import()` for GSAP/Three.js on scroll.
6. **Lenis for smooth scroll** — Under 4KB, accessible, supports position:sticky.
7. **View Transitions API** for page transitions — Replaces complex SPA transition code.
8. **Scroll-driven CSS** for scroll effects — Replaces ScrollTrigger for simple reveals.

### Reduced Motion Toggle

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### What You Can Remove from JS Bundle

| Pattern | JS Library to Remove | Savings |
|---------|---------------------|---------|
| Scroll-triggered fades | AOS.js | 8–15KB |
| Tooltip positioning | Various | 5–10KB |
| Page transitions | Framer Motion AnimatePresence | 10–20KB |
| Intersection Observer | Manual IO code | 0KB but cleaner |
| Reading progress bars | Custom JS | 0KB |

---

## 17. Quick Decision Framework

```
Need a simple fade/slide on scroll?           → CSS view-timeline (0KB, GPU)
Need sequenced timeline animation?            → GSAP timeline
Using React and need UI animations?           → Motion (Framer Motion)
Need 3D scene or particles?                   → Three.js / React Three Fiber
Need SVG morphing or line drawing?            → GSAP MorphSVGPlugin or anime.js
Need custom pixel/fragment effects?           → GLSL/WGSL shaders (Three.js, Shaders.com, Curtains.js)
Need 2D sprite/particle performance?          → PixiJS v8 (ParticleContainer)
Need page transitions?                        → View Transitions API (CSS, 3 lines) or Motion
Need smooth scrolling?                        → Lenis (~4KB)
Need interactive vector animations?           → Rive (state machines) or Lottie (AI Motion Copilot)
Need variable font / kinetic typography?      → GSAP SplitText or CSS font-variation-settings
Need GPU compute / shaders (declarative)?     → Shaders.com components (React/Vue/Svelte/Solid)
Need GPU compute / raw shaders?               → WebGPU WGSL or Three.js TSL
Need high-performance particle system?        → WebGPU compute shaders or Three.js Points
Need award-winning inspiration?               → Awwwards SOTD winners, reference archetypes above
Need multi-page app (MPA) polish?             → Cross-document View Transitions CSS
Need 3D coverflow or gooey scroll effects?    → CSS scroll-driven animations (pure CSS!)
Need prompt-to-animation for non-coders?      → Lottie Creator Motion Copilot
```

---

## 18. Learning Resources

### Tutorials & Courses
- **Three.js Journey** (bruno-simon.com) — The definitive Three.js course (completely rebuilt for 2025)
- **JavaScript Mastery** on YouTube — GSAP Awwwards-winning build tutorials (Zentry clone)
- **GSAP + React** — `@gsap/react` official docs + `useGSAP` hook
- **Olivier Larose** (blog.olivierlarose.com) — Shader tutorial collection (Curtains.js, Three.js)
- **Ali Sanati Dev** on YouTube — 3D Awwwards portfolio with GSAP + R3F
- **School of Motion** — 10 Websites with Great Animation in 2026
- **mesh3d.gallery** — Curated showcase of Three.js/WebGL websites
- **Pixel Grid UI** on YouTube — 25-video playlist: "Smooth Scrolling & Animations with GSAP + Lenis"
- **Annnimate Blog** (annnimate.com) — GSAP ScrollTrigger + SplitText + Lenis practical guides
- **GSAPify** (gsapify.com) — AI animation generator, complete ScrollTrigger/SplitText guides
- **GSAP Demos** (gsapdemos.com) — Copy-paste GSAP effects with React/TS examples
- **CSS Scroll-Driven Patterns** (css-scroll-driven.com) — Production patterns with accessibility + performance
- **View Transitions Chrome Dev** (view-transitions.chrome.dev) — Official demo collection

### Tools
- **Lenis** — Smooth scrolling (lenis.dev / lenis.darkroom.engineering)
- **ShaderToy** — GLSL shader playground and inspiration
- **ScrollTrigger visualizer** — GSAP marker-based debugging
- **SVGOMG** — SVG optimization and cleanup
- **GLSL.app** — Online WebGL shader editor with IntelliSense
- **SVG AI** (svgai.org) — Prompt-to-SVG vector generation
- **Lottie Creator** — Browser-based animation design + AI Motion Copilot
- **Rive** — Interactive state machine animations with runtime scripting
- **Shaders.com** — 90+ WebGPU shader components for React/Vue/Svelte/Solid
- **OpenShaders** (openshaders.com) — Free open-source WebGPU shader component directory
- **GSAPify** (gsapify.com) — AI animation generator
- **Annnimate** (annnimate.com) — Pre-built animation components
- **CSS Scroll-Driven Patterns** (css-scroll-driven.com) — Production patterns
- **Spline** (spline.design) — Browser-based 3D design → web export
- **Orpetron** (orpetron.com) — Curated award-winning website gallery by category
- **CSS Showcase** (cssshowcase.com) — View Transitions, scroll-driven, and creative CSS patterns
- **NeutrinoParticles Editor** — GPU-accelerated particle effects editor

### Inspiration Sources
- **Awwwards** (awwwards.com) — Site of the Day winners + filter by animation/Three.js
- **mesh3d.gallery** — Three.js/WebGL website gallery
- **BDSN Club** (bdsn.club) — Experimental animation playground
- **Free Frontend** (freefrontend.com) — Categorized animation examples
- **CodePen** — Search "GSAP ScrollTrigger", "Three.js shader", "WebGPU", "CSS scroll-driven"
- **Dribbble** — Animation concepts to reverse-engineer
- **Orpetron** (orpetron.com) — 10+ category galleries of award-winning sites
- **WebGPU.com** showcase — Immersive 3D WebGL/WebGPU portfolios
- **CSS Design Awards** (cssdesignawards.com) — CSSDA Site of the Day
- **FWA** (thefwa.com) — Favourite Website Awards winners

### 2026 Reference Sites
- **Apple product pages** — Gold standard for 3D on the web, scroll-triggered typography
- **Epic Agency** (epic.net) — Bold animated typography, theatrical transitions
- **BDSN Club** (bdsn.club) — Experimental web animation playground, Rive state machines
- **Terminal Industries** — Awwwards SOTD Sep 2025 + Developer Award, minimalist perfection
- **Samsy** (samsy.ninja) — WebGPU 120+ FPS cyberpunk 3D portfolio, Awwwards SOTD Oct 2025
- **Bruno Simon** (bruno-simon.com) — Interactive 3D portfolio with vehicle controls
- **Immersive Garden** — 2025 Awwwards Agency of the Year
- **Bilal Elmossaoui** (bilal.show) — Scroll-driven 3D story with character journey
- **Basement Studio** (basement.studio) — Award-winning Framer Motion + 3D creations
- **Aidan Nelson** (aidanjnelson.com) — Three.js portfolio with artistic 3D scenes
- **Keita Yamada** (p5aholic.me) — Three.js/WebGL portfolio from Japan
- **Robin Mastromarino** (robinmastromarino.com) — WebGL displacement slider effects
- **The Power of Storytelling** (storytelling.noomoagency.com) — Awwwards SOTD Jun 2026
- **Lolo Agency** (loloagency.com) — Awwwards SOTD Apr 2026, Developer Award winner
- **The Obsidian Assembly** (obsidianassembly.com) — Awwwards SOTD Apr 2026
- **iyO** (iyo.ai) — Awwwards SOTD Apr 2026 with Three.js

### Key Repositories to Watch
- **github.com/adrianhajdin/award-winning-website** — React + GSAP + Tailwind (996 stars)
- **github.com/Fullstack-Empire/GSAP-Awwwards-Website** — GSAP Awwwards site clone (239 stars)
- **github.com/Ali-Sanati/awwwards-portfolio** — R3F + GSAP + Three.js awwwards portfolio
- **github.com/coroboros/research** — Award-Winning Websites 2025–2030 reference (excellent)
- **github.com/pmndrs/react-three-fiber** — R3F ecosystem
- **github.com/darkroomengineering/lenis** — Smooth scroll library source

---
*Last updated: June 2026. Research compiled from Awwwards, FWA, CSS Design Awards winners, industry blogs, and production patterns.*
