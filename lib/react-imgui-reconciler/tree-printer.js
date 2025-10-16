// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

/**
 * Pretty-print the tree structure to console.
 * This lets us visualize what React built.
 */

/**
 * Print the entire tree from a container.
 *
 * @param container - The container object from render()
 * @param indent - Starting indentation level (default 0)
 */
export function printTree(container, indent = 0) {
  console.log('\n=== Tree Structure ===');

  if (!container.rootNode) {
    console.log('(empty tree)');
    return;
  }

  printNode(container.rootNode, indent);
  console.log('======================\n');
}

/**
 * Recursively print a node and its children.
 *
 * @param node - TreeNode or TextNode to print
 * @param indent - Current indentation level
 */
function printNode(node, indent) {
  const spaces = '  '.repeat(indent);

  if (node.text !== undefined) {
    // Text node
    console.log(`${spaces}"${node.text}"`);
  } else {
    // Element node
    const propsStr = formatProps(node.props);
    console.log(`${spaces}<${node.type}${propsStr}>`);

    // Print children
    for (const child of node.children) {
      printNode(child, indent + 1);
    }
  }
}

/**
 * Format props object as a string for display.
 *
 * @param props - Props object
 * @returns Formatted string like ' title="Hello" count="5"'
 */
function formatProps(props) {
  if (!props || Object.keys(props).length === 0) {
    return '';
  }

  const parts = [];
  for (const [key, value] of Object.entries(props)) {
    // Skip children prop - it's handled separately
    if (key === 'children') continue;

    // Format the value
    let valueStr;
    if (typeof value === 'function') {
      valueStr = '[Function]';
    } else if (typeof value === 'object') {
      valueStr = JSON.stringify(value);
    } else {
      valueStr = String(value);
    }

    parts.push(`${key}="${valueStr}"`);
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}
