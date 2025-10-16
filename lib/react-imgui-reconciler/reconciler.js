// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

import Reconciler from 'react-reconciler';
import hostConfig from './host-config.js';

/**
 * Create the React reconciler instance by passing it our host config.
 * This gives us a reconciler that knows how to manipulate our tree structure.
 */
const reconciler = Reconciler(hostConfig);

/**
 * Create a root container for rendering.
 * This is the entry point - call this once to create a render target.
 *
 * @returns An object with:
 *   - container: Our container object that will hold the tree
 *   - fiberRoot: React's internal fiber root
 */
export function createRoot() {
  // This is our container - it will hold the root of our tree
  const container = {
    rootChildren: [], // Will hold root TreeNode(s) when we render
  };

  // Create React's internal fiber root
  // This is React's internal data structure for tracking the component tree
  const fiberRoot = reconciler.createContainer(
    container, // Our container object
    0, // Tag: 0 = LegacyRoot (doesn't matter much for us)
    null, // Hydration callbacks (for SSR, we don't use)
    false, // isStrictMode
    null, // concurrentUpdatesByDefaultOverride
    '', // identifierPrefix
    (error, errorInfo) => {
      // Custom error handler that logs full error details
      console.error('React Error:', error);
      if (errorInfo && errorInfo.componentStack) {
        console.error('Component Stack:', errorInfo.componentStack);
      }
    },
    null // transitionCallbacks
  );

  return { container, fiberRoot };
}

/**
 * Render a React element tree into a root.
 * This triggers React's reconciliation algorithm.
 * Returns a Promise that resolves when rendering is complete.
 *
 * @param element - The React element to render (usually from JSX)
 * @param root - The root object from createRoot()
 * @returns Promise that resolves to the container
 */
export function render(element, root) {
  return new Promise((resolve) => {
    // Tell React to reconcile this element tree into our container
    reconciler.updateContainer(
      element, // The React element tree (from JSX)
      root.fiberRoot, // React's fiber root
      null, // Parent component (null for root render)
      () => {
        // This callback is called after rendering completes
        // Use setImmediate to ensure all work is flushed
        setImmediate(() => {
          resolve(root.container);
        });
      }
    );
  });
}
