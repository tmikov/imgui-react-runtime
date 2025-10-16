// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

import React from 'react';
import { createRoot, render } from 'react-imgui-reconciler/reconciler.js';
import { App } from './app.jsx';

// Configure window (optional - defaults are provided)
// globalThis.sappConfig is created by imgui-unit with { title: "imgui-react-runtime" }
// Applications can override properties here before rendering
globalThis.sappConfig.title = "Hello World";
globalThis.sappConfig.width = 320;
globalThis.sappConfig.height = 200;

// Create React root with fiber root and container
const root = createRoot();

// Expose to typed unit via global
globalThis.reactApp = {
  rootChildren: [],

  // Render the app
  // Note: resetAfterCommit in host-config.js will sync rootChildren after each render
  render() {
    render(React.createElement(App), root);
  }
};

// Initial render
globalThis.reactApp.render();
