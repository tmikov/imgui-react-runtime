// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Bouncing ball component - demonstrates custom drawing with rect and circle
import React, { useState, useEffect, useRef } from 'react';

export function BouncingBall() {
  // Content dimensions
  const contentWidth = 400;
  const contentHeight = 300;
  const borderThickness = 4;
  const ballRadius = 20;

  // Ball physics state
  const [ballX, setBallX] = useState(200);
  const [ballY, setBallY] = useState(150);

  // Initialize velocity with random angle (use single angle for both components)
  const speed = 5.0;
  const angle = Math.random() * 2 * Math.PI;

  const vx = useRef(Math.cos(angle) * speed);
  const vy = useRef(Math.sin(angle) * speed);

  // Update ball position every animation frame
  useEffect(() => {
    let time = performance.now();
    function render(t) {
      const dt = (t - time) / 10;
      time = t;
      
      setBallX(prevX => {
        let newX = prevX + vx.current * dt;

        // Bounce off left/right walls
        if (newX - ballRadius <= borderThickness || newX + ballRadius >= contentWidth - borderThickness) {
          vx.current = -vx.current;
          // Clamp position to stay within bounds
          newX = newX - ballRadius <= borderThickness
            ? borderThickness + ballRadius
            : contentWidth - borderThickness - ballRadius;
        }

        return newX;
      });

      setBallY(prevY => {
        let newY = prevY + vy.current * dt;

        // Bounce off top/bottom walls
        if (newY - ballRadius <= borderThickness || newY + ballRadius >= contentHeight - borderThickness) {
          vy.current = -vy.current;
          // Clamp position to stay within bounds
          newY = newY - ballRadius <= borderThickness
            ? borderThickness + ballRadius
            : contentHeight - borderThickness - ballRadius;
        }

        return newY;
      });

      // Request next frame
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }, []);

  return (
    <window title="Bouncing Ball" defaultX={600} defaultY={350} flags={64}>
      {/* flags=64 is ImGuiWindowFlags_AlwaysAutoResize */}
      <child width={contentWidth} height={contentHeight} noPadding noScrollbar>
        {/* White borders - top, left, bottom, right */}
        <rect x={0} y={0} width={contentWidth} height={borderThickness} color="#FFFFFF" filled />
        <rect x={0} y={0} width={borderThickness} height={contentHeight} color="#FFFFFF" filled />
        <rect x={0} y={contentHeight - borderThickness} width={contentWidth} height={borderThickness} color="#FFFFFF" filled />
        <rect x={contentWidth - borderThickness} y={0} width={borderThickness} height={contentHeight} color="#FFFFFF" filled />

        {/* Green bouncing ball */}
        <circle x={ballX} y={ballY} radius={ballRadius} color="#00FF00" filled />
      </child>
    </window>
  );
}
