import React from 'react';
import { createRoot, render } from 'react-imgui-reconciler/reconciler.js';
import { App } from './app.jsx';

// Create React root with fiber root and container
const root = createRoot();

// Expose to typed unit via global
globalThis.reactApp = {
  rootChildren: [],

  // Render the app
  render() {
    render(React.createElement(App), root);
  },
};

// Initial render
globalThis.reactApp.render();
