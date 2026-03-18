import { useEffect, useRef } from "react";
import * as THREE from "three";

const DataFlowBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>(0);
  const isRunningRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isSmallViewport = window.matchMedia("(max-width: 1024px)").matches;

    if (shouldReduceMotion || isSmallViewport) {
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, -20);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Grid configuration
    const gridSize = 60;
    const gridDivisions = 40;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0xd4af37,
      0x1a1a1a
    );
    gridHelper.position.y = -2;
    gridHelper.rotation.x = 0;
    scene.add(gridHelper);

    // Particles / Data stream
    const particleCount = 300;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Spread across the grid
      positions[i * 3] = (Math.random() - 0.5) * gridSize;
      positions[i * 3 + 1] = Math.random() * 3 - 1;
      positions[i * 3 + 2] = Math.random() * -80;

      velocities[i] = Math.random() * 0.3 + 0.1;
      sizes[i] = Math.random() * 3 + 1;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing particles
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xd4af37) },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          
          // Fade out with distance
          vAlpha = smoothstep(-80.0, 0.0, position.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float glow = 1.0 - dist * 2.0;
          glow = pow(glow, 2.0);
          
          gl_FragColor = vec4(uColor, glow * vAlpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);

    // Horizontal data lines
    const lineCount = 15;
    const lines: THREE.Line[] = [];

    for (let i = 0; i < lineCount; i++) {
      const lineGeometry = new THREE.BufferGeometry();
      const linePositions = new Float32Array(6);

      const y = Math.random() * 4 - 1;
      const x = (Math.random() - 0.5) * gridSize * 0.8;
      const z = Math.random() * -60;
      const length = Math.random() * 8 + 4;

      linePositions[0] = x;
      linePositions[1] = y;
      linePositions[2] = z;
      linePositions[3] = x;
      linePositions[4] = y;
      linePositions[5] = z + length;

      lineGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(linePositions, 3)
      );

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: Math.random() * 0.5 + 0.2,
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      (line as THREE.Line & { velocity: number }).velocity =
        Math.random() * 0.4 + 0.2;
      lines.push(line);
      scene.add(line);
    }

    // Ambient glow
    const ambientLight = new THREE.AmbientLight(0xd4af37, 0.1);
    scene.add(ambientLight);

    // Animation
    let time = 0;
    const animate = () => {
      if (!isRunningRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      time += 0.01;

      // Update particles
      const posAttr = particlesGeometry.attributes.position;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 2] += velocities[i];

        // Reset when reaching camera
        if (posArray[i * 3 + 2] > 10) {
          posArray[i * 3 + 2] = -80;
          posArray[i * 3] = (Math.random() - 0.5) * gridSize;
          posArray[i * 3 + 1] = Math.random() * 3 - 1;
        }
      }
      posAttr.needsUpdate = true;

      // Update lines
      lines.forEach((line) => {
        const lineTyped = line as THREE.Line & { velocity: number };
        const linePos = line.geometry.attributes.position.array as Float32Array;
        linePos[2] += lineTyped.velocity;
        linePos[5] += lineTyped.velocity;

        if (linePos[2] > 10) {
          const newZ = -60 - Math.random() * 20;
          const newX = (Math.random() - 0.5) * gridSize * 0.8;
          const newY = Math.random() * 4 - 1;
          const length = Math.random() * 8 + 4;

          linePos[0] = newX;
          linePos[1] = newY;
          linePos[2] = newZ;
          linePos[3] = newX;
          linePos[4] = newY;
          linePos[5] = newZ + length;
        }

        line.geometry.attributes.position.needsUpdate = true;
      });

      // Wave effect on grid
      gridHelper.position.y = -2 + Math.sin(time * 0.5) * 0.3;

      // Update shader time
      particleMaterial.uniforms.uTime.value = time;

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleVisibilityChange = () => {
      isRunningRef.current = !document.hidden;
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationIdRef.current);

      if (rendererRef.current) {
        rendererRef.current.domElement.remove();
      }

      renderer.dispose();
      particlesGeometry.dispose();
      particleMaterial.dispose();
      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();

      lines.forEach((line) => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, #0a0a0a 0%, #0f0f0f 50%, #0a0a0a 100%)",
      }}
    />
  );
};

export default DataFlowBackground;
