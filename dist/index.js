// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/abstract-logging/index.js
var require_abstract_logging = __commonJS(function(exports, module) {
  function noop() {}
  var proto = {
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop
  };
  Object.defineProperty(module, "exports", {
    get() {
      return Object.create(proto);
    }
  });
});

// node_modules/ldapjs/lib/logger.js
var require_logger = __commonJS(function(exports, module) {
  var logger = require_abstract_logging();
  logger.child = function() {
    return logger;
  };
  module.exports = logger;
});

// node_modules/ldapjs/lib/client/request-queue/enqueue.js
var require_enqueue = __commonJS(function(exports, module) {
  module.exports = function enqueue(message, expect, emitter, cb) {
    if (this._queue.size >= this.size || this._frozen) {
      return false;
    }
    this._queue.add({ message, expect, emitter, cb });
    if (this.timeout === 0)
      return true;
    if (this._timer === null)
      return true;
    this._timer = setTimeout(queueTimeout.bind(this), this.timeout);
    return true;
    function queueTimeout() {
      this.freeze();
      this.purge();
    }
  };
});

// node_modules/ldapjs/lib/client/request-queue/flush.js
var require_flush = __commonJS(function(exports, module) {
  module.exports = function flush(cb) {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    const requests = Array.from(this._queue.values());
    this._queue.clear();
    for (const req of requests) {
      cb(req.message, req.expect, req.emitter, req.cb);
    }
  };
});

// node_modules/assert-plus/assert.js
var require_assert = __commonJS(function(exports, module) {
  var assert = __require("assert");
  var Stream = __require("stream").Stream;
  var util = __require("util");
  var UUID_REGEXP = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
  function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function _toss(name, expected, oper, arg, actual) {
    throw new assert.AssertionError({
      message: util.format("%s (%s) is required", name, expected),
      actual: actual === undefined ? typeof arg : actual(arg),
      expected,
      operator: oper || "===",
      stackStartFunction: _toss.caller
    });
  }
  function _getClass(arg) {
    return Object.prototype.toString.call(arg).slice(8, -1);
  }
  function noop() {}
  var types = {
    bool: {
      check: function(arg) {
        return typeof arg === "boolean";
      }
    },
    func: {
      check: function(arg) {
        return typeof arg === "function";
      }
    },
    string: {
      check: function(arg) {
        return typeof arg === "string";
      }
    },
    object: {
      check: function(arg) {
        return typeof arg === "object" && arg !== null;
      }
    },
    number: {
      check: function(arg) {
        return typeof arg === "number" && !isNaN(arg);
      }
    },
    finite: {
      check: function(arg) {
        return typeof arg === "number" && !isNaN(arg) && isFinite(arg);
      }
    },
    buffer: {
      check: function(arg) {
        return Buffer.isBuffer(arg);
      },
      operator: "Buffer.isBuffer"
    },
    array: {
      check: function(arg) {
        return Array.isArray(arg);
      },
      operator: "Array.isArray"
    },
    stream: {
      check: function(arg) {
        return arg instanceof Stream;
      },
      operator: "instanceof",
      actual: _getClass
    },
    date: {
      check: function(arg) {
        return arg instanceof Date;
      },
      operator: "instanceof",
      actual: _getClass
    },
    regexp: {
      check: function(arg) {
        return arg instanceof RegExp;
      },
      operator: "instanceof",
      actual: _getClass
    },
    uuid: {
      check: function(arg) {
        return typeof arg === "string" && UUID_REGEXP.test(arg);
      },
      operator: "isUUID"
    }
  };
  function _setExports(ndebug) {
    var keys = Object.keys(types);
    var out;
    if (process.env.NODE_NDEBUG) {
      out = noop;
    } else {
      out = function(arg, msg) {
        if (!arg) {
          _toss(msg, "true", arg);
        }
      };
    }
    keys.forEach(function(k) {
      if (ndebug) {
        out[k] = noop;
        return;
      }
      var type = types[k];
      out[k] = function(arg, msg) {
        if (!type.check(arg)) {
          _toss(msg, k, type.operator, arg, type.actual);
        }
      };
    });
    keys.forEach(function(k) {
      var name = "optional" + _capitalize(k);
      if (ndebug) {
        out[name] = noop;
        return;
      }
      var type = types[k];
      out[name] = function(arg, msg) {
        if (arg === undefined || arg === null) {
          return;
        }
        if (!type.check(arg)) {
          _toss(msg, k, type.operator, arg, type.actual);
        }
      };
    });
    keys.forEach(function(k) {
      var name = "arrayOf" + _capitalize(k);
      if (ndebug) {
        out[name] = noop;
        return;
      }
      var type = types[k];
      var expected = "[" + k + "]";
      out[name] = function(arg, msg) {
        if (!Array.isArray(arg)) {
          _toss(msg, expected, type.operator, arg, type.actual);
        }
        var i;
        for (i = 0;i < arg.length; i++) {
          if (!type.check(arg[i])) {
            _toss(msg, expected, type.operator, arg, type.actual);
          }
        }
      };
    });
    keys.forEach(function(k) {
      var name = "optionalArrayOf" + _capitalize(k);
      if (ndebug) {
        out[name] = noop;
        return;
      }
      var type = types[k];
      var expected = "[" + k + "]";
      out[name] = function(arg, msg) {
        if (arg === undefined || arg === null) {
          return;
        }
        if (!Array.isArray(arg)) {
          _toss(msg, expected, type.operator, arg, type.actual);
        }
        var i;
        for (i = 0;i < arg.length; i++) {
          if (!type.check(arg[i])) {
            _toss(msg, expected, type.operator, arg, type.actual);
          }
        }
      };
    });
    Object.keys(assert).forEach(function(k) {
      if (k === "AssertionError") {
        out[k] = assert[k];
        return;
      }
      if (ndebug) {
        out[k] = noop;
        return;
      }
      out[k] = assert[k];
    });
    out._setExports = _setExports;
    return out;
  }
  module.exports = _setExports(process.env.NODE_NDEBUG);
});

// node_modules/@ldapjs/asn1/lib/ber/types.js
var require_types = __commonJS(function(exports, module) {
  module.exports = {
    EOC: 0,
    Boolean: 1,
    Integer: 2,
    BitString: 3,
    OctetString: 4,
    Null: 5,
    OID: 6,
    ObjectDescriptor: 7,
    External: 8,
    Real: 9,
    Enumeration: 10,
    PDV: 11,
    Utf8String: 12,
    RelativeOID: 13,
    Sequence: 16,
    Set: 17,
    NumericString: 18,
    PrintableString: 19,
    T61String: 20,
    VideotexString: 21,
    IA5String: 22,
    UTCTime: 23,
    GeneralizedTime: 24,
    GraphicString: 25,
    VisibleString: 26,
    GeneralString: 28,
    UniversalString: 29,
    CharacterString: 30,
    BMPString: 31,
    Constructor: 32,
    LDAPSequence: 48,
    Context: 128
  };
});

// node_modules/@ldapjs/asn1/lib/buffer-to-hex-dump.js
var require_buffer_to_hex_dump = __commonJS(function(exports, module) {
  var { createWriteStream } = __require("fs");
  module.exports = function bufferToHexDump({
    buffer,
    prefix = "",
    separator = "",
    wrapCharacters = [],
    width = 10,
    destination = process.stdout,
    closeDestination = false
  }) {
    let closeStream = closeDestination;
    if (typeof destination === "string") {
      destination = createWriteStream(destination);
      closeStream = true;
    }
    if (wrapCharacters[0]) {
      destination.write(wrapCharacters[0]);
    }
    for (const [i, byte] of buffer.entries()) {
      const outByte = Number(byte).toString(16).padStart(2, "0");
      destination.write(prefix + outByte);
      if (i !== buffer.byteLength - 1) {
        destination.write(separator);
      }
      if ((i + 1) % width === 0) {
        destination.write(`
`);
      }
    }
    if (wrapCharacters[1]) {
      destination.write(wrapCharacters[1]);
    }
    if (closeStream === true) {
      destination.end();
    }
  };
});

// node_modules/@ldapjs/asn1/lib/ber/reader.js
var require_reader = __commonJS(function(exports, module) {
  var types = require_types();
  var bufferToHexDump = require_buffer_to_hex_dump();

  class BerReader {
    #buffer;
    #size;
    #currentFieldLength = 0;
    #currentSequenceStart = 0;
    #offset = 0;
    constructor(buffer) {
      if (Buffer.isBuffer(buffer) === false) {
        throw TypeError("Must supply a Buffer instance to read.");
      }
      this.#buffer = buffer.subarray(0);
      this.#size = this.#buffer.length;
    }
    get [Symbol.toStringTag]() {
      return "BerReader";
    }
    get buffer() {
      return this.#buffer.subarray(0);
    }
    get length() {
      return this.#currentFieldLength;
    }
    get offset() {
      return this.#offset;
    }
    get remain() {
      return this.#size - this.#offset;
    }
    peek() {
      return this.readByte(true);
    }
    readBoolean(tag = types.Boolean) {
      const intBuffer = this.readTag(tag);
      this.#offset += intBuffer.length;
      const int = parseIntegerBuffer(intBuffer);
      return int !== 0;
    }
    readByte(peek = false) {
      if (this.#size - this.#offset < 1) {
        return null;
      }
      const byte = this.#buffer[this.#offset] & 255;
      if (peek !== true) {
        this.#offset += 1;
      }
      return byte;
    }
    readEnumeration() {
      const intBuffer = this.readTag(types.Enumeration);
      this.#offset += intBuffer.length;
      return parseIntegerBuffer(intBuffer);
    }
    readInt(tag = types.Integer) {
      const intBuffer = this.readTag(tag);
      this.#offset += intBuffer.length;
      return parseIntegerBuffer(intBuffer);
    }
    readLength(offset) {
      if (offset === undefined) {
        offset = this.#offset;
      }
      if (offset >= this.#size) {
        return null;
      }
      let lengthByte = this.#buffer[offset++] & 255;
      if ((lengthByte & 128) === 128) {
        lengthByte &= 127;
        if (lengthByte === 0) {
          throw Error("Indefinite length not supported.");
        }
        if (lengthByte > 4) {
          throw Error("Encoding too long.");
        }
        if (this.#size - offset < lengthByte) {
          return null;
        }
        this.#currentFieldLength = 0;
        for (let i = 0;i < lengthByte; i++) {
          this.#currentFieldLength = (this.#currentFieldLength << 8) + (this.#buffer[offset++] & 255);
        }
      } else {
        this.#currentFieldLength = lengthByte;
      }
      return offset;
    }
    readOID(tag = types.OID) {
      const oidBuffer = this.readString(tag, true);
      if (oidBuffer === null) {
        return null;
      }
      const values = [];
      let value = 0;
      for (let i = 0;i < oidBuffer.length; i++) {
        const byte = oidBuffer[i] & 255;
        value <<= 7;
        value += byte & 127;
        if ((byte & 128) === 0) {
          values.push(value);
          value = 0;
        }
      }
      value = values.shift();
      values.unshift(value % 40);
      values.unshift(value / 40 >> 0);
      return values.join(".");
    }
    readRawBuffer(tag, advanceOffset = true) {
      if (Number.isInteger(tag) === false) {
        throw Error("must specify an integer tag");
      }
      const foundTag = this.peek();
      if (foundTag !== tag) {
        const expected = tag.toString(16).padStart(2, "0");
        const found = foundTag.toString(16).padStart(2, "0");
        throw Error(`Expected 0x${expected}: got 0x${found}`);
      }
      const currentOffset = this.#offset;
      const valueOffset = this.readLength(currentOffset + 1);
      if (valueOffset === null) {
        return null;
      }
      const valueBytesLength = this.length;
      const numTagAndLengthBytes = valueOffset - currentOffset;
      const endPos = currentOffset + valueBytesLength + numTagAndLengthBytes;
      if (endPos > this.buffer.byteLength) {
        return null;
      }
      const buffer = this.buffer.subarray(currentOffset, endPos);
      if (advanceOffset === true) {
        this.setOffset(currentOffset + (valueBytesLength + numTagAndLengthBytes));
      }
      return buffer;
    }
    readSequence(tag) {
      const foundTag = this.peek();
      if (tag !== undefined && tag !== foundTag) {
        const expected = tag.toString(16).padStart(2, "0");
        const found = foundTag.toString(16).padStart(2, "0");
        throw Error(`Expected 0x${expected}: got 0x${found}`);
      }
      this.#currentSequenceStart = this.#offset;
      const valueOffset = this.readLength(this.#offset + 1);
      if (valueOffset === null) {
        return null;
      }
      this.#offset = valueOffset;
      return foundTag;
    }
    readString(tag = types.OctetString, asBuffer = false) {
      const tagByte = this.peek();
      if (tagByte !== tag) {
        const expected = tag.toString(16).padStart(2, "0");
        const found = tagByte.toString(16).padStart(2, "0");
        throw Error(`Expected 0x${expected}: got 0x${found}`);
      }
      const valueOffset = this.readLength(this.#offset + 1);
      if (valueOffset === null) {
        return null;
      }
      if (this.length > this.#size - valueOffset) {
        return null;
      }
      this.#offset = valueOffset;
      if (this.length === 0) {
        return asBuffer ? Buffer.alloc(0) : "";
      }
      const str = this.#buffer.subarray(this.#offset, this.#offset + this.length);
      this.#offset += this.length;
      return asBuffer ? str : str.toString("utf8");
    }
    readTag(tag) {
      if (tag == null) {
        throw Error("Must supply an ASN.1 tag to read.");
      }
      const byte = this.peek();
      if (byte !== tag) {
        const tagString = tag.toString(16).padStart(2, "0");
        const byteString = byte.toString(16).padStart(2, "0");
        throw Error(`Expected 0x${tagString}: got 0x${byteString}`);
      }
      const fieldOffset = this.readLength(this.#offset + 1);
      if (fieldOffset === null) {
        return null;
      }
      if (this.length > this.#size - fieldOffset) {
        return null;
      }
      this.#offset = fieldOffset;
      return this.#buffer.subarray(this.#offset, this.#offset + this.length);
    }
    sequenceToReader() {
      const lengthValueLength = this.#offset - this.#currentSequenceStart;
      const buffer = this.#buffer.subarray(this.#currentSequenceStart, this.#currentSequenceStart + (lengthValueLength + this.#currentFieldLength));
      return new BerReader(buffer);
    }
    setOffset(position) {
      if (Number.isInteger(position) === false) {
        throw Error("Must supply an integer position.");
      }
      this.#offset = position;
    }
    toHexDump(params) {
      bufferToHexDump({
        ...params,
        buffer: this.buffer
      });
    }
  }
  function parseIntegerBuffer(integerBuffer) {
    let value = 0;
    let i;
    for (i = 0;i < integerBuffer.length; i++) {
      value <<= 8;
      value |= integerBuffer[i] & 255;
    }
    if ((integerBuffer[0] & 128) === 128 && i !== 4) {
      value -= 1 << i * 8;
    }
    return value >> 0;
  }
  module.exports = BerReader;
});

// node_modules/@ldapjs/asn1/lib/ber/writer.js
var require_writer = __commonJS(function(exports, module) {
  var types = require_types();
  var bufferToHexDump = require_buffer_to_hex_dump();

  class BerWriter {
    #buffer;
    #size;
    #offset = 0;
    #sequenceOffsets = [];
    #growthFactor;
    constructor({ size = 1024, growthFactor = 8 } = {}) {
      this.#buffer = Buffer.alloc(size);
      this.#size = this.#buffer.length;
      this.#offset = 0;
      this.#growthFactor = growthFactor;
    }
    get [Symbol.toStringTag]() {
      return "BerWriter";
    }
    get buffer() {
      return this.#buffer.subarray(0, this.#offset);
    }
    get size() {
      return this.#size;
    }
    appendBuffer(buffer) {
      if (Buffer.isBuffer(buffer) === false) {
        throw Error("buffer must be an instance of Buffer");
      }
      this.#ensureBufferCapacity(buffer.length);
      buffer.copy(this.#buffer, this.#offset, 0, buffer.length);
      this.#offset += buffer.length;
    }
    endSequence() {
      const sequenceStartOffset = this.#sequenceOffsets.pop();
      const start = sequenceStartOffset + 3;
      const length = this.#offset - start;
      if (length <= 127) {
        this.#shift(start, length, -2);
        this.#buffer[sequenceStartOffset] = length;
      } else if (length <= 255) {
        this.#shift(start, length, -1);
        this.#buffer[sequenceStartOffset] = 129;
        this.#buffer[sequenceStartOffset + 1] = length;
      } else if (length <= 65535) {
        this.#buffer[sequenceStartOffset] = 130;
        this.#buffer[sequenceStartOffset + 1] = length >> 8;
        this.#buffer[sequenceStartOffset + 2] = length;
      } else if (length <= 16777215) {
        this.#shift(start, length, 1);
        this.#buffer[sequenceStartOffset] = 131;
        this.#buffer[sequenceStartOffset + 1] = length >> 16;
        this.#buffer[sequenceStartOffset + 2] = length >> 8;
        this.#buffer[sequenceStartOffset + 3] = length;
      } else {
        throw Error("sequence too long");
      }
    }
    startSequence(tag = types.Sequence | types.Constructor) {
      if (typeof tag !== "number") {
        throw TypeError("tag must be a Number");
      }
      this.writeByte(tag);
      this.#sequenceOffsets.push(this.#offset);
      this.#ensureBufferCapacity(3);
      this.#offset += 3;
    }
    toHexDump(params) {
      bufferToHexDump({
        ...params,
        buffer: this.buffer
      });
    }
    writeBoolean(boolValue, tag = types.Boolean) {
      if (typeof boolValue !== "boolean") {
        throw TypeError("boolValue must be a Boolean");
      }
      if (typeof tag !== "number") {
        throw TypeError("tag must be a Number");
      }
      this.#ensureBufferCapacity(3);
      this.#buffer[this.#offset++] = tag;
      this.#buffer[this.#offset++] = 1;
      this.#buffer[this.#offset++] = boolValue === true ? 255 : 0;
    }
    writeBuffer(buffer, tag) {
      if (typeof tag !== "number") {
        throw TypeError("tag must be a Number");
      }
      if (Buffer.isBuffer(buffer) === false) {
        throw TypeError("buffer must be an instance of Buffer");
      }
      this.writeByte(tag);
      this.writeLength(buffer.length);
      this.#ensureBufferCapacity(buffer.length);
      buffer.copy(this.#buffer, this.#offset, 0, buffer.length);
      this.#offset += buffer.length;
    }
    writeByte(byte) {
      if (typeof byte !== "number") {
        throw TypeError("argument must be a Number");
      }
      this.#ensureBufferCapacity(1);
      this.#buffer[this.#offset++] = byte;
    }
    writeEnumeration(value, tag = types.Enumeration) {
      if (typeof value !== "number") {
        throw TypeError("value must be a Number");
      }
      if (typeof tag !== "number") {
        throw TypeError("tag must be a Number");
      }
      this.writeInt(value, tag);
    }
    writeInt(intToWrite, tag = types.Integer) {
      if (typeof intToWrite !== "number") {
        throw TypeError("intToWrite must be a Number");
      }
      if (typeof tag !== "number") {
        throw TypeError("tag must be a Number");
      }
      let intSize = 4;
      while (((intToWrite & 4286578688) === 0 || (intToWrite & 4286578688) === 4286578688 >> 0) && intSize > 1) {
        intSize--;
        intToWrite <<= 8;
      }
      if (intSize > 4) {
        throw Error("BER ints cannot be > 0xffffffff");
      }
      this.#ensureBufferCapacity(2 + intSize);
      this.#buffer[this.#offset++] = tag;
      this.#buffer[this.#offset++] = intSize;
      while (intSize-- > 0) {
        this.#buffer[this.#offset++] = (intToWrite & 4278190080) >>> 24;
        intToWrite <<= 8;
      }
    }
    writeLength(len) {
      if (typeof len !== "number") {
        throw TypeError("argument must be a Number");
      }
      this.#ensureBufferCapacity(4);
      if (len <= 127) {
        this.#buffer[this.#offset++] = len;
      } else if (len <= 255) {
        this.#buffer[this.#offset++] = 129;
        this.#buffer[this.#offset++] = len;
      } else if (len <= 65535) {
        this.#buffer[this.#offset++] = 130;
        this.#buffer[this.#offset++] = len >> 8;
        this.#buffer[this.#offset++] = len;
      } else if (len <= 16777215) {
        this.#buffer[this.#offset++] = 131;
        this.#buffer[this.#offset++] = len >> 16;
        this.#buffer[this.#offset++] = len >> 8;
        this.#buffer[this.#offset++] = len;
      } else {
        throw Error("length too long (> 4 bytes)");
      }
    }
    writeNull() {
      this.writeByte(types.Null);
      this.writeByte(0);
    }
    writeOID(oidString, tag = types.OID) {
      if (typeof oidString !== "string") {
        throw TypeError("oidString must be a string");
      }
      if (typeof tag !== "number") {
        throw TypeError("tag must be a Number");
      }
      if (/^([0-9]+\.){3,}[0-9]+$/.test(oidString) === false) {
        throw Error("oidString is not a valid OID string");
      }
      const parts = oidString.split(".");
      const bytes = [];
      bytes.push(parseInt(parts[0], 10) * 40 + parseInt(parts[1], 10));
      for (const part of parts.slice(2)) {
        encodeOctet(bytes, parseInt(part, 10));
      }
      this.#ensureBufferCapacity(2 + bytes.length);
      this.writeByte(tag);
      this.writeLength(bytes.length);
      this.appendBuffer(Buffer.from(bytes));
      function encodeOctet(bytes, octet) {
        if (octet < 128) {
          bytes.push(octet);
        } else if (octet < 16384) {
          bytes.push(octet >>> 7 | 128);
          bytes.push(octet & 127);
        } else if (octet < 2097152) {
          bytes.push(octet >>> 14 | 128);
          bytes.push((octet >>> 7 | 128) & 255);
          bytes.push(octet & 127);
        } else if (octet < 268435456) {
          bytes.push(octet >>> 21 | 128);
          bytes.push((octet >>> 14 | 128) & 255);
          bytes.push((octet >>> 7 | 128) & 255);
          bytes.push(octet & 127);
        } else {
          bytes.push((octet >>> 28 | 128) & 255);
          bytes.push((octet >>> 21 | 128) & 255);
          bytes.push((octet >>> 14 | 128) & 255);
          bytes.push((octet >>> 7 | 128) & 255);
          bytes.push(octet & 127);
        }
      }
    }
    writeString(stringToWrite, tag = types.OctetString) {
      if (typeof stringToWrite !== "string") {
        throw TypeError("stringToWrite must be a string");
      }
      if (typeof tag !== "number") {
        throw TypeError("tag must be a number");
      }
      const toWriteLength = Buffer.byteLength(stringToWrite);
      this.writeByte(tag);
      this.writeLength(toWriteLength);
      if (toWriteLength > 0) {
        this.#ensureBufferCapacity(toWriteLength);
        this.#buffer.write(stringToWrite, this.#offset);
        this.#offset += toWriteLength;
      }
    }
    writeStringArray(strings) {
      if (Array.isArray(strings) === false) {
        throw TypeError("strings must be an instance of Array");
      }
      for (const string of strings) {
        this.writeString(string);
      }
    }
    #ensureBufferCapacity(numberOfBytesToWrite) {
      if (this.#size - this.#offset < numberOfBytesToWrite) {
        let newSize = this.#size * this.#growthFactor;
        if (newSize - this.#offset < numberOfBytesToWrite) {
          newSize += numberOfBytesToWrite;
        }
        const newBuffer = Buffer.alloc(newSize);
        this.#buffer.copy(newBuffer, 0, 0, this.#offset);
        this.#buffer = newBuffer;
        this.#size = newSize;
      }
    }
    #shift(start, length, shiftAmount) {
      this.#buffer.copy(this.#buffer, start + shiftAmount, start, start + length);
      this.#offset += shiftAmount;
    }
  }
  module.exports = BerWriter;
});

// node_modules/@ldapjs/asn1/index.js
var require_asn1 = __commonJS(function(exports, module) {
  var BerReader = require_reader();
  var BerWriter = require_writer();
  var BerTypes = require_types();
  var bufferToHexDump = require_buffer_to_hex_dump();
  module.exports = {
    BerReader,
    BerTypes,
    BerWriter,
    bufferToHexDump
  };
});

// node_modules/process-warning/index.js
var require_process_warning = __commonJS(function(exports, module) {
  var { format } = __require("util");
  function processWarning() {
    const codes = {};
    const emitted = new Map;
    const opts = Object.create(null);
    function create(name, code, message, { unlimited = false } = {}) {
      if (!name)
        throw new Error("Warning name must not be empty");
      if (!code)
        throw new Error("Warning code must not be empty");
      if (!message)
        throw new Error("Warning message must not be empty");
      if (typeof unlimited !== "boolean")
        throw new Error("Warning opts.unlimited must be a boolean");
      code = code.toUpperCase();
      if (codes[code] !== undefined) {
        throw new Error(`The code '${code}' already exist`);
      }
      function buildWarnOpts(a, b, c) {
        let formatted;
        if (a && b && c) {
          formatted = format(message, a, b, c);
        } else if (a && b) {
          formatted = format(message, a, b);
        } else if (a) {
          formatted = format(message, a);
        } else {
          formatted = message;
        }
        return {
          code,
          name,
          message: formatted
        };
      }
      Object.assign(opts, { unlimited });
      emitted.set(code, unlimited);
      codes[code] = buildWarnOpts;
      return codes[code];
    }
    function createDeprecation(code, message, opts = {}) {
      return create("DeprecationWarning", code, message, opts);
    }
    function emit(code, a, b, c) {
      if (emitted.get(code) === true && opts.unlimited === false)
        return;
      if (codes[code] === undefined)
        throw new Error(`The code '${code}' does not exist`);
      emitted.set(code, true);
      const warning = codes[code](a, b, c);
      process.emitWarning(warning.message, warning.name, warning.code);
    }
    return {
      create,
      createDeprecation,
      emit,
      emitted
    };
  }
  module.exports = processWarning;
  module.exports.default = processWarning;
  module.exports.processWarning = processWarning;
});

// node_modules/@ldapjs/messages/lib/deprecations.js
var require_deprecations = __commonJS(function(exports, module) {
  var warning = require_process_warning()();
  var clazz = "LdapjsMessageWarning";
  warning.create(clazz, "LDAP_MESSAGE_DEP_001", "messageID is deprecated. Use messageId instead.");
  warning.create(clazz, "LDAP_MESSAGE_DEP_002", "The .json property is deprecated. Use .pojo instead.");
  warning.create(clazz, "LDAP_MESSAGE_DEP_003", "abandonID is deprecated. Use abandonId instead.");
  warning.create(clazz, "LDAP_MESSAGE_DEP_004", "errorMessage is deprecated. Use diagnosticMessage instead.");
  warning.create(clazz, "LDAP_ATTRIBUTE_SPEC_ERR_001", "received attempt to define attribute with an empty name: attribute skipped.", { unlimited: true });
  module.exports = warning;
});

// node_modules/@ldapjs/protocol/index.js
var require_protocol = __commonJS(function(exports, module) {
  var core = Object.freeze({
    LDAP_VERSION_3: 3,
    LBER_SET: 49,
    LDAP_CONTROLS: 160
  });
  var operations = Object.freeze({
    LDAP_REQ_BIND: 96,
    LDAP_REQ_UNBIND: 66,
    LDAP_REQ_SEARCH: 99,
    LDAP_REQ_MODIFY: 102,
    LDAP_REQ_ADD: 104,
    LDAP_REQ_DELETE: 74,
    LDAP_REQ_MODRDN: 108,
    LDAP_REQ_COMPARE: 110,
    LDAP_REQ_ABANDON: 80,
    LDAP_REQ_EXTENSION: 119,
    LDAP_RES_BIND: 97,
    LDAP_RES_SEARCH_ENTRY: 100,
    LDAP_RES_SEARCH_DONE: 101,
    LDAP_RES_SEARCH_REF: 115,
    LDAP_RES_SEARCH: 101,
    LDAP_RES_MODIFY: 103,
    LDAP_RES_ADD: 105,
    LDAP_RES_DELETE: 107,
    LDAP_RES_MODRDN: 109,
    LDAP_RES_COMPARE: 111,
    LDAP_RES_EXTENSION: 120,
    LDAP_RES_INTERMEDIATE: 121,
    LDAP_RES_REFERRAL: 163
  });
  var resultCodes = Object.freeze({
    SUCCESS: 0,
    OPERATIONS_ERROR: 1,
    PROTOCOL_ERROR: 2,
    TIME_LIMIT_EXCEEDED: 3,
    SIZE_LIMIT_EXCEEDED: 4,
    COMPARE_FALSE: 5,
    COMPARE_TRUE: 6,
    AUTH_METHOD_NOT_SUPPORTED: 7,
    STRONGER_AUTH_REQUIRED: 8,
    REFERRAL: 10,
    ADMIN_LIMIT_EXCEEDED: 11,
    UNAVAILABLE_CRITICAL_EXTENSION: 12,
    CONFIDENTIALITY_REQUIRED: 13,
    SASL_BIND_IN_PROGRESS: 14,
    NO_SUCH_ATTRIBUTE: 16,
    UNDEFINED_ATTRIBUTE_TYPE: 17,
    INAPPROPRIATE_MATCHING: 18,
    CONSTRAINT_VIOLATION: 19,
    ATTRIBUTE_OR_VALUE_EXISTS: 20,
    INVALID_ATTRIBUTE_SYNTAX: 21,
    NO_SUCH_OBJECT: 32,
    ALIAS_PROBLEM: 33,
    INVALID_DN_SYNTAX: 34,
    IS_LEAF: 35,
    ALIAS_DEREFERENCING_PROBLEM: 36,
    INAPPROPRIATE_AUTHENTICATION: 48,
    INVALID_CREDENTIALS: 49,
    INSUFFICIENT_ACCESS_RIGHTS: 50,
    BUSY: 51,
    UNAVAILABLE: 52,
    UNWILLING_TO_PERFORM: 53,
    LOOP_DETECT: 54,
    SORT_CONTROL_MISSING: 60,
    OFFSET_RANGE_ERROR: 61,
    NAMING_VIOLATION: 64,
    OBJECT_CLASS_VIOLATION: 65,
    NOT_ALLOWED_ON_NON_LEAF: 66,
    NOT_ALLOWED_ON_RDN: 67,
    ENTRY_ALREADY_EXISTS: 68,
    OBJECT_CLASS_MODS_PROHIBITED: 69,
    RESULTS_TOO_LARGE: 70,
    AFFECTS_MULTIPLE_DSAS: 71,
    CONTROL_ERROR: 76,
    OTHER: 80,
    SERVER_DOWN: 81,
    LOCAL_ERROR: 82,
    ENCODING_ERROR: 83,
    DECODING_ERROR: 84,
    TIMEOUT: 85,
    AUTH_UNKNOWN: 86,
    FILTER_ERROR: 87,
    USER_CANCELED: 88,
    PARAM_ERROR: 89,
    NO_MEMORY: 90,
    CONNECT_ERROR: 91,
    NOT_SUPPORTED: 92,
    CONTROL_NOT_FOUND: 93,
    NO_RESULTS_RETURNED: 94,
    MORE_RESULTS_TO_RETURN: 95,
    CLIENT_LOOP: 96,
    REFERRAL_LIMIT_EXCEEDED: 97,
    INVALID_RESPONSE: 100,
    AMBIGUOUS_RESPONSE: 101,
    TLS_NOT_SUPPORTED: 112,
    INTERMEDIATE_RESPONSE: 113,
    UNKNOWN_TYPE: 114,
    CANCELED: 118,
    NO_SUCH_OPERATION: 119,
    TOO_LATE: 120,
    CANNOT_CANCEL: 121,
    ASSERTION_FAILED: 122,
    AUTHORIZATION_DENIED: 123,
    E_SYNC_REFRESH_REQUIRED: 4096,
    NO_OPERATION: 16654
  });
  var search = Object.freeze({
    SCOPE_BASE_OBJECT: 0,
    SCOPE_ONE_LEVEL: 1,
    SCOPE_SUBTREE: 2,
    NEVER_DEREF_ALIASES: 0,
    DEREF_IN_SEARCHING: 1,
    DEREF_BASE_OBJECT: 2,
    DEREF_ALWAYS: 3,
    FILTER_AND: 160,
    FILTER_OR: 161,
    FILTER_NOT: 162,
    FILTER_EQUALITY: 163,
    FILTER_SUBSTRINGS: 164,
    FILTER_GE: 165,
    FILTER_LE: 166,
    FILTER_PRESENT: 135,
    FILTER_APPROX: 168,
    FILTER_EXT: 169
  });
  module.exports = Object.freeze({
    core,
    operations,
    resultCodes,
    search,
    resultCodeToName
  });
  function resultCodeToName(code) {
    for (const [key, value] of Object.entries(resultCodes)) {
      if (value === code)
        return key;
    }
  }
});

// node_modules/@ldapjs/controls/node_modules/@ldapjs/asn1/lib/ber/errors.js
var require_errors = __commonJS(function(exports, module) {
  module.exports = {
    newInvalidAsn1Error: function(msg) {
      const e = new Error;
      e.name = "InvalidAsn1Error";
      e.message = msg || "";
      return e;
    }
  };
});

// node_modules/@ldapjs/controls/node_modules/@ldapjs/asn1/lib/ber/types.js
var require_types2 = __commonJS(function(exports, module) {
  module.exports = {
    EOC: 0,
    Boolean: 1,
    Integer: 2,
    BitString: 3,
    OctetString: 4,
    Null: 5,
    OID: 6,
    ObjectDescriptor: 7,
    External: 8,
    Real: 9,
    Enumeration: 10,
    PDV: 11,
    Utf8String: 12,
    RelativeOID: 13,
    Sequence: 16,
    Set: 17,
    NumericString: 18,
    PrintableString: 19,
    T61String: 20,
    VideotexString: 21,
    IA5String: 22,
    UTCTime: 23,
    GeneralizedTime: 24,
    GraphicString: 25,
    VisibleString: 26,
    GeneralString: 28,
    UniversalString: 29,
    CharacterString: 30,
    BMPString: 31,
    Constructor: 32,
    Context: 128
  };
});

// node_modules/@ldapjs/controls/node_modules/@ldapjs/asn1/lib/ber/reader.js
var require_reader2 = __commonJS(function(exports, module) {
  var assert = __require("assert");
  var ASN1 = require_types2();
  var errors = require_errors();
  var newInvalidAsn1Error = errors.newInvalidAsn1Error;
  function Reader(data) {
    if (!data || !Buffer.isBuffer(data)) {
      throw new TypeError("data must be a node Buffer");
    }
    this._buf = data;
    this._size = data.length;
    this._len = 0;
    this._offset = 0;
  }
  Object.defineProperty(Reader.prototype, Symbol.toStringTag, { value: "BerReader" });
  Object.defineProperty(Reader.prototype, "length", {
    enumerable: true,
    get: function() {
      return this._len;
    }
  });
  Object.defineProperty(Reader.prototype, "offset", {
    enumerable: true,
    get: function() {
      return this._offset;
    }
  });
  Object.defineProperty(Reader.prototype, "remain", {
    get: function() {
      return this._size - this._offset;
    }
  });
  Object.defineProperty(Reader.prototype, "buffer", {
    get: function() {
      return this._buf.slice(this._offset);
    }
  });
  Reader.prototype.readByte = function(peek) {
    if (this._size - this._offset < 1) {
      return null;
    }
    const b = this._buf[this._offset] & 255;
    if (!peek) {
      this._offset += 1;
    }
    return b;
  };
  Reader.prototype.peek = function() {
    return this.readByte(true);
  };
  Reader.prototype.readLength = function(offset) {
    if (offset === undefined) {
      offset = this._offset;
    }
    if (offset >= this._size) {
      return null;
    }
    let lenB = this._buf[offset++] & 255;
    if (lenB === null) {
      return null;
    }
    if ((lenB & 128) === 128) {
      lenB &= 127;
      if (lenB === 0) {
        throw newInvalidAsn1Error("Indefinite length not supported");
      }
      if (lenB > 4) {
        throw newInvalidAsn1Error("encoding too long");
      }
      if (this._size - offset < lenB) {
        return null;
      }
      this._len = 0;
      for (let i = 0;i < lenB; i++) {
        this._len = (this._len << 8) + (this._buf[offset++] & 255);
      }
    } else {
      this._len = lenB;
    }
    return offset;
  };
  Reader.prototype.readSequence = function(tag) {
    const seq = this.peek();
    if (seq === null) {
      return null;
    }
    if (tag !== undefined && tag !== seq) {
      throw newInvalidAsn1Error("Expected 0x" + tag.toString(16) + ": got 0x" + seq.toString(16));
    }
    const o = this.readLength(this._offset + 1);
    if (o === null) {
      return null;
    }
    this._offset = o;
    return seq;
  };
  Reader.prototype.readInt = function() {
    return this._readTag(ASN1.Integer);
  };
  Reader.prototype.readBoolean = function(tag) {
    return this._readTag(tag || ASN1.Boolean) !== 0;
  };
  Reader.prototype.readEnumeration = function() {
    return this._readTag(ASN1.Enumeration);
  };
  Reader.prototype.readString = function(tag, retbuf) {
    if (!tag) {
      tag = ASN1.OctetString;
    }
    const b = this.peek();
    if (b === null) {
      return null;
    }
    if (b !== tag) {
      throw newInvalidAsn1Error("Expected 0x" + tag.toString(16) + ": got 0x" + b.toString(16));
    }
    const o = this.readLength(this._offset + 1);
    if (o === null) {
      return null;
    }
    if (this.length > this._size - o) {
      return null;
    }
    this._offset = o;
    if (this.length === 0) {
      return retbuf ? Buffer.alloc(0) : "";
    }
    const str = this._buf.slice(this._offset, this._offset + this.length);
    this._offset += this.length;
    return retbuf ? str : str.toString("utf8");
  };
  Reader.prototype.readOID = function(tag) {
    if (!tag) {
      tag = ASN1.OID;
    }
    const b = this.readString(tag, true);
    if (b === null) {
      return null;
    }
    const values = [];
    let value = 0;
    for (let i = 0;i < b.length; i++) {
      const byte = b[i] & 255;
      value <<= 7;
      value += byte & 127;
      if ((byte & 128) === 0) {
        values.push(value);
        value = 0;
      }
    }
    value = values.shift();
    values.unshift(value % 40);
    values.unshift(value / 40 >> 0);
    return values.join(".");
  };
  Reader.prototype._readTag = function(tag) {
    assert.ok(tag !== undefined);
    const b = this.peek();
    if (b === null) {
      return null;
    }
    if (b !== tag) {
      throw newInvalidAsn1Error("Expected 0x" + tag.toString(16) + ": got 0x" + b.toString(16));
    }
    const o = this.readLength(this._offset + 1);
    if (o === null) {
      return null;
    }
    if (this.length > 4) {
      throw newInvalidAsn1Error("Integer too long: " + this.length);
    }
    if (this.length > this._size - o) {
      return null;
    }
    this._offset = o;
    const fb = this._buf[this._offset];
    let value = 0;
    let i;
    for (i = 0;i < this.length; i++) {
      value <<= 8;
      value |= this._buf[this._offset++] & 255;
    }
    if ((fb & 128) === 128 && i !== 4) {
      value -= 1 << i * 8;
    }
    return value >> 0;
  };
  module.exports = Reader;
});

// node_modules/@ldapjs/controls/node_modules/@ldapjs/asn1/lib/ber/writer.js
var require_writer2 = __commonJS(function(exports, module) {
  var assert = __require("assert");
  var ASN1 = require_types2();
  var errors = require_errors();
  var newInvalidAsn1Error = errors.newInvalidAsn1Error;
  var DEFAULT_OPTS = {
    size: 1024,
    growthFactor: 8
  };
  function merge(from, to) {
    assert.ok(from);
    assert.equal(typeof from, "object");
    assert.ok(to);
    assert.equal(typeof to, "object");
    const keys = Object.getOwnPropertyNames(from);
    keys.forEach(function(key) {
      if (to[key]) {
        return;
      }
      const value = Object.getOwnPropertyDescriptor(from, key);
      Object.defineProperty(to, key, value);
    });
    return to;
  }
  function Writer(options) {
    options = merge(DEFAULT_OPTS, options || {});
    this._buf = Buffer.alloc(options.size || 1024);
    this._size = this._buf.length;
    this._offset = 0;
    this._options = options;
    this._seq = [];
  }
  Object.defineProperty(Writer.prototype, Symbol.toStringTag, { value: "BerWriter" });
  Object.defineProperty(Writer.prototype, "buffer", {
    get: function() {
      if (this._seq.length) {
        throw newInvalidAsn1Error(this._seq.length + " unended sequence(s)");
      }
      return this._buf.slice(0, this._offset);
    }
  });
  Writer.prototype.appendBuffer = function appendBuffer(buffer) {
    if (Buffer.isBuffer(buffer) === false) {
      throw Error("buffer must be an instance of Buffer");
    }
    for (const b of buffer.values()) {
      this.writeByte(b);
    }
  };
  Writer.prototype.writeByte = function(b) {
    if (typeof b !== "number") {
      throw new TypeError("argument must be a Number");
    }
    this._ensure(1);
    this._buf[this._offset++] = b;
  };
  Writer.prototype.writeInt = function(i, tag) {
    if (typeof i !== "number") {
      throw new TypeError("argument must be a Number");
    }
    if (typeof tag !== "number") {
      tag = ASN1.Integer;
    }
    let sz = 4;
    while (((i & 4286578688) === 0 || (i & 4286578688) === 4286578688 >> 0) && sz > 1) {
      sz--;
      i <<= 8;
    }
    if (sz > 4) {
      throw newInvalidAsn1Error("BER ints cannot be > 0xffffffff");
    }
    this._ensure(2 + sz);
    this._buf[this._offset++] = tag;
    this._buf[this._offset++] = sz;
    while (sz-- > 0) {
      this._buf[this._offset++] = (i & 4278190080) >>> 24;
      i <<= 8;
    }
  };
  Writer.prototype.writeNull = function() {
    this.writeByte(ASN1.Null);
    this.writeByte(0);
  };
  Writer.prototype.writeEnumeration = function(i, tag) {
    if (typeof i !== "number") {
      throw new TypeError("argument must be a Number");
    }
    if (typeof tag !== "number") {
      tag = ASN1.Enumeration;
    }
    return this.writeInt(i, tag);
  };
  Writer.prototype.writeBoolean = function(b, tag) {
    if (typeof b !== "boolean") {
      throw new TypeError("argument must be a Boolean");
    }
    if (typeof tag !== "number") {
      tag = ASN1.Boolean;
    }
    this._ensure(3);
    this._buf[this._offset++] = tag;
    this._buf[this._offset++] = 1;
    this._buf[this._offset++] = b ? 255 : 0;
  };
  Writer.prototype.writeString = function(s, tag) {
    if (typeof s !== "string") {
      throw new TypeError("argument must be a string (was: " + typeof s + ")");
    }
    if (typeof tag !== "number") {
      tag = ASN1.OctetString;
    }
    const len = Buffer.byteLength(s);
    this.writeByte(tag);
    this.writeLength(len);
    if (len) {
      this._ensure(len);
      this._buf.write(s, this._offset);
      this._offset += len;
    }
  };
  Writer.prototype.writeBuffer = function(buf, tag) {
    if (typeof tag !== "number") {
      throw new TypeError("tag must be a number");
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError("argument must be a buffer");
    }
    this.writeByte(tag);
    this.writeLength(buf.length);
    this._ensure(buf.length);
    buf.copy(this._buf, this._offset, 0, buf.length);
    this._offset += buf.length;
  };
  Writer.prototype.writeStringArray = function(strings) {
    if (Array.isArray(strings) === false) {
      throw new TypeError("argument must be an Array[String]");
    }
    const self = this;
    strings.forEach(function(s) {
      self.writeString(s);
    });
  };
  Writer.prototype.writeOID = function(s, tag) {
    if (typeof s !== "string") {
      throw new TypeError("argument must be a string");
    }
    if (typeof tag !== "number") {
      tag = ASN1.OID;
    }
    if (!/^([0-9]+\.){3,}[0-9]+$/.test(s)) {
      throw new Error("argument is not a valid OID string");
    }
    function encodeOctet(bytes, octet) {
      if (octet < 128) {
        bytes.push(octet);
      } else if (octet < 16384) {
        bytes.push(octet >>> 7 | 128);
        bytes.push(octet & 127);
      } else if (octet < 2097152) {
        bytes.push(octet >>> 14 | 128);
        bytes.push((octet >>> 7 | 128) & 255);
        bytes.push(octet & 127);
      } else if (octet < 268435456) {
        bytes.push(octet >>> 21 | 128);
        bytes.push((octet >>> 14 | 128) & 255);
        bytes.push((octet >>> 7 | 128) & 255);
        bytes.push(octet & 127);
      } else {
        bytes.push((octet >>> 28 | 128) & 255);
        bytes.push((octet >>> 21 | 128) & 255);
        bytes.push((octet >>> 14 | 128) & 255);
        bytes.push((octet >>> 7 | 128) & 255);
        bytes.push(octet & 127);
      }
    }
    const tmp = s.split(".");
    const bytes = [];
    bytes.push(parseInt(tmp[0], 10) * 40 + parseInt(tmp[1], 10));
    tmp.slice(2).forEach(function(b) {
      encodeOctet(bytes, parseInt(b, 10));
    });
    const self = this;
    this._ensure(2 + bytes.length);
    this.writeByte(tag);
    this.writeLength(bytes.length);
    bytes.forEach(function(b) {
      self.writeByte(b);
    });
  };
  Writer.prototype.writeLength = function(len) {
    if (typeof len !== "number") {
      throw new TypeError("argument must be a Number");
    }
    this._ensure(4);
    if (len <= 127) {
      this._buf[this._offset++] = len;
    } else if (len <= 255) {
      this._buf[this._offset++] = 129;
      this._buf[this._offset++] = len;
    } else if (len <= 65535) {
      this._buf[this._offset++] = 130;
      this._buf[this._offset++] = len >> 8;
      this._buf[this._offset++] = len;
    } else if (len <= 16777215) {
      this._buf[this._offset++] = 131;
      this._buf[this._offset++] = len >> 16;
      this._buf[this._offset++] = len >> 8;
      this._buf[this._offset++] = len;
    } else {
      throw newInvalidAsn1Error("Length too long (> 4 bytes)");
    }
  };
  Writer.prototype.startSequence = function(tag) {
    if (typeof tag !== "number") {
      tag = ASN1.Sequence | ASN1.Constructor;
    }
    this.writeByte(tag);
    this._seq.push(this._offset);
    this._ensure(3);
    this._offset += 3;
  };
  Writer.prototype.endSequence = function() {
    const seq = this._seq.pop();
    const start = seq + 3;
    const len = this._offset - start;
    if (len <= 127) {
      this._shift(start, len, -2);
      this._buf[seq] = len;
    } else if (len <= 255) {
      this._shift(start, len, -1);
      this._buf[seq] = 129;
      this._buf[seq + 1] = len;
    } else if (len <= 65535) {
      this._buf[seq] = 130;
      this._buf[seq + 1] = len >> 8;
      this._buf[seq + 2] = len;
    } else if (len <= 16777215) {
      this._shift(start, len, 1);
      this._buf[seq] = 131;
      this._buf[seq + 1] = len >> 16;
      this._buf[seq + 2] = len >> 8;
      this._buf[seq + 3] = len;
    } else {
      throw newInvalidAsn1Error("Sequence too long");
    }
  };
  Writer.prototype._shift = function(start, len, shift) {
    assert.ok(start !== undefined);
    assert.ok(len !== undefined);
    assert.ok(shift);
    this._buf.copy(this._buf, start + shift, start, start + len);
    this._offset += shift;
  };
  Writer.prototype._ensure = function(len) {
    assert.ok(len);
    if (this._size - this._offset < len) {
      let sz = this._size * this._options.growthFactor;
      if (sz - this._offset < len) {
        sz += len;
      }
      const buf = Buffer.alloc(sz);
      this._buf.copy(buf, 0, 0, this._offset);
      this._buf = buf;
      this._size = sz;
    }
  };
  module.exports = Writer;
});

// node_modules/@ldapjs/controls/node_modules/@ldapjs/asn1/lib/ber/index.js
var require_ber = __commonJS(function(exports, module) {
  var errors = require_errors();
  var types = require_types2();
  var Reader = require_reader2();
  var Writer = require_writer2();
  module.exports = {
    Reader,
    Writer
  };
  for (const t in types) {
    if (Object.prototype.hasOwnProperty.call(types, t)) {
      module.exports[t] = types[t];
    }
  }
  for (const e in errors) {
    if (Object.prototype.hasOwnProperty.call(errors, e)) {
      module.exports[e] = errors[e];
    }
  }
});

// node_modules/@ldapjs/controls/node_modules/@ldapjs/asn1/lib/index.js
var require_lib = __commonJS(function(exports, module) {
  var Ber = require_ber();
  module.exports = {
    Ber,
    BerReader: Ber.Reader,
    BerWriter: Ber.Writer
  };
});

// node_modules/@ldapjs/controls/lib/control.js
var require_control = __commonJS(function(exports, module) {
  var { BerWriter } = require_lib();

  class Control {
    constructor(options = {}) {
      const opts = Object.assign({ type: "", criticality: false, value: null }, options);
      this.type = opts.type;
      this.criticality = opts.criticality;
      this.value = opts.value;
    }
    get [Symbol.toStringTag]() {
      return "LdapControl";
    }
    get pojo() {
      const obj = {
        type: this.type,
        value: this.value,
        criticality: this.criticality
      };
      if (typeof this._pojo === "function") {
        this._pojo(obj);
      }
      return obj;
    }
    toBer(ber = new BerWriter) {
      ber.startSequence();
      ber.writeString(this.type || "");
      ber.writeBoolean(this.criticality);
      if (typeof this._toBer === "function") {
        this._toBer(ber);
      } else if (this.value !== undefined) {
        if (typeof this.value === "string") {
          ber.writeString(this.value);
        } else if (Buffer.isBuffer(this.value)) {
          ber.writeString(this.value.toString());
        }
      }
      ber.endSequence();
      return ber;
    }
  }
  module.exports = Control;
});

// node_modules/@ldapjs/controls/lib/is-object.js
var require_is_object = __commonJS(function(exports, module) {
  module.exports = function isObject(input) {
    return Object.prototype.toString.call(input) === "[object Object]";
  };
});

// node_modules/@ldapjs/controls/lib/has-own.js
var require_has_own = __commonJS(function(exports, module) {
  module.exports = function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
});

// node_modules/@ldapjs/controls/lib/controls/entry-change-notification-control.js
var require_entry_change_notification_control = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();

  class EntryChangeNotificationControl extends Control {
    static OID = "2.16.840.1.113730.3.4.7";
    constructor(options = {}) {
      options.type = EntryChangeNotificationControl.OID;
      super(options);
      this._value = {
        changeType: 4
      };
      if (hasOwn(options, "value") === false) {
        return;
      }
      if (Buffer.isBuffer(options.value)) {
        this.#parse(options.value);
      } else if (isObject(options.value)) {
        this._value = options.value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
    }
    get value() {
      return this._value;
    }
    set value(obj) {
      this._value = Object.assign({}, this._value, obj);
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence()) {
        this._value = {
          changeType: ber.readInt()
        };
        if (this._value.changeType === 8) {
          this._value.previousDN = ber.readString();
        }
        this._value.changeNumber = ber.readInt();
      }
    }
    _toBer(ber) {
      const writer = new BerWriter;
      writer.startSequence();
      writer.writeInt(this._value.changeType);
      if (this._value.previousDN) {
        writer.writeString(this._value.previousDN);
      }
      if (Object.prototype.hasOwnProperty.call(this._value, "changeNumber")) {
        writer.writeInt(parseInt(this._value.changeNumber, 10));
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
      return ber;
    }
    _updatePlainObject(obj) {
      obj.controlValue = this.value;
      return obj;
    }
  }
  module.exports = EntryChangeNotificationControl;
});

// node_modules/@ldapjs/controls/lib/controls/paged-results-control.js
var require_paged_results_control = __commonJS(function(exports, module) {
  var { Ber, BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();

  class PagedResultsControl extends Control {
    static OID = "1.2.840.113556.1.4.319";
    constructor(options = {}) {
      options.type = PagedResultsControl.OID;
      super(options);
      this._value = {
        size: 0,
        cookie: Buffer.alloc(0)
      };
      if (hasOwn(options, "value") === false) {
        return;
      }
      if (Buffer.isBuffer(options.value)) {
        this.#parse(options.value);
      } else if (isObject(options.value)) {
        this.value = options.value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
    }
    get value() {
      return this._value;
    }
    set value(obj) {
      this._value = Object.assign({}, this._value, obj);
      if (typeof this._value.cookie === "string") {
        this._value.cookie = Buffer.from(this._value.cookie);
      }
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence()) {
        this._value = {};
        this._value.size = ber.readInt();
        this._value.cookie = ber.readString(Ber.OctetString, true);
        if (!this._value.cookie) {
          this._value.cookie = Buffer.alloc(0);
        }
      }
    }
    _toBer(ber) {
      const writer = new BerWriter;
      writer.startSequence();
      writer.writeInt(this._value.size);
      if (this._value.cookie && this._value.cookie.length > 0) {
        writer.writeBuffer(this._value.cookie, Ber.OctetString);
      } else {
        writer.writeString("");
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, Ber.OctetString);
      return ber;
    }
    _updatePlainObject(obj) {
      obj.controlValue = this.value;
      return obj;
    }
  }
  module.exports = PagedResultsControl;
});

// node_modules/@ldapjs/controls/lib/controls/password-policy-control.js
var require_password_policy_control = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();

  class PasswordPolicyControl extends Control {
    static OID = "1.3.6.1.4.1.42.2.27.8.5.1";
    constructor(options = {}) {
      options.type = PasswordPolicyControl.OID;
      super(options);
      this._value = {};
      if (hasOwn(options, "value") === false) {
        return;
      }
      if (Buffer.isBuffer(options.value)) {
        this.#parse(options.value);
      } else if (isObject(options.value)) {
        if (hasOwn(options.value, "timeBeforeExpiration") === true && hasOwn(options.value, "graceAuthNsRemaining") === true) {
          throw new Error("options.value must contain either timeBeforeExpiration or graceAuthNsRemaining, not both");
        }
        this._value = options.value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
    }
    get value() {
      return this._value;
    }
    set value(obj) {
      this._value = Object.assign({}, this._value, obj);
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence()) {
        this._value = {};
        if (ber.peek() === 160) {
          ber.readSequence(160);
          if (ber.peek() === 128) {
            this._value.timeBeforeExpiration = ber._readTag(128);
          } else if (ber.peek() === 129) {
            this._value.graceAuthNsRemaining = ber._readTag(129);
          }
        }
        if (ber.peek() === 129) {
          this._value.error = ber._readTag(129);
        }
      }
    }
    _toBer(ber) {
      if (!this._value || Object.keys(this._value).length === 0) {
        return;
      }
      const writer = new BerWriter;
      writer.startSequence();
      if (hasOwn(this._value, "timeBeforeExpiration")) {
        writer.startSequence(160);
        writer.writeInt(this._value.timeBeforeExpiration, 128);
        writer.endSequence();
      } else if (hasOwn(this._value, "graceAuthNsRemaining")) {
        writer.startSequence(160);
        writer.writeInt(this._value.graceAuthNsRemaining, 129);
        writer.endSequence();
      }
      if (hasOwn(this._value, "error")) {
        writer.writeInt(this._value.error, 129);
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
      return ber;
    }
    _updatePlainObject(obj) {
      obj.controlValue = this.value;
      return obj;
    }
  }
  module.exports = PasswordPolicyControl;
});

// node_modules/@ldapjs/controls/lib/controls/persistent-search-control.js
var require_persistent_search_control = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();

  class PersistentSearchControl extends Control {
    static OID = "2.16.840.1.113730.3.4.3";
    constructor(options = {}) {
      options.type = PersistentSearchControl.OID;
      super(options);
      this._value = {
        changeTypes: 15,
        changesOnly: true,
        returnECs: true
      };
      if (hasOwn(options, "value") === false) {
        return;
      }
      if (Buffer.isBuffer(options.value)) {
        this.#parse(options.value);
      } else if (isObject(options.value)) {
        this._value = options.value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
    }
    get value() {
      return this._value;
    }
    set value(obj) {
      this._value = Object.assign({}, this._value, obj);
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence()) {
        this._value = {
          changeTypes: ber.readInt(),
          changesOnly: ber.readBoolean(),
          returnECs: ber.readBoolean()
        };
      }
    }
    _toBer(ber) {
      const writer = new BerWriter;
      writer.startSequence();
      writer.writeInt(this._value.changeTypes);
      writer.writeBoolean(this._value.changesOnly);
      writer.writeBoolean(this._value.returnECs);
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
      return ber;
    }
    _updatePlainObject(obj) {
      obj.controlValue = this.value;
      return obj;
    }
  }
  module.exports = PersistentSearchControl;
});

// node_modules/@ldapjs/controls/lib/controls/server-side-sorting-request-control.js
var require_server_side_sorting_request_control = __commonJS(function(exports, module) {
  var { Ber, BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();

  class ServerSideSortingRequestControl extends Control {
    static OID = "1.2.840.113556.1.4.473";
    constructor(options = { value: [] }) {
      options.type = ServerSideSortingRequestControl.OID;
      super(options);
      const inputValue = options.value ?? [];
      if (Buffer.isBuffer(inputValue)) {
        this.#parse(inputValue);
      } else if (Array.isArray(inputValue)) {
        for (const obj of inputValue) {
          if (isObject(obj) === false) {
            throw new Error("Control value must be an object");
          }
          if (hasOwn(obj, "attributeType") === false) {
            throw new Error("Missing required key: attributeType");
          }
        }
        this.value = inputValue;
      } else if (isObject(inputValue)) {
        if (hasOwn(inputValue, "attributeType") === false) {
          throw new Error("Missing required key: attributeType");
        }
        this.value = [inputValue];
      } else {
        throw new TypeError("options.value must be a Buffer, Array or Object");
      }
    }
    get value() {
      return this._value;
    }
    set value(items) {
      if (Buffer.isBuffer(items) === true)
        return;
      if (Array.isArray(items) === false) {
        this._value = [items];
        return;
      }
      this._value = items;
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      let item;
      if (ber.readSequence(48)) {
        this.value = [];
        while (ber.readSequence(48)) {
          item = {};
          item.attributeType = ber.readString(Ber.OctetString);
          if (ber.peek() === 128) {
            item.orderingRule = ber.readString(128);
          }
          if (ber.peek() === 129) {
            item.reverseOrder = ber._readTag(129) !== 0;
          }
          this.value.push(item);
        }
      }
    }
    _pojo(obj) {
      obj.value = this.value;
      return obj;
    }
    _toBer(ber) {
      if (this.value.length === 0) {
        return;
      }
      const writer = new BerWriter;
      writer.startSequence(48);
      for (let i = 0;i < this.value.length; i++) {
        const item = this.value[i];
        writer.startSequence(48);
        if (hasOwn(item, "attributeType")) {
          writer.writeString(item.attributeType, Ber.OctetString);
        }
        if (hasOwn(item, "orderingRule")) {
          writer.writeString(item.orderingRule, 128);
        }
        if (hasOwn(item, "reverseOrder")) {
          writer.writeBoolean(item.reverseOrder, 129);
        }
        writer.endSequence();
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
    }
  }
  module.exports = ServerSideSortingRequestControl;
});

// node_modules/@ldapjs/controls/lib/controls/server-side-sorting-response-control.js
var require_server_side_sorting_response_control = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_lib();
  var Control = require_control();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var { resultCodes: RESULT_CODES } = require_protocol();
  var validCodeNames = [
    "SUCCESS",
    "OPERATIONS_ERROR",
    "TIME_LIMIT_EXCEEDED",
    "STRONGER_AUTH_REQUIRED",
    "ADMIN_LIMIT_EXCEEDED",
    "NO_SUCH_ATTRIBUTE",
    "INAPPROPRIATE_MATCHING",
    "INSUFFICIENT_ACCESS_RIGHTS",
    "BUSY",
    "UNWILLING_TO_PERFORM",
    "OTHER"
  ];
  var filteredCodes = Object.entries(RESULT_CODES).filter(([k, v]) => validCodeNames.includes(k));
  var VALID_CODES = new Map([
    ...filteredCodes,
    ...filteredCodes.map(([k, v]) => {
      return [v, k];
    })
  ]);

  class ServerSideSortingResponseControl extends Control {
    static OID = "1.2.840.113556.1.4.474";
    static RESPONSE_CODES = Object.freeze(VALID_CODES);
    constructor(options = {}) {
      options.type = ServerSideSortingResponseControl.OID;
      options.criticality = false;
      super(options);
      this.value = {};
      if (hasOwn(options, "value") === false || !options.value) {
        return;
      }
      const value = options.value;
      if (Buffer.isBuffer(value)) {
        this.#parse(value);
      } else if (isObject(value)) {
        if (VALID_CODES.has(value.result) === false) {
          throw new Error("Invalid result code");
        }
        if (hasOwn(value, "failedAttribute") && typeof value.failedAttribute !== "string") {
          throw new Error("failedAttribute must be String");
        }
        this.value = value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
    }
    get value() {
      return this._value;
    }
    set value(obj) {
      this._value = Object.assign({}, this._value, obj);
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence(48)) {
        this._value = {};
        this._value.result = ber.readEnumeration();
        if (ber.peek() === 128) {
          this._value.failedAttribute = ber.readString(128);
        }
      }
    }
    _pojo(obj) {
      obj.value = this.value;
      return obj;
    }
    _toBer(ber) {
      if (!this._value || Object.keys(this._value).length === 0) {
        return;
      }
      const writer = new BerWriter;
      writer.startSequence(48);
      writer.writeEnumeration(this.value.result);
      if (this.value.result !== RESULT_CODES.SUCCESS && this.value.failedAttribute) {
        writer.writeString(this.value.failedAttribute, 128);
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
    }
  }
  module.exports = ServerSideSortingResponseControl;
});

// node_modules/@ldapjs/controls/lib/controls/virtual-list-view-request-control.js
var require_virtual_list_view_request_control = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();

  class VirtualListViewRequestControl extends Control {
    static OID = "2.16.840.1.113730.3.4.9";
    constructor(options = {}) {
      options.type = VirtualListViewRequestControl.OID;
      super(options);
      if (hasOwn(options, "value") === false) {
        throw Error("control is not enabled");
      }
      if (Buffer.isBuffer(options.value)) {
        this.#parse(options.value);
      } else if (isObject(options.value)) {
        if (Object.prototype.hasOwnProperty.call(options.value, "beforeCount") === false) {
          throw new Error("Missing required key: beforeCount");
        }
        if (Object.prototype.hasOwnProperty.call(options.value, "afterCount") === false) {
          throw new Error("Missing required key: afterCount");
        }
        this._value = options.value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
      throw Error("control is not enabled");
    }
    get value() {
      return this._value;
    }
    set value(items) {
      if (Buffer.isBuffer(items) === true)
        return;
      if (Array.isArray(items) === false) {
        this._value = [items];
        return;
      }
      this._value = items;
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence()) {
        this._value = {};
        this._value.beforeCount = ber.readInt();
        this._value.afterCount = ber.readInt();
        if (ber.peek() === 160) {
          if (ber.readSequence(160)) {
            this._value.targetOffset = ber.readInt();
            this._value.contentCount = ber.readInt();
          }
        }
        if (ber.peek() === 129) {
          this._value.greaterThanOrEqual = ber.readString(129);
        }
        return true;
      }
      return false;
    }
    _pojo(obj) {
      obj.value = this.value;
      return obj;
    }
    _toBer(ber) {
      if (!this._value || this._value.length === 0) {
        return;
      }
      const writer = new BerWriter;
      writer.startSequence(48);
      writer.writeInt(this._value.beforeCount);
      writer.writeInt(this._value.afterCount);
      if (this._value.targetOffset !== undefined) {
        writer.startSequence(160);
        writer.writeInt(this._value.targetOffset);
        writer.writeInt(this._value.contentCount);
        writer.endSequence();
      } else if (this._value.greaterThanOrEqual !== undefined) {
        writer.writeString(this._value.greaterThanOrEqual, 129);
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
    }
  }
  module.exports = VirtualListViewRequestControl;
});

// node_modules/@ldapjs/controls/lib/controls/virtual-list-view-response-control.js
var require_virtual_list_view_response_control = __commonJS(function(exports, module) {
  var { Ber, BerReader, BerWriter } = require_lib();
  var isObject = require_is_object();
  var hasOwn = require_has_own();
  var Control = require_control();
  var { resultCodes: RESULT_CODES } = require_protocol();
  var validCodeNames = [
    "SUCCESS",
    "OPERATIONS_ERROR",
    "UNWILLING_TO_PERFORM",
    "INSUFFICIENT_ACCESS_RIGHTS",
    "BUSY",
    "TIME_LIMIT_EXCEEDED",
    "STRONGER_AUTH_REQUIRED",
    "ADMIN_LIMIT_EXCEEDED",
    "SORT_CONTROL_MISSING",
    "OFFSET_RANGE_ERROR",
    "CONTROL_ERROR",
    "OTHER"
  ];
  var filteredCodes = Object.entries(RESULT_CODES).filter(([k, v]) => validCodeNames.includes(k));
  var VALID_CODES = new Map([
    ...filteredCodes,
    ...filteredCodes.map(([k, v]) => {
      return [v, k];
    })
  ]);

  class VirtualListViewResponseControl extends Control {
    static OID = "2.16.840.1.113730.3.4.10";
    static RESPONSE_CODES = Object.freeze(VALID_CODES);
    constructor(options = {}) {
      options.type = VirtualListViewResponseControl.OID;
      options.criticality = false;
      super(options);
      this.value = {};
      if (hasOwn(options, "value") === false || !options.value) {
        throw Error("control not enabled");
      }
      const value = options.value;
      if (Buffer.isBuffer(value)) {
        this.#parse(options.value);
      } else if (isObject(value)) {
        if (VALID_CODES.has(value.result) === false) {
          throw new Error("Invalid result code");
        }
        this.value = options.value;
      } else {
        throw new TypeError("options.value must be a Buffer or Object");
      }
      throw Error("control not enabled");
    }
    get value() {
      return this._value;
    }
    set value(obj) {
      this._value = Object.assign({}, this._value, obj);
    }
    #parse(buffer) {
      const ber = new BerReader(buffer);
      if (ber.readSequence()) {
        this._value = {};
        if (ber.peek(2)) {
          this._value.targetPosition = ber.readInt();
        }
        if (ber.peek(2)) {
          this._value.contentCount = ber.readInt();
        }
        this._value.result = ber.readEnumeration();
        this._value.cookie = ber.readString(Ber.OctetString, true);
        if (!this._value.cookie) {
          this._value.cookie = Buffer.alloc(0);
        }
        return true;
      }
      return false;
    }
    _pojo(obj) {
      obj.value = this.value;
      return obj;
    }
    _toBer(ber) {
      if (this.value.length === 0) {
        return;
      }
      const writer = new BerWriter;
      writer.startSequence();
      if (this.value.targetPosition !== undefined) {
        writer.writeInt(this.value.targetPosition);
      }
      if (this.value.contentCount !== undefined) {
        writer.writeInt(this.value.contentCount);
      }
      writer.writeEnumeration(this.value.result);
      if (this.value.cookie && this.value.cookie.length > 0) {
        writer.writeBuffer(this.value.cookie, Ber.OctetString);
      } else {
        writer.writeString("");
      }
      writer.endSequence();
      ber.writeBuffer(writer.buffer, 4);
    }
  }
  module.exports = VirtualListViewResponseControl;
});

// node_modules/@ldapjs/controls/index.js
var require_controls = __commonJS(function(exports, module) {
  var { Ber } = require_lib();
  var Control = require_control();
  var EntryChangeNotificationControl = require_entry_change_notification_control();
  var PagedResultsControl = require_paged_results_control();
  var PasswordPolicyControl = require_password_policy_control();
  var PersistentSearchControl = require_persistent_search_control();
  var ServerSideSortingRequestControl = require_server_side_sorting_request_control();
  var ServerSideSortingResponseControl = require_server_side_sorting_response_control();
  var VirtualListViewRequestControl = require_virtual_list_view_request_control();
  var VirtualListViewResponseControl = require_virtual_list_view_response_control();
  module.exports = {
    getControl: function getControl(ber) {
      if (!ber)
        throw TypeError("ber must be provided");
      if (ber.readSequence() === null) {
        return null;
      }
      let type;
      const opts = {
        criticality: false,
        value: null
      };
      if (ber.length) {
        const end = ber.offset + ber.length;
        type = ber.readString();
        if (ber.offset < end) {
          if (ber.peek() === Ber.Boolean) {
            opts.criticality = ber.readBoolean();
          }
        }
        if (ber.offset < end) {
          opts.value = ber.readString(Ber.OctetString, true);
        }
      }
      let control;
      switch (type) {
        case EntryChangeNotificationControl.OID: {
          control = new EntryChangeNotificationControl(opts);
          break;
        }
        case PagedResultsControl.OID: {
          control = new PagedResultsControl(opts);
          break;
        }
        case PasswordPolicyControl.OID: {
          control = new PasswordPolicyControl(opts);
          break;
        }
        case PersistentSearchControl.OID: {
          control = new PersistentSearchControl(opts);
          break;
        }
        case ServerSideSortingRequestControl.OID: {
          control = new ServerSideSortingRequestControl(opts);
          break;
        }
        case ServerSideSortingResponseControl.OID: {
          control = new ServerSideSortingResponseControl(opts);
          break;
        }
        case VirtualListViewRequestControl.OID: {
          control = new VirtualListViewRequestControl(opts);
          break;
        }
        case VirtualListViewResponseControl.OID: {
          control = new VirtualListViewResponseControl(opts);
          break;
        }
        default: {
          opts.type = type;
          control = new Control(opts);
          break;
        }
      }
      return control;
    },
    Control,
    EntryChangeNotificationControl,
    PagedResultsControl,
    PasswordPolicyControl,
    PersistentSearchControl,
    ServerSideSortingRequestControl,
    ServerSideSortingResponseControl,
    VirtualListViewRequestControl,
    VirtualListViewResponseControl
  };
});

// node_modules/@ldapjs/messages/lib/messages/abandon-request.js
var require_abandon_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var Protocol = require_protocol();
  var warning = require_deprecations();

  class AbandonRequest extends LdapMessage {
    #abandonId;
    constructor(options = {}) {
      options.protocolOp = Protocol.operations.LDAP_REQ_ABANDON;
      super(options);
      const abandonId = options.abandonId || options.abandonID || 0;
      if (options.abandonID) {
        warning.emit("LDAP_MESSAGE_DEP_003");
      }
      this.#abandonId = abandonId;
    }
    get abandonId() {
      return this.#abandonId;
    }
    get abandonID() {
      warning.emit("LDAP_MESSAGE_DEP_003");
      return this.#abandonId;
    }
    get type() {
      return "AbandonRequest";
    }
    _toBer(ber) {
      ber.writeInt(this.#abandonId, Protocol.operations.LDAP_REQ_ABANDON);
      return ber;
    }
    _pojo(obj = {}) {
      obj.abandonId = this.#abandonId;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.peek();
      if (protocolOp !== Protocol.operations.LDAP_REQ_ABANDON) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const abandonId = ber.readInt(Protocol.operations.LDAP_REQ_ABANDON);
      return { protocolOp, abandonId };
    }
  }
  module.exports = AbandonRequest;
});

// node_modules/@ldapjs/attribute/lib/deprecations.js
var require_deprecations2 = __commonJS(function(exports, module) {
  var warning = require_process_warning()();
  var clazz = "LdapjsAttributeWarning";
  warning.create(clazz, "LDAP_ATTRIBUTE_DEP_001", "options.vals is deprecated. Use options.values instead.");
  warning.create(clazz, "LDAP_ATTRIBUTE_DEP_002", "Instance method .parse is deprecated. Use static .fromBer instead.");
  warning.create(clazz, "LDAP_ATTRIBUTE_DEP_003", "Instance property .vals is deprecated. Use property .values instead.");
  module.exports = warning;
});

// node_modules/@ldapjs/attribute/index.js
var require_attribute = __commonJS(function(exports, module) {
  var { core: { LBER_SET } } = require_protocol();
  var {
    BerTypes,
    BerReader,
    BerWriter
  } = require_asn1();
  var warning = require_deprecations2();

  class Attribute {
    #buffers = [];
    #type;
    constructor(options = {}) {
      if (options.type && typeof options.type !== "string") {
        throw TypeError("options.type must be a string");
      }
      this.type = options.type || "";
      const values = options.values || options.vals || [];
      if (options.vals) {
        warning.emit("LDAP_ATTRIBUTE_DEP_001");
      }
      this.values = values;
    }
    get [Symbol.toStringTag]() {
      return "LdapAttribute";
    }
    get buffers() {
      return this.#buffers.slice(0);
    }
    get pojo() {
      return {
        type: this.type,
        values: this.values
      };
    }
    get type() {
      return this.#type;
    }
    set type(name) {
      this.#type = name;
    }
    get values() {
      const encoding = _bufferEncoding(this.#type);
      return this.#buffers.map(function(v) {
        return v.toString(encoding);
      });
    }
    set values(vals) {
      if (Array.isArray(vals) === false) {
        return this.addValue(vals);
      }
      for (const value of vals) {
        this.addValue(value);
      }
    }
    get vals() {
      warning.emit("LDAP_ATTRIBUTE_DEP_003");
      return this.values;
    }
    set vals(values) {
      warning.emit("LDAP_ATTRIBUTE_DEP_003");
      this.values = values;
    }
    addValue(value) {
      if (Buffer.isBuffer(value)) {
        this.#buffers.push(value);
      } else {
        this.#buffers.push(Buffer.from(value + "", _bufferEncoding(this.#type)));
      }
    }
    parse(ber) {
      const attr = Attribute.fromBer(ber);
      this.#type = attr.type;
      this.values = attr.values;
    }
    toBer() {
      const ber = new BerWriter;
      ber.startSequence();
      ber.writeString(this.type);
      ber.startSequence(LBER_SET);
      if (this.#buffers.length > 0) {
        for (const buffer of this.#buffers) {
          ber.writeByte(BerTypes.OctetString);
          ber.writeLength(buffer.length);
          ber.appendBuffer(buffer);
        }
      } else {
        ber.writeStringArray([]);
      }
      ber.endSequence();
      ber.endSequence();
      return new BerReader(ber.buffer);
    }
    toJSON() {
      return this.pojo;
    }
    static compare(attr1, attr2) {
      if (Attribute.isAttribute(attr1) === false || Attribute.isAttribute(attr2) === false) {
        throw TypeError("can only compare Attribute instances");
      }
      if (attr1.type < attr2.type)
        return -1;
      if (attr1.type > attr2.type)
        return 1;
      const aValues = attr1.values;
      const bValues = attr2.values;
      if (aValues.length < bValues.length)
        return -1;
      if (aValues.length > bValues.length)
        return 1;
      for (let i = 0;i < aValues.length; i++) {
        if (aValues[i] < bValues[i])
          return -1;
        if (aValues[i] > bValues[i])
          return 1;
      }
      return 0;
    }
    static fromBer(ber) {
      ber.readSequence();
      const type = ber.readString();
      const values = [];
      if (ber.peek() === LBER_SET) {
        if (ber.readSequence(LBER_SET)) {
          const end = ber.offset + ber.length;
          while (ber.offset < end) {
            values.push(ber.readString(BerTypes.OctetString, true));
          }
        }
      }
      const result = new Attribute({
        type,
        values
      });
      return result;
    }
    static fromObject(obj) {
      const attributes = [];
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value) === true) {
          attributes.push(new Attribute({
            type: key,
            values: value
          }));
        } else {
          attributes.push(new Attribute({
            type: key,
            values: [value]
          }));
        }
      }
      return attributes;
    }
    static isAttribute(attr) {
      if (typeof attr !== "object") {
        return false;
      }
      if (Object.prototype.toString.call(attr) === "[object LdapAttribute]") {
        return true;
      }
      const typeOk = typeof attr.type === "string";
      let valuesOk = Array.isArray(attr.values);
      if (valuesOk === true) {
        for (const val of attr.values) {
          if (typeof val !== "string" && Buffer.isBuffer(val) === false) {
            valuesOk = false;
            break;
          }
        }
      }
      if (typeOk === true && valuesOk === true) {
        return true;
      }
      return false;
    }
  }
  module.exports = Attribute;
  function _bufferEncoding(type) {
    return /;binary$/.test(type) ? "base64" : "utf8";
  }
});

// node_modules/@ldapjs/dn/lib/deprecations.js
var require_deprecations3 = __commonJS(function(exports, module) {
  var warning = require_process_warning()();
  var clazz = "LdapjsDnWarning";
  warning.create(clazz, "LDAP_DN_DEP_001", "attribute options is deprecated and are ignored");
  warning.create(clazz, "LDAP_DN_DEP_002", ".format() is deprecated. Use .toString() instead");
  warning.create(clazz, "LDAP_DN_DEP_003", ".set() is deprecated. Use .setAttribute() instead");
  warning.create(clazz, "LDAP_DN_DEP_004", ".setFormat() is deprecated. Options will be ignored");
  module.exports = warning;
});

// node_modules/@ldapjs/dn/lib/utils/escape-value.js
var require_escape_value = __commonJS(function(exports, module) {
  module.exports = function escapeValue(value) {
    if (typeof value !== "string") {
      throw Error("value must be a string");
    }
    const toEscape = Buffer.from(value, "utf8");
    const escaped = [];
    const embeddedReservedChars = [
      34,
      43,
      44,
      59,
      60,
      62
    ];
    for (let i = 0;i < toEscape.byteLength; ) {
      const charHex = toEscape[i];
      if (i === 0 && (charHex === 32 || charHex === 35)) {
        escaped.push(toEscapedHexString(charHex));
        i += 1;
        continue;
      }
      if (i === toEscape.byteLength - 1 && charHex === 32) {
        escaped.push(toEscapedHexString(charHex));
        i += 1;
        continue;
      }
      if (embeddedReservedChars.includes(charHex) === true) {
        escaped.push(toEscapedHexString(charHex));
        i += 1;
        continue;
      }
      if (charHex >= 192 && charHex <= 223) {
        escaped.push(toEscapedHexString(charHex));
        escaped.push(toEscapedHexString(toEscape[i + 1]));
        i += 2;
        continue;
      }
      if (charHex >= 224 && charHex <= 239) {
        escaped.push(toEscapedHexString(charHex));
        escaped.push(toEscapedHexString(toEscape[i + 1]));
        escaped.push(toEscapedHexString(toEscape[i + 2]));
        i += 3;
        continue;
      }
      if (charHex >= 240 && charHex <= 247) {
        escaped.push(toEscapedHexString(charHex));
        escaped.push(toEscapedHexString(toEscape[i + 1]));
        escaped.push(toEscapedHexString(toEscape[i + 2]));
        escaped.push(toEscapedHexString(toEscape[i + 3]));
        i += 4;
        continue;
      }
      if (charHex <= 31) {
        escaped.push(toEscapedHexString(charHex));
        i += 1;
        continue;
      }
      escaped.push(String.fromCharCode(charHex));
      i += 1;
      continue;
    }
    return escaped.join("");
  };
  function toEscapedHexString(char) {
    return "\\" + char.toString(16).padStart(2, "0");
  }
});

// node_modules/@ldapjs/dn/lib/utils/is-dotted-decimal.js
var require_is_dotted_decimal = __commonJS(function(exports, module) {
  var partIsNotNumeric = (part) => /^\d+$/.test(part) === false;
  module.exports = function isDottedDecimal(value) {
    if (typeof value !== "string")
      return false;
    const parts = value.split(".");
    const nonNumericParts = parts.filter(partIsNotNumeric);
    return nonNumericParts.length === 0;
  };
});

// node_modules/@ldapjs/dn/lib/rdn.js
var require_rdn = __commonJS(function(exports, module) {
  var warning = require_deprecations3();
  var escapeValue = require_escape_value();
  var isDottedDecimal = require_is_dotted_decimal();

  class RDN {
    #attributes = new Map;
    constructor(rdn = {}) {
      for (const [key, val] of Object.entries(rdn)) {
        this.setAttribute({ name: key, value: val });
      }
    }
    get [Symbol.toStringTag]() {
      return "LdapRdn";
    }
    get size() {
      return this.#attributes.size;
    }
    equals(rdn) {
      if (Object.prototype.toString.call(rdn) !== "[object LdapRdn]") {
        return false;
      }
      if (this.size !== rdn.size) {
        return false;
      }
      for (const key of this.keys()) {
        if (rdn.has(key) === false)
          return false;
        if (this.getValue(key) !== rdn.getValue(key))
          return false;
      }
      return true;
    }
    getValue(name) {
      return this.#attributes.get(name)?.value;
    }
    has(name) {
      return this.#attributes.has(name);
    }
    keys() {
      return this.#attributes.keys();
    }
    setAttribute({ name, value, options = {} }) {
      if (typeof name !== "string") {
        throw Error("name must be a string");
      }
      const valType = Object.prototype.toString.call(value);
      if (typeof value !== "string" && valType !== "[object BerReader]") {
        throw Error("value must be a string or BerReader");
      }
      if (Object.prototype.toString.call(options) !== "[object Object]") {
        throw Error("options must be an object");
      }
      const startsWithAlpha = (str) => /^[a-zA-Z]/.test(str) === true;
      if (startsWithAlpha(name) === false && isDottedDecimal(name) === false) {
        throw Error("attribute name must start with an ASCII alpha character or be a numeric OID");
      }
      const attr = { value, name };
      for (const [key, val] of Object.entries(options)) {
        warning.emit("LDAP_DN_DEP_001");
        if (key === "value")
          continue;
        attr[key] = val;
      }
      this.#attributes.set(name, attr);
    }
    toString({ unescaped = false } = {}) {
      let result = "";
      const isHexEncodedValue = (val) => /^#([0-9a-fA-F]{2})+$/.test(val) === true;
      for (const entry of this.#attributes.values()) {
        result += entry.name + "=";
        if (isHexEncodedValue(entry.value)) {
          result += entry.value;
        } else if (Object.prototype.toString.call(entry.value) === "[object BerReader]") {
          let encoded = "#";
          for (const byte of entry.value.buffer) {
            encoded += Number(byte).toString(16).padStart(2, "0");
          }
          result += encoded;
        } else {
          result += unescaped === false ? escapeValue(entry.value) : entry.value;
        }
        result += "+";
      }
      return result.substring(0, result.length - 1);
    }
    format() {
      warning.emit("LDAP_DN_DEP_002");
      return this.toString();
    }
    set(name, value, options) {
      warning.emit("LDAP_DN_DEP_003");
      this.setAttribute({ name, value, options });
    }
    static isRdn(rdn) {
      if (Object.prototype.toString.call(rdn) === "[object LdapRdn]") {
        return true;
      }
      const isObject = Object.prototype.toString.call(rdn) === "[object Object]";
      if (isObject === false) {
        return false;
      }
      if (typeof rdn.name === "string" && typeof rdn.value === "string") {
        return true;
      }
      for (const value of Object.values(rdn)) {
        if (typeof value !== "string" && Object.prototype.toString.call(value) !== "[object BerReader]")
          return false;
      }
      return true;
    }
  }
  module.exports = RDN;
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/find-name-start.js
var require_find_name_start = __commonJS(function(exports, module) {
  var isLeadChar = (c) => /[a-zA-Z0-9]/.test(c) === true;
  module.exports = function findNameStart({ searchBuffer, startPos }) {
    let pos = startPos;
    while (pos < searchBuffer.byteLength) {
      if (searchBuffer[pos] === 32 || searchBuffer[pos] === 44) {
        pos += 1;
        continue;
      }
      const char = String.fromCharCode(searchBuffer[pos]);
      if (isLeadChar(char) === true) {
        return pos;
      }
      break;
    }
    return -1;
  };
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/find-name-end.js
var require_find_name_end = __commonJS(function(exports, module) {
  module.exports = function findNameEnd({ searchBuffer, startPos }) {
    let pos = startPos;
    while (pos < searchBuffer.byteLength) {
      const char = searchBuffer[pos];
      if (char === 32 || char === 61) {
        break;
      }
      if (isValidNameChar(char) === true) {
        pos += 1;
        continue;
      }
      return -1;
    }
    return pos;
  };
  function isValidNameChar(c) {
    if (c >= 65 && c <= 90) {
      return true;
    }
    if (c >= 97 && c <= 122) {
      return true;
    }
    if (c >= 48 && c <= 57) {
      return true;
    }
    if (c === 45 || c === 46) {
      return true;
    }
    return false;
  }
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/is-valid-attribute-type-name.js
var require_is_valid_attribute_type_name = __commonJS(function(exports, module) {
  var isDigit = (c) => /[0-9]/.test(c) === true;
  var hasKeyChars = (input) => /[a-zA-Z-]/.test(input) === true;
  var isValidLeadChar = (c) => /[a-zA-Z]/.test(c) === true;
  var hasInvalidChars = (input) => /[^a-zA-Z0-9-]/.test(input) === true;
  module.exports = function isValidAttributeTypeName(name) {
    if (isDigit(name[0]) === true) {
      return hasKeyChars(name) === false;
    }
    if (isValidLeadChar(name[0]) === false) {
      return false;
    }
    return hasInvalidChars(name) === false;
  };
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/read-hex-string.js
var require_read_hex_string = __commonJS(function(exports, module) {
  var { BerReader } = require_asn1();
  var isValidHexCode = (code) => /[0-9a-fA-F]{2}/.test(code) === true;
  module.exports = function readHexString({ searchBuffer, startPos }) {
    const bytes = [];
    let pos = startPos;
    while (pos < searchBuffer.byteLength) {
      if (isEndChar(searchBuffer[pos])) {
        break;
      }
      const hexPair = String.fromCharCode(searchBuffer[pos]) + String.fromCharCode(searchBuffer[pos + 1]);
      if (isValidHexCode(hexPair) === false) {
        throw Error("invalid hex pair encountered: 0x" + hexPair);
      }
      bytes.push(parseInt(hexPair, 16));
      pos += 2;
    }
    return {
      endPos: pos,
      berReader: new BerReader(Buffer.from(bytes))
    };
  };
  function isEndChar(c) {
    switch (c) {
      case 32:
      case 43:
      case 44:
      case 59:
        return true;
      default:
        return false;
    }
  }
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/read-escape-sequence.js
var require_read_escape_sequence = __commonJS(function(exports, module) {
  module.exports = function readEscapeSequence({ searchBuffer, startPos }) {
    let pos = startPos;
    const buf = [];
    while (pos < searchBuffer.byteLength) {
      const char = searchBuffer[pos];
      const nextChar = searchBuffer[pos + 1];
      if (char !== 92) {
        break;
      }
      const strHexCode = String.fromCharCode(nextChar) + String.fromCharCode(searchBuffer[pos + 2]);
      const hexCode = parseInt(strHexCode, 16);
      if (Number.isNaN(hexCode) === true) {
        if (nextChar >= 0 && nextChar <= 127) {
          buf.push(nextChar);
          pos += 2;
          continue;
        } else {
          throw Error("invalid hex code in escape sequence");
        }
      }
      if (hexCode >= 192 && hexCode <= 223) {
        const secondByte = parseInt(String.fromCharCode(searchBuffer[pos + 4]) + String.fromCharCode(searchBuffer[pos + 5]), 16);
        buf.push(hexCode);
        buf.push(secondByte);
        pos += 6;
        continue;
      }
      if (hexCode >= 224 && hexCode <= 239) {
        const secondByte = parseInt(String.fromCharCode(searchBuffer[pos + 4]) + String.fromCharCode(searchBuffer[pos + 5]), 16);
        const thirdByte = parseInt(String.fromCharCode(searchBuffer[pos + 7]) + String.fromCharCode(searchBuffer[pos + 8]), 16);
        buf.push(hexCode);
        buf.push(secondByte);
        buf.push(thirdByte);
        pos += 9;
        continue;
      }
      if (hexCode >= 240 && hexCode <= 247) {
        const secondByte = parseInt(String.fromCharCode(searchBuffer[pos + 4]) + String.fromCharCode(searchBuffer[pos + 5]), 16);
        const thirdByte = parseInt(String.fromCharCode(searchBuffer[pos + 7]) + String.fromCharCode(searchBuffer[pos + 8]), 16);
        const fourthByte = parseInt(String.fromCharCode(searchBuffer[pos + 10]) + String.fromCharCode(searchBuffer[pos + 11]), 16);
        buf.push(hexCode);
        buf.push(secondByte);
        buf.push(thirdByte);
        buf.push(fourthByte);
        pos += 12;
        continue;
      }
      buf.push(hexCode);
      pos += 3;
    }
    return {
      endPos: pos,
      parsed: Buffer.from(buf)
    };
  };
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/read-attribute-value.js
var require_read_attribute_value = __commonJS(function(exports, module) {
  var readHexString = require_read_hex_string();
  var readEscapeSequence = require_read_escape_sequence();
  module.exports = function readAttributeValue({ searchBuffer, startPos }) {
    let pos = startPos;
    while (pos < searchBuffer.byteLength && searchBuffer[pos] === 32) {
      pos += 1;
    }
    if (pos >= searchBuffer.byteLength || searchBuffer[pos] !== 61) {
      throw Error("attribute value does not start with equals sign");
    }
    pos += 1;
    while (pos <= searchBuffer.byteLength && searchBuffer[pos] === 32) {
      pos += 1;
    }
    if (pos >= searchBuffer.byteLength) {
      return { endPos: pos, value: "" };
    }
    if (searchBuffer[pos] === 35) {
      const result = readHexString({ searchBuffer, startPos: pos + 1 });
      pos = result.endPos;
      return { endPos: pos, value: result.berReader };
    }
    const readValueResult = readValueString({ searchBuffer, startPos: pos });
    pos = readValueResult.endPos;
    return {
      endPos: pos,
      value: readValueResult.value.toString("utf8").trim()
    };
  };
  function readValueString({ searchBuffer, startPos }) {
    let pos = startPos;
    let inQuotes = false;
    let endQuotePresent = false;
    const bytes = [];
    while (pos <= searchBuffer.byteLength) {
      const char = searchBuffer[pos];
      if (pos === searchBuffer.byteLength) {
        if (inQuotes === true && endQuotePresent === false) {
          throw Error("missing ending double quote for attribute value");
        }
        break;
      }
      if (char === 34) {
        if (inQuotes === true) {
          pos += 1;
          endQuotePresent = true;
          while (pos < searchBuffer.byteLength) {
            const nextChar = searchBuffer[pos];
            if (isEndChar(nextChar) === true) {
              break;
            }
            if (nextChar !== 32) {
              throw Error("significant rdn character found outside of quotes at position " + pos);
            }
            pos += 1;
          }
          break;
        }
        if (pos !== startPos) {
          throw Error('unexpected quote (") in rdn string at position ' + pos);
        }
        inQuotes = true;
        pos += 1;
        continue;
      }
      if (isEndChar(char) === true && inQuotes === false) {
        break;
      }
      if (char === 92) {
        const seqResult = readEscapeSequence({
          searchBuffer,
          startPos: pos
        });
        pos = seqResult.endPos;
        Array.prototype.push.apply(bytes, seqResult.parsed);
        continue;
      }
      bytes.push(char);
      pos += 1;
    }
    return {
      endPos: pos,
      value: Buffer.from(bytes)
    };
  }
  function isEndChar(c) {
    switch (c) {
      case 43:
      case 44:
      case 59:
        return true;
      default:
        return false;
    }
  }
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/read-attribute-pair.js
var require_read_attribute_pair = __commonJS(function(exports, module) {
  var findNameStart = require_find_name_start();
  var findNameEnd = require_find_name_end();
  var isValidAttributeTypeName = require_is_valid_attribute_type_name();
  var readAttributeValue = require_read_attribute_value();
  module.exports = function readAttributePair({ searchBuffer, startPos }) {
    let pos = startPos;
    const nameStartPos = findNameStart({
      searchBuffer,
      startPos: pos
    });
    if (nameStartPos < 0) {
      throw Error("invalid attribute name leading character encountered");
    }
    const nameEndPos = findNameEnd({
      searchBuffer,
      startPos: nameStartPos
    });
    if (nameStartPos < 0) {
      throw Error("invalid character in attribute name encountered");
    }
    const attributeName = searchBuffer.subarray(nameStartPos, nameEndPos).toString("utf8");
    if (isValidAttributeTypeName(attributeName) === false) {
      throw Error("invalid attribute type name: " + attributeName);
    }
    const valueReadResult = readAttributeValue({
      searchBuffer,
      startPos: nameEndPos
    });
    pos = valueReadResult.endPos;
    const attributeValue = valueReadResult.value;
    return {
      endPos: pos,
      pair: { [attributeName]: attributeValue }
    };
  };
});

// node_modules/@ldapjs/dn/lib/utils/parse-string/index.js
var require_parse_string = __commonJS(function(exports, module) {
  var readAttributePair = require_read_attribute_pair();
  module.exports = function parseString(input) {
    if (typeof input !== "string") {
      throw Error("input must be a string");
    }
    if (input.length === 0) {
      return [];
    }
    const searchBuffer = Buffer.from(input, "utf8");
    const length = searchBuffer.byteLength;
    const rdns = [];
    let pos = 0;
    let rdn = {};
    readRdnLoop:
      while (pos <= length) {
        if (pos === length) {
          const char = searchBuffer[pos - 1];
          if (char === 43 || char === 44 || char === 59) {
            throw Error("rdn string ends abruptly with character: " + String.fromCharCode(char));
          }
        }
        while (pos < length && searchBuffer[pos] === 32) {
          pos += 1;
        }
        const readAttrPairResult = readAttributePair({ searchBuffer, startPos: pos });
        pos = readAttrPairResult.endPos;
        rdn = { ...rdn, ...readAttrPairResult.pair };
        if (pos >= length) {
          rdns.push(rdn);
          break;
        }
        while (pos < length) {
          const char = searchBuffer[pos];
          if (char === 43) {
            pos += 1;
            continue readRdnLoop;
          }
          if (char === 44 || char === 59) {
            rdns.push(rdn);
            rdn = {};
            pos += 1;
            continue readRdnLoop;
          }
        }
      }
    return rdns;
  };
});

// node_modules/@ldapjs/dn/lib/dn.js
var require_dn = __commonJS(function(exports, module) {
  var warning = require_deprecations3();
  var RDN = require_rdn();
  var parseString = require_parse_string();

  class DN {
    #rdns = [];
    constructor({ rdns = [] } = {}) {
      if (Array.isArray(rdns) === false) {
        throw Error("rdns must be an array");
      }
      const hasNonRdn = rdns.some((r) => RDN.isRdn(r) === false);
      if (hasNonRdn === true) {
        throw Error("rdns must be an array of RDN objects");
      }
      Array.prototype.push.apply(this.#rdns, rdns.map((r) => {
        if (Object.prototype.toString.call(r) === "[object LdapRdn]") {
          return r;
        }
        return new RDN(r);
      }));
    }
    get [Symbol.toStringTag]() {
      return "LdapDn";
    }
    get length() {
      return this.#rdns.length;
    }
    childOf(dn) {
      if (typeof dn === "string") {
        const parsedDn = DN.fromString(dn);
        return parsedDn.parentOf(this);
      }
      return dn.parentOf(this);
    }
    clone() {
      return new DN({ rdns: this.#rdns });
    }
    equals(dn) {
      if (typeof dn === "string") {
        const parsedDn = DN.fromString(dn);
        return parsedDn.equals(this);
      }
      if (this.length !== dn.length)
        return false;
      for (let i = 0;i < this.length; i += 1) {
        if (this.#rdns[i].equals(dn.rdnAt(i)) === false) {
          return false;
        }
      }
      return true;
    }
    format() {
      warning.emit("LDAP_DN_DEP_002");
      return this.toString();
    }
    isEmpty() {
      return this.#rdns.length === 0;
    }
    parent() {
      if (this.length === 0)
        return;
      const save = this.shift();
      const dn = new DN({ rdns: this.#rdns });
      this.unshift(save);
      return dn;
    }
    parentOf(dn) {
      if (typeof dn === "string") {
        const parsedDn = DN.fromString(dn);
        return this.parentOf(parsedDn);
      }
      if (this.length >= dn.length) {
        return false;
      }
      const numberOfElementsDifferent = dn.length - this.length;
      for (let i = this.length - 1;i >= 0; i -= 1) {
        const myRdn = this.#rdns[i];
        const theirRdn = dn.rdnAt(i + numberOfElementsDifferent);
        if (myRdn.equals(theirRdn) === false) {
          return false;
        }
      }
      return true;
    }
    pop() {
      return this.#rdns.pop();
    }
    push(rdn) {
      if (Object.prototype.toString.call(rdn) !== "[object LdapRdn]") {
        throw Error("rdn must be a RDN instance");
      }
      return this.#rdns.push(rdn);
    }
    rdnAt(index) {
      return this.#rdns[index];
    }
    reverse() {
      this.#rdns.reverse();
      return this;
    }
    setFormat() {
      warning.emit("LDAP_DN_DEP_004");
    }
    shift() {
      return this.#rdns.shift();
    }
    toString() {
      let result = "";
      for (const rdn of this.#rdns) {
        const rdnString = rdn.toString();
        result += `,${rdnString}`;
      }
      return result.substring(1);
    }
    unshift(rdn) {
      if (Object.prototype.toString.call(rdn) !== "[object LdapRdn]") {
        throw Error("rdn must be a RDN instance");
      }
      return this.#rdns.unshift(rdn);
    }
    static isDn(dn) {
      if (Object.prototype.toString.call(dn) === "[object LdapDn]") {
        return true;
      }
      if (Object.prototype.toString.call(dn) !== "[object Object]" || Array.isArray(dn.rdns) === false) {
        return false;
      }
      if (dn.rdns.some((dn) => RDN.isRdn(dn) === false) === true) {
        return false;
      }
      return true;
    }
    static fromString(dnString) {
      const rdns = parseString(dnString);
      return new DN({ rdns });
    }
  }
  module.exports = DN;
});

// node_modules/@ldapjs/dn/index.js
var require_dn2 = __commonJS(function(exports, module) {
  module.exports = {
    DN: require_dn(),
    RDN: require_rdn()
  };
});

// node_modules/@ldapjs/messages/lib/messages/add-request.js
var require_add_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var Attribute = require_attribute();
  var Protocol = require_protocol();
  var { DN } = require_dn2();

  class AddRequest extends LdapMessage {
    #entry;
    #attributes = [];
    constructor(options = {}) {
      options.protocolOp = Protocol.operations.LDAP_REQ_ADD;
      super(options);
      this.entry = options.entry || null;
      this.attributes = options.attributes || [];
    }
    get attributes() {
      return this.#attributes.slice(0);
    }
    set attributes(attrs) {
      if (Array.isArray(attrs) === false) {
        throw Error("attrs must be an array");
      }
      const newAttrs = [];
      for (const attr of attrs) {
        if (Attribute.isAttribute(attr) === false) {
          throw Error("attr must be an Attribute instance or Attribute-like object");
        }
        if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
          newAttrs.push(new Attribute(attr));
          continue;
        }
        newAttrs.push(attr);
      }
      this.#attributes = newAttrs;
    }
    get entry() {
      return this.#entry ?? null;
    }
    set entry(path) {
      if (path === null)
        return;
      if (typeof path === "string") {
        this.#entry = DN.fromString(path);
      } else if (Object.prototype.toString.call(path) === "[object LdapDn]") {
        this.#entry = path;
      } else {
        throw Error("entry must be a valid DN string or instance of LdapDn");
      }
    }
    get _dn() {
      return this.entry;
    }
    get type() {
      return "AddRequest";
    }
    addAttribute(attr) {
      if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
        throw Error("attr must be an instance of Attribute");
      }
      this.#attributes.push(attr);
    }
    attributeNames() {
      return this.#attributes.map((attr) => attr.type);
    }
    getAttribute(attributeName) {
      if (typeof attributeName !== "string") {
        throw Error("attributeName must be a string");
      }
      for (const attr of this.#attributes) {
        if (attr.type === attributeName) {
          return attr;
        }
      }
      return null;
    }
    indexOf(attributeName) {
      if (typeof attributeName !== "string") {
        throw Error("attributeName must be a string");
      }
      for (let i = 0;i < this.#attributes.length; i += 1) {
        if (this.#attributes[i].type === attributeName) {
          return i;
        }
      }
      return -1;
    }
    _toBer(ber) {
      ber.startSequence(Protocol.operations.LDAP_REQ_ADD);
      ber.writeString(this.#entry.toString());
      ber.startSequence();
      for (const attr of this.#attributes) {
        const attrBer = attr.toBer();
        ber.appendBuffer(attrBer.buffer);
      }
      ber.endSequence();
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.entry = this.#entry ? this.#entry.toString() : null;
      obj.attributes = [];
      for (const attr of this.#attributes) {
        obj.attributes.push(attr.pojo);
      }
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== Protocol.operations.LDAP_REQ_ADD) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const entry = ber.readString();
      const attributes = [];
      ber.readSequence();
      const endOfAttributesPos = ber.offset + ber.length;
      while (ber.offset < endOfAttributesPos) {
        const attribute = Attribute.fromBer(ber);
        attribute.type = attribute.type.toLowerCase();
        if (attribute.type === "objectclass") {
          for (let i = 0;i < attribute.values.length; i++) {
            attribute.values[i] = attribute.values[i].toLowerCase();
          }
        }
        attributes.push(attribute);
      }
      return { protocolOp, entry, attributes };
    }
  }
  module.exports = AddRequest;
});

// node_modules/@ldapjs/messages/lib/messages/bind-request.js
var require_bind_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var Protocol = require_protocol();
  var { BerTypes } = require_asn1();

  class BindRequest extends LdapMessage {
    static SIMPLE_BIND = "simple";
    static SASL_BIND = "sasl";
    #version = 3;
    #name;
    #authentication = BindRequest.SIMPLE_BIND;
    #credentials = "";
    constructor(options = {}) {
      options.protocolOp = Protocol.operations.LDAP_REQ_BIND;
      super(options);
      const {
        version = 3,
        name = null,
        authentication = BindRequest.SIMPLE_BIND,
        credentials = ""
      } = options;
      this.#version = version;
      this.#name = name;
      this.#authentication = authentication;
      this.#credentials = credentials;
    }
    get credentials() {
      return this.#credentials;
    }
    get name() {
      return this.#name;
    }
    get type() {
      return "BindRequest";
    }
    get version() {
      return this.#version;
    }
    get _dn() {
      return this.#name;
    }
    _toBer(ber) {
      ber.startSequence(Protocol.operations.LDAP_REQ_BIND);
      ber.writeInt(this.#version);
      ber.writeString(this.#name || "");
      ber.writeString(this.#credentials || "", BerTypes.Context);
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.version = this.#version;
      obj.name = this.#name;
      obj.authenticationType = this.#authentication;
      obj.credentials = this.#credentials;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== Protocol.operations.LDAP_REQ_BIND) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const version = ber.readInt();
      const name = ber.readString();
      const tag = ber.peek();
      if (tag !== BerTypes.Context) {
        const authType = tag.toString(16).padStart(2, "0");
        throw Error(`authentication 0x${authType} not supported`);
      }
      const authentication = BindRequest.SIMPLE_BIND;
      const credentials = ber.readString(BerTypes.Context);
      return {
        protocolOp,
        version,
        name,
        authentication,
        credentials
      };
    }
  }
  module.exports = BindRequest;
});

// node_modules/@ldapjs/messages/lib/messages/compare-request.js
var require_compare_request = __commonJS(function(exports, module) {
  var { operations } = require_protocol();
  var { DN } = require_dn2();
  var LdapMessage = require_ldap_message();

  class CompareRequest extends LdapMessage {
    #attribute;
    #entry;
    #value;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_REQ_COMPARE;
      super(options);
      this.attribute = options.attribute || "";
      this.entry = options.entry || null;
      this.value = options.value || "";
    }
    get attribute() {
      return this.#attribute;
    }
    set attribute(value) {
      this.#attribute = value;
    }
    get entry() {
      return this.#entry ?? null;
    }
    set entry(value) {
      if (value === null)
        return;
      if (typeof value === "string") {
        this.#entry = DN.fromString(value);
      } else if (Object.prototype.toString.call(value) === "[object LdapDn]") {
        this.#entry = value;
      } else {
        throw Error("entry must be a valid DN string or instance of LdapDn");
      }
    }
    get type() {
      return "CompareRequest";
    }
    get value() {
      return this.#value;
    }
    set value(value) {
      this.#value = value;
    }
    get _dn() {
      return this.#entry;
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_REQ_COMPARE);
      ber.writeString(this.#entry.toString());
      ber.startSequence();
      ber.writeString(this.#attribute);
      ber.writeString(this.#value);
      ber.endSequence();
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.attribute = this.#attribute;
      obj.entry = this.#entry ? this.#entry.toString() : null;
      obj.value = this.#value;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_REQ_COMPARE) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const entry = ber.readString();
      ber.readSequence();
      const attribute = ber.readString();
      const value = ber.readString();
      return {
        protocolOp,
        entry,
        attribute,
        value
      };
    }
  }
  module.exports = CompareRequest;
});

// node_modules/@ldapjs/messages/lib/messages/delete-request.js
var require_delete_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var Protocol = require_protocol();
  var { DN } = require_dn2();

  class DeleteRequest extends LdapMessage {
    #entry;
    constructor(options = {}) {
      options.protocolOp = Protocol.operations.LDAP_REQ_DELETE;
      super(options);
      this.entry = options.entry ?? null;
    }
    get _dn() {
      return this.entry;
    }
    get entry() {
      return this.#entry ?? null;
    }
    set entry(value) {
      if (value === null)
        return;
      if (typeof value === "string") {
        this.#entry = DN.fromString(value);
      } else if (Object.prototype.toString.call(value) === "[object LdapDn]") {
        this.#entry = value;
      } else {
        throw Error("entry must be a valid DN string or instance of LdapDn");
      }
    }
    get type() {
      return "DeleteRequest";
    }
    _toBer(ber) {
      ber.writeString(this.#entry.toString(), Protocol.operations.LDAP_REQ_DELETE);
      return ber;
    }
    _pojo(obj = {}) {
      obj.protocolOp = Protocol.operations.LDAP_REQ_DELETE;
      obj.entry = this.#entry ? this.#entry.toString() : null;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.peek();
      if (protocolOp !== Protocol.operations.LDAP_REQ_DELETE) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const entry = ber.readString(Protocol.operations.LDAP_REQ_DELETE);
      return { protocolOp, entry };
    }
  }
  module.exports = DeleteRequest;
});

// node_modules/@ldapjs/messages/lib/messages/extension-utils/recognized-oids.js
var require_recognized_oids = __commonJS(function(exports, module) {
  var OIDS = new Map([
    ["CANCEL_REQUEST", "1.3.6.1.1.8"],
    ["DISCONNECTION_NOTIFICATION", "1.3.6.1.4.1.1466.20036"],
    ["PASSWORD_MODIFY", "1.3.6.1.4.1.4203.1.11.1"],
    ["START_TLS", "1.3.6.1.4.1.1466.20037"],
    ["WHO_AM_I", "1.3.6.1.4.1.4203.1.11.3"]
  ]);
  Object.defineProperty(OIDS, "lookupName", {
    value: function(oid) {
      for (const [key, value] of this.entries()) {
        if (value === oid)
          return key;
      }
    }
  });
  Object.defineProperty(OIDS, "lookupOID", {
    value: function(name) {
      for (const [key, value] of this.entries()) {
        if (key === name)
          return value;
      }
    }
  });
  module.exports = OIDS;
});

// node_modules/@ldapjs/messages/lib/messages/extension-request.js
var require_extension_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { operations } = require_protocol();
  var RECOGNIZED_OIDS = require_recognized_oids();

  class ExtensionRequest extends LdapMessage {
    #requestName;
    #requestValue;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_REQ_EXTENSION;
      super(options);
      this.requestName = options.requestName || "";
      this.requestValue = options.requestValue;
    }
    get _dn() {
      return this.#requestName;
    }
    get requestName() {
      return this.#requestName;
    }
    set requestName(value) {
      this.#requestName = value;
    }
    get type() {
      return "ExtensionRequest";
    }
    get requestValue() {
      return this.#requestValue;
    }
    set requestValue(val) {
      this.#requestValue = val;
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_REQ_EXTENSION);
      ber.writeString(this.requestName, 128);
      if (this.requestValue) {
        switch (this.requestName) {
          case RECOGNIZED_OIDS.get("CANCEL_REQUEST"): {
            encodeCancelRequest({ ber, requestValue: this.requestValue });
            break;
          }
          case RECOGNIZED_OIDS.get("PASSWORD_MODIFY"): {
            encodePasswordModify({
              ber,
              requestValue: this.requestValue
            });
            break;
          }
          default: {
            ber.writeString(this.requestValue, 129);
          }
        }
      }
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.requestName = this.requestName;
      obj.requestValue = this.requestValue;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_REQ_EXTENSION) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const requestName = ber.readString(128);
      if (ber.peek() !== 129) {
        return { protocolOp, requestName };
      }
      let requestValue;
      switch (requestName) {
        case RECOGNIZED_OIDS.get("CANCEL_REQUEST"): {
          requestValue = readCancelRequest(ber);
          break;
        }
        case RECOGNIZED_OIDS.get("PASSWORD_MODIFY"): {
          requestValue = readPasswordModify(ber);
          break;
        }
        default: {
          requestValue = ber.readString(129);
          break;
        }
      }
      return { protocolOp, requestName, requestValue };
    }
    static recognizedOIDs() {
      return RECOGNIZED_OIDS;
    }
  }
  module.exports = ExtensionRequest;
  function encodeCancelRequest({ ber, requestValue }) {
    ber.startSequence(129);
    ber.startSequence();
    ber.writeInt(requestValue);
    ber.endSequence();
    ber.endSequence();
  }
  function readCancelRequest(ber) {
    ber.readSequence(129);
    ber.readSequence();
    return ber.readInt();
  }
  function encodePasswordModify({ ber, requestValue }) {
    ber.startSequence(129);
    ber.startSequence();
    if (requestValue.userIdentity) {
      ber.writeString(requestValue.userIdentity, 128);
    }
    if (requestValue.oldPassword) {
      ber.writeString(requestValue.oldPassword, 129);
    }
    if (requestValue.newPassword) {
      ber.writeString(requestValue.newPassword, 130);
    }
    ber.endSequence();
    ber.endSequence();
  }
  function readPasswordModify(ber) {
    ber.readSequence(129);
    ber.readSequence();
    let userIdentity;
    if (ber.peek() === 128) {
      userIdentity = ber.readString(128);
    }
    let oldPassword;
    if (ber.peek() === 129) {
      oldPassword = ber.readString(129);
    }
    let newPassword;
    if (ber.peek() === 130) {
      newPassword = ber.readString(130);
    }
    return { userIdentity, oldPassword, newPassword };
  }
});

// node_modules/@ldapjs/change/index.js
var require_change = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_asn1();
  var Attribute = require_attribute();

  class Change {
    #operation;
    #modification;
    constructor({ operation = "add", modification }) {
      this.operation = operation;
      this.modification = modification;
    }
    get [Symbol.toStringTag]() {
      return "LdapChange";
    }
    get modification() {
      return this.#modification;
    }
    set modification(mod) {
      if (Attribute.isAttribute(mod) === false) {
        throw Error("modification must be an Attribute");
      }
      if (Object.prototype.toString.call(mod) !== "[object LdapAttribute]") {
        mod = new Attribute(mod);
      }
      this.#modification = mod;
    }
    get pojo() {
      return {
        operation: this.operation,
        modification: this.modification.pojo
      };
    }
    get operation() {
      switch (this.#operation) {
        case 0: {
          return "add";
        }
        case 1: {
          return "delete";
        }
        case 2: {
          return "replace";
        }
      }
    }
    set operation(op) {
      if (typeof op === "string") {
        op = op.toLowerCase();
      }
      switch (op) {
        case 0:
        case "add": {
          this.#operation = 0;
          break;
        }
        case 1:
        case "delete": {
          this.#operation = 1;
          break;
        }
        case 2:
        case "replace": {
          this.#operation = 2;
          break;
        }
        default: {
          const type = Number.isInteger(op) ? "0x" + Number(op).toString(16) : op;
          throw Error(`invalid operation type: ${type}`);
        }
      }
    }
    toBer() {
      const writer = new BerWriter;
      writer.startSequence();
      writer.writeEnumeration(this.#operation);
      const attrBer = this.#modification.toBer();
      writer.appendBuffer(attrBer.buffer);
      writer.endSequence();
      return new BerReader(writer.buffer);
    }
    toJSON() {
      return this.pojo;
    }
    static apply(change, target, scalar = false) {
      if (Change.isChange(change) === false) {
        throw Error("change must be an instance of Change");
      }
      const type = change.modification.type;
      const values = change.modification.values;
      let data = target[type];
      if (data === undefined) {
        data = [];
      } else if (Array.isArray(data) === false) {
        data = [data];
      }
      switch (change.operation) {
        case "add": {
          const newValues = values.filter((v) => data.indexOf(v) === -1);
          Array.prototype.push.apply(data, newValues);
          break;
        }
        case "delete": {
          data = data.filter((v) => values.indexOf(v) === -1);
          if (data.length === 0) {
            delete target[type];
            return target;
          }
          break;
        }
        case "replace": {
          if (values.length === 0) {
            delete target[type];
            return target;
          }
          data = values;
          break;
        }
      }
      if (scalar === true && data.length === 1) {
        target[type] = data[0];
      } else {
        target[type] = data;
      }
      return target;
    }
    static isChange(change) {
      if (Object.prototype.toString.call(change) === "[object LdapChange]") {
        return true;
      }
      if (Object.prototype.toString.call(change) !== "[object Object]") {
        return false;
      }
      if (Attribute.isAttribute(change.modification) === true && (typeof change.operation === "string" || typeof change.operation === "number")) {
        return true;
      }
      return false;
    }
    static compare(change1, change2) {
      if (Change.isChange(change1) === false || Change.isChange(change2) === false) {
        throw Error("can only compare Change instances");
      }
      if (change1.operation < change2.operation) {
        return -1;
      }
      if (change1.operation > change2.operation) {
        return 1;
      }
      return Attribute.compare(change1.modification, change2.modification);
    }
    static fromBer(ber) {
      ber.readSequence();
      const operation = ber.readEnumeration();
      const modification = Attribute.fromBer(ber);
      return new Change({ operation, modification });
    }
  }
  module.exports = Change;
});

// node_modules/@ldapjs/messages/lib/messages/modify-request.js
var require_modify_request = __commonJS(function(exports, module) {
  var { operations } = require_protocol();
  var Change = require_change();
  var LdapMessage = require_ldap_message();

  class ModifyRequest extends LdapMessage {
    #object;
    #changes;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_REQ_MODIFY;
      super(options);
      this.#object = options.object || null;
      this.changes = options.changes || [];
    }
    get changes() {
      return this.#changes.slice(0);
    }
    set changes(values) {
      this.#changes = [];
      if (Array.isArray(values) === false) {
        throw Error("changes must be an array");
      }
      for (let change of values) {
        if (Change.isChange(change) === false) {
          throw Error("change must be an instance of Change or a Change-like object");
        }
        if (Object.prototype.toString.call(change) !== "[object LdapChange]") {
          change = new Change(change);
        }
        this.#changes.push(change);
      }
    }
    get object() {
      return this.#object;
    }
    set object(value) {
      this.#object = value;
    }
    get type() {
      return "ModifyRequest";
    }
    get _dn() {
      return this.#object;
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_REQ_MODIFY);
      ber.writeString(this.#object.toString());
      ber.startSequence();
      for (const change of this.#changes) {
        ber.appendBuffer(change.toBer().buffer);
      }
      ber.endSequence();
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.object = this.#object;
      obj.changes = this.#changes.map((c) => c.pojo);
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_REQ_MODIFY) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const object = ber.readString();
      const changes = [];
      ber.readSequence();
      const end = ber.offset + ber.length;
      while (ber.offset < end) {
        const change = Change.fromBer(ber);
        changes.push(change.pojo);
      }
      return { protocolOp, object, changes };
    }
  }
  module.exports = ModifyRequest;
});

// node_modules/@ldapjs/messages/lib/messages/modifydn-request.js
var require_modifydn_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { operations } = require_protocol();
  var { DN } = require_dn2();

  class ModifyDnRequest extends LdapMessage {
    #entry;
    #newRdn;
    #deleteOldRdn;
    #newSuperior;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_REQ_MODRDN;
      super(options);
      this.entry = options.entry || "";
      this.newRdn = options.newRdn || "";
      this.deleteOldRdn = options.deleteOldRdn ?? false;
      this.newSuperior = options.newSuperior;
    }
    get entry() {
      return this.#entry;
    }
    set entry(value) {
      if (typeof value === "string") {
        this.#entry = DN.fromString(value);
      } else if (Object.prototype.toString.call(value) === "[object LdapDn]") {
        this.#entry = value;
      } else {
        throw Error("entry must be a valid DN string or instance of LdapDn");
      }
    }
    get _dn() {
      return this.#entry;
    }
    get newRdn() {
      return this.#newRdn;
    }
    set newRdn(value) {
      if (typeof value === "string") {
        this.#newRdn = DN.fromString(value);
      } else if (Object.prototype.toString.call(value) === "[object LdapDn]") {
        this.#newRdn = value;
      } else {
        throw Error("newRdn must be a valid DN string or instance of LdapDn");
      }
    }
    get deleteOldRdn() {
      return this.#deleteOldRdn;
    }
    set deleteOldRdn(value) {
      if (typeof value !== "boolean") {
        throw Error("deleteOldRdn must be a boolean value");
      }
      this.#deleteOldRdn = value;
    }
    get newSuperior() {
      return this.#newSuperior;
    }
    set newSuperior(value) {
      if (value) {
        if (typeof value === "string") {
          this.#newSuperior = DN.fromString(value);
        } else if (Object.prototype.toString.call(value) === "[object LdapDn]") {
          this.#newSuperior = value;
        } else {
          throw Error("newSuperior must be a valid DN string or instance of LdapDn");
        }
      } else {
        this.#newSuperior = undefined;
      }
    }
    get type() {
      return "ModifyDnRequest";
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_REQ_MODRDN);
      ber.writeString(this.#entry.toString());
      ber.writeString(this.#newRdn.toString());
      ber.writeBoolean(this.#deleteOldRdn);
      if (this.#newSuperior !== undefined) {
        ber.writeString(this.#newSuperior.toString(), 128);
      }
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.entry = this.#entry.toString();
      obj.newRdn = this.#newRdn.toString();
      obj.deleteOldRdn = this.#deleteOldRdn;
      obj.newSuperior = this.#newSuperior ? this.#newSuperior.toString() : undefined;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_REQ_MODRDN) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const entry = ber.readString();
      const newRdn = ber.readString();
      const deleteOldRdn = ber.readBoolean();
      let newSuperior;
      if (ber.peek() === 128) {
        newSuperior = ber.readString(128);
      }
      return { protocolOp, entry, newRdn, deleteOldRdn, newSuperior };
    }
  }
  module.exports = ModifyDnRequest;
});

// node_modules/@ldapjs/filter/lib/utils/test-values.js
var require_test_values = __commonJS(function(exports, module) {
  module.exports = testValues;
  function testValues({ rule, value, requireAllMatch = false }) {
    if (Array.isArray(value) === false) {
      return rule(value);
    }
    if (requireAllMatch === true) {
      for (let i = 0;i < value.length; i++) {
        if (rule(value[i]) === false) {
          return false;
        }
      }
      return true;
    }
    for (let i = 0;i < value.length; i++) {
      if (rule(value[i])) {
        return true;
      }
    }
    return false;
  }
});

// node_modules/@ldapjs/filter/lib/utils/get-attribute-value.js
var require_get_attribute_value = __commonJS(function(exports, module) {
  module.exports = getAttributeValue;
  function getAttributeValue({ sourceObject, attributeName, strictCase = false }) {
    if (Object.prototype.toString.call(sourceObject) === "[object LdapAttribute]") {
      sourceObject = {
        [sourceObject.type]: sourceObject.values
      };
    }
    if (Object.prototype.toString.call(sourceObject) !== "[object Object]") {
      throw Error("sourceObject must be an object");
    }
    if (typeof attributeName !== "string") {
      throw Error("attributeName must be a string");
    }
    if (Object.prototype.hasOwnProperty.call(sourceObject, attributeName)) {
      return sourceObject[attributeName];
    } else if (strictCase === true) {
      return;
    }
    const lowerName = attributeName.toLowerCase();
    const foundName = Object.getOwnPropertyNames(sourceObject).find((name) => name.toLowerCase() === lowerName);
    return foundName && sourceObject[foundName];
  }
});

// node_modules/@ldapjs/filter/lib/filter-string.js
var require_filter_string = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_asn1();

  class FilterString {
    TAG = 48;
    type = "FilterString";
    attribute = "";
    #value;
    #clauses = [];
    constructor({ attribute = "", value, clauses = [] } = {}) {
      this.attribute = attribute;
      this.#value = value;
      if (Array.isArray(clauses) === false) {
        throw Error("clauses must be an array");
      }
      Array.prototype.push.apply(this.#clauses, clauses);
    }
    get [Symbol.toStringTag]() {
      return "FilterString";
    }
    get value() {
      return this.#value;
    }
    set value(val) {
      this.#value = val;
    }
    matches() {
      return false;
    }
    toString() {
      return "()";
    }
    toBer() {
      const ber = new BerWriter;
      ber.startSequence(this.TAG);
      this._toBer(ber);
      ber.endSequence();
      return new BerReader(ber.buffer);
    }
    _toBer(ber) {
      ber.writeNull();
    }
    get json() {
      return {
        type: this.type,
        attribute: this.attribute,
        value: this.#value
      };
    }
    get filter() {
      return this;
    }
    get filters() {
      return this.#clauses;
    }
    get clauses() {
      return this.#clauses;
    }
    forEach(callback) {
      this.#clauses.forEach((clause) => clause.forEach(callback));
      callback(this);
    }
    map(callback) {
      if (this.#clauses.length === 0) {
        return callback(this);
      }
      const child = this.#clauses.map((clause) => clause.map(callback)).filter((clause) => clause !== null);
      if (child.length === 0) {
        return null;
      }
      this.#clauses = child;
      return callback(this);
    }
    addFilter(filter) {
      this.addClause(filter);
    }
    addClause(clause) {
      if (clause instanceof FilterString === false) {
        throw Error("clause must be an instance of FilterString");
      }
      this.#clauses.push(clause);
    }
    static parse(buffer) {
      if (buffer.length !== 4) {
        throw Error(`expected buffer length 4, got ${buffer.length}`);
      }
      const reader = new BerReader(buffer);
      let seq = reader.readSequence();
      if (seq !== 48) {
        throw Error(`expected sequence start, got 0x${seq.toString(16).padStart(2, "0")}`);
      }
      seq = reader.readSequence();
      if (seq !== 5) {
        throw Error(`expected null sequence start, got 0x${seq.toString(16).padStart(2, "0")}`);
      }
      return new FilterString;
    }
  }
  module.exports = FilterString;
});

// node_modules/@ldapjs/filter/lib/utils/escape-filter-value.js
var require_escape_filter_value = __commonJS(function(exports, module) {
  module.exports = escapeFilterValue;
  function escapeFilterValue(toEscape) {
    if (typeof toEscape === "string") {
      return escapeBuffer(Buffer.from(toEscape));
    }
    if (Buffer.isBuffer(toEscape)) {
      return escapeBuffer(toEscape);
    }
    throw Error("toEscape must be a string or a Buffer");
  }
  function escapeBuffer(buf) {
    let result = "";
    for (let i = 0;i < buf.length; i += 1) {
      if (buf[i] >= 192 && buf[i] <= 223) {
        result += "\\" + buf[i].toString(16) + "\\" + buf[i + 1].toString(16);
        i += 1;
        continue;
      }
      if (buf[i] >= 224 && buf[i] <= 239) {
        result += [
          "\\",
          buf[i].toString(16),
          "\\",
          buf[i + 1].toString(16),
          "\\",
          buf[i + 2].toString(16)
        ].join("");
        i += 2;
        continue;
      }
      if (buf[i] <= 31) {
        result += "\\" + buf[i].toString(16).padStart(2, "0");
        continue;
      }
      const char = String.fromCharCode(buf[i]);
      switch (char) {
        case "*": {
          result += "\\2a";
          break;
        }
        case "(": {
          result += "\\28";
          break;
        }
        case ")": {
          result += "\\29";
          break;
        }
        case "\\": {
          const escapedChars = readEscapedCharacters(buf, i);
          i += escapedChars.length;
          result += escapedChars.join("");
          break;
        }
        default: {
          result += char;
          break;
        }
      }
    }
    return result;
  }
  function readEscapedCharacters(buf, start) {
    const chars = [];
    for (let i = start;; ) {
      if (buf[i] === undefined) {
        chars[-1] = "\\5c";
        break;
      }
      if (buf[i] === 92) {
        chars.push("\\");
        i += 1;
        continue;
      }
      const strHexCode = String.fromCharCode(buf[i]) + String.fromCharCode(buf[i + 1]);
      const hexCode = parseInt(strHexCode, 16);
      if (Number.isNaN(hexCode)) {
        chars.push("5c" + strHexCode);
        break;
      }
      if (hexCode >= 192 && hexCode <= 223) {
        chars.push(hexCode.toString(16).padEnd(2, "0"));
        for (let x = i + 2;x < i + 4; x += 1) {
          chars.push(String.fromCharCode(buf[x]));
        }
        break;
      }
      if (hexCode >= 224 && hexCode <= 239) {
        chars.push(hexCode.toString(16).padStart(2, "0"));
        for (let x = i + 2;x < i + 8; x += 1) {
          chars.push(String.fromCharCode(buf[x]));
        }
        break;
      }
      chars.push(hexCode.toString(16).padStart(2, "0"));
      break;
    }
    return chars;
  }
});

// node_modules/@ldapjs/filter/lib/filters/approximate.js
var require_approximate = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { BerReader } = require_asn1();
  var { search } = require_protocol();
  var escapeFilterValue = require_escape_filter_value();

  class ApproximateFilter extends FilterString {
    constructor({ attribute, value } = {}) {
      if (typeof attribute !== "string" || attribute.length < 1) {
        throw Error("attribute must be a string of at least one character");
      }
      if (typeof value !== "string" || value.length < 1) {
        throw Error("value must be a string of at least one character");
      }
      super({ attribute, value });
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_APPROX },
        type: { value: "ApproximateFilter" }
      });
    }
    matches() {
      throw Error("not implemented");
    }
    toString() {
      return "(" + escapeFilterValue(this.attribute) + "~=" + escapeFilterValue(this.value) + ")";
    }
    _toBer(ber) {
      ber.writeString(this.attribute);
      ber.writeString(this.value);
      return ber;
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const seq = reader.readSequence();
      if (seq !== search.FILTER_APPROX) {
        const expected = "0x" + search.FILTER_APPROX.toString(16).padStart(2, "0");
        const found = "0x" + seq.toString(16).padStart(2, "0");
        throw Error(`expected approximate filter sequence ${expected}, got ${found}`);
      }
      const attribute = reader.readString();
      const value = reader.readString();
      return new ApproximateFilter({ attribute, value });
    }
  }
  module.exports = ApproximateFilter;
});

// node_modules/@ldapjs/filter/lib/filters/equality.js
var require_equality = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { BerReader, BerTypes } = require_asn1();
  var { search } = require_protocol();
  var escapeFilterValue = require_escape_filter_value();
  var testValues = require_test_values();
  var getAttributeValue = require_get_attribute_value();

  class EqualityFilter extends FilterString {
    #raw;
    constructor({ attribute, raw, value } = {}) {
      if (typeof attribute !== "string" || attribute.length < 1) {
        throw Error("attribute must be a string of at least one character");
      }
      super({ attribute, value });
      if (raw) {
        this.#raw = raw;
      } else {
        if (!value) {
          throw Error("must either provide a buffer via `raw` or some `value`");
        }
        this.#raw = Buffer.from(value);
      }
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_EQUALITY },
        type: { value: "EqualityFilter" }
      });
    }
    get value() {
      return Buffer.isBuffer(this.#raw) ? this.#raw.toString() : this.#raw;
    }
    set value(val) {
      if (typeof val === "string") {
        this.#raw = Buffer.from(val);
      } else if (Buffer.isBuffer(val)) {
        this.#raw = Buffer.alloc(val.length);
        val.copy(this.#raw);
      } else {
        this.#raw = val;
      }
    }
    matches(obj, strictAttrCase = true) {
      if (Array.isArray(obj) === true) {
        for (const attr of obj) {
          if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
            throw Error("array element must be an instance of LdapAttribute");
          }
          if (this.matches(attr, strictAttrCase) === true) {
            return true;
          }
        }
        return false;
      }
      let testValue = this.value;
      if (this.attribute.toLowerCase() === "objectclass") {
        const targetAttribute = getAttributeValue({
          sourceObject: obj,
          attributeName: this.attribute,
          strictCase: false
        });
        testValue = testValue.toLowerCase();
        return testValues({
          rule: (v) => testValue === v.toLowerCase(),
          value: targetAttribute
        });
      }
      const targetAttribute = getAttributeValue({
        sourceObject: obj,
        attributeName: this.attribute,
        strictCase: strictAttrCase
      });
      return testValues({
        rule: (v) => testValue === v,
        value: targetAttribute
      });
    }
    toString() {
      let value;
      if (Buffer.isBuffer(this.#raw)) {
        value = this.#raw;
        const decoded = this.#raw.toString("utf8");
        const validate = Buffer.from(decoded, "utf8");
        if (validate.length === this.#raw.length) {
          value = decoded;
        }
      } else if (typeof this.#raw === "string") {
        value = this.#raw;
      } else {
        throw new Error("invalid value type");
      }
      return "(" + escapeFilterValue(this.attribute) + "=" + escapeFilterValue(value) + ")";
    }
    _toBer(ber) {
      ber.writeString(this.attribute);
      ber.writeBuffer(this.#raw, BerTypes.OctetString);
      return ber;
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const tag = reader.readSequence();
      if (tag !== search.FILTER_EQUALITY) {
        const expected = "0x" + search.FILTER_EQUALITY.toString(16).padStart(2, "0");
        const found = "0x" + tag.toString(16).padStart(2, "0");
        throw Error(`expected equality filter sequence ${expected}, got ${found}`);
      }
      const attribute = reader.readString();
      const value = reader.readString(BerTypes.OctetString, true);
      return new EqualityFilter({ attribute, value });
    }
  }
  module.exports = EqualityFilter;
});

// node_modules/@ldapjs/filter/lib/filters/extensible.js
var require_extensible = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { search } = require_protocol();
  var { BerReader } = require_asn1();

  class ExtensibleFilter extends FilterString {
    #dnAttributes;
    #rule;
    constructor({ attribute, value, rule, matchType, dnAttributes = false } = {}) {
      if (typeof dnAttributes !== "boolean") {
        throw Error("dnAttributes must be a boolean value");
      }
      if (rule && typeof rule !== "string") {
        throw Error("rule must be a string");
      }
      super({ attribute, value });
      if (matchType !== undefined) {
        this.attribute = matchType;
      }
      this.#dnAttributes = dnAttributes;
      this.#rule = rule;
      this.value = value ?? "";
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_EXT },
        type: { value: "ExtensibleFilter" }
      });
    }
    get json() {
      return {
        type: this.type,
        matchRule: this.#rule,
        matchType: this.attribute,
        matchValue: this.value,
        dnAttributes: this.#dnAttributes
      };
    }
    get dnAttributes() {
      return this.#dnAttributes;
    }
    get matchingRule() {
      return this.#rule;
    }
    get matchValue() {
      return this.value;
    }
    get matchType() {
      return this.attribute;
    }
    toString() {
      let result = "(";
      if (this.attribute) {
        result += this.attribute;
      }
      result += ":";
      if (this.#dnAttributes === true) {
        result += "dn:";
      }
      if (this.#rule) {
        result += this.#rule + ":";
      }
      result += "=" + this.value + ")";
      return result;
    }
    matches() {
      throw Error("not implemented");
    }
    _toBer(ber) {
      if (this.#rule) {
        ber.writeString(this.#rule, 129);
      }
      if (this.attribute) {
        ber.writeString(this.attribute, 130);
      }
      ber.writeString(this.value, 131);
      if (this.#dnAttributes === true) {
        ber.writeBoolean(this.#dnAttributes, 132);
      }
      return ber;
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const seq = reader.readSequence();
      if (seq !== search.FILTER_EXT) {
        const expected = "0x" + search.FILTER_EXT.toString(16).padStart(2, "0");
        const found = "0x" + seq.toString(16).padStart(2, "0");
        throw Error(`expected extensible filter sequence ${expected}, got ${found}`);
      }
      let rule;
      let attribute;
      let value;
      let dnAttributes;
      const end = reader.buffer.length;
      while (reader.offset < end) {
        const tag = reader.peek();
        switch (tag) {
          case 129: {
            rule = reader.readString(tag);
            break;
          }
          case 130: {
            attribute = reader.readString(tag);
            break;
          }
          case 131: {
            value = reader.readString(tag);
            break;
          }
          case 132: {
            dnAttributes = reader.readBoolean(tag);
            break;
          }
          default: {
            throw Error("invalid extensible filter type: 0x" + tag.toString(16).padStart(2, "0"));
          }
        }
      }
      return new ExtensibleFilter({ attribute, value, rule, dnAttributes });
    }
  }
  module.exports = ExtensibleFilter;
});

// node_modules/@ldapjs/filter/lib/filters/greater-than-equals.js
var require_greater_than_equals = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { BerReader } = require_asn1();
  var { search } = require_protocol();
  var escapeFilterValue = require_escape_filter_value();
  var testValues = require_test_values();
  var getAttributeValue = require_get_attribute_value();

  class GreaterThanEqualsFilter extends FilterString {
    constructor({ attribute, value } = {}) {
      if (typeof attribute !== "string" || attribute.length < 1) {
        throw Error("attribute must be a string of at least one character");
      }
      if (typeof value !== "string" || value.length < 1) {
        throw Error("value must be a string of at least one character");
      }
      super({ attribute, value });
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_GE },
        type: { value: "GreaterThanEqualsFilter" }
      });
    }
    matches(obj, strictAttrCase = true) {
      if (Array.isArray(obj) === true) {
        for (const attr of obj) {
          if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
            throw Error("array element must be an instance of LdapAttribute");
          }
          if (this.matches(attr, strictAttrCase) === true) {
            return true;
          }
        }
        return false;
      }
      const testValue = this.value;
      const targetAttribute = getAttributeValue({ sourceObject: obj, attributeName: this.attribute, strictCase: strictAttrCase });
      return testValues({
        rule: (v) => testValue <= v,
        value: targetAttribute
      });
    }
    toString() {
      return "(" + escapeFilterValue(this.attribute) + ">=" + escapeFilterValue(this.value) + ")";
    }
    _toBer(ber) {
      ber.writeString(this.attribute);
      ber.writeString(this.value);
      return ber;
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const seq = reader.readSequence();
      if (seq !== search.FILTER_GE) {
        const expected = "0x" + search.FILTER_GE.toString(16).padStart(2, "0");
        const found = "0x" + seq.toString(16).padStart(2, "0");
        throw Error(`expected greater-than-equals filter sequence ${expected}, got ${found}`);
      }
      const attribute = reader.readString();
      const value = reader.readString();
      return new GreaterThanEqualsFilter({ attribute, value });
    }
  }
  module.exports = GreaterThanEqualsFilter;
});

// node_modules/@ldapjs/filter/lib/filters/less-than-equals.js
var require_less_than_equals = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { BerReader } = require_asn1();
  var { search } = require_protocol();
  var escapeFilterValue = require_escape_filter_value();
  var testValues = require_test_values();
  var getAttributeValue = require_get_attribute_value();

  class LessThanEqualsFilter extends FilterString {
    constructor({ attribute, value } = {}) {
      if (typeof attribute !== "string" || attribute.length < 1) {
        throw Error("attribute must be a string of at least one character");
      }
      if (typeof value !== "string" || value.length < 1) {
        throw Error("value must be a string of at least one character");
      }
      super({ attribute, value });
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_LE },
        type: { value: "LessThanEqualsFilter" }
      });
    }
    toString() {
      return "(" + escapeFilterValue(this.attribute) + "<=" + escapeFilterValue(this.value) + ")";
    }
    matches(obj, strictAttrCase = true) {
      if (Array.isArray(obj) === true) {
        for (const attr of obj) {
          if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
            throw Error("array element must be an instance of LdapAttribute");
          }
          if (this.matches(attr, strictAttrCase) === true) {
            return true;
          }
        }
        return false;
      }
      const testValue = this.value;
      const targetAttribute = getAttributeValue({ sourceObject: obj, attributeName: this.attribute, strictCase: strictAttrCase });
      return testValues({
        rule: (v) => v <= testValue,
        value: targetAttribute
      });
    }
    _toBer(ber) {
      ber.writeString(this.attribute);
      ber.writeString(this.value);
      return ber;
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const seq = reader.readSequence();
      if (seq !== search.FILTER_LE) {
        const expected = "0x" + search.FILTER_LE.toString(16).padStart(2, "0");
        const found = "0x" + seq.toString(16).padStart(2, "0");
        throw Error(`expected less-than-equals filter sequence ${expected}, got ${found}`);
      }
      const attribute = reader.readString();
      const value = reader.readString();
      return new LessThanEqualsFilter({ attribute, value });
    }
  }
  module.exports = LessThanEqualsFilter;
});

// node_modules/@ldapjs/filter/lib/filters/not.js
var require_not = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { search } = require_protocol();

  class NotFilter extends FilterString {
    constructor({ filter } = {}) {
      if (filter instanceof FilterString === false) {
        throw Error("filter is required and must be a filter instance");
      }
      super();
      this.attribute = undefined;
      this.filter = filter;
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_NOT },
        type: { value: "NotFilter" }
      });
    }
    get json() {
      return {
        type: this.type,
        filter: this.filter.json
      };
    }
    get filter() {
      return this.clauses[0];
    }
    set filter(filter) {
      if (filter instanceof FilterString === false) {
        throw Error("filter must be a filter instance");
      }
      this.clauses[0] = filter;
    }
    setFilter(filter) {
      this.clauses[0] = filter;
    }
    toString() {
      return "(!" + this.filter.toString() + ")";
    }
    matches(obj, strictAttrCase = true) {
      return !this.filter.matches(obj, strictAttrCase);
    }
    _toBer(ber) {
      const innerBer = this.filter.toBer(ber);
      ber.appendBuffer(innerBer.buffer);
      return ber;
    }
    static parse(buffer) {
      const parseNestedFilter = require_parse_nested_filter();
      return parseNestedFilter({
        buffer,
        constructor: NotFilter,
        startTag: search.FILTER_NOT
      });
    }
  }
  module.exports = NotFilter;
});

// node_modules/@ldapjs/filter/lib/filters/or.js
var require_or = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { search } = require_protocol();

  class OrFilter extends FilterString {
    constructor({ filters = [] } = {}) {
      super({});
      this.attribute = undefined;
      for (const filter of filters) {
        this.addClause(filter);
      }
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_OR },
        type: { value: "OrFilter" }
      });
    }
    get json() {
      return {
        type: this.type,
        filters: this.clauses.map((clause) => clause.json)
      };
    }
    toString() {
      let result = "(|";
      for (const clause of this.clauses) {
        result += clause.toString();
      }
      result += ")";
      return result;
    }
    matches(obj, strictAttrCase = true) {
      if (this.clauses.length === 0) {
        return false;
      }
      for (const clause of this.clauses) {
        if (Array.isArray(obj) === true) {
          for (const attr of obj) {
            if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
              throw Error("array element must be an instance of LdapAttribute");
            }
            if (attr.type !== clause.attribute) {
              continue;
            }
            if (clause.matches(attr, strictAttrCase) === true) {
              return true;
            }
          }
        } else {
          if (clause.matches(obj, strictAttrCase) === true) {
            return true;
          }
        }
      }
      return false;
    }
    _toBer(ber) {
      for (const clause of this.clauses) {
        const filterBer = clause.toBer();
        ber.appendBuffer(filterBer.buffer);
      }
      return ber;
    }
    static parse(buffer) {
      const parseNestedFilter = require_parse_nested_filter();
      return parseNestedFilter({
        buffer,
        constructor: OrFilter,
        startTag: search.FILTER_OR
      });
    }
  }
  module.exports = OrFilter;
});

// node_modules/@ldapjs/filter/lib/filters/presence.js
var require_presence = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { BerReader } = require_asn1();
  var { search } = require_protocol();
  var escapeFilterValue = require_escape_filter_value();
  var getAttributeValue = require_get_attribute_value();

  class PresenceFilter extends FilterString {
    constructor({ attribute } = {}) {
      if (typeof attribute !== "string" || attribute.length < 1) {
        throw Error("attribute must be a string of at least one character");
      }
      super({ attribute });
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_PRESENT },
        type: { value: "PresenceFilter" }
      });
    }
    matches(obj, strictAttributeCase = true) {
      if (Array.isArray(obj) === true) {
        for (const attr of obj) {
          if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
            throw Error("array element must be an instance of LdapAttribute");
          }
          if (this.matches(attr, strictAttributeCase) === true) {
            return true;
          }
        }
        return false;
      }
      return getAttributeValue({
        sourceObject: obj,
        attributeName: this.attribute,
        strictCase: strictAttributeCase
      }) !== undefined;
    }
    toString() {
      return `(${escapeFilterValue(this.attribute)}=*)`;
    }
    _toBer(ber) {
      for (let i = 0;i < this.attribute.length; i++) {
        ber.writeByte(this.attribute.charCodeAt(i));
      }
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const tag = reader.peek();
      if (tag !== search.FILTER_PRESENT) {
        const expected = "0x" + search.FILTER_PRESENT.toString(16).padStart(2, "0");
        const found = "0x" + tag.toString(16).padStart(2, "0");
        throw Error(`expected presence filter sequence ${expected}, got ${found}`);
      }
      const attribute = reader.readString(tag);
      return new PresenceFilter({ attribute });
    }
  }
  module.exports = PresenceFilter;
});

// node_modules/@ldapjs/filter/lib/deprecations.js
var require_deprecations4 = __commonJS(function(exports, module) {
  var warning = require_process_warning()();
  var clazz = "LdapjsFilterWarning";
  warning.create(clazz, "LDAP_FILTER_DEP_001", "parse is deprecated. Use the parseString function instead.");
  warning.create(clazz, "LDAP_FILTER_DEP_002", "subInitial is deprecated. Use initial instead.");
  warning.create(clazz, "LDAP_FILTER_DEP_003", "subAny is deprecated. Use any instead.");
  warning.create(clazz, "LDAP_FILTER_DEP_004", "subFinal is deprecated. Use final instead.");
  module.exports = warning;
});

// node_modules/@ldapjs/filter/lib/filters/substring.js
var require_substring = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { BerReader } = require_asn1();
  var { search } = require_protocol();
  var escapeFilterValue = require_escape_filter_value();
  var testValues = require_test_values();
  var getAttributeValue = require_get_attribute_value();
  var warning = require_deprecations4();

  class SubstringFilter extends FilterString {
    #initial;
    #any = [];
    #final;
    #constructedWithSubPrefix;
    constructor({ attribute, initial, subInitial, any = [], subAny = [], final, subFinal } = {}) {
      if (subInitial) {
        warning.emit("LDAP_FILTER_DEP_002");
        initial = subInitial;
      }
      if (Array.isArray(subAny) && subAny.length > 0) {
        warning.emit("LDAP_FILTER_DEP_003");
        any = subAny;
      }
      if (subFinal) {
        warning.emit("LDAP_FILTER_DEP_004");
        final = subFinal;
      }
      if (typeof attribute !== "string" || attribute.length < 1) {
        throw Error("attribute must be a string of at least one character");
      }
      if (Array.isArray(any) === false) {
        throw Error("any must be an array of items");
      }
      if (Array.isArray(subAny) === false) {
        throw Error("subAny must be an array of items");
      }
      if (final && typeof final !== "string") {
        throw Error("final must be a string");
      }
      super({ attribute });
      this.#initial = initial;
      Array.prototype.push.apply(this.#any, any);
      this.#final = final;
      this.#constructedWithSubPrefix = subInitial || subFinal || subAny.length > 0;
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_SUBSTRINGS },
        type: { value: "SubstringFilter" }
      });
    }
    get initial() {
      return this.#initial;
    }
    get any() {
      return this.#any;
    }
    get final() {
      return this.#final;
    }
    get subInitial() {
      return this.#initial;
    }
    get subAny() {
      return this.#any;
    }
    get subFinal() {
      return this.#final;
    }
    get json() {
      if (this.#constructedWithSubPrefix) {
        return {
          type: this.type,
          subInitial: this.#initial,
          subAny: this.#any,
          subFinal: this.#final
        };
      } else {
        return {
          type: this.type,
          initial: this.#initial,
          any: this.#any,
          final: this.#final
        };
      }
    }
    toString() {
      let result = "(" + escapeFilterValue(this.attribute) + "=";
      if (this.#initial) {
        result += escapeFilterValue(this.#initial);
      }
      result += "*";
      for (const any of this.#any) {
        result += escapeFilterValue(any) + "*";
      }
      if (this.#final) {
        result += escapeFilterValue(this.#final);
      }
      result += ")";
      return result;
    }
    matches(obj, strictAttrCase) {
      if (Array.isArray(obj) === true) {
        for (const attr of obj) {
          if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
            throw Error("array element must be an instance of LdapAttribute");
          }
          if (this.matches(attr, strictAttrCase) === true) {
            return true;
          }
        }
        return false;
      }
      const targetValue = getAttributeValue({ sourceObject: obj, attributeName: this.attribute, strictCase: strictAttrCase });
      if (targetValue === undefined || targetValue === null) {
        return false;
      }
      let re = "";
      if (this.#initial) {
        re += "^" + escapeRegExp(this.#initial) + ".*";
      }
      this.#any.forEach(function(s) {
        re += escapeRegExp(s) + ".*";
      });
      if (this.#final) {
        re += escapeRegExp(this.#final) + "$";
      }
      const matcher = new RegExp(re);
      return testValues({
        rule: (v) => matcher.test(v),
        value: targetValue
      });
    }
    _toBer(ber) {
      ber.writeString(this.attribute);
      ber.startSequence();
      if (this.#initial) {
        ber.writeString(this.#initial, 128);
      }
      if (this.#any.length > 0) {
        for (const sub of this.#any) {
          ber.writeString(sub, 129);
        }
      }
      if (this.#final) {
        ber.writeString(this.#final, 130);
      }
      ber.endSequence();
      return ber;
    }
    static parse(buffer) {
      const reader = new BerReader(buffer);
      const seq = reader.readSequence();
      if (seq !== search.FILTER_SUBSTRINGS) {
        const expected = "0x" + search.FILTER_SUBSTRINGS.toString(16).padStart(2, "0");
        const found = "0x" + seq.toString(16).padStart(2, "0");
        throw Error(`expected substring filter sequence ${expected}, got ${found}`);
      }
      let initial;
      const any = [];
      let final;
      const attribute = reader.readString();
      reader.readSequence();
      const end = reader.offset + reader.length;
      while (reader.offset < end) {
        const tag = reader.peek();
        switch (tag) {
          case 128: {
            initial = reader.readString(tag);
            break;
          }
          case 129: {
            const anyVal = reader.readString(tag);
            any.push(anyVal);
            break;
          }
          case 130: {
            final = reader.readString(tag);
            break;
          }
          default: {
            throw new Error("Invalid substrings filter type: 0x" + tag.toString(16));
          }
        }
      }
      return new SubstringFilter({ attribute, initial, any, final });
    }
  }
  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
  module.exports = SubstringFilter;
});

// node_modules/@ldapjs/filter/lib/filters/utils/parse-nested-filter.js
var require_parse_nested_filter = __commonJS(function(exports, module) {
  var { search } = require_protocol();
  var { BerReader } = require_asn1();
  module.exports = function parseNestedFilter({ startTag, buffer, constructor }) {
    const FILTERS = {
      [search.FILTER_AND]: require_and(),
      [search.FILTER_APPROX]: require_approximate(),
      [search.FILTER_EQUALITY]: require_equality(),
      [search.FILTER_EXT]: require_extensible(),
      [search.FILTER_GE]: require_greater_than_equals(),
      [search.FILTER_LE]: require_less_than_equals(),
      [search.FILTER_NOT]: require_not(),
      [search.FILTER_OR]: require_or(),
      [search.FILTER_PRESENT]: require_presence(),
      [search.FILTER_SUBSTRINGS]: require_substring()
    };
    const reader = new BerReader(buffer);
    const seq = reader.readSequence();
    if (seq !== startTag) {
      const expected = "0x" + startTag.toString(16).padStart(2, "0");
      const found = "0x" + seq.toString(16).padStart(2, "0");
      throw Error(`expected filter tag ${expected}, got ${found}`);
    }
    const filters = [];
    const currentFilterLength = reader.length;
    while (reader.offset < currentFilterLength) {
      const tag = reader.peek();
      const tagBuffer = reader.readRawBuffer(tag);
      const filter = FILTERS[tag].parse(tagBuffer);
      filters.push(filter);
    }
    if (constructor === FILTERS[search.FILTER_NOT]) {
      return new constructor({ filter: filters[0] });
    }
    return new constructor({ filters });
  };
});

// node_modules/@ldapjs/filter/lib/filters/and.js
var require_and = __commonJS(function(exports, module) {
  var FilterString = require_filter_string();
  var { search } = require_protocol();

  class AndFilter extends FilterString {
    constructor({ filters = [] } = {}) {
      super({});
      this.attribute = undefined;
      for (const filter of filters) {
        this.addClause(filter);
      }
      Object.defineProperties(this, {
        TAG: { value: search.FILTER_AND },
        type: { value: "AndFilter" }
      });
    }
    get json() {
      return {
        type: this.type,
        filters: this.clauses.map((clause) => clause.json)
      };
    }
    toString() {
      let result = "(&";
      for (const clause of this.clauses) {
        result += clause.toString();
      }
      result += ")";
      return result;
    }
    matches(obj, strictAttrCase = true) {
      if (this.clauses.length === 0) {
        return true;
      }
      for (const clause of this.clauses) {
        if (Array.isArray(obj) === true) {
          for (const attr of obj) {
            if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
              throw Error("array element must be an instance of LdapAttribute");
            }
            if (attr.type !== clause.attribute) {
              continue;
            }
            if (clause.matches(attr, strictAttrCase) === false) {
              return false;
            }
          }
        } else {
          if (clause.matches(obj, strictAttrCase) === false) {
            return false;
          }
        }
      }
      return true;
    }
    _toBer(ber) {
      for (const clause of this.clauses) {
        const filterBer = clause.toBer();
        ber.appendBuffer(filterBer.buffer);
      }
      return ber;
    }
    static parse(buffer) {
      const parseNestedFilter = require_parse_nested_filter();
      return parseNestedFilter({
        buffer,
        constructor: AndFilter,
        startTag: search.FILTER_AND
      });
    }
  }
  module.exports = AndFilter;
});

// node_modules/@ldapjs/filter/lib/string-parsing/escape-substring.js
var require_escape_substring = __commonJS(function(exports, module) {
  var escapeFilterValue = require_escape_filter_value();
  module.exports = function escapeSubstring(str) {
    const fields = str.split("*");
    const out = {
      initial: "",
      final: "",
      any: []
    };
    if (fields.length <= 1) {
      throw Error("extensible filter delimiter missing");
    }
    out.initial = escapeFilterValue(fields.shift());
    out.final = escapeFilterValue(fields.pop());
    Array.prototype.push.apply(out.any, fields.map(escapeFilterValue));
    return out;
  };
});

// node_modules/@ldapjs/filter/lib/string-parsing/parse-extensible-filter-string.js
var require_parse_extensible_filter_string = __commonJS(function(exports, module) {
  var ExtensibleFilter = require_extensible();
  var escapeFilterValue = require_escape_filter_value();
  module.exports = function parseExtensibleFilterString(filterString) {
    const fields = filterString.split(":");
    const attribute = escapeFilterValue(fields.shift());
    const params = {
      attribute,
      dnAttributes: false,
      rule: undefined,
      value: undefined
    };
    if (fields[0].toLowerCase() === "dn") {
      params.dnAttributes = true;
      fields.shift();
    }
    if (fields.length !== 0 && fields[0][0] !== "=") {
      params.rule = fields.shift();
    }
    if (fields.length === 0 || fields[0][0] !== "=") {
      throw new Error("missing := in extensible filter string");
    }
    filterString = fields.join(":").substr(1);
    params.value = escapeFilterValue(filterString);
    return new ExtensibleFilter(params);
  };
});

// node_modules/@ldapjs/filter/lib/string-parsing/parse-expression.js
var require_parse_expression = __commonJS(function(exports, module) {
  var ApproximateFilter = require_approximate();
  var EqualityFilter = require_equality();
  var GreaterThanEqualsFilter = require_greater_than_equals();
  var LessThanEqualsFilter = require_less_than_equals();
  var PresenceFilter = require_presence();
  var SubstringFilter = require_substring();
  var escapeSubstring = require_escape_substring();
  var parseExtensibleFilterString = require_parse_extensible_filter_string();
  var attrRegex = /^[-_a-zA-Z0-9]+/;
  module.exports = function parseExpr(inputString) {
    let attribute;
    let match;
    let remainder;
    if (inputString[0] === ":" || inputString.indexOf(":=") > 0) {
      return parseExtensibleFilterString(inputString);
    } else if ((match = inputString.match(attrRegex)) !== null) {
      attribute = match[0];
      remainder = inputString.substring(attribute.length);
    } else {
      throw new Error("invalid attribute name");
    }
    if (remainder === "=*") {
      return new PresenceFilter({ attribute });
    } else if (remainder[0] === "=") {
      remainder = remainder.substring(1);
      if (remainder.indexOf("*") !== -1) {
        const val = escapeSubstring(remainder);
        return new SubstringFilter({
          attribute,
          initial: val.initial,
          any: val.any,
          final: val.final
        });
      } else {
        return new EqualityFilter({
          attribute,
          value: remainder
        });
      }
    } else if (remainder[0] === ">" && remainder[1] === "=") {
      return new GreaterThanEqualsFilter({
        attribute,
        value: remainder.substring(2)
      });
    } else if (remainder[0] === "<" && remainder[1] === "=") {
      return new LessThanEqualsFilter({
        attribute,
        value: remainder.substring(2)
      });
    } else if (remainder[0] === "~" && remainder[1] === "=") {
      return new ApproximateFilter({
        attribute,
        value: remainder.substring(2)
      });
    }
    throw new Error("invalid expression");
  };
});

// node_modules/@ldapjs/filter/lib/string-parsing/parse-filter.js
var require_parse_filter = __commonJS(function(exports, module) {
  var AndFilter = require_and();
  var OrFilter = require_or();
  var NotFilter = require_not();
  var parseExpression = require_parse_expression();
  var unbalancedError = Error("unbalanced parentheses");
  module.exports = function parseFilter(inputString, start = 0) {
    let cur = start;
    const len = inputString.length;
    let res;
    let end;
    let output;
    const children = [];
    if (inputString[cur++] !== "(") {
      throw Error("missing opening parentheses");
    }
    if (inputString[cur] === "&") {
      cur++;
      if (inputString[cur] === ")") {
        output = new AndFilter({});
      } else {
        do {
          res = parseFilter(inputString, cur);
          children.push(res.filter);
          cur = res.end + 1;
        } while (cur < len && inputString[cur] !== ")");
        output = new AndFilter({ filters: children });
      }
    } else if (inputString[cur] === "|") {
      cur++;
      do {
        res = parseFilter(inputString, cur);
        children.push(res.filter);
        cur = res.end + 1;
      } while (cur < len && inputString[cur] !== ")");
      output = new OrFilter({ filters: children });
    } else if (inputString[cur] === "!") {
      res = parseFilter(inputString, cur + 1);
      output = new NotFilter({ filter: res.filter });
      cur = res.end + 1;
      if (inputString[cur] !== ")") {
        throw unbalancedError;
      }
    } else {
      end = inputString.indexOf(")", cur);
      if (end === -1) {
        throw unbalancedError;
      }
      output = parseExpression(inputString.substring(cur, end));
      cur = end;
    }
    return {
      end: cur,
      filter: output
    };
  };
});

// node_modules/@ldapjs/filter/lib/string-parsing/parse-string.js
var require_parse_string2 = __commonJS(function(exports, module) {
  var parseFilter = require_parse_filter();
  module.exports = function parseString(inputString) {
    if (typeof inputString !== "string") {
      throw Error("input must be a string");
    }
    if (inputString.length < 1) {
      throw Error("input string cannot be empty");
    }
    let normalizedString = inputString;
    if (normalizedString.charAt(0) !== "(") {
      normalizedString = `(${normalizedString})`;
    }
    const parsed = parseFilter(normalizedString);
    if (parsed.end < inputString.length - 1) {
      throw Error("unbalanced parentheses");
    }
    return parsed.filter;
  };
});

// node_modules/@ldapjs/filter/lib/ber-parsing/index.js
var require_ber_parsing = __commonJS(function(exports, module) {
  var { search } = require_protocol();
  var FILTERS = {
    [search.FILTER_AND]: require_and(),
    [search.FILTER_APPROX]: require_approximate(),
    [search.FILTER_EQUALITY]: require_equality(),
    [search.FILTER_EXT]: require_extensible(),
    [search.FILTER_GE]: require_greater_than_equals(),
    [search.FILTER_LE]: require_less_than_equals(),
    [search.FILTER_NOT]: require_not(),
    [search.FILTER_OR]: require_or(),
    [search.FILTER_PRESENT]: require_presence(),
    [search.FILTER_SUBSTRINGS]: require_substring()
  };
  module.exports = function parseBer(ber) {
    if (Object.prototype.toString.call(ber) !== "[object BerReader]") {
      throw new TypeError("ber (BerReader) required");
    }
    return _parse(ber);
  };
  function _parse(ber) {
    let f;
    const filterStartOffset = ber.offset;
    const type = ber.readSequence();
    switch (type) {
      case search.FILTER_AND:
      case search.FILTER_OR: {
        f = new FILTERS[type];
        parseSet(f);
        break;
      }
      case search.FILTER_NOT: {
        const innerFilter = _parse(ber);
        f = new FILTERS[type]({ filter: innerFilter });
        break;
      }
      case search.FILTER_APPROX:
      case search.FILTER_EQUALITY:
      case search.FILTER_EXT:
      case search.FILTER_GE:
      case search.FILTER_LE:
      case search.FILTER_PRESENT:
      case search.FILTER_SUBSTRINGS: {
        f = FILTERS[type].parse(getBerBuffer(ber));
        break;
      }
      default: {
        throw Error("invalid search filter type: 0x" + type.toString(16).padStart(2, "0"));
      }
    }
    return f;
    function parseSet(f) {
      const end = ber.offset + ber.length;
      while (ber.offset < end) {
        const parsed = _parse(ber);
        f.addClause(parsed);
      }
    }
    function getBerBuffer(inputBer) {
      ber.setOffset(filterStartOffset);
      const tag = inputBer.peek();
      return inputBer.readRawBuffer(tag);
    }
  }
});

// node_modules/@ldapjs/filter/lib/index.js
var require_lib2 = __commonJS(function(exports, module) {
  var testValues = require_test_values();
  var getAttributeValue = require_get_attribute_value();
  var FilterString = require_filter_string();
  var AndFilter = require_and();
  var ApproximateFilter = require_approximate();
  var EqualityFilter = require_equality();
  var ExtensibleFilter = require_extensible();
  var GreaterThanEqualsFilter = require_greater_than_equals();
  var LessThanEqualsFilter = require_less_than_equals();
  var NotFilter = require_not();
  var OrFilter = require_or();
  var PresenceFilter = require_presence();
  var SubstringFilter = require_substring();
  var deprecations = require_deprecations4();
  var parseString = require_parse_string2();
  module.exports = {
    parseBer: require_ber_parsing(),
    parse: (string) => {
      deprecations.emit("LDAP_FILTER_DEP_001");
      return parseString(string);
    },
    parseString,
    testValues,
    getAttrValue: getAttributeValue,
    getAttributeValue,
    FilterString,
    AndFilter,
    ApproximateFilter,
    EqualityFilter,
    ExtensibleFilter,
    GreaterThanEqualsFilter,
    LessThanEqualsFilter,
    NotFilter,
    OrFilter,
    PresenceFilter,
    SubstringFilter
  };
});

// node_modules/@ldapjs/messages/lib/messages/search-request.js
var require_search_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { operations, search } = require_protocol();
  var { DN } = require_dn2();
  var filter = require_lib2();
  var { BerReader, BerTypes } = require_asn1();
  var warning = require_deprecations();
  var recognizedScopes = new Map([
    ["base", [search.SCOPE_BASE_OBJECT, "base"]],
    ["single", [search.SCOPE_ONE_LEVEL, "single", "one"]],
    ["subtree", [search.SCOPE_SUBTREE, "subtree", "sub"]]
  ]);
  var scopeAliasToScope = (alias) => {
    alias = typeof alias === "string" ? alias.toLowerCase() : alias;
    if (recognizedScopes.has(alias)) {
      return recognizedScopes.get(alias)[0];
    }
    for (const value of recognizedScopes.values()) {
      if (value.includes(alias)) {
        return value[0];
      }
    }
    return;
  };
  var isValidAttributeString = (str) => {
    if (["*", "1.1", "+"].includes(str) === true) {
      return true;
    }
    if (/^@[a-zA-Z][\w\d.-]*$/.test(str) === true) {
      return true;
    }
    if (/^[a-zA-Z][\w\d.;-]*$/.test(str) === true) {
      return true;
    }
    if (/^[a-zA-Z][\w\d.-]*(;[\w\d.-]+)*;range=\d+-(\d+|\*)(;[\w\d.-]+)*$/.test(str) === true) {
      return true;
    }
    return false;
  };

  class SearchRequest extends LdapMessage {
    static SCOPE_BASE = search.SCOPE_BASE_OBJECT;
    static SCOPE_SINGLE = search.SCOPE_ONE_LEVEL;
    static SCOPE_SUBTREE = search.SCOPE_SUBTREE;
    static DEREF_ALIASES_NEVER = search.NEVER_DEREF_ALIASES;
    static DEREF_IN_SEARCHING = search.DEREF_IN_SEARCHING;
    static DEREF_BASE_OBJECT = search.DEREF_BASE_OBJECT;
    static DEREF_ALWAYS = search.DEREF_ALWAYS;
    #baseObject;
    #scope;
    #derefAliases;
    #sizeLimit;
    #timeLimit;
    #typesOnly;
    #filter;
    #attributes = [];
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_REQ_SEARCH;
      super(options);
      this.baseObject = options.baseObject ?? "";
      this.scope = options.scope ?? search.SCOPE_BASE_OBJECT;
      this.derefAliases = options.derefAliases ?? search.NEVER_DEREF_ALIASES;
      this.sizeLimit = options.sizeLimit ?? 0;
      this.timeLimit = options.timeLimit ?? 0;
      this.typesOnly = options.typesOnly ?? false;
      this.filter = options.filter ?? new filter.PresenceFilter({ attribute: "objectclass" });
      this.attributes = options.attributes ?? [];
    }
    get _dn() {
      return this.#baseObject;
    }
    get type() {
      return "SearchRequest";
    }
    get attributes() {
      return this.#attributes;
    }
    set attributes(attrs) {
      if (Array.isArray(attrs) === false) {
        throw Error("attributes must be an array of attribute strings");
      }
      const newAttrs = [];
      for (const attr of attrs) {
        if (typeof attr === "string" && isValidAttributeString(attr) === true) {
          newAttrs.push(attr);
        } else if (typeof attr === "string" && attr === "") {
          warning.emit("LDAP_ATTRIBUTE_SPEC_ERR_001");
        } else {
          throw Error("attribute must be a valid string");
        }
      }
      this.#attributes = newAttrs;
    }
    get baseObject() {
      return this.#baseObject;
    }
    set baseObject(obj) {
      if (typeof obj === "string") {
        this.#baseObject = DN.fromString(obj);
      } else if (Object.prototype.toString.call(obj) === "[object LdapDn]") {
        this.#baseObject = obj;
      } else {
        throw Error("baseObject must be a DN string or DN instance");
      }
    }
    get derefAliases() {
      return this.#derefAliases;
    }
    set derefAliases(value) {
      if (Number.isInteger(value) === false) {
        throw Error("derefAliases must be set to an integer");
      }
      this.#derefAliases = value;
    }
    get filter() {
      return this.#filter;
    }
    set filter(value) {
      if (typeof value !== "string" && Object.prototype.toString.call(value) !== "[object FilterString]") {
        throw Error("filter must be a string or a FilterString instance");
      }
      if (typeof value === "string") {
        this.#filter = filter.parseString(value);
      } else {
        this.#filter = value;
      }
    }
    get scope() {
      return this.#scope;
    }
    set scope(value) {
      const resolvedScope = scopeAliasToScope(value);
      if (resolvedScope === undefined) {
        throw Error(value + " is an invalid search scope");
      }
      this.#scope = resolvedScope;
    }
    get scopeName() {
      switch (this.#scope) {
        case search.SCOPE_BASE_OBJECT:
          return "base";
        case search.SCOPE_ONE_LEVEL:
          return "single";
        case search.SCOPE_SUBTREE:
          return "subtree";
      }
    }
    get sizeLimit() {
      return this.#sizeLimit;
    }
    set sizeLimit(value) {
      if (Number.isInteger(value) === false) {
        throw Error("sizeLimit must be an integer");
      }
      this.#sizeLimit = value;
    }
    get timeLimit() {
      return this.#timeLimit;
    }
    set timeLimit(value) {
      if (Number.isInteger(value) === false) {
        throw Error("timeLimit must be an integer");
      }
      this.#timeLimit = value;
    }
    get typesOnly() {
      return this.#typesOnly;
    }
    set typesOnly(value) {
      if (typeof value !== "boolean") {
        throw Error("typesOnly must be set to a boolean value");
      }
      this.#typesOnly = value;
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_REQ_SEARCH);
      ber.writeString(this.#baseObject.toString());
      ber.writeEnumeration(this.#scope);
      ber.writeEnumeration(this.#derefAliases);
      ber.writeInt(this.#sizeLimit);
      ber.writeInt(this.#timeLimit);
      ber.writeBoolean(this.#typesOnly);
      ber.appendBuffer(this.#filter.toBer().buffer);
      ber.startSequence(BerTypes.Sequence | BerTypes.Constructor);
      for (const attr of this.#attributes) {
        ber.writeString(attr);
      }
      ber.endSequence();
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.baseObject = this.baseObject.toString();
      obj.scope = this.scopeName;
      obj.derefAliases = this.derefAliases;
      obj.sizeLimit = this.sizeLimit;
      obj.timeLimit = this.timeLimit;
      obj.typesOnly = this.typesOnly;
      obj.filter = this.filter.toString();
      obj.attributes = [];
      for (const attr of this.#attributes) {
        obj.attributes.push(attr);
      }
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_REQ_SEARCH) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const baseObject = ber.readString();
      const scope = ber.readEnumeration();
      const derefAliases = ber.readEnumeration();
      const sizeLimit = ber.readInt();
      const timeLimit = ber.readInt();
      const typesOnly = ber.readBoolean();
      const filterTag = ber.peek();
      const filterBuffer = ber.readRawBuffer(filterTag);
      const parsedFilter = filter.parseBer(new BerReader(filterBuffer));
      const attributes = [];
      ber.readSequence();
      const endOfAttributesPos = ber.offset + ber.length;
      while (ber.offset < endOfAttributesPos) {
        const attribute = ber.readString();
        attributes.push(attribute);
      }
      return {
        protocolOp,
        baseObject,
        scope,
        derefAliases,
        sizeLimit,
        timeLimit,
        typesOnly,
        filter: parsedFilter.toString(),
        attributes
      };
    }
  }
  module.exports = SearchRequest;
});

// node_modules/@ldapjs/messages/lib/messages/unbind-request.js
var require_unbind_request = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { operations } = require_protocol();

  class UnbindRequest extends LdapMessage {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_REQ_UNBIND;
      super(options);
    }
    get type() {
      return "UnbindRequest";
    }
    _toBer(ber) {
      ber.writeString("", operations.LDAP_REQ_UNBIND);
      return ber;
    }
    _pojo(obj = {}) {
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_REQ_UNBIND) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      return { protocolOp };
    }
  }
  module.exports = UnbindRequest;
});

// node_modules/@ldapjs/messages/lib/ldap-result.js
var require_ldap_result = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { resultCodes, operations } = require_protocol();
  var warning = require_deprecations();

  class LdapResult extends LdapMessage {
    #connection = null;
    #diagnosticMessage;
    #matchedDN;
    #referrals = [];
    #status;
    constructor(options = {}) {
      super(options);
      this.#status = options.status ?? resultCodes.SUCCESS;
      this.#matchedDN = options.matchedDN || "";
      this.#referrals = options.referrals || [];
      this.#diagnosticMessage = options.diagnosticMessage || options.errorMessage || "";
      if (options.errorMessage) {
        warning.emit("LDAP_MESSAGE_DEP_004");
      }
    }
    get diagnosticMessage() {
      return this.#diagnosticMessage;
    }
    set diagnosticMessage(message) {
      this.#diagnosticMessage = message;
    }
    get matchedDN() {
      return this.#matchedDN;
    }
    set matchedDN(dn) {
      this.#matchedDN = dn;
    }
    get pojo() {
      let result = {
        status: this.status,
        matchedDN: this.matchedDN,
        diagnosticMessage: this.diagnosticMessage,
        referrals: this.referrals
      };
      if (typeof this._pojo === "function") {
        result = this._pojo(result);
      }
      return result;
    }
    get referrals() {
      return this.#referrals.slice(0);
    }
    get status() {
      return this.#status;
    }
    set status(s) {
      this.#status = s;
    }
    get type() {
      return "LdapResult";
    }
    addReferral(referral) {
      this.#referrals.push(referral);
    }
    _toBer(ber) {
      ber.startSequence(this.protocolOp);
      ber.writeEnumeration(this.status);
      ber.writeString(this.matchedDN);
      ber.writeString(this.diagnosticMessage);
      if (this.referrals.length > 0) {
        ber.startSequence(operations.LDAP_RES_REFERRAL);
        ber.writeStringArray(this.referrals);
        ber.endSequence();
      }
      if (typeof this._writeResponse === "function") {
        this._writeResponse(ber);
      }
      ber.endSequence();
    }
    static parseToPojo(ber) {
      throw Error("Use LdapMessage.parse, or a specific message type's parseToPojo, instead.");
    }
    static _parseToPojo({ opCode, berReader, pojo = {} }) {
      const protocolOp = berReader.readSequence();
      if (protocolOp !== opCode) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const status = berReader.readEnumeration();
      const matchedDN = berReader.readString();
      const diagnosticMessage = berReader.readString();
      const referrals = [];
      if (berReader.peek() === operations.LDAP_RES_REFERRAL) {
        berReader.readSequence(operations.LDAP_RES_REFERRAL);
        const end = berReader.length;
        while (berReader.offset < end) {
          referrals.push(berReader.readString());
        }
      }
      pojo.status = status;
      pojo.matchedDN = matchedDN;
      pojo.diagnosticMessage = diagnosticMessage;
      pojo.referrals = referrals;
      return pojo;
    }
  }
  module.exports = LdapResult;
});

// node_modules/@ldapjs/messages/lib/messages/abandon-response.js
var require_abandon_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();

  class AbandonResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = 0;
      super(options);
    }
    get type() {
      return "AbandonResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: 0,
        berReader: ber
      });
    }
  }
  module.exports = AbandonResponse;
});

// node_modules/@ldapjs/messages/lib/messages/add-response.js
var require_add_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class AddResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_ADD;
      super(options);
    }
    get type() {
      return "AddResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_ADD,
        berReader: ber
      });
    }
  }
  module.exports = AddResponse;
});

// node_modules/@ldapjs/messages/lib/messages/bind-response.js
var require_bind_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class BindResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_BIND;
      super(options);
    }
    get type() {
      return "BindResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_BIND,
        berReader: ber
      });
    }
  }
  module.exports = BindResponse;
});

// node_modules/@ldapjs/messages/lib/messages/compare-response.js
var require_compare_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class CompareResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_COMPARE;
      super(options);
    }
    get type() {
      return "CompareResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_COMPARE,
        berReader: ber
      });
    }
  }
  module.exports = CompareResponse;
});

// node_modules/@ldapjs/messages/lib/messages/delete-response.js
var require_delete_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class DeleteResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_DELETE;
      super(options);
    }
    get type() {
      return "DeleteResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_DELETE,
        berReader: ber
      });
    }
  }
  module.exports = DeleteResponse;
});

// node_modules/@ldapjs/messages/lib/messages/extension-response.js
var require_extension_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class ExtensionResponse extends LdapResult {
    #responseName;
    #responseValue;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_EXTENSION;
      super(options);
      this.responseName = options.responseName;
      this.responseValue = options.responseValue;
    }
    get responseName() {
      return this.#responseName;
    }
    set responseName(value) {
      this.#responseName = value;
    }
    get responseValue() {
      return this.#responseValue;
    }
    set responseValue(value) {
      this.#responseValue = value;
    }
    get type() {
      return "ExtensionResponse";
    }
    _writeResponse(ber) {
      if (this.responseName) {
        ber.writeString(this.responseName, 138);
      }
      if (this.responseValue === undefined) {
        return ber;
      }
      switch (this.responseName) {
        default: {
          ber.writeString(this.responseValue, 139);
        }
      }
      return ber;
    }
    static parseToPojo(ber) {
      const pojo = LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_EXTENSION,
        berReader: ber
      });
      let responseName;
      if (ber.peek() === 138) {
        responseName = ber.readString(138);
      }
      if (ber.peek() !== 139) {
        return { ...pojo, responseName };
      }
      const valueBuffer = ber.readTag(139);
      const responseValue = `<buffer>${valueBuffer.toString("hex")}`;
      return { ...pojo, responseName, responseValue };
    }
  }
  module.exports = ExtensionResponse;
});

// node_modules/@ldapjs/messages/lib/messages/modify-response.js
var require_modify_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class ModifyResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_MODIFY;
      super(options);
    }
    get type() {
      return "ModifyResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_MODIFY,
        berReader: ber
      });
    }
  }
  module.exports = ModifyResponse;
});

// node_modules/@ldapjs/messages/lib/messages/modifydn-response.js
var require_modifydn_response = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class ModifyDnResponse extends LdapResult {
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_MODRDN;
      super(options);
    }
    get type() {
      return "ModifyDnResponse";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_MODRDN,
        berReader: ber
      });
    }
  }
  module.exports = ModifyDnResponse;
});

// node_modules/@ldapjs/messages/lib/messages/search-result-entry.js
var require_search_result_entry = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var Attribute = require_attribute();
  var { operations } = require_protocol();
  var { DN } = require_dn2();

  class SearchResultEntry extends LdapMessage {
    #objectName;
    #attributes = [];
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_SEARCH_ENTRY;
      super(options);
      this.objectName = options.objectName ?? "";
      this.attributes = options.attributes ?? [];
    }
    get _dn() {
      return this.#objectName;
    }
    get type() {
      return "SearchResultEntry";
    }
    get attributes() {
      return this.#attributes.slice(0);
    }
    set attributes(attrs) {
      if (Array.isArray(attrs) === false) {
        throw Error("attrs must be an array");
      }
      const newAttrs = [];
      for (const attr of attrs) {
        if (Attribute.isAttribute(attr) === false) {
          throw Error("attr must be an Attribute instance or Attribute-like object");
        }
        if (Object.prototype.toString.call(attr) !== "[object LdapAttribute]") {
          newAttrs.push(new Attribute(attr));
          continue;
        }
        newAttrs.push(attr);
      }
      this.#attributes = newAttrs;
    }
    get objectName() {
      return this.#objectName;
    }
    set objectName(value) {
      if (typeof value === "string") {
        this.#objectName = DN.fromString(value);
      } else if (Object.prototype.toString.call(value) === "[object LdapDn]") {
        this.#objectName = value;
      } else {
        throw Error("objectName must be a DN string or an instance of LdapDn");
      }
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_RES_SEARCH_ENTRY);
      ber.writeString(this.#objectName.toString());
      ber.startSequence();
      for (const attr of this.#attributes) {
        const attrBer = attr.toBer();
        ber.appendBuffer(attrBer.buffer);
      }
      ber.endSequence();
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.objectName = this.#objectName.toString();
      obj.attributes = [];
      for (const attr of this.#attributes) {
        obj.attributes.push(attr.pojo);
      }
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_RES_SEARCH_ENTRY) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const objectName = ber.readString();
      const attributes = [];
      ber.readSequence();
      const endOfAttributesPos = ber.offset + ber.length;
      while (ber.offset < endOfAttributesPos) {
        const attribute = Attribute.fromBer(ber);
        attributes.push(attribute);
      }
      return { protocolOp, objectName, attributes };
    }
  }
  module.exports = SearchResultEntry;
});

// node_modules/@ldapjs/messages/lib/messages/search-result-reference.js
var require_search_result_reference = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { operations } = require_protocol();

  class SearchResultReference extends LdapMessage {
    #uri;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_SEARCH_REF;
      super(options);
      this.uri = (options.uri || options.uris) ?? [];
    }
    get type() {
      return "SearchResultReference";
    }
    get uri() {
      return this.#uri.slice(0);
    }
    set uri(value) {
      if (Array.isArray(value) === false || value.some((v) => typeof v !== "string")) {
        throw Error("uri must be an array of strings");
      }
      this.#uri = value.slice(0);
    }
    get uris() {
      return this.uri;
    }
    set uris(value) {
      this.uri = value;
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_RES_SEARCH_REF);
      for (const uri of this.#uri) {
        ber.writeString(uri);
      }
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.uri = [];
      for (const uri of this.#uri) {
        obj.uri.push(uri);
      }
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_RES_SEARCH_REF) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      const uri = [];
      const endOfMessagePos = ber.offset + ber.length;
      while (ber.offset < endOfMessagePos) {
        const u = ber.readString();
        uri.push(u);
      }
      return { protocolOp, uri };
    }
  }
  module.exports = SearchResultReference;
});

// node_modules/@ldapjs/messages/lib/messages/search-result-done.js
var require_search_result_done = __commonJS(function(exports, module) {
  var LdapResult = require_ldap_result();
  var { operations } = require_protocol();

  class SearchResultDone extends LdapResult {
    #uri;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_SEARCH_DONE;
      super(options);
    }
    get type() {
      return "SearchResultDone";
    }
    static parseToPojo(ber) {
      return LdapResult._parseToPojo({
        opCode: operations.LDAP_RES_SEARCH_DONE,
        berReader: ber
      });
    }
  }
  module.exports = SearchResultDone;
});

// node_modules/@ldapjs/messages/lib/messages/intermediate-response.js
var require_intermediate_response = __commonJS(function(exports, module) {
  var LdapMessage = require_ldap_message();
  var { operations } = require_protocol();
  var partIsNotNumeric = (part) => /^\d+$/.test(part) === false;
  function isDottedDecimal(value) {
    if (typeof value !== "string")
      return false;
    const parts = value.split(".");
    const nonNumericParts = parts.filter(partIsNotNumeric);
    return nonNumericParts.length === 0;
  }

  class IntermediateResponse extends LdapMessage {
    #responseName;
    #responseValue;
    constructor(options = {}) {
      options.protocolOp = operations.LDAP_RES_INTERMEDIATE;
      super(options);
      this.responseName = options.responseName ?? null;
      this.responseValue = options.responseValue ?? null;
    }
    get type() {
      return "IntermediateResponse";
    }
    get responseName() {
      return this.#responseName;
    }
    set responseName(value) {
      if (value === null)
        return;
      if (isDottedDecimal(value) === false) {
        throw Error("responseName must be a numeric OID");
      }
      this.#responseName = value;
    }
    get responseValue() {
      return this.#responseValue;
    }
    set responseValue(value) {
      if (value === null)
        return;
      if (typeof value !== "string") {
        throw Error("responseValue must be a string");
      }
      this.#responseValue = value;
    }
    _toBer(ber) {
      ber.startSequence(operations.LDAP_RES_INTERMEDIATE);
      if (this.#responseName) {
        ber.writeString(this.#responseName, 128);
      }
      if (this.#responseValue) {
        ber.writeString(this.#responseValue, 129);
      }
      ber.endSequence();
      return ber;
    }
    _pojo(obj = {}) {
      obj.responseName = this.#responseName;
      obj.responseValue = this.#responseValue;
      return obj;
    }
    static parseToPojo(ber) {
      const protocolOp = ber.readSequence();
      if (protocolOp !== operations.LDAP_RES_INTERMEDIATE) {
        const op = protocolOp.toString(16).padStart(2, "0");
        throw Error(`found wrong protocol operation: 0x${op}`);
      }
      let responseName;
      let responseValue;
      let tag = ber.peek();
      switch (tag) {
        case 128: {
          responseName = ber.readString(tag);
          tag = ber.peek();
          if (tag === 129) {
            responseValue = ber.readString(tag);
          }
          break;
        }
        case 129: {
          responseValue = ber.readString(tag);
        }
      }
      return { protocolOp, responseName, responseValue };
    }
  }
  module.exports = IntermediateResponse;
});

// node_modules/@ldapjs/messages/lib/parse-to-message.js
var require_parse_to_message = __commonJS(function(exports, module) {
  var { operations } = require_protocol();
  var { getControl } = require_controls();
  var messageClasses = {
    AbandonRequest: require_abandon_request(),
    AddRequest: require_add_request(),
    BindRequest: require_bind_request(),
    CompareRequest: require_compare_request(),
    DeleteRequest: require_delete_request(),
    ExtensionRequest: require_extension_request(),
    ModifyRequest: require_modify_request(),
    ModifyDnRequest: require_modifydn_request(),
    SearchRequest: require_search_request(),
    UnbindRequest: require_unbind_request(),
    AbandonResponse: require_abandon_response(),
    AddResponse: require_add_response(),
    BindResponse: require_bind_response(),
    CompareResponse: require_compare_response(),
    DeleteResponse: require_delete_response(),
    ExtensionResponse: require_extension_response(),
    ModifyResponse: require_modify_response(),
    ModifyDnResponse: require_modifydn_response(),
    SearchResultEntry: require_search_result_entry(),
    SearchResultReference: require_search_result_reference(),
    SearchResultDone: require_search_result_done(),
    IntermediateResponse: require_intermediate_response()
  };
  module.exports = function parseToMessage(ber) {
    const inputType = Object.prototype.toString.apply(ber);
    if (inputType !== "[object BerReader]") {
      throw TypeError(`Expected BerReader but got ${inputType}.`);
    }
    ber.readSequence();
    const messageId = ber.readInt();
    const messageType = identifyType(ber);
    const MessageClass = messageClasses[messageType];
    const pojoMessage = MessageClass.parseToPojo(ber);
    const message = new MessageClass({
      messageId,
      ...pojoMessage
    });
    if (ber.peek() === 160) {
      ber.readSequence();
      const end = ber.offset + ber.length;
      while (ber.offset < end) {
        const c = getControl(ber);
        if (c) {
          message.addControl(c);
        }
      }
    }
    return message;
  };
  function identifyType(ber) {
    let result;
    switch (ber.peek()) {
      case operations.LDAP_REQ_ABANDON: {
        result = "AbandonRequest";
        break;
      }
      case 0: {
        result = "AbandonResponse";
        break;
      }
      case operations.LDAP_REQ_ADD: {
        result = "AddRequest";
        break;
      }
      case operations.LDAP_RES_ADD: {
        result = "AddResponse";
        break;
      }
      case operations.LDAP_REQ_BIND: {
        result = "BindRequest";
        break;
      }
      case operations.LDAP_RES_BIND: {
        result = "BindResponse";
        break;
      }
      case operations.LDAP_REQ_COMPARE: {
        result = "CompareRequest";
        break;
      }
      case operations.LDAP_RES_COMPARE: {
        result = "CompareResponse";
        break;
      }
      case operations.LDAP_REQ_DELETE: {
        result = "DeleteRequest";
        break;
      }
      case operations.LDAP_RES_DELETE: {
        result = "DeleteResponse";
        break;
      }
      case operations.LDAP_REQ_EXTENSION: {
        result = "ExtensionRequest";
        break;
      }
      case operations.LDAP_RES_EXTENSION: {
        result = "ExtensionResponse";
        break;
      }
      case operations.LDAP_REQ_MODIFY: {
        result = "ModifyRequest";
        break;
      }
      case operations.LDAP_RES_MODIFY: {
        result = "ModifyResponse";
        break;
      }
      case operations.LDAP_REQ_MODRDN: {
        result = "ModifyDnRequest";
        break;
      }
      case operations.LDAP_RES_MODRDN: {
        result = "ModifyDnResponse";
        break;
      }
      case operations.LDAP_REQ_SEARCH: {
        result = "SearchRequest";
        break;
      }
      case operations.LDAP_RES_SEARCH_ENTRY: {
        result = "SearchResultEntry";
        break;
      }
      case operations.LDAP_RES_SEARCH_REF: {
        result = "SearchResultReference";
        break;
      }
      case operations.LDAP_RES_SEARCH_DONE: {
        result = "SearchResultDone";
        break;
      }
      case operations.LDAP_REQ_UNBIND: {
        result = "UnbindRequest";
        break;
      }
      case operations.LDAP_RES_INTERMEDIATE: {
        result = "IntermediateResponse";
        break;
      }
    }
    return result;
  }
});

// node_modules/@ldapjs/messages/lib/ldap-message.js
var require_ldap_message = __commonJS(function(exports, module) {
  var { BerReader, BerWriter } = require_asn1();
  var warning = require_deprecations();

  class LdapMessage {
    #messageId = 0;
    #protocolOp;
    #controls = [];
    constructor(options = {}) {
      this.#messageId = parseInt(options.messageId ?? options.messageID ?? "1", 10);
      if (options.messageID !== undefined) {
        warning.emit("LDAP_MESSAGE_DEP_001");
      }
      if (typeof options.protocolOp === "number") {
        this.#protocolOp = options.protocolOp;
      }
      this.controls = options.controls ?? [];
    }
    get [Symbol.toStringTag]() {
      return "LdapMessage";
    }
    get controls() {
      return this.#controls.slice(0);
    }
    set controls(values) {
      if (Array.isArray(values) !== true) {
        throw Error("controls must be an array");
      }
      const newControls = [];
      for (const val of values) {
        if (Object.prototype.toString.call(val) !== "[object LdapControl]") {
          throw Error("control must be an instance of LdapControl");
        }
        newControls.push(val);
      }
      this.#controls = newControls;
    }
    get id() {
      return this.#messageId;
    }
    set id(value) {
      if (Number.isInteger(value) === false) {
        throw Error("id must be an integer");
      }
      this.#messageId = value;
    }
    get messageId() {
      return this.id;
    }
    set messageId(value) {
      this.id = value;
    }
    get messageID() {
      warning.emit("LDAP_MESSAGE_DEP_001");
      return this.id;
    }
    set messageID(value) {
      warning.emit("LDAP_MESSAGE_DEP_001");
      this.id = value;
    }
    get dn() {
      return this._dn;
    }
    get protocolOp() {
      return this.#protocolOp;
    }
    get type() {
      return "LdapMessage";
    }
    get json() {
      warning.emit("LDAP_MESSAGE_DEP_002");
      return this.pojo;
    }
    get pojo() {
      let result = {
        messageId: this.id,
        protocolOp: this.#protocolOp,
        type: this.type
      };
      if (typeof this._pojo === "function") {
        result = this._pojo(result);
      }
      result.controls = this.#controls.map((c) => c.pojo);
      return result;
    }
    addControl(control) {
      this.#controls.push(control);
    }
    toBer() {
      if (typeof this._toBer !== "function") {
        throw Error(`${this.type} does not implement _toBer`);
      }
      const writer = new BerWriter;
      writer.startSequence();
      writer.writeInt(this.id);
      this._toBer(writer);
      if (this.#controls.length > 0) {
        writer.startSequence(160);
        for (const control of this.#controls) {
          control.toBer(writer);
        }
        writer.endSequence();
      }
      writer.endSequence();
      return new BerReader(writer.buffer);
    }
    toString() {
      return JSON.stringify(this.pojo);
    }
    static parse(ber) {
      return require_parse_to_message()(ber);
    }
    static parseToPojo(ber) {
      throw Error("Use LdapMessage.parse, or a specific message type's parseToPojo, instead.");
    }
  }
  module.exports = LdapMessage;
});

// node_modules/@ldapjs/messages/lib/messages/extension-responses/password-modify.js
var require_password_modify = __commonJS(function(exports, module) {
  var { BerReader } = require_asn1();
  var ExtensionResponse = require_extension_response();

  class PasswordModifyResponse extends ExtensionResponse {
    static fromResponse(response) {
      if (response.responseValue === undefined) {
        return new PasswordModifyResponse;
      }
      const valueBuffer = Buffer.from(response.responseValue.substring(8), "hex");
      const reader = new BerReader(valueBuffer);
      reader.readSequence();
      const responseValue = reader.readString(128);
      return new PasswordModifyResponse({ responseValue });
    }
  }
  module.exports = PasswordModifyResponse;
});

// node_modules/@ldapjs/messages/lib/messages/extension-responses/who-am-i.js
var require_who_am_i = __commonJS(function(exports, module) {
  var ExtensionResponse = require_extension_response();

  class WhoAmIResponse extends ExtensionResponse {
    static fromResponse(response) {
      if (response.responseValue === undefined) {
        return new WhoAmIResponse;
      }
      const valueBuffer = Buffer.from(response.responseValue.substring(8), "hex");
      const responseValue = valueBuffer.toString("utf8");
      return new WhoAmIResponse({ responseValue });
    }
  }
  module.exports = WhoAmIResponse;
});

// node_modules/@ldapjs/messages/index.js
var require_messages = __commonJS(function(exports, module) {
  module.exports = {
    LdapMessage: require_ldap_message(),
    LdapResult: require_ldap_result(),
    AbandonRequest: require_abandon_request(),
    AddRequest: require_add_request(),
    BindRequest: require_bind_request(),
    CompareRequest: require_compare_request(),
    DeleteRequest: require_delete_request(),
    ExtensionRequest: require_extension_request(),
    ModifyRequest: require_modify_request(),
    ModifyDnRequest: require_modifydn_request(),
    SearchRequest: require_search_request(),
    UnbindRequest: require_unbind_request(),
    AbandonResponse: require_abandon_response(),
    AddResponse: require_add_response(),
    BindResponse: require_bind_response(),
    CompareResponse: require_compare_response(),
    DeleteResponse: require_delete_response(),
    ExtensionResponse: require_extension_response(),
    ModifyResponse: require_modify_response(),
    ModifyDnResponse: require_modifydn_response(),
    SearchResultEntry: require_search_result_entry(),
    SearchResultReference: require_search_result_reference(),
    SearchResultDone: require_search_result_done(),
    PasswordModifyResponse: require_password_modify(),
    WhoAmIResponse: require_who_am_i(),
    IntermediateResponse: require_intermediate_response()
  };
});

// node_modules/ldapjs/lib/messages/search_response.js
var require_search_response = __commonJS(function(exports, module) {
  var assert = require_assert();
  var Attribute = require_attribute();
  var {
    SearchResultEntry: SearchEntry,
    SearchResultReference: SearchReference,
    SearchResultDone
  } = require_messages();
  var parseDN = require_dn2().DN.fromString;

  class SearchResponse extends SearchResultDone {
    attributes;
    notAttributes;
    sentEntries;
    constructor(options = {}) {
      super(options);
      this.attributes = options.attributes ? options.attributes.slice() : [];
      this.notAttributes = [];
      this.sentEntries = 0;
    }
  }
  SearchResponse.prototype.send = function(entry, nofiltering) {
    if (!entry || typeof entry !== "object") {
      throw new TypeError("entry (SearchEntry) required");
    }
    if (nofiltering === undefined) {
      nofiltering = false;
    }
    if (typeof nofiltering !== "boolean") {
      throw new TypeError("noFiltering must be a boolean");
    }
    const self = this;
    const savedAttrs = {};
    let save = null;
    if (entry instanceof SearchEntry || entry instanceof SearchReference) {
      if (!entry.messageId) {
        entry.messageId = this.messageId;
      }
      if (entry.messageId !== this.messageId) {
        throw new Error("SearchEntry messageId mismatch");
      }
    } else {
      if (!entry.attributes) {
        throw new Error("entry.attributes required");
      }
      const all = self.attributes.indexOf("*") !== -1;
      Object.keys(entry.attributes).forEach(function(a) {
        const _a = a.toLowerCase();
        if (!nofiltering && _a.length && _a[0] === "_") {
          savedAttrs[a] = entry.attributes[a];
          delete entry.attributes[a];
        } else if (!nofiltering && self.notAttributes.indexOf(_a) !== -1) {
          savedAttrs[a] = entry.attributes[a];
          delete entry.attributes[a];
        } else if (all) {} else if (self.attributes.length && self.attributes.indexOf(_a) === -1) {
          savedAttrs[a] = entry.attributes[a];
          delete entry.attributes[a];
        }
      });
      save = entry;
      entry = new SearchEntry({
        objectName: typeof save.dn === "string" ? parseDN(save.dn) : save.dn,
        messageId: self.messageId,
        attributes: Attribute.fromObject(entry.attributes)
      });
    }
    try {
      this.log.debug("%s: sending:  %j", this.connection.ldap.id, entry.pojo);
      this.connection.write(entry.toBer().buffer);
      this.sentEntries++;
      Object.keys(savedAttrs).forEach(function(k) {
        save.attributes[k] = savedAttrs[k];
      });
    } catch (e) {
      this.log.warn(e, "%s failure to write message %j", this.connection.ldap.id, this.pojo);
    }
  };
  SearchResponse.prototype.createSearchEntry = function(object2) {
    assert.object(object2);
    const entry = new SearchEntry({
      messageId: this.messageId,
      objectName: object2.objectName || object2.dn,
      attributes: object2.attributes ?? []
    });
    return entry;
  };
  SearchResponse.prototype.createSearchReference = function(uris) {
    if (!uris) {
      throw new TypeError("uris ([string]) required");
    }
    if (!Array.isArray(uris)) {
      uris = [uris];
    }
    const self = this;
    return new SearchReference({
      messageId: self.messageId,
      uri: uris
    });
  };
  module.exports = SearchResponse;
});

// node_modules/ldapjs/lib/messages/parser.js
var require_parser = __commonJS(function(exports, module) {
  var EventEmitter = __require("events").EventEmitter;
  var util = __require("util");
  var assert = require_assert();
  var asn1 = require_asn1();
  var logger = require_logger();
  var messages = require_messages();
  var AbandonRequest = messages.AbandonRequest;
  var AddRequest = messages.AddRequest;
  var AddResponse = messages.AddResponse;
  var BindRequest = messages.BindRequest;
  var BindResponse = messages.BindResponse;
  var CompareRequest = messages.CompareRequest;
  var CompareResponse = messages.CompareResponse;
  var DeleteRequest = messages.DeleteRequest;
  var DeleteResponse = messages.DeleteResponse;
  var ExtendedRequest = messages.ExtensionRequest;
  var ExtendedResponse = messages.ExtensionResponse;
  var ModifyRequest = messages.ModifyRequest;
  var ModifyResponse = messages.ModifyResponse;
  var ModifyDNRequest = messages.ModifyDnRequest;
  var ModifyDNResponse = messages.ModifyDnResponse;
  var SearchRequest = messages.SearchRequest;
  var SearchEntry = messages.SearchResultEntry;
  var SearchReference = messages.SearchResultReference;
  var SearchResponse = require_search_response();
  var UnbindRequest = messages.UnbindRequest;
  var LDAPResult = messages.LdapResult;
  var Protocol = require_protocol();
  var BerReader = asn1.BerReader;
  function Parser(options = {}) {
    assert.object(options);
    EventEmitter.call(this);
    this.buffer = null;
    this.log = options.log || logger;
  }
  util.inherits(Parser, EventEmitter);
  Parser.prototype.write = function(data) {
    if (!data || !Buffer.isBuffer(data)) {
      throw new TypeError("data (buffer) required");
    }
    let nextMessage = null;
    const self = this;
    function end() {
      if (nextMessage) {
        return self.write(nextMessage);
      }
      return true;
    }
    self.buffer = self.buffer ? Buffer.concat([self.buffer, data]) : data;
    let ber = new BerReader(self.buffer);
    let foundSeq = false;
    try {
      foundSeq = ber.readSequence();
    } catch (e) {
      this.emit("error", e);
    }
    if (!foundSeq || ber.remain < ber.length) {
      return false;
    } else if (ber.remain > ber.length) {
      nextMessage = self.buffer.slice(ber.offset + ber.length);
      const currOffset = ber.offset;
      ber = new BerReader(ber.buffer.subarray(0, currOffset + ber.length));
      ber.readSequence();
      assert.equal(ber.remain, ber.length);
    }
    self.buffer = null;
    let message;
    try {
      if (Object.prototype.toString.call(ber) === "[object BerReader]") {
        message = messages.LdapMessage.parse(ber.sequenceToReader());
      } else {
        message = this.getMessage(ber);
      }
      if (!message) {
        return end();
      }
      message.log = this.log;
    } catch (e) {
      this.emit("error", e, message);
      return false;
    }
    this.emit("message", message);
    return end();
  };
  Parser.prototype.getMessage = function(ber) {
    assert.ok(ber);
    const self = this;
    const messageId = ber.readInt();
    const type = ber.readSequence();
    let Message;
    switch (type) {
      case Protocol.operations.LDAP_REQ_ABANDON:
        Message = AbandonRequest;
        break;
      case Protocol.operations.LDAP_REQ_ADD:
        Message = AddRequest;
        break;
      case Protocol.operations.LDAP_RES_ADD:
        Message = AddResponse;
        break;
      case Protocol.operations.LDAP_REQ_BIND:
        Message = BindRequest;
        break;
      case Protocol.operations.LDAP_RES_BIND:
        Message = BindResponse;
        break;
      case Protocol.operations.LDAP_REQ_COMPARE:
        Message = CompareRequest;
        break;
      case Protocol.operations.LDAP_RES_COMPARE:
        Message = CompareResponse;
        break;
      case Protocol.operations.LDAP_REQ_DELETE:
        Message = DeleteRequest;
        break;
      case Protocol.operations.LDAP_RES_DELETE:
        Message = DeleteResponse;
        break;
      case Protocol.operations.LDAP_REQ_EXTENSION:
        Message = ExtendedRequest;
        break;
      case Protocol.operations.LDAP_RES_EXTENSION:
        Message = ExtendedResponse;
        break;
      case Protocol.operations.LDAP_REQ_MODIFY:
        Message = ModifyRequest;
        break;
      case Protocol.operations.LDAP_RES_MODIFY:
        Message = ModifyResponse;
        break;
      case Protocol.operations.LDAP_REQ_MODRDN:
        Message = ModifyDNRequest;
        break;
      case Protocol.operations.LDAP_RES_MODRDN:
        Message = ModifyDNResponse;
        break;
      case Protocol.operations.LDAP_REQ_SEARCH:
        Message = SearchRequest;
        break;
      case Protocol.operations.LDAP_RES_SEARCH_ENTRY:
        Message = SearchEntry;
        break;
      case Protocol.operations.LDAP_RES_SEARCH_REF:
        Message = SearchReference;
        break;
      case Protocol.operations.LDAP_RES_SEARCH:
        Message = SearchResponse;
        break;
      case Protocol.operations.LDAP_REQ_UNBIND:
        Message = UnbindRequest;
        break;
      default:
        this.emit("error", new Error("Op 0x" + (type ? type.toString(16) : "??") + " not supported"), new LDAPResult({
          messageId,
          protocolOp: type || Protocol.operations.LDAP_RES_EXTENSION
        }));
        return false;
    }
    return new Message({
      messageId,
      log: self.log
    });
  };
  module.exports = Parser;
});

// node_modules/ldapjs/lib/messages/index.js
var require_messages2 = __commonJS(function(exports, module) {
  var messages = require_messages();
  var Parser = require_parser();
  var SearchResponse = require_search_response();
  module.exports = {
    LDAPMessage: messages.LdapMessage,
    LDAPResult: messages.LdapResult,
    Parser,
    AbandonRequest: messages.AbandonRequest,
    AbandonResponse: messages.AbandonResponse,
    AddRequest: messages.AddRequest,
    AddResponse: messages.AddResponse,
    BindRequest: messages.BindRequest,
    BindResponse: messages.BindResponse,
    CompareRequest: messages.CompareRequest,
    CompareResponse: messages.CompareResponse,
    DeleteRequest: messages.DeleteRequest,
    DeleteResponse: messages.DeleteResponse,
    ExtendedRequest: messages.ExtensionRequest,
    ExtendedResponse: messages.ExtensionResponse,
    ModifyRequest: messages.ModifyRequest,
    ModifyResponse: messages.ModifyResponse,
    ModifyDNRequest: messages.ModifyDnRequest,
    ModifyDNResponse: messages.ModifyDnResponse,
    SearchRequest: messages.SearchRequest,
    SearchEntry: messages.SearchResultEntry,
    SearchReference: messages.SearchResultReference,
    SearchResponse,
    UnbindRequest: messages.UnbindRequest
  };
});

// node_modules/ldapjs/lib/errors/codes.js
var require_codes = __commonJS(function(exports, module) {
  module.exports = {
    LDAP_SUCCESS: 0,
    LDAP_OPERATIONS_ERROR: 1,
    LDAP_PROTOCOL_ERROR: 2,
    LDAP_TIME_LIMIT_EXCEEDED: 3,
    LDAP_SIZE_LIMIT_EXCEEDED: 4,
    LDAP_COMPARE_FALSE: 5,
    LDAP_COMPARE_TRUE: 6,
    LDAP_AUTH_METHOD_NOT_SUPPORTED: 7,
    LDAP_STRONG_AUTH_REQUIRED: 8,
    LDAP_REFERRAL: 10,
    LDAP_ADMIN_LIMIT_EXCEEDED: 11,
    LDAP_UNAVAILABLE_CRITICAL_EXTENSION: 12,
    LDAP_CONFIDENTIALITY_REQUIRED: 13,
    LDAP_SASL_BIND_IN_PROGRESS: 14,
    LDAP_NO_SUCH_ATTRIBUTE: 16,
    LDAP_UNDEFINED_ATTRIBUTE_TYPE: 17,
    LDAP_INAPPROPRIATE_MATCHING: 18,
    LDAP_CONSTRAINT_VIOLATION: 19,
    LDAP_ATTRIBUTE_OR_VALUE_EXISTS: 20,
    LDAP_INVALID_ATTRIBUTE_SYNTAX: 21,
    LDAP_NO_SUCH_OBJECT: 32,
    LDAP_ALIAS_PROBLEM: 33,
    LDAP_INVALID_DN_SYNTAX: 34,
    LDAP_ALIAS_DEREF_PROBLEM: 36,
    LDAP_INAPPROPRIATE_AUTHENTICATION: 48,
    LDAP_INVALID_CREDENTIALS: 49,
    LDAP_INSUFFICIENT_ACCESS_RIGHTS: 50,
    LDAP_BUSY: 51,
    LDAP_UNAVAILABLE: 52,
    LDAP_UNWILLING_TO_PERFORM: 53,
    LDAP_LOOP_DETECT: 54,
    LDAP_SORT_CONTROL_MISSING: 60,
    LDAP_INDEX_RANGE_ERROR: 61,
    LDAP_NAMING_VIOLATION: 64,
    LDAP_OBJECTCLASS_VIOLATION: 65,
    LDAP_NOT_ALLOWED_ON_NON_LEAF: 66,
    LDAP_NOT_ALLOWED_ON_RDN: 67,
    LDAP_ENTRY_ALREADY_EXISTS: 68,
    LDAP_OBJECTCLASS_MODS_PROHIBITED: 69,
    LDAP_AFFECTS_MULTIPLE_DSAS: 71,
    LDAP_CONTROL_ERROR: 76,
    LDAP_OTHER: 80,
    LDAP_PROXIED_AUTHORIZATION_DENIED: 123
  };
});

// node_modules/ldapjs/lib/errors/index.js
var require_errors2 = __commonJS(function(exports, module) {
  var util = __require("util");
  var assert = require_assert();
  var LDAPResult = require_messages2().LDAPResult;
  var CODES = require_codes();
  var ERRORS = [];
  function LDAPError(message, dn, caller) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, caller || LDAPError);
    }
    this.lde_message = message;
    this.lde_dn = dn;
  }
  util.inherits(LDAPError, Error);
  Object.defineProperties(LDAPError.prototype, {
    name: {
      get: function getName() {
        return "LDAPError";
      },
      configurable: false
    },
    code: {
      get: function getCode() {
        return CODES.LDAP_OTHER;
      },
      configurable: false
    },
    message: {
      get: function getMessage() {
        return this.lde_message || this.name;
      },
      set: function setMessage(message) {
        this.lde_message = message;
      },
      configurable: false
    },
    dn: {
      get: function getDN() {
        return this.lde_dn ? this.lde_dn.toString() : "";
      },
      configurable: false
    }
  });
  module.exports = {};
  module.exports.LDAPError = LDAPError;
  Object.keys(CODES).forEach(function(code) {
    module.exports[code] = CODES[code];
    if (code === "LDAP_SUCCESS") {
      return;
    }
    let err = "";
    let msg = "";
    const pieces = code.split("_").slice(1);
    for (let i = 0;i < pieces.length; i++) {
      const lc = pieces[i].toLowerCase();
      const key = lc.charAt(0).toUpperCase() + lc.slice(1);
      err += key;
      msg += key + (i + 1 < pieces.length ? " " : "");
    }
    if (!/\w+Error$/.test(err)) {
      err += "Error";
    }
    module.exports[err] = function(message, dn, caller) {
      LDAPError.call(this, message, dn, caller || module.exports[err]);
    };
    module.exports[err].constructor = module.exports[err];
    util.inherits(module.exports[err], LDAPError);
    Object.defineProperties(module.exports[err].prototype, {
      name: {
        get: function getName() {
          return err;
        },
        configurable: false
      },
      code: {
        get: function getCode() {
          return CODES[code];
        },
        configurable: false
      }
    });
    ERRORS[CODES[code]] = {
      err,
      message: msg
    };
  });
  module.exports.getError = function(res) {
    assert.ok(res instanceof LDAPResult, "res (LDAPResult) required");
    const errObj = ERRORS[res.status];
    const E = module.exports[errObj.err];
    return new E(res.errorMessage || errObj.message, res.matchedDN || null, module.exports.getError);
  };
  module.exports.getMessage = function(code) {
    assert.number(code, "code (number) required");
    const errObj = ERRORS[code];
    return errObj && errObj.message ? errObj.message : "";
  };
  function ConnectionError(message) {
    LDAPError.call(this, message, null, ConnectionError);
  }
  util.inherits(ConnectionError, LDAPError);
  module.exports.ConnectionError = ConnectionError;
  Object.defineProperties(ConnectionError.prototype, {
    name: {
      get: function() {
        return "ConnectionError";
      },
      configurable: false
    }
  });
  function AbandonedError(message) {
    LDAPError.call(this, message, null, AbandonedError);
  }
  util.inherits(AbandonedError, LDAPError);
  module.exports.AbandonedError = AbandonedError;
  Object.defineProperties(AbandonedError.prototype, {
    name: {
      get: function() {
        return "AbandonedError";
      },
      configurable: false
    }
  });
  function TimeoutError(message) {
    LDAPError.call(this, message, null, TimeoutError);
  }
  util.inherits(TimeoutError, LDAPError);
  module.exports.TimeoutError = TimeoutError;
  Object.defineProperties(TimeoutError.prototype, {
    name: {
      get: function() {
        return "TimeoutError";
      },
      configurable: false
    }
  });
});

// node_modules/ldapjs/lib/client/request-queue/purge.js
var require_purge = __commonJS(function(exports, module) {
  var { TimeoutError } = require_errors2();
  module.exports = function purge() {
    this.flush(function flushCB(a, b, c, cb) {
      cb(new TimeoutError("request queue timeout"));
    });
  };
});

// node_modules/ldapjs/lib/client/request-queue/index.js
var require_request_queue = __commonJS(function(exports, module) {
  var enqueue = require_enqueue();
  var flush = require_flush();
  var purge = require_purge();
  module.exports = function requestQueueFactory(options) {
    const opts = Object.assign({}, options);
    const q = {
      size: opts.size > 0 ? opts.size : Infinity,
      timeout: opts.timeout > 0 ? opts.timeout : 0,
      _queue: new Set,
      _timer: null,
      _frozen: false
    };
    q.enqueue = enqueue.bind(q);
    q.flush = flush.bind(q);
    q.purge = purge.bind(q);
    q.freeze = function freeze() {
      this._frozen = true;
    };
    q.thaw = function thaw() {
      this._frozen = false;
    };
    return q;
  };
});

// node_modules/ldapjs/lib/client/constants.js
var require_constants = __commonJS(function(exports, module) {
  module.exports = {
    MAX_MSGID: Math.pow(2, 31) - 1
  };
});

// node_modules/ldapjs/lib/client/message-tracker/id-generator.js
var require_id_generator = __commonJS(function(exports, module) {
  var { MAX_MSGID } = require_constants();
  module.exports = function idGeneratorFactory(start = 0) {
    let currentID = start;
    return function nextID() {
      const id = currentID + 1;
      currentID = id >= MAX_MSGID ? 1 : id;
      return currentID;
    };
  };
});

// node_modules/ldapjs/lib/client/message-tracker/ge-window.js
var require_ge_window = __commonJS(function(exports, module) {
  var { MAX_MSGID } = require_constants();
  module.exports = function geWindow(ref, comp) {
    let max = ref + Math.floor(MAX_MSGID / 2);
    const min = ref;
    if (max >= MAX_MSGID) {
      max = max - MAX_MSGID - 1;
      return comp <= max || comp >= min;
    } else {
      return comp <= max && comp >= min;
    }
  };
});

// node_modules/ldapjs/lib/client/message-tracker/purge-abandoned.js
var require_purge_abandoned = __commonJS(function(exports, module) {
  var { AbandonedError } = require_errors2();
  var geWindow = require_ge_window();
  module.exports = function purgeAbandoned(msgID, abandoned) {
    abandoned.forEach((val, key) => {
      if (geWindow(val.age, msgID) === false)
        return;
      val.cb(new AbandonedError("client request abandoned"));
      abandoned.delete(key);
    });
  };
});

// node_modules/ldapjs/lib/client/message-tracker/index.js
var require_message_tracker = __commonJS(function(exports, module) {
  var idGeneratorFactory = require_id_generator();
  var purgeAbandoned = require_purge_abandoned();
  module.exports = function messageTrackerFactory(options) {
    if (Object.prototype.toString.call(options) !== "[object Object]") {
      throw Error("options object is required");
    }
    if (!options.id || typeof options.id !== "string") {
      throw Error("options.id string is required");
    }
    if (!options.parser || Object.prototype.toString.call(options.parser) !== "[object Object]") {
      throw Error("options.parser object is required");
    }
    let currentID = 0;
    const nextID = idGeneratorFactory();
    const messages = new Map;
    const abandoned = new Map;
    const tracker = {
      id: options.id,
      parser: options.parser
    };
    Object.defineProperty(tracker, "pending", {
      get() {
        return messages.size;
      }
    });
    tracker.abandon = function abandonMessage(msgID) {
      if (messages.has(msgID) === false)
        return false;
      const toAbandon = messages.get(msgID);
      abandoned.set(msgID, {
        age: currentID,
        message: toAbandon.message,
        cb: toAbandon.callback
      });
      return messages.delete(msgID);
    };
    tracker.fetch = function fetchMessage(msgID) {
      const tracked = messages.get(msgID);
      if (tracked) {
        purgeAbandoned(msgID, abandoned);
        return tracked;
      }
      const abandonedMsg = abandoned.get(msgID);
      if (abandonedMsg) {
        return { message: abandonedMsg, callback: abandonedMsg.cb };
      }
      return null;
    };
    tracker.purge = function purgeMessages(cb) {
      messages.forEach((val, key) => {
        purgeAbandoned(key, abandoned);
        tracker.remove(key);
        cb(key, val.callback);
      });
    };
    tracker.remove = function removeMessage(msgID) {
      if (messages.delete(msgID) === false) {
        abandoned.delete(msgID);
      }
    };
    tracker.track = function trackMessage(message, callback) {
      currentID = nextID();
      message.messageId = currentID;
      messages.set(currentID, { callback, message });
    };
    return tracker;
  };
});

// node_modules/wrappy/wrappy.js
var require_wrappy = __commonJS(function(exports, module) {
  module.exports = wrappy;
  function wrappy(fn, cb) {
    if (fn && cb)
      return wrappy(fn)(cb);
    if (typeof fn !== "function")
      throw new TypeError("need wrapper function");
    Object.keys(fn).forEach(function(k) {
      wrapper[k] = fn[k];
    });
    return wrapper;
    function wrapper() {
      var args = new Array(arguments.length);
      for (var i = 0;i < args.length; i++) {
        args[i] = arguments[i];
      }
      var ret = fn.apply(this, args);
      var cb = args[args.length - 1];
      if (typeof ret === "function" && ret !== cb) {
        Object.keys(cb).forEach(function(k) {
          ret[k] = cb[k];
        });
      }
      return ret;
    }
  }
});

// node_modules/once/once.js
var require_once = __commonJS(function(exports, module) {
  var wrappy = require_wrappy();
  module.exports = wrappy(once);
  module.exports.strict = wrappy(onceStrict);
  once.proto = once(function() {
    Object.defineProperty(Function.prototype, "once", {
      value: function() {
        return once(this);
      },
      configurable: true
    });
    Object.defineProperty(Function.prototype, "onceStrict", {
      value: function() {
        return onceStrict(this);
      },
      configurable: true
    });
  });
  function once(fn) {
    var f = function() {
      if (f.called)
        return f.value;
      f.called = true;
      return f.value = fn.apply(this, arguments);
    };
    f.called = false;
    return f;
  }
  function onceStrict(fn) {
    var f = function() {
      if (f.called)
        throw new Error(f.onceError);
      f.called = true;
      return f.value = fn.apply(this, arguments);
    };
    var name = fn.name || "Function wrapped with `once`";
    f.onceError = name + " shouldn't be called more than once";
    f.called = false;
    return f;
  }
});

// node_modules/precond/lib/errors.js
var require_errors3 = __commonJS(function(exports, module) {
  var util = __require("util");
  function IllegalArgumentError(message) {
    Error.call(this, message);
    this.message = message;
  }
  util.inherits(IllegalArgumentError, Error);
  IllegalArgumentError.prototype.name = "IllegalArgumentError";
  function IllegalStateError(message) {
    Error.call(this, message);
    this.message = message;
  }
  util.inherits(IllegalStateError, Error);
  IllegalStateError.prototype.name = "IllegalStateError";
  exports.IllegalStateError = IllegalStateError;
  exports.IllegalArgumentError = IllegalArgumentError;
});

// node_modules/precond/lib/checks.js
var require_checks = __commonJS(function(exports, module) {
  var util = __require("util");
  var errors = module.exports = require_errors3();
  function failCheck(ExceptionConstructor, callee, messageFormat, formatArgs) {
    messageFormat = messageFormat || "";
    var message = util.format.apply(this, [messageFormat].concat(formatArgs));
    var error = new ExceptionConstructor(message);
    Error.captureStackTrace(error, callee);
    throw error;
  }
  function failArgumentCheck(callee, message, formatArgs) {
    failCheck(errors.IllegalArgumentError, callee, message, formatArgs);
  }
  function failStateCheck(callee, message, formatArgs) {
    failCheck(errors.IllegalStateError, callee, message, formatArgs);
  }
  module.exports.checkArgument = function(value, message) {
    if (!value) {
      failArgumentCheck(arguments.callee, message, Array.prototype.slice.call(arguments, 2));
    }
  };
  module.exports.checkState = function(value, message) {
    if (!value) {
      failStateCheck(arguments.callee, message, Array.prototype.slice.call(arguments, 2));
    }
  };
  module.exports.checkIsDef = function(value, message) {
    if (value !== undefined) {
      return value;
    }
    failArgumentCheck(arguments.callee, message || "Expected value to be defined but was undefined.", Array.prototype.slice.call(arguments, 2));
  };
  module.exports.checkIsDefAndNotNull = function(value, message) {
    if (value != null) {
      return value;
    }
    failArgumentCheck(arguments.callee, message || 'Expected value to be defined and not null but got "' + typeOf(value) + '".', Array.prototype.slice.call(arguments, 2));
  };
  function typeOf(value) {
    var s = typeof value;
    if (s == "object") {
      if (!value) {
        return "null";
      } else if (value instanceof Array) {
        return "array";
      }
    }
    return s;
  }
  function typeCheck(expect) {
    return function(value, message) {
      var type = typeOf(value);
      if (type == expect) {
        return value;
      }
      failArgumentCheck(arguments.callee, message || 'Expected "' + expect + '" but got "' + type + '".', Array.prototype.slice.call(arguments, 2));
    };
  }
  module.exports.checkIsString = typeCheck("string");
  module.exports.checkIsArray = typeCheck("array");
  module.exports.checkIsNumber = typeCheck("number");
  module.exports.checkIsBoolean = typeCheck("boolean");
  module.exports.checkIsFunction = typeCheck("function");
  module.exports.checkIsObject = typeCheck("object");
});

// node_modules/backoff/lib/backoff.js
var require_backoff = __commonJS(function(exports, module) {
  var events = __require("events");
  var precond = require_checks();
  var util = __require("util");
  function Backoff(backoffStrategy) {
    events.EventEmitter.call(this);
    this.backoffStrategy_ = backoffStrategy;
    this.maxNumberOfRetry_ = -1;
    this.backoffNumber_ = 0;
    this.backoffDelay_ = 0;
    this.timeoutID_ = -1;
    this.handlers = {
      backoff: this.onBackoff_.bind(this)
    };
  }
  util.inherits(Backoff, events.EventEmitter);
  Backoff.prototype.failAfter = function(maxNumberOfRetry) {
    precond.checkArgument(maxNumberOfRetry > 0, "Expected a maximum number of retry greater than 0 but got %s.", maxNumberOfRetry);
    this.maxNumberOfRetry_ = maxNumberOfRetry;
  };
  Backoff.prototype.backoff = function(err) {
    precond.checkState(this.timeoutID_ === -1, "Backoff in progress.");
    if (this.backoffNumber_ === this.maxNumberOfRetry_) {
      this.emit("fail", err);
      this.reset();
    } else {
      this.backoffDelay_ = this.backoffStrategy_.next();
      this.timeoutID_ = setTimeout(this.handlers.backoff, this.backoffDelay_);
      this.emit("backoff", this.backoffNumber_, this.backoffDelay_, err);
    }
  };
  Backoff.prototype.onBackoff_ = function() {
    this.timeoutID_ = -1;
    this.emit("ready", this.backoffNumber_, this.backoffDelay_);
    this.backoffNumber_++;
  };
  Backoff.prototype.reset = function() {
    this.backoffNumber_ = 0;
    this.backoffStrategy_.reset();
    clearTimeout(this.timeoutID_);
    this.timeoutID_ = -1;
  };
  module.exports = Backoff;
});

// node_modules/backoff/lib/strategy/strategy.js
var require_strategy = __commonJS(function(exports, module) {
  var events = __require("events");
  var util = __require("util");
  function isDef(value) {
    return value !== undefined && value !== null;
  }
  function BackoffStrategy(options) {
    options = options || {};
    if (isDef(options.initialDelay) && options.initialDelay < 1) {
      throw new Error("The initial timeout must be greater than 0.");
    } else if (isDef(options.maxDelay) && options.maxDelay < 1) {
      throw new Error("The maximal timeout must be greater than 0.");
    }
    this.initialDelay_ = options.initialDelay || 100;
    this.maxDelay_ = options.maxDelay || 1e4;
    if (this.maxDelay_ <= this.initialDelay_) {
      throw new Error("The maximal backoff delay must be " + "greater than the initial backoff delay.");
    }
    if (isDef(options.randomisationFactor) && (options.randomisationFactor < 0 || options.randomisationFactor > 1)) {
      throw new Error("The randomisation factor must be between 0 and 1.");
    }
    this.randomisationFactor_ = options.randomisationFactor || 0;
  }
  BackoffStrategy.prototype.getMaxDelay = function() {
    return this.maxDelay_;
  };
  BackoffStrategy.prototype.getInitialDelay = function() {
    return this.initialDelay_;
  };
  BackoffStrategy.prototype.next = function() {
    var backoffDelay = this.next_();
    var randomisationMultiple = 1 + Math.random() * this.randomisationFactor_;
    var randomizedDelay = Math.round(backoffDelay * randomisationMultiple);
    return randomizedDelay;
  };
  BackoffStrategy.prototype.next_ = function() {
    throw new Error("BackoffStrategy.next_() unimplemented.");
  };
  BackoffStrategy.prototype.reset = function() {
    this.reset_();
  };
  BackoffStrategy.prototype.reset_ = function() {
    throw new Error("BackoffStrategy.reset_() unimplemented.");
  };
  module.exports = BackoffStrategy;
});

// node_modules/backoff/lib/strategy/exponential.js
var require_exponential = __commonJS(function(exports, module) {
  var util = __require("util");
  var precond = require_checks();
  var BackoffStrategy = require_strategy();
  function ExponentialBackoffStrategy(options) {
    BackoffStrategy.call(this, options);
    this.backoffDelay_ = 0;
    this.nextBackoffDelay_ = this.getInitialDelay();
    this.factor_ = ExponentialBackoffStrategy.DEFAULT_FACTOR;
    if (options && options.factor !== undefined) {
      precond.checkArgument(options.factor > 1, "Exponential factor should be greater than 1 but got %s.", options.factor);
      this.factor_ = options.factor;
    }
  }
  util.inherits(ExponentialBackoffStrategy, BackoffStrategy);
  ExponentialBackoffStrategy.DEFAULT_FACTOR = 2;
  ExponentialBackoffStrategy.prototype.next_ = function() {
    this.backoffDelay_ = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
    this.nextBackoffDelay_ = this.backoffDelay_ * this.factor_;
    return this.backoffDelay_;
  };
  ExponentialBackoffStrategy.prototype.reset_ = function() {
    this.backoffDelay_ = 0;
    this.nextBackoffDelay_ = this.getInitialDelay();
  };
  module.exports = ExponentialBackoffStrategy;
});

// node_modules/backoff/lib/strategy/fibonacci.js
var require_fibonacci = __commonJS(function(exports, module) {
  var util = __require("util");
  var BackoffStrategy = require_strategy();
  function FibonacciBackoffStrategy(options) {
    BackoffStrategy.call(this, options);
    this.backoffDelay_ = 0;
    this.nextBackoffDelay_ = this.getInitialDelay();
  }
  util.inherits(FibonacciBackoffStrategy, BackoffStrategy);
  FibonacciBackoffStrategy.prototype.next_ = function() {
    var backoffDelay = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
    this.nextBackoffDelay_ += this.backoffDelay_;
    this.backoffDelay_ = backoffDelay;
    return backoffDelay;
  };
  FibonacciBackoffStrategy.prototype.reset_ = function() {
    this.nextBackoffDelay_ = this.getInitialDelay();
    this.backoffDelay_ = 0;
  };
  module.exports = FibonacciBackoffStrategy;
});

// node_modules/backoff/lib/function_call.js
var require_function_call = __commonJS(function(exports, module) {
  var events = __require("events");
  var precond = require_checks();
  var util = __require("util");
  var Backoff = require_backoff();
  var FibonacciBackoffStrategy = require_fibonacci();
  function FunctionCall(fn, args, callback) {
    events.EventEmitter.call(this);
    precond.checkIsFunction(fn, "Expected fn to be a function.");
    precond.checkIsArray(args, "Expected args to be an array.");
    precond.checkIsFunction(callback, "Expected callback to be a function.");
    this.function_ = fn;
    this.arguments_ = args;
    this.callback_ = callback;
    this.lastResult_ = [];
    this.numRetries_ = 0;
    this.backoff_ = null;
    this.strategy_ = null;
    this.failAfter_ = -1;
    this.retryPredicate_ = FunctionCall.DEFAULT_RETRY_PREDICATE_;
    this.state_ = FunctionCall.State_.PENDING;
  }
  util.inherits(FunctionCall, events.EventEmitter);
  FunctionCall.State_ = {
    PENDING: 0,
    RUNNING: 1,
    COMPLETED: 2,
    ABORTED: 3
  };
  FunctionCall.DEFAULT_RETRY_PREDICATE_ = function(err) {
    return true;
  };
  FunctionCall.prototype.isPending = function() {
    return this.state_ == FunctionCall.State_.PENDING;
  };
  FunctionCall.prototype.isRunning = function() {
    return this.state_ == FunctionCall.State_.RUNNING;
  };
  FunctionCall.prototype.isCompleted = function() {
    return this.state_ == FunctionCall.State_.COMPLETED;
  };
  FunctionCall.prototype.isAborted = function() {
    return this.state_ == FunctionCall.State_.ABORTED;
  };
  FunctionCall.prototype.setStrategy = function(strategy) {
    precond.checkState(this.isPending(), "FunctionCall in progress.");
    this.strategy_ = strategy;
    return this;
  };
  FunctionCall.prototype.retryIf = function(retryPredicate) {
    precond.checkState(this.isPending(), "FunctionCall in progress.");
    this.retryPredicate_ = retryPredicate;
    return this;
  };
  FunctionCall.prototype.getLastResult = function() {
    return this.lastResult_.concat();
  };
  FunctionCall.prototype.getNumRetries = function() {
    return this.numRetries_;
  };
  FunctionCall.prototype.failAfter = function(maxNumberOfRetry) {
    precond.checkState(this.isPending(), "FunctionCall in progress.");
    this.failAfter_ = maxNumberOfRetry;
    return this;
  };
  FunctionCall.prototype.abort = function() {
    if (this.isCompleted() || this.isAborted()) {
      return;
    }
    if (this.isRunning()) {
      this.backoff_.reset();
    }
    this.state_ = FunctionCall.State_.ABORTED;
    this.lastResult_ = [new Error("Backoff aborted.")];
    this.emit("abort");
    this.doCallback_();
  };
  FunctionCall.prototype.start = function(backoffFactory) {
    precond.checkState(!this.isAborted(), "FunctionCall is aborted.");
    precond.checkState(this.isPending(), "FunctionCall already started.");
    var strategy = this.strategy_ || new FibonacciBackoffStrategy;
    this.backoff_ = backoffFactory ? backoffFactory(strategy) : new Backoff(strategy);
    this.backoff_.on("ready", this.doCall_.bind(this, true));
    this.backoff_.on("fail", this.doCallback_.bind(this));
    this.backoff_.on("backoff", this.handleBackoff_.bind(this));
    if (this.failAfter_ > 0) {
      this.backoff_.failAfter(this.failAfter_);
    }
    this.state_ = FunctionCall.State_.RUNNING;
    this.doCall_(false);
  };
  FunctionCall.prototype.doCall_ = function(isRetry) {
    if (isRetry) {
      this.numRetries_++;
    }
    var eventArgs = ["call"].concat(this.arguments_);
    events.EventEmitter.prototype.emit.apply(this, eventArgs);
    var callback = this.handleFunctionCallback_.bind(this);
    this.function_.apply(null, this.arguments_.concat(callback));
  };
  FunctionCall.prototype.doCallback_ = function() {
    this.callback_.apply(null, this.lastResult_);
  };
  FunctionCall.prototype.handleFunctionCallback_ = function() {
    if (this.isAborted()) {
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    this.lastResult_ = args;
    events.EventEmitter.prototype.emit.apply(this, ["callback"].concat(args));
    var err = args[0];
    if (err && this.retryPredicate_(err)) {
      this.backoff_.backoff(err);
    } else {
      this.state_ = FunctionCall.State_.COMPLETED;
      this.doCallback_();
    }
  };
  FunctionCall.prototype.handleBackoff_ = function(number, delay, err) {
    this.emit("backoff", number, delay, err);
  };
  module.exports = FunctionCall;
});

// node_modules/backoff/index.js
var require_backoff2 = __commonJS(function(exports, module) {
  var Backoff = require_backoff();
  var ExponentialBackoffStrategy = require_exponential();
  var FibonacciBackoffStrategy = require_fibonacci();
  var FunctionCall = require_function_call();
  exports.Backoff = Backoff;
  exports.FunctionCall = FunctionCall;
  exports.FibonacciStrategy = FibonacciBackoffStrategy;
  exports.ExponentialStrategy = ExponentialBackoffStrategy;
  exports.fibonacci = function(options) {
    return new Backoff(new FibonacciBackoffStrategy(options));
  };
  exports.exponential = function(options) {
    return new Backoff(new ExponentialBackoffStrategy(options));
  };
  exports.call = function(fn, vargs, callback) {
    var args = Array.prototype.slice.call(arguments);
    fn = args[0];
    vargs = args.slice(1, args.length - 1);
    callback = args[args.length - 1];
    return new FunctionCall(fn, vargs, callback);
  };
});

// node_modules/extsprintf/lib/extsprintf.js
var require_extsprintf = __commonJS(function(exports) {
  var mod_assert = __require("assert");
  var mod_util = __require("util");
  exports.sprintf = jsSprintf;
  exports.printf = jsPrintf;
  exports.fprintf = jsFprintf;
  function jsSprintf(ofmt) {
    var regex = [
      "([^%]*)",
      "%",
      "(['\\-+ #0]*?)",
      "([1-9]\\d*)?",
      "(\\.([1-9]\\d*))?",
      "[lhjztL]*?",
      "([diouxXfFeEgGaAcCsSp%jr])"
    ].join("");
    var re = new RegExp(regex);
    var args = Array.prototype.slice.call(arguments, 1);
    var fmt = ofmt;
    var flags, width, precision, conversion;
    var left, pad, sign, arg, match;
    var ret = "";
    var argn = 1;
    var posn = 0;
    var convposn;
    var curconv;
    mod_assert.equal("string", typeof fmt, "first argument must be a format string");
    while ((match = re.exec(fmt)) !== null) {
      ret += match[1];
      fmt = fmt.substring(match[0].length);
      curconv = match[0].substring(match[1].length);
      convposn = posn + match[1].length + 1;
      posn += match[0].length;
      flags = match[2] || "";
      width = match[3] || 0;
      precision = match[4] || "";
      conversion = match[6];
      left = false;
      sign = false;
      pad = " ";
      if (conversion == "%") {
        ret += "%";
        continue;
      }
      if (args.length === 0) {
        throw jsError(ofmt, convposn, curconv, "has no matching argument " + "(too few arguments passed)");
      }
      arg = args.shift();
      argn++;
      if (flags.match(/[\' #]/)) {
        throw jsError(ofmt, convposn, curconv, "uses unsupported flags");
      }
      if (precision.length > 0) {
        throw jsError(ofmt, convposn, curconv, "uses non-zero precision (not supported)");
      }
      if (flags.match(/-/))
        left = true;
      if (flags.match(/0/))
        pad = "0";
      if (flags.match(/\+/))
        sign = true;
      switch (conversion) {
        case "s":
          if (arg === undefined || arg === null) {
            throw jsError(ofmt, convposn, curconv, "attempted to print undefined or null " + "as a string (argument " + argn + " to " + "sprintf)");
          }
          ret += doPad(pad, width, left, arg.toString());
          break;
        case "d":
          arg = Math.floor(arg);
        case "f":
          sign = sign && arg > 0 ? "+" : "";
          ret += sign + doPad(pad, width, left, arg.toString());
          break;
        case "x":
          ret += doPad(pad, width, left, arg.toString(16));
          break;
        case "j":
          if (width === 0)
            width = 10;
          ret += mod_util.inspect(arg, false, width);
          break;
        case "r":
          ret += dumpException(arg);
          break;
        default:
          throw jsError(ofmt, convposn, curconv, "is not supported");
      }
    }
    ret += fmt;
    return ret;
  }
  function jsError(fmtstr, convposn, curconv, reason) {
    mod_assert.equal(typeof fmtstr, "string");
    mod_assert.equal(typeof curconv, "string");
    mod_assert.equal(typeof convposn, "number");
    mod_assert.equal(typeof reason, "string");
    return new Error('format string "' + fmtstr + '": conversion specifier "' + curconv + '" at character ' + convposn + " " + reason);
  }
  function jsPrintf() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(process.stdout);
    jsFprintf.apply(null, args);
  }
  function jsFprintf(stream) {
    var args = Array.prototype.slice.call(arguments, 1);
    return stream.write(jsSprintf.apply(this, args));
  }
  function doPad(chr, width, left, str) {
    var ret = str;
    while (ret.length < width) {
      if (left)
        ret += chr;
      else
        ret = chr + ret;
    }
    return ret;
  }
  function dumpException(ex) {
    var ret;
    if (!(ex instanceof Error))
      throw new Error(jsSprintf("invalid type for %%r: %j", ex));
    ret = "EXCEPTION: " + ex.constructor.name + ": " + ex.stack;
    if (ex.cause && typeof ex.cause === "function") {
      var cex = ex.cause();
      if (cex) {
        ret += `
Caused by: ` + dumpException(cex);
      }
    }
    return ret;
  }
});

// node_modules/core-util-is/lib/util.js
var require_util = __commonJS(function(exports) {
  function isArray(arg) {
    if (Array.isArray) {
      return Array.isArray(arg);
    }
    return objectToString(arg) === "[object Array]";
  }
  exports.isArray = isArray;
  function isBoolean(arg) {
    return typeof arg === "boolean";
  }
  exports.isBoolean = isBoolean;
  function isNull(arg) {
    return arg === null;
  }
  exports.isNull = isNull;
  function isNullOrUndefined(arg) {
    return arg == null;
  }
  exports.isNullOrUndefined = isNullOrUndefined;
  function isNumber(arg) {
    return typeof arg === "number";
  }
  exports.isNumber = isNumber;
  function isString(arg) {
    return typeof arg === "string";
  }
  exports.isString = isString;
  function isSymbol(arg) {
    return typeof arg === "symbol";
  }
  exports.isSymbol = isSymbol;
  function isUndefined(arg) {
    return arg === undefined;
  }
  exports.isUndefined = isUndefined;
  function isRegExp(re) {
    return objectToString(re) === "[object RegExp]";
  }
  exports.isRegExp = isRegExp;
  function isObject(arg) {
    return typeof arg === "object" && arg !== null;
  }
  exports.isObject = isObject;
  function isDate(d) {
    return objectToString(d) === "[object Date]";
  }
  exports.isDate = isDate;
  function isError(e) {
    return objectToString(e) === "[object Error]" || e instanceof Error;
  }
  exports.isError = isError;
  function isFunction(arg) {
    return typeof arg === "function";
  }
  exports.isFunction = isFunction;
  function isPrimitive(arg) {
    return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
  }
  exports.isPrimitive = isPrimitive;
  exports.isBuffer = Buffer.isBuffer;
  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }
});

// node_modules/vasync/node_modules/verror/lib/verror.js
var require_verror = __commonJS(function(exports, module) {
  var mod_assertplus = require_assert();
  var mod_util = __require("util");
  var mod_extsprintf = require_extsprintf();
  var mod_isError = require_util().isError;
  var sprintf = mod_extsprintf.sprintf;
  module.exports = VError;
  VError.VError = VError;
  VError.SError = SError;
  VError.WError = WError;
  VError.MultiError = MultiError;
  function parseConstructorArguments(args) {
    var argv, options, sprintf_args, shortmessage, k;
    mod_assertplus.object(args, "args");
    mod_assertplus.bool(args.strict, "args.strict");
    mod_assertplus.array(args.argv, "args.argv");
    argv = args.argv;
    if (argv.length === 0) {
      options = {};
      sprintf_args = [];
    } else if (mod_isError(argv[0])) {
      options = { cause: argv[0] };
      sprintf_args = argv.slice(1);
    } else if (typeof argv[0] === "object") {
      options = {};
      for (k in argv[0]) {
        options[k] = argv[0][k];
      }
      sprintf_args = argv.slice(1);
    } else {
      mod_assertplus.string(argv[0], "first argument to VError, SError, or WError " + "constructor must be a string, object, or Error");
      options = {};
      sprintf_args = argv;
    }
    mod_assertplus.object(options);
    if (!options.strict && !args.strict) {
      sprintf_args = sprintf_args.map(function(a) {
        return a === null ? "null" : a === undefined ? "undefined" : a;
      });
    }
    if (sprintf_args.length === 0) {
      shortmessage = "";
    } else {
      shortmessage = sprintf.apply(null, sprintf_args);
    }
    return {
      options,
      shortmessage
    };
  }
  function VError() {
    var args, obj, parsed, cause, ctor, message, k;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof VError)) {
      obj = Object.create(VError.prototype);
      VError.apply(obj, arguments);
      return obj;
    }
    parsed = parseConstructorArguments({
      argv: args,
      strict: false
    });
    if (parsed.options.name) {
      mod_assertplus.string(parsed.options.name, `error's "name" must be a string`);
      this.name = parsed.options.name;
    }
    this.jse_shortmsg = parsed.shortmessage;
    message = parsed.shortmessage;
    cause = parsed.options.cause;
    if (cause) {
      mod_assertplus.ok(mod_isError(cause), "cause is not an Error");
      this.jse_cause = cause;
      if (!parsed.options.skipCauseMessage) {
        message += ": " + cause.message;
      }
    }
    this.jse_info = {};
    if (parsed.options.info) {
      for (k in parsed.options.info) {
        this.jse_info[k] = parsed.options.info[k];
      }
    }
    this.message = message;
    Error.call(this, message);
    if (Error.captureStackTrace) {
      ctor = parsed.options.constructorOpt || this.constructor;
      Error.captureStackTrace(this, ctor);
    }
    return this;
  }
  mod_util.inherits(VError, Error);
  VError.prototype.name = "VError";
  VError.prototype.toString = function ve_toString() {
    var str = this.hasOwnProperty("name") && this.name || this.constructor.name || this.constructor.prototype.name;
    if (this.message)
      str += ": " + this.message;
    return str;
  };
  VError.prototype.cause = function ve_cause() {
    var cause = VError.cause(this);
    return cause === null ? undefined : cause;
  };
  VError.cause = function(err) {
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    return mod_isError(err.jse_cause) ? err.jse_cause : null;
  };
  VError.info = function(err) {
    var rv, cause, k;
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    cause = VError.cause(err);
    if (cause !== null) {
      rv = VError.info(cause);
    } else {
      rv = {};
    }
    if (typeof err.jse_info == "object" && err.jse_info !== null) {
      for (k in err.jse_info) {
        rv[k] = err.jse_info[k];
      }
    }
    return rv;
  };
  VError.findCauseByName = function(err, name) {
    var cause;
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    mod_assertplus.string(name, "name");
    mod_assertplus.ok(name.length > 0, "name cannot be empty");
    for (cause = err;cause !== null; cause = VError.cause(cause)) {
      mod_assertplus.ok(mod_isError(cause));
      if (cause.name == name) {
        return cause;
      }
    }
    return null;
  };
  VError.hasCauseWithName = function(err, name) {
    return VError.findCauseByName(err, name) !== null;
  };
  VError.fullStack = function(err) {
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    var cause = VError.cause(err);
    if (cause) {
      return err.stack + `
caused by: ` + VError.fullStack(cause);
    }
    return err.stack;
  };
  VError.errorFromList = function(errors) {
    mod_assertplus.arrayOfObject(errors, "errors");
    if (errors.length === 0) {
      return null;
    }
    errors.forEach(function(e) {
      mod_assertplus.ok(mod_isError(e));
    });
    if (errors.length == 1) {
      return errors[0];
    }
    return new MultiError(errors);
  };
  VError.errorForEach = function(err, func) {
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    mod_assertplus.func(func, "func");
    if (err instanceof MultiError) {
      err.errors().forEach(function iterError(e) {
        func(e);
      });
    } else {
      func(err);
    }
  };
  function SError() {
    var args, obj, parsed, options;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof SError)) {
      obj = Object.create(SError.prototype);
      SError.apply(obj, arguments);
      return obj;
    }
    parsed = parseConstructorArguments({
      argv: args,
      strict: true
    });
    options = parsed.options;
    VError.call(this, options, "%s", parsed.shortmessage);
    return this;
  }
  mod_util.inherits(SError, VError);
  function MultiError(errors) {
    mod_assertplus.array(errors, "list of errors");
    mod_assertplus.ok(errors.length > 0, "must be at least one error");
    this.ase_errors = errors;
    VError.call(this, {
      cause: errors[0]
    }, "first of %d error%s", errors.length, errors.length == 1 ? "" : "s");
  }
  mod_util.inherits(MultiError, VError);
  MultiError.prototype.name = "MultiError";
  MultiError.prototype.errors = function me_errors() {
    return this.ase_errors.slice(0);
  };
  function WError() {
    var args, obj, parsed, options;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof WError)) {
      obj = Object.create(WError.prototype);
      WError.apply(obj, args);
      return obj;
    }
    parsed = parseConstructorArguments({
      argv: args,
      strict: false
    });
    options = parsed.options;
    options["skipCauseMessage"] = true;
    VError.call(this, options, "%s", parsed.shortmessage);
    return this;
  }
  mod_util.inherits(WError, VError);
  WError.prototype.name = "WError";
  WError.prototype.toString = function we_toString() {
    var str = this.hasOwnProperty("name") && this.name || this.constructor.name || this.constructor.prototype.name;
    if (this.message)
      str += ": " + this.message;
    if (this.jse_cause && this.jse_cause.message)
      str += "; caused by " + this.jse_cause.toString();
    return str;
  };
  WError.prototype.cause = function we_cause(c) {
    if (mod_isError(c))
      this.jse_cause = c;
    return this.jse_cause;
  };
});

// node_modules/vasync/lib/vasync.js
var require_vasync = __commonJS(function(exports) {
  var mod_assert = __require("assert");
  var mod_events = __require("events");
  var mod_util = __require("util");
  var mod_verror = require_verror();
  exports.parallel = parallel;
  exports.forEachParallel = forEachParallel;
  exports.pipeline = pipeline;
  exports.tryEach = tryEach;
  exports.forEachPipeline = forEachPipeline;
  exports.filter = filter;
  exports.filterLimit = filterLimit;
  exports.filterSeries = filterSeries;
  exports.whilst = whilst;
  exports.queue = queue;
  exports.queuev = queuev;
  exports.barrier = barrier;
  exports.waterfall = waterfall;
  if (!global.setImmediate) {
    global.setImmediate = function(func) {
      var args = Array.prototype.slice.call(arguments, 1);
      args.unshift(0);
      args.unshift(func);
      setTimeout.apply(this, args);
    };
  }
  function isEmpty(obj) {
    var key;
    for (key in obj)
      return false;
    return true;
  }
  function parallel(args, callback) {
    var funcs, rv, doneOne, i;
    mod_assert.equal(typeof args, "object", '"args" must be an object');
    mod_assert.ok(Array.isArray(args["funcs"]), '"args.funcs" must be specified and must be an array');
    mod_assert.equal(typeof callback, "function", "callback argument must be specified and must be a function");
    funcs = args["funcs"].slice(0);
    rv = {
      operations: new Array(funcs.length),
      successes: [],
      ndone: 0,
      nerrors: 0
    };
    if (funcs.length === 0) {
      setImmediate(function() {
        callback(null, rv);
      });
      return rv;
    }
    doneOne = function(entry) {
      return function(err, result) {
        mod_assert.equal(entry["status"], "pending");
        entry["err"] = err;
        entry["result"] = result;
        entry["status"] = err ? "fail" : "ok";
        if (err)
          rv["nerrors"]++;
        else
          rv["successes"].push(result);
        if (++rv["ndone"] < funcs.length)
          return;
        var errors = rv["operations"].filter(function(ent) {
          return ent["status"] == "fail";
        }).map(function(ent) {
          return ent["err"];
        });
        if (errors.length > 0)
          callback(new mod_verror.MultiError(errors), rv);
        else
          callback(null, rv);
      };
    };
    for (i = 0;i < funcs.length; i++) {
      rv["operations"][i] = {
        func: funcs[i],
        funcname: funcs[i].name || "(anon)",
        status: "pending"
      };
      funcs[i](doneOne(rv["operations"][i]));
    }
    return rv;
  }
  function forEachParallel(args, callback) {
    var func, funcs;
    mod_assert.equal(typeof args, "object", '"args" must be an object');
    mod_assert.equal(typeof args["func"], "function", '"args.func" must be specified and must be a function');
    mod_assert.ok(Array.isArray(args["inputs"]), '"args.inputs" must be specified and must be an array');
    func = args["func"];
    funcs = args["inputs"].map(function(input) {
      return function(subcallback) {
        return func(input, subcallback);
      };
    });
    return parallel({ funcs }, callback);
  }
  function pipeline(args, callback) {
    mod_assert.equal(typeof args, "object", '"args" must be an object');
    mod_assert.ok(Array.isArray(args["funcs"]), '"args.funcs" must be specified and must be an array');
    var opts = {
      funcs: args["funcs"].slice(0),
      callback,
      args: { impl: "pipeline", uarg: args["arg"] },
      stop_when: "error",
      res_type: "rv"
    };
    return waterfall_impl(opts);
  }
  function tryEach(funcs, callback) {
    mod_assert.ok(Array.isArray(funcs), '"funcs" must be specified and must be an array');
    mod_assert.ok(arguments.length == 1 || typeof callback == "function", '"callback" must be a function');
    var opts = {
      funcs: funcs.slice(0),
      callback,
      args: { impl: "tryEach" },
      stop_when: "success",
      res_type: "array"
    };
    return waterfall_impl(opts);
  }
  function forEachPipeline(args, callback) {
    mod_assert.equal(typeof args, "object", '"args" must be an object');
    mod_assert.equal(typeof args["func"], "function", '"args.func" must be specified and must be a function');
    mod_assert.ok(Array.isArray(args["inputs"]), '"args.inputs" must be specified and must be an array');
    mod_assert.equal(typeof callback, "function", "callback argument must be specified and must be a function");
    var func = args["func"];
    var funcs = args["inputs"].map(function(input) {
      return function(_, subcallback) {
        return func(input, subcallback);
      };
    });
    return pipeline({ funcs }, callback);
  }
  function filter(inputs, filterFunc, callback) {
    return filterLimit(inputs, Infinity, filterFunc, callback);
  }
  function filterSeries(inputs, filterFunc, callback) {
    return filterLimit(inputs, 1, filterFunc, callback);
  }
  function filterLimit(inputs, limit, filterFunc, callback) {
    mod_assert.ok(Array.isArray(inputs), '"inputs" must be specified and must be an array');
    mod_assert.equal(typeof limit, "number", '"limit" must be a number');
    mod_assert.equal(isNaN(limit), false, '"limit" must be a number');
    mod_assert.equal(typeof filterFunc, "function", '"filterFunc" must be specified and must be a function');
    mod_assert.equal(typeof callback, "function", '"callback" argument must be specified as a function');
    var errors = [];
    var q = queue(processInput, limit);
    var results = [];
    function processInput(input, cb) {
      if (errors.length > 0) {
        cb();
        return;
      }
      filterFunc(input.elem, function inputFiltered(err, ans) {
        if (results.hasOwnProperty(input.idx)) {
          throw new mod_verror.VError("vasync.filter*: filterFunc idx %d " + "invoked its callback twice", input.idx);
        }
        results[input.idx] = {
          elem: input.elem,
          ans: !!ans
        };
        if (err) {
          errors.push(err);
          cb();
          return;
        }
        cb();
      });
    }
    q.once("end", function queueDrained() {
      if (errors.length > 0) {
        callback(mod_verror.errorFromList(errors));
        return;
      }
      results = results.filter(function filterFalseInputs(input) {
        return input.ans;
      }).map(function mapInputElements(input) {
        return input.elem;
      });
      callback(null, results);
    });
    inputs.forEach(function iterateInput(elem, idx) {
      q.push({
        elem,
        idx
      });
    });
    q.close();
    return q;
  }
  function whilst(testFunc, iterateFunc, callback) {
    mod_assert.equal(typeof testFunc, "function", '"testFunc" must be specified and must be a function');
    mod_assert.equal(typeof iterateFunc, "function", '"iterateFunc" must be specified and must be a function');
    mod_assert.equal(typeof callback, "function", '"callback" argument must be specified as a function');
    var o = {
      finished: false,
      iterations: 0
    };
    var args = [];
    function iterate() {
      var shouldContinue = testFunc();
      if (!shouldContinue) {
        done();
        return;
      }
      o.iterations++;
      iterateFunc(function whilstIteration(err) {
        args = Array.prototype.slice.call(arguments);
        if (err) {
          done();
          return;
        }
        setImmediate(iterate);
      });
    }
    function done() {
      mod_assert.ok(!o.finished, "whilst already finished");
      o.finished = true;
      callback.apply(this, args);
    }
    setImmediate(iterate);
    return o;
  }
  function queue(worker, concurrency) {
    return new WorkQueue({
      worker,
      concurrency
    });
  }
  function queuev(args) {
    return new WorkQueue(args);
  }
  function WorkQueue(args) {
    mod_assert.ok(args.hasOwnProperty("worker"));
    mod_assert.equal(typeof args["worker"], "function");
    mod_assert.ok(args.hasOwnProperty("concurrency"));
    mod_assert.equal(typeof args["concurrency"], "number");
    mod_assert.equal(Math.floor(args["concurrency"]), args["concurrency"]);
    mod_assert.ok(args["concurrency"] > 0);
    mod_events.EventEmitter.call(this);
    this.nextid = 0;
    this.worker = args["worker"];
    this.worker_name = args["worker"].name || "anon";
    this.npending = 0;
    this.pending = {};
    this.queued = [];
    this.closed = false;
    this.ended = false;
    this.concurrency = args["concurrency"];
    this.saturated = undefined;
    this.empty = undefined;
    this.drain = undefined;
  }
  mod_util.inherits(WorkQueue, mod_events.EventEmitter);
  WorkQueue.prototype.push = function(tasks, callback) {
    if (!Array.isArray(tasks))
      return this.pushOne(tasks, callback);
    var wq = this;
    return tasks.map(function(task) {
      return wq.pushOne(task, callback);
    });
  };
  WorkQueue.prototype.updateConcurrency = function(concurrency) {
    if (this.closed)
      throw new mod_verror.VError("update concurrency invoked after queue closed");
    this.concurrency = concurrency;
    this.dispatchNext();
  };
  WorkQueue.prototype.close = function() {
    var wq = this;
    if (wq.closed)
      return;
    wq.closed = true;
    if (wq.npending === 0 && wq.queued.length === 0) {
      setImmediate(function() {
        if (!wq.ended) {
          wq.ended = true;
          wq.emit("end");
        }
      });
    }
  };
  WorkQueue.prototype.pushOne = function(task, callback) {
    if (this.closed)
      throw new mod_verror.VError("push invoked after queue closed");
    var id = ++this.nextid;
    var entry = { id, task, callback };
    this.queued.push(entry);
    this.dispatchNext();
    return id;
  };
  WorkQueue.prototype.dispatchNext = function() {
    var wq = this;
    if (wq.npending === 0 && wq.queued.length === 0) {
      if (wq.drain)
        wq.drain();
      wq.emit("drain");
      if (wq.closed) {
        wq.ended = true;
        wq.emit("end");
      }
    } else if (wq.queued.length > 0) {
      while (wq.queued.length > 0 && wq.npending < wq.concurrency) {
        var next = wq.queued.shift();
        wq.dispatch(next);
        if (wq.queued.length === 0) {
          if (wq.empty)
            wq.empty();
          wq.emit("empty");
        }
      }
    }
  };
  WorkQueue.prototype.dispatch = function(entry) {
    var wq = this;
    mod_assert.ok(!this.pending.hasOwnProperty(entry["id"]));
    mod_assert.ok(this.npending < this.concurrency);
    mod_assert.ok(!this.ended);
    this.npending++;
    this.pending[entry["id"]] = entry;
    if (this.npending === this.concurrency) {
      if (this.saturated)
        this.saturated();
      this.emit("saturated");
    }
    setImmediate(function() {
      wq.worker(entry["task"], function(err) {
        --wq.npending;
        delete wq.pending[entry["id"]];
        if (entry["callback"])
          entry["callback"].apply(null, arguments);
        wq.dispatchNext();
      });
    });
  };
  WorkQueue.prototype.length = function() {
    return this.queued.length;
  };
  WorkQueue.prototype.kill = function() {
    this.killed = true;
    this.queued = [];
    this.drain = undefined;
    this.close();
  };
  function barrier(args) {
    return new Barrier(args);
  }
  function Barrier(args) {
    mod_assert.ok(!args || !args["nrecent"] || typeof args["nrecent"] == "number", '"nrecent" must have type "number"');
    mod_events.EventEmitter.call(this);
    var nrecent = args && args["nrecent"] ? args["nrecent"] : 10;
    if (nrecent > 0) {
      this.nrecent = nrecent;
      this.recent = [];
    }
    this.pending = {};
    this.scheduled = false;
  }
  mod_util.inherits(Barrier, mod_events.EventEmitter);
  Barrier.prototype.start = function(name) {
    mod_assert.ok(!this.pending.hasOwnProperty(name), 'operation "' + name + '" is already pending');
    this.pending[name] = Date.now();
  };
  Barrier.prototype.done = function(name) {
    mod_assert.ok(this.pending.hasOwnProperty(name), 'operation "' + name + '" is not pending');
    if (this.recent) {
      this.recent.push({
        name,
        start: this.pending[name],
        done: Date.now()
      });
      if (this.recent.length > this.nrecent)
        this.recent.shift();
    }
    delete this.pending[name];
    if (!isEmpty(this.pending) || this.scheduled)
      return;
    this.scheduled = true;
    var self = this;
    setImmediate(function() {
      self.scheduled = false;
      if (isEmpty(self.pending))
        self.emit("drain");
    });
  };
  function waterfall(funcs, callback) {
    mod_assert.ok(Array.isArray(funcs), '"funcs" must be specified and must be an array');
    mod_assert.ok(arguments.length == 1 || typeof callback == "function", '"callback" must be a function');
    var opts = {
      funcs: funcs.slice(0),
      callback,
      args: { impl: "waterfall" },
      stop_when: "error",
      res_type: "values"
    };
    return waterfall_impl(opts);
  }
  function waterfall_impl(opts) {
    mod_assert.ok(typeof opts === "object");
    var rv, current, next;
    var funcs = opts.funcs;
    var callback = opts.callback;
    mod_assert.ok(Array.isArray(funcs), '"opts.funcs" must be specified and must be an array');
    mod_assert.ok(arguments.length == 1, 'Function "waterfall_impl" must take only 1 arg');
    mod_assert.ok(opts.res_type === "values" || opts.res_type === "array" || opts.res_type == "rv", '"opts.res_type" must either be "values", "array", or "rv"');
    mod_assert.ok(opts.stop_when === "error" || opts.stop_when === "success", '"opts.stop_when" must either be "error" or "success"');
    mod_assert.ok(opts.args.impl === "pipeline" || opts.args.impl === "waterfall" || opts.args.impl === "tryEach", '"opts.args.impl" must be "pipeline", "waterfall", or "tryEach"');
    if (opts.args.impl === "pipeline") {
      mod_assert.ok(typeof opts.args.uarg !== undefined, '"opts.args.uarg" should be defined when pipeline is used');
    }
    rv = {
      operations: funcs.map(function(func) {
        return {
          func,
          funcname: func.name || "(anon)",
          status: "waiting"
        };
      }),
      successes: [],
      ndone: 0,
      nerrors: 0
    };
    if (funcs.length === 0) {
      if (callback)
        setImmediate(function() {
          var res = opts.args.impl === "pipeline" ? rv : undefined;
          callback(null, res);
        });
      return rv;
    }
    next = function(idx, err) {
      var res_key, nfunc_args, entry, nextentry;
      if (err === undefined)
        err = null;
      if (idx != current) {
        throw new mod_verror.VError('vasync.waterfall: function %d ("%s") invoked ' + "its callback twice", idx, rv["operations"][idx].funcname);
      }
      mod_assert.equal(idx, rv["ndone"], "idx should be equal to ndone");
      entry = rv["operations"][rv["ndone"]++];
      if (opts.args.impl === "tryEach" || opts.args.impl === "waterfall") {
        nfunc_args = Array.prototype.slice.call(arguments, 2);
        res_key = "results";
        entry["results"] = nfunc_args;
      } else if (opts.args.impl === "pipeline") {
        nfunc_args = [opts.args.uarg];
        res_key = "result";
        entry["result"] = arguments[2];
      }
      mod_assert.equal(entry["status"], "pending", "status should be pending");
      entry["status"] = err ? "fail" : "ok";
      entry["err"] = err;
      if (err) {
        rv["nerrors"]++;
      } else {
        rv["successes"].push(entry[res_key]);
      }
      if (opts.stop_when === "error" && err || opts.stop_when === "success" && rv["successes"].length > 0 || rv["ndone"] == funcs.length) {
        if (callback) {
          if (opts.res_type === "values" || opts.res_type === "array" && nfunc_args.length <= 1) {
            nfunc_args.unshift(err);
            callback.apply(null, nfunc_args);
          } else if (opts.res_type === "array") {
            callback(err, nfunc_args);
          } else if (opts.res_type === "rv") {
            callback(err, rv);
          }
        }
      } else {
        nextentry = rv["operations"][rv["ndone"]];
        nextentry["status"] = "pending";
        current++;
        nfunc_args.push(next.bind(null, current));
        setImmediate(function() {
          var nfunc = nextentry["func"];
          if (opts.args.impl !== "tryEach") {
            nfunc.apply(null, nfunc_args);
          } else {
            nfunc(next.bind(null, current));
          }
        });
      }
    };
    rv["operations"][0]["status"] = "pending";
    current = 0;
    if (opts.args.impl !== "pipeline") {
      funcs[0](next.bind(null, current));
    } else {
      funcs[0](opts.args.uarg, next.bind(null, current));
    }
    return rv;
  }
});

// node_modules/verror/lib/verror.js
var require_verror2 = __commonJS(function(exports, module) {
  var mod_assertplus = require_assert();
  var mod_util = __require("util");
  var mod_extsprintf = require_extsprintf();
  var mod_isError = require_util().isError;
  var sprintf = mod_extsprintf.sprintf;
  module.exports = VError;
  VError.VError = VError;
  VError.SError = SError;
  VError.WError = WError;
  VError.MultiError = MultiError;
  function parseConstructorArguments(args) {
    var argv, options, sprintf_args, shortmessage, k;
    mod_assertplus.object(args, "args");
    mod_assertplus.bool(args.strict, "args.strict");
    mod_assertplus.array(args.argv, "args.argv");
    argv = args.argv;
    if (argv.length === 0) {
      options = {};
      sprintf_args = [];
    } else if (mod_isError(argv[0])) {
      options = { cause: argv[0] };
      sprintf_args = argv.slice(1);
    } else if (typeof argv[0] === "object") {
      options = {};
      for (k in argv[0]) {
        options[k] = argv[0][k];
      }
      sprintf_args = argv.slice(1);
    } else {
      mod_assertplus.string(argv[0], "first argument to VError, SError, or WError " + "constructor must be a string, object, or Error");
      options = {};
      sprintf_args = argv;
    }
    mod_assertplus.object(options);
    if (!options.strict && !args.strict) {
      sprintf_args = sprintf_args.map(function(a) {
        return a === null ? "null" : a === undefined ? "undefined" : a;
      });
    }
    if (sprintf_args.length === 0) {
      shortmessage = "";
    } else {
      shortmessage = sprintf.apply(null, sprintf_args);
    }
    return {
      options,
      shortmessage
    };
  }
  function VError() {
    var args, obj, parsed, cause, ctor, message, k;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof VError)) {
      obj = Object.create(VError.prototype);
      VError.apply(obj, arguments);
      return obj;
    }
    parsed = parseConstructorArguments({
      argv: args,
      strict: false
    });
    if (parsed.options.name) {
      mod_assertplus.string(parsed.options.name, `error's "name" must be a string`);
      this.name = parsed.options.name;
    }
    this.jse_shortmsg = parsed.shortmessage;
    message = parsed.shortmessage;
    cause = parsed.options.cause;
    if (cause) {
      mod_assertplus.ok(mod_isError(cause), "cause is not an Error");
      this.jse_cause = cause;
      if (!parsed.options.skipCauseMessage) {
        message += ": " + cause.message;
      }
    }
    this.jse_info = {};
    if (parsed.options.info) {
      for (k in parsed.options.info) {
        this.jse_info[k] = parsed.options.info[k];
      }
    }
    this.message = message;
    Error.call(this, message);
    if (Error.captureStackTrace) {
      ctor = parsed.options.constructorOpt || this.constructor;
      Error.captureStackTrace(this, ctor);
    }
    return this;
  }
  mod_util.inherits(VError, Error);
  VError.prototype.name = "VError";
  VError.prototype.toString = function ve_toString() {
    var str = this.hasOwnProperty("name") && this.name || this.constructor.name || this.constructor.prototype.name;
    if (this.message)
      str += ": " + this.message;
    return str;
  };
  VError.prototype.cause = function ve_cause() {
    var cause = VError.cause(this);
    return cause === null ? undefined : cause;
  };
  VError.cause = function(err) {
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    return mod_isError(err.jse_cause) ? err.jse_cause : null;
  };
  VError.info = function(err) {
    var rv, cause, k;
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    cause = VError.cause(err);
    if (cause !== null) {
      rv = VError.info(cause);
    } else {
      rv = {};
    }
    if (typeof err.jse_info == "object" && err.jse_info !== null) {
      for (k in err.jse_info) {
        rv[k] = err.jse_info[k];
      }
    }
    return rv;
  };
  VError.findCauseByName = function(err, name) {
    var cause;
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    mod_assertplus.string(name, "name");
    mod_assertplus.ok(name.length > 0, "name cannot be empty");
    for (cause = err;cause !== null; cause = VError.cause(cause)) {
      mod_assertplus.ok(mod_isError(cause));
      if (cause.name == name) {
        return cause;
      }
    }
    return null;
  };
  VError.hasCauseWithName = function(err, name) {
    return VError.findCauseByName(err, name) !== null;
  };
  VError.fullStack = function(err) {
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    var cause = VError.cause(err);
    if (cause) {
      return err.stack + `
caused by: ` + VError.fullStack(cause);
    }
    return err.stack;
  };
  VError.errorFromList = function(errors) {
    mod_assertplus.arrayOfObject(errors, "errors");
    if (errors.length === 0) {
      return null;
    }
    errors.forEach(function(e) {
      mod_assertplus.ok(mod_isError(e));
    });
    if (errors.length == 1) {
      return errors[0];
    }
    return new MultiError(errors);
  };
  VError.errorForEach = function(err, func) {
    mod_assertplus.ok(mod_isError(err), "err must be an Error");
    mod_assertplus.func(func, "func");
    if (err instanceof MultiError) {
      err.errors().forEach(function iterError(e) {
        func(e);
      });
    } else {
      func(err);
    }
  };
  function SError() {
    var args, obj, parsed, options;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof SError)) {
      obj = Object.create(SError.prototype);
      SError.apply(obj, arguments);
      return obj;
    }
    parsed = parseConstructorArguments({
      argv: args,
      strict: true
    });
    options = parsed.options;
    VError.call(this, options, "%s", parsed.shortmessage);
    return this;
  }
  mod_util.inherits(SError, VError);
  function MultiError(errors) {
    mod_assertplus.array(errors, "list of errors");
    mod_assertplus.ok(errors.length > 0, "must be at least one error");
    this.ase_errors = errors;
    VError.call(this, {
      cause: errors[0]
    }, "first of %d error%s", errors.length, errors.length == 1 ? "" : "s");
  }
  mod_util.inherits(MultiError, VError);
  MultiError.prototype.name = "MultiError";
  MultiError.prototype.errors = function me_errors() {
    return this.ase_errors.slice(0);
  };
  function WError() {
    var args, obj, parsed, options;
    args = Array.prototype.slice.call(arguments, 0);
    if (!(this instanceof WError)) {
      obj = Object.create(WError.prototype);
      WError.apply(obj, args);
      return obj;
    }
    parsed = parseConstructorArguments({
      argv: args,
      strict: false
    });
    options = parsed.options;
    options["skipCauseMessage"] = true;
    VError.call(this, options, "%s", parsed.shortmessage);
    return this;
  }
  mod_util.inherits(WError, VError);
  WError.prototype.name = "WError";
  WError.prototype.toString = function we_toString() {
    var str = this.hasOwnProperty("name") && this.name || this.constructor.name || this.constructor.prototype.name;
    if (this.message)
      str += ": " + this.message;
    if (this.jse_cause && this.jse_cause.message)
      str += "; caused by " + this.jse_cause.toString();
    return str;
  };
  WError.prototype.cause = function we_cause(c) {
    if (mod_isError(c))
      this.jse_cause = c;
    return this.jse_cause;
  };
});

// node_modules/ldapjs/lib/controls/index.js
var require_controls2 = __commonJS(function(exports, module) {
  var controls = require_controls();
  module.exports = controls;
});

// node_modules/ldapjs/lib/corked_emitter.js
var require_corked_emitter = __commonJS(function(exports, module) {
  var EventEmitter = __require("events").EventEmitter;
  function CorkedEmitter() {
    const self = this;
    EventEmitter.call(self);
    self._outstandingEmits = [];
    self._opened = false;
    self.once("newListener", function() {
      setImmediate(function releaseStoredEvents() {
        self._opened = true;
        self._outstandingEmits.forEach(function(args) {
          self.emit.apply(self, args);
        });
      });
    });
  }
  CorkedEmitter.prototype = Object.create(EventEmitter.prototype);
  CorkedEmitter.prototype.emit = function emit(eventName) {
    if (this._opened || eventName === "newListener") {
      EventEmitter.prototype.emit.apply(this, arguments);
    } else {
      this._outstandingEmits.push(arguments);
    }
  };
  module.exports = CorkedEmitter;
});

// node_modules/ldapjs/lib/client/search_pager.js
var require_search_pager = __commonJS(function(exports, module) {
  var EventEmitter = __require("events").EventEmitter;
  var util = __require("util");
  var assert = require_assert();
  var { PagedResultsControl } = require_controls();
  var CorkedEmitter = require_corked_emitter();
  function SearchPager(opts) {
    assert.object(opts);
    assert.func(opts.callback);
    assert.number(opts.pageSize);
    assert.func(opts.sendRequest);
    CorkedEmitter.call(this, {});
    this.callback = opts.callback;
    this.controls = opts.controls;
    this.pageSize = opts.pageSize;
    this.pagePause = opts.pagePause;
    this.sendRequest = opts.sendRequest;
    this.controls.forEach(function(control) {
      if (control.type === PagedResultsControl.OID) {
        throw new Error("redundant pagedResultControl");
      }
    });
    this.finished = false;
    this.started = false;
    const emitter = new EventEmitter;
    emitter.on("searchRequest", this.emit.bind(this, "searchRequest"));
    emitter.on("searchEntry", this.emit.bind(this, "searchEntry"));
    emitter.on("end", this._onEnd.bind(this));
    emitter.on("error", this._onError.bind(this));
    this.childEmitter = emitter;
  }
  util.inherits(SearchPager, CorkedEmitter);
  module.exports = SearchPager;
  SearchPager.prototype.begin = function begin() {
    this._nextPage(null);
  };
  SearchPager.prototype._onEnd = function _onEnd(res) {
    const self = this;
    let cookie = null;
    res.controls.forEach(function(control) {
      if (control.type === PagedResultsControl.OID) {
        cookie = control.value.cookie;
      }
    });
    const nullCb = function() {};
    if (cookie === null) {
      this.finished = true;
      this.emit("page", res, nullCb);
      const err = new Error("missing paged control");
      err.name = "PagedError";
      if (this.listeners("pageError").length > 0) {
        this.emit("pageError", err);
        this.emit("end", res);
      } else {
        this.emit("error", err);
      }
      return;
    }
    if (cookie.length === 0) {
      this.finished = true;
      this.emit("page", nullCb);
      this.emit("end", res);
    } else {
      if (this.pagePause) {
        this.emit("page", res, function(err) {
          if (!err) {
            self._nextPage(cookie);
          } else {
            self.emit("end", res);
          }
        });
      } else {
        this.emit("page", res, nullCb);
        this._nextPage(cookie);
      }
    }
  };
  SearchPager.prototype._onError = function _onError(err) {
    this.finished = true;
    this.emit("error", err);
  };
  SearchPager.prototype._nextPage = function _nextPage(cookie) {
    const controls = this.controls.slice(0);
    controls.push(new PagedResultsControl({
      value: {
        size: this.pageSize,
        cookie
      }
    }));
    this.sendRequest(controls, this.childEmitter, this._sendCallback.bind(this));
  };
  SearchPager.prototype._sendCallback = function _sendCallback(err) {
    if (err) {
      this.finished = true;
      if (!this.started) {
        this.callback(err, null);
      } else {
        this.emit("error", err);
      }
    } else {
      if (!this.started) {
        this.started = true;
        this.callback(null, this);
      }
    }
  };
});

// node_modules/ldapjs/lib/url.js
var require_url = __commonJS(function(exports, module) {
  var querystring = __require("querystring");
  var url = __require("url");
  var { DN } = require_dn2();
  var filter = require_lib2();
  module.exports = {
    parse: function(urlStr, parseDN) {
      let parsedURL;
      try {
        parsedURL = new url.URL(urlStr);
      } catch (error) {
        throw new TypeError(urlStr + " is an invalid LDAP url (scope)");
      }
      if (!parsedURL.protocol || !(parsedURL.protocol === "ldap:" || parsedURL.protocol === "ldaps:")) {
        throw new TypeError(urlStr + " is an invalid LDAP url (protocol)");
      }
      const u = {
        protocol: parsedURL.protocol,
        hostname: parsedURL.hostname,
        port: parsedURL.port,
        pathname: parsedURL.pathname,
        search: parsedURL.search,
        href: parsedURL.href
      };
      u.secure = u.protocol === "ldaps:";
      if (!u.hostname) {
        u.hostname = "localhost";
      }
      if (!u.port) {
        u.port = u.secure ? 636 : 389;
      } else {
        u.port = parseInt(u.port, 10);
      }
      if (u.pathname) {
        u.pathname = querystring.unescape(u.pathname.substr(1));
        u.DN = parseDN ? DN.fromString(u.pathname) : u.pathname;
      }
      if (u.search) {
        u.attributes = [];
        const tmp = u.search.substr(1).split("?");
        if (tmp && tmp.length) {
          if (tmp[0]) {
            tmp[0].split(",").forEach(function(a) {
              u.attributes.push(querystring.unescape(a.trim()));
            });
          }
        }
        if (tmp[1]) {
          if (tmp[1] !== "base" && tmp[1] !== "one" && tmp[1] !== "sub") {
            throw new TypeError(urlStr + " is an invalid LDAP url (scope)");
          }
          u.scope = tmp[1];
        }
        if (tmp[2]) {
          u.filter = querystring.unescape(tmp[2]);
        }
        if (tmp[3]) {
          u.extensions = querystring.unescape(tmp[3]);
        }
        if (!u.scope) {
          u.scope = "base";
        }
        if (!u.filter) {
          u.filter = filter.parseString("(objectclass=*)");
        } else {
          u.filter = filter.parseString(u.filter);
        }
      }
      return u;
    }
  };
});

// node_modules/ldapjs/lib/client/client.js
var require_client = __commonJS(function(exports, module) {
  var requestQueueFactory = require_request_queue();
  var messageTrackerFactory = require_message_tracker();
  var { MAX_MSGID } = require_constants();
  var EventEmitter = __require("events").EventEmitter;
  var net = __require("net");
  var tls = __require("tls");
  var util = __require("util");
  var once = require_once();
  var backoff = require_backoff2();
  var vasync = require_vasync();
  var assert = require_assert();
  var VError = require_verror2().VError;
  var Attribute = require_attribute();
  var Change = require_change();
  var Control = require_controls2().Control;
  var { Control: LdapControl } = require_controls();
  var SearchPager = require_search_pager();
  var Protocol = require_protocol();
  var { DN } = require_dn2();
  var errors = require_errors2();
  var filters = require_lib2();
  var Parser = require_parser();
  var url = require_url();
  var CorkedEmitter = require_corked_emitter();
  var messages = require_messages();
  var {
    AbandonRequest,
    AddRequest,
    BindRequest,
    CompareRequest,
    DeleteRequest,
    ExtensionRequest: ExtendedRequest,
    ModifyRequest,
    ModifyDnRequest: ModifyDNRequest,
    SearchRequest,
    UnbindRequest,
    LdapResult: LDAPResult,
    SearchResultEntry: SearchEntry,
    SearchResultReference: SearchReference
  } = messages;
  var PresenceFilter = filters.PresenceFilter;
  var ConnectionError = errors.ConnectionError;
  var CMP_EXPECT = [errors.LDAP_COMPARE_TRUE, errors.LDAP_COMPARE_FALSE];
  var CLIENT_ID = 0;
  function nextClientId() {
    if (++CLIENT_ID === MAX_MSGID) {
      return 1;
    }
    return CLIENT_ID;
  }
  function validateControls(controls) {
    if (Array.isArray(controls)) {
      controls.forEach(function(c) {
        if (!(c instanceof Control) && !(c instanceof LdapControl)) {
          throw new TypeError("controls must be [Control]");
        }
      });
    } else if (controls instanceof Control || controls instanceof LdapControl) {
      controls = [controls];
    } else {
      throw new TypeError("controls must be [Control]");
    }
    return controls;
  }
  function ensureDN(input) {
    if (DN.isDn(input)) {
      return input;
    } else if (typeof input === "string") {
      return DN.fromString(input);
    } else {
      throw new Error("invalid DN");
    }
  }
  function Client(options) {
    assert.ok(options);
    EventEmitter.call(this, options);
    const self = this;
    this.urls = options.url ? [].concat(options.url).map(url.parse) : [];
    this._nextServer = 0;
    this.host = undefined;
    this.port = undefined;
    this.secure = undefined;
    this.url = undefined;
    this.tlsOptions = options.tlsOptions;
    this.socketPath = options.socketPath || false;
    this.log = options.log.child({ clazz: "Client" }, true);
    this.timeout = parseInt(options.timeout || 0, 10);
    this.connectTimeout = parseInt(options.connectTimeout || 0, 10);
    this.idleTimeout = parseInt(options.idleTimeout || 0, 10);
    if (options.reconnect) {
      const rOpts = typeof options.reconnect === "object" ? options.reconnect : {};
      this.reconnect = {
        initialDelay: parseInt(rOpts.initialDelay || 100, 10),
        maxDelay: parseInt(rOpts.maxDelay || 1e4, 10),
        failAfter: parseInt(rOpts.failAfter, 10) || Infinity
      };
    }
    this.queue = requestQueueFactory({
      size: parseInt(options.queueSize || 0, 10),
      timeout: parseInt(options.queueTimeout || 0, 10)
    });
    if (options.queueDisable) {
      this.queue.freeze();
    }
    if (options.bindDN !== undefined && options.bindCredentials !== undefined) {
      this.on("setup", function(clt, cb) {
        clt.bind(options.bindDN, options.bindCredentials, function(err) {
          if (err) {
            if (self._socket) {
              self._socket.destroy();
            }
            self.emit("error", err);
          }
          cb(err);
        });
      });
    }
    this._socket = null;
    this.connected = false;
    this.connect();
  }
  util.inherits(Client, EventEmitter);
  module.exports = Client;
  Client.prototype.abandon = function abandon(messageId, controls, callback) {
    assert.number(messageId, "messageId");
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    const req = new AbandonRequest({
      abandonId: messageId,
      controls
    });
    return this._send(req, "abandon", null, callback);
  };
  Client.prototype.add = function add(name, entry, controls, callback) {
    assert.ok(name !== undefined, "name");
    assert.object(entry, "entry");
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    if (Array.isArray(entry)) {
      entry.forEach(function(a) {
        if (!Attribute.isAttribute(a)) {
          throw new TypeError("entry must be an Array of Attributes");
        }
      });
    } else {
      const save = entry;
      entry = [];
      Object.keys(save).forEach(function(k) {
        const attr = new Attribute({ type: k });
        if (Array.isArray(save[k])) {
          save[k].forEach(function(v) {
            attr.addValue(v.toString());
          });
        } else if (Buffer.isBuffer(save[k])) {
          attr.addValue(save[k]);
        } else {
          attr.addValue(save[k].toString());
        }
        entry.push(attr);
      });
    }
    const req = new AddRequest({
      entry: ensureDN(name),
      attributes: entry,
      controls
    });
    return this._send(req, [errors.LDAP_SUCCESS], null, callback);
  };
  Client.prototype.bind = function bind(name, credentials, controls, callback, _bypass) {
    if (typeof name !== "string" && Object.prototype.toString.call(name) !== "[object LdapDn]") {
      throw new TypeError("name (string) required");
    }
    assert.optionalString(credentials, "credentials");
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    const req = new BindRequest({
      name: name || "",
      authentication: "Simple",
      credentials: credentials || "",
      controls
    });
    const self = this;
    function callbackWrapper(err, ret) {
      self.removeListener("connectError", callbackWrapper);
      callback(err, ret);
    }
    this.addListener("connectError", callbackWrapper);
    return this._send(req, [errors.LDAP_SUCCESS], null, callbackWrapper, _bypass);
  };
  Client.prototype.compare = function compare(name, attr, value, controls, callback) {
    assert.ok(name !== undefined, "name");
    assert.string(attr, "attr");
    assert.string(value, "value");
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    const req = new CompareRequest({
      entry: ensureDN(name),
      attribute: attr,
      value,
      controls
    });
    return this._send(req, CMP_EXPECT, null, function(err, res) {
      if (err) {
        return callback(err);
      }
      return callback(null, res.status === errors.LDAP_COMPARE_TRUE, res);
    });
  };
  Client.prototype.del = function del(name, controls, callback) {
    assert.ok(name !== undefined, "name");
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    const req = new DeleteRequest({
      entry: ensureDN(name),
      controls
    });
    return this._send(req, [errors.LDAP_SUCCESS], null, callback);
  };
  Client.prototype.exop = function exop(name, value, controls, callback) {
    assert.string(name, "name");
    if (typeof value === "function") {
      callback = value;
      controls = [];
      value = undefined;
    }
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    const req = new ExtendedRequest({
      requestName: name,
      requestValue: value,
      controls
    });
    return this._send(req, [errors.LDAP_SUCCESS], null, function(err, res) {
      if (err) {
        return callback(err);
      }
      return callback(null, res.responseValue || "", res);
    });
  };
  Client.prototype.modify = function modify(name, change, controls, callback) {
    assert.ok(name !== undefined, "name");
    assert.object(change, "change");
    const changes = [];
    function changeFromObject(obj) {
      if (!obj.operation && !obj.type) {
        throw new Error("change.operation required");
      }
      if (typeof obj.modification !== "object") {
        throw new Error("change.modification (object) required");
      }
      if (Object.keys(obj.modification).length === 2 && typeof obj.modification.type === "string" && Array.isArray(obj.modification.vals)) {
        changes.push(new Change({
          operation: obj.operation || obj.type,
          modification: obj.modification
        }));
      } else {
        Object.keys(obj.modification).forEach(function(k) {
          const mod = {};
          mod[k] = obj.modification[k];
          changes.push(new Change({
            operation: obj.operation || obj.type,
            modification: mod
          }));
        });
      }
    }
    if (Change.isChange(change)) {
      changes.push(change);
    } else if (Array.isArray(change)) {
      change.forEach(function(c) {
        if (Change.isChange(c)) {
          changes.push(c);
        } else {
          changeFromObject(c);
        }
      });
    } else {
      changeFromObject(change);
    }
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    const req = new ModifyRequest({
      object: ensureDN(name),
      changes,
      controls
    });
    return this._send(req, [errors.LDAP_SUCCESS], null, callback);
  };
  Client.prototype.modifyDN = function modifyDN(name, newName, controls, callback) {
    assert.ok(name !== undefined, "name");
    assert.string(newName, "newName");
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback);
    const newDN = DN.fromString(newName);
    const req = new ModifyDNRequest({
      entry: DN.fromString(name),
      deleteOldRdn: true,
      controls
    });
    if (newDN.length !== 1) {
      req.newRdn = DN.fromString(newDN.shift().toString());
      req.newSuperior = newDN;
    } else {
      req.newRdn = newDN;
    }
    return this._send(req, [errors.LDAP_SUCCESS], null, callback);
  };
  Client.prototype.search = function search2(base, options, controls, callback, _bypass) {
    assert.ok(base !== undefined, "search base");
    if (Array.isArray(options) || options instanceof Control) {
      controls = options;
      options = {};
    } else if (typeof options === "function") {
      callback = options;
      controls = [];
      options = {
        filter: new PresenceFilter({ attribute: "objectclass" })
      };
    } else if (typeof options === "string") {
      options = { filter: filters.parseString(options) };
    } else if (typeof options !== "object") {
      throw new TypeError("options (object) required");
    }
    if (typeof options.filter === "string") {
      options.filter = filters.parseString(options.filter);
    } else if (!options.filter) {
      options.filter = new PresenceFilter({ attribute: "objectclass" });
    } else if (Object.prototype.toString.call(options.filter) !== "[object FilterString]") {
      throw new TypeError("options.filter (Filter) required");
    }
    if (typeof controls === "function") {
      callback = controls;
      controls = [];
    } else {
      controls = validateControls(controls);
    }
    assert.func(callback, "callback");
    if (options.attributes) {
      if (!Array.isArray(options.attributes)) {
        if (typeof options.attributes === "string") {
          options.attributes = [options.attributes];
        } else {
          throw new TypeError("options.attributes must be an Array of Strings");
        }
      }
    }
    const self = this;
    const baseDN = ensureDN(base);
    function sendRequest(ctrls, emitter, cb) {
      const req = new SearchRequest({
        baseObject: baseDN,
        scope: options.scope || "base",
        filter: options.filter,
        derefAliases: options.derefAliases || Protocol.search.NEVER_DEREF_ALIASES,
        sizeLimit: options.sizeLimit || 0,
        timeLimit: options.timeLimit || 10,
        typesOnly: options.typesOnly || false,
        attributes: options.attributes || [],
        controls: ctrls
      });
      return self._send(req, [errors.LDAP_SUCCESS], emitter, cb, _bypass);
    }
    if (options.paged) {
      const pageOpts = typeof options.paged === "object" ? options.paged : {};
      let size = 100;
      if (pageOpts.pageSize > 0) {
        size = pageOpts.pageSize;
      } else if (options.sizeLimit > 1) {
        size = options.sizeLimit - 1;
      }
      const pager = new SearchPager({
        callback,
        controls,
        pageSize: size,
        pagePause: pageOpts.pagePause,
        sendRequest
      });
      pager.begin();
    } else {
      sendRequest(controls, new CorkedEmitter, callback);
    }
  };
  Client.prototype.unbind = function unbind(callback) {
    if (!callback) {
      callback = function() {};
    }
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    this.unbound = true;
    if (!this._socket) {
      return callback();
    }
    const req = new UnbindRequest;
    return this._send(req, "unbind", null, callback);
  };
  Client.prototype.starttls = function starttls(options, controls, callback, _bypass) {
    assert.optionalObject(options);
    options = options || {};
    callback = once(callback);
    const self = this;
    if (this._starttls) {
      return callback(new Error("STARTTLS already in progress or active"));
    }
    function onSend(sendErr, emitter) {
      if (sendErr) {
        callback(sendErr);
        return;
      }
      self._starttls = {
        started: true
      };
      emitter.on("error", function(err) {
        self._starttls = null;
        callback(err);
      });
      emitter.on("end", function(_res) {
        const sock = self._socket;
        sock.removeAllListeners("data");
        options.socket = sock;
        const secure = tls.connect(options);
        secure.once("secureConnect", function() {
          secure.removeAllListeners("error");
          secure.on("data", function onData(data) {
            self.log.trace("data event: %s", util.inspect(data));
            self._tracker.parser.write(data);
          });
          secure.on("error", function(err) {
            self.log.trace({ err }, "error event: %s", new Error().stack);
            self.emit("error", err);
            sock.destroy();
          });
          callback(null);
        });
        secure.once("error", function(err) {
          self._starttls = null;
          secure.removeAllListeners();
          callback(err);
        });
        self._starttls.success = true;
        self._socket = secure;
      });
    }
    const req = new ExtendedRequest({
      requestName: "1.3.6.1.4.1.1466.20037",
      requestValue: null,
      controls
    });
    return this._send(req, [errors.LDAP_SUCCESS], new EventEmitter, onSend, _bypass);
  };
  Client.prototype.destroy = function destroy(err) {
    this.destroyed = true;
    this.queue.freeze();
    this.queue.flush(function(msg, expect, emitter, cb) {
      if (typeof cb === "function") {
        cb(new Error("client destroyed"));
      }
    });
    if (this.connected) {
      this.unbind();
    }
    if (this._socket) {
      this._socket.destroy();
    }
    this.emit("destroy", err);
  };
  Client.prototype.connect = function connect3() {
    if (this.connecting || this.connected) {
      return;
    }
    const self = this;
    const log = this.log;
    let socket;
    let tracker;
    function connectSocket(cb) {
      const server = self.urls[self._nextServer];
      self._nextServer = (self._nextServer + 1) % self.urls.length;
      cb = once(cb);
      function onResult(err, res) {
        if (err) {
          if (self.connectTimer) {
            clearTimeout(self.connectTimer);
            self.connectTimer = null;
          }
          self.emit("connectError", err);
        }
        cb(err, res);
      }
      function onConnect() {
        if (self.connectTimer) {
          clearTimeout(self.connectTimer);
          self.connectTimer = null;
        }
        socket.removeAllListeners("error").removeAllListeners("connect").removeAllListeners("secureConnect");
        tracker.id = nextClientId() + "__" + tracker.id;
        self.log = self.log.child({ ldap_id: tracker.id }, true);
        setupClient(cb);
      }
      const port = server && server.port || self.socketPath;
      const host = server && server.hostname;
      if (server && server.secure) {
        socket = tls.connect(port, host, self.tlsOptions);
        socket.once("secureConnect", onConnect);
      } else {
        socket = net.connect(port, host);
        socket.once("connect", onConnect);
      }
      socket.once("error", onResult);
      initSocket(server);
      if (self.connectTimeout) {
        self.connectTimer = setTimeout(function onConnectTimeout() {
          if (!socket || !socket.readable || !socket.writeable) {
            socket.destroy();
            self._socket = null;
            onResult(new ConnectionError("connection timeout"));
          }
        }, self.connectTimeout);
      }
    }
    function initSocket(server) {
      tracker = messageTrackerFactory({
        id: server ? server.href : self.socketPath,
        parser: new Parser({ log })
      });
      if (typeof socket.setKeepAlive !== "function") {
        socket.setKeepAlive = function setKeepAlive(enable, delay) {
          return socket.socket ? socket.socket.setKeepAlive(enable, delay) : false;
        };
      }
      socket.on("data", function onData(data) {
        log.trace("data event: %s", util.inspect(data));
        tracker.parser.write(data);
      });
      tracker.parser.on("message", function onMessage(message) {
        message.connection = self._socket;
        const trackedObject = tracker.fetch(message.messageId);
        if (!trackedObject) {
          log.error({ message: message.pojo }, "unmatched server message received");
          return false;
        }
        const { message: trackedMessage, callback } = trackedObject;
        if (!callback) {
          log.error({ message: message.pojo }, "unsolicited message");
          return false;
        }
        switch (trackedMessage.type) {
          case "ExtensionRequest": {
            const extensionType = ExtendedRequest.recognizedOIDs().lookupName(trackedMessage.requestName);
            switch (extensionType) {
              case "PASSWORD_MODIFY": {
                message = messages.PasswordModifyResponse.fromResponse(message);
                break;
              }
              case "WHO_AM_I": {
                message = messages.WhoAmIResponse.fromResponse(message);
                break;
              }
              default:
            }
            break;
          }
          default:
        }
        return callback(message);
      });
      tracker.parser.on("error", function onParseError(err) {
        self.emit("error", new VError(err, "Parser error for %s", tracker.id));
        self.connected = false;
        socket.end();
      });
    }
    function setupClient(cb) {
      cb = once(cb);
      function bail(err) {
        socket.destroy();
        cb(err || new Error("client error during setup"));
      }
      (socket.socket ? socket.socket : socket).once("close", bail);
      socket.once("error", bail);
      socket.once("end", bail);
      socket.once("timeout", bail);
      socket.once("cleanupSetupListeners", function onCleanup() {
        socket.removeListener("error", bail).removeListener("close", bail).removeListener("end", bail).removeListener("timeout", bail);
      });
      self._socket = socket;
      self._tracker = tracker;
      const basicClient = {
        bind: function bindBypass(name, credentials, controls, callback) {
          return self.bind(name, credentials, controls, callback, true);
        },
        search: function searchBypass(base, options, controls, callback) {
          return self.search(base, options, controls, callback, true);
        },
        starttls: function starttlsBypass(options, controls, callback) {
          return self.starttls(options, controls, callback, true);
        },
        unbind: self.unbind.bind(self)
      };
      vasync.forEachPipeline({
        func: function(f, callback) {
          f(basicClient, callback);
        },
        inputs: self.listeners("setup")
      }, function(err, _res) {
        if (err) {
          self.emit("setupError", err);
        }
        cb(err);
      });
    }
    function postSetup() {
      socket.emit("cleanupSetupListeners");
      (socket.socket ? socket.socket : socket).once("close", self._onClose.bind(self));
      socket.on("end", function onEnd() {
        log.trace("end event");
        self.emit("end");
        socket.end();
      });
      socket.on("error", function onSocketError(err) {
        log.trace({ err }, "error event: %s", new Error().stack);
        self.emit("error", err);
        socket.destroy();
      });
      socket.on("timeout", function onTimeout() {
        log.trace("timeout event");
        self.emit("socketTimeout");
        socket.end();
      });
      const server = self.urls[self._nextServer];
      if (server) {
        self.host = server.hostname;
        self.port = server.port;
        self.secure = server.secure;
      }
    }
    let retry;
    let failAfter;
    if (this.reconnect) {
      retry = backoff.exponential({
        initialDelay: this.reconnect.initialDelay,
        maxDelay: this.reconnect.maxDelay
      });
      failAfter = this.reconnect.failAfter;
      if (this.urls.length > 1 && failAfter) {
        failAfter *= this.urls.length;
      }
    } else {
      retry = backoff.exponential({
        initialDelay: 1,
        maxDelay: 2
      });
      failAfter = this.urls.length || 1;
    }
    retry.failAfter(failAfter);
    retry.on("ready", function(num, _delay) {
      if (self.destroyed) {
        return;
      }
      connectSocket(function(err) {
        if (!err) {
          postSetup();
          self.connecting = false;
          self.connected = true;
          self.emit("connect", socket);
          self.log.debug("connected after %d attempt(s)", num + 1);
          self._flushQueue();
          self._connectRetry = null;
        } else {
          retry.backoff(err);
        }
      });
    });
    retry.on("fail", function(err) {
      if (self.destroyed) {
        return;
      }
      self.log.debug("failed to connect after %d attempts", failAfter);
      if (err instanceof ConnectionError) {
        self.emitError("connectTimeout", err);
      } else if (err.code === "ECONNREFUSED") {
        self.emitError("connectRefused", err);
      } else {
        self.emit("error", err);
      }
    });
    this._connectRetry = retry;
    this.connecting = true;
    retry.backoff();
  };
  Client.prototype._flushQueue = function _flushQueue() {
    this.queue.flush(this._send.bind(this));
  };
  Client.prototype._onClose = function _onClose(closeError) {
    const socket = this._socket;
    const tracker = this._tracker;
    socket.removeAllListeners("connect").removeAllListeners("data").removeAllListeners("drain").removeAllListeners("end").removeAllListeners("error").removeAllListeners("timeout");
    this._socket = null;
    this.connected = false;
    (socket.socket ? socket.socket : socket).removeAllListeners("close");
    this.log.trace("close event had_err=%s", closeError ? "yes" : "no");
    this.emit("close", closeError);
    tracker.purge(function(msgid, cb) {
      if (socket.unbindMessageID !== msgid) {
        return cb(new ConnectionError(tracker.id + " closed"));
      } else {
        const Unbind = class extends LDAPResult {
          messageID = msgid;
          messageId = msgid;
          status = "unbind";
        };
        const unbind = new Unbind;
        return cb(unbind);
      }
    });
    this._tracker = null;
    delete this._starttls;
    if (this.reconnect && !this.unbound) {
      this.connect();
    }
    this.unbound = false;
    return false;
  };
  Client.prototype._updateIdle = function _updateIdle(override) {
    if (this.idleTimeout === 0) {
      return;
    }
    const self = this;
    function isIdle(disable) {
      return disable !== true && (self._socket && self.connected) && self._tracker.pending === 0;
    }
    if (isIdle(override)) {
      if (!this._idleTimer) {
        this._idleTimer = setTimeout(function() {
          if (isIdle()) {
            self.emit("idle");
          }
        }, this.idleTimeout);
      }
    } else {
      if (this._idleTimer) {
        clearTimeout(this._idleTimer);
        this._idleTimer = null;
      }
    }
  };
  Client.prototype._send = function _send(message, expect, emitter, callback, _bypass) {
    assert.ok(message);
    assert.ok(expect);
    assert.optionalObject(emitter);
    assert.ok(callback);
    if (_bypass && this._socket && this._socket.writable) {
      return this._sendSocket(message, expect, emitter, callback);
    }
    if (!this._socket || !this.connected) {
      if (!this.queue.enqueue(message, expect, emitter, callback)) {
        callback(new ConnectionError("connection unavailable"));
      }
      if (this.reconnect) {
        this.connect();
      }
      return false;
    } else {
      this._flushQueue();
      return this._sendSocket(message, expect, emitter, callback);
    }
  };
  Client.prototype._sendSocket = function _sendSocket(message, expect, emitter, callback) {
    const conn = this._socket;
    const tracker = this._tracker;
    const log = this.log;
    const self = this;
    let timer = false;
    let sentEmitter = false;
    function sendResult(event, obj) {
      if (event === "error") {
        self.emit("resultError", obj);
      }
      if (emitter) {
        if (event === "error") {
          if (!sentEmitter) {
            return callback(obj);
          }
        }
        return emitter.emit(event, obj);
      }
      if (event === "error") {
        return callback(obj);
      }
      return callback(null, obj);
    }
    function messageCallback(msg) {
      if (timer) {
        clearTimeout(timer);
      }
      log.trace({ msg: msg ? msg.pojo : null }, "response received");
      if (expect === "abandon") {
        return sendResult("end", null);
      }
      if (msg instanceof SearchEntry || msg instanceof SearchReference) {
        let event = msg.constructor.name;
        event = (event[0].toLowerCase() + event.slice(1)).replaceAll("Result", "");
        return sendResult(event, msg);
      } else {
        tracker.remove(message.messageId);
        self._updateIdle();
        if (msg instanceof LDAPResult) {
          if (msg.status !== 0 && expect.indexOf(msg.status) === -1) {
            return sendResult("error", errors.getError(msg));
          }
          return sendResult("end", msg);
        } else if (msg instanceof Error) {
          return sendResult("error", msg);
        } else {
          return sendResult("error", new errors.ProtocolError(msg.type));
        }
      }
    }
    function onRequestTimeout() {
      self.emit("timeout", message);
      const { callback: cb } = tracker.fetch(message.messageId);
      if (cb) {
        cb(new errors.TimeoutError("request timeout (client interrupt)"));
      }
    }
    function writeCallback() {
      if (expect === "abandon") {
        tracker.abandon(message.abandonId);
        tracker.remove(message.id);
        return callback(null);
      } else if (expect === "unbind") {
        conn.unbindMessageID = message.id;
        self.connected = false;
        conn.removeAllListeners("error");
        conn.on("error", function() {});
        conn.end();
      } else if (emitter) {
        sentEmitter = true;
        callback(null, emitter);
        emitter.emit("searchRequest", message);
        return;
      }
      return false;
    }
    tracker.track(message, messageCallback);
    this._updateIdle(true);
    if (self.timeout) {
      log.trace("Setting timeout to %d", self.timeout);
      timer = setTimeout(onRequestTimeout, self.timeout);
    }
    log.trace("sending request %j", message.pojo);
    try {
      const messageBer = message.toBer();
      return conn.write(messageBer.buffer, writeCallback);
    } catch (e) {
      if (timer) {
        clearTimeout(timer);
      }
      log.trace({ err: e }, "Error writing message to socket");
      return callback(e);
    }
  };
  Client.prototype.emitError = function emitError(event, err) {
    if (event !== "error" && err && this.listenerCount(event) === 0) {
      if (typeof err === "string") {
        err = event + ": " + err;
      } else if (err.message) {
        err.message = event + ": " + err.message;
      }
      this.emit("error", err);
    }
    this.emit(event, err);
  };
});

// node_modules/ldapjs/lib/client/index.js
var require_client2 = __commonJS(function(exports, module) {
  var logger = require_logger();
  var Client = require_client();
  module.exports = {
    Client,
    createClient: function createClient(options) {
      if (isObject(options) === false)
        throw TypeError("options (object) required");
      if (options.url && typeof options.url !== "string" && !Array.isArray(options.url))
        throw TypeError("options.url (string|array) required");
      if (options.socketPath && typeof options.socketPath !== "string")
        throw TypeError("options.socketPath must be a string");
      if (options.url && options.socketPath || !(options.url || options.socketPath))
        throw TypeError("options.url ^ options.socketPath (String) required");
      if (!options.log)
        options.log = logger;
      if (isObject(options.log) !== true)
        throw TypeError("options.log must be an object");
      if (!options.log.child)
        options.log.child = function() {
          return options.log;
        };
      return new Client(options);
    }
  };
  function isObject(input) {
    return Object.prototype.toString.apply(input) === "[object Object]";
  }
});

// node_modules/ldapjs/lib/server.js
var require_server = __commonJS(function(exports, module) {
  var assert = __require("assert");
  var EventEmitter = __require("events").EventEmitter;
  var net = __require("net");
  var tls = __require("tls");
  var util = __require("util");
  var VError = require_verror2().VError;
  var { DN, RDN } = require_dn2();
  var errors = require_errors2();
  var Protocol = require_protocol();
  var messages = require_messages();
  var Parser = require_messages2().Parser;
  var LdapResult = messages.LdapResult;
  var AbandonResponse = messages.AbandonResponse;
  var AddResponse = messages.AddResponse;
  var BindResponse = messages.BindResponse;
  var CompareResponse = messages.CompareResponse;
  var DeleteResponse = messages.DeleteResponse;
  var ExtendedResponse = messages.ExtensionResponse;
  var ModifyResponse = messages.ModifyResponse;
  var ModifyDnResponse = messages.ModifyDnResponse;
  var SearchRequest = messages.SearchRequest;
  var SearchResponse = require_search_response();
  function mergeFunctionArgs(argv, start, end) {
    assert.ok(argv);
    if (!start) {
      start = 0;
    }
    if (!end) {
      end = argv.length;
    }
    const handlers = [];
    for (let i = start;i < end; i++) {
      if (Array.isArray(argv[i])) {
        const arr = argv[i];
        for (let j = 0;j < arr.length; j++) {
          if (typeof arr[j] !== "function") {
            throw new TypeError("Invalid argument type: " + typeof arr[j]);
          }
          handlers.push(arr[j]);
        }
      } else if (typeof argv[i] === "function") {
        handlers.push(argv[i]);
      } else {
        throw new TypeError("Invalid argument type: " + typeof argv[i]);
      }
    }
    return handlers;
  }
  function getResponse(req) {
    assert.ok(req);
    let Response2;
    switch (req.protocolOp) {
      case Protocol.operations.LDAP_REQ_BIND:
        Response2 = BindResponse;
        break;
      case Protocol.operations.LDAP_REQ_ABANDON:
        Response2 = AbandonResponse;
        break;
      case Protocol.operations.LDAP_REQ_ADD:
        Response2 = AddResponse;
        break;
      case Protocol.operations.LDAP_REQ_COMPARE:
        Response2 = CompareResponse;
        break;
      case Protocol.operations.LDAP_REQ_DELETE:
        Response2 = DeleteResponse;
        break;
      case Protocol.operations.LDAP_REQ_EXTENSION:
        Response2 = ExtendedResponse;
        break;
      case Protocol.operations.LDAP_REQ_MODIFY:
        Response2 = ModifyResponse;
        break;
      case Protocol.operations.LDAP_REQ_MODRDN:
        Response2 = ModifyDnResponse;
        break;
      case Protocol.operations.LDAP_REQ_SEARCH:
        Response2 = SearchResponse;
        break;
      case Protocol.operations.LDAP_REQ_UNBIND:
        Response2 = class extends LdapResult {
          status = 0;
          end() {
            req.connection.end();
          }
        };
        break;
      default:
        return null;
    }
    assert.ok(Response2);
    const res = new Response2({
      messageId: req.messageId,
      attributes: req instanceof SearchRequest ? req.attributes : undefined
    });
    res.log = req.log;
    res.connection = req.connection;
    res.logId = req.logId;
    if (typeof res.end !== "function") {
      switch (res.protocolOp) {
        case 0: {
          res.end = abandonResponseEnd;
          break;
        }
        case Protocol.operations.LDAP_RES_COMPARE: {
          res.end = compareResponseEnd;
          break;
        }
        default: {
          res.end = defaultResponseEnd;
          break;
        }
      }
    }
    return res;
  }
  function defaultResponseEnd(status) {
    if (typeof status === "number") {
      this.status = status;
    }
    const ber = this.toBer();
    this.log.debug("%s: sending: %j", this.connection.ldap.id, this.pojo);
    try {
      this.connection.write(ber.buffer);
    } catch (error) {
      this.log.warn(error, "%s failure to write message %j", this.connection.ldap.id, this.pojo);
    }
  }
  function abandonResponseEnd() {}
  function compareResponseEnd(status) {
    let result = 6;
    if (typeof status === "boolean") {
      if (status === false) {
        result = 5;
      }
    } else {
      result = status;
    }
    return defaultResponseEnd.call(this, result);
  }
  function defaultHandler(req, res, next) {
    assert.ok(req);
    assert.ok(res);
    assert.ok(next);
    res.matchedDN = req.dn.toString();
    res.errorMessage = "Server method not implemented";
    res.end(errors.LDAP_OTHER);
    return next();
  }
  function defaultNoOpHandler(req, res, next) {
    assert.ok(req);
    assert.ok(res);
    assert.ok(next);
    res.end();
    return next();
  }
  function noSuffixHandler(req, res, next) {
    assert.ok(req);
    assert.ok(res);
    assert.ok(next);
    res.errorMessage = "No tree found for: " + req.dn.toString();
    res.end(errors.LDAP_NO_SUCH_OBJECT);
    return next();
  }
  function noExOpHandler(req, res, next) {
    assert.ok(req);
    assert.ok(res);
    assert.ok(next);
    res.errorMessage = req.requestName + " not supported";
    res.end(errors.LDAP_PROTOCOL_ERROR);
    return next();
  }
  function Server(options) {
    if (options) {
      if (typeof options !== "object") {
        throw new TypeError("options (object) required");
      }
      if (typeof options.log !== "object") {
        throw new TypeError("options.log must be an object");
      }
      if (options.certificate || options.key) {
        if (!(options.certificate && options.key) || typeof options.certificate !== "string" && !Buffer.isBuffer(options.certificate) || typeof options.key !== "string" && !Buffer.isBuffer(options.key)) {
          throw new TypeError("options.certificate and options.key " + "(string or buffer) are both required for TLS");
        }
      }
    } else {
      options = {};
    }
    const self = this;
    EventEmitter.call(this, options);
    this._chain = [];
    this.log = options.log;
    const log = this.log;
    function setupConnection(c) {
      assert.ok(c);
      if (c.type === "unix") {
        c.remoteAddress = self.server.path;
        c.remotePort = c.fd;
      } else if (c.socket) {
        c.remoteAddress = c.socket.remoteAddress;
        c.remotePort = c.socket.remotePort;
      }
      const rdn = new RDN({ cn: "anonymous" });
      c.ldap = {
        id: c.remoteAddress + ":" + c.remotePort,
        config: options,
        _bindDN: new DN({ rdns: [rdn] })
      };
      c.addListener("timeout", function() {
        log.trace("%s timed out", c.ldap.id);
        c.destroy();
      });
      c.addListener("end", function() {
        log.trace("%s shutdown", c.ldap.id);
      });
      c.addListener("error", function(err) {
        log.warn("%s unexpected connection error", c.ldap.id, err);
        self.emit("clientError", err);
        c.destroy();
      });
      c.addListener("close", function(closeError) {
        log.trace("%s close; had_err=%j", c.ldap.id, closeError);
        c.end();
      });
      c.ldap.__defineGetter__("bindDN", function() {
        return c.ldap._bindDN;
      });
      c.ldap.__defineSetter__("bindDN", function(val) {
        if (Object.prototype.toString.call(val) !== "[object LdapDn]") {
          throw new TypeError("DN required");
        }
        c.ldap._bindDN = val;
        return val;
      });
      return c;
    }
    self.newConnection = function(conn) {
      setupConnection(conn);
      log.trace("new connection from %s", conn.ldap.id);
      conn.parser = new Parser({
        log: options.log
      });
      conn.parser.on("message", function(req) {
        req.connection = conn;
        req.logId = conn.ldap.id + "::" + req.messageId;
        req.startTime = new Date().getTime();
        log.debug("%s: message received: req=%j", conn.ldap.id, req.pojo);
        const res = getResponse(req);
        if (!res) {
          log.warn("Unimplemented server method: %s", req.type);
          conn.destroy();
          return false;
        }
        try {
          switch (req.protocolOp) {
            case Protocol.operations.LDAP_REQ_BIND: {
              req.name = DN.fromString(req.name);
              break;
            }
            case Protocol.operations.LDAP_REQ_ADD:
            case Protocol.operations.LDAP_REQ_COMPARE:
            case Protocol.operations.LDAP_REQ_DELETE: {
              if (typeof req.entry === "string") {
                req.entry = DN.fromString(req.entry);
              } else if (Object.prototype.toString.call(req.entry) !== "[object LdapDn]") {
                throw Error("invalid entry object for operation");
              }
              break;
            }
            case Protocol.operations.LDAP_REQ_MODIFY: {
              req.object = DN.fromString(req.object);
              break;
            }
            case Protocol.operations.LDAP_REQ_MODRDN: {
              if (typeof req.entry === "string") {
                req.entry = DN.fromString(req.entry);
              } else if (Object.prototype.toString.call(req.entry) !== "[object LdapDn]") {
                throw Error("invalid entry object for operation");
              }
              break;
            }
            case Protocol.operations.LDAP_REQ_SEARCH: {
              break;
            }
            default: {
              break;
            }
          }
        } catch (e) {
          return res.end(errors.LDAP_INVALID_DN_SYNTAX);
        }
        res.connection = conn;
        res.logId = req.logId;
        res.requestDN = req.dn;
        const chain = self._getHandlerChain(req, res);
        let i = 0;
        return function messageIIFE(err) {
          function sendError(sendErr) {
            res.status = sendErr.code || errors.LDAP_OPERATIONS_ERROR;
            res.matchedDN = req.suffix ? req.suffix.toString() : "";
            res.errorMessage = sendErr.message || "";
            return res.end();
          }
          function after() {
            if (!self._postChain || !self._postChain.length) {
              return;
            }
            function next() {}
            self._postChain.forEach(function(cb) {
              cb.call(self, req, res, next);
            });
          }
          if (err) {
            log.trace("%s sending error: %s", req.logId, err.stack || err);
            self.emit("clientError", err);
            sendError(err);
            return after();
          }
          try {
            const next = messageIIFE;
            if (chain.handlers[i]) {
              return chain.handlers[i++].call(chain.backend, req, res, next);
            }
            if (req.protocolOp === Protocol.operations.LDAP_REQ_BIND && res.status === 0) {
              if (req.dn.length === 0 && req.credentials === "") {
                conn.ldap.bindDN = new DN({ rdns: [new RDN({ cn: "anonymous" })] });
              } else {
                conn.ldap.bindDN = DN.fromString(req.dn);
              }
            }
            if (req.protocolOp === Protocol.operations.LDAP_REQ_UNBIND && res.status === 0) {
              conn.ldap.bindDN = new DN({ rdns: [new RDN({ cn: "anonymous" })] });
            }
            return after();
          } catch (e) {
            if (!e.stack) {
              e.stack = e.toString();
            }
            log.error("%s uncaught exception: %s", req.logId, e.stack);
            return sendError(new errors.OperationsError(e.message));
          }
        }();
      });
      conn.parser.on("error", function(err, message) {
        self.emit("error", new VError(err, "Parser error for %s", conn.ldap.id));
        if (!message) {
          return conn.destroy();
        }
        const res = getResponse(message);
        if (!res) {
          return conn.destroy();
        }
        res.status = 2;
        res.errorMessage = err.toString();
        return conn.end(res.toBer());
      });
      conn.on("data", function(data) {
        log.trace("data on %s: %s", conn.ldap.id, util.inspect(data));
        conn.parser.write(data);
      });
    };
    this.routes = {};
    if ((options.cert || options.certificate) && options.key) {
      options.cert = options.cert || options.certificate;
      this.server = tls.createServer(options, options.connectionRouter ? options.connectionRouter : self.newConnection);
    } else {
      this.server = net.createServer(options.connectionRouter ? options.connectionRouter : self.newConnection);
    }
    this.server.log = options.log;
    this.server.ldap = {
      config: options
    };
    this.server.on("close", function() {
      self.emit("close");
    });
    this.server.on("error", function(err) {
      self.emit("error", err);
    });
  }
  util.inherits(Server, EventEmitter);
  Object.defineProperties(Server.prototype, {
    maxConnections: {
      get: function getMaxConnections() {
        return this.server.maxConnections;
      },
      set: function setMaxConnections(val) {
        this.server.maxConnections = val;
      },
      configurable: false
    },
    connections: {
      get: function getConnections() {
        return this.server.connections;
      },
      configurable: false
    },
    name: {
      get: function getName() {
        return "LDAPServer";
      },
      configurable: false
    },
    url: {
      get: function getURL() {
        let str;
        const addr = this.server.address();
        if (!addr) {
          return null;
        }
        if (!addr.family) {
          str = "ldapi://";
          str += this.host.replace(/\//g, "%2f");
          return str;
        }
        if (this.server instanceof tls.Server) {
          str = "ldaps://";
        } else {
          str = "ldap://";
        }
        let host = this.host;
        if (addr.family === "IPv6" || addr.family === 6) {
          host = "[" + this.host + "]";
        }
        str += host + ":" + this.port;
        return str;
      },
      configurable: false
    }
  });
  module.exports = Server;
  Server.prototype.add = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_ADD, name, args);
  };
  Server.prototype.bind = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_BIND, name, args);
  };
  Server.prototype.compare = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_COMPARE, name, args);
  };
  Server.prototype.del = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_DELETE, name, args);
  };
  Server.prototype.exop = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_EXTENSION, name, args, true);
  };
  Server.prototype.modify = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_MODIFY, name, args);
  };
  Server.prototype.modifyDN = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_MODRDN, name, args);
  };
  Server.prototype.search = function(name) {
    const args = Array.prototype.slice.call(arguments, 1);
    return this._mount(Protocol.operations.LDAP_REQ_SEARCH, name, args);
  };
  Server.prototype.unbind = function() {
    const args = Array.prototype.slice.call(arguments, 0);
    return this._mount(Protocol.operations.LDAP_REQ_UNBIND, "unbind", args, true);
  };
  Server.prototype.use = function use() {
    const args = Array.prototype.slice.call(arguments);
    const chain = mergeFunctionArgs(args, 0, args.length);
    const self = this;
    chain.forEach(function(c) {
      self._chain.push(c);
    });
  };
  Server.prototype.after = function() {
    if (!this._postChain) {
      this._postChain = [];
    }
    const self = this;
    mergeFunctionArgs(arguments).forEach(function(h) {
      self._postChain.push(h);
    });
  };
  Server.prototype.listen = function(port, host, callback) {
    if (typeof port !== "number" && typeof port !== "string") {
      throw new TypeError("port (number or path) required");
    }
    if (typeof host === "function") {
      callback = host;
      host = "127.0.0.1";
    }
    if (typeof port === "string" && /^[0-9]+$/.test(port)) {
      port = parseInt(port, 10);
    }
    const self = this;
    function cbListen() {
      if (typeof port === "number") {
        self.host = self.address().address;
        self.port = self.address().port;
      } else {
        self.host = port;
        self.port = self.server.fd;
      }
      if (typeof callback === "function") {
        callback();
      }
    }
    if (typeof port === "number") {
      return this.server.listen(port, host, cbListen);
    } else {
      return this.server.listen(port, cbListen);
    }
  };
  Server.prototype.listenFD = function(fd) {
    this.host = "unix-domain-socket";
    this.port = fd;
    return this.server.listenFD(fd);
  };
  Server.prototype.close = function(callback) {
    return this.server.close(callback);
  };
  Server.prototype.address = function() {
    return this.server.address();
  };
  Server.prototype.getConnections = function(callback) {
    return this.server.getConnections(callback);
  };
  Server.prototype._getRoute = function(_dn, backend) {
    if (!backend) {
      backend = this;
    }
    let name;
    if (Object.prototype.toString.call(_dn) === "[object LdapDn]") {
      name = _dn.toString();
    } else {
      name = _dn;
    }
    if (!this.routes[name]) {
      this.routes[name] = {};
      this.routes[name].backend = backend;
      this.routes[name].dn = _dn;
      this._routeKeyCache = null;
    }
    return this.routes[name];
  };
  Server.prototype._sortedRouteKeys = function _sortedRouteKeys() {
    if (!this._routeKeyCache) {
      const self = this;
      const reversedRDNsToKeys = {};
      Object.keys(this.routes).forEach(function(key) {
        const _dn = self.routes[key].dn;
        if (Object.prototype.toString.call(_dn) === "[object LdapDn]") {
          const reversed = _dn.clone();
          reversed.reverse();
          reversedRDNsToKeys[reversed.toString()] = key;
        }
      });
      const output = [];
      Object.keys(reversedRDNsToKeys).sort().reverse().forEach(function(_dn) {
        output.push(reversedRDNsToKeys[_dn]);
      });
      this._routeKeyCache = output;
    }
    return this._routeKeyCache;
  };
  Server.prototype._getHandlerChain = function _getHandlerChain(req) {
    assert.ok(req);
    const self = this;
    const routes = this.routes;
    let route;
    if (req.protocolOp === Protocol.operations.LDAP_REQ_BIND && req.dn.toString() === "" && req.credentials === "") {
      return {
        backend: self,
        handlers: [defaultNoOpHandler]
      };
    }
    const op = "0x" + req.protocolOp.toString(16);
    if (req.protocolOp === Protocol.operations.LDAP_REQ_EXTENSION) {
      route = routes[req.requestName];
      if (route) {
        return {
          backend: route.backend,
          handlers: route[op] ? route[op] : [noExOpHandler]
        };
      } else {
        return {
          backend: self,
          handlers: [noExOpHandler]
        };
      }
    } else if (req.protocolOp === Protocol.operations.LDAP_REQ_UNBIND) {
      route = routes.unbind;
      if (route) {
        return {
          backend: route.backend,
          handlers: route[op]
        };
      } else {
        return {
          backend: self,
          handlers: [defaultNoOpHandler]
        };
      }
    } else if (req.protocolOp === Protocol.operations.LDAP_REQ_ABANDON) {
      return {
        backend: self,
        handlers: [defaultNoOpHandler]
      };
    }
    const keys = this._sortedRouteKeys();
    let fallbackHandler = [noSuffixHandler];
    const testDN = typeof req.dn === "string" ? DN.fromString(req.dn) : req.dn;
    assert.ok(testDN);
    for (let i = 0;i < keys.length; i++) {
      const suffix = keys[i];
      route = routes[suffix];
      assert.ok(route.dn);
      if (route.dn.equals(testDN) || route.dn.parentOf(testDN) || suffix === "") {
        if (route[op]) {
          req.suffix = route.dn;
          return {
            backend: route.backend,
            handlers: route[op]
          };
        } else {
          if (suffix === "") {
            break;
          } else {
            fallbackHandler = [defaultHandler];
          }
        }
      }
    }
    return {
      backend: self,
      handlers: fallbackHandler
    };
  };
  Server.prototype._mount = function(op, name, argv, notDN) {
    assert.ok(op);
    assert.ok(name !== undefined);
    assert.ok(argv);
    if (typeof name !== "string") {
      throw new TypeError("name (string) required");
    }
    if (!argv.length) {
      throw new Error("at least one handler required");
    }
    let backend = this;
    let index = 0;
    if (typeof argv[0] === "object" && !Array.isArray(argv[0])) {
      backend = argv[0];
      index = 1;
    }
    const route = this._getRoute(notDN ? name : DN.fromString(name), backend);
    const chain = this._chain.slice();
    argv.slice(index).forEach(function(a) {
      chain.push(a);
    });
    route["0x" + op.toString(16)] = mergeFunctionArgs(chain);
    return this;
  };
});

// node_modules/ldapjs/lib/persistent_search.js
var require_persistent_search = __commonJS(function(exports, module) {
  var EntryChangeNotificationControl = require_controls2().EntryChangeNotificationControl;
  function PersistentSearch() {
    this.clientList = [];
  }
  PersistentSearch.prototype.addClient = function(req, res, callback) {
    if (typeof req !== "object") {
      throw new TypeError("req must be an object");
    }
    if (typeof res !== "object") {
      throw new TypeError("res must be an object");
    }
    if (callback && typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    const log = req.log;
    const client = {};
    client.req = req;
    client.res = res;
    log.debug("%s storing client", req.logId);
    this.clientList.push(client);
    log.debug("%s stored client", req.logId);
    log.debug("%s total number of clients %s", req.logId, this.clientList.length);
    if (callback) {
      callback(client);
    }
  };
  PersistentSearch.prototype.removeClient = function(req, res, callback) {
    if (typeof req !== "object") {
      throw new TypeError("req must be an object");
    }
    if (typeof res !== "object") {
      throw new TypeError("res must be an object");
    }
    if (callback && typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    const log = req.log;
    log.debug("%s removing client", req.logId);
    const client = {};
    client.req = req;
    client.res = res;
    this.clientList.forEach(function(element, index, array) {
      if (element.req === client.req) {
        log.debug("%s removing client from list", req.logId);
        array.splice(index, 1);
      }
    });
    log.debug("%s number of persistent search clients %s", req.logId, this.clientList.length);
    if (callback) {
      callback(client);
    }
  };
  function getOperationType(requestType) {
    switch (requestType) {
      case "AddRequest":
      case "add":
        return 1;
      case "DeleteRequest":
      case "delete":
        return 2;
      case "ModifyRequest":
      case "modify":
        return 4;
      case "ModifyDNRequest":
      case "modrdn":
        return 8;
      default:
        throw new TypeError("requestType %s, is an invalid request type", requestType);
    }
  }
  function getEntryChangeNotificationControl(req, obj) {
    if (req.persistentSearch.value.returnECs) {
      const attrs = obj.attributes;
      const value = {};
      value.changeType = getOperationType(attrs.changetype);
      if (value.changeType === 8 && attrs.previousDN) {
        value.previousDN = attrs.previousDN;
      }
      value.changeNumber = attrs.changenumber;
      return new EntryChangeNotificationControl({ value });
    } else {
      return false;
    }
  }
  function checkChangeType(req, requestType) {
    return req.persistentSearch.value.changeTypes & getOperationType(requestType);
  }
  module.exports = {
    PersistentSearchCache: PersistentSearch,
    checkChangeType,
    getEntryChangeNotificationControl
  };
});

// node_modules/ldapjs/lib/index.js
var require_lib3 = __commonJS(function(exports, module) {
  var logger = require_logger();
  var client = require_client2();
  var Attribute = require_attribute();
  var Change = require_change();
  var Protocol = require_protocol();
  var Server = require_server();
  var controls = require_controls2();
  var persistentSearch = require_persistent_search();
  var dn = require_dn2();
  var errors = require_errors2();
  var filters = require_lib2();
  var messages = require_messages2();
  var url = require_url();
  var hasOwnProperty = (target, val) => Object.prototype.hasOwnProperty.call(target, val);
  module.exports = {
    Client: client.Client,
    createClient: client.createClient,
    Server,
    createServer: function(options) {
      if (options === undefined) {
        options = {};
      }
      if (typeof options !== "object") {
        throw new TypeError("options (object) required");
      }
      if (!options.log) {
        options.log = logger;
      }
      return new Server(options);
    },
    Attribute,
    Change,
    dn,
    DN: dn.DN,
    RDN: dn.RDN,
    parseDN: dn.DN.fromString,
    persistentSearch,
    PersistentSearchCache: persistentSearch.PersistentSearchCache,
    filters,
    parseFilter: filters.parseString,
    url,
    parseURL: url.parse
  };
  var k;
  for (k in Protocol) {
    if (hasOwnProperty(Protocol, k)) {
      module.exports[k] = Protocol[k];
    }
  }
  for (k in messages) {
    if (hasOwnProperty(messages, k)) {
      module.exports[k] = messages[k];
    }
  }
  for (k in controls) {
    if (hasOwnProperty(controls, k)) {
      module.exports[k] = controls[k];
    }
  }
  for (k in filters) {
    if (hasOwnProperty(filters, k)) {
      if (k !== "parse" && k !== "parseString") {
        module.exports[k] = filters[k];
      }
    }
  }
  for (k in errors) {
    if (hasOwnProperty(errors, k)) {
      module.exports[k] = errors[k];
    }
  }
});

// src/config.ts
var config = null;
function env(key) {
  const val = process.env[key];
  if (!val) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}
function envOpt(key, fallback) {
  const val = process.env[key];
  return val ?? fallback;
}
function envNum(key, fallback) {
  const val = process.env[key];
  if (!val)
    return fallback;
  const n = Number(val);
  if (Number.isNaN(n)) {
    console.error(`Invalid number for ${key}: ${val}`);
    process.exit(1);
  }
  return n;
}
function envBool(key, fallback) {
  const val = process.env[key];
  if (!val)
    return fallback;
  const normalized = val.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}
function loadConfig() {
  if (config)
    return config;
  const masterKey = env("MASTER_KEY");
  if (masterKey.length !== 64) {
    console.error("MASTER_KEY must be exactly 64 hex characters (32 bytes)");
    process.exit(1);
  }
  const sessionSecret = env("SESSION_SECRET");
  if (sessionSecret.length < 16) {
    console.error("SESSION_SECRET must be at least 16 characters");
    process.exit(1);
  }
  config = {
    APP_NAME: envOpt("APP_NAME", "passwordeeri"),
    PORT: envNum("PORT", 3000),
    SESSION_SECRET: sessionSecret,
    MASTER_KEY: masterKey,
    COOKIE_SECURE: envBool("COOKIE_SECURE", false),
    SESSION_TTL_HOURS: envNum("SESSION_TTL_HOURS", 8),
    SESSION_REFRESH_MINUTES: envNum("SESSION_REFRESH_MINUTES", 15),
    LDAP_URL: env("LDAP_URL"),
    LDAP_BIND_DN: env("LDAP_BIND_DN"),
    LDAP_BIND_PASSWORD: env("LDAP_BIND_PASSWORD"),
    LDAP_SEARCH_BASE: env("LDAP_SEARCH_BASE"),
    LDAP_USER_FILTER: env("LDAP_USER_FILTER"),
    LDAP_GROUP_FILTER: envOpt("LDAP_GROUP_FILTER", ""),
    LDAP_GROUP_ATTR: envOpt("LDAP_GROUP_ATTR", "memberOf"),
    DATA_DIR: envOpt("DATA_DIR", "./data")
  };
  return config;
}
function getConfig() {
  if (!config) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return config;
}

// src/db.ts
import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { join } from "path";
import { timingSafeEqual } from "crypto";
var MIGRATIONS = `
CREATE TABLE IF NOT EXISTS passwords (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    username    TEXT NOT NULL,
    url         TEXT DEFAULT '',
    enc_password TEXT NOT NULL,
    enc_iv      TEXT NOT NULL,
    enc_tag     TEXT NOT NULL,
    group_cn    TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token       TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    groups      TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL,
    last_refreshed TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_id   INTEGER,
    detail      TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_passwords_group ON passwords(group_cn);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;
var db = null;
function getDb() {
  if (db)
    return db;
  const cfg = getConfig();
  mkdirSync(cfg.DATA_DIR, { recursive: true });
  db = new Database(join(cfg.DATA_DIR, "passwordeeri.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(MIGRATIONS);
  return db;
}
function isTokenValid(inputToken, storedToken) {
  try {
    const input = Buffer.from(inputToken, "utf8");
    const stored = Buffer.from(storedToken, "utf8");
    if (input.length !== stored.length)
      return false;
    return timingSafeEqual(input, stored);
  } catch {
    return false;
  }
}
function listPasswordsForGroups(groups) {
  if (groups.length === 0)
    return [];
  const placeholders = groups.map(() => "?").join(", ");
  return getDb().query(`SELECT * FROM passwords WHERE group_cn IN (${placeholders}) ORDER BY title`).all(...groups);
}
function getPasswordById(id) {
  return getDb().query("SELECT * FROM passwords WHERE id = ?").get(id);
}
function createPassword(data) {
  const result = getDb().query(`INSERT INTO passwords (title, username, url, enc_password, enc_iv, enc_tag, group_cn)
       VALUES (?, ?, ?, ?, ?, ?, ?)`).run(data.title, data.username, data.url, data.enc_password, data.enc_iv, data.enc_tag, data.group_cn);
  return getPasswordById(Number(result.lastInsertRowid));
}
function deletePassword(id) {
  const result = getDb().query("DELETE FROM passwords WHERE id = ?").run(id);
  return result.changes > 0;
}
function createSession(token, username, groups) {
  const cfg = getConfig();
  const expiresAt = new Date(Date.now() + cfg.SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  const now = new Date().toISOString();
  getDb().query("INSERT INTO sessions (token, username, groups, expires_at, last_refreshed) VALUES (?, ?, ?, ?, ?)").run(token, username, JSON.stringify(groups), expiresAt, now);
}
function getSession(token) {
  const row = getDb().query("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!row)
    return null;
  if (!isTokenValid(token, row.token))
    return null;
  if (new Date(row.expires_at) < new Date) {
    deleteSession(token);
    return null;
  }
  return row;
}
function refreshSessionGroups(token, groups) {
  const now = new Date().toISOString();
  getDb().query("UPDATE sessions SET groups = ?, last_refreshed = ? WHERE token = ?").run(JSON.stringify(groups), now, token);
}
function deleteSession(token) {
  getDb().query("DELETE FROM sessions WHERE token = ?").run(token);
}
function parseGroups(session) {
  try {
    const parsed = JSON.parse(session.groups);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function logAudit(username, action, targetId, detail) {
  try {
    getDb().query("INSERT INTO audit_log (username, action, target_id, detail) VALUES (?, ?, ?, ?)").run(username, action, targetId, detail);
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}

// src/router.ts
class Router {
  routes = [];
  get(path, handler) {
    this.add("GET", path, handler);
  }
  post(path, handler) {
    this.add("POST", path, handler);
  }
  delete(path, handler) {
    this.add("DELETE", path, handler);
  }
  add(method, path, handler) {
    const paramNames = [];
    const regexStr = path.replace(/:([a-zA-Z_]+)/g, (_, name) => {
      paramNames.push(name);
      return "([^/]+)";
    }).replace(/\//g, "\\/");
    this.routes.push({ method, pattern: new RegExp(`^${regexStr}$`), paramNames, handler });
  }
  async resolve(request, server) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    for (const route of this.routes) {
      if (route.method !== method)
        continue;
      const match = pathname.match(route.pattern);
      if (!match)
        continue;
      const params = {};
      for (let i = 0;i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }
      const ctx = { request, params, userGroups: [], username: "", server };
      return route.handler(ctx);
    }
    return null;
  }
}

// src/ldap.ts
var import_ldapjs = __toESM(require_lib3(), 1);
class AuthError extends Error {
  constructor() {
    super("Invalid username or password");
    this.name = "AuthError";
  }
}
function normalizeAttr(attr) {
  if (attr === undefined || attr === null)
    return "";
  const v = Array.isArray(attr) ? attr : [attr];
  const strings = v.map((item) => String(item));
  return strings.length === 1 ? strings[0] : strings;
}
function searchOnce(client, base, filter, attributes) {
  return new Promise((resolve, reject) => {
    const results = [];
    client.search(base, { filter, scope: "sub", attributes }, (err, res) => {
      if (err)
        return reject(err);
      res.on("searchEntry", (entry) => {
        const attrs = {};
        for (const a of entry.attributes ?? []) {
          attrs[a.type] = normalizeAttr(a.values ?? a.vals);
        }
        const dnRaw = entry.objectName ?? entry.dn;
        const dn = typeof dnRaw === "string" ? dnRaw : dnRaw?.toString?.() ?? String(dnRaw ?? "");
        results.push({ dn, attributes: attrs });
      });
      res.on("error", (searchErr) => reject(searchErr));
      res.on("end", () => resolve(results));
    });
  });
}
function bind(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err)
        return reject(err);
      resolve();
    });
  });
}
function makeClient() {
  const cfg = getConfig();
  return import_ldapjs.createClient({
    url: cfg.LDAP_URL,
    reconnect: false,
    tlsOptions: { rejectUnauthorized: true }
  });
}
async function authenticate(username, password) {
  const cfg = getConfig();
  const client = makeClient();
  try {
    await bind(client, cfg.LDAP_BIND_DN, cfg.LDAP_BIND_PASSWORD);
    const userFilter = cfg.LDAP_USER_FILTER.replaceAll("{{username}}", escapeFilterValue(username));
    const userResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, userFilter, ["dn", cfg.LDAP_GROUP_ATTR]);
    if (userResults.length === 0) {
      throw new AuthError;
    }
    if (userResults.length > 1) {
      console.error(`LDAP user filter matched ${userResults.length} entries for user "${username}"`);
      throw new AuthError;
    }
    const userDn = userResults[0].dn;
    try {
      await bind(client, userDn, password);
    } catch {
      throw new AuthError;
    }
    let groupDns = [];
    const lowerAttrs = Object.fromEntries(Object.entries(userResults[0].attributes).map(([k, v]) => [k.toLowerCase(), v]));
    const memberOf = lowerAttrs[cfg.LDAP_GROUP_ATTR.toLowerCase()] ?? userResults[0].attributes[cfg.LDAP_GROUP_ATTR];
    if (memberOf) {
      groupDns = Array.isArray(memberOf) ? memberOf : [memberOf];
    }
    if (groupDns.length === 0 && cfg.LDAP_GROUP_FILTER) {
      const groupFilter = cfg.LDAP_GROUP_FILTER.replaceAll("{{user_dn}}", escapeFilterValue(userDn));
      const groupResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, groupFilter, ["cn"]);
      groupDns = groupResults.map((r) => r.dn);
    }
    const groups = groupDns.filter(Boolean).map((dn) => extractCn(dn)).filter(Boolean);
    return { username, groups };
  } finally {
    try {
      client.unbind(() => {});
    } catch {}
  }
}
async function getGroupsForUser(username) {
  const cfg = getConfig();
  const client = makeClient();
  try {
    await bind(client, cfg.LDAP_BIND_DN, cfg.LDAP_BIND_PASSWORD);
    const userFilter = cfg.LDAP_USER_FILTER.replaceAll("{{username}}", escapeFilterValue(username));
    const userResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, userFilter, ["dn", cfg.LDAP_GROUP_ATTR]);
    if (userResults.length === 0) {
      throw new AuthError;
    }
    const userDn = userResults[0].dn;
    let groupDns = [];
    const memberOf = userResults[0].attributes[cfg.LDAP_GROUP_ATTR];
    if (memberOf) {
      groupDns = Array.isArray(memberOf) ? memberOf : [memberOf];
    }
    if (groupDns.length === 0 && cfg.LDAP_GROUP_FILTER) {
      const groupFilter = cfg.LDAP_GROUP_FILTER.replaceAll("{{user_dn}}", escapeFilterValue(userDn));
      const groupResults = await searchOnce(client, cfg.LDAP_SEARCH_BASE, groupFilter, ["cn"]);
      groupDns = groupResults.map((r) => r.dn);
    }
    return groupDns.filter(Boolean).map((dn) => extractCn(dn)).filter(Boolean);
  } finally {
    try {
      client.unbind(() => {});
    } catch {}
  }
}
function escapeFilterValue(value) {
  return value.replace(/[\\*()&|!=~<>:\u0000]/g, (ch) => {
    if (ch === "\x00")
      return "\\00";
    return "\\" + ch;
  });
}
function extractCn(dn) {
  const parts = dn.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (/^cn=/i.test(trimmed)) {
      let val = trimmed.slice(3);
      val = val.replace(/\\([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      return val;
    }
  }
  return null;
}

// src/middleware.ts
function getCookie(name, cookieHeader) {
  if (!cookieHeader)
    return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1);
    }
  }
  return null;
}
function isSameOrigin(request) {
  const host = request.headers.get("Host");
  if (!host)
    return false;
  const origin = request.headers.get("Origin") || request.headers.get("Referer");
  if (!origin) {
    return false;
  }
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host && (originUrl.protocol === "https:" || originUrl.protocol === "http:");
  } catch {
    return false;
  }
}
function csrfGuard(handler) {
  return (ctx) => {
    const method = ctx.request.method;
    if (method === "POST" || method === "DELETE" || method === "PUT" || method === "PATCH") {
      const contentType = ctx.request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
          status: 415,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (!isSameOrigin(ctx.request)) {
        return new Response(JSON.stringify({ error: "Cross-origin request rejected" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return handler(ctx);
  };
}
async function maybeRefresh(ctx) {
  if (!ctx.session)
    return;
  const cfg = getConfig();
  const lastRefreshed = ctx.session.last_refreshed;
  if (!lastRefreshed)
    return;
  const elapsed = (Date.now() - new Date(lastRefreshed).getTime()) / 60000;
  if (elapsed < cfg.SESSION_REFRESH_MINUTES)
    return;
  try {
    const freshGroups = await getGroupsForUser(ctx.session.username);
    const token = ctx.session.token;
    if (token) {
      refreshSessionGroups(token, freshGroups);
      ctx.userGroups = freshGroups;
    }
  } catch (err) {
    console.error("Session refresh failed for user:", ctx.session?.username, err);
    const token = ctx.session?.token;
    if (token) {
      deleteSession(token);
    }
  }
}
function resolveSession(ctx) {
  const token = getCookie("session", ctx.request.headers.get("Cookie"));
  if (!token)
    return null;
  return { token };
}
function requireSession(handler) {
  return (ctx) => {
    const resolved = resolveSession(ctx);
    if (!resolved) {
      return new Response(null, { status: 302, headers: { Location: "/login" } });
    }
    const session = getSession(resolved.token);
    if (!session) {
      return new Response(null, { status: 302, headers: { Location: "/login" } });
    }
    ctx.session = session;
    ctx.userGroups = parseGroups(session);
    ctx.username = session.username;
    maybeRefresh(ctx);
    return handler(ctx);
  };
}
function requireSessionJson(handler) {
  return csrfGuard((ctx) => {
    const resolved = resolveSession(ctx);
    if (!resolved) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const session = getSession(resolved.token);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    ctx.session = session;
    ctx.userGroups = parseGroups(session);
    ctx.username = session.username;
    maybeRefresh(ctx);
    return handler(ctx);
  });
}

// src/routes/auth.ts
import { randomBytes } from "crypto";
var APP_NAME = () => getConfig().APP_NAME;
function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW_MS = 60000;
var RATE_LIMIT_CLEANUP_MS = 60000;
var loginAttempts = new Map;
function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (record.resetAt < now) {
      loginAttempts.delete(ip);
    }
  }
}, RATE_LIMIT_CLEANUP_MS);
function getClientIP(ctx) {
  const server = ctx.server;
  if (server) {
    const addr = server.requestIP(ctx.request);
    if (addr)
      return addr.address;
  }
  return "unknown";
}
function injectSecurityHeaders(headers) {
  return {
    ...headers,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin"
  };
}
function getLoginPage(_ctx) {
  const name = escapeAttr(APP_NAME());
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body class="login-page">
  <div class="login-box">
    <h1>${name}</h1>
    <form id="login-form">
      <div class="field">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>
      </div>
      <div id="error-msg" class="error-msg" style="display:none"></div>
      <button type="submit">Log in</button>
    </form>
  </div>
  <script src="/login.js"></script>
</body>
</html>`;
  return new Response(html, {
    headers: injectSecurityHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'"
    })
  });
}
async function handleLogin(ctx) {
  const ip = getClientIP(ctx);
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many login attempts. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { username, password } = body;
  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Username and password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const result = await authenticate(username, password);
    const token = randomBytes(32).toString("hex");
    createSession(token, result.username, result.groups);
    const cfg = getConfig();
    const maxAge = cfg.SESSION_TTL_HOURS * 3600;
    const secure = cfg.COOKIE_SECURE ? "; Secure" : "";
    logAudit(result.username, "login", null, "Login successful");
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`
      }
    });
  } catch (err) {
    const message = err instanceof AuthError ? err.message : "Invalid username or password";
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
}
function handleLogout(ctx) {
  const cookie = ctx.request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/\bsession=([^;]+)/);
    if (match) {
      deleteSession(match[1]);
    }
  }
  const secure = getConfig().COOKIE_SECURE ? "; Secure" : "";
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": `session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
    }
  });
}

// src/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes as randomBytes2 } from "crypto";
function keyBytes() {
  return Buffer.from(getConfig().MASTER_KEY, "hex");
}
function encrypt(plaintext, aad) {
  const iv = randomBytes2(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  if (aad !== undefined) {
    cipher.setAAD(typeof aad === "string" ? Buffer.from(aad, "utf8") : aad);
  }
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    data: data.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64")
  };
}
function decrypt(blob, aad) {
  try {
    const iv = Buffer.from(blob.iv, "base64");
    const tag = Buffer.from(blob.tag, "base64");
    const data = Buffer.from(blob.data, "base64");
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
    decipher.setAuthTag(tag);
    if (aad !== undefined) {
      decipher.setAAD(typeof aad === "string" ? Buffer.from(aad, "utf8") : aad);
    }
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Failed to decrypt: data may be corrupted or MASTER_KEY has changed");
  }
}

// src/routes/passwords.ts
var MAX_TITLE = 200;
var MAX_USERNAME = 200;
var MAX_URL = 2000;
var MAX_PASSWORD = 1e4;
var CRUD_RATE_LIMIT_WINDOW_MS = 60000;
var CRUD_RATE_LIMIT_CLEANUP_MS = 60000;
var crudAttempts = new Map;
function getCrudClientIP(ctx) {
  const server = ctx.server;
  if (server) {
    const addr = server.requestIP(ctx.request);
    if (addr)
      return addr.address;
  }
  return "unknown";
}
function checkCrudRateLimit(ctx, limit) {
  const ip = getCrudClientIP(ctx);
  const now = Date.now();
  const record = crudAttempts.get(ip);
  if (!record || record.resetAt < now) {
    crudAttempts.set(ip, { count: 1, resetAt: now + CRUD_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  record.count++;
  return { allowed: true };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of crudAttempts) {
    if (record.resetAt < now) {
      crudAttempts.delete(ip);
    }
  }
}, CRUD_RATE_LIMIT_CLEANUP_MS);
function sanitizeUrl(url) {
  if (!url)
    return "";
  const trimmed = url.trim();
  if (trimmed.length > MAX_URL)
    return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
    return "";
  } catch {
    return "";
  }
}
function auditLog(username, action, resourceId, detail) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp} ${username} ${action} ${resourceId ?? "-"} ${detail}`);
  logAudit(username, action, resourceId, detail);
}
function stripCtrl(s) {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}
function listPasswordsJson(ctx) {
  const rateCheck = checkCrudRateLimit(ctx, 60);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) }
    });
  }
  const entries = listPasswordsForGroups(ctx.userGroups);
  const result = entries.map((e) => ({
    id: e.id,
    title: e.title,
    username: e.username,
    url: e.url,
    group_cn: e.group_cn,
    encrypted: e.enc_password,
    iv: e.enc_iv,
    tag: e.enc_tag,
    created_at: e.created_at,
    updated_at: e.updated_at
  }));
  auditLog(ctx.username, "PASSWORD_LIST", null, `Listed ${result.length} passwords`);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
function decryptPasswordJson(ctx) {
  const rateCheck = checkCrudRateLimit(ctx, 60);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) }
    });
  }
  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const entry = getPasswordById(id);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!ctx.userGroups.includes(entry.group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this entry" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const password = decrypt({ data: entry.enc_password, iv: entry.enc_iv, tag: entry.enc_tag }, String(entry.id));
  auditLog(ctx.username, "PASSWORD_READ", id, `Decrypted password "${entry.title}" from group "${entry.group_cn}"`);
  return new Response(JSON.stringify({ id: entry.id, password }), {
    headers: { "Content-Type": "application/json" }
  });
}
async function createPasswordJson(ctx) {
  const rateCheck = checkCrudRateLimit(ctx, 20);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) }
    });
  }
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { title, username, url, password, group_cn } = body;
  if (!title || !username || !password || !group_cn) {
    return new Response(JSON.stringify({ error: "title, username, password, and group_cn are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (title.length > MAX_TITLE) {
    return new Response(JSON.stringify({ error: `title must be at most ${MAX_TITLE} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (username.length > MAX_USERNAME) {
    return new Response(JSON.stringify({ error: `username must be at most ${MAX_USERNAME} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if ((url || "").length > MAX_URL) {
    return new Response(JSON.stringify({ error: `url must be at most ${MAX_URL} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (password.length > MAX_PASSWORD) {
    return new Response(JSON.stringify({ error: `password must be at most ${MAX_PASSWORD} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!ctx.userGroups.includes(group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this group" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const cleanedTitle = stripCtrl(title.trim());
  const cleanedUsername = stripCtrl(username.trim());
  const cleanedUrl = sanitizeUrl(stripCtrl((url || "").trim()));
  const entry = createPassword({
    title: cleanedTitle,
    username: cleanedUsername,
    url: cleanedUrl,
    enc_password: "",
    enc_iv: "",
    enc_tag: "",
    group_cn
  });
  const encrypted = encrypt(password, String(entry.id));
  getDb().query("UPDATE passwords SET enc_password = ?, enc_iv = ?, enc_tag = ? WHERE id = ?").run(encrypted.data, encrypted.iv, encrypted.tag, entry.id);
  auditLog(ctx.username, "PASSWORD_CREATE", entry.id, `Created password "${cleanedTitle}" in group "${group_cn}"`);
  return new Response(JSON.stringify({ id: entry.id, title: entry.title, group_cn: entry.group_cn }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
function deletePasswordJson(ctx) {
  const rateCheck = checkCrudRateLimit(ctx, 20);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) }
    });
  }
  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const entry = getPasswordById(id);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!ctx.userGroups.includes(entry.group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this entry" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  deletePassword(id);
  auditLog(ctx.username, "PASSWORD_DELETE", id, `Deleted password "${entry.title}" from group "${entry.group_cn}"`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

// src/index.ts
var APP_NAME2 = () => getConfig().APP_NAME;
loadConfig();
getDb();
var router = new Router;
function securityHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  };
}
router.get("/", (ctx) => {
  const cookie = ctx.request.headers.get("Cookie");
  const match = cookie?.match(/\bsession=([a-f0-9]{64})\b/i);
  if (match) {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  }
  if (cookie?.match(/\bsession=/)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response(null, { status: 302, headers: { Location: "/login" } });
});
router.get("/login", getLoginPage);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/dashboard", requireSession((ctx) => {
  const groupsJson = JSON.stringify(ctx.userGroups).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(APP_NAME2())}</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="topbar">
    <span class="app-name">${escapeHtml(APP_NAME2())}</span>
    <span class="user-info">${escapeHtml(ctx.username)}</span>
    <form method="post" action="/logout" class="logout-form">
      <button type="submit" class="btn-logout">Log out</button>
    </form>
  </div>
  <div class="container">
    <h2>Passwords</h2>

    <button id="btn-toggle-add" class="btn-toggle">+ Add password</button>

    <div class="add-form" id="add-form" style="display:none">
      <h3>Add password</h3>
      <div class="form-row">
        <input type="text" id="f-title" placeholder="Title" autocomplete="off" required>
        <input type="text" id="f-username" placeholder="Username" autocomplete="off" required>
        <input type="text" id="f-url" placeholder="URL (optional)" autocomplete="off">
        <input type="password" id="f-password" placeholder="Password" autocomplete="new-password" required>
        <select id="f-group"></select>
        <button id="btn-add">Add</button>
      </div>
    </div>

    <table id="pw-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Username</th>
          <th>URL</th>
          <th>Group</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="pw-body"></tbody>
    </table>
  </div>

  <script>
    window.__GROUPS__ = ${groupsJson};
    (function() {
      // passwordMap: id -> plaintext password (never rendered).
      // Populated ONLY when the user explicitly requests decryption.
      var passwordMap = {};
      var groups = window.__GROUPS__ || [];

      // --- Populate the group dropdown ---
      var sel = document.getElementById("f-group");
      if (sel) {
        groups.forEach(function(g) {
          var opt = document.createElement("option");
          opt.value = g;
          opt.textContent = g;
          sel.appendChild(opt);
        });
      }

      // --- Escape HTML for safe rendering ---
      function esc(s) {
        if (s === null || s === undefined) return "";
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      // --- Render one row ---
      function makeRow(entry) {
        var tr = document.createElement("tr");
        var urlCell = entry.url
          ? '<a href="' + esc(entry.url) + '" target="_blank" rel="noopener noreferrer">' + esc(entry.url) + "</a>"
          : "";
        tr.innerHTML =
          "<td>" + esc(entry.title) + "</td>" +
          "<td>" + esc(entry.username) + "</td>" +
          '<td class="url-cell">' + urlCell + "</td>" +
          "<td>" + esc(entry.group_cn) + "</td>" +
          "<td>" +
            '<button class="btn-decrypt" data-id="' + entry.id + '">Show</button>' +
            '<button class="btn-copy" data-id="' + entry.id + '" disabled>Copy</button>' +
            '<button class="btn-del" data-id="' + entry.id + '">Delete</button>' +
          "</td>";
        return tr;
      }

      // --- On-demand decryption ---
      async function fetchDecrypted(entryId) {
        if (passwordMap[entryId] !== undefined) return passwordMap[entryId];
        var res = await fetch("/api/passwords/" + entryId + "/decrypt");
        if (!res.ok) {
          var b = await res.json().catch(function() { return {}; });
          throw new Error(b.error || "Decrypt failed");
        }
        var data = await res.json();
        passwordMap[entryId] = data.password;
        return data.password;
      }

      // --- Bind row actions ---
      function bindRowActions(tr, entry) {
        var decryptBtn = tr.querySelector(".btn-decrypt");
        var copyBtn = tr.querySelector(".btn-copy");
        var delBtn = tr.querySelector(".btn-del");

        decryptBtn.addEventListener("click", async function() {
          decryptBtn.disabled = true;
          decryptBtn.textContent = "\u2026";
          try {
            await fetchDecrypted(entry.id);
            decryptBtn.textContent = "Shown";
            copyBtn.disabled = false;
            copyBtn.textContent = "Copy";
          } catch (e) {
            decryptBtn.textContent = "Retry";
            alert(e.message || "Failed to decrypt");
          }
        });

        copyBtn.addEventListener("click", async function() {
          var pw = passwordMap[entry.id];
          if (pw === undefined) { copyBtn.textContent = "Unavailable"; return; }
          try {
            await navigator.clipboard.writeText(pw);
            copyBtn.textContent = "Copied!";
            setTimeout(function() { copyBtn.textContent = "Copy"; }, 2000);
          } catch (e) {
            copyBtn.textContent = "Error";
          }
        });

        delBtn.addEventListener("click", async function() {
          if (!confirm("Delete this password?")) return;
          var res = await fetch("/api/passwords/" + entry.id, { method: "DELETE", headers: { "Content-Type": "application/json" } });
          if (res.ok) {
            delete passwordMap[entry.id];
            loadPasswords();
          } else {
            var b = await res.json();
            alert(b.error || "Delete failed");
          }
        });
      }

      // --- Load the password table (encrypted blobs only) ---
      async function loadPasswords() {
        var res = await fetch("/api/passwords");
        if (!res.ok) {
          document.getElementById("pw-body").innerHTML = '<tr><td colspan="5">Failed to load</td></tr>';
          return;
        }
        var data = await res.json();
        // Keep cached decryptions for entries that still exist; drop removed ones
        var ids = {};
        data.forEach(function(e) { ids[e.id] = true; });
        Object.keys(passwordMap).forEach(function(id) {
          if (!ids[id]) delete passwordMap[id];
        });

        var tbody = document.getElementById("pw-body");
        tbody.innerHTML = "";
        data.forEach(function(entry) {
          var tr = makeRow(entry);
          bindRowActions(tr, entry);
          tbody.appendChild(tr);
        });
      }

      // --- Toggle the add form ---
      var form = document.getElementById("add-form");
      var toggleBtn = document.getElementById("btn-toggle-add");
      if (form && toggleBtn) {
        form.style.display = "none";
        toggleBtn.addEventListener("click", function() {
          if (form.style.display === "none" || form.style.display === "") {
            form.style.display = "block";
            toggleBtn.textContent = "\u2212 Cancel";
          } else {
            form.style.display = "none";
            toggleBtn.textContent = "+ Add password";
          }
        });
      }

      // --- Add a new password ---
      var addBtn = document.getElementById("btn-add");
      if (addBtn) {
        addBtn.addEventListener("click", async function() {
          var title = document.getElementById("f-title").value.trim();
          var username = document.getElementById("f-username").value.trim();
          var url = document.getElementById("f-url").value.trim();
          var password = document.getElementById("f-password").value.trim();
          var group_cn = document.getElementById("f-group").value;
          if (!title || !username || !password) { alert("Title, username, and password are required"); return; }
          var res = await fetch("/api/passwords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title, username: username, url: url, password: password, group_cn: group_cn }),
          });
          if (res.ok) {
            document.getElementById("f-title").value = "";
            document.getElementById("f-username").value = "";
            document.getElementById("f-url").value = "";
            document.getElementById("f-password").value = "";
            loadPasswords();
          } else {
            var b = await res.json();
            alert(b.error || "Failed to add");
          }
        });
      }

      // Initial load
      loadPasswords();
    })();
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      ...securityHeaders("text/html; charset=utf-8"),
      "Cache-Control": "no-cache, no-store",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'strict-dynamic'; object-src 'none'; frame-ancestors 'none'"
    }
  });
}));
router.get("/api/passwords", requireSessionJson(listPasswordsJson));
router.post("/api/passwords", requireSessionJson(createPasswordJson));
router.get("/api/passwords/:id/decrypt", requireSessionJson(decryptPasswordJson));
router.delete("/api/passwords/:id", requireSessionJson(deletePasswordJson));
router.get("/styles.css", () => {
  const file = Bun.file("public/styles.css");
  return new Response(file, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    }
  });
});
router.get("/dashboard.js", () => {
  const file = Bun.file("public/dashboard.js");
  return new Response(file, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    }
  });
});
router.get("/login.js", () => {
  const file = Bun.file("public/login.js");
  return new Response(file, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    }
  });
});
var cfg = getConfig();
var server = Bun.serve({
  port: cfg.PORT,
  async fetch(request, server) {
    const response = await router.resolve(request, server);
    if (response)
      return response;
    return new Response("Not found", { status: 404 });
  }
});
console.log(`${APP_NAME2()} running on http://localhost:${server.port}`);
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
