'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface JourneyOrbProps {
  motherStatus?: string;
  babyStatus?: string;
  className?: string;
}

export function JourneyOrb3D({ className = '' }: JourneyOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return Boolean(gl);
  });

  const [isLowPower] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 640;
  });

  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for holding all orb objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Translucent Sphere (The NavAura Orb)
    const orbGeometry = new THREE.SphereGeometry(1.0, 48, 48);
    const orbMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd9a6a8,
      emissive: 0x6e5655,
      emissiveIntensity: 0.2,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.9,
      ior: 1.3,
    });
    const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
    mainGroup.add(orbMesh);

    // 2. Mother Path Ring (Rose Gold)
    const motherRingGeo = new THREE.TorusGeometry(1.6, 0.025, 16, 100);
    const motherRingMat = new THREE.MeshStandardMaterial({
      color: 0xb98286,
      roughness: 0.2,
      metalness: 0.8,
    });
    const motherRing = new THREE.Mesh(motherRingGeo, motherRingMat);
    motherRing.rotation.x = Math.PI / 3;
    motherRing.rotation.y = Math.PI / 6;
    mainGroup.add(motherRing);

    // 3. Baby Path Ring (Champagne Gold / Soft Pink)
    const babyRingGeo = new THREE.TorusGeometry(2.1, 0.02, 16, 100);
    const babyRingMat = new THREE.MeshStandardMaterial({
      color: 0xe7cfa5,
      roughness: 0.2,
      metalness: 0.7,
    });
    const babyRing = new THREE.Mesh(babyRingGeo, babyRingMat);
    babyRing.rotation.x = -Math.PI / 4;
    babyRing.rotation.y = -Math.PI / 5;
    mainGroup.add(babyRing);

    // 4. Soft Aura Particle Ring
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0xd9a6a8);
    const color2 = new THREE.Color(0xe7cfa5);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xd9a6a8, 3, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xe7cfa5, 2, 10);
    pointLight2.position.set(-3, -2, -2);
    scene.add(pointLight2);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!isLowPower) {
        mainGroup.rotation.y = elapsedTime * 0.2;
        motherRing.rotation.z = elapsedTime * 0.15;
        babyRing.rotation.z = -elapsedTime * 0.12;
        particles.rotation.y = -elapsedTime * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      orbGeometry.dispose();
      orbMaterial.dispose();
      motherRingGeo.dispose();
      motherRingMat.dispose();
      babyRingGeo.dispose();
      babyRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [hasWebGL, isLowPower]);

  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="relative h-64 w-64 rounded-full bg-gradient-to-tr from-rose-200 via-amber-100 to-rose-300 opacity-80 blur-lg animate-pulse" />
        <div className="absolute flex flex-col items-center justify-center text-center">
          <div className="h-28 w-28 rounded-full border-2 border-rose-300/60 bg-white/40 backdrop-blur-md shadow-xl flex items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-700">NavAura</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div ref={containerRef} className="h-full w-full max-w-[380px] max-h-[380px]" />
    </div>
  );
}
