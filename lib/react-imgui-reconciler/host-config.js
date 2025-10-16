// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

import { TreeNode, TextNode } from './tree-node.js';

// React host config loaded

/**
 * Host Config for React Reconciler
 *
 * This object tells React how to interact with our "host" platform.
 * In our case, the platform is just an in-memory tree structure,
 * but eventually this will call ImGUI functions.
 *
 * React calls these methods during reconciliation to build and update the tree.
 */

const hostConfig = {
  //
  // Core creation methods
  //

  /**
   * Create an instance of a component.
   * Called when React creates a new element like <Window /> or <Button />.
   *
   * @param type - The component type string (e.g., "Window", "Button")
   * @param props - The props object
   * @param rootContainer - The root container
   * @param hostContext - Context from parent (we don't use this yet)
   * @param internalHandle - React's internal fiber node
   * @returns A new TreeNode instance
   */
  createInstance(type, props, rootContainer, hostContext, internalHandle) {
    console.debug(`createInstance: ${type}`, props && props.title ? `title="${props.title}"` : '');
    return new TreeNode(type, props);
  },

  /**
   * Create a text node.
   * Called when React encounters text content like "Hello World".
   *
   * @param text - The text content
   * @param rootContainer - The root container
   * @param hostContext - Context from parent
   * @param internalHandle - React's internal fiber node
   * @returns A new TextNode instance
   */
  createTextInstance(text, rootContainer, hostContext, internalHandle) {
    console.debug(`createTextInstance: "${text}"`);
    return new TextNode(text);
  },

  //
  // Tree manipulation methods
  //

  /**
   * Append a child to a parent node during initial creation (before commit).
   * Called during the render phase when building the tree.
   *
   * @param parent - The parent TreeNode
   * @param child - The child TreeNode or TextNode
   */
  appendInitialChild(parent, child) {
    console.debug(`appendInitialChild: ${parent.type} <- ${child.type || `"${child.text}"`}`);
    parent.children.push(child);
    child.parent = parent;
  },

  /**
   * Append a child to a parent node.
   * Called during updates after initial mount.
   *
   * @param parent - The parent TreeNode
   * @param child - The child TreeNode or TextNode
   */
  appendChild(parent, child) {
    console.debug(`appendChild: ${parent.type} <- ${child.type || `"${child.text}"`}`);
    parent.children.push(child);
    child.parent = parent;
  },

  /**
   * Append a child to the root container.
   * Called when mounting the top-level component.
   *
   * @param container - The root container object
   * @param child - The root TreeNode
   */
  appendChildToContainer(container, child) {
    console.debug(`appendChildToContainer: root <- ${child.type}`);
    if (!container.rootChildren) {
      container.rootChildren = [];
    }
    container.rootChildren.push(child);
    child.parent = null; // Root has no parent
  },

  /**
   * Remove a child from a parent node.
   * Called when React unmounts a component.
   *
   * @param parent - The parent TreeNode
   * @param child - The child to remove
   */
  removeChild(parent, child) {
    console.debug(`removeChild: ${parent.type} -> ${child.type || `"${child.text}"`}`);
    const index = parent.children.indexOf(child);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
    child.parent = null;
  },

  /**
   * Remove a child from the root container.
   * Called when unmounting the root component.
   *
   * @param container - The root container object
   * @param child - The child to remove
   */
  removeChildFromContainer(container, child) {
    console.debug(`removeChildFromContainer: root -> ${child.type}`);
    if (container.rootChildren) {
      const index = container.rootChildren.indexOf(child);
      if (index !== -1) {
        container.rootChildren.splice(index, 1);
      } else {
        console.error(`removeChildFromContainer: child not found in rootChildren!`, { child: child.type });
      }
    }
    child.parent = null;
  },

  /**
   * Insert a child before another child.
   * Called when React needs to insert a node at a specific position.
   *
   * @param parent - The parent TreeNode
   * @param child - The child to insert
   * @param beforeChild - The child to insert before
   */
  insertBefore(parent, child, beforeChild) {
    console.debug(
      `insertBefore: ${parent.type} <- ${child.type || `"${child.text}"`} before ${beforeChild.type || `"${beforeChild.text}"`}`
    );
    const index = parent.children.indexOf(beforeChild);
    if (index === -1) {
      // This should never happen - it indicates a bug in React or our reconciler
      console.error(
        `insertBefore: beforeChild not found in parent! Appending instead.`,
        {
          parent: parent.type,
          child: child.type || child.text,
          beforeChild: beforeChild.type || beforeChild.text
        }
      );
      parent.children.push(child);
    } else {
      parent.children.splice(index, 0, child);
    }
    child.parent = parent;
  },

  /**
   * Insert a child before another child in the root container.
   * Called when React needs to reorder root children.
   *
   * @param container - The root container object
   * @param child - The child to insert
   * @param beforeChild - The child to insert before
   */
  insertInContainerBefore(container, child, beforeChild) {
    console.debug(`insertInContainerBefore: root <- ${child.type} before ${beforeChild.type}`);
    if (!container.rootChildren) {
      container.rootChildren = [];
    }
    const index = container.rootChildren.indexOf(beforeChild);
    if (index !== -1) {
      container.rootChildren.splice(index, 0, child);
    } else {
      // If beforeChild not found, append (should never happen - indicates a bug)
      console.error(
        `insertInContainerBefore: beforeChild not found in rootChildren! Appending instead.`,
        { beforeChild: beforeChild.type }
      );
      container.rootChildren.push(child);
    }
    child.parent = null;
  },

  //
  // Update methods
  //

  /**
   * Prepare an update for a component.
   * Called when props change. Returns an "update payload" that describes what changed.
   * If this returns null, commitUpdate won't be called.
   *
   * For simplicity, we return true whenever props changed (indicating update needed).
   *
   * Note: This uses referential equality (===) for prop comparison, which means
   * inline arrow functions will always trigger updates. To optimize, use useCallback
   * or define handlers outside the render function.
   *
   * @param instance - The TreeNode instance
   * @param type - The component type
   * @param oldProps - Previous props
   * @param newProps - New props
   * @returns Update payload (we just return true) or null for no update
   */
  prepareUpdate(instance, type, oldProps, newProps, rootContainer, hostContext) {
    // Only update if props actually changed
    // Check if the props objects are different (shallow comparison)
    if (oldProps === newProps) {
      return null; // No update needed
    }

    // Handle null/undefined edge cases
    if (!oldProps && !newProps) return null;
    if (!oldProps || !newProps) return true;

    // Get keys from both objects
    const oldKeys = Object.keys(oldProps);
    const newKeys = Object.keys(newProps);

    // Quick check: different number of props
    if (oldKeys.length !== newKeys.length) {
      return true; // Different number of props
    }

    // Check if all keys in newProps exist in oldProps and have same values
    for (const key of newKeys) {
      if (!(key in oldProps) || oldProps[key] !== newProps[key]) {
        return true; // Prop added, removed, or value changed
      }
    }

    return null; // No changes detected
  },

  /**
   * Commit an update to a component.
   * Called after prepareUpdate returns a non-null payload.
   * This is where we actually apply the prop changes.
   *
   * @param instance - The TreeNode instance
   * @param type - The component type
   * @param oldProps - Previous props
   * @param newProps - New props
   * @param internalHandle - React's internal fiber node
   */
  commitUpdate(instance, type, oldProps, newProps, internalHandle) {
    console.debug(`commitUpdate: ${type}`,
                'oldProps.title:', oldProps && oldProps.title,
                'newProps.title:', newProps && newProps.title);
    // Update the instance's props
    instance.props = newProps;
  },

  /**
   * Commit a text update.
   * Called when text content changes.
   *
   * @param textInstance - The TextNode instance
   * @param oldText - Previous text
   * @param newText - New text
   */
  commitTextUpdate(textInstance, oldText, newText) {
    console.debug(`commitTextUpdate: "${oldText}" -> "${newText}"`);
    textInstance.text = newText;
  },

  //
  // Finalization methods
  //

  /**
   * Finalize initial children after instance creation.
   * Called after createInstance. Can return true to trigger commitMount.
   * We don't need to do anything here.
   *
   * @returns false (we don't need commitMount)
   */
  finalizeInitialChildren(instance, type, props, rootContainer, hostContext) {
    // Return false means we don't need commitMount to be called
    return false;
  },

  //
  // Context methods
  //

  /**
   * Get the root host context.
   * Context is passed down the tree and can be used to track things like
   * namespace in HTML renderers. We don't need it yet.
   *
   * @returns Root context (empty object for us)
   */
  getRootHostContext(rootContainer) {
    return {};
  },

  /**
   * Get child host context from parent context.
   * Called when traversing down the tree.
   *
   * @param parentContext - Parent's context
   * @param type - Child component type
   * @returns Child context (same as parent for us)
   */
  getChildHostContext(parentContext, type, rootContainer) {
    return parentContext;
  },

  //
  // Scheduling and lifecycle
  //

  /**
   * Should set text content instead of creating text nodes.
   * Return true if this component type should have its text content set directly
   * instead of creating child text nodes. We always use text nodes.
   *
   * @returns false (we always use text nodes)
   */
  shouldSetTextContent(type, props) {
    return false;
  },

  /**
   * Get the public instance exposed to refs.
   * We just return the instance itself.
   *
   * @param instance - The TreeNode
   * @returns The instance itself
   */
  getPublicInstance(instance) {
    return instance;
  },

  /**
   * Prepare for commit phase.
   * Called before React commits (applies) changes.
   * Can return an object that's passed to resetAfterCommit.
   *
   * @returns null (we don't need to track anything)
   */
  prepareForCommit(containerInfo) {
    return null;
  },

  /**
   * Reset after commit phase.
   * Called after React commits changes. Can be used to restore state.
   * This syncs our tree to globalThis so the ImGui renderer can access it.
   */
  resetAfterCommit(containerInfo) {
    // Update global reference after every reconciliation
    if (globalThis.reactApp) {
      globalThis.reactApp.rootChildren = containerInfo.rootChildren || [];
    }
  },

  /**
   * Prepare the portal mount target.
   * Portals allow rendering into different parts of the tree.
   * We don't support portals yet.
   */
  preparePortalMount(containerInfo) {
    // No-op
  },

  /**
   * Schedule a timeout (for concurrent features).
   * Map to regular setTimeout.
   */
  scheduleTimeout: setTimeout,

  /**
   * Cancel a timeout (for concurrent features).
   * Map to regular clearTimeout.
   */
  cancelTimeout: clearTimeout,

  /**
   * Get current time (for concurrent features).
   * Map to regular performance.now() or Date.now().
   */
  noTimeout: -1,

  /**
   * Is this renderer primary (for concurrent features).
   * False means we won't be used for scheduling.
   */
  isPrimaryRenderer: false,

  /**
   * Does this renderer support mutation (vs persistence).
   * True means we mutate nodes in place (appendChild, removeChild, etc.).
   * False would mean we return new trees on every change.
   */
  supportsMutation: true,

  /**
   * Does this renderer support persistence.
   * False since we use mutation.
   */
  supportsPersistence: false,

  /**
   * Does this renderer support hydration (SSR).
   * False since we don't do server-side rendering.
   */
  supportsHydration: false,

  //
  // Methods we don't need (stubs)
  //

  getCurrentEventPriority() {
    return 16; // DefaultEventPriority constant from React
  },

  resolveUpdatePriority() {
    return 16; // DefaultEventPriority
  },

  getCurrentUpdatePriority() {
    return 0; // NoEventPriority - no specific priority
  },

  setCurrentUpdatePriority(priority) {
    // No-op - we don't track priority
  },

  resolveEventTimeStamp() {
    return Date.now();
  },

  resolveEventType() {
    return null; // No specific event type for programmatic updates
  },

  getInstanceFromNode() {
    return null;
  },

  beforeActiveInstanceBlur() {
    // No-op
  },

  afterActiveInstanceBlur() {
    // No-op
  },

  prepareScopeUpdate() {
    // No-op
  },

  getInstanceFromScope() {
    return null;
  },

  detachDeletedInstance() {
    // No-op
  },

  clearContainer(container) {
    console.debug('clearContainer');
    container.rootChildren = [];
  },

  trackSchedulerEvent() {
    // No-op - for React DevTools profiling
  },
};

export default hostConfig;
