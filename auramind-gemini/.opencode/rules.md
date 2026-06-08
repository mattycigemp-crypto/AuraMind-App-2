# Codebase Rules & Guardrails

## Tech Stack Rules
- Frontend: TypeScript, React 19, Vite, Tailwind CSS 4, React Router.
- Animation & 3D: Three.js (@react-three/fiber), Framer Motion, GSAP.
- Backend Client: Supabase.

## Generation Guidelines
- React 19: Use the latest React 19 patterns. Do not use legacy hooks if native action forms are cleaner.
- Styling: Use Tailwind CSS 4 syntax. Do not write inline CSS configurations or deprecated Tailwind v3 config files.
- Animation Clarity: Be explicit about animation frameworks. Use Framer Motion for structural layout shifts and state changes; use GSAP strictly for complex, timeline-based 3D scene sequences or canvas animations. Do not mix them in the same functional component block.
- Placeholders: Never output incomplete code blocks or `// TODO` placeholders.
