// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// React application demonstrating various ImGui components
import React, { useState } from 'react';
import { StockTable } from './StockTable.jsx';
import { BouncingBall } from './BouncingBall.jsx';
import { ControlledWindow } from './ControlledWindow.jsx';

export function App() {
  const [counter1, setCounter1] = useState(0);
  const [counter2, setCounter2] = useState(0);

  console.debug('App rendering, counter1 =', counter1, 'counter2 =', counter2);

  return (
    <root>
      {/* Background decorations - rendered first, behind windows */}
      <rect x={10} y={10} width={150} height={100} color="#3030A0C0" filled={true} />
      <rect x={200} y={400} width={180} height={80} color="#A03030C0" filled={true} />
      <circle x={700} y={500} radius={60} color="#30A030C0" filled={true} segments={32} />
      <circle x={900} y={100} radius={40} color="#A0A030C0" filled={true} segments={24} />

      {/* Status bar at the top */}
      <rect x={0} y={0} width={1200} height={25} color="#00000080" filled={true} />
      <text color="#00FF00">React + ImGui Showcase</text>
      <sameline />
      <text color="#FFFF00">  |  Counters: {counter1} / {counter2}</text>
      <sameline />
      <text color="#00FFFF">  |  Total clicks: {counter1 + counter2}</text>

      {/* All the existing windows */}
      <BouncingBall />
      <StockTable />
      <ControlledWindow />

      <window title="Hello from React!" defaultX={20} defaultY={40}>
        <text>This is a React component rendering to ImGui</text>
        <text>React's reconciler is working perfectly!</text>

        <separator />

        <button onClick={() => setCounter1(counter1 + 1)}>
          Click me!
        </button>
        <sameline />
        <text>Button clicked {counter1} times</text>
      </window>

      <window title="Component Playground" defaultX={650} defaultY={40}>
        <text color="#00FFFF">Welcome to the React + ImGui demo!</text>

        <separator />

        <group>
          <text color="#FFFF00">Counter Demo:</text>
          <button onClick={() => setCounter2(counter2 + 1)}>
            Increment
          </button>
          <sameline />
          <button onClick={() => setCounter2(counter2 - 1)}>
            Decrement
          </button>
          <sameline />
          <button onClick={() => setCounter2(0)}>
            Reset
          </button>
          <text color={counter2 === 0 ? "#888888" : "#FFFFFF"}>
            Current value: {counter2}
          </text>
        </group>

        <separator />

        <group>
          <text color="#FFFF00">Quick Math:</text>
          <indent>
            <text color="#00FF00">Counter x 2 = {counter2 * 2}</text>
            <text color="#00FF00">Counter squared = {counter2 * counter2}</text>
            <text color="#00FFFF">Counter is {counter2 % 2 === 0 ? 'EVEN' : 'ODD'}</text>
          </indent>
        </group>

        <separator />

        <group>
          <text color="#FFFF00">Status Indicators:</text>
          <indent>
            <text color={counter2 > 10 ? "#FF4444" : "#4444FF"}>
              {counter2 > 10 ? '[HOT] Counter is high!' : '[COOL] Counter is low'}
            </text>
            <text color={counter2 < 0 ? "#FFAA00" : "#00FF00"}>
              {counter2 < 0 ? '[WARN] Negative territory!' : '[OK] Positive vibes'}
            </text>
          </indent>
        </group>

        <separator />

        <collapsingheader title="Architecture Info">
          <text>React 19.2.0 with custom reconciler</text>
          <text>Static Hermes (typed + untyped units)</text>
          <text>Zero-overhead FFI to DearImGui</text>
          <text>Event loop with setTimeout/Promises</text>
          <text color="#FF00FF">Root component for fullscreen canvas!</text>
        </collapsingheader>

        <separator />

        <text>Quick Actions:</text>
        <button onClick={() => setCounter2(Math.floor(Math.random() * 100))}>
          Random (0-99)
        </button>
        <sameline />
        <button onClick={() => setCounter2(counter2 + 10)}>
          +10
        </button>
        <sameline />
        <button onClick={() => setCounter2(counter2 - 10)}>
          -10
        </button>
      </window>

      {/* Footer info bar */}
      <rect x={0} y={575} width={1200} height={25} color="#00000080" filled={true} />
      <text color="#888888">Root component demo - Background shapes and overlay elements render behind/above all windows</text>
    </root>
  );
}
