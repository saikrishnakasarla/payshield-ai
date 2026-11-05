import React, { Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Fallback3D } from './Fallback3D';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('WebGL Rendering Error intercepted, falling back to CSS visual:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Utility to check WebGL availability safely
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

interface CanvasWrapperProps {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  interactive?: boolean;
}

export const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  children,
  className = 'w-full h-full',
  fallback = <Fallback3D />,
  camera = { position: [0, 0, 6], fov: 45 },
  interactive = true,
}) => {
  const supportsWebGL = isWebGLAvailable();

  if (!supportsWebGL) {
    return <div className={`relative ${className}`}>{fallback}</div>;
  }

  return (
    <div className={`relative ${className} ${interactive ? '' : 'pointer-events-none'}`}>
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas
          camera={{
            position: camera.position || [0, 0, 6],
            fov: camera.fov || 45,
            near: 0.1,
            far: 1000,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 1.5]} // Performance optimized device pixel ratio
          style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        >
          {children}
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};
