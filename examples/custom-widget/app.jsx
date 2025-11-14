import React, { useState } from "react";

const ACTIONS = ["Cut", "Copy", "Paste", "Delete", "Save"];

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleItemClick = (index) => {
    setSelectedAction(ACTIONS[index]);
    setMenuOpen(false);
  };

  return (
    <window title="Custom Widget Example" defaultWidth={600} defaultHeight={400}>
      <text>This example demonstrates creating custom ImGui widgets.</text>
      <text>The RadialMenu is a custom widget built using ImGui's draw list API.</text>
      <separator />

      <text>Click the button to open the radial menu:</text>
      <button onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? "Close Menu" : "Open Radial Menu"}
      </button>

      {menuOpen && (
        <>
          <separator />
          <radialmenu
            radius={80}
            items={ACTIONS}
            onItemClick={handleItemClick}
            centerText="Actions"
          />
          <separator />
        </>
      )}

      {selectedAction && (
        <>
          <text color="#00FF88">Selected action: {selectedAction}</text>
          <separator />
        </>
      )}

      <text color="#888888">Hover over menu sectors to highlight them.</text>
      <text color="#888888">Click a sector to select an action.</text>
    </window>
  );
}
