import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface DigitalGlobe3DProps {
  radius?: number;
  interactive?: boolean;
  position?: [number, number, number];
}

export const DigitalGlobe3D: React.FC<DigitalGlobe3DProps> = ({
  radius = 1.8,
  interactive = true,
  position = [0, 0, 0],
}) => {
  const globeGroupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  // 1. Fibonacci sphere point lattice for the digital point cloud
  const [pointPositions, pointCount] = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    return [positions, count];
  }, [radius]);

  // 2. Hub nodes (simulating major financial/e-commerce hubs)
  const hubNodes = useMemo(() => {
    // Spherical coordinates [lat, lon] in radians
    const hubs = [
      { name: 'NY', lat: 0.7, lon: -1.3 },
      { name: 'SF', lat: 0.65, lon: -2.1 },
      { name: 'LON', lat: 0.9, lon: 0.0 },
      { name: 'FRA', lat: 0.88, lon: 0.15 },
      { name: 'TOK', lat: 0.62, lon: 2.4 },
      { name: 'SIN', lat: 0.02, lon: 1.8 },
      { name: 'SYD', lat: -0.59, lon: 2.65 },
      { name: 'SAO', lat: -0.41, lon: -0.8 },
      { name: 'MUM', lat: 0.33, lon: 1.27 },
      { name: 'DXB', lat: 0.44, lon: 0.96 },
    ];

    return hubs.map((h) => {
      const x = radius * Math.cos(h.lat) * Math.cos(h.lon);
      const y = radius * Math.sin(h.lat);
      const z = radius * Math.cos(h.lat) * Math.sin(h.lon);
      return new THREE.Vector3(x, y, z);
    });
  }, [radius]);

  // 3. Curved network arcs connecting hubs
  const arcsBuffer = useMemo(() => {
    const pairs = [
      [0, 1], // NY - SF
      [0, 2], // NY - LON
      [2, 3], // LON - FRA
      [2, 8], // LON - MUM
      [3, 9], // FRA - DXB
      [9, 8], // DXB - MUM
      [8, 5], // MUM - SIN
      [5, 4], // SIN - TOK
      [5, 6], // SIN - SYD
      [0, 7], // NY - SAO
      [1, 4], // SF - TOK
    ];

    const segmentCoords: number[] = [];

    pairs.forEach(([i, j]) => {
      const v1 = hubNodes[i];
      const v2 = hubNodes[j];
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const elevation = 1.25 + v1.distanceTo(v2) * 0.15;
      mid.normalize().multiplyScalar(radius * elevation);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(20);
      for (let k = 0; k < points.length - 1; k++) {
        segmentCoords.push(
          points[k].x,
          points[k].y,
          points[k].z,
          points[k + 1].x,
          points[k + 1].y,
          points[k + 1].z
        );
      }
    });

    return new Float32Array(segmentCoords);
  }, [hubNodes, radius]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (globeGroupRef.current) {
      // Slow continuous rotation
      globeGroupRef.current.rotation.y += delta * 0.12;

      // Mouse-based subtle tilt
      if (interactive) {
        const targetRotX = mouse.y * 0.15;
        const targetRotZ = -mouse.x * 0.15;
        globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(globeGroupRef.current.rotation.x, targetRotX, delta * 2);
        globeGroupRef.current.rotation.z = THREE.MathUtils.lerp(globeGroupRef.current.rotation.z, targetRotZ, delta * 2);
      }
    }
  });

  return (
    <group ref={globeGroupRef} position={position}>
      {/* Dark Inner Core Sphere */}
      <mesh>
        <sphereGeometry args={[radius * 0.98, 32, 32]} />
        <meshBasicMaterial color="#050A12" transparent={true} opacity={0.88} />
      </mesh>

      {/* Latitudinal / Longitudinal Wireframe Outline */}
      <mesh>
        <sphereGeometry args={[radius * 0.99, 16, 16]} />
        <meshBasicMaterial color="#00E5FF" wireframe={true} transparent={true} opacity={0.06} />
      </mesh>

      {/* Digital Point Cloud Surface */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pointPositions, 3]}
            count={pointCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#00E5FF"
          transparent={true}
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Glowing Hub Nodes */}
      {hubNodes.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Inner Node Sphere */}
          <mesh>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#00F5C8" />
          </mesh>
          {/* Outer Pulsing Glow Shell */}
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#00E5FF" transparent={true} opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Connected Network Arcs */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[arcsBuffer, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00E5FF"
          transparent={true}
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};
