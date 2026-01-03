"use client"
import { useEffect, useRef, useState } from "react"

interface MousePosition {
  x: number
  y: number
}

export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0.5, y: 0.5 })
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Use window dimensions for global tracking
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      setMousePosition({ x, y })
      setIsHovering(true)
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    // Listen on document level for better tracking
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Primary gradient orb - follows cursor */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "600px",
          height: "600px",
          background: `radial-gradient(circle, rgba(104, 42, 216, ${isHovering ? 0.25 : 0.15}) 0%, rgba(104, 42, 216, 0.05) 50%, transparent 70%)`,
          left: `calc(${mousePosition.x * 100}% - 300px)`,
          top: `calc(${mousePosition.y * 100}% - 300px)`,
          transform: `scale(${isHovering ? 1.3 : 1})`,
          transition: "left 0.3s ease-out, top 0.3s ease-out, transform 0.5s ease-out, background 0.5s ease-out",
        }}
      />
      
      {/* Secondary pulsing orb - opposite corner */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "500px",
          height: "500px",
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 70%)`,
          right: `calc(${(1 - mousePosition.x) * 20}% - 250px)`,
          bottom: `calc(${(1 - mousePosition.y) * 20}% - 250px)`,
          animation: "pulse-slow 6s ease-in-out infinite",
        }}
      />

      {/* Third accent orb */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "400px",
          height: "400px",
          background: `radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 60%)`,
          left: "20%",
          top: "60%",
          animation: "float-slow 8s ease-in-out infinite",
        }}
      />

      {/* Breathing grid pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(104, 42, 216, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(104, 42, 216, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${60 + (mousePosition.x - 0.5) * 20}px ${60 + (mousePosition.y - 0.5) * 20}px`,
          transition: "background-size 0.5s ease-out",
          opacity: isHovering ? 1 : 0.5,
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              backgroundColor: `rgba(104, 42, 216, ${0.2 + (i % 5) * 0.05})`,
              left: `${5 + (i * 6.5)}%`,
              top: `${10 + ((i * 7.3) % 80)}%`,
              animation: `float ${5 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle radial vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
        }}
      />
    </div>
  )
}