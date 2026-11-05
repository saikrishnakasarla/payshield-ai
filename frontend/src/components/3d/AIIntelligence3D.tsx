import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AIIntelligence3DProps {
  anomalyDetected?: boolean;
  scale?: number;
}

export const AIIntelligence3D: React.FC<AIIntelligence3DProps> = ({
  anomalyDetected = false,
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate 14 neural feature nodes around the central nucleus
  const [nodes, linePositions] = useMemo(() => {
    const rawNodes: [number, number, number][] = [
      [1.4, 0.6, 0.4],
      [-1.3, 0.8, -0.5],
      [0.3, 1.5, 0.6],
      [-0.4, -1.4, 0.7],
      [1.2, -0.9, -0.6],
      [-1.5, -0.5, -0.3],
      [0.7, 0.3, -1.4],
      [-0.6, 0.4, 1.3],
      [0.9, -1.3, 0.5],
      [-1.1, 1.2, 0.7],
      [1.5, -0.2, 0.9],
      [-0.8, -1.1, -1.2],
      [0.2, 1.4, -0.9],
      [0.0, -1.6, -0.4],
    ];

    // Compute line segments from center to each node, and between neighboring nodes
    const lines: number[] = [];
    rawNodes.forEach((node) => {
      // Line from center (0,0,0) to node
      lines.push(0, 0, 0, node[0], node[1], node[2]);
    });

    // Connect pairs with distance < 1.8
    for (let i = 0; i < rawNodes.length; i++) {
      for (let j = i + 1; j < rawNodes.length; j++) {
        const d2 =
          Math.pow(rawNodes[i][0] - rawNodes[j][0], 2) +
          Math.pow(rawNodes[i][1] - rawNodes[j][1], 2) +
          Math.pow(rawNodes[i][2] - rawNodes[j][2], 2);
        if (d2 < 3.2) {
          lines.push(
            rawNodes[i][0],
            rawNodes[i][1],
            rawNodes[i][2],
            rawNodes[j][0],
            rawNodes[j][1],
            rawNodes[j][2]
          );
        }
      }
    }

    return [rawNodes, new Float32Array(lines)];
  }, []);

  const primaryColor = anomalyDetected ? '#ff5263' : '#00e5ff';
  const secondaryColor = anomalyDetected ? '#ffb547' : '#00f5c8';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.25;
      groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.2;
    }
    if (nucleusRef.current) {
      const s = 1 + Math.sin(t * 2.5) * 0.08;
      nucleusRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Central AI Nucleus: Dual layered icosahedron */}
      <mesh ref={nucleusRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={1.4}
          roughness={0.2}
          wireframe
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshPhysicalMaterial
          color="#071522"
          emissive={secondaryColor}
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
          transmission={0.5}
        />
      </mesh>

      {/* Feature Nodes */}
      {nodes.map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh>
            <octahedronGeometry args={[0.11]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? primaryColor : secondaryColor}
              emissive={idx % 2 === 0 ? primaryColor : secondaryColor}
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshBasicMaterial
              color={primaryColor}
              transparent
              opacity={0.25}
              wireframe
            />
          </mesh>
        </group>
      ))}

      {/* Neural Synapse Connection Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Orbital Scanning Rings */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.0, 0.012, 16, 64]} />
        <meshBasicMaterial color={secondaryColor} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[1.75, 0.01, 16, 64]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.45} />
      </mesh>
    </group>
  );
};
