// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

/**
 * Global counter for assigning unique IDs to TreeNodes.
 * Each TreeNode gets a unique ID that persists for its lifetime,
 * which is used by ImGui's ID stack for widget identity.
 */
let nextNodeId = 1;

/**
 * TreeNode represents a component instance in our tree.
 * This is what React creates and manipulates through our host config.
 */
export class TreeNode {
  constructor(type, props) {
    this.id = nextNodeId++; // Unique ID for ImGui ID stack
    this.type = type; // Component type like "Window", "Button", etc.
    this.props = props; // Props object passed to the component
    this.children = []; // Array of child TreeNodes or TextNodes
    this.parent = null; // Parent TreeNode (for debugging/traversal)
  }
}

/**
 * TextNode represents text content in our tree.
 * React treats text as a special type of child.
 */
export class TextNode {
  constructor(text) {
    this.id = nextNodeId++; // Unique ID for ImGui ID stack
    this.text = text; // The text content
    this.parent = null; // Parent TreeNode
  }
}
