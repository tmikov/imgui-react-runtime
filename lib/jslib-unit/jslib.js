// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Event loop implementation for Static Hermes
// Based on hermes-jsi-demos/evloop/jslib.js.inc
// Provides setTimeout, setImmediate, and helper functions for C++ integration

(function() {
    "use strict";

    var tasks = [];
    var nextTaskID = 0;
    var curTime = 0;
    var intervals = {}; // Map of interval IDs to their state

    // Return the deadline of the next task, or -1 if there is no task.
    function peekMacroTask() {
        return tasks.length ? tasks[0].deadline : -1;
    }

    // Run the next task if it's time.
    // `tm` is the current time in milliseconds.
    function runMacroTask(tm) {
        curTime = tm;
        if (tasks.length && tasks[0].deadline <= tm) {
            var task = tasks.shift();
            task.fn.apply(undefined, task.args);
        }
    }

    function setTimeout(fn, ms = 0, ...args) {
        var id = nextTaskID++;
        var task = {id, fn, deadline: curTime + Math.max(0, ms | 0), args};
        // Insert the task in the sorted list.
        var i = 0;
        for (i = 0; i < tasks.length; ++i) {
            if (tasks[i].deadline > task.deadline) {
                break;
            }
        }
        tasks.splice(i, 0, task);
        return id;
    }

    function clearTimeout(id) {
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].id === id) {
                tasks.splice(i, 1);
                break;
            }
        }
    }

    function setImmediate(fn, ...args) {
        return setTimeout(fn, 0, ...args);
    }
    function clearImmediate(id) {
        return clearTimeout(id);
    }

    function setInterval(fn, ms = 0, ...args) {
        var id = nextTaskID++;
        intervals[id] = {
            fn: fn,
            ms: ms,
            args: args,
            timeoutId: null
        };

        function repeat() {
            // Check if interval was cleared
            if (!intervals[id]) {
                return;
            }

            // Call the function
            fn.apply(undefined, args);

            // Schedule next execution
            if (intervals[id]) {
                intervals[id].timeoutId = setTimeout(repeat, ms);
            }
        }

        // Start the interval
        intervals[id].timeoutId = setTimeout(repeat, ms);
        return id;
    }

    function clearInterval(id) {
        if (intervals[id]) {
            if (intervals[id].timeoutId !== null) {
                clearTimeout(intervals[id].timeoutId);
            }
            delete intervals[id];
        }
    }

    // requestAnimationFrame polyfill that adapts to the host's tick rate.
    // We batch callbacks and flush them on the next macro task, so the
    // frequency naturally follows the platform refresh cadence (e.g., 60/90/120Hz)
    // if the host drives the event loop once per frame.
    var rafQueue = {};
    var rafNextId = 1;

    function flushRaf() {
        // Take a snapshot of callbacks and clear the queue so rAFs scheduled
        // inside a callback run on the next tick (matching browser semantics).
        var cbs = [];
        for (var id in rafQueue) {
            if (Object.prototype.hasOwnProperty.call(rafQueue, id)) {
                cbs.push(rafQueue[id]);
                delete rafQueue[id];
            }
        }
        var ts = curTime;
        for (var i = 0; i < cbs.length; i++) {
        try {
            cbs[i](ts);
        } catch (e) {
            try {
                if (
                    globalThis &&
                    globalThis.console &&
                    typeof globalThis.console.error === 'function'
                ) {
                    globalThis.console.error(e);
                } else if (typeof print === 'function') {
                    print('ERROR:', String(e && e.message ? e.message : e));
                }
            } catch (_) {}
        }
        }
    }

    function requestAnimationFrame(callback) {
        var id = rafNextId++;
        rafQueue[id] = callback;
        return id;
    }

    function cancelAnimationFrame(id) {
        if (rafQueue[id]) {
        delete rafQueue[id];
        }
    }

    // Expose to global scope
    globalThis.setTimeout = setTimeout;
    globalThis.clearTimeout = clearTimeout;
    globalThis.setImmediate = setImmediate;
    globalThis.clearImmediate = clearImmediate;
    globalThis.setInterval = setInterval;
    globalThis.clearInterval = clearInterval;
    globalThis.requestAnimationFrame = requestAnimationFrame;
    globalThis.cancelAnimationFrame = cancelAnimationFrame;

    // Polyfills needed by React
    // NODE_ENV will be set from C++ based on build configuration
    globalThis.process = {
        env: { NODE_ENV: 'production' }  // Default, overridden by C++
    };

    // Console implementation using Hermes global print()
    // Formats arrays and objects using JSON.stringify with circular reference handling
    function formatArg(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';

        // Special handling for Error objects
        if (arg instanceof Error) {
            let result = arg.name + ': ' + arg.message;
            if (arg.stack) {
                result += '\n' + arg.stack;
            }
            return result;
        }

        if (typeof arg === 'object') {
          const maxLength = 200;
          try {
                // Use JSON.stringify with a replacer to handle circular references
                const seen = new WeakSet();
                const json = JSON.stringify(arg , function(key, value) {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return '[Circular]';
                        }
                        seen.add(value);
                    }
                    return value;
                });
                // Truncate if too long
                if (json.length > maxLength) {
                    return json.substring(0, maxLength) + '... [truncated]';
                }
                return json;
            } catch (e) {
                // Fallback for other stringify errors
                return '[object]';
            }
        }
        return String(arg);
    }

    globalThis.console = {
        log: function(...args) {
            const formatted = args.map(formatArg).join(' ');
            print(formatted);
        },
        error: function(...args) {
            const formatted = args.map(formatArg).join(' ');
            print('ERROR:', formatted);
        },
        debug: function(...args) {
            // No-op for now
        }
    };

    // Return helper functions for C++ to use
    return {peek: peekMacroTask, run: runMacroTask, flushRaf};
})();
