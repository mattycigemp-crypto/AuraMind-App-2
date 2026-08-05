/**
 * Barrel for the AuraMind animated-SVG catalog.
 *
 * Hand-coded, hand-tuned, GPU-cheap. Each component respects
 * `prefers-reduced-motion` and degrades to a static SVG when the user
 * opts out — never disabled, never blocked.
 */
export { AuroraOrb, default as default } from "./AuroraOrb";
export type { AuroraOrbMood, AuroraOrbIntensity } from "./AuroraOrb";

export { ConstellationMap } from "./ConstellationMap";
export type { ConstellationNode, ConstellationEdge } from "./ConstellationMap";

export { MemoryStack } from "./MemoryStack";
export { NeuralBloom } from "./NeuralBloom";
export { PulseHeart } from "./PulseHeart";
