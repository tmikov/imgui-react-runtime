// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

import React, { useState } from 'react';

export function App() {
  const [windows, setWindows] = useState([
    { id: 1, title: "Window 1" },
    { id: 2, title: "Window 2" },
  ]);
  const [nextId, setNextId] = useState(3);

  const addWindow = () => {
    setWindows([...windows, { id: nextId, title: `Window ${nextId}` }]);
    setNextId(nextId + 1);
  };

  const closeWindow = (windowId) => {
    setWindows(windows.filter(w => w.id !== windowId));
  };

  return (
    <>
      <window title="Control Panel" defaultX={20} defaultY={20} defaultWidth={300} defaultHeight={150}>
        <text color="#FFFF00">Dynamic Window Manager</text>
        <separator />
        <text>Total windows: {windows.length}</text>
        <button onClick={addWindow}>Add New Window</button>
        <separator />
        <text color="#888888">Click the X button on any window to close it</text>
      </window>

      {windows.map(w => (
        <window
          key={w.id}
          title={w.title}
          defaultX={100 + (w.id * 30)}
          defaultY={100 + (w.id * 30)}
          defaultWidth={400}
          defaultHeight={200}
          onClose={() => closeWindow(w.id)}
        >
          <text color="#00FFFF">This is {w.title}</text>
          <separator />
          <text>Window ID: {w.id}</text>
          <text>Click the X button in the title bar to close this window</text>
          <separator />
          <text color="#00FF00">Each window can be closed independently</text>
        </window>
      ))}
    </>
  );
}
