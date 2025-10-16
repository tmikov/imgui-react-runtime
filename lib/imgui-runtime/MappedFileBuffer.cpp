// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

#include "MappedFileBuffer.h"

#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>

namespace {

// Memory-mapped file buffer for loading bytecode/source
class MappedFileBuffer : public facebook::jsi::Buffer {
public:
  explicit MappedFileBuffer(const char *path, bool attemptTrailingZero) {
    assert(path && path[0]);
    fd_ = open(path, O_RDONLY);
    if (fd_ < 0) {
      throw std::runtime_error(std::string("Failed to open: ") +
                               path);
    }

    struct stat st;
    if (fstat(fd_, &st) < 0) {
      close(fd_);
      throw std::runtime_error(std::string("Failed to stat: ") +
                               path);
    }

    fileSize_ = st.st_size;

    // Calculate mmap size - round up to page size
    long pageSize = sysconf(_SC_PAGESIZE);
    mappedSize_ = ((fileSize_ + pageSize - 1) / pageSize) * pageSize;

    // For source files, if file size is not page-aligned and addTrailingZero is
    // true, report size with extra byte to ensure null termination (mmap fills
    // with zeros)
    if (attemptTrailingZero && fileSize_ % pageSize != 0) {
      size_ = fileSize_ + 1; // Include null terminator
    } else {
      size_ = fileSize_;
    }

    data_ = static_cast<const uint8_t *>(
        mmap(nullptr, mappedSize_, PROT_READ, MAP_PRIVATE, fd_, 0));

    if (data_ == MAP_FAILED) {
      close(fd_);
      throw std::runtime_error(std::string("Failed to mmap React bundle: ") +
                               path);
    }
  }

  ~MappedFileBuffer() override {
    if (data_ != MAP_FAILED) {
      munmap(const_cast<uint8_t *>(data_), mappedSize_);
    }
    if (fd_ >= 0) {
      close(fd_);
    }
  }

  size_t size() const override { return size_; }
  const uint8_t *data() const override { return data_; }

private:
  int fd_ = -1;
  const uint8_t *data_ = nullptr;
  size_t fileSize_ = 0;   // Actual file size
  size_t mappedSize_ = 0; // Rounded to page size
  size_t size_ = 0;       // Size to report (may include null terminator)
};

}

std::shared_ptr<facebook::jsi::Buffer>
mapFileBuffer(const char *path, bool attemptTrailingZero) {
  return std::make_shared<MappedFileBuffer>(path, attemptTrailingZero);
}
