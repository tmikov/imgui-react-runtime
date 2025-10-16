// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

#pragma once

#include <hermes/hermes.h>
#include <memory>

/// Memory map a file.
///
/// @param path the file path to map
/// @param attemptTrailingZero if possible, add a trailing zero and increase the
///   logical mapped size to include it.
/// @return memory mapped buffer
std::shared_ptr<facebook::jsi::Buffer>
mapFileBuffer(const char *path, bool attemptTrailingZero = false);
