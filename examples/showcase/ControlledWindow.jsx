// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Demonstration of controlled window position/size pattern
import React, { useState } from 'react';

export function ControlledWindow() {
  // Controlled window state
  const [windowState, setWindowState] = useState({
    x: 300,
    y: 300,
    width: 350,
    height: 250
  });

  const snapToOrigin = () => {
    setWindowState(prev => ({ ...prev, x: 20, y: 20 }));
  };

  const snapToCenter = () => {
    // Approximate screen center
    setWindowState(prev => ({ ...prev, x: 400, y: 300 }));
  };

  const makeWide = () => {
    setWindowState(prev => ({ ...prev, width: 600, height: 250 }));
  };

  const makeTall = () => {
    setWindowState(prev => ({ ...prev, width: 350, height: 400 }));
  };

  return (
    <window
      title="Controlled Window Demo"
      x={windowState.x}
      y={windowState.y}
      width={windowState.width}
      height={windowState.height}
      onWindowState={(x, y, width, height) => {
        setWindowState({ x, y, width, height });
      }}
    >
      <text color="#FFAA00">This window is CONTROLLED by React state</text>
      <text>Try moving or resizing it - state updates automatically!</text>

      <separator />

      <text color="#00FFFF">Current State:</text>
      <indent>
        <text>Position: ({Math.round(windowState.x)}, {Math.round(windowState.y)})</text>
        <text>Size: {Math.round(windowState.width)} x {Math.round(windowState.height)}</text>
      </indent>

      <separator />

      <text color="#00FF00">Programmatic Control:</text>

      <button onClick={snapToOrigin}>Snap to Origin (20, 20)</button>
      <button onClick={snapToCenter}>Snap to Center (400, 300)</button>

      <separator />

      <button onClick={makeWide}>Make Wide (600x250)</button>
      <sameline />
      <button onClick={makeTall}>Make Tall (350x400)</button>

      <separator />

      <collapsingheader title="How This Works">
        <text wrapped>
          This window uses x, y, width, and height props (not defaultX/defaultY).
          These props are enforced every frame using ImGuiCond_Always.
        </text>
        <text wrapped>
          When you move or resize the window, onWindowState fires with new values.
          We update React state, which updates the props, completing the cycle.
        </text>
        <text wrapped>
          The buttons demonstrate programmatic control: just update state!
        </text>
      </collapsingheader>
    </window>
  );
}
