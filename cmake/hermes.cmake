# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

# CMake functions for compiling JavaScript with Hermes/Shermes
#
# This file provides convenience functions for:
# - Compiling JS to native code with shermes
# - Compiling JS to bytecode with hermes
# - Creating static libraries from compiled JS units

#[[
Compile JavaScript source files to native code (.o) using shermes

Usage:
  hermes_compile_native(
    OUTPUT <output-file>
    SOURCES <source-files>...
    UNIT_NAME <exported-unit-name>
    [FLAGS <additional-flags>...]
    [DEPENDS <dependencies>...]
    [WORKING_DIRECTORY <dir>]
    [COMMENT <comment>]
  )

Arguments:
  OUTPUT             - Output object file path (e.g., ${CMAKE_CURRENT_BINARY_DIR}/myunit.o)
  SOURCES            - List of JavaScript source files to compile
  UNIT_NAME          - Name for --exported-unit flag
  FLAGS              - Additional compiler flags (e.g., -Xes6-block-scoping, -typed)
  DEPENDS            - Additional file dependencies
  WORKING_DIRECTORY  - Directory to run command in (default: CMAKE_CURRENT_SOURCE_DIR)
  COMMENT            - Build comment (auto-generated if not provided)

Example:
  hermes_compile_native(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/jslib-unit.o
    SOURCES jslib.js
    UNIT_NAME jslib
    COMMENT "Compiling jslib unit"
  )
]]
function(hermes_compile_native)
    # Parse arguments
    cmake_parse_arguments(
        ARG                           # Prefix for parsed variables
        ""                            # Options (flags without values)
        "OUTPUT;UNIT_NAME;WORKING_DIRECTORY;COMMENT"  # Single value args
        "SOURCES;FLAGS;DEPENDS"       # Multi-value args
        ${ARGN}                       # Parse ARGN
    )

    # Validate required arguments
    if(NOT ARG_OUTPUT)
        message(FATAL_ERROR "hermes_compile_native: OUTPUT is required")
    endif()
    if(NOT ARG_SOURCES)
        message(FATAL_ERROR "hermes_compile_native: SOURCES is required")
    endif()
    if(NOT ARG_UNIT_NAME)
        message(FATAL_ERROR "hermes_compile_native: UNIT_NAME is required")
    endif()

    # Set defaults
    if(NOT ARG_WORKING_DIRECTORY)
        set(ARG_WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR})
    endif()
    if(NOT ARG_COMMENT)
        set(ARG_COMMENT "Compiling ${ARG_UNIT_NAME} unit with shermes")
    endif()

    # Build compiler flags
    set(COMPILER_FLAGS
        $<$<CONFIG:Debug>:-g3>
        --exported-unit=${ARG_UNIT_NAME}
        -Xes6-block-scoping
        -Xline-directives
    )
    if(ARG_FLAGS)
        list(APPEND COMPILER_FLAGS ${ARG_FLAGS})
    endif()
    list(APPEND COMPILER_FLAGS -c)

    # Add sources
    list(APPEND COMPILER_FLAGS ${ARG_SOURCES})

    # Add output
    list(APPEND COMPILER_FLAGS -o ${ARG_OUTPUT})

    # Create custom command
    add_custom_command(
        OUTPUT ${ARG_OUTPUT}
        COMMAND ${CMAKE_COMMAND} -E env CC=${CMAKE_C_COMPILER} ${SHERMES} ${COMPILER_FLAGS}
        DEPENDS ${ARG_SOURCES} ${ARG_DEPENDS}
        WORKING_DIRECTORY ${ARG_WORKING_DIRECTORY}
        COMMENT ${ARG_COMMENT}
    )
endfunction()

#[[
Compile JavaScript source to bytecode (.hbc) using hermes

Usage:
  hermes_compile_bytecode(
    OUTPUT <output-file>
    SOURCE <source-file>
    [FLAGS <additional-flags>...]
    [SOURCE_MAP <source-map-file>]
    [DEPENDS <dependencies>...]
    [WORKING_DIRECTORY <dir>]
    [COMMENT <comment>]
  )

Arguments:
  OUTPUT             - Output bytecode file path (e.g., ${CMAKE_CURRENT_BINARY_DIR}/bundle.hbc)
  SOURCE             - JavaScript source file to compile
  FLAGS              - Additional compiler flags (e.g., -Xes6-block-scoping)
  SOURCE_MAP         - Optional source map file to generate
  DEPENDS            - Additional file dependencies
  WORKING_DIRECTORY  - Directory to run command in (default: CMAKE_CURRENT_SOURCE_DIR)
  COMMENT            - Build comment (auto-generated if not provided)

Example:
  hermes_compile_bytecode(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/react-bundle.hbc
    SOURCE ${CMAKE_CURRENT_BINARY_DIR}/react-bundle.js
    FLAGS -Xes6-block-scoping
    SOURCE_MAP ${CMAKE_CURRENT_BINARY_DIR}/react-bundle.js.map
    DEPENDS ${REACT_UNIT_BUNDLE}
  )
]]
function(hermes_compile_bytecode)
    # Parse arguments
    cmake_parse_arguments(
        ARG                           # Prefix
        ""                            # Options
        "OUTPUT;SOURCE;SOURCE_MAP;WORKING_DIRECTORY;COMMENT"  # Single value
        "FLAGS;DEPENDS"               # Multi-value
        ${ARGN}
    )

    # Validate required arguments
    if(NOT ARG_OUTPUT)
        message(FATAL_ERROR "hermes_compile_bytecode: OUTPUT is required")
    endif()
    if(NOT ARG_SOURCE)
        message(FATAL_ERROR "hermes_compile_bytecode: SOURCE is required")
    endif()

    # Set defaults
    if(NOT ARG_WORKING_DIRECTORY)
        set(ARG_WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR})
    endif()
    if(NOT ARG_COMMENT)
        set(ARG_COMMENT "Compiling to bytecode with hermes")
    endif()

    # Build compiler flags
    set(COMPILER_FLAGS
        $<$<CONFIG:Debug>:-g>
        -Xes6-block-scoping
    )
    if(ARG_FLAGS)
        list(APPEND COMPILER_FLAGS ${ARG_FLAGS})
    endif()
    list(APPEND COMPILER_FLAGS -emit-binary)
    list(APPEND COMPILER_FLAGS -out ${ARG_OUTPUT})

    if(ARG_SOURCE_MAP)
        list(APPEND COMPILER_FLAGS --source-map=${ARG_SOURCE_MAP})
    endif()

    list(APPEND COMPILER_FLAGS ${ARG_SOURCE})

    # Create custom command
    add_custom_command(
        OUTPUT ${ARG_OUTPUT}
        COMMAND ${HERMES} ${COMPILER_FLAGS}
        DEPENDS ${ARG_SOURCE} ${ARG_DEPENDS}
        WORKING_DIRECTORY ${ARG_WORKING_DIRECTORY}
        COMMENT ${ARG_COMMENT}
    )
endfunction()
