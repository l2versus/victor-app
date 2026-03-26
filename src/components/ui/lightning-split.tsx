"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"

// Electric arc WebGL shader
const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_intensity;

  // Simplex noise approximation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // Center line with noise displacement
    float centerX = 0.5;
    float noiseVal = fbm(vec2(uv.y * 8.0, u_time * 2.0)) * 0.15;
    float noiseVal2 = fbm(vec2(uv.y * 16.0, u_time * 3.0 + 100.0)) * 0.05;

    float dist = abs(uv.x - centerX - noiseVal - noiseVal2);

    // Electric glow
    float glow = 0.0;
    glow += 0.01 / (dist + 0.001) * u_intensity * 0.3;
    glow += 0.005 / (dist * dist + 0.0001) * u_intensity * 0.1;

    // Branch lightning
    for (int i = 0; i < 3; i++) {
      float branchOffset = fbm(vec2(uv.y * 12.0 + float(i) * 50.0, u_time * 4.0 + float(i) * 33.0));
      float branchDist = abs(uv.x - centerX - noiseVal * 0.5 - branchOffset * 0.1);
      float branchIntensity = step(0.7, fbm(vec2(uv.y * 3.0 + float(i) * 10.0, u_time + float(i))));
      glow += 0.003 / (branchDist + 0.002) * branchIntensity * u_intensity * 0.2;
    }

    // Color: electric blue/white core with red outer glow
    vec3 coreColor = vec3(0.7, 0.8, 1.0);
    vec3 outerColor = vec3(0.9, 0.2, 0.2);
    vec3 color = mix(outerColor, coreColor, smoothstep(0.05, 0.0, dist));
    color *= glow;

    // Add flicker
    float flicker = 0.8 + 0.2 * sin(u_time * 20.0) * sin(u_time * 13.0 + 1.0);
    color *= flicker;

    gl_FragColor = vec4(color, min(glow * 0.8, 1.0));
  }
`

const ELECTRIC_CONFIG = {
  intensity: 1.0,
  speed: 1.0,
  color: { core: [0.7, 0.8, 1.0], outer: [0.9, 0.2, 0.2] },
}

function ShaderCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    })
    if (!gl) return

    // Create shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vertShader, VERTEX_SHADER)
    gl.compileShader(vertShader)

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fragShader, FRAGMENT_SHADER)
    gl.compileShader(fragShader)

    const program = gl.createProgram()!
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    // Fullscreen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const aPosition = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, "u_time")
    const uResolution = gl.getUniformLocation(program, "u_resolution")
    const uIntensity = gl.getUniformLocation(program, "u_intensity")

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
    }

    resize()
    window.addEventListener("resize", resize)

    const startTime = performance.now()

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.uniform1f(uTime, elapsed * ELECTRIC_CONFIG.speed)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uIntensity, ELECTRIC_CONFIG.intensity)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", resize)
      gl.deleteProgram(program)
      gl.deleteShader(vertShader)
      gl.deleteShader(fragShader)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  )
}

interface LightningSplitProps {
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  leftBg?: string
  rightBg?: string
  className?: string
}

export function LightningSplit({
  leftContent,
  rightContent,
  leftBg = "bg-neutral-950",
  rightBg = "bg-neutral-900",
  className = "",
}: LightningSplitProps) {
  const [hovered, setHovered] = useState<"left" | "right" | null>(null)

  const getLeftWidth = useCallback(() => {
    if (hovered === "left") return "60%"
    if (hovered === "right") return "40%"
    return "50%"
  }, [hovered])

  const getRightWidth = useCallback(() => {
    if (hovered === "right") return "60%"
    if (hovered === "left") return "40%"
    return "50%"
  }, [hovered])

  return (
    <div
      className={`relative w-full h-full flex overflow-hidden ${className}`}
    >
      {/* Left panel */}
      <motion.div
        className={`relative h-full overflow-hidden ${leftBg}`}
        animate={{ width: getLeftWidth() }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setHovered("left")}
        onMouseLeave={() => setHovered(null)}
        style={{
          clipPath: "polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {leftContent ?? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Before</h2>
              <p className="text-neutral-400">Hover to expand</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightning divider */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-24 z-10 pointer-events-none">
        <ShaderCanvas className="absolute inset-0" />
      </div>

      {/* Right panel */}
      <motion.div
        className={`relative h-full overflow-hidden ${rightBg}`}
        animate={{ width: getRightWidth() }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setHovered("right")}
        onMouseLeave={() => setHovered(null)}
        style={{
          clipPath: "polygon(20px 0, 100% 0, 100% 100%, 0 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {rightContent ?? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">After</h2>
              <p className="text-neutral-400">Hover to expand</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export { ShaderCanvas }
export default LightningSplit
