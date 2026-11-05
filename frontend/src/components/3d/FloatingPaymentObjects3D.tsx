import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Holographic Credit Card Mesh (Bottom-Left in Reference)
const FloatingCreditCard: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
  position,
  rotation = [0.15, 0.35, -0.1],
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.3 + 0.4) * 0.09;
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.7) * 0.08;
    groupRef.current.rotation.x = rotation[0] + Math.cos(t * 0.8) * 0.05;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={0.52}>
      {/* Card body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 0.04]} />
        <meshPhysicalMaterial
          color="#0C1B2A"
          roughness={0.2}
          metalness={0.8}
          transmission={0.4}
          ior={1.4}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Holographic rim border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.22, 1.42, 0.042)]} />
        <lineBasicMaterial color="#00e5ff" linewidth={2} transparent opacity={0.9} />
      </lineSegments>

      {/* EMV Gold Chip */}
      <mesh position={[-0.6, 0.1, 0.025]}>
        <boxGeometry args={[0.38, 0.3, 0.01]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.3} emissive="#ffaa00" emissiveIntensity={0.3} />
      </mesh>

      {/* Contactless Waves Icon */}
      <mesh position={[-0.15, 0.1, 0.025]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.015, 8, 16, Math.PI / 1.5]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>
      <mesh position={[-0.15, 0.1, 0.025]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.015, 8, 16, Math.PI / 1.5]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* Embossed stripe */}
      <mesh position={[0, -0.28, 0.025]}>
        <boxGeometry args={[1.7, 0.08, 0.005]} />
        <meshBasicMaterial color="#00f5c8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

// 2. PayPal Cyber Tile / Monogram (Top-Left in Reference)
const FloatingPayPalTile: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + 2.1) * 0.08;
    groupRef.current.rotation.y = 0.25 + Math.sin(t * 0.6) * 0.08;
    groupRef.current.rotation.x = -0.1 + Math.cos(t * 0.7) * 0.04;
  });

  return (
    <group ref={groupRef} position={position} scale={0.48}>
      {/* Rounded square glass tile base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.3, 1.3, 0.12]} />
        <meshPhysicalMaterial
          color="#061B30"
          roughness={0.15}
          metalness={0.8}
          transmission={0.5}
          clearcoat={1}
          emissive="#00457C"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glowing cyan edge border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.32, 1.32, 0.13)]} />
        <lineBasicMaterial color="#00e5ff" linewidth={1.5} transparent opacity={0.85} />
      </lineSegments>

      {/* PayPal "P" Monogram */}
      {/* Vertical stem */}
      <mesh position={[-0.18, 0, 0.08]}>
        <boxGeometry args={[0.16, 0.72, 0.03]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={1.2} />
      </mesh>
      {/* Upper loop top horizontal */}
      <mesh position={[0.02, 0.28, 0.08]}>
        <boxGeometry args={[0.34, 0.14, 0.03]} />
        <meshStandardMaterial color="#00F5C8" emissive="#00F5C8" emissiveIntensity={1.1} />
      </mesh>
      {/* Upper loop right vertical */}
      <mesh position={[0.14, 0.14, 0.08]}>
        <boxGeometry args={[0.14, 0.22, 0.03]} />
        <meshStandardMaterial color="#00F5C8" emissive="#00F5C8" emissiveIntensity={1.1} />
      </mesh>
      {/* Upper loop bottom horizontal */}
      <mesh position={[0.02, 0.02, 0.08]}>
        <boxGeometry args={[0.34, 0.14, 0.03]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
};

// 3. AI Neural Processor Chip (Bottom-Right in Reference)
const FloatingAIChip: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.1 + 3.5) * 0.09;
    groupRef.current.rotation.y = -0.3 + Math.sin(t * 0.5) * 0.07;
    groupRef.current.rotation.x = 0.15 + Math.cos(t * 0.6) * 0.04;

    if (coreRef.current) {
      coreRef.current.rotation.z = t * 0.8;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.48}>
      {/* Silicon Die Carrier */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.25, 1.25, 0.14]} />
        <meshPhysicalMaterial
          color="#06121e"
          metalness={0.85}
          roughness={0.25}
          clearcoat={0.9}
        />
      </mesh>

      {/* Glowing cyan edge border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.27, 1.27, 0.15)]} />
        <lineBasicMaterial color="#00e5ff" linewidth={1.5} transparent opacity={0.85} />
      </lineSegments>

      {/* Glowing AI Core Die */}
      <mesh ref={coreRef} position={[0, 0, 0.08]}>
        <boxGeometry args={[0.55, 0.55, 0.04]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={1.4}
          roughness={0.1}
        />
      </mesh>

      {/* Circuit lines */}
      <mesh position={[0, 0, 0.075]}>
        <ringGeometry args={[0.32, 0.35, 16]} />
        <meshBasicMaterial color="#00f5c8" />
      </mesh>

      {/* Gold Pin Connectors on edges */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((offset, i) => (
        <React.Fragment key={i}>
          {/* Top & Bottom pins */}
          <mesh position={[offset, 0.68, 0]}>
            <boxGeometry args={[0.07, 0.12, 0.04]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#ffaa00" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[offset, -0.68, 0]}>
            <boxGeometry args={[0.07, 0.12, 0.04]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#ffaa00" emissiveIntensity={0.2} />
          </mesh>
          {/* Left & Right pins */}
          <mesh position={[0.68, offset, 0]}>
            <boxGeometry args={[0.12, 0.07, 0.04]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#ffaa00" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[-0.68, offset, 0]}>
            <boxGeometry args={[0.12, 0.07, 0.04]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#ffaa00" emissiveIntensity={0.2} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

// 4. Analytics Bar Slab (Top-Right in Reference)
const FloatingAnalyticsSlab: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 0.95 + 1.2) * 0.08;
    groupRef.current.rotation.y = -0.25 + Math.sin(t * 0.5) * 0.06;
    groupRef.current.rotation.x = 0.15 + Math.cos(t * 0.6) * 0.04;
  });

  return (
    <group ref={groupRef} position={position} scale={0.46}>
      {/* Base glass platform tile */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.35, 1.15, 0.12]} />
        <meshPhysicalMaterial
          color="#0C1B2A"
          roughness={0.2}
          metalness={0.8}
          transmission={0.5}
          clearcoat={1}
        />
      </mesh>

      {/* Glowing cyan edge border */}
      <lineSegments position={[0, -0.05, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.37, 1.17, 0.13)]} />
        <lineBasicMaterial color="#00e5ff" linewidth={1.5} transparent opacity={0.85} />
      </lineSegments>

      {/* 3 Rising Analytics Bars matching Reference */}
      {[
        { x: -0.32, h: 0.35, c: '#00e5ff' },
        { x: 0.0, h: 0.58, c: '#00f5c8' },
        { x: 0.32, h: 0.78, c: '#00e5ff' },
      ].map((b, i) => (
        <mesh key={i} position={[b.x, -0.35 + b.h / 2, 0.08]}>
          <boxGeometry args={[0.2, b.h, 0.08]} />
          <meshStandardMaterial
            color={b.c}
            emissive={b.c}
            emissiveIntensity={0.9}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

export const FloatingPaymentObjects3D: React.FC = () => {
  return (
    <group>
      {/* PayPal Cyber Tile: Top-Left */}
      <FloatingPayPalTile position={[-2.3, 1.25, 0.2]} />

      {/* Holographic Credit Card: Bottom-Left */}
      <FloatingCreditCard position={[-2.4, -0.45, 0.4]} rotation={[0.2, 0.45, -0.12]} />

      {/* Analytics Graph Slab: Top-Right */}
      <FloatingAnalyticsSlab position={[2.3, 1.2, 0.1]} />

      {/* AI Processor Chip: Bottom-Right */}
      <FloatingAIChip position={[2.35, -0.45, 0.35]} />
    </group>
  );
};
