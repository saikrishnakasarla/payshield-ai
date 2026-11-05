import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CanvasWrapper } from './CanvasWrapper';
import { SecurityShield3D } from './SecurityShield3D';

// Compact Floating Holographic Card for Sandbox
const CompactHolographicCard: React.FC<{ position?: [number, number, number] }> = ({
  position = [-1.35, -0.1, 0.4],
}) => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.08;
    ref.current.rotation.y = 0.35 + Math.sin(t * 0.8) * 0.1;
    ref.current.rotation.x = 0.15 + Math.cos(t * 0.9) * 0.05;
  });

  return (
    <group ref={ref} position={position} scale={0.48} rotation={[0.15, 0.35, -0.08]}>
      {/* Dark Glass Card Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 0.04]} />
        <meshPhysicalMaterial
          color="#061B30"
          metalness={0.85}
          roughness={0.2}
          transmission={0.45}
          clearcoat={1}
        />
      </mesh>

      {/* Glowing Neon Cyan Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.22, 1.42, 0.042)]} />
        <lineBasicMaterial color="#00e5ff" linewidth={2} transparent opacity={0.9} />
      </lineSegments>

      {/* Gold EMV Chip */}
      <mesh position={[-0.6, 0.1, 0.025]}>
        <boxGeometry args={[0.38, 0.3, 0.01]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.25} emissive="#ffaa00" emissiveIntensity={0.3} />
      </mesh>

      {/* Contactless waves */}
      <mesh position={[-0.15, 0.1, 0.025]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.015, 8, 16, Math.PI / 1.5]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>
      <mesh position={[-0.15, 0.1, 0.025]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.015, 8, 16, Math.PI / 1.5]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* Teal Stripe */}
      <mesh position={[0, -0.28, 0.025]}>
        <boxGeometry args={[1.7, 0.08, 0.005]} />
        <meshBasicMaterial color="#00f5c8" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// Network Particles
const PaymentNetworkParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 60;

  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00e5ff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface SandboxPayment3DSceneProps {
  className?: string;
}

export const SandboxPayment3DScene: React.FC<SandboxPayment3DSceneProps> = ({
  className = 'w-full h-full min-h-[220px]',
}) => {
  return (
    <CanvasWrapper className={className} camera={{ position: [0, 0, 4.4], fov: 42 }} interactive={true}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 3]} intensity={1.5} color="#00E5FF" />
      <directionalLight position={[-3, -2, -2]} intensity={0.8} color="#00F5C8" />
      <pointLight position={[0, 0, 2]} intensity={1.8} color="#00E5FF" distance={8} />

      {/* Glowing Security Shield */}
      <SecurityShield3D position={[0.6, 0.05, 0]} scale={0.75} interactive={true} />

      {/* Floating Holographic Card */}
      <CompactHolographicCard position={[-1.15, -0.05, 0.3]} />

      {/* Network Particles */}
      <PaymentNetworkParticles />
    </CanvasWrapper>
  );
};
