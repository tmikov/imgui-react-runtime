cmake_minimum_required(VERSION 3.26)
project(imgui-react-runtime)

set(CMAKE_CXX_STANDARD 17)

# Validate required variables
if(NOT CMAKE_BUILD_TYPE)
    message(FATAL_ERROR "CMAKE_BUILD_TYPE must be set (e.g., Debug or Release)")
endif()

# Build Hermes as an external project (always in Release mode)
# This sets HERMES_BUILD, HERMES_SRC, SHERMES, and HERMES variables
include(cmake/HermesExternal.cmake)

# Include Hermes compilation helper functions
include(cmake/hermes.cmake)

# Include React+ImGui app helper functions
include(cmake/react-imgui.cmake)

# React bundle mode:
# 0 = Native compilation with shermes (default for Release, slowest build, fastest runtime)
# 1 = Bytecode compilation with hermes (medium build speed, medium runtime)
# 2 = Source bundle only (default for Debug, fastest build, slowest runtime)
if(NOT DEFINED REACT_BUNDLE_MODE)
    if(CMAKE_BUILD_TYPE STREQUAL "Release")
        set(REACT_BUNDLE_MODE 0)
    else()
        set(REACT_BUNDLE_MODE 2)
    endif()
endif()
set(REACT_BUNDLE_MODE ${REACT_BUNDLE_MODE} CACHE STRING "React bundle compilation mode (0=native, 1=bytecode, 2=source)")

message(STATUS "Hermes build: ${HERMES_BUILD}")
message(STATUS "Hermes source: ${HERMES_SRC}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "React bundle mode: ${REACT_BUNDLE_MODE} (0=native, 1=bytecode, 2=source)")

# Collect reconciler library files for dependency tracking
# This is defined at root level so it can be reused by multiple apps
file(GLOB RECONCILER_FILES
    CONFIGURE_DEPENDS
    ${CMAKE_SOURCE_DIR}/lib/react-imgui-reconciler/*.js
)

# Hermes include directories
include_directories(${HERMES_BUILD}/lib/config)
include_directories(${HERMES_SRC}/include)
include_directories(${HERMES_SRC}/Public)
include_directories(${HERMES_SRC}/API)
include_directories(${HERMES_SRC}/API/jsi)

add_subdirectory(external)
add_subdirectory(lib)
add_subdirectory(examples)
