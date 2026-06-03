import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Group } from 'three';

function CarModel({ color = "#1f2937" }: { color?: string }) {
  const meshRef = useRef<Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Car Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4, 1, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Car Roof */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[2.5, 0.8, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Windshield */}
      <mesh position={[0.8, 1.2, 0]}>
        <boxGeometry args={[0.1, 0.7, 1.5]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.7} />
      </mesh>
      
      {/* Wheels */}
      <mesh position={[-1.2, -0.2, 0.9]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[1.2, -0.2, 0.9]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[-1.2, -0.2, -0.9]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[1.2, -0.2, -0.9]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[1.9, 0.3, 0.6]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[1.9, 0.3, -0.6]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

interface Car3DProps {
  className?: string;
  height?: number;
  autoRotate?: boolean;
  carColor?: string;
}

export function Car3D({ className = "", height = 300, autoRotate = true, carColor }: Car3DProps) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Canvas
        camera={{ position: [5, 3, 5], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <CarModel color={carColor} />
        
        <ContactShadows
          opacity={0.4}
          scale={10}
          blur={1}
          far={10}
          resolution={256}
          color="#000000"
        />
        
        <hemisphereLight intensity={0.5} groundColor="#1f2937" />
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}