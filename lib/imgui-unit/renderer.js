// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// ImGui renderer - traverses React tree and calls FFI functions
// This file must be in typed mode to use FFI

// ImGui renderer loaded

/**
 * Parse a color value to ImVec4 format.
 * Supports hex strings (#RRGGBB or #RRGGBBAA) and objects {r,g,b,a}.
 * @param outVec Pointer to ImVec4 output buffer (caller must allocate)
 * @param color Color value to parse
 */
function parseColorToImVec4(outVec: c_ptr, color: any): void {
  let r = 255, g = 255, b = 255, a = 255;

  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = hex.length > 6 ? parseInt(hex.slice(6, 8), 16) : 255;
    }
    // Invalid length - fall through with white
  } else if (typeof color === 'object' && color !== null) {
    r = +color.r;
    g = +color.g;
    b = +color.b;
    a = color.a !== undefined ? +color.a : 255;
  }

  // Check for NaN (invalid hex digits) - fall back to white
  if (isNaN(r + g + b + a)) {
    r = g = b = a = 255;
  }

  set_ImVec4_x(outVec, r * (1/255));
  set_ImVec4_y(outVec, g * (1/255));
  set_ImVec4_z(outVec, b * (1/255));
  set_ImVec4_w(outVec, a * (1/255));
}

/**
 * Parse a color value to ABGR format (used by ImGui DrawList).
 * Supports hex strings (#RRGGBB or #RRGGBBAA) and objects {r,g,b,a}.
 * Returns a 32-bit unsigned integer in ABGR format.
 */
function parseColorToABGR(color: any): number {
  const vec = allocTmp(_sizeof_ImVec4);
  parseColorToImVec4(vec, color);
  const r = Math.floor(+get_ImVec4_x(vec) * 255);
  const g = Math.floor(+get_ImVec4_y(vec) * 255);
  const b = Math.floor(+get_ImVec4_z(vec) * 255);
  const a = Math.floor(+get_ImVec4_w(vec) * 255);
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

/**
 * Validates and returns a finite number, or a default value if invalid.
 * @param value Value to validate
 * @param defaultValue Default value if invalid
 * @param propName Property name for error messages
 * @returns Valid number or default
 */
function validateNumber(value: any, defaultValue: number, propName: string): number {
  const num = +value;
  if (!Number.isFinite(num)) {
    console.error(`Invalid ${propName}: ${value} (NaN or Infinity). Using ${defaultValue}.`);
    return defaultValue;
  }
  return num;
}

/**
 * Safely invokes a callback with exception handling.
 * @param callback The callback function to invoke
 * @param args Arguments to pass to callback
 */
function safeInvokeCallback(callback, ...args) {
  if (!callback || typeof callback !== 'function') {
    return;
  }

  try {
    callback(...args);
  } catch (e) {
    console.error("Error in callback:", e);
  }
}

/**
 * Renders a window component with controlled/uncontrolled position and size.
 */
function renderWindow(node: any, vec2: c_ptr, vec4: c_ptr): void {
  const props = node.props;
  const title = (props && props.title) ? props.title : "Window";

  // Track which properties are controlled vs uncontrolled
  const hasControlledPos = props && (props.x !== undefined || props.y !== undefined);
  const hasDefaultPos = props && (props.defaultX !== undefined || props.defaultY !== undefined);
  const hasControlledSize = props && (props.width !== undefined || props.height !== undefined);
  const hasDefaultSize = props && (props.defaultWidth !== undefined || props.defaultHeight !== undefined);

  // Warn about conflicting props
  if (hasControlledPos && hasDefaultPos) {
    console.error(`Window "${title}" has both x/y and defaultX/defaultY props. Controlled props (x/y) will be used.`);
  }
  if (hasControlledSize && hasDefaultSize) {
    console.error(`Window "${title}" has both width/height and defaultWidth/defaultHeight props. Controlled props (width/height) will be used.`);
  }

  // Flags to track whether we should read from ImGui after rendering
  let shouldReadPos = false;
  let shouldReadSize = false;

  // Handle controlled position
  // Strategy: Compare current prop values against last prop values we recorded
  // - If different -> React changed it -> write to ImGui, don't read
  // - If same -> React didn't change it -> read from ImGui (user may have moved window)
  if (hasControlledPos) {
    const propX = validateNumber(props.x !== undefined ? props.x : 0, 0, "window x");
    const propY = validateNumber(props.y !== undefined ? props.y : 0, 0, "window y");

    // Check if this is first render or if React changed the position
    const isFirstRender = node._lastPropX === undefined;
    const posChanged = propX !== node._lastPropX || propY !== node._lastPropY;

    if (isFirstRender || posChanged) {
      // First render or React changed position -> write to ImGui with ImGuiCond_Always
      set_ImVec2_x(vec2, propX);
      set_ImVec2_y(vec2, propY);
      const pivot = allocTmp(_sizeof_ImVec2);
      set_ImVec2_x(pivot, 0);
      set_ImVec2_y(pivot, 0);
      _igSetNextWindowPos(vec2, _ImGuiCond_Always, pivot);

      // Update last prop values
      node._lastPropX = propX;
      node._lastPropY = propY;
    }

    // Always read back to sync with ImGui's actual state
    shouldReadPos = true;
  } else if (hasDefaultPos) {
    // Uncontrolled: set position once on first frame
    const defaultX = validateNumber(props.defaultX !== undefined ? props.defaultX : 0, 0, "window defaultX");
    const defaultY = validateNumber(props.defaultY !== undefined ? props.defaultY : 0, 0, "window defaultY");
    set_ImVec2_x(vec2, defaultX);
    set_ImVec2_y(vec2, defaultY);
    const pivot = allocTmp(_sizeof_ImVec2);
    set_ImVec2_x(pivot, 0);
    set_ImVec2_y(pivot, 0);
    _igSetNextWindowPos(vec2, _ImGuiCond_Once, pivot);
  }

  // Handle controlled size (same strategy as position)
  if (hasControlledSize) {
    const propWidth = validateNumber(props.width !== undefined ? props.width : 0, 0, "window width");
    const propHeight = validateNumber(props.height !== undefined ? props.height : 0, 0, "window height");

    // Validate positive dimensions
    if (propWidth <= 0 || propHeight <= 0) {
      console.error(`Window "${title}" has invalid size: ${propWidth}x${propHeight}. Size must be positive. Using defaults.`);
    }

    // Check if this is first render or if React changed the size
    const isFirstRender = node._lastPropWidth === undefined;
    const sizeChanged = propWidth !== node._lastPropWidth || propHeight !== node._lastPropHeight;

    if (isFirstRender || sizeChanged) {
      // First render or React changed size -> write to ImGui with ImGuiCond_Always
      if (propWidth > 0 && propHeight > 0) {
        set_ImVec2_x(vec2, propWidth);
        set_ImVec2_y(vec2, propHeight);
        _igSetNextWindowSize(vec2, _ImGuiCond_Always);
      }

      // Update last prop values
      node._lastPropWidth = propWidth;
      node._lastPropHeight = propHeight;
    }

    // Always read back to sync with ImGui's actual state
    shouldReadSize = true;
  } else if (hasDefaultSize) {
    // Uncontrolled: set size once on first frame
    const defaultWidth = validateNumber(props.defaultWidth !== undefined ? props.defaultWidth : 0, 0, "window defaultWidth");
    const defaultHeight = validateNumber(props.defaultHeight !== undefined ? props.defaultHeight : 0, 0, "window defaultHeight");
    set_ImVec2_x(vec2, defaultWidth);
    set_ImVec2_y(vec2, defaultHeight);
    _igSetNextWindowSize(vec2, _ImGuiCond_Once);
  }

  // Get window flags
  const windowFlags = (props && props.flags !== undefined) ? props.flags : 0;

  // Handle window close button via p_open parameter
  // If onClose callback exists, allocate a boolean pointer and pass it to igBegin
  // This enables the close button (X) in the window title bar
  const hasOnClose = props && props.onClose;
  const pOpen = hasOnClose ? allocTmp(_sizeof_c_bool) : c_null;

  if (hasOnClose) {
    // Initialize p_open to true (window is open)
    _sh_ptr_write_c_bool(pOpen, 0, 1);
  }

  if (_igBegin(tmpUtf8(title), pOpen, windowFlags)) {
    // Read actual state from ImGui if needed and fire callback if changed
    let stateChanged = false;
    let actualX = node._lastPropX !== undefined ? node._lastPropX : 0;
    let actualY = node._lastPropY !== undefined ? node._lastPropY : 0;
    let actualWidth = node._lastPropWidth !== undefined ? node._lastPropWidth : 0;
    let actualHeight = node._lastPropHeight !== undefined ? node._lastPropHeight : 0;

    if (shouldReadPos) {
      _igGetWindowPos(vec2);
      actualX = +get_ImVec2_x(vec2);
      actualY = +get_ImVec2_y(vec2);

      // Check if position changed (either user moved window or ImGui clamped our values)
      if (actualX !== node._lastPropX || actualY !== node._lastPropY) {
        stateChanged = true;
        node._lastPropX = actualX;
        node._lastPropY = actualY;
      }
    }

    if (shouldReadSize) {
      _igGetWindowSize(vec2);
      actualWidth = +get_ImVec2_x(vec2);
      actualHeight = +get_ImVec2_y(vec2);

      // Check if size changed (either user resized window or ImGui adjusted our values)
      if (actualWidth !== node._lastPropWidth || actualHeight !== node._lastPropHeight) {
        stateChanged = true;
        node._lastPropWidth = actualWidth;
        node._lastPropHeight = actualHeight;
      }
    }

    // Fire callback if state changed
    if (stateChanged && props && props.onWindowState) {
      safeInvokeCallback(props.onWindowState, actualX, actualY, actualWidth, actualHeight);
    }

    // Render children
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        renderNode(node.children[i]);
      }
    }
  }
  _igEnd();

  // Check if user clicked the close button
  if (hasOnClose) {
    const isStillOpen = _sh_ptr_read_c_bool(pOpen, 0);
    if (!isStillOpen) {
      // User clicked close button - invoke callback
      safeInvokeCallback(props.onClose);
    }
  }
}

/**
 * Renders a root window that covers the entire viewport.
 * This window is always fullscreen, transparent, and cannot be moved or decorated.
 */
function renderRoot(node: any, vec2: c_ptr): void {
  const viewport = _igGetMainViewport();

  // Get viewport position and size (these return pointers to ImVec2 inside viewport)
  const vpPos = get_ImGuiViewport_Pos(viewport);
  const vpSize = get_ImGuiViewport_Size(viewport);

  // Copy viewport position into our buffer and set window position
  set_ImVec2_x(vec2, +get_ImVec2_x(vpPos));
  set_ImVec2_y(vec2, +get_ImVec2_y(vpPos));
  const pivot = allocTmp(_sizeof_ImVec2);
  set_ImVec2_x(pivot, 0);
  set_ImVec2_y(pivot, 0);
  _igSetNextWindowPos(vec2, _ImGuiCond_Always, pivot);

  // Copy viewport size into our buffer and set window size
  set_ImVec2_x(vec2, +get_ImVec2_x(vpSize));
  set_ImVec2_y(vec2, +get_ImVec2_y(vpSize));
  _igSetNextWindowSize(vec2, _ImGuiCond_Always);

  // Combine required flags for root window behavior
  const rootFlags =
    _ImGuiWindowFlags_NoDecoration |
    _ImGuiWindowFlags_NoMove |
    _ImGuiWindowFlags_NoSavedSettings |
    _ImGuiWindowFlags_NoBringToFrontOnFocus |
    _ImGuiWindowFlags_NoBackground;

  if (_igBegin(tmpUtf8("##Root"), c_null, rootFlags)) {
    // Render children
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        renderNode(node.children[i]);
      }
    }
  }
  _igEnd();
}

/**
 * Renders a child window component.
 */
function renderChild(node: any, vec2: c_ptr): void {
  const props = node.props;
  const childWidth = (props && props.width !== undefined) ? +props.width : 0;
  const childHeight = (props && props.height !== undefined) ? +props.height : 0;
  const childNoPadding = (props && props.noPadding !== undefined) ? props.noPadding : false;
  const childNoScrollbar = (props && props.noScrollbar !== undefined) ? props.noScrollbar : false;

  // Build child flags
  let childFlags = 0;
  if (childNoScrollbar) {
    childFlags |= _ImGuiWindowFlags_NoScrollbar;
    childFlags |= _ImGuiWindowFlags_NoScrollWithMouse;
  }

  // Push zero padding if requested (separate allocation needed - remains live on style stack)
  if (childNoPadding) {
    const zeroPadding = allocTmp(_sizeof_ImVec2);
    set_ImVec2_x(zeroPadding, 0);
    set_ImVec2_y(zeroPadding, 0);
    _igPushStyleVar_Vec2(_ImGuiStyleVar_WindowPadding, zeroPadding);
  }

  set_ImVec2_x(vec2, childWidth);
  set_ImVec2_y(vec2, childHeight);

  if (_igBeginChild_Str(tmpUtf8("Content"), vec2, 0, childFlags)) {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        renderNode(node.children[i]);
      }
    }
  }
  _igEndChild();

  // Pop padding style if we pushed it
  if (childNoPadding) {
    _igPopStyleVar(1);
  }
}

/**
 * Renders a button component.
 */
function renderButton(node: any, vec2: c_ptr): void {
  // Concatenate all text children for button label
  let buttonText = "";
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.text !== undefined) {
        buttonText += child.text;
      } else {
        console.error(
          `<button> only supports text children. Ignoring <${child.type}>.`
        );
      }
    }
  }
  if (buttonText === "") {
    buttonText = "Button";
  }
  set_ImVec2_x(vec2, 0);
  set_ImVec2_y(vec2, 0);

  if (_igButton(tmpUtf8(buttonText), vec2)) {
    // Button was clicked - invoke callback directly
    if (node.props && node.props.onClick) {
      console.debug("Button clicked:", buttonText);
      safeInvokeCallback(node.props.onClick);
    }
  }
}

/**
 * Renders a text component.
 */
function renderText(node: any, vec4: c_ptr): void {
  // Concatenate all text children
  let text = "";
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const textChild = node.children[i];
      if (textChild.text !== undefined) {
        text += textChild.text;
      } else {
        console.error(
          `<text> only supports text children. Ignoring <${textChild.type}>.`
        );
      }
    }
  }

  const props = node.props;
  // Check for color prop
  if (props && props.color) {
    parseColorToImVec4(vec4, props.color);
    _igTextColored(vec4, tmpUtf8(text));
  } else if (props && props.disabled) {
    _igTextDisabled(tmpUtf8(text));
  } else if (props && props.wrapped) {
    _igTextWrapped(tmpUtf8(text));
  } else {
    _igText(tmpUtf8(text));
  }
}

/**
 * Renders a group component.
 */
function renderGroup(node: any): void {
  _igBeginGroup();
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      renderNode(node.children[i]);
    }
  }
  _igEndGroup();
}

/**
 * Renders a collapsing header component.
 */
function renderCollapsingHeader(node: any): void {
  const props = node.props;
  const headerTitle = (props && props.title) ? props.title : "Section";
  if (_igCollapsingHeader_TreeNodeFlags(tmpUtf8(headerTitle), 0)) {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        renderNode(node.children[i]);
      }
    }
  }
}

/**
 * Renders an indent component.
 */
function renderIndent(node: any): void {
  _igIndent(0.0);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      renderNode(node.children[i]);
    }
  }
  _igUnindent(0.0);
}

/**
 * Renders a table component.
 */
function renderTable(node: any, vec2: c_ptr): void {
  const props = node.props;
  const tableId = (props && props.id) ? props.id : "table";
  const columnCount = (props && props.columns !== undefined) ? +props.columns : 1;

  if (+columnCount <= 0) {
    console.error(
      `<table> requires a positive 'columns' prop. Got: columns=${columnCount}. Skipping table.`
    );
    return;
  }

  const tableFlags = (props && props.flags !== undefined) ? props.flags : _ImGuiTableFlags_Resizable;
  set_ImVec2_x(vec2, 0);
  set_ImVec2_y(vec2, 0);

  if (_igBeginTable(tmpUtf8(tableId), columnCount, tableFlags, vec2, 0)) {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        renderNode(node.children[i]);
      }
    }
    _igEndTable();
  }
}

/**
 * Renders a table row component.
 */
function renderTableRow(node: any): void {
  const props = node.props;
  const rowFlags = (props && props.flags !== undefined) ? props.flags : 0;
  const minHeight = (props && props.minHeight !== undefined) ? props.minHeight : 0;
  _igTableNextRow(rowFlags, minHeight);

  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      renderNode(node.children[i]);
    }
  }
}

/**
 * Renders a table cell component.
 */
function renderTableCell(node: any): void {
  const props = node.props;
  const colIndex = (props && props.index !== undefined) ? props.index : 0;
  _igTableSetColumnIndex(colIndex);

  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      renderNode(node.children[i]);
    }
  }
}

/**
 * Renders a table column setup.
 */
function renderTableColumn(node: any): void {
  const props = node.props;
  const colLabel = (props && props.label) ? props.label : "";
  const colFlags = (props && props.flags !== undefined) ? props.flags : _ImGuiTableColumnFlags_None;
  const colWidth = (props && props.width !== undefined) ? props.width : 0;
  _igTableSetupColumn(tmpUtf8(colLabel), colFlags, colWidth, 0);
}

/**
 * Renders a rectangle component.
 */
function renderRect(node: any, vec2: c_ptr): void {
  const props = node.props;
  const drawList = _igGetWindowDrawList();
  const rectX = validateNumber((props && props.x !== undefined) ? props.x : 0, 0, "rect x");
  const rectY = validateNumber((props && props.y !== undefined) ? props.y : 0, 0, "rect y");
  const rectWidth = validateNumber((props && props.width !== undefined) ? props.width : 100, 100, "rect width");
  const rectHeight = validateNumber((props && props.height !== undefined) ? props.height : 100, 100, "rect height");
  const rectFilled = (props && props.filled !== undefined) ? props.filled : true;

  // Get window cursor position (top-left of content area)
  _igGetCursorScreenPos(vec2);
  const winX = +get_ImVec2_x(vec2);
  const winY = +get_ImVec2_y(vec2);

  // Calculate absolute screen coordinates
  set_ImVec2_x(vec2, winX + rectX);
  set_ImVec2_y(vec2, winY + rectY);

  const rectMax = allocTmp(_sizeof_ImVec2);
  set_ImVec2_x(rectMax, winX + rectX + rectWidth);
  set_ImVec2_y(rectMax, winY + rectY + rectHeight);

  // Parse color (default: white)
  const rectColor = (props && props.color)
    ? parseColorToABGR(props.color)
    : 0xFFFFFFFF;

  if (rectFilled) {
    _ImDrawList_AddRectFilled(drawList, vec2, rectMax, rectColor, 0.0, 0);
  } else {
    _ImDrawList_AddRect(drawList, vec2, rectMax, rectColor, 0.0, 0, 1.0);
  }
}

/**
 * Renders a circle component.
 */
function renderCircle(node: any, vec2: c_ptr): void {
  const props = node.props;
  const circleDrawList = _igGetWindowDrawList();
  const circleX = validateNumber((props && props.x !== undefined) ? props.x : 50, 50, "circle x");
  const circleY = validateNumber((props && props.y !== undefined) ? props.y : 50, 50, "circle y");
  const circleRadius = validateNumber((props && props.radius !== undefined) ? props.radius : 10, 10, "circle radius");
  const circleFilled = (props && props.filled !== undefined) ? props.filled : true;
  const circleSegments = validateNumber((props && props.segments !== undefined) ? props.segments : 12, 12, "circle segments");

  // Get window cursor position
  _igGetCursorScreenPos(vec2);
  const circleWinX = +get_ImVec2_x(vec2);
  const circleWinY = +get_ImVec2_y(vec2);

  // Calculate absolute center position
  set_ImVec2_x(vec2, circleWinX + circleX);
  set_ImVec2_y(vec2, circleWinY + circleY);

  // Parse color (default: white)
  const circleColor = (props && props.color)
    ? parseColorToABGR(props.color)
    : 0xFFFFFFFF;

  if (circleFilled) {
    _ImDrawList_AddCircleFilled(circleDrawList, vec2, circleRadius, circleColor, circleSegments);
  } else {
    _ImDrawList_AddCircle(circleDrawList, vec2, circleRadius, circleColor, circleSegments, 1.0);
  }
}

// Tree traversal and rendering
function renderNode(node: any): void {
  if (!node) return;

  // Push this node's unique ID onto ImGui's ID stack.
  // This ensures each TreeNode instance gets a stable ImGui ID for its lifetime.
  // React maintains TreeNode identity across renders, so the ID remains stable.
  // Use try/finally to guarantee PopID is called even if rendering throws.
  _igPushID_Int(node.id);

  try {
    // Handle text nodes
    if (node.text !== undefined) {
      _igText(tmpUtf8(node.text));
      return;
    }

    // Reusable buffers for ImVec2 and ImVec4 to reduce allocations
    const vec2 = allocTmp(_sizeof_ImVec2);
    const vec4 = allocTmp(_sizeof_ImVec4);

    // Handle component nodes by delegating to specific render functions
    switch (node.type) {
    case "root":
      renderRoot(node, vec2);
      break;

    case "window":
      renderWindow(node, vec2, vec4);
      break;

    case "child":
      renderChild(node, vec2);
      break;

    case "button":
      renderButton(node, vec2);
      break;

    case "text":
      renderText(node, vec4);
      break;

    case "group":
      renderGroup(node);
      break;

    case "separator":
      _igSeparator();
      break;

    case "sameline":
      _igSameLine(0.0, -1.0);
      break;

    case "indent":
      renderIndent(node);
      break;

    case "collapsingheader":
      renderCollapsingHeader(node);
      break;

    case "table":
      renderTable(node, vec2);
      break;

    case "tableheader":
      _igTableHeadersRow();
      break;

    case "tablerow":
      renderTableRow(node);
      break;

    case "tablecell":
      renderTableCell(node);
      break;

    case "tablecolumn":
      renderTableColumn(node);
      break;

    case "rect":
      renderRect(node, vec2);
      break;

    case "circle":
      renderCircle(node, vec2);
      break;

    default:
      // Unknown type - just render children
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          renderNode(node.children[i]);
        }
      }
      break;
    }
  } finally {
    // Always pop the ID we pushed, even if an exception occurred
    _igPopID();
  }
}

// Export render function
globalThis.imguiUnit = {
  renderTree: function(): void {
    const reactApp = globalThis.reactApp;
    if (reactApp && reactApp.rootChildren) {
      // Validate that only one root component exists
      let rootCount = 0;
      for (let i = 0; i < reactApp.rootChildren.length; i++) {
        if (reactApp.rootChildren[i].type === 'root') {
          rootCount++;
        }
      }

      if (rootCount > 1) {
        console.error(`Multiple <root> components detected (${rootCount}). Only one <root> component is allowed.`);
      }

      // Render all root children (supports fragments with multiple windows)
      for (let i = 0; i < reactApp.rootChildren.length; i++) {
        renderNode(reactApp.rootChildren[i]);
      }
    }
  },

  onTreeUpdate: function(): void {
    // Called by React unit when tree is updated
    // Could do something here if needed
  }
};
