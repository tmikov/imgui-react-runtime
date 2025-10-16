// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Bouncing ball component - demonstrates custom drawing with rect and circle
import React, { useState, useEffect } from 'react';

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

  const [velocityX, setVelocityX] = useState(Math.cos(angle) * speed);
  const [velocityY, setVelocityY] = useState(Math.sin(angle) * speed);

  // Update ball position every 16ms (~60fps)
  useEffect(() => {
    const interval = setInterval(() => {
      setBallX(prevX => {
        let newX = prevX + velocityX;

        // Bounce off left/right walls
        if (newX - ballRadius <= borderThickness || newX + ballRadius >= contentWidth - borderThickness) {
          setVelocityX(prev => -prev);
          // Clamp position to stay within bounds
          newX = newX - ballRadius <= borderThickness
            ? borderThickness + ballRadius
            : contentWidth - borderThickness - ballRadius;
        }

        return newX;
      });

      setBallY(prevY => {
        let newY = prevY + velocityY;

        // Bounce off top/bottom walls
        if (newY - ballRadius <= borderThickness || newY + ballRadius >= contentHeight - borderThickness) {
          setVelocityY(prev => -prev);
          // Clamp position to stay within bounds
          newY = newY - ballRadius <= borderThickness
            ? borderThickness + ballRadius
            : contentHeight - borderThickness - ballRadius;
        }

        return newY;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [velocityX, velocityY]);

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
