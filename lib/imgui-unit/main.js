// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Main entry point for typed ImGui unit
// Provides on_init, on_frame, on_event callbacks for C++ bridge
// Note: globalThis.sappConfig is created by C++ before units load

globalThis.on_init = function on_init(): void {
  // Trigger initial React render
  const reactApp = globalThis.reactApp;
  if (reactApp && reactApp.render) {
    reactApp.render();
  }
};

globalThis.on_frame = function on_frame(width: number, height: number, curTime: number): void {
  // Flush temporary allocations from previous frame
  flushAllocTmp();

  // Render the React tree (callbacks are invoked directly during rendering)
  const imguiUnit = (globalThis as any).imguiUnit;
  if (imguiUnit && imguiUnit.renderTree) {
    imguiUnit.renderTree();
  }
};

globalThis.on_event = function on_event(type: number, key_code: number, modifiers: number): void {
  // Handle events if needed
  // For now, we'll just pass through
};
