import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleWave3DProps {
  rows?: number;
  cols?: number;
  separation?: number;
  amplitude?: number;
  speed?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * ParticleWave3D
 * Procedural undulating 3D particle wave representing live data streams & network waves.
 */
export const ParticleWave3D: React.FC<ParticleWave3DProps> = ({
  rows = 50,
  cols = 50,
  separation = 0.35,
  amplitude = 0.45,
  speed = 0.8,
  position = [0, -2.4, -2],
  rotation = [Math.PI / 3.8, 0, 0],
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = rows * cols;

  const [positions, colors, basePositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);

    const cyan = new THREE.Color(0x00e5ff);
    const teal = new THREE.Color(0x00f5c8);
    const deepBlue = new THREE.Color(0x0a2540);

    let idx = 0;
    const xOffset = ((cols - 1) * separation) / 2;
    const zOffset = ((rows - 1) * separation) / 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * separation - xOffset;
        const z = j * separation - zOffset;
        const y = 0;

        pos[idx * 3] = x;
        pos[idx * 3 + 1] = y;
        pos[idx * 3 + 2] = z;

        base[idx * 3] = x;
        base[idx * 3 + 1] = y;
        base[idx * 3 + 2] = z;

        // Distribute colors across the grid with a radial blend
        const distFromCenter = Math.sqrt(x * x + z * z) / (xOffset || 1);
        const c = new THREE.Color();
        if (distFromCenter < 0.5) {
          c.lerpColors(cyan, teal, distFromCenter * 2);
        } else {
          c.lerpColors(teal, deepBlue, Math.min(1, (distFromCenter - 0.5) * 1.5));
        }

        col[idx * 3] = c.r;
        col[idx * 3 + 1] = c.g;
        col[idx * 3 + 2] = c.b;

        idx++;
      }
    }

    return [pos, col, base];
  }, [rows, cols, separation, count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    if (!posAttr) return;

    const t = state.clock.getElapsedTime() * speed;

    let idx = 0;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const bx = basePositions[idx * 3];
        const bz = basePositions[idx * 3 + 2];

        // Complex undulating waveform
        const wave1 = Math.sin(bx * 0.45 + t) * Math.cos(bz * 0.45 + t * 0.8);
        const wave2 = Math.sin((bx + bz) * 0.3 + t * 1.2) * 0.4;
        const wave3 = Math.cos(Math.sqrt(bx * bx + bz * bz) * 0.6 - t * 1.5) * 0.3;

        posAttr.setY(idx, (wave1 + wave2 + wave3) * amplitude);
        idx++;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={position} rotation={rotation}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.82}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
