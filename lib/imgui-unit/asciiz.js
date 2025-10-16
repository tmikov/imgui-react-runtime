// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

// Pointer access builtins.
const _ptr_write_char = $SHBuiltin.extern_c({declared: true}, function _sh_ptr_write_char(ptr: c_ptr, offset: c_int, v: c_char): void {
});
const _ptr_read_uchar = $SHBuiltin.extern_c({declared: true}, function _sh_ptr_read_uchar(ptr: c_ptr, offset: c_int): c_uchar {
    throw 0;
});

/// Allocate native memory using calloc() or throw an exception.
function calloc(size: number): c_ptr {
    "inline";
    "use unsafe";

    let res = _calloc(1, size);
    if (res === 0) throw Error("OOM");
    return res;
}

/// Allocate native memory using malloc() or throw an exception.
function malloc(size: number): c_ptr {
    "inline";
    "use unsafe";

    let res = _malloc(size);
    if (res === 0) throw Error("OOM");
    return res;
}

function copyToAsciiz(s: any, buf: c_ptr, size: number): void {
    if (s.length >= size) throw Error("String too long");
    let i = 0;
    for (let e = s.length; i < e; ++i) {
        let code: number = s.charCodeAt(i);
        if (code > 127) throw Error("String is not ASCII");
        _ptr_write_char(buf, i, code);
    }
    _ptr_write_char(buf, i, 0);
}

/// Convert a JS string to UTF-8 encoded null-terminated string.
/// Returns the number of bytes written (excluding null terminator).
function copyToUtf8(s: any, buf: c_ptr, maxSize: number): number {
    let byteIndex = 0;
    for (let i = 0, e = s.length; i < e; ++i) {
        let code: number = s.charCodeAt(i);

        if (code < 0x80) {
            // 1-byte sequence (ASCII)
            if (byteIndex >= maxSize - 1) throw Error("String too long");
            _ptr_write_char(buf, byteIndex++, code);
        } else if (code < 0x800) {
            // 2-byte sequence
            if (byteIndex >= maxSize - 2) throw Error("String too long");
            _ptr_write_char(buf, byteIndex++, 0xC0 | (code >> 6));
            _ptr_write_char(buf, byteIndex++, 0x80 | (code & 0x3F));
        } else if (code < 0xD800 || code >= 0xE000) {
            // 3-byte sequence (not a surrogate)
            if (byteIndex >= maxSize - 3) throw Error("String too long");
            _ptr_write_char(buf, byteIndex++, 0xE0 | (code >> 12));
            _ptr_write_char(buf, byteIndex++, 0x80 | ((code >> 6) & 0x3F));
            _ptr_write_char(buf, byteIndex++, 0x80 | (code & 0x3F));
        } else {
            // Surrogate pair - 4-byte sequence
            if (i + 1 >= e) throw Error("Incomplete surrogate pair");
            let high = code;
            let low = s.charCodeAt(++i);
            if (low < 0xDC00 || low > 0xDFFF) throw Error("Invalid surrogate pair");

            let codepoint = 0x10000 + ((high & 0x3FF) << 10) + (low & 0x3FF);
            if (byteIndex >= maxSize - 4) throw Error("String too long");
            _ptr_write_char(buf, byteIndex++, 0xF0 | (codepoint >> 18));
            _ptr_write_char(buf, byteIndex++, 0x80 | ((codepoint >> 12) & 0x3F));
            _ptr_write_char(buf, byteIndex++, 0x80 | ((codepoint >> 6) & 0x3F));
            _ptr_write_char(buf, byteIndex++, 0x80 | (codepoint & 0x3F));
        }
    }
    _ptr_write_char(buf, byteIndex, 0);
    return byteIndex;
}

/// Convert a JS string to ASCIIZ.
function stringToAsciiz(s: any): c_ptr {
    "use unsafe";

    if (typeof s !== "string") s = String(s);
    let buf = malloc(s.length + 1);
    try {
        copyToAsciiz(s, buf, s.length + 1);
        return buf;
    } catch (e) {
        _free(buf);
        throw e;
    }
}

/// Convert a JS string to UTF-8 with temp allocation.
function tmpUtf8(s: any): c_ptr {
    "use unsafe";

    if (typeof s !== "string") s = String(s);
    // UTF-8 can be up to 4 bytes per char, so allocate conservatively
    let buf = allocTmp(s.length * 4 + 1);
    copyToUtf8(s, buf, s.length * 4 + 1);
    return buf;
}

/// Convert a JS string to ASCIIZ.
function tmpAsciiz(s: any): c_ptr {
    "use unsafe";

    if (typeof s !== "string") s = String(s);
    let buf = allocTmp(s.length + 1);
    copyToAsciiz(s, buf, s.length + 1);
    return buf;
}


let _allocas: c_ptr[] = [];

function allocTmp(size: number): c_ptr {
    let res = calloc(size);
    _allocas.push(res);
    return res;
}

function flushAllocTmp(): void {
    for (let i = 0; i < _allocas.length; ++i) {
        _free(_allocas[i]);
    }
    let empty: c_ptr[] = [];
    _allocas = empty;
}