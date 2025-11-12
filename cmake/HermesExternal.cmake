# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

# CMake configuration for building Hermes as an external project
#
# This module either uses a pre-built Hermes or clones and builds it from git.
#
# Configuration variables:
#   HERMES_BUILD_DIR - Path to pre-built Hermes build directory (optional)
#                      If set, skips auto-build and uses existing Hermes
#   HERMES_GIT_URL   - Git repository URL (default: https://github.com/facebook/hermes.git)
#   HERMES_GIT_TAG   - Git tag/commit/branch to checkout (default: specific commit)
#
# The module sets the following variables:
#   HERMES_SRC    - Path to Hermes source directory
#   HERMES_BUILD  - Path to Hermes build directory
#   SHERMES       - Path to shermes binary
#   HERMES        - Path to hermes binary

include(ExternalProject)

# Check if user provided a pre-built Hermes
if(HERMES_BUILD_DIR)
    message(STATUS "Using external Hermes build: ${HERMES_BUILD_DIR}")

    # Validate build directory exists
    if(NOT IS_DIRECTORY "${HERMES_BUILD_DIR}")
        message(FATAL_ERROR "HERMES_BUILD_DIR does not exist: ${HERMES_BUILD_DIR}")
    endif()

    # Read CMakeCache.txt to find source directory
    set(CACHE_FILE "${HERMES_BUILD_DIR}/CMakeCache.txt")
    if(NOT EXISTS "${CACHE_FILE}")
        message(FATAL_ERROR "CMakeCache.txt not found in HERMES_BUILD_DIR: ${CACHE_FILE}")
    endif()

    # Parse CMAKE_HOME_DIRECTORY from cache file
    file(STRINGS "${CACHE_FILE}" CACHE_LINES REGEX "^CMAKE_HOME_DIRECTORY:")
    if(NOT CACHE_LINES)
        message(FATAL_ERROR "CMAKE_HOME_DIRECTORY not found in ${CACHE_FILE}")
    endif()

    # Extract path from "CMAKE_HOME_DIRECTORY:INTERNAL=/path/to/source"
    string(REGEX REPLACE "^CMAKE_HOME_DIRECTORY:INTERNAL=(.+)$" "\\1" HERMES_SRC_FROM_CACHE "${CACHE_LINES}")

    # Validate source directory exists
    if(NOT IS_DIRECTORY "${HERMES_SRC_FROM_CACHE}")
        message(FATAL_ERROR "Hermes source directory from cache does not exist: ${HERMES_SRC_FROM_CACHE}")
    endif()

    # Set paths
    set(HERMES_SRC "${HERMES_SRC_FROM_CACHE}")
    set(HERMES_BUILD "${HERMES_BUILD_DIR}")

    # Validate shermes binary exists
    set(SHERMES "${HERMES_BUILD}/bin/shermes")
    if(NOT EXISTS "${SHERMES}")
        message(FATAL_ERROR "shermes binary not found: ${SHERMES}")
    endif()

    # Set hermes binary path (optional tool, don't fail if missing)
    set(HERMES "${HERMES_BUILD}/bin/hermes")

    message(STATUS "Hermes source: ${HERMES_SRC}")
    message(STATUS "Hermes build: ${HERMES_BUILD}")
    message(STATUS "shermes: ${SHERMES}")

    # Create a dummy target so dependencies on 'hermes' still work
    add_custom_target(hermes)

else()
    # Auto-build Hermes from git

    # Configurable git parameters
    set(HERMES_GIT_URL "https://github.com/facebook/hermes.git"
        CACHE STRING "Hermes git repository URL")
    set(HERMES_GIT_TAG "80359d48dbf0a108031d69c8a22bad180cfb4df3"
        CACHE STRING "Hermes git tag/commit/branch to build")

    # Set Hermes paths - everything in build directory
    set(HERMES_SRC "${CMAKE_BINARY_DIR}/hermes-src")
    set(HERMES_BUILD "${CMAKE_BINARY_DIR}/hermes")

    # Configure Hermes build options
    set(HERMES_CMAKE_ARGS
        -DCMAKE_BUILD_TYPE=Release
        -DHERMES_ENABLE_TEST_SUITE=OFF
        -DHERMES_BUILD_APPLE_FRAMEWORK=OFF
        -DCMAKE_C_COMPILER=${CMAKE_C_COMPILER}
        -DCMAKE_CXX_COMPILER=${CMAKE_CXX_COMPILER}
    )

    # Add Hermes as external project
    ExternalProject_Add(hermes
        GIT_REPOSITORY ${HERMES_GIT_URL}
        GIT_TAG ${HERMES_GIT_TAG}
        GIT_SHALLOW OFF
        GIT_PROGRESS ON
        SOURCE_DIR ${HERMES_SRC}
        BINARY_DIR ${HERMES_BUILD}
        CMAKE_ARGS ${HERMES_CMAKE_ARGS}
        BUILD_ALWAYS OFF
        INSTALL_COMMAND ""
        BUILD_COMMAND ${CMAKE_COMMAND} --build <BINARY_DIR> --config Release
        LOG_CONFIGURE ON
        LOG_BUILD ON
        LOG_OUTPUT_ON_FAILURE ON
        UPDATE_DISCONNECTED ON
        ENV CC ${CMAKE_C_COMPILER}
        ENV CXX ${CMAKE_CXX_COMPILER}
    )

    # Set tool paths (these will be valid after Hermes is built)
    set(SHERMES "${HERMES_BUILD}/bin/shermes")
    set(HERMES "${HERMES_BUILD}/bin/hermes")

    # Add a target for manual rebuilds
    add_custom_target(hermes-rebuild
        COMMAND ${CMAKE_COMMAND} --build ${HERMES_BUILD} --config Release --clean-first
        COMMENT "Rebuilding Hermes from scratch"
    )

    message(STATUS "Hermes git URL: ${HERMES_GIT_URL}")
    message(STATUS "Hermes git tag: ${HERMES_GIT_TAG}")
    message(STATUS "Hermes will be cloned to: ${HERMES_SRC}")
    message(STATUS "Hermes will be built in Release mode at: ${HERMES_BUILD}")
endif()
