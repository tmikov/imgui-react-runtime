# TODO List

## Runtime Improvements

### Proper Timer Implementation
Currently, timer implementation is tied to the Sokol frame callback, which means:
- Timers are only checked and executed before each frame render
- No true background timer events (limited to ~60Hz frame rate)
- Timer precision is limited by the frame rate

**Goal**: Implement proper timer support with:
- Native timer events from the platform (separate from frame callbacks)
- Better precision for setTimeout/setInterval
- Ability to wake event loop independently of rendering

### Environment Variable Import on Startup
Add ability to import system environment variables when the runtime starts.

**Goal**:
- Populate `process.env` with system environment variables
- Allow configuration via environment (e.g., `DEBUG=1`, custom paths)
- Match Node.js behavior more closely

### Node.js API Compatibility

Provide Node.js-compatible APIs:

**Priority modules**:
- `fs` - File system operations (readFile, writeFile, stat, readdir, etc.)
- `path` - Path manipulation utilities (join, resolve, dirname, etc.)
- `os` - Operating system information (platform, tmpdir, etc.)
- `buffer` - Buffer class for binary data handling
- `stream` - Stream handling for file and data operations

**Future modules**:
- `http`/`https` - Network operations
- `child_process` - Process spawning
- `worker_threads` - Parallel execution

### Web Workers

Multi-thread support will be nice.

### Misc

Remove try/finally in rendering
react compiler
caching of component data
