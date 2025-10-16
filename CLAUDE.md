# React Reconciler for DearImGUI

## IMPORTANT: Keeping This Document Updated

**⚠️ CRITICAL: This document (CLAUDE.md) must be kept up-to-date whenever you make changes to the project.**

When modifying the project structure, build system, architecture, or implementation details, you MUST update the relevant sections of this document immediately. This ensures:
- Accurate context for future development sessions
- Proper documentation of architectural decisions
- Clear understanding of how the system works

Always update CLAUDE.md as part of your work - do not defer documentation updates.

## Project Overview

This project implements a custom React reconciler that renders to DearImGUI using Static Hermes. The goal is to use React's declarative component model and JSX syntax to describe ImGUI interfaces, while learning how React works internally.

## Implementation

Full ImGUI integration using Static Hermes FFI:
- Complete C++/JavaScript bridge with zero-overhead FFI
- Real-time rendering with Sokol + DearImGUI
- Auto-generated ImGUI bindings (500KB+ of FFI declarations)
- Compiled to native code for maximum performance
- See [llm.md](llm.md) for detailed architecture documentation

## Project Structure

### Directory Layout

```
guireact/
├── lib/                          # Reusable library code
│   ├── jslib-unit/              # Event loop and runtime polyfills
│   ├── imgui-unit/              # ImGui FFI bindings and renderer
│   ├── imgui-runtime/           # C++ runtime infrastructure
│   └── react-imgui-reconciler/  # Custom React reconciler
├── examples/                    # Example applications
│   └── showcase/                # Main showcase application
│       ├── *.jsx                # React application components
│       ├── index.js             # React app entry point
│       └── showcase.cpp         # C++ application entry point
└── external/                    # Third-party native libraries

```

### Component Overview

**Library Components (lib/):**
- **jslib-unit**: Event loop, timers, console polyfills (compiled once)
- **imgui-unit**: FFI bindings, renderer (compiled once)
- **imgui-runtime**: C++ runtime, Hermes integration, Sokol lifecycle
- **react-imgui-reconciler**: Custom React reconciler (bundled with app)

**Example Applications (examples/):**
- **showcase/**: Main showcase application
  - React application components (JSX files)
  - **showcase.cpp**: Application entry point

## Three-Unit Architecture (jslib + React + ImGUI)

We've implemented a three-unit architecture to work around Static Hermes's typed/untyped code separation and provide a proper event loop:

1. ✅ React reconciler building component tree
2. ✅ ImGUI demo with Static Hermes FFI
3. ✅ Three-unit architecture with jslib, React, and ImGUI separated
4. ✅ Event loop with setTimeout/setImmediate and microtask support
5. ✅ Application compiles, links, and runs
6. ✅ **Rendering is functional! React components rendering to ImGui successfully**

## Three-Unit Architecture

### The Challenge
Static Hermes has two compilation modes that cannot be mixed in a single unit:
- **Untyped mode**: Standard JavaScript (React, react-reconciler, our app code)
- **Typed mode**: Type-annotated code with zero-cost FFI (required for ImGUI bindings)

### The Solution: Separate Compilation Units

We split the implementation into three separate units that communicate via `globalThis`:

#### **Unit 1: jslib Unit (Untyped)**
**Location:** `lib/jslib-unit/`

**Contains:**
- Event loop implementation (setTimeout, setImmediate, clearTimeout, clearImmediate)
- Task queue management with deadline-based scheduling
- Helper functions for C++ integration (peek, run)
- Console polyfills (console.log → print)
- Process environment polyfills (process.env.NODE_ENV = 'production')

**Build Process:**
- Built in lib/jslib-unit/ with its own CMakeLists.txt
- shermes compiles directly → `jslib-unit.o` (untyped, `-Xes6-block-scoping`)
- Compiled once, reused across builds

**What it does:**
- Provides browser-like timer APIs (setTimeout, setImmediate)
- Manages macrotask queue sorted by deadline
- Exposes helper functions to C++ for event loop integration:
  ```javascript
  {
    peek: () => deadline,  // Returns next task deadline or -1
    run: (currentTime) => {}  // Executes tasks ready at currentTime
  }
  ```
- Loaded **first** so all other units have access to timers

#### **Unit 2: React Unit (Untyped)**
**Location:** `examples/*/` (app code) + `lib/react-imgui-reconciler/` (reconciler library)

**Contains:**
- React library (19.2.0) - from npm, production mode
- react-reconciler (0.33.0) - from npm
- Custom reconciler (lib/react-imgui-reconciler/):
  - tree-node.js - TreeNode and TextNode data structures
  - host-config.js - React reconciler host configuration
  - reconciler.js - Reconciler instance and render API
  - tree-printer.js - Debug utility for printing tree
- Application code (examples/showcase/):
  - app.jsx, StockTable.jsx, BouncingBall.jsx
  - index.js - Entry point

**Build Process:**
1. esbuild bundles: React + react-reconciler + custom reconciler + app code
   - Transpiles JSX → JavaScript
   - Resolves 'react-imgui-reconciler' alias to lib/react-imgui-reconciler/
   - Bundles to IIFE format → `react-unit-bundle.js` (in build directory)
2. Compilation modes (configured via REACT_BUNDLE_MODE):
   - Mode 0: shermes native compilation → `react-unit.o` (slowest build, fastest runtime)
   - Mode 1: hermes bytecode → `react-unit-bundle.hbc` (medium build/runtime)
   - Mode 2: Source bundle only (fastest build, slowest runtime, default for Debug)

**What it does:**
- Builds and maintains component tree as plain JS objects
- Handles React reconciliation (diffing, updates)
- Exposes tree via `globalThis.reactApp`:
  ```javascript
  globalThis.reactApp = {
    rootChildren: [],         // Array of root TreeNodes (supports Fragments)
    render: () => {},         // Trigger React render
  };
  ```

#### **Unit 3: ImGui Unit (Typed)**
**Location:** `lib/imgui-unit/`

**Contains:**
- FFI bindings (`js_externs.js` - 500KB of auto-generated declarations)
- FFI helpers (`ffi_helpers.js`, `ffi_helpers.h`, `asciiz.js`)
- Sokol constants (`sapp.js`)
- ImGui renderer (`renderer.js`)
- Main entry points (`main.js`)

**Build Process:**
- Built in lib/imgui-unit/ with its own CMakeLists.txt
- shermes compiles directly → `imgui-unit.o` (typed mode, `-typed`)
- Compiled once, reused across builds

**What it does:**
- Configures Sokol app (window size, title) via `glue_configure_sapp()`
- Provides `on_init`, `on_frame`, `on_event` callbacks
- Traverses React tree from `globalThis.reactApp.rootNode`
- Calls ImGui FFI functions to render each node
- Zero-cost FFI calls to C functions

**Rendering Logic:**
```javascript
function renderNode(node) {
  switch(node.type) {
    case "Window":
      if (_igBegin(tmpAsciiz(node.props.title), c_null, 0)) {
        for (const child of node.children) {
          renderNode(child);
        }
      }
      _igEnd();
      break;

    case "Text":
      _igText(tmpAsciiz(node.children[0].text));
      break;
  }
}
```

### Communication Between Units

Units communicate through `globalThis`:

```
React Unit (Untyped)                ImGui Unit (Typed)
─────────────────────              ──────────────────
                                          │
globalThis.reactApp.render() ─────────┐  │
                                       │  │
React reconciliation                   │  │
     ↓                                 │  │
Build tree in memory                   │  │
     ↓                                 │  │
globalThis.reactApp.rootNode ──────────────→ Read tree
                                       │     │
                                       │     ↓
                                       │  Traverse tree
                                       │     ↓
                                       │  Call ImGui FFI
                                       │     ↓
                                       │  Render to screen
                                       │
globalThis.imguiUnit.onTreeUpdate() ←─┘
```

### C++ Runtime Infrastructure (lib/imgui-runtime/)

The imgui-runtime library provides the C++ infrastructure for integrating Hermes, Sokol, and ImGui:

**Components:**
- **imgui-runtime.cpp/h**: Core runtime management
  - Hermes runtime initialization with microtask queue
  - Event loop integration with Sokol
  - Unit loading and lifecycle management
  - `performance.now()` host function
  - Image loading utilities
- **MappedFileBuffer.cpp/h**: Memory-mapped file loading
  - Efficient loading of React bundles/bytecode
  - Zero-copy file access via mmap
  - Used for modes 1 (bytecode) and 2 (source)

**Application Entry Point (examples/showcase/showcase.cpp):**
Applications implement `imgui_main()` to load React bundles:
```cpp
void imgui_main(int argc, char *argv[],
                facebook::hermes::HermesRuntime *hermes) {
  // Load React unit based on REACT_BUNDLE_MODE
  #if REACT_BUNDLE_MODE == 0
    hermes->evaluateSHUnit(sh_export_react);  // Native code
  #elif REACT_BUNDLE_MODE == 1
    auto buffer = mapFileBuffer(REACT_BUNDLE_PATH, false);
    hermes->evaluateJavaScript(buffer, "react-unit-bundle.hbc");  // Bytecode
  #elif REACT_BUNDLE_MODE == 2
    auto buffer = mapFileBuffer(REACT_BUNDLE_PATH, true);
    hermes->evaluateJavaScript(buffer, "react-unit-bundle.js");  // Source
  #endif
}
```

**Event Loop Integration:**
- `app_frame()` runs ready macrotasks before rendering each frame
- Each event (`app_event()`) drains microtask queue after execution
- Timer events emulated via frame callback (Sokol has no native timer events)
- Browser-like semantics: events are macrotasks, Promises are microtasks

### Build System (CMake)

**Hermes Build Integration (cmake/HermesExternal.cmake):**
Hermes is automatically cloned and built as part of the CMake build using `ExternalProject_Add`:
- **Automatic Git Clone**: Hermes is cloned from GitHub at configure time
- **Configurable Version**: Set via `HERMES_GIT_TAG` (default: specific commit hash)
  - Can be a commit hash, branch name, or tag
  - Example: `cmake -B build -DHERMES_GIT_TAG=abc123def`
- **Always Release Mode**: Hermes always builds in Release mode regardless of parent project build type
- **Per-Config Isolation**: Each build configuration gets its own Hermes clone
  - Debug: `cmake-build-debug/hermes-src/` (source) + `cmake-build-debug/hermes/` (build)
  - Release: `cmake-build-release/hermes-src/` (source) + `cmake-build-release/hermes/` (build)
- **No Manual Setup**: Users don't need to manually build or specify HERMES_BUILD/HERMES_SRC paths
- **Static vs Shared Linking**:
  - Release builds: Link statically against `hermesvm_a`, `jsi`, and `boost_context` for optimal performance
  - Debug builds: Link dynamically against `hermesvm` shared library for faster build times
- **Transitive Dependencies**: All Hermes libraries are linked through `imgui-runtime`, not directly by application targets

**Root CMakeLists.txt:**
- Includes cmake/HermesExternal.cmake to set up Hermes automatically
- Sets REACT_BUNDLE_MODE (0=native, 1=bytecode, 2=source)
- Defines RECONCILER_FILES glob to automatically collect all *.js files from lib/react-imgui-reconciler/
- Includes external/, lib/, and examples/ subdirectories

**Automatic Dependency Tracking:**
- Uses `file(GLOB ... CONFIGURE_DEPENDS)` to automatically detect new/removed files
- RECONCILER_FILES defined at root level, reusable by all apps
- Each app defines APP_FILES to collect its own *.jsx and *.js files
- No manual CMakeLists.txt updates needed when adding React components

**Library Units (lib/):**
Each unit has its own CMakeLists.txt and builds to a static library:

```cmake
# lib/jslib-unit/CMakeLists.txt
add_custom_command(OUTPUT jslib-unit.o
    COMMAND ${SHERMES} -Xes6-block-scoping --exported-unit=jslib -c jslib.js
    ...
)
add_library(jslib-unit STATIC jslib-unit.o)

# lib/imgui-unit/CMakeLists.txt
add_custom_command(OUTPUT imgui-unit.o
    COMMAND ${SHERMES} -typed --exported-unit=imgui -c
        ffi_helpers.js asciiz.js sapp.js js_externs.js renderer.js main.js
    ...
)
add_library(imgui-unit STATIC imgui-unit.o)

# lib/imgui-runtime/CMakeLists.txt
add_library(imgui-runtime STATIC
    imgui-runtime.cpp
    MappedFileBuffer.cpp
)
target_link_libraries(imgui-runtime sokol stb cimgui jslib-unit imgui-unit)
```

**React+ImGui Applications:**
Building React applications is now extremely simple with the `add_react_imgui_app()` function:

```cmake
# examples/showcase/CMakeLists.txt - Just 5 lines!
add_react_imgui_app(
    TARGET showcase
    ENTRY_POINT index.js
    SOURCES showcase.cpp
)
```

The function automatically:
- Collects all `*.jsx` and `*.js` files in the current directory
- Bundles with esbuild (JSX transpilation, module resolution)
- Compiles based on REACT_BUNDLE_MODE (native/bytecode/source)
- Creates the executable with proper definitions and linking
- Links against imgui-runtime and Hermes libraries

This replaces what was previously 80+ lines of boilerplate CMake code.

## Current Status

**What works:**
- ✅ Three-unit architecture compiles successfully
- ✅ jslib unit provides setTimeout/setImmediate with event loop
- ✅ React unit bundles with esbuild (JSX transpiled, modules bundled)
- ✅ ImGui unit compiles in typed mode with FFI
- ✅ All three units link into single executable
- ✅ C++ bridge loads all units in correct order (jslib → react → imgui)
- ✅ Event loop integrated with Sokol frame callbacks
- ✅ Microtask queue enabled for Promise support
- ✅ Application window appears and responds to quit command
- ✅ Console logging (console.log, console.error, console.debug)
- ✅ **React reconciler builds component tree successfully**
- ✅ **ImGui rendering from React tree works!**
- ✅ **React components rendering to screen**
- ✅ **React state updates (useState) working correctly**
- ✅ **Button clicks and event handling functional**
- ✅ **Window positioning with x/y props**
- ✅ **Multiple independent windows with separate state**

**Implemented Components:**
- `<window>` - ImGui window with title, optional positioning, and close button support
  - Props: `title`, `x`, `y`, `width`, `height`, `defaultX`, `defaultY`, `defaultWidth`, `defaultHeight`, `flags`, `onWindowState`, `onClose`
  - `onClose` callback enables the close button (X) in title bar and is called when user clicks it
- `<text>` - Text rendering with optional color prop
- `<button>` - Clickable buttons with onClick handlers
- `<separator>` - Horizontal separator line
- `<sameline>` - Places next item on same line
- `<group>` - Visual grouping of elements
- `<indent>` - Indented section
- `<collapsingheader>` - Collapsible header section

**Example React Component:**
```jsx
// examples/showcase/app.jsx
export function App() {
  const [counter, setCounter] = useState(0);

  return (
    <>
      <window title="Hello from React!" x={20} y={20}>
        <text>React + ImGui working perfectly!</text>
        <button onClick={() => setCounter(counter + 1)}>
          Click me!
        </button>
        <text>Button clicked {counter} times</text>
      </window>

      <window title="Second Window" x={400} y={20}>
        <text color="#00FFFF">Multiple windows supported!</text>
      </window>
    </>
  );
}
```

**Dynamic Window Management:**

Windows can be dynamically created and destroyed using React state. The `onClose` prop enables ImGui's native close button (X in the title bar):

```jsx
// examples/dynamic-windows/app.jsx
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
      <window title="Control Panel">
        <button onClick={addWindow}>Add New Window</button>
        <text>Total windows: {windows.length}</text>
      </window>

      {windows.map(w => (
        <window
          key={w.id}
          title={w.title}
          onClose={() => closeWindow(w.id)}
        >
          <text>Click the X button to close this window</text>
        </window>
      ))}
    </>
  );
}
```

**Important Notes:**
- Host components (window, text, button, etc.) must use **lowercase names** in JSX
- React treats capitalized names as component references, lowercase as host primitives
- Window positioning uses `ImGuiCond_Once` to set initial position without preventing user movement
- Console.debug() is currently a no-op to reduce log noise

## React and ImGui Identity Integration

**Component Identity:**
React maintains component identity across renders - the same TreeNode instance is reused when a component updates (not recreated). This identity is tracked by:
- Position in the tree (by default)
- The `key` prop (for explicit identity in lists)

**ImGui Widget Identity:**
Each TreeNode is assigned a unique integer ID at creation time. This ID is pushed onto ImGui's ID stack during rendering, ensuring:
- Stable ImGui widget IDs tied to React component lifetime
- Multiple components with identical labels (e.g., "Delete" buttons) get unique IDs
- Widget state (hover, click, focus) correctly tracks across frames

**Implementation:**
```javascript
// tree-node.js: Each node gets unique ID
let nextNodeId = 1;
class TreeNode {
  constructor(type, props) {
    this.id = nextNodeId++;  // Stable for node's lifetime
    // ...
  }
}

// renderer.js: ID stack guards rendering
function renderNode(node) {
  _igPushID_Int(node.id);
  try {
    // ... render node ...
  } finally {
    _igPopID();  // Always cleanup, even on exception
  }
}
```

**Code Quality Improvements:**
- Removed dual rootNode/rootChildren tracking (use only rootChildren for Fragment support)
- Fixed prepareUpdate() to properly validate key existence in both old and new props
- Added prop validation for required props (table columns, scaledcontent dimensions)
- Extracted color parsing to shared utilities (parseColorToImVec4, parseColorToABGR)
- Optimized allocTmp() calls: reduced from 15+ to 2-3 per renderNode() by reusing buffers
- Added error logging for edge cases in tree manipulation
- Exception-safe ID stack management with try/finally

**Bug Fixes:**
- Fixed `commitUpdate` parameter order mismatch (was causing props to be lost on re-renders)
- Correct parameter signature: `commitUpdate(instance, type, oldProps, newProps, internalHandle)`
- Fixed release build path issue for react-unit-bundle.js compilation

## Architecture Benefits

1. **Separation of Concerns**: Event loop, React logic, and ImGui rendering separated
2. **Type Safety**: FFI calls are type-checked in typed unit
3. **Zero-Cost FFI**: All ImGui calls have zero overhead
4. **Standard React**: No modifications needed to React or reconciler
5. **Browser-like APIs**: setTimeout, setImmediate, Promises, console.log
6. **Clear Boundaries**: Communication via simple global interface
7. **Proper Event Loop**: Macrotasks and microtasks with correct semantics
8. **Clean Organization**: Libraries in lib/, applications in src/, clear separation
9. **Build Efficiency**: Library units compile once, only app code rebuilds
10. **Multiple Compilation Modes**: Choose speed vs. runtime performance tradeoff
11. **Clean Dependency Chain**: Application targets depend only on imgui-runtime, all Hermes dependencies are transitive
12. **Optimized Release Builds**: Static linking in Release mode for optimal performance and single-binary distribution

## Development Workflow

**Building the project:**
The build system automatically handles Hermes - no manual setup required:

```bash
# Initial configuration (Hermes will be cloned and built automatically)
cmake -B cmake-build-debug -DCMAKE_BUILD_TYPE=Debug

# Build the project
cmake --build cmake-build-debug
```

**First build notes:**
- On first configure, Hermes will be automatically cloned from GitHub
- Hermes will be built in Release mode (this takes several minutes)
- Subsequent builds reuse the existing Hermes build

**Using a different Hermes version:**
```bash
cmake -B cmake-build-debug -DHERMES_GIT_TAG=<commit-hash>
cmake --build cmake-build-debug --target hermes-rebuild  # Force rebuild
```

**Important:**
- Use `cmake --build` consistently to prevent spurious rebuilds
- Do NOT alternate between `cmake --build` and running ninja directly (different ninja versions cause rebuild loops)
- Build directory (`cmake-build-debug/` or `cmake-build-release/`) contains all build artifacts
- Each build configuration has its own independent Hermes clone

## Next Steps

- Add more component types (input, slider, checkbox, radio, etc.)
- Implement useEffect and other React hooks
- Add more ImGui window flags support
- Implement proper ref handling
- Add layout components (columns, tables)
- Add performance optimizations
