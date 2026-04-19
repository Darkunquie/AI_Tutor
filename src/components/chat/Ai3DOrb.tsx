'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

type OrbState = 'idle' | 'speaking' | 'thinking' | 'listening';

interface Ai3DOrbProps {
  state: OrbState;
  className?: string;
}

/**
 * 3D generative orb — Three.js icosahedron with Perlin noise displacement.
 * Amber wireframe, reacts to AI state:
 * - idle: slow gentle morph
 * - speaking: fast energetic displacement matching speech rhythm
 * - thinking: medium pulsing rotation
 * - listening: subtle responsive wobble
 */
export function Ai3DOrb({ state, className = '' }: Ai3DOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<OrbState>(state);

  // Keep state ref in sync without re-mounting
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) { return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Icosahedron with high subdivision for smooth noise
    const geometry = new THREE.IcosahedronGeometry(1.2, 48);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0.2 },
        speed: { value: 0.5 },
        pointLightPos: { value: new THREE.Vector3(0, 0, 5) },
        color: { value: new THREE.Color('#D4A373') },
        glowColor: { value: new THREE.Color('#F2C38E') },
      },
      vertexShader: `
        uniform float time;
        uniform float intensity;
        uniform float speed;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vNormal = normal;
          vPosition = position;
          float displacement = snoise(position * 2.0 + time * speed) * intensity;
          displacement += snoise(position * 4.0 + time * speed * 1.5) * intensity * 0.3;
          vDisplacement = displacement;
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 glowColor;
        uniform vec3 pointLightPos;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(pointLightPos - vPosition);
          float diffuse = max(dot(normal, lightDir), 0.0);

          // Fresnel glow at edges
          float fresnel = 1.0 - dot(normal, vec3(0.0, 0.0, 1.0));
          fresnel = pow(fresnel, 2.5);

          // Mix color based on displacement
          vec3 baseColor = mix(color, glowColor, abs(vDisplacement) * 3.0);
          vec3 finalColor = baseColor * (diffuse * 0.6 + 0.4) + glowColor * fresnel * 0.6;

          gl_FragColor = vec4(finalColor, 0.85 + fresnel * 0.15);
        }
      `,
      wireframe: true,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Point light follows mouse
    const pointLight = new THREE.PointLight(0xF2C38E, 1, 100);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // Ambient glow
    const ambientLight = new THREE.AmbientLight(0xD4A373, 0.3);
    scene.add(ambientLight);

    let frameId: number;
    let targetIntensity = 0.15;
    let targetSpeed = 0.4;
    let targetRotSpeed = 0.0005;

    const animate = (t: number) => {
      const s = stateRef.current;

      // Smooth transition to target values
      if (s === 'speaking') {
        targetIntensity = 0.45;
        targetSpeed = 1.8;
        targetRotSpeed = 0.003;
      } else if (s === 'thinking') {
        targetIntensity = 0.25;
        targetSpeed = 0.8;
        targetRotSpeed = 0.002;
      } else if (s === 'listening') {
        targetIntensity = 0.2;
        targetSpeed = 0.6;
        targetRotSpeed = 0.001;
      } else {
        targetIntensity = 0.12;
        targetSpeed = 0.3;
        targetRotSpeed = 0.0004;
      }

      // Lerp uniforms for smooth transitions
      material.uniforms.intensity.value += (targetIntensity - material.uniforms.intensity.value) * 0.05;
      material.uniforms.speed.value += (targetSpeed - material.uniforms.speed.value) * 0.05;
      material.uniforms.time.value = t * 0.0003;

      const currentRotSpeed = mesh.rotation.y;
      mesh.rotation.y += targetRotSpeed;
      mesh.rotation.x += targetRotSpeed * 0.4;

      // Pulsing scale for speaking
      if (s === 'speaking') {
        const pulse = 1.0 + Math.sin(t * 0.006) * 0.04 + Math.sin(t * 0.015) * 0.02;
        mesh.scale.setScalar(pulse);
      } else {
        const breathe = 1.0 + Math.sin(t * 0.001) * 0.015;
        mesh.scale.setScalar(breathe);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!currentMount) { return; }
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointLight.position.set(x * 3, y * 3, 5);
      material.uniforms.pointLightPos.value.set(x * 3, y * 3, 5);
    };

    window.addEventListener('resize', handleResize);
    currentMount.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('mousemove', handleMouseMove);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-auto ${className}`}
      aria-label={`AI orb — ${state}`}
    />
  );
}
