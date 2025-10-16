# Copyright (c) Tzvetan Mikov and contributors
# SPDX-License-Identifier: MIT
# See LICENSE file for full license text

# CMake configuration for building Hermes as an external project
#
# This module clones Hermes from git and builds it in Release mode
# regardless of the parent project's build type.
#
# Configuration variables:
#   HERMES_GIT_URL  - Git repository URL (default: https://github.com/facebook/hermes.git)
#   HERMES_GIT_TAG  - Git tag/commit/branch to checkout (default: main)
#
# The module sets the following variables:
#   HERMES_SRC    - Path to Hermes source directory (${CMAKE_BINARY_DIR}/hermes-src)
#   HERMES_BUILD  - Path to Hermes build directory (${CMAKE_BINARY_DIR}/hermes)
#   SHERMES       - Path to shermes binary
#   HERMES        - Path to hermes binary

include(ExternalProject)

# Configurable git parameters
set(HERMES_GIT_URL "https://github.com/facebook/hermes.git"
    CACHE STRING "Hermes git repository URL")
set(HERMES_GIT_TAG "80359d48dbf0a108031d69c8a22bad180cfb4df3"
    CACHE STRING "Hermes git tag/commit/branch to build")

# Set Hermes paths - everything in build directory
set(HERMES_SRC "${CMAKE_BINARY_DIR}/hermes-src" CACHE STRING "Hermes source directory" FORCE)
set(HERMES_BUILD "${CMAKE_BINARY_DIR}/hermes" CACHE STRING "Hermes build directory" FORCE)

# Configure Hermes build options
set(HERMES_CMAKE_ARGS
    -DCMAKE_BUILD_TYPE=Release
    -DHERMES_ENABLE_TEST_SUITE=OFF
    -DHERMES_BUILD_APPLE_FRAMEWORK=OFF
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
)

# Set tool paths (these will be valid after Hermes is built)
set(SHERMES "${HERMES_BUILD}/bin/shermes" CACHE STRING "shermes tool path" FORCE)
set(HERMES "${HERMES_BUILD}/bin/hermes" CACHE STRING "hermes compiler path" FORCE)

# Add a target for manual rebuilds
add_custom_target(hermes-rebuild
    COMMAND ${CMAKE_COMMAND} --build ${HERMES_BUILD} --config Release --clean-first
    COMMENT "Rebuilding Hermes from scratch"
)

message(STATUS "Hermes git URL: ${HERMES_GIT_URL}")
message(STATUS "Hermes git tag: ${HERMES_GIT_TAG}")
message(STATUS "Hermes will be cloned to: ${HERMES_SRC}")
message(STATUS "Hermes will be built in Release mode at: ${HERMES_BUILD}")
