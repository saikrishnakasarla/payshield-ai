import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SecurityShield3DProps {
  scale?: number;
  interactive?: boolean;
  position?: [number, number, number];
}

export const SecurityShield3D: React.FC<SecurityShield3DProps> = ({
  scale = 1,
  interactive = true,
  position = [0, 0, 0],
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const shieldMeshRef = useRef<THREE.Mesh>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const platformRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const { mouse } = useThree();

  // Create Custom Shield 3D Geometry
  const shieldGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Start at top center
    shape.moveTo(0, 1.25);
    // Top right shoulder
    shape.quadraticCurveTo(0.85, 1.2, 1.05, 0.65);
    // Right side curve downwards towards point
    shape.quadraticCurveTo(1.0, -0.4, 0, -1.35);
    // Left side curve upwards from bottom point
    shape.quadraticCurveTo(-1.0, -0.4, -1.05, 0.65);
    // Top left shoulder back to center
    shape.quadraticCurveTo(-0.85, 1.2, 0, 1.25);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  // Lightning Bolt Symbol Shape Geometry
  const lightningGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Lightning bolt coordinates
    shape.moveTo(0.08, 0.6);
    shape.lineTo(-0.25, 0.05);
    shape.lineTo(0.0, 0.05);
    shape.lineTo(-0.15, -0.6);
    shape.lineTo(0.28, -0.05);
    shape.lineTo(0.02, -0.05);
    shape.lineTo(0.22, 0.6);
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    geom.center();
    return geom;
  }, []);

  // Small floating spark particles
  const [particlePositions, particleCount] = useMemo(() => {
    const count = 75;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1.3 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }
    return [pos, count];
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gentle floating up and down
      groupRef.current.position.y = (position[1] ?? 0) + Math.sin(time * 1.4) * 0.12;
      groupRef.current.position.x = position[0] ?? 0;
      groupRef.current.position.z = position[2] ?? 0;

      // Gentle continuous rotation
      const baseRotY = Math.sin(time * 0.6) * 0.18;
      
      // Mouse Parallax Response
      if (interactive) {
        const targetRotX = -mouse.y * 0.25;
        const targetRotY = baseRotY + mouse.x * 0.35;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 3);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 3);
      } else {
        groupRef.current.rotation.y = baseRotY;
      }
    }

    // Orbital Rings Rotation
    if (ringsRef.current) {
      const ring1 = ringsRef.current.children[0];
      const ring2 = ringsRef.current.children[1];
      const ring3 = ringsRef.current.children[2];

      if (ring1) ring1.rotation.z += delta * 0.6;
      if (ring2) ring2.rotation.y -= delta * 0.75;
      if (ring3) ring3.rotation.x += delta * 0.45;
    }

    // Floating Particles movement
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.15;
      particlesRef.current.rotation.x = Math.sin(time * 0.3) * 0.08;
    }

    // Platform subtle pulse
    if (platformRef.current) {
      platformRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      onPointerOver={() => interactive && setHovered(true)}
      onPointerOut={() => interactive && setHovered(false)}
    >
      {/* Dynamic Key Lights for Cyan / Teal Illumination */}
      <pointLight position={[2, 3, 3]} intensity={2.2} color="#00E5FF" distance={10} />
      <pointLight position={[-2, -1, 2]} intensity={1.8} color="#00F5C8" distance={8} />
      <pointLight position={[0, 0, -2]} intensity={1.2} color="#1E6BFF" distance={6} />

      {/* Main Glass Shield Mesh */}
      <mesh ref={shieldMeshRef} geometry={shieldGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={hovered ? '#4DF2FF' : '#00E5FF'}
          emissive="#00283D"
          emissiveIntensity={hovered ? 0.6 : 0.25}
          roughness={0.12}
          metalness={0.25}
          transmission={0.82}
          ior={1.45}
          thickness={0.5}
          transparent={true}
          opacity={0.88}
          reflectivity={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Metallic Cyan Rim Outline */}
      <mesh geometry={shieldGeometry} scale={[1.025, 1.025, 0.9]}>
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={hovered ? 0.8 : 0.45}
          wireframe={true}
          transparent={true}
          opacity={0.5}
        />
      </mesh>

      {/* Central Lightning Bolt Emblem */}
      <mesh
        ref={coreMeshRef}
        geometry={lightningGeometry}
        position={[0, 0, 0.12]}
        scale={hovered ? [1.08, 1.08, 1.08] : [1, 1, 1]}
      >
        <meshStandardMaterial
          color="#00F5C8"
          emissive="#00F5C8"
          emissiveIntensity={hovered ? 1.5 : 0.9}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner Energy Core Glow Point Light */}
      <pointLight position={[0, 0, 0.2]} intensity={hovered ? 2.5 : 1.4} color="#00F5C8" distance={3} />

      {/* Concentric Floating Orbital Rings */}
      <group ref={ringsRef}>
        {/* Ring 1 - Outer Tilted Cyan */}
        <mesh rotation={[Math.PI / 3, Math.PI / 6, 0]}>
          <torusGeometry args={[1.75, 0.016, 16, 100]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={0.8}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>

        {/* Ring 2 - Middle Opposite Tilted Teal */}
        <mesh rotation={[-Math.PI / 3.5, -Math.PI / 4, 0]}>
          <torusGeometry args={[1.5, 0.014, 16, 100]} />
          <meshStandardMaterial
            color="#00F5C8"
            emissive="#00F5C8"
            emissiveIntensity={0.9}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Ring 3 - Equatorial Blue Accent */}
        <mesh rotation={[Math.PI / 2.2, 0, Math.PI / 5]}>
          <torusGeometry args={[1.9, 0.012, 16, 100]} />
          <meshStandardMaterial
            color="#1E6BFF"
            emissive="#00E5FF"
            emissiveIntensity={0.6}
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* Small Floating Spark Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
            count={particleCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#00E5FF"
          transparent={true}
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Tiered Tech Pedestal beneath Shield matching Reference Image */}
      <group position={[0, -1.6, 0]}>
        {/* Upper Tier Cylinder */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.3, 1.35, 0.16, 64]} />
          <meshStandardMaterial
            color="#081A2D"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Upper Tier Glowing Cyan Perimeter Ring */}
        <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.22, 1.28, 64]} />
          <meshBasicMaterial color="#00E5FF" transparent={true} opacity={0.9} side={THREE.DoubleSide} />
        </mesh>

        {/* Lower Tier Wider Cylinder Base */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[1.65, 1.7, 0.22, 64]} />
          <meshStandardMaterial
            color="#050E18"
            metalness={0.95}
            roughness={0.25}
          />
        </mesh>

        {/* Horizontal Glowing Cyan Light Slots around Base */}
        <group ref={platformRef}>
          {[-0.6, -0.2, 0.2, 0.6].map((angle, idx) => (
            <mesh key={idx} position={[Math.sin(angle) * 1.68, -0.08, Math.cos(angle) * 1.68]} rotation={[0, -angle, 0]}>
              <boxGeometry args={[0.42, 0.06, 0.02]} />
              <meshBasicMaterial color="#00F5C8" />
            </mesh>
          ))}
        </group>

        {/* Ground Glow Ring */}
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.72, 1.85, 64]} />
          <meshBasicMaterial color="#00E5FF" transparent={true} opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};
