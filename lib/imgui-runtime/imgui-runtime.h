// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

#pragma once

#include "MappedFileBuffer.h"

struct InternalImage {
  const char unsigned *data;
  unsigned size;
  const char *name;
};

#define IMPORT_IMAGE(name)                                                     \
  extern "C" const unsigned char img_##name##_png[];                           \
  extern "C" const unsigned img_##name##_png_size;                             \
  static InternalImage s_img_##name = {img_##name##_png,                       \
                                       img_##name##_png_size, #name}

/// Main function provided by the user. It has to initialize the React and user
/// code.
void imgui_main(int argc, char *argv[],
                facebook::hermes::HermesRuntime *hermes);

/// imgui_main() usually just calls this function with the correct parameters.
void imgui_load_unit(facebook::hermes::HermesRuntime *hermes,
                     SHUnitCreator nativeUnit, bool bytecode,
                     const char *jsPath, const char *sourceURL);

/// A simple default implementation of imgui_main().
template <int BUNDLE_MODE>
void imgui_main_default(facebook::hermes::HermesRuntime *hermes,
                        SHUnitCreator sh_export_react, const char *bundlePath) {
  // Load react unit based on compilation mode
  if constexpr (BUNDLE_MODE == 0) {
    imgui_load_unit(hermes, sh_export_react, false, nullptr, nullptr);
  } else if constexpr (BUNDLE_MODE == 1) {
    // Mode 1: Bytecode - load .hbc file via evaluateJavaScript
    imgui_load_unit(hermes, nullptr, true, bundlePath, "react-unit-bundle.hbc");
  } else if constexpr (BUNDLE_MODE == 2) {
    // Mode 2: Source - load .js file with source map
    imgui_load_unit(hermes, nullptr, false, bundlePath, "react-unit-bundle.js");
  }
}

#ifdef PROVIDE_IMGUI_MAIN

#if REACT_BUNDLE_MODE == 0
extern "C" SHUnit *sh_export_react(void);
#elif !(REACT_BUNDLE_MODE >= 0 && REACT_BUNDLE_MODE < 4)
#error "Invalid REACT_BUNDLE_MODE"
#endif

void imgui_main(int argc, char *argv[],
                facebook::hermes::HermesRuntime *hermes) {
#if REACT_BUNDLE_MODE != 0
  static constexpr SHUnit *(*sh_export_react)(void) = nullptr;
#endif
  imgui_main_default<REACT_BUNDLE_MODE>(hermes, sh_export_react,
                                        REACT_BUNDLE_PATH);
}

#endif
