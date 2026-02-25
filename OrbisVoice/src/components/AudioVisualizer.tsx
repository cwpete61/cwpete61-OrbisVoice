import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const draw = () => {
      if (!isActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Base radius plus volume reaction
      // Volume is typically 0-1, but might be small. Scale it up.
      const volumeScale = Math.min(volume * 200, 50); 
      
      // Draw multiple oscillating circles
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const baseRadius = 30 + i * 15;
        const radius = baseRadius + Math.sin(time + i) * 5 + volumeScale;
        
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 78, 0, ${0.5 - i * 0.15})`;
        ctx.lineWidth = 2 + (volume * 10); // Thicker lines with volume
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    if (isActive) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full h-full max-w-[300px] max-h-[300px]"
    />
  );
};
