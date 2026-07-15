import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { useDashboardWorkspace } from "../../contexts/DashboardWorkspaceContext";

// Relaxation particle field for focus sessions
function RelaxationParticles({ count = 200 }: { count?: number }) {
  const points = useRef<THREE.Points>(null!);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
      // Purple-to-blue color gradient
      colors[i] = 0.4 + Math.random() * 0.2; // R
      colors[i + 1] = 0.3 + Math.random() * 0.3; // G
      colors[i + 2] = 0.8 + Math.random() * 0.2; // B
    }

    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      points.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <Points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Focus mode ambient background
export function FocusAmbientEffect() {
  const workspace = useDashboardWorkspace();
  const brainmap3d = useFeatureFlag(
    'brainmap_3d',
    workspace?.user?.id,
    workspace?.user?.role,
    workspace?.user?.plan,
    workspace?.user?.isAdmin,
  );

  if (!brainmap3d) return null;

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <RelaxationParticles />
      </Canvas>
    </div>
  );
}

// Study session progress particle burst
function ParticleBurst({ active }: { active: boolean }) {
  const points = useRef<THREE.Points>(null!);

  const particles = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    const velocities = new Float32Array(300 * 3);

    for (let i = 0; i < 300 * 3; i++) {
      positions[i] = 0;
      velocities[i] = (Math.random() - 0.5) * 0.5;
    }

    return { positions, velocities };
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;

    const positions = points.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += particles.velocities[i] * delta * 10;
      positions[i + 1] += particles.velocities[i + 1] * delta * 10;
      positions[i + 2] += particles.velocities[i + 2] * delta * 10;

      // Fade out particles
      if (positions[i + 1] > 10) {
        positions[i] = (Math.random() - 0.5) * 2;
        positions[i + 1] = -5;
        positions[i + 2] = (Math.random() - 0.5) * 2;
      }
    }

    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={points} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={300}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.2}
        color="#a855f7"
        transparent
        opacity={active ? 0.8 : 0}
        sizeAttenuation
      />
    </Points>
  );
}

// Study celebration effect
export function StudyCelebration({ trigger }: { trigger: boolean }) {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ParticleBurst active={trigger} />
      </Canvas>
    </div>
  );
}

// CSS-based fallback particles
export function CSSParticles({ count = 30 }: { count?: number }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}
