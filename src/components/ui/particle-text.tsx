'use client'

import { useEffect, useRef, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  originalX: number;
  originalY: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  isExplosion?: boolean;
}

interface ParticleTextProps {
  text?: string;
  particleSize?: number;
  animationSpeed?: number;
  mouseForce?: number;
  interactionMode?: 'attract' | 'repel';
  fontSize?: number;
  fontFamily?: string;
  className?: string;
  primaryColor?: [number, number, number];
  secondaryColor?: [number, number, number];
  accentColor?: [number, number, number];
  glowColor?: [number, number, number];
  coreColor?: [number, number, number];
}

const vertexShaderSource = `
  precision mediump float;
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_opacity;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  varying float v_opacity;
  varying vec2 v_position;
  void main() {
    vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
    position.y *= -1.0;
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = a_size;
    v_opacity = a_opacity;
    v_position = a_position;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_primaryColor;
  uniform vec3 u_secondaryColor;
  uniform vec3 u_accentColor;
  uniform vec3 u_glowColor;
  uniform vec3 u_coreColor;
  varying float v_opacity;
  varying vec2 v_position;
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float dist = length(coord);
    if (dist > 0.5) discard;
    float innerGlow = 1.0 - smoothstep(0.0, 0.2, dist);
    float outerGlow = 1.0 - smoothstep(0.2, 0.5, dist);
    float glow = pow(innerGlow, 3.0) + pow(outerGlow, 1.5) * 0.6;
    float mouseDist = distance(v_position, u_mouse);
    float mouseGlow = 1.0 / (1.0 + mouseDist * 0.008);
    float mouseIntensity = smoothstep(300.0, 0.0, mouseDist);
    float timeWave = sin(u_time * 0.0008) * 0.5 + 0.5;
    float positionGradient = (v_position.x / u_resolution.x + v_position.y / u_resolution.y) * 0.5;
    vec3 baseColor = mix(u_primaryColor, u_secondaryColor, timeWave);
    baseColor = mix(baseColor, u_accentColor, positionGradient * 0.3);
    vec3 color = mix(baseColor, u_coreColor, innerGlow * 0.8);
    color = mix(color, u_glowColor, mouseGlow * mouseIntensity * 0.6);
    float bloom = glow * (1.0 + mouseGlow * 0.8);
    float finalAlpha = bloom * v_opacity * (0.9 + mouseIntensity * 0.4);
    gl_FragColor = vec4(color, finalAlpha);
  }
`;

const postVertexShader = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (a_position + 1.0) * 0.5;
  }
`;

const postFragmentShader = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform vec2 u_texelSize;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 v_texCoord;
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  float filmGrain(vec2 uv, float time) {
    float grain = random(uv + time * 0.001);
    grain = pow(grain, 1.5);
    return grain * 0.1;
  }
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec4 bloom = vec4(0.0);
    float totalWeight = 0.0;
    for (int i = -4; i <= 4; i++) {
      for (int j = -4; j <= 4; j++) {
        vec2 offset = vec2(float(i), float(j)) * u_texelSize * 2.5;
        vec4 s = texture2D(u_texture, v_texCoord + offset);
        float weight = exp(-float(i*i + j*j) * 0.2);
        bloom += s * weight;
        totalWeight += weight;
      }
    }
    bloom /= totalWeight;
    vec4 brightPass = max(color - 0.4, 0.0) * 3.0;
    bloom = bloom + brightPass * 0.9;
    float grain = filmGrain(v_texCoord * u_resolution, u_time);
    vec2 center = v_texCoord - 0.5;
    float aberration = length(center) * 0.015;
    vec4 r = texture2D(u_texture, v_texCoord + center * aberration * vec2(1.0, 0.0));
    vec4 g = texture2D(u_texture, v_texCoord);
    vec4 b = texture2D(u_texture, v_texCoord - center * aberration * vec2(0.0, 1.0));
    vec4 aberrated = vec4(r.r, g.g, b.b, g.a);
    float vignette = 1.0 - length(center) * 0.8;
    vignette = smoothstep(0.3, 1.0, vignette);
    vec4 final_color = aberrated + bloom * 0.6;
    final_color.rgb += grain;
    final_color.rgb *= vignette;
    final_color.rgb = pow(final_color.rgb, vec3(0.9));
    final_color.rgb = mix(final_color.rgb, final_color.rgb * vec3(1.1, 0.95, 1.05), 0.3);
    gl_FragColor = final_color;
  }
`;

export const hexToRGB = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

export function ParticleText({
  text = 'INTERACTIVE',
  particleSize = 0.05,
  animationSpeed = 1.5,
  mouseForce = 250,
  interactionMode = 'repel',
  fontSize,
  fontFamily = 'Montserrat, sans-serif',
  className = '',
  primaryColor = [0.4, 0.49, 0.92],
  secondaryColor = [0.46, 0.29, 0.64],
  accentColor = [0.8, 0.3, 0.9],
  glowColor = [0.0, 0.96, 1.0],
  coreColor = [1.0, 1.0, 1.0],
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const postProgramRef = useRef<WebGLProgram | null>(null);
  const framebufferRef = useRef<WebGLFramebuffer | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const buffersRef = useRef<{
    position: WebGLBuffer | null;
    size: WebGLBuffer | null;
    opacity: WebGLBuffer | null;
  }>({ position: null, size: null, opacity: null });
  const lastTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [, setPerformance] = useState({ fps: 60, particleCount: 0 });

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null => {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = webglCanvasRef.current;
    if (!canvas) return false;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) return false;
    glRef.current = gl;

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return false;
    const program = createProgram(gl, vs, fs);
    if (!program) return false;
    programRef.current = program;

    const pvs = createShader(gl, gl.VERTEX_SHADER, postVertexShader);
    const pfs = createShader(gl, gl.FRAGMENT_SHADER, postFragmentShader);
    if (!pvs || !pfs) return false;
    const postProgram = createProgram(gl, pvs, pfs);
    if (!postProgram) return false;
    postProgramRef.current = postProgram;

    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return false;
    framebufferRef.current = framebuffer;
    textureRef.current = texture;

    buffersRef.current = {
      position: gl.createBuffer(),
      size: gl.createBuffer(),
      opacity: gl.createBuffer(),
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }, [createShader, createProgram]);

  const createParticlesFromText = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    particlesRef.current = [];
    const calculatedFontSize = fontSize || Math.min(140, canvas.width / 7);
    ctx.font = `bold ${calculatedFontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    const startX = canvas.width / 2;
    const startY = canvas.height / 2;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCanvas.width = textWidth + 100;
    tempCanvas.height = calculatedFontSize + 50;
    tempCtx.font = ctx.font;
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    const step = 2;
    for (let y = 0; y < tempCanvas.height; y += step) {
      for (let x = 0; x < tempCanvas.width; x += step) {
        const index = (y * tempCanvas.width + x) * 4;
        if (data[index + 3] > 128) {
          const px = startX + x - tempCanvas.width / 2;
          const py = startY + y - tempCanvas.height / 2;
          particlesRef.current.push({
            x: px + (Math.random() - 0.5) * 120,
            y: py + (Math.random() - 0.5) * 120,
            targetX: px, targetY: py,
            originalX: px, originalY: py,
            vx: 0, vy: 0,
            size: particleSize + Math.random() * 3,
            opacity: Math.random() * 0.4 + 0.6,
            life: 1,
          });
        }
      }
    }
    setPerformance(prev => ({ ...prev, particleCount: particlesRef.current.length }));
  }, [text, particleSize, fontSize, fontFamily]);

  const updateParticle = useCallback((particle: Particle) => {
    const mouse = mouseRef.current;
    if (particle.isExplosion) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life -= 0.025;
      particle.opacity = Math.max(0, particle.life);
      return;
    }
    const dx = mouse.x - particle.x;
    const dy = mouse.y - particle.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < mouseForce * mouseForce) {
      const dist = Math.sqrt(distSq);
      const force = (mouseForce - dist) / mouseForce;
      const angle = Math.atan2(dy, dx);
      const mult = interactionMode === 'attract' ? 1 : -1;
      particle.vx += Math.cos(angle) * force * 3 * mult;
      particle.vy += Math.sin(angle) * force * 3 * mult;
    }
    particle.vx += (particle.targetX - particle.x) * 0.04 * animationSpeed;
    particle.vy += (particle.targetY - particle.y) * 0.04 * animationSpeed;
    particle.vx *= 0.94;
    particle.vy *= 0.94;
    particle.x += particle.vx;
    particle.y += particle.vy;
  }, [mouseForce, animationSpeed, interactionMode]);

  const renderWebGL = useCallback((currentTime: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const postProgram = postProgramRef.current;
    const canvas = webglCanvasRef.current;
    if (!gl || !program || !postProgram || !canvas) return;
    const particles = particlesRef.current;
    if (particles.length === 0) return;

    // Pass 1
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferRef.current);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.04, 0.04, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), mouseRef.current.x, mouseRef.current.y);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), currentTime);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_primaryColor'), primaryColor);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_secondaryColor'), secondaryColor);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_accentColor'), accentColor);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_glowColor'), glowColor);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_coreColor'), coreColor);

    const positions = new Float32Array(particles.length * 2);
    const sizes = new Float32Array(particles.length);
    const opacities = new Float32Array(particles.length);
    for (let i = 0; i < particles.length; i++) {
      positions[i * 2] = particles[i].x;
      positions[i * 2 + 1] = particles[i].y;
      sizes[i] = particles[i].size * 7;
      opacities[i] = particles[i].opacity;
    }

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const sizLoc = gl.getAttribLocation(program, 'a_size');
    const opaLoc = gl.getAttribLocation(program, 'a_opacity');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.position);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.size);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(sizLoc);
    gl.vertexAttribPointer(sizLoc, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.opacity);
    gl.bufferData(gl.ARRAY_BUFFER, opacities, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(opaLoc);
    gl.vertexAttribPointer(opaLoc, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, particles.length);

    // Pass 2
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(postProgram);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const qb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const ppl = gl.getAttribLocation(postProgram, 'a_position');
    gl.enableVertexAttribArray(ppl);
    gl.vertexAttribPointer(ppl, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.uniform1i(gl.getUniformLocation(postProgram, 'u_texture'), 0);
    gl.uniform2f(gl.getUniformLocation(postProgram, 'u_texelSize'), 1.0 / canvas.width, 1.0 / canvas.height);
    gl.uniform1f(gl.getUniformLocation(postProgram, 'u_time'), currentTime);
    gl.uniform2f(gl.getUniformLocation(postProgram, 'u_resolution'), canvas.width, canvas.height);

    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.BLEND);
    gl.deleteBuffer(qb);
  }, [primaryColor, secondaryColor, accentColor, glowColor, coreColor]);

  const animate = useCallback((currentTime: number) => {
    const dt = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    setPerformance(prev => ({ ...prev, fps: Math.round(1000 / (dt || 16)) }));

    particlesRef.current = particlesRef.current.filter(p => {
      updateParticle(p);
      return !p.isExplosion || p.life > 0;
    });
    renderWebGL(currentTime);
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticle, renderWebGL]);

  const handleCanvasResize = useCallback(() => {
    const canvas = canvasRef.current;
    const webgl = webglCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !webgl || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    webgl.width = rect.width;
    webgl.height = rect.height;

    const gl = glRef.current;
    if (gl && textureRef.current) {
      gl.viewport(0, 0, webgl.width, webgl.height);
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, webgl.width, webgl.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    createParticlesFromText();
  }, [createParticlesFromText]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const handleClick = useCallback(() => {
    const mouse = mouseRef.current;
    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120;
      const vel = 4 + Math.random() * 60;
      particlesRef.current.push({
        x: mouse.x, y: mouse.y,
        targetX: mouse.x, targetY: mouse.y,
        originalX: mouse.x, originalY: mouse.y,
        vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel,
        size: particleSize * 0.4, opacity: 1, life: 1, isExplosion: true,
      });
    }
    particlesRef.current.forEach(p => {
      if (p.isExplosion) return;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force * 90;
        p.vy += Math.sin(angle) * force * 90;
      }
    });
  }, [particleSize]);

  useEffect(() => {
    if (initWebGL()) {
      handleCanvasResize();
      window.addEventListener('resize', handleCanvasResize);
      return () => window.removeEventListener('resize', handleCanvasResize);
    }
  }, [initWebGL, handleCanvasResize]);

  useEffect(() => { createParticlesFromText() }, [createParticlesFromText]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) };
  }, [animate]);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
      <canvas
        ref={webglCanvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
    </div>
  );
}
