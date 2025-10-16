# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

# ImGui unit - FFI bindings and renderer (typed)
# Provides ImGui rendering functionality using Static Hermes FFI

set(IMGUI_UNIT_O imgui-unit${CMAKE_C_OUTPUT_EXTENSION})
hermes_compile_native(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${IMGUI_UNIT_O}
    SOURCES
        ffi_helpers.js
        asciiz.js
        sapp.js
        js_externs.js
        renderer.js
        main.js
    UNIT_NAME imgui
    FLAGS -typed -Wc,-I.
)

add_library(imgui-unit STATIC js_externs_cwrap.c ${CMAKE_CURRENT_BINARY_DIR}/${IMGUI_UNIT_O})
set_target_properties(imgui-unit PROPERTIES LINKER_LANGUAGE C)
target_link_libraries(imgui-unit cimgui sokol)

# Ensure Hermes is built before compiling this unit
add_dependencies(imgui-unit hermes)
