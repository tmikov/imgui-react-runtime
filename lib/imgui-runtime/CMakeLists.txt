# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

add_library(imgui-runtime imgui-runtime.cpp
        MappedFileBuffer.cpp
        MappedFileBuffer.h
        imgui-runtime.h
)
target_link_directories(imgui-runtime INTERFACE
    ${HERMES_BUILD}/lib
    ${HERMES_BUILD}/jsi
    ${HERMES_BUILD}/external/boost/boost_1_86_0/libs/context
)
target_link_libraries(imgui-runtime
    sokol stb cimgui imgui-unit jslib-unit
    $<$<CONFIG:Release>:hermesvm_a jsi boost_context>
    $<$<CONFIG:Debug>:hermesvm>
)
target_include_directories(imgui-runtime INTERFACE ${CMAKE_CURRENT_SOURCE_DIR})
