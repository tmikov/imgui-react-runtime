# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

# Jslib unit - Event loop library (untyped)
# Provides setTimeout, setImmediate, and event loop functionality

set(JSLIB_UNIT_O jslib-unit${CMAKE_C_OUTPUT_EXTENSION})
hermes_compile_native(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${JSLIB_UNIT_O}
    SOURCES jslib.js
    UNIT_NAME jslib
)

add_library(jslib-unit STATIC ${CMAKE_CURRENT_BINARY_DIR}/${JSLIB_UNIT_O})
set_target_properties(jslib-unit PROPERTIES LINKER_LANGUAGE C)

# Ensure Hermes is built before compiling this unit
add_dependencies(jslib-unit hermes)
