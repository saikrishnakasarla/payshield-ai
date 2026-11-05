import React from 'react';
import { CanvasWrapper } from './CanvasWrapper';
import { SecurityShield3D } from './SecurityShield3D';
import { FloatingPaymentObjects3D } from './FloatingPaymentObjects3D';
import { DigitalGlobe3D } from './DigitalGlobe3D';
import { ParticleWave3D } from './ParticleWave3D';

interface AuthHero3DSceneProps {
  className?: string;
  showFloatingObjects?: boolean;
}

/**
 * AuthHero3DScene
 * High-performance composite 3D canvas featuring the Security Shield,
 * floating payment icons, background digital globe, and data wave.
 */
export const AuthHero3DScene: React.FC<AuthHero3DSceneProps> = ({
  className = 'w-full h-full min-h-[460px]',
  showFloatingObjects = true,
}) => {
  return (
    <CanvasWrapper className={className} camera={{ position: [0, 0, 5.2], fov: 45 }}>
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} color="#00e5ff" />
      <directionalLight position={[-4, -3, -2]} intensity={0.7} color="#00f5c8" />
      <pointLight position={[0, 0, 2.2]} intensity={1.8} color="#00e5ff" distance={9} />

      {/* Background Digital Globe */}
      <DigitalGlobe3D radius={2.0} position={[0, 0.1, -2.6]} interactive={false} />

      {/* Ground Particle Wave */}
      <ParticleWave3D position={[0, -2.4, -1.2]} rows={42} cols={42} separation={0.34} speed={0.7} />

      {/* Central 3D Security Shield */}
      <SecurityShield3D position={[0, 0.15, 0]} scale={1.1} interactive={true} />

      {/* Floating Payment & AI Holograms */}
      {showFloatingObjects && <FloatingPaymentObjects3D />}
    </CanvasWrapper>
  );
};
