'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MAJOR_ROUTES, INDIA_OUTLINE } from '@/lib/india/routes';
import { useTheme } from '@/providers/theme-provider';

const mousePos = { x: 0, y: 0 };

function IndiaOutline() {
  const points = useMemo(() => {
    return INDIA_OUTLINE.map(([lng, lat]) => {
      const x = (lng - 78) * 0.15;
      const z = -(lat - 20) * 0.15;
      return [x, 0, z] as [number, number, number];
    });
  }, []);

  return (
    <Line
      points={points}
      color="#1e40af"
      lineWidth={1}
      transparent
      opacity={0.25}
    />
  );
}

function RailwayRoute({ coords }: { coords: [number, number][] }) {
  const curvePoints = useMemo(() => {
    const vecPoints = coords.map(([lng, lat]) => {
      const x = (lng - 78) * 0.15;
      const z = -(lat - 20) * 0.15;
      return new THREE.Vector3(x, 0.02, z);
    });
    const curve = new THREE.CatmullRomCurve3(vecPoints, false, 'catmullrom', 0.5);
    return curve.getPoints(80).map(p => [p.x, p.y, p.z] as [number, number, number]);
  }, [coords]);

  return (
    <group>
      <Line
        points={curvePoints}
        color="#0ea5e9"
        lineWidth={2}
        transparent
        opacity={0.12}
      />
      <Line
        points={curvePoints}
        color="#38bdf8"
        lineWidth={1.5}
        transparent
        opacity={0.6}
      />
    </group>
  );
}

function StationPoint({ position, isMajor }: { position: [number, number, number]; isMajor: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && isMajor) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[isMajor ? 0.04 : 0.02, 8, 8]} />
      <meshBasicMaterial
        color={isMajor ? '#38bdf8' : '#64748b'}
        transparent
        opacity={isMajor ? 0.9 : 0.5}
      />
    </mesh>
  );
}

function TrainNode({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.08 + Math.sin(clock.elapsedTime * 3) * 0.02;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.3;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[position.x, 0.08, position.z]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#0ea5e9" />
      </mesh>
      <mesh ref={glowRef} position={[position.x, 0.08, position.z]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function FloatingParticles({ isDark }: { isDark: boolean }) {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 12,
        Math.random() * 0.5 + 0.05,
        (Math.random() - 0.5) * 10,
      ]);
    }
    return pos;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    positions.forEach((pos, i) => {
      dummy.position.set(
        pos[0] + Math.sin(clock.elapsedTime * 0.3 + i) * 0.05,
        pos[1] + Math.sin(clock.elapsedTime * 0.5 + i * 0.7) * 0.03,
        pos[2] + Math.cos(clock.elapsedTime * 0.3 + i) * 0.05
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.008, 6, 6]} />
      <meshBasicMaterial color={isDark ? '#64748b' : '#94a3b8'} transparent opacity={isDark ? 0.4 : 0.25} />
    </instancedMesh>
  );
}

function Scene({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mousePos.y * 0.15,
      0.02
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      mousePos.x * 0.08,
      0.02
    );
  });

  const trainPositions = useMemo(() => {
    return MAJOR_ROUTES.map((route) => {
      const midIdx = Math.floor(route.coords.length / 2);
      const [lng, lat] = route.coords[midIdx];
      return new THREE.Vector3((lng - 78) * 0.15, 0.08, -(lat - 20) * 0.15);
    });
  }, []);

  const planeColor = isDark ? '#0a0f1e' : '#e2e8f0';
  const ambientIntensity = isDark ? 0.5 : 0.8;

  return (
    <group ref={groupRef}>
      <ambientLight intensity={ambientIntensity} />
      <pointLight position={[5, 5, 5]} intensity={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color={planeColor} transparent opacity={0.5} />
      </mesh>

      <IndiaOutline />

      {MAJOR_ROUTES.map((route) => (
        <RailwayRoute key={route.code} coords={route.coords} />
      ))}

      {MAJOR_ROUTES.flatMap((route) =>
        route.stations.map((station, j) => {
          const x = (station.lng - 78) * 0.15;
          const z = -(station.lat - 20) * 0.15;
          return (
            <StationPoint
              key={`${route.code}-${station.code}`}
              position={[x, 0.02, z]}
              isMajor={j === 0 || j === route.stations.length - 1}
            />
          );
        })
      )}

      {trainPositions.map((pos, i) => (
        <TrainNode key={i} position={pos} />
      ))}

      <FloatingParticles isDark={isDark} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 2.5}
        minPolarAngle={Math.PI / 4}
      />
    </group>
  );
}

export function IndiaRailwayNetwork({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mousePos.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const gradientFrom = isDark ? 'from-[#060a14]' : 'from-background';

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
    >
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-rail-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Canvas
          camera={{ position: [0, 4, 6], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene isDark={isDark} />
        </Canvas>
      </Suspense>

      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t ${gradientFrom} to-transparent`} />
      </div>
    </div>
  );
}
