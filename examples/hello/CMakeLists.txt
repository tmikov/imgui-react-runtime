# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

# Note: Native libraries (cimgui, sokol, stb, soloud) are built in external/
# Note: Hermes configuration is in root CMakeLists.txt
# Note: jslib-unit and imgui-unit are built in lib/

# Build the hello React+ImGui application
add_react_imgui_app(
    TARGET hello
    ENTRY_POINT index.js
    SOURCES hello.cpp
)
