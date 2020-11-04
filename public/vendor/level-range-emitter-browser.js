(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.LevelRangeEmitter = f() } })(function () {
  var define, module, exports; return (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
    1: [function (require, module, exports) {

      /**
       * Array#filter.
       *
       * @param {Array} arr
       * @param {Function} fn
       * @param {Object=} self
       * @return {Array}
       * @throw TypeError
       */

      module.exports = function (arr, fn, self) {
        if (arr.filter) return arr.filter(fn, self);
        if (void 0 === arr || null === arr) throw new TypeError;
        if ('function' != typeof fn) throw new TypeError;
        var ret = [];
        for (var i = 0; i < arr.length; i++) {
          if (!hasOwn.call(arr, i)) continue;
          var val = arr[i];
          if (fn.call(self, val, i, arr)) ret.push(val);
        }
        return ret;
      };

      var hasOwn = Object.prototype.hasOwnProperty;

    }, {}], 2: [function (require, module, exports) {
      (function (global) {
        (function () {
          'use strict';

          var filter = require('array-filter');

          module.exports = function availableTypedArrays() {
            return filter([
              'BigInt64Array',
              'BigUint64Array',
              'Float32Array',
              'Float64Array',
              'Int16Array',
              'Int32Array',
              'Int8Array',
              'Uint16Array',
              'Uint32Array',
              'Uint8Array',
              'Uint8ClampedArray'
            ], function (typedArray) {
              return typeof global[typedArray] === 'function';
            });
          };

        }).call(this)
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "array-filter": 1 }], 3: [function (require, module, exports) {
      'use strict'

      exports.byteLength = byteLength
      exports.toByteArray = toByteArray
      exports.fromByteArray = fromByteArray

      var lookup = []
      var revLookup = []
      var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

      var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      for (var i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i]
        revLookup[code.charCodeAt(i)] = i
      }

      // Support decoding URL-safe base64 strings, as Node.js does.
      // See: https://en.wikipedia.org/wiki/Base64#URL_applications
      revLookup['-'.charCodeAt(0)] = 62
      revLookup['_'.charCodeAt(0)] = 63

      function getLens(b64) {
        var len = b64.length

        if (len % 4 > 0) {
          throw new Error('Invalid string. Length must be a multiple of 4')
        }

        // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42
        var validLen = b64.indexOf('=')
        if (validLen === -1) validLen = len

        var placeHoldersLen = validLen === len
          ? 0
          : 4 - (validLen % 4)

        return [validLen, placeHoldersLen]
      }

      // base64 is 4/3 + up to two characters of the original data
      function byteLength(b64) {
        var lens = getLens(b64)
        var validLen = lens[0]
        var placeHoldersLen = lens[1]
        return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
      }

      function _byteLength(b64, validLen, placeHoldersLen) {
        return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
      }

      function toByteArray(b64) {
        var tmp
        var lens = getLens(b64)
        var validLen = lens[0]
        var placeHoldersLen = lens[1]

        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

        var curByte = 0

        // if there are placeholders, only get up to the last complete 4 chars
        var len = placeHoldersLen > 0
          ? validLen - 4
          : validLen

        var i
        for (i = 0; i < len; i += 4) {
          tmp =
            (revLookup[b64.charCodeAt(i)] << 18) |
            (revLookup[b64.charCodeAt(i + 1)] << 12) |
            (revLookup[b64.charCodeAt(i + 2)] << 6) |
            revLookup[b64.charCodeAt(i + 3)]
          arr[curByte++] = (tmp >> 16) & 0xFF
          arr[curByte++] = (tmp >> 8) & 0xFF
          arr[curByte++] = tmp & 0xFF
        }

        if (placeHoldersLen === 2) {
          tmp =
            (revLookup[b64.charCodeAt(i)] << 2) |
            (revLookup[b64.charCodeAt(i + 1)] >> 4)
          arr[curByte++] = tmp & 0xFF
        }

        if (placeHoldersLen === 1) {
          tmp =
            (revLookup[b64.charCodeAt(i)] << 10) |
            (revLookup[b64.charCodeAt(i + 1)] << 4) |
            (revLookup[b64.charCodeAt(i + 2)] >> 2)
          arr[curByte++] = (tmp >> 8) & 0xFF
          arr[curByte++] = tmp & 0xFF
        }

        return arr
      }

      function tripletToBase64(num) {
        return lookup[num >> 18 & 0x3F] +
          lookup[num >> 12 & 0x3F] +
          lookup[num >> 6 & 0x3F] +
          lookup[num & 0x3F]
      }

      function encodeChunk(uint8, start, end) {
        var tmp
        var output = []
        for (var i = start; i < end; i += 3) {
          tmp =
            ((uint8[i] << 16) & 0xFF0000) +
            ((uint8[i + 1] << 8) & 0xFF00) +
            (uint8[i + 2] & 0xFF)
          output.push(tripletToBase64(tmp))
        }
        return output.join('')
      }

      function fromByteArray(uint8) {
        var tmp
        var len = uint8.length
        var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
        var parts = []
        var maxChunkLength = 16383 // must be multiple of 3

        // go through the array every three bytes, we'll deal with trailing stuff later
        for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
          parts.push(encodeChunk(
            uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
          ))
        }

        // pad the end with zeros, but make sure to not forget the extra bytes
        if (extraBytes === 1) {
          tmp = uint8[len - 1]
          parts.push(
            lookup[tmp >> 2] +
            lookup[(tmp << 4) & 0x3F] +
            '=='
          )
        } else if (extraBytes === 2) {
          tmp = (uint8[len - 2] << 8) + uint8[len - 1]
          parts.push(
            lookup[tmp >> 10] +
            lookup[(tmp >> 4) & 0x3F] +
            lookup[(tmp << 2) & 0x3F] +
            '='
          )
        }

        return parts.join('')
      }

    }, {}], 4: [function (require, module, exports) {

    }, {}], 5: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          /*!
           * The buffer module from node.js, for the browser.
           *
           * @author   Feross Aboukhadijeh <https://feross.org>
           * @license  MIT
           */
          /* eslint-disable no-proto */

          'use strict'

          var base64 = require('base64-js')
          var ieee754 = require('ieee754')

          exports.Buffer = Buffer
          exports.SlowBuffer = SlowBuffer
          exports.INSPECT_MAX_BYTES = 50

          var K_MAX_LENGTH = 0x7fffffff
          exports.kMaxLength = K_MAX_LENGTH

          /**
           * If `Buffer.TYPED_ARRAY_SUPPORT`:
           *   === true    Use Uint8Array implementation (fastest)
           *   === false   Print warning and recommend using `buffer` v4.x which has an Object
           *               implementation (most compatible, even IE6)
           *
           * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
           * Opera 11.6+, iOS 4.2+.
           *
           * We report that the browser does not support typed arrays if the are not subclassable
           * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
           * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
           * for __proto__ and has a buggy typed array implementation.
           */
          Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

          if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
            typeof console.error === 'function') {
            console.error(
              'This browser lacks typed array (Uint8Array) support which is required by ' +
              '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
            )
          }

          function typedArraySupport() {
            // Can typed array instances can be augmented?
            try {
              var arr = new Uint8Array(1)
              arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
              return arr.foo() === 42
            } catch (e) {
              return false
            }
          }

          Object.defineProperty(Buffer.prototype, 'parent', {
            enumerable: true,
            get: function () {
              if (!Buffer.isBuffer(this)) return undefined
              return this.buffer
            }
          })

          Object.defineProperty(Buffer.prototype, 'offset', {
            enumerable: true,
            get: function () {
              if (!Buffer.isBuffer(this)) return undefined
              return this.byteOffset
            }
          })

          function createBuffer(length) {
            if (length > K_MAX_LENGTH) {
              throw new RangeError('The value "' + length + '" is invalid for option "size"')
            }
            // Return an augmented `Uint8Array` instance
            var buf = new Uint8Array(length)
            buf.__proto__ = Buffer.prototype
            return buf
          }

          /**
           * The Buffer constructor returns instances of `Uint8Array` that have their
           * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
           * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
           * and the `Uint8Array` methods. Square bracket notation works as expected -- it
           * returns a single octet.
           *
           * The `Uint8Array` prototype remains unmodified.
           */

          function Buffer(arg, encodingOrOffset, length) {
            // Common case.
            if (typeof arg === 'number') {
              if (typeof encodingOrOffset === 'string') {
                throw new TypeError(
                  'The "string" argument must be of type string. Received type number'
                )
              }
              return allocUnsafe(arg)
            }
            return from(arg, encodingOrOffset, length)
          }

          // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
          if (typeof Symbol !== 'undefined' && Symbol.species != null &&
            Buffer[Symbol.species] === Buffer) {
            Object.defineProperty(Buffer, Symbol.species, {
              value: null,
              configurable: true,
              enumerable: false,
              writable: false
            })
          }

          Buffer.poolSize = 8192 // not used by this implementation

          function from(value, encodingOrOffset, length) {
            if (typeof value === 'string') {
              return fromString(value, encodingOrOffset)
            }

            if (ArrayBuffer.isView(value)) {
              return fromArrayLike(value)
            }

            if (value == null) {
              throw TypeError(
                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                'or Array-like Object. Received type ' + (typeof value)
              )
            }

            if (isInstance(value, ArrayBuffer) ||
              (value && isInstance(value.buffer, ArrayBuffer))) {
              return fromArrayBuffer(value, encodingOrOffset, length)
            }

            if (typeof value === 'number') {
              throw new TypeError(
                'The "value" argument must not be of type number. Received type number'
              )
            }

            var valueOf = value.valueOf && value.valueOf()
            if (valueOf != null && valueOf !== value) {
              return Buffer.from(valueOf, encodingOrOffset, length)
            }

            var b = fromObject(value)
            if (b) return b

            if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
              typeof value[Symbol.toPrimitive] === 'function') {
              return Buffer.from(
                value[Symbol.toPrimitive]('string'), encodingOrOffset, length
              )
            }

            throw new TypeError(
              'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
              'or Array-like Object. Received type ' + (typeof value)
            )
          }

          /**
           * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
           * if value is a number.
           * Buffer.from(str[, encoding])
           * Buffer.from(array)
           * Buffer.from(buffer)
           * Buffer.from(arrayBuffer[, byteOffset[, length]])
           **/
          Buffer.from = function (value, encodingOrOffset, length) {
            return from(value, encodingOrOffset, length)
          }

          // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
          // https://github.com/feross/buffer/pull/148
          Buffer.prototype.__proto__ = Uint8Array.prototype
          Buffer.__proto__ = Uint8Array

          function assertSize(size) {
            if (typeof size !== 'number') {
              throw new TypeError('"size" argument must be of type number')
            } else if (size < 0) {
              throw new RangeError('The value "' + size + '" is invalid for option "size"')
            }
          }

          function alloc(size, fill, encoding) {
            assertSize(size)
            if (size <= 0) {
              return createBuffer(size)
            }
            if (fill !== undefined) {
              // Only pay attention to encoding if it's a string. This
              // prevents accidentally sending in a number that would
              // be interpretted as a start offset.
              return typeof encoding === 'string'
                ? createBuffer(size).fill(fill, encoding)
                : createBuffer(size).fill(fill)
            }
            return createBuffer(size)
          }

          /**
           * Creates a new filled Buffer instance.
           * alloc(size[, fill[, encoding]])
           **/
          Buffer.alloc = function (size, fill, encoding) {
            return alloc(size, fill, encoding)
          }

          function allocUnsafe(size) {
            assertSize(size)
            return createBuffer(size < 0 ? 0 : checked(size) | 0)
          }

          /**
           * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
           * */
          Buffer.allocUnsafe = function (size) {
            return allocUnsafe(size)
          }
          /**
           * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
           */
          Buffer.allocUnsafeSlow = function (size) {
            return allocUnsafe(size)
          }

          function fromString(string, encoding) {
            if (typeof encoding !== 'string' || encoding === '') {
              encoding = 'utf8'
            }

            if (!Buffer.isEncoding(encoding)) {
              throw new TypeError('Unknown encoding: ' + encoding)
            }

            var length = byteLength(string, encoding) | 0
            var buf = createBuffer(length)

            var actual = buf.write(string, encoding)

            if (actual !== length) {
              // Writing a hex string, for example, that contains invalid characters will
              // cause everything after the first invalid character to be ignored. (e.g.
              // 'abxxcd' will be treated as 'ab')
              buf = buf.slice(0, actual)
            }

            return buf
          }

          function fromArrayLike(array) {
            var length = array.length < 0 ? 0 : checked(array.length) | 0
            var buf = createBuffer(length)
            for (var i = 0; i < length; i += 1) {
              buf[i] = array[i] & 255
            }
            return buf
          }

          function fromArrayBuffer(array, byteOffset, length) {
            if (byteOffset < 0 || array.byteLength < byteOffset) {
              throw new RangeError('"offset" is outside of buffer bounds')
            }

            if (array.byteLength < byteOffset + (length || 0)) {
              throw new RangeError('"length" is outside of buffer bounds')
            }

            var buf
            if (byteOffset === undefined && length === undefined) {
              buf = new Uint8Array(array)
            } else if (length === undefined) {
              buf = new Uint8Array(array, byteOffset)
            } else {
              buf = new Uint8Array(array, byteOffset, length)
            }

            // Return an augmented `Uint8Array` instance
            buf.__proto__ = Buffer.prototype
            return buf
          }

          function fromObject(obj) {
            if (Buffer.isBuffer(obj)) {
              var len = checked(obj.length) | 0
              var buf = createBuffer(len)

              if (buf.length === 0) {
                return buf
              }

              obj.copy(buf, 0, 0, len)
              return buf
            }

            if (obj.length !== undefined) {
              if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                return createBuffer(0)
              }
              return fromArrayLike(obj)
            }

            if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
              return fromArrayLike(obj.data)
            }
          }

          function checked(length) {
            // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
            // length is NaN (which is otherwise coerced to zero.)
            if (length >= K_MAX_LENGTH) {
              throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
            }
            return length | 0
          }

          function SlowBuffer(length) {
            if (+length != length) { // eslint-disable-line eqeqeq
              length = 0
            }
            return Buffer.alloc(+length)
          }

          Buffer.isBuffer = function isBuffer(b) {
            return b != null && b._isBuffer === true &&
              b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
          }

          Buffer.compare = function compare(a, b) {
            if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
            if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
            if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
              throw new TypeError(
                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
              )
            }

            if (a === b) return 0

            var x = a.length
            var y = b.length

            for (var i = 0, len = Math.min(x, y); i < len; ++i) {
              if (a[i] !== b[i]) {
                x = a[i]
                y = b[i]
                break
              }
            }

            if (x < y) return -1
            if (y < x) return 1
            return 0
          }

          Buffer.isEncoding = function isEncoding(encoding) {
            switch (String(encoding).toLowerCase()) {
              case 'hex':
              case 'utf8':
              case 'utf-8':
              case 'ascii':
              case 'latin1':
              case 'binary':
              case 'base64':
              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return true
              default:
                return false
            }
          }

          Buffer.concat = function concat(list, length) {
            if (!Array.isArray(list)) {
              throw new TypeError('"list" argument must be an Array of Buffers')
            }

            if (list.length === 0) {
              return Buffer.alloc(0)
            }

            var i
            if (length === undefined) {
              length = 0
              for (i = 0; i < list.length; ++i) {
                length += list[i].length
              }
            }

            var buffer = Buffer.allocUnsafe(length)
            var pos = 0
            for (i = 0; i < list.length; ++i) {
              var buf = list[i]
              if (isInstance(buf, Uint8Array)) {
                buf = Buffer.from(buf)
              }
              if (!Buffer.isBuffer(buf)) {
                throw new TypeError('"list" argument must be an Array of Buffers')
              }
              buf.copy(buffer, pos)
              pos += buf.length
            }
            return buffer
          }

          function byteLength(string, encoding) {
            if (Buffer.isBuffer(string)) {
              return string.length
            }
            if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
              return string.byteLength
            }
            if (typeof string !== 'string') {
              throw new TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                'Received type ' + typeof string
              )
            }

            var len = string.length
            var mustMatch = (arguments.length > 2 && arguments[2] === true)
            if (!mustMatch && len === 0) return 0

            // Use a for loop to avoid recursion
            var loweredCase = false
            for (; ;) {
              switch (encoding) {
                case 'ascii':
                case 'latin1':
                case 'binary':
                  return len
                case 'utf8':
                case 'utf-8':
                  return utf8ToBytes(string).length
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return len * 2
                case 'hex':
                  return len >>> 1
                case 'base64':
                  return base64ToBytes(string).length
                default:
                  if (loweredCase) {
                    return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
                  }
                  encoding = ('' + encoding).toLowerCase()
                  loweredCase = true
              }
            }
          }
          Buffer.byteLength = byteLength

          function slowToString(encoding, start, end) {
            var loweredCase = false

            // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
            // property of a typed array.

            // This behaves neither like String nor Uint8Array in that we set start/end
            // to their upper/lower bounds if the value passed is out of range.
            // undefined is handled specially as per ECMA-262 6th Edition,
            // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
            if (start === undefined || start < 0) {
              start = 0
            }
            // Return early if start > this.length. Done here to prevent potential uint32
            // coercion fail below.
            if (start > this.length) {
              return ''
            }

            if (end === undefined || end > this.length) {
              end = this.length
            }

            if (end <= 0) {
              return ''
            }

            // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
            end >>>= 0
            start >>>= 0

            if (end <= start) {
              return ''
            }

            if (!encoding) encoding = 'utf8'

            while (true) {
              switch (encoding) {
                case 'hex':
                  return hexSlice(this, start, end)

                case 'utf8':
                case 'utf-8':
                  return utf8Slice(this, start, end)

                case 'ascii':
                  return asciiSlice(this, start, end)

                case 'latin1':
                case 'binary':
                  return latin1Slice(this, start, end)

                case 'base64':
                  return base64Slice(this, start, end)

                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return utf16leSlice(this, start, end)

                default:
                  if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                  encoding = (encoding + '').toLowerCase()
                  loweredCase = true
              }
            }
          }

          // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
          // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
          // reliably in a browserify context because there could be multiple different
          // copies of the 'buffer' package in use. This method works even for Buffer
          // instances that were created from another copy of the `buffer` package.
          // See: https://github.com/feross/buffer/issues/154
          Buffer.prototype._isBuffer = true

          function swap(b, n, m) {
            var i = b[n]
            b[n] = b[m]
            b[m] = i
          }

          Buffer.prototype.swap16 = function swap16() {
            var len = this.length
            if (len % 2 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 16-bits')
            }
            for (var i = 0; i < len; i += 2) {
              swap(this, i, i + 1)
            }
            return this
          }

          Buffer.prototype.swap32 = function swap32() {
            var len = this.length
            if (len % 4 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 32-bits')
            }
            for (var i = 0; i < len; i += 4) {
              swap(this, i, i + 3)
              swap(this, i + 1, i + 2)
            }
            return this
          }

          Buffer.prototype.swap64 = function swap64() {
            var len = this.length
            if (len % 8 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 64-bits')
            }
            for (var i = 0; i < len; i += 8) {
              swap(this, i, i + 7)
              swap(this, i + 1, i + 6)
              swap(this, i + 2, i + 5)
              swap(this, i + 3, i + 4)
            }
            return this
          }

          Buffer.prototype.toString = function toString() {
            var length = this.length
            if (length === 0) return ''
            if (arguments.length === 0) return utf8Slice(this, 0, length)
            return slowToString.apply(this, arguments)
          }

          Buffer.prototype.toLocaleString = Buffer.prototype.toString

          Buffer.prototype.equals = function equals(b) {
            if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
            if (this === b) return true
            return Buffer.compare(this, b) === 0
          }

          Buffer.prototype.inspect = function inspect() {
            var str = ''
            var max = exports.INSPECT_MAX_BYTES
            str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
            if (this.length > max) str += ' ... '
            return '<Buffer ' + str + '>'
          }

          Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
            if (isInstance(target, Uint8Array)) {
              target = Buffer.from(target, target.offset, target.byteLength)
            }
            if (!Buffer.isBuffer(target)) {
              throw new TypeError(
                'The "target" argument must be one of type Buffer or Uint8Array. ' +
                'Received type ' + (typeof target)
              )
            }

            if (start === undefined) {
              start = 0
            }
            if (end === undefined) {
              end = target ? target.length : 0
            }
            if (thisStart === undefined) {
              thisStart = 0
            }
            if (thisEnd === undefined) {
              thisEnd = this.length
            }

            if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
              throw new RangeError('out of range index')
            }

            if (thisStart >= thisEnd && start >= end) {
              return 0
            }
            if (thisStart >= thisEnd) {
              return -1
            }
            if (start >= end) {
              return 1
            }

            start >>>= 0
            end >>>= 0
            thisStart >>>= 0
            thisEnd >>>= 0

            if (this === target) return 0

            var x = thisEnd - thisStart
            var y = end - start
            var len = Math.min(x, y)

            var thisCopy = this.slice(thisStart, thisEnd)
            var targetCopy = target.slice(start, end)

            for (var i = 0; i < len; ++i) {
              if (thisCopy[i] !== targetCopy[i]) {
                x = thisCopy[i]
                y = targetCopy[i]
                break
              }
            }

            if (x < y) return -1
            if (y < x) return 1
            return 0
          }

          // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
          // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
          //
          // Arguments:
          // - buffer - a Buffer to search
          // - val - a string, Buffer, or number
          // - byteOffset - an index into `buffer`; will be clamped to an int32
          // - encoding - an optional encoding, relevant is val is a string
          // - dir - true for indexOf, false for lastIndexOf
          function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
            // Empty buffer means no match
            if (buffer.length === 0) return -1

            // Normalize byteOffset
            if (typeof byteOffset === 'string') {
              encoding = byteOffset
              byteOffset = 0
            } else if (byteOffset > 0x7fffffff) {
              byteOffset = 0x7fffffff
            } else if (byteOffset < -0x80000000) {
              byteOffset = -0x80000000
            }
            byteOffset = +byteOffset // Coerce to Number.
            if (numberIsNaN(byteOffset)) {
              // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
              byteOffset = dir ? 0 : (buffer.length - 1)
            }

            // Normalize byteOffset: negative offsets start from the end of the buffer
            if (byteOffset < 0) byteOffset = buffer.length + byteOffset
            if (byteOffset >= buffer.length) {
              if (dir) return -1
              else byteOffset = buffer.length - 1
            } else if (byteOffset < 0) {
              if (dir) byteOffset = 0
              else return -1
            }

            // Normalize val
            if (typeof val === 'string') {
              val = Buffer.from(val, encoding)
            }

            // Finally, search either indexOf (if dir is true) or lastIndexOf
            if (Buffer.isBuffer(val)) {
              // Special case: looking for empty string/buffer always fails
              if (val.length === 0) {
                return -1
              }
              return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
            } else if (typeof val === 'number') {
              val = val & 0xFF // Search for a byte value [0-255]
              if (typeof Uint8Array.prototype.indexOf === 'function') {
                if (dir) {
                  return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                } else {
                  return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                }
              }
              return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
            }

            throw new TypeError('val must be string, number or Buffer')
          }

          function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
            var indexSize = 1
            var arrLength = arr.length
            var valLength = val.length

            if (encoding !== undefined) {
              encoding = String(encoding).toLowerCase()
              if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                encoding === 'utf16le' || encoding === 'utf-16le') {
                if (arr.length < 2 || val.length < 2) {
                  return -1
                }
                indexSize = 2
                arrLength /= 2
                valLength /= 2
                byteOffset /= 2
              }
            }

            function read(buf, i) {
              if (indexSize === 1) {
                return buf[i]
              } else {
                return buf.readUInt16BE(i * indexSize)
              }
            }

            var i
            if (dir) {
              var foundIndex = -1
              for (i = byteOffset; i < arrLength; i++) {
                if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                  if (foundIndex === -1) foundIndex = i
                  if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                } else {
                  if (foundIndex !== -1) i -= i - foundIndex
                  foundIndex = -1
                }
              }
            } else {
              if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
              for (i = byteOffset; i >= 0; i--) {
                var found = true
                for (var j = 0; j < valLength; j++) {
                  if (read(arr, i + j) !== read(val, j)) {
                    found = false
                    break
                  }
                }
                if (found) return i
              }
            }

            return -1
          }

          Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
            return this.indexOf(val, byteOffset, encoding) !== -1
          }

          Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
          }

          Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
          }

          function hexWrite(buf, string, offset, length) {
            offset = Number(offset) || 0
            var remaining = buf.length - offset
            if (!length) {
              length = remaining
            } else {
              length = Number(length)
              if (length > remaining) {
                length = remaining
              }
            }

            var strLen = string.length

            if (length > strLen / 2) {
              length = strLen / 2
            }
            for (var i = 0; i < length; ++i) {
              var parsed = parseInt(string.substr(i * 2, 2), 16)
              if (numberIsNaN(parsed)) return i
              buf[offset + i] = parsed
            }
            return i
          }

          function utf8Write(buf, string, offset, length) {
            return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
          }

          function asciiWrite(buf, string, offset, length) {
            return blitBuffer(asciiToBytes(string), buf, offset, length)
          }

          function latin1Write(buf, string, offset, length) {
            return asciiWrite(buf, string, offset, length)
          }

          function base64Write(buf, string, offset, length) {
            return blitBuffer(base64ToBytes(string), buf, offset, length)
          }

          function ucs2Write(buf, string, offset, length) {
            return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
          }

          Buffer.prototype.write = function write(string, offset, length, encoding) {
            // Buffer#write(string)
            if (offset === undefined) {
              encoding = 'utf8'
              length = this.length
              offset = 0
              // Buffer#write(string, encoding)
            } else if (length === undefined && typeof offset === 'string') {
              encoding = offset
              length = this.length
              offset = 0
              // Buffer#write(string, offset[, length][, encoding])
            } else if (isFinite(offset)) {
              offset = offset >>> 0
              if (isFinite(length)) {
                length = length >>> 0
                if (encoding === undefined) encoding = 'utf8'
              } else {
                encoding = length
                length = undefined
              }
            } else {
              throw new Error(
                'Buffer.write(string, encoding, offset[, length]) is no longer supported'
              )
            }

            var remaining = this.length - offset
            if (length === undefined || length > remaining) length = remaining

            if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
              throw new RangeError('Attempt to write outside buffer bounds')
            }

            if (!encoding) encoding = 'utf8'

            var loweredCase = false
            for (; ;) {
              switch (encoding) {
                case 'hex':
                  return hexWrite(this, string, offset, length)

                case 'utf8':
                case 'utf-8':
                  return utf8Write(this, string, offset, length)

                case 'ascii':
                  return asciiWrite(this, string, offset, length)

                case 'latin1':
                case 'binary':
                  return latin1Write(this, string, offset, length)

                case 'base64':
                  // Warning: maxLength not taken into account in base64Write
                  return base64Write(this, string, offset, length)

                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return ucs2Write(this, string, offset, length)

                default:
                  if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                  encoding = ('' + encoding).toLowerCase()
                  loweredCase = true
              }
            }
          }

          Buffer.prototype.toJSON = function toJSON() {
            return {
              type: 'Buffer',
              data: Array.prototype.slice.call(this._arr || this, 0)
            }
          }

          function base64Slice(buf, start, end) {
            if (start === 0 && end === buf.length) {
              return base64.fromByteArray(buf)
            } else {
              return base64.fromByteArray(buf.slice(start, end))
            }
          }

          function utf8Slice(buf, start, end) {
            end = Math.min(buf.length, end)
            var res = []

            var i = start
            while (i < end) {
              var firstByte = buf[i]
              var codePoint = null
              var bytesPerSequence = (firstByte > 0xEF) ? 4
                : (firstByte > 0xDF) ? 3
                  : (firstByte > 0xBF) ? 2
                    : 1

              if (i + bytesPerSequence <= end) {
                var secondByte, thirdByte, fourthByte, tempCodePoint

                switch (bytesPerSequence) {
                  case 1:
                    if (firstByte < 0x80) {
                      codePoint = firstByte
                    }
                    break
                  case 2:
                    secondByte = buf[i + 1]
                    if ((secondByte & 0xC0) === 0x80) {
                      tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                      if (tempCodePoint > 0x7F) {
                        codePoint = tempCodePoint
                      }
                    }
                    break
                  case 3:
                    secondByte = buf[i + 1]
                    thirdByte = buf[i + 2]
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                      tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                      if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                        codePoint = tempCodePoint
                      }
                    }
                    break
                  case 4:
                    secondByte = buf[i + 1]
                    thirdByte = buf[i + 2]
                    fourthByte = buf[i + 3]
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                      tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                      if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                        codePoint = tempCodePoint
                      }
                    }
                }
              }

              if (codePoint === null) {
                // we did not generate a valid codePoint so insert a
                // replacement char (U+FFFD) and advance only 1 byte
                codePoint = 0xFFFD
                bytesPerSequence = 1
              } else if (codePoint > 0xFFFF) {
                // encode to utf16 (surrogate pair dance)
                codePoint -= 0x10000
                res.push(codePoint >>> 10 & 0x3FF | 0xD800)
                codePoint = 0xDC00 | codePoint & 0x3FF
              }

              res.push(codePoint)
              i += bytesPerSequence
            }

            return decodeCodePointsArray(res)
          }

          // Based on http://stackoverflow.com/a/22747272/680742, the browser with
          // the lowest limit is Chrome, with 0x10000 args.
          // We go 1 magnitude less, for safety
          var MAX_ARGUMENTS_LENGTH = 0x1000

          function decodeCodePointsArray(codePoints) {
            var len = codePoints.length
            if (len <= MAX_ARGUMENTS_LENGTH) {
              return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
            }

            // Decode in chunks to avoid "call stack size exceeded".
            var res = ''
            var i = 0
            while (i < len) {
              res += String.fromCharCode.apply(
                String,
                codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
              )
            }
            return res
          }

          function asciiSlice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; ++i) {
              ret += String.fromCharCode(buf[i] & 0x7F)
            }
            return ret
          }

          function latin1Slice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; ++i) {
              ret += String.fromCharCode(buf[i])
            }
            return ret
          }

          function hexSlice(buf, start, end) {
            var len = buf.length

            if (!start || start < 0) start = 0
            if (!end || end < 0 || end > len) end = len

            var out = ''
            for (var i = start; i < end; ++i) {
              out += toHex(buf[i])
            }
            return out
          }

          function utf16leSlice(buf, start, end) {
            var bytes = buf.slice(start, end)
            var res = ''
            for (var i = 0; i < bytes.length; i += 2) {
              res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
            }
            return res
          }

          Buffer.prototype.slice = function slice(start, end) {
            var len = this.length
            start = ~~start
            end = end === undefined ? len : ~~end

            if (start < 0) {
              start += len
              if (start < 0) start = 0
            } else if (start > len) {
              start = len
            }

            if (end < 0) {
              end += len
              if (end < 0) end = 0
            } else if (end > len) {
              end = len
            }

            if (end < start) end = start

            var newBuf = this.subarray(start, end)
            // Return an augmented `Uint8Array` instance
            newBuf.__proto__ = Buffer.prototype
            return newBuf
          }

          /*
           * Need to make sure that buffer isn't trying to write out of bounds.
           */
          function checkOffset(offset, ext, length) {
            if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
            if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
          }

          Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var val = this[offset]
            var mul = 1
            var i = 0
            while (++i < byteLength && (mul *= 0x100)) {
              val += this[offset + i] * mul
            }

            return val
          }

          Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
              checkOffset(offset, byteLength, this.length)
            }

            var val = this[offset + --byteLength]
            var mul = 1
            while (byteLength > 0 && (mul *= 0x100)) {
              val += this[offset + --byteLength] * mul
            }

            return val
          }

          Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 1, this.length)
            return this[offset]
          }

          Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            return this[offset] | (this[offset + 1] << 8)
          }

          Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            return (this[offset] << 8) | this[offset + 1]
          }

          Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return ((this[offset]) |
              (this[offset + 1] << 8) |
              (this[offset + 2] << 16)) +
              (this[offset + 3] * 0x1000000)
          }

          Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset] * 0x1000000) +
              ((this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3])
          }

          Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var val = this[offset]
            var mul = 1
            var i = 0
            while (++i < byteLength && (mul *= 0x100)) {
              val += this[offset + i] * mul
            }
            mul *= 0x80

            if (val >= mul) val -= Math.pow(2, 8 * byteLength)

            return val
          }

          Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var i = byteLength
            var mul = 1
            var val = this[offset + --i]
            while (i > 0 && (mul *= 0x100)) {
              val += this[offset + --i] * mul
            }
            mul *= 0x80

            if (val >= mul) val -= Math.pow(2, 8 * byteLength)

            return val
          }

          Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 1, this.length)
            if (!(this[offset] & 0x80)) return (this[offset])
            return ((0xff - this[offset] + 1) * -1)
          }

          Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            var val = this[offset] | (this[offset + 1] << 8)
            return (val & 0x8000) ? val | 0xFFFF0000 : val
          }

          Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            var val = this[offset + 1] | (this[offset] << 8)
            return (val & 0x8000) ? val | 0xFFFF0000 : val
          }

          Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset]) |
              (this[offset + 1] << 8) |
              (this[offset + 2] << 16) |
              (this[offset + 3] << 24)
          }

          Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset] << 24) |
              (this[offset + 1] << 16) |
              (this[offset + 2] << 8) |
              (this[offset + 3])
          }

          Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)
            return ieee754.read(this, offset, true, 23, 4)
          }

          Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)
            return ieee754.read(this, offset, false, 23, 4)
          }

          Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 8, this.length)
            return ieee754.read(this, offset, true, 52, 8)
          }

          Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 8, this.length)
            return ieee754.read(this, offset, false, 52, 8)
          }

          function checkInt(buf, value, offset, ext, max, min) {
            if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
            if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
            if (offset + ext > buf.length) throw new RangeError('Index out of range')
          }

          Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
              var maxBytes = Math.pow(2, 8 * byteLength) - 1
              checkInt(this, value, offset, byteLength, maxBytes, 0)
            }

            var mul = 1
            var i = 0
            this[offset] = value & 0xFF
            while (++i < byteLength && (mul *= 0x100)) {
              this[offset + i] = (value / mul) & 0xFF
            }

            return offset + byteLength
          }

          Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
              var maxBytes = Math.pow(2, 8 * byteLength) - 1
              checkInt(this, value, offset, byteLength, maxBytes, 0)
            }

            var i = byteLength - 1
            var mul = 1
            this[offset + i] = value & 0xFF
            while (--i >= 0 && (mul *= 0x100)) {
              this[offset + i] = (value / mul) & 0xFF
            }

            return offset + byteLength
          }

          Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
            this[offset] = (value & 0xff)
            return offset + 1
          }

          Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
            this[offset] = (value & 0xff)
            this[offset + 1] = (value >>> 8)
            return offset + 2
          }

          Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
            this[offset] = (value >>> 8)
            this[offset + 1] = (value & 0xff)
            return offset + 2
          }

          Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
            this[offset + 3] = (value >>> 24)
            this[offset + 2] = (value >>> 16)
            this[offset + 1] = (value >>> 8)
            this[offset] = (value & 0xff)
            return offset + 4
          }

          Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
            this[offset] = (value >>> 24)
            this[offset + 1] = (value >>> 16)
            this[offset + 2] = (value >>> 8)
            this[offset + 3] = (value & 0xff)
            return offset + 4
          }

          Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              var limit = Math.pow(2, (8 * byteLength) - 1)

              checkInt(this, value, offset, byteLength, limit - 1, -limit)
            }

            var i = 0
            var mul = 1
            var sub = 0
            this[offset] = value & 0xFF
            while (++i < byteLength && (mul *= 0x100)) {
              if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                sub = 1
              }
              this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
            }

            return offset + byteLength
          }

          Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              var limit = Math.pow(2, (8 * byteLength) - 1)

              checkInt(this, value, offset, byteLength, limit - 1, -limit)
            }

            var i = byteLength - 1
            var mul = 1
            var sub = 0
            this[offset + i] = value & 0xFF
            while (--i >= 0 && (mul *= 0x100)) {
              if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                sub = 1
              }
              this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
            }

            return offset + byteLength
          }

          Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
            if (value < 0) value = 0xff + value + 1
            this[offset] = (value & 0xff)
            return offset + 1
          }

          Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
            this[offset] = (value & 0xff)
            this[offset + 1] = (value >>> 8)
            return offset + 2
          }

          Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
            this[offset] = (value >>> 8)
            this[offset + 1] = (value & 0xff)
            return offset + 2
          }

          Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
            this[offset] = (value & 0xff)
            this[offset + 1] = (value >>> 8)
            this[offset + 2] = (value >>> 16)
            this[offset + 3] = (value >>> 24)
            return offset + 4
          }

          Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
            if (value < 0) value = 0xffffffff + value + 1
            this[offset] = (value >>> 24)
            this[offset + 1] = (value >>> 16)
            this[offset + 2] = (value >>> 8)
            this[offset + 3] = (value & 0xff)
            return offset + 4
          }

          function checkIEEE754(buf, value, offset, ext, max, min) {
            if (offset + ext > buf.length) throw new RangeError('Index out of range')
            if (offset < 0) throw new RangeError('Index out of range')
          }

          function writeFloat(buf, value, offset, littleEndian, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
            }
            ieee754.write(buf, value, offset, littleEndian, 23, 4)
            return offset + 4
          }

          Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
            return writeFloat(this, value, offset, true, noAssert)
          }

          Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
            return writeFloat(this, value, offset, false, noAssert)
          }

          function writeDouble(buf, value, offset, littleEndian, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
              checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
            }
            ieee754.write(buf, value, offset, littleEndian, 52, 8)
            return offset + 8
          }

          Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
            return writeDouble(this, value, offset, true, noAssert)
          }

          Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
            return writeDouble(this, value, offset, false, noAssert)
          }

          // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
          Buffer.prototype.copy = function copy(target, targetStart, start, end) {
            if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
            if (!start) start = 0
            if (!end && end !== 0) end = this.length
            if (targetStart >= target.length) targetStart = target.length
            if (!targetStart) targetStart = 0
            if (end > 0 && end < start) end = start

            // Copy 0 bytes; we're done
            if (end === start) return 0
            if (target.length === 0 || this.length === 0) return 0

            // Fatal error conditions
            if (targetStart < 0) {
              throw new RangeError('targetStart out of bounds')
            }
            if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
            if (end < 0) throw new RangeError('sourceEnd out of bounds')

            // Are we oob?
            if (end > this.length) end = this.length
            if (target.length - targetStart < end - start) {
              end = target.length - targetStart + start
            }

            var len = end - start

            if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
              // Use built-in when available, missing from IE11
              this.copyWithin(targetStart, start, end)
            } else if (this === target && start < targetStart && targetStart < end) {
              // descending copy from end
              for (var i = len - 1; i >= 0; --i) {
                target[i + targetStart] = this[i + start]
              }
            } else {
              Uint8Array.prototype.set.call(
                target,
                this.subarray(start, end),
                targetStart
              )
            }

            return len
          }

          // Usage:
          //    buffer.fill(number[, offset[, end]])
          //    buffer.fill(buffer[, offset[, end]])
          //    buffer.fill(string[, offset[, end]][, encoding])
          Buffer.prototype.fill = function fill(val, start, end, encoding) {
            // Handle string cases:
            if (typeof val === 'string') {
              if (typeof start === 'string') {
                encoding = start
                start = 0
                end = this.length
              } else if (typeof end === 'string') {
                encoding = end
                end = this.length
              }
              if (encoding !== undefined && typeof encoding !== 'string') {
                throw new TypeError('encoding must be a string')
              }
              if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                throw new TypeError('Unknown encoding: ' + encoding)
              }
              if (val.length === 1) {
                var code = val.charCodeAt(0)
                if ((encoding === 'utf8' && code < 128) ||
                  encoding === 'latin1') {
                  // Fast path: If `val` fits into a single byte, use that numeric value.
                  val = code
                }
              }
            } else if (typeof val === 'number') {
              val = val & 255
            }

            // Invalid ranges are not set to a default, so can range check early.
            if (start < 0 || this.length < start || this.length < end) {
              throw new RangeError('Out of range index')
            }

            if (end <= start) {
              return this
            }

            start = start >>> 0
            end = end === undefined ? this.length : end >>> 0

            if (!val) val = 0

            var i
            if (typeof val === 'number') {
              for (i = start; i < end; ++i) {
                this[i] = val
              }
            } else {
              var bytes = Buffer.isBuffer(val)
                ? val
                : Buffer.from(val, encoding)
              var len = bytes.length
              if (len === 0) {
                throw new TypeError('The value "' + val +
                  '" is invalid for argument "value"')
              }
              for (i = 0; i < end - start; ++i) {
                this[i + start] = bytes[i % len]
              }
            }

            return this
          }

          // HELPER FUNCTIONS
          // ================

          var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

          function base64clean(str) {
            // Node takes equal signs as end of the Base64 encoding
            str = str.split('=')[0]
            // Node strips out invalid characters like \n and \t from the string, base64-js does not
            str = str.trim().replace(INVALID_BASE64_RE, '')
            // Node converts strings with length < 2 to ''
            if (str.length < 2) return ''
            // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
            while (str.length % 4 !== 0) {
              str = str + '='
            }
            return str
          }

          function toHex(n) {
            if (n < 16) return '0' + n.toString(16)
            return n.toString(16)
          }

          function utf8ToBytes(string, units) {
            units = units || Infinity
            var codePoint
            var length = string.length
            var leadSurrogate = null
            var bytes = []

            for (var i = 0; i < length; ++i) {
              codePoint = string.charCodeAt(i)

              // is surrogate component
              if (codePoint > 0xD7FF && codePoint < 0xE000) {
                // last char was a lead
                if (!leadSurrogate) {
                  // no lead yet
                  if (codePoint > 0xDBFF) {
                    // unexpected trail
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                    continue
                  } else if (i + 1 === length) {
                    // unpaired lead
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                    continue
                  }

                  // valid lead
                  leadSurrogate = codePoint

                  continue
                }

                // 2 leads in a row
                if (codePoint < 0xDC00) {
                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                  leadSurrogate = codePoint
                  continue
                }

                // valid surrogate pair
                codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
              } else if (leadSurrogate) {
                // valid bmp char, but last char was a lead
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
              }

              leadSurrogate = null

              // encode utf8
              if (codePoint < 0x80) {
                if ((units -= 1) < 0) break
                bytes.push(codePoint)
              } else if (codePoint < 0x800) {
                if ((units -= 2) < 0) break
                bytes.push(
                  codePoint >> 0x6 | 0xC0,
                  codePoint & 0x3F | 0x80
                )
              } else if (codePoint < 0x10000) {
                if ((units -= 3) < 0) break
                bytes.push(
                  codePoint >> 0xC | 0xE0,
                  codePoint >> 0x6 & 0x3F | 0x80,
                  codePoint & 0x3F | 0x80
                )
              } else if (codePoint < 0x110000) {
                if ((units -= 4) < 0) break
                bytes.push(
                  codePoint >> 0x12 | 0xF0,
                  codePoint >> 0xC & 0x3F | 0x80,
                  codePoint >> 0x6 & 0x3F | 0x80,
                  codePoint & 0x3F | 0x80
                )
              } else {
                throw new Error('Invalid code point')
              }
            }

            return bytes
          }

          function asciiToBytes(str) {
            var byteArray = []
            for (var i = 0; i < str.length; ++i) {
              // Node's code seems to be doing this and not & 0x7F..
              byteArray.push(str.charCodeAt(i) & 0xFF)
            }
            return byteArray
          }

          function utf16leToBytes(str, units) {
            var c, hi, lo
            var byteArray = []
            for (var i = 0; i < str.length; ++i) {
              if ((units -= 2) < 0) break

              c = str.charCodeAt(i)
              hi = c >> 8
              lo = c % 256
              byteArray.push(lo)
              byteArray.push(hi)
            }

            return byteArray
          }

          function base64ToBytes(str) {
            return base64.toByteArray(base64clean(str))
          }

          function blitBuffer(src, dst, offset, length) {
            for (var i = 0; i < length; ++i) {
              if ((i + offset >= dst.length) || (i >= src.length)) break
              dst[i + offset] = src[i]
            }
            return i
          }

          // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
          // the `instanceof` check but they should be treated as of that type.
          // See: https://github.com/feross/buffer/issues/166
          function isInstance(obj, type) {
            return obj instanceof type ||
              (obj != null && obj.constructor != null && obj.constructor.name != null &&
                obj.constructor.name === type.name)
          }
          function numberIsNaN(obj) {
            // For IE11 support
            return obj !== obj // eslint-disable-line no-self-compare
          }

        }).call(this)
      }).call(this, require("buffer").Buffer)
    }, { "base64-js": 3, "buffer": 5, "ieee754": 16 }], 6: [function (require, module, exports) {
      'use strict';

      /* globals
        Atomics,
        SharedArrayBuffer,
      */

      var undefined;

      var $TypeError = TypeError;

      var $gOPD = Object.getOwnPropertyDescriptor;
      if ($gOPD) {
        try {
          $gOPD({}, '');
        } catch (e) {
          $gOPD = null; // this is IE 8, which has a broken gOPD
        }
      }

      var throwTypeError = function () { throw new $TypeError(); };
      var ThrowTypeError = $gOPD
        ? (function () {
          try {
            // eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
            arguments.callee; // IE 8 does not throw here
            return throwTypeError;
          } catch (calleeThrows) {
            try {
              // IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
              return $gOPD(arguments, 'callee').get;
            } catch (gOPDthrows) {
              return throwTypeError;
            }
          }
        }())
        : throwTypeError;

      var hasSymbols = require('has-symbols')();

      var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

      var generator; // = function * () {};
      var generatorFunction = generator ? getProto(generator) : undefined;
      var asyncFn; // async function() {};
      var asyncFunction = asyncFn ? asyncFn.constructor : undefined;
      var asyncGen; // async function * () {};
      var asyncGenFunction = asyncGen ? getProto(asyncGen) : undefined;
      var asyncGenIterator = asyncGen ? asyncGen() : undefined;

      var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

      var INTRINSICS = {
        '%Array%': Array,
        '%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
        '%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer.prototype,
        '%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
        '%ArrayPrototype%': Array.prototype,
        '%ArrayProto_entries%': Array.prototype.entries,
        '%ArrayProto_forEach%': Array.prototype.forEach,
        '%ArrayProto_keys%': Array.prototype.keys,
        '%ArrayProto_values%': Array.prototype.values,
        '%AsyncFromSyncIteratorPrototype%': undefined,
        '%AsyncFunction%': asyncFunction,
        '%AsyncFunctionPrototype%': asyncFunction ? asyncFunction.prototype : undefined,
        '%AsyncGenerator%': asyncGen ? getProto(asyncGenIterator) : undefined,
        '%AsyncGeneratorFunction%': asyncGenFunction,
        '%AsyncGeneratorPrototype%': asyncGenFunction ? asyncGenFunction.prototype : undefined,
        '%AsyncIteratorPrototype%': asyncGenIterator && hasSymbols && Symbol.asyncIterator ? asyncGenIterator[Symbol.asyncIterator]() : undefined,
        '%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
        '%Boolean%': Boolean,
        '%BooleanPrototype%': Boolean.prototype,
        '%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
        '%DataViewPrototype%': typeof DataView === 'undefined' ? undefined : DataView.prototype,
        '%Date%': Date,
        '%DatePrototype%': Date.prototype,
        '%decodeURI%': decodeURI,
        '%decodeURIComponent%': decodeURIComponent,
        '%encodeURI%': encodeURI,
        '%encodeURIComponent%': encodeURIComponent,
        '%Error%': Error,
        '%ErrorPrototype%': Error.prototype,
        '%eval%': eval, // eslint-disable-line no-eval
        '%EvalError%': EvalError,
        '%EvalErrorPrototype%': EvalError.prototype,
        '%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
        '%Float32ArrayPrototype%': typeof Float32Array === 'undefined' ? undefined : Float32Array.prototype,
        '%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
        '%Float64ArrayPrototype%': typeof Float64Array === 'undefined' ? undefined : Float64Array.prototype,
        '%Function%': Function,
        '%FunctionPrototype%': Function.prototype,
        '%Generator%': generator ? getProto(generator()) : undefined,
        '%GeneratorFunction%': generatorFunction,
        '%GeneratorPrototype%': generatorFunction ? generatorFunction.prototype : undefined,
        '%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
        '%Int8ArrayPrototype%': typeof Int8Array === 'undefined' ? undefined : Int8Array.prototype,
        '%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
        '%Int16ArrayPrototype%': typeof Int16Array === 'undefined' ? undefined : Int8Array.prototype,
        '%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
        '%Int32ArrayPrototype%': typeof Int32Array === 'undefined' ? undefined : Int32Array.prototype,
        '%isFinite%': isFinite,
        '%isNaN%': isNaN,
        '%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
        '%JSON%': typeof JSON === 'object' ? JSON : undefined,
        '%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined,
        '%Map%': typeof Map === 'undefined' ? undefined : Map,
        '%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
        '%MapPrototype%': typeof Map === 'undefined' ? undefined : Map.prototype,
        '%Math%': Math,
        '%Number%': Number,
        '%NumberPrototype%': Number.prototype,
        '%Object%': Object,
        '%ObjectPrototype%': Object.prototype,
        '%ObjProto_toString%': Object.prototype.toString,
        '%ObjProto_valueOf%': Object.prototype.valueOf,
        '%parseFloat%': parseFloat,
        '%parseInt%': parseInt,
        '%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
        '%PromisePrototype%': typeof Promise === 'undefined' ? undefined : Promise.prototype,
        '%PromiseProto_then%': typeof Promise === 'undefined' ? undefined : Promise.prototype.then,
        '%Promise_all%': typeof Promise === 'undefined' ? undefined : Promise.all,
        '%Promise_reject%': typeof Promise === 'undefined' ? undefined : Promise.reject,
        '%Promise_resolve%': typeof Promise === 'undefined' ? undefined : Promise.resolve,
        '%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
        '%RangeError%': RangeError,
        '%RangeErrorPrototype%': RangeError.prototype,
        '%ReferenceError%': ReferenceError,
        '%ReferenceErrorPrototype%': ReferenceError.prototype,
        '%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
        '%RegExp%': RegExp,
        '%RegExpPrototype%': RegExp.prototype,
        '%Set%': typeof Set === 'undefined' ? undefined : Set,
        '%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
        '%SetPrototype%': typeof Set === 'undefined' ? undefined : Set.prototype,
        '%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
        '%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer.prototype,
        '%String%': String,
        '%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
        '%StringPrototype%': String.prototype,
        '%Symbol%': hasSymbols ? Symbol : undefined,
        '%SymbolPrototype%': hasSymbols ? Symbol.prototype : undefined,
        '%SyntaxError%': SyntaxError,
        '%SyntaxErrorPrototype%': SyntaxError.prototype,
        '%ThrowTypeError%': ThrowTypeError,
        '%TypedArray%': TypedArray,
        '%TypedArrayPrototype%': TypedArray ? TypedArray.prototype : undefined,
        '%TypeError%': $TypeError,
        '%TypeErrorPrototype%': $TypeError.prototype,
        '%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
        '%Uint8ArrayPrototype%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array.prototype,
        '%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
        '%Uint8ClampedArrayPrototype%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray.prototype,
        '%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
        '%Uint16ArrayPrototype%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array.prototype,
        '%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
        '%Uint32ArrayPrototype%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array.prototype,
        '%URIError%': URIError,
        '%URIErrorPrototype%': URIError.prototype,
        '%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
        '%WeakMapPrototype%': typeof WeakMap === 'undefined' ? undefined : WeakMap.prototype,
        '%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet,
        '%WeakSetPrototype%': typeof WeakSet === 'undefined' ? undefined : WeakSet.prototype
      };

      var bind = require('function-bind');
      var $replace = bind.call(Function.call, String.prototype.replace);

      /* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
      var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
      var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
      var stringToPath = function stringToPath(string) {
        var result = [];
        $replace(string, rePropName, function (match, number, quote, subString) {
          result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : (number || match);
        });
        return result;
      };
      /* end adaptation */

      var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
        if (!(name in INTRINSICS)) {
          throw new SyntaxError('intrinsic ' + name + ' does not exist!');
        }

        // istanbul ignore if // hopefully this is impossible to test :-)
        if (typeof INTRINSICS[name] === 'undefined' && !allowMissing) {
          throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
        }

        return INTRINSICS[name];
      };

      module.exports = function GetIntrinsic(name, allowMissing) {
        if (typeof name !== 'string' || name.length === 0) {
          throw new TypeError('intrinsic name must be a non-empty string');
        }
        if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
          throw new TypeError('"allowMissing" argument must be a boolean');
        }

        var parts = stringToPath(name);

        var value = getBaseIntrinsic('%' + (parts.length > 0 ? parts[0] : '') + '%', allowMissing);
        for (var i = 1; i < parts.length; i += 1) {
          if (value != null) {
            if ($gOPD && (i + 1) >= parts.length) {
              var desc = $gOPD(value, parts[i]);
              if (!allowMissing && !(parts[i] in value)) {
                throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
              }
              // By convention, when a data property is converted to an accessor
              // property to emulate a data property that does not suffer from
              // the override mistake, that accessor's getter is marked with
              // an `originalValue` property. Here, when we detect this, we
              // uphold the illusion by pretending to see that original data
              // property, i.e., returning the value rather than the getter
              // itself.
              value = desc && 'get' in desc && !('originalValue' in desc.get) ? desc.get : value[parts[i]];
            } else {
              value = value[parts[i]];
            }
          }
        }
        return value;
      };

    }, { "function-bind": 13, "has-symbols": 14 }], 7: [function (require, module, exports) {
      'use strict';

      var bind = require('function-bind');

      var GetIntrinsic = require('../GetIntrinsic');

      var $apply = GetIntrinsic('%Function.prototype.apply%');
      var $call = GetIntrinsic('%Function.prototype.call%');
      var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

      var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

      if ($defineProperty) {
        try {
          $defineProperty({}, 'a', { value: 1 });
        } catch (e) {
          // IE 8 has a broken defineProperty
          $defineProperty = null;
        }
      }

      module.exports = function callBind() {
        return $reflectApply(bind, $call, arguments);
      };

      var applyBind = function applyBind() {
        return $reflectApply(bind, $apply, arguments);
      };

      if ($defineProperty) {
        $defineProperty(module.exports, 'apply', { value: applyBind });
      } else {
        module.exports.apply = applyBind;
      }

    }, { "../GetIntrinsic": 6, "function-bind": 13 }], 8: [function (require, module, exports) {
      'use strict';

      var GetIntrinsic = require('../GetIntrinsic');

      var callBind = require('./callBind');

      var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

      module.exports = function callBoundIntrinsic(name, allowMissing) {
        var intrinsic = GetIntrinsic(name, !!allowMissing);
        if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.')) {
          return callBind(intrinsic);
        }
        return intrinsic;
      };

    }, { "../GetIntrinsic": 6, "./callBind": 7 }], 9: [function (require, module, exports) {
      'use strict';

      var GetIntrinsic = require('../GetIntrinsic');

      var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
      if ($gOPD) {
        try {
          $gOPD([], 'length');
        } catch (e) {
          // IE 8 has a broken gOPD
          $gOPD = null;
        }
      }

      module.exports = $gOPD;

    }, { "../GetIntrinsic": 6 }], 10: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      'use strict';

      var R = typeof Reflect === 'object' ? Reflect : null
      var ReflectApply = R && typeof R.apply === 'function'
        ? R.apply
        : function ReflectApply(target, receiver, args) {
          return Function.prototype.apply.call(target, receiver, args);
        }

      var ReflectOwnKeys
      if (R && typeof R.ownKeys === 'function') {
        ReflectOwnKeys = R.ownKeys
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys(target) {
          return Object.getOwnPropertyNames(target)
            .concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys(target) {
          return Object.getOwnPropertyNames(target);
        };
      }

      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }

      var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
        return value !== value;
      }

      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter;
      module.exports.once = once;

      // Backwards-compat with node 0.10.x
      EventEmitter.EventEmitter = EventEmitter;

      EventEmitter.prototype._events = undefined;
      EventEmitter.prototype._eventsCount = 0;
      EventEmitter.prototype._maxListeners = undefined;

      // By default EventEmitters will print a warning if more than 10 listeners are
      // added to it. This is a useful default which helps finding memory leaks.
      var defaultMaxListeners = 10;

      function checkListener(listener) {
        if (typeof listener !== 'function') {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }

      Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
        enumerable: true,
        get: function () {
          return defaultMaxListeners;
        },
        set: function (arg) {
          if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
          }
          defaultMaxListeners = arg;
        }
      });

      EventEmitter.init = function () {

        if (this._events === undefined ||
          this._events === Object.getPrototypeOf(this)._events) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        }

        this._maxListeners = this._maxListeners || undefined;
      };

      // Obviously not all Emitters should be limited to 10. This function allows
      // that to be increased. Set to zero for unlimited.
      EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
        }
        this._maxListeners = n;
        return this;
      };

      function _getMaxListeners(that) {
        if (that._maxListeners === undefined)
          return EventEmitter.defaultMaxListeners;
        return that._maxListeners;
      }

      EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };

      EventEmitter.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = (type === 'error');

        var events = this._events;
        if (events !== undefined)
          doError = (doError && events.error === undefined);
        else if (!doError)
          return false;

        // If there is no 'error' event listener then throw.
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            // Note: The comments on the `throw` lines are intentional, they show
            // up in Node's output if this results in an unhandled exception.
            throw er; // Unhandled 'error' event
          }
          // At least give some kind of context to the user
          var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
          err.context = er;
          throw err; // Unhandled 'error' event
        }

        var handler = events[type];

        if (handler === undefined)
          return false;

        if (typeof handler === 'function') {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }

        return true;
      };

      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;

        checkListener(listener);

        events = target._events;
        if (events === undefined) {
          events = target._events = Object.create(null);
          target._eventsCount = 0;
        } else {
          // To avoid recursion in the case that type === "newListener"! Before
          // adding it to the listeners, first emit "newListener".
          if (events.newListener !== undefined) {
            target.emit('newListener', type,
              listener.listener ? listener.listener : listener);

            // Re-assign `events` because a newListener handler could have caused the
            // this._events to be assigned to a new object
            events = target._events;
          }
          existing = events[type];
        }

        if (existing === undefined) {
          // Optimize the case of one listener. Don't need the extra array object.
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === 'function') {
            // Adding the second element, need to change to array.
            existing = events[type] =
              prepend ? [listener, existing] : [existing, listener];
            // If we've already got an array, just append.
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }

          // Check for listener leak
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            // No error code for this since it is a Warning
            // eslint-disable-next-line no-restricted-syntax
            var w = new Error('Possible EventEmitter memory leak detected. ' +
              existing.length + ' ' + String(type) + ' listeners ' +
              'added. Use emitter.setMaxListeners() to ' +
              'increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }

        return target;
      }

      EventEmitter.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };

      EventEmitter.prototype.on = EventEmitter.prototype.addListener;

      EventEmitter.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };

      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }

      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }

      EventEmitter.prototype.once = function once(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };

      EventEmitter.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          checkListener(listener);
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };

      // Emits a 'removeListener' event if and only if the listener was removed.
      EventEmitter.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;

          checkListener(listener);

          events = this._events;
          if (events === undefined)
            return this;

          list = events[type];
          if (list === undefined)
            return this;

          if (list === listener || list.listener === listener) {
            if (--this._eventsCount === 0)
              this._events = Object.create(null);
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length - 1; i >= 0; i--) {
              if (list[i] === listener || list[i].listener === listener) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }

            if (position < 0)
              return this;

            if (position === 0)
              list.shift();
            else {
              spliceOne(list, position);
            }

            if (list.length === 1)
              events[type] = list[0];

            if (events.removeListener !== undefined)
              this.emit('removeListener', type, originalListener || listener);
          }

          return this;
        };

      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

      EventEmitter.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events, i;

          events = this._events;
          if (events === undefined)
            return this;

          // not listening for removeListener, no need to emit
          if (events.removeListener === undefined) {
            if (arguments.length === 0) {
              this._events = Object.create(null);
              this._eventsCount = 0;
            } else if (events[type] !== undefined) {
              if (--this._eventsCount === 0)
                this._events = Object.create(null);
              else
                delete events[type];
            }
            return this;
          }

          // emit removeListener for all listeners on all events
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            var key;
            for (i = 0; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = Object.create(null);
            this._eventsCount = 0;
            return this;
          }

          listeners = events[type];

          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners !== undefined) {
            // LIFO order
            for (i = listeners.length - 1; i >= 0; i--) {
              this.removeListener(type, listeners[i]);
            }
          }

          return this;
        };

      function _listeners(target, type, unwrap) {
        var events = target._events;

        if (events === undefined)
          return [];

        var evlistener = events[type];
        if (evlistener === undefined)
          return [];

        if (typeof evlistener === 'function')
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];

        return unwrap ?
          unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }

      EventEmitter.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };

      EventEmitter.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };

      EventEmitter.listenerCount = function (emitter, type) {
        if (typeof emitter.listenerCount === 'function') {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };

      EventEmitter.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;

        if (events !== undefined) {
          var evlistener = events[type];

          if (typeof evlistener === 'function') {
            return 1;
          } else if (evlistener !== undefined) {
            return evlistener.length;
          }
        }

        return 0;
      }

      EventEmitter.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };

      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }

      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }

      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }

      function once(emitter, name) {
        return new Promise(function (resolve, reject) {
          function eventListener() {
            if (errorListener !== undefined) {
              emitter.removeListener('error', errorListener);
            }
            resolve([].slice.call(arguments));
          };
          var errorListener;

          // Adding an error listener is not optional because
          // if an error is thrown on an event emitter we cannot
          // guarantee that the actual event we are waiting will
          // be fired. The result could be a silent way to create
          // memory or file descriptor leaks, which is something
          // we should avoid.
          if (name !== 'error') {
            errorListener = function errorListener(err) {
              emitter.removeListener(name, eventListener);
              reject(err);
            };

            emitter.once('error', errorListener);
          }

          emitter.once(name, eventListener);
        });
      }

    }, {}], 11: [function (require, module, exports) {

      var hasOwn = Object.prototype.hasOwnProperty;
      var toString = Object.prototype.toString;

      module.exports = function forEach(obj, fn, ctx) {
        if (toString.call(fn) !== '[object Function]') {
          throw new TypeError('iterator must be a function');
        }
        var l = obj.length;
        if (l === +l) {
          for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
          }
        } else {
          for (var k in obj) {
            if (hasOwn.call(obj, k)) {
              fn.call(ctx, obj[k], k, obj);
            }
          }
        }
      };


    }, {}], 12: [function (require, module, exports) {
      'use strict';

      /* eslint no-invalid-this: 1 */

      var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
      var slice = Array.prototype.slice;
      var toStr = Object.prototype.toString;
      var funcType = '[object Function]';

      module.exports = function bind(that) {
        var target = this;
        if (typeof target !== 'function' || toStr.call(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
        }
        var args = slice.call(arguments, 1);

        var bound;
        var binder = function () {
          if (this instanceof bound) {
            var result = target.apply(
              this,
              args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
              return result;
            }
            return this;
          } else {
            return target.apply(
              that,
              args.concat(slice.call(arguments))
            );
          }
        };

        var boundLength = Math.max(0, target.length - args.length);
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
          boundArgs.push('$' + i);
        }

        bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

        if (target.prototype) {
          var Empty = function Empty() { };
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
        }

        return bound;
      };

    }, {}], 13: [function (require, module, exports) {
      'use strict';

      var implementation = require('./implementation');

      module.exports = Function.prototype.bind || implementation;

    }, { "./implementation": 12 }], 14: [function (require, module, exports) {
      (function (global) {
        (function () {
          'use strict';

          var origSymbol = global.Symbol;
          var hasSymbolSham = require('./shams');

          module.exports = function hasNativeSymbols() {
            if (typeof origSymbol !== 'function') { return false; }
            if (typeof Symbol !== 'function') { return false; }
            if (typeof origSymbol('foo') !== 'symbol') { return false; }
            if (typeof Symbol('bar') !== 'symbol') { return false; }

            return hasSymbolSham();
          };

        }).call(this)
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "./shams": 15 }], 15: [function (require, module, exports) {
      'use strict';

      /* eslint complexity: [2, 18], max-statements: [2, 33] */
      module.exports = function hasSymbols() {
        if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
        if (typeof Symbol.iterator === 'symbol') { return true; }

        var obj = {};
        var sym = Symbol('test');
        var symObj = Object(sym);
        if (typeof sym === 'string') { return false; }

        if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
        if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

        // temp disabled per https://github.com/ljharb/object.assign/issues/17
        // if (sym instanceof Symbol) { return false; }
        // temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
        // if (!(symObj instanceof Symbol)) { return false; }

        // if (typeof Symbol.prototype.toString !== 'function') { return false; }
        // if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

        var symVal = 42;
        obj[sym] = symVal;
        for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
        if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

        if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

        var syms = Object.getOwnPropertySymbols(obj);
        if (syms.length !== 1 || syms[0] !== sym) { return false; }

        if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

        if (typeof Object.getOwnPropertyDescriptor === 'function') {
          var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
          if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
        }

        return true;
      };

    }, {}], 16: [function (require, module, exports) {
      /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
      exports.read = function (buffer, offset, isLE, mLen, nBytes) {
        var e, m
        var eLen = (nBytes * 8) - mLen - 1
        var eMax = (1 << eLen) - 1
        var eBias = eMax >> 1
        var nBits = -7
        var i = isLE ? (nBytes - 1) : 0
        var d = isLE ? -1 : 1
        var s = buffer[offset + i]

        i += d

        e = s & ((1 << (-nBits)) - 1)
        s >>= (-nBits)
        nBits += eLen
        for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) { }

        m = e & ((1 << (-nBits)) - 1)
        e >>= (-nBits)
        nBits += mLen
        for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) { }

        if (e === 0) {
          e = 1 - eBias
        } else if (e === eMax) {
          return m ? NaN : ((s ? -1 : 1) * Infinity)
        } else {
          m = m + Math.pow(2, mLen)
          e = e - eBias
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
      }

      exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c
        var eLen = (nBytes * 8) - mLen - 1
        var eMax = (1 << eLen) - 1
        var eBias = eMax >> 1
        var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
        var i = isLE ? 0 : (nBytes - 1)
        var d = isLE ? 1 : -1
        var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

        value = Math.abs(value)

        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0
          e = eMax
        } else {
          e = Math.floor(Math.log(value) / Math.LN2)
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--
            c *= 2
          }
          if (e + eBias >= 1) {
            value += rt / c
          } else {
            value += rt * Math.pow(2, 1 - eBias)
          }
          if (value * c >= 2) {
            e++
            c /= 2
          }

          if (e + eBias >= eMax) {
            m = 0
            e = eMax
          } else if (e + eBias >= 1) {
            m = ((value * c) - 1) * Math.pow(2, mLen)
            e = e + eBias
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
            e = 0
          }
        }

        for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) { }

        e = (e << mLen) | m
        eLen += mLen
        for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) { }

        buffer[offset + i - d] |= s * 128
      }

    }, {}], 17: [function (require, module, exports) {
      if (typeof Object.create === 'function') {
        // implementation from standard node.js 'util' module
        module.exports = function inherits(ctor, superCtor) {
          if (superCtor) {
            ctor.super_ = superCtor
            ctor.prototype = Object.create(superCtor.prototype, {
              constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
              }
            })
          }
        };
      } else {
        // old school shim for old browsers
        module.exports = function inherits(ctor, superCtor) {
          if (superCtor) {
            ctor.super_ = superCtor
            var TempCtor = function () { }
            TempCtor.prototype = superCtor.prototype
            ctor.prototype = new TempCtor()
            ctor.prototype.constructor = ctor
          }
        }
      }

    }, {}], 18: [function (require, module, exports) {
      'use strict';

      var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
      var toStr = Object.prototype.toString;

      var isStandardArguments = function isArguments(value) {
        if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
          return false;
        }
        return toStr.call(value) === '[object Arguments]';
      };

      var isLegacyArguments = function isArguments(value) {
        if (isStandardArguments(value)) {
          return true;
        }
        return value !== null &&
          typeof value === 'object' &&
          typeof value.length === 'number' &&
          value.length >= 0 &&
          toStr.call(value) !== '[object Array]' &&
          toStr.call(value.callee) === '[object Function]';
      };

      var supportsStandardArguments = (function () {
        return isStandardArguments(arguments);
      }());

      isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

      module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

    }, {}], 19: [function (require, module, exports) {
      /*!
       * Determine if an object is a Buffer
       *
       * @author   Feross Aboukhadijeh <https://feross.org>
       * @license  MIT
       */

      // The _isBuffer check is for Safari 5-7 support, because it's missing
      // Object.prototype.constructor. Remove this eventually
      module.exports = function (obj) {
        return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
      }

      function isBuffer(obj) {
        return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
      }

      // For Node v0.10 support. Remove this eventually.
      function isSlowBuffer(obj) {
        return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
      }

    }, {}], 20: [function (require, module, exports) {
      'use strict';

      var toStr = Object.prototype.toString;
      var fnToStr = Function.prototype.toString;
      var isFnRegex = /^\s*(?:function)?\*/;
      var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
      var getProto = Object.getPrototypeOf;
      var getGeneratorFunc = function () { // eslint-disable-line consistent-return
        if (!hasToStringTag) {
          return false;
        }
        try {
          return Function('return function*() {}')();
        } catch (e) {
        }
      };
      var generatorFunc = getGeneratorFunc();
      var GeneratorFunction = generatorFunc ? getProto(generatorFunc) : {};

      module.exports = function isGeneratorFunction(fn) {
        if (typeof fn !== 'function') {
          return false;
        }
        if (isFnRegex.test(fnToStr.call(fn))) {
          return true;
        }
        if (!hasToStringTag) {
          var str = toStr.call(fn);
          return str === '[object GeneratorFunction]';
        }
        return getProto(fn) === GeneratorFunction;
      };

    }, {}], 21: [function (require, module, exports) {
      (function (global) {
        (function () {
          'use strict';

          var forEach = require('foreach');
          var availableTypedArrays = require('available-typed-arrays');
          var callBound = require('es-abstract/helpers/callBound');

          var $toString = callBound('Object.prototype.toString');
          var hasSymbols = require('has-symbols')();
          var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

          var typedArrays = availableTypedArrays();

          var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
            for (var i = 0; i < array.length; i += 1) {
              if (array[i] === value) {
                return i;
              }
            }
            return -1;
          };
          var $slice = callBound('String.prototype.slice');
          var toStrTags = {};
          var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
          var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
          if (hasToStringTag && gOPD && getPrototypeOf) {
            forEach(typedArrays, function (typedArray) {
              var arr = new global[typedArray]();
              if (!(Symbol.toStringTag in arr)) {
                throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
              }
              var proto = getPrototypeOf(arr);
              var descriptor = gOPD(proto, Symbol.toStringTag);
              if (!descriptor) {
                var superProto = getPrototypeOf(proto);
                descriptor = gOPD(superProto, Symbol.toStringTag);
              }
              toStrTags[typedArray] = descriptor.get;
            });
          }

          var tryTypedArrays = function tryAllTypedArrays(value) {
            var anyTrue = false;
            forEach(toStrTags, function (getter, typedArray) {
              if (!anyTrue) {
                try {
                  anyTrue = getter.call(value) === typedArray;
                } catch (e) { /**/ }
              }
            });
            return anyTrue;
          };

          module.exports = function isTypedArray(value) {
            if (!value || typeof value !== 'object') { return false; }
            if (!hasToStringTag) {
              var tag = $slice($toString(value), 8, -1);
              return $indexOf(typedArrays, tag) > -1;
            }
            if (!gOPD) { return false; }
            return tryTypedArrays(value);
          };

        }).call(this)
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "available-typed-arrays": 2, "es-abstract/helpers/callBound": 8, "es-abstract/helpers/getOwnPropertyDescriptor": 9, "foreach": 11, "has-symbols": 14 }], 22: [function (require, module, exports) {
      exports.endianness = function () { return 'LE' };

      exports.hostname = function () {
        if (typeof location !== 'undefined') {
          return location.hostname
        }
        else return '';
      };

      exports.loadavg = function () { return [] };

      exports.uptime = function () { return 0 };

      exports.freemem = function () {
        return Number.MAX_VALUE;
      };

      exports.totalmem = function () {
        return Number.MAX_VALUE;
      };

      exports.cpus = function () { return [] };

      exports.type = function () { return 'Browser' };

      exports.release = function () {
        if (typeof navigator !== 'undefined') {
          return navigator.appVersion;
        }
        return '';
      };

      exports.networkInterfaces
        = exports.getNetworkInterfaces
        = function () { return {} };

      exports.arch = function () { return 'javascript' };

      exports.platform = function () { return 'browser' };

      exports.tmpdir = exports.tmpDir = function () {
        return '/tmp';
      };

      exports.EOL = '\n';

      exports.homedir = function () {
        return '/'
      };

    }, {}], 23: [function (require, module, exports) {
      (function (process) {
        (function () {
          // 'path' module extracted from Node.js v8.11.1 (only the posix part)
          // transplited with Babel

          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.

          'use strict';

          function assertPath(path) {
            if (typeof path !== 'string') {
              throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
            }
          }

          // Resolves . and .. elements in a path with directory names
          function normalizeStringPosix(path, allowAboveRoot) {
            var res = '';
            var lastSegmentLength = 0;
            var lastSlash = -1;
            var dots = 0;
            var code;
            for (var i = 0; i <= path.length; ++i) {
              if (i < path.length)
                code = path.charCodeAt(i);
              else if (code === 47 /*/*/)
                break;
              else
                code = 47 /*/*/;
              if (code === 47 /*/*/) {
                if (lastSlash === i - 1 || dots === 1) {
                  // NOOP
                } else if (lastSlash !== i - 1 && dots === 2) {
                  if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
                    if (res.length > 2) {
                      var lastSlashIndex = res.lastIndexOf('/');
                      if (lastSlashIndex !== res.length - 1) {
                        if (lastSlashIndex === -1) {
                          res = '';
                          lastSegmentLength = 0;
                        } else {
                          res = res.slice(0, lastSlashIndex);
                          lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                      }
                    } else if (res.length === 2 || res.length === 1) {
                      res = '';
                      lastSegmentLength = 0;
                      lastSlash = i;
                      dots = 0;
                      continue;
                    }
                  }
                  if (allowAboveRoot) {
                    if (res.length > 0)
                      res += '/..';
                    else
                      res = '..';
                    lastSegmentLength = 2;
                  }
                } else {
                  if (res.length > 0)
                    res += '/' + path.slice(lastSlash + 1, i);
                  else
                    res = path.slice(lastSlash + 1, i);
                  lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
              } else if (code === 46 /*.*/ && dots !== -1) {
                ++dots;
              } else {
                dots = -1;
              }
            }
            return res;
          }

          function _format(sep, pathObject) {
            var dir = pathObject.dir || pathObject.root;
            var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
            if (!dir) {
              return base;
            }
            if (dir === pathObject.root) {
              return dir + base;
            }
            return dir + sep + base;
          }

          var posix = {
            // path.resolve([from ...], to)
            resolve: function resolve() {
              var resolvedPath = '';
              var resolvedAbsolute = false;
              var cwd;

              for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                var path;
                if (i >= 0)
                  path = arguments[i];
                else {
                  if (cwd === undefined)
                    cwd = process.cwd();
                  path = cwd;
                }

                assertPath(path);

                // Skip empty entries
                if (path.length === 0) {
                  continue;
                }

                resolvedPath = path + '/' + resolvedPath;
                resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
              }

              // At this point the path should be resolved to a full absolute path, but
              // handle relative paths to be safe (might happen when process.cwd() fails)

              // Normalize the path
              resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

              if (resolvedAbsolute) {
                if (resolvedPath.length > 0)
                  return '/' + resolvedPath;
                else
                  return '/';
              } else if (resolvedPath.length > 0) {
                return resolvedPath;
              } else {
                return '.';
              }
            },

            normalize: function normalize(path) {
              assertPath(path);

              if (path.length === 0) return '.';

              var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
              var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

              // Normalize the path
              path = normalizeStringPosix(path, !isAbsolute);

              if (path.length === 0 && !isAbsolute) path = '.';
              if (path.length > 0 && trailingSeparator) path += '/';

              if (isAbsolute) return '/' + path;
              return path;
            },

            isAbsolute: function isAbsolute(path) {
              assertPath(path);
              return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
            },

            join: function join() {
              if (arguments.length === 0)
                return '.';
              var joined;
              for (var i = 0; i < arguments.length; ++i) {
                var arg = arguments[i];
                assertPath(arg);
                if (arg.length > 0) {
                  if (joined === undefined)
                    joined = arg;
                  else
                    joined += '/' + arg;
                }
              }
              if (joined === undefined)
                return '.';
              return posix.normalize(joined);
            },

            relative: function relative(from, to) {
              assertPath(from);
              assertPath(to);

              if (from === to) return '';

              from = posix.resolve(from);
              to = posix.resolve(to);

              if (from === to) return '';

              // Trim any leading backslashes
              var fromStart = 1;
              for (; fromStart < from.length; ++fromStart) {
                if (from.charCodeAt(fromStart) !== 47 /*/*/)
                  break;
              }
              var fromEnd = from.length;
              var fromLen = fromEnd - fromStart;

              // Trim any leading backslashes
              var toStart = 1;
              for (; toStart < to.length; ++toStart) {
                if (to.charCodeAt(toStart) !== 47 /*/*/)
                  break;
              }
              var toEnd = to.length;
              var toLen = toEnd - toStart;

              // Compare paths to find the longest common path from root
              var length = fromLen < toLen ? fromLen : toLen;
              var lastCommonSep = -1;
              var i = 0;
              for (; i <= length; ++i) {
                if (i === length) {
                  if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === 47 /*/*/) {
                      // We get here if `from` is the exact base path for `to`.
                      // For example: from='/foo/bar'; to='/foo/bar/baz'
                      return to.slice(toStart + i + 1);
                    } else if (i === 0) {
                      // We get here if `from` is the root
                      // For example: from='/'; to='/foo'
                      return to.slice(toStart + i);
                    }
                  } else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
                      // We get here if `to` is the exact base path for `from`.
                      // For example: from='/foo/bar/baz'; to='/foo/bar'
                      lastCommonSep = i;
                    } else if (i === 0) {
                      // We get here if `to` is the root.
                      // For example: from='/foo'; to='/'
                      lastCommonSep = 0;
                    }
                  }
                  break;
                }
                var fromCode = from.charCodeAt(fromStart + i);
                var toCode = to.charCodeAt(toStart + i);
                if (fromCode !== toCode)
                  break;
                else if (fromCode === 47 /*/*/)
                  lastCommonSep = i;
              }

              var out = '';
              // Generate the relative path based on the path difference between `to`
              // and `from`
              for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
                if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
                  if (out.length === 0)
                    out += '..';
                  else
                    out += '/..';
                }
              }

              // Lastly, append the rest of the destination (`to`) path that comes after
              // the common path parts
              if (out.length > 0)
                return out + to.slice(toStart + lastCommonSep);
              else {
                toStart += lastCommonSep;
                if (to.charCodeAt(toStart) === 47 /*/*/)
                  ++toStart;
                return to.slice(toStart);
              }
            },

            _makeLong: function _makeLong(path) {
              return path;
            },

            dirname: function dirname(path) {
              assertPath(path);
              if (path.length === 0) return '.';
              var code = path.charCodeAt(0);
              var hasRoot = code === 47 /*/*/;
              var end = -1;
              var matchedSlash = true;
              for (var i = path.length - 1; i >= 1; --i) {
                code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                  if (!matchedSlash) {
                    end = i;
                    break;
                  }
                } else {
                  // We saw the first non-path separator
                  matchedSlash = false;
                }
              }

              if (end === -1) return hasRoot ? '/' : '.';
              if (hasRoot && end === 1) return '//';
              return path.slice(0, end);
            },

            basename: function basename(path, ext) {
              if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
              assertPath(path);

              var start = 0;
              var end = -1;
              var matchedSlash = true;
              var i;

              if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
                if (ext.length === path.length && ext === path) return '';
                var extIdx = ext.length - 1;
                var firstNonSlashEnd = -1;
                for (i = path.length - 1; i >= 0; --i) {
                  var code = path.charCodeAt(i);
                  if (code === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                      start = i + 1;
                      break;
                    }
                  } else {
                    if (firstNonSlashEnd === -1) {
                      // We saw the first non-path separator, remember this index in case
                      // we need it if the extension ends up not matching
                      matchedSlash = false;
                      firstNonSlashEnd = i + 1;
                    }
                    if (extIdx >= 0) {
                      // Try to match the explicit extension
                      if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                          // We matched the extension, so mark this as the end of our path
                          // component
                          end = i;
                        }
                      } else {
                        // Extension does not match, so our result is the entire path
                        // component
                        extIdx = -1;
                        end = firstNonSlashEnd;
                      }
                    }
                  }
                }

                if (start === end) end = firstNonSlashEnd; else if (end === -1) end = path.length;
                return path.slice(start, end);
              } else {
                for (i = path.length - 1; i >= 0; --i) {
                  if (path.charCodeAt(i) === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                      start = i + 1;
                      break;
                    }
                  } else if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // path component
                    matchedSlash = false;
                    end = i + 1;
                  }
                }

                if (end === -1) return '';
                return path.slice(start, end);
              }
            },

            extname: function extname(path) {
              assertPath(path);
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              // Track the state of characters (if any) we see before our first dot and
              // after any path separator we find
              var preDotState = 0;
              for (var i = path.length - 1; i >= 0; --i) {
                var code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                  // If we reached a path separator that was not part of a set of path
                  // separators at the end of the string, stop now
                  if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                  }
                  continue;
                }
                if (end === -1) {
                  // We saw the first non-path separator, mark this as the end of our
                  // extension
                  matchedSlash = false;
                  end = i + 1;
                }
                if (code === 46 /*.*/) {
                  // If this is our first dot, mark it as the start of our extension
                  if (startDot === -1)
                    startDot = i;
                  else if (preDotState !== 1)
                    preDotState = 1;
                } else if (startDot !== -1) {
                  // We saw a non-dot and non-path separator before our dot, so we should
                  // have a good chance at having a non-empty extension
                  preDotState = -1;
                }
              }

              if (startDot === -1 || end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                return '';
              }
              return path.slice(startDot, end);
            },

            format: function format(pathObject) {
              if (pathObject === null || typeof pathObject !== 'object') {
                throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
              }
              return _format('/', pathObject);
            },

            parse: function parse(path) {
              assertPath(path);

              var ret = { root: '', dir: '', base: '', ext: '', name: '' };
              if (path.length === 0) return ret;
              var code = path.charCodeAt(0);
              var isAbsolute = code === 47 /*/*/;
              var start;
              if (isAbsolute) {
                ret.root = '/';
                start = 1;
              } else {
                start = 0;
              }
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              var i = path.length - 1;

              // Track the state of characters (if any) we see before our first dot and
              // after any path separator we find
              var preDotState = 0;

              // Get non-dir info
              for (; i >= start; --i) {
                code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                  // If we reached a path separator that was not part of a set of path
                  // separators at the end of the string, stop now
                  if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                  }
                  continue;
                }
                if (end === -1) {
                  // We saw the first non-path separator, mark this as the end of our
                  // extension
                  matchedSlash = false;
                  end = i + 1;
                }
                if (code === 46 /*.*/) {
                  // If this is our first dot, mark it as the start of our extension
                  if (startDot === -1) startDot = i; else if (preDotState !== 1) preDotState = 1;
                } else if (startDot !== -1) {
                  // We saw a non-dot and non-path separator before our dot, so we should
                  // have a good chance at having a non-empty extension
                  preDotState = -1;
                }
              }

              if (startDot === -1 || end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                if (end !== -1) {
                  if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end); else ret.base = ret.name = path.slice(startPart, end);
                }
              } else {
                if (startPart === 0 && isAbsolute) {
                  ret.name = path.slice(1, startDot);
                  ret.base = path.slice(1, end);
                } else {
                  ret.name = path.slice(startPart, startDot);
                  ret.base = path.slice(startPart, end);
                }
                ret.ext = path.slice(startDot, end);
              }

              if (startPart > 0) ret.dir = path.slice(0, startPart - 1); else if (isAbsolute) ret.dir = '/';

              return ret;
            },

            sep: '/',
            delimiter: ':',
            win32: null,
            posix: null
          };

          posix.posix = posix;

          module.exports = posix;

        }).call(this)
      }).call(this, require('_process'))
    }, { "_process": 24 }], 24: [function (require, module, exports) {
      // shim for using process in browser
      var process = module.exports = {};

      // cached from whatever global is present so that test runners that stub it
      // don't break things.  But we need to wrap it in a try catch in case it is
      // wrapped in strict mode code which doesn't define any globals.  It's inside a
      // function because try/catches deoptimize in certain engines.

      var cachedSetTimeout;
      var cachedClearTimeout;

      function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
      }
      function defaultClearTimeout() {
        throw new Error('clearTimeout has not been defined');
      }
      (function () {
        try {
          if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
          } else {
            cachedSetTimeout = defaultSetTimout;
          }
        } catch (e) {
          cachedSetTimeout = defaultSetTimout;
        }
        try {
          if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
          } else {
            cachedClearTimeout = defaultClearTimeout;
          }
        } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
        }
      }())
      function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
        }
        try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
        } catch (e) {
          try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
          } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
          }
        }


      }
      function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
        }
        try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
        } catch (e) {
          try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
          } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
          }
        }



      }
      var queue = [];
      var draining = false;
      var currentQueue;
      var queueIndex = -1;

      function cleanUpNextTick() {
        if (!draining || !currentQueue) {
          return;
        }
        draining = false;
        if (currentQueue.length) {
          queue = currentQueue.concat(queue);
        } else {
          queueIndex = -1;
        }
        if (queue.length) {
          drainQueue();
        }
      }

      function drainQueue() {
        if (draining) {
          return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
            if (currentQueue) {
              currentQueue[queueIndex].run();
            }
          }
          queueIndex = -1;
          len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
      }

      process.nextTick = function (fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
          }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
        }
      };

      // v8 likes predictible objects
      function Item(fun, array) {
        this.fun = fun;
        this.array = array;
      }
      Item.prototype.run = function () {
        this.fun.apply(null, this.array);
      };
      process.title = 'browser';
      process.browser = true;
      process.env = {};
      process.argv = [];
      process.version = ''; // empty string to avoid regexp issues
      process.versions = {};

      function noop() { }

      process.on = noop;
      process.addListener = noop;
      process.once = noop;
      process.off = noop;
      process.removeListener = noop;
      process.removeAllListeners = noop;
      process.emit = noop;
      process.prependListener = noop;
      process.prependOnceListener = noop;

      process.listeners = function (name) { return [] }

      process.binding = function (name) {
        throw new Error('process.binding is not supported');
      };

      process.cwd = function () { return '/' };
      process.chdir = function (dir) {
        throw new Error('process.chdir is not supported');
      };
      process.umask = function () { return 0; };

    }, {}], 25: [function (require, module, exports) {
      (function (setImmediate, clearImmediate) {
        (function () {
          var nextTick = require('process/browser.js').nextTick;
          var apply = Function.prototype.apply;
          var slice = Array.prototype.slice;
          var immediateIds = {};
          var nextImmediateId = 0;

          // DOM APIs, for completeness

          exports.setTimeout = function () {
            return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
          };
          exports.setInterval = function () {
            return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
          };
          exports.clearTimeout =
            exports.clearInterval = function (timeout) { timeout.close(); };

          function Timeout(id, clearFn) {
            this._id = id;
            this._clearFn = clearFn;
          }
          Timeout.prototype.unref = Timeout.prototype.ref = function () { };
          Timeout.prototype.close = function () {
            this._clearFn.call(window, this._id);
          };

          // Does not start the time, just sets up the members needed.
          exports.enroll = function (item, msecs) {
            clearTimeout(item._idleTimeoutId);
            item._idleTimeout = msecs;
          };

          exports.unenroll = function (item) {
            clearTimeout(item._idleTimeoutId);
            item._idleTimeout = -1;
          };

          exports._unrefActive = exports.active = function (item) {
            clearTimeout(item._idleTimeoutId);

            var msecs = item._idleTimeout;
            if (msecs >= 0) {
              item._idleTimeoutId = setTimeout(function onTimeout() {
                if (item._onTimeout)
                  item._onTimeout();
              }, msecs);
            }
          };

          // That's not how node.js implements it but the exposed api is the same.
          exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function (fn) {
            var id = nextImmediateId++;
            var args = arguments.length < 2 ? false : slice.call(arguments, 1);

            immediateIds[id] = true;

            nextTick(function onNextTick() {
              if (immediateIds[id]) {
                // fn.call() is faster so we optimize for the common use-case
                // @see http://jsperf.com/call-apply-segu
                if (args) {
                  fn.apply(null, args);
                } else {
                  fn.call(null);
                }
                // Prevent ids from leaking
                exports.clearImmediate(id);
              }
            });

            return id;
          };

          exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function (id) {
            delete immediateIds[id];
          };
        }).call(this)
      }).call(this, require("timers").setImmediate, require("timers").clearImmediate)
    }, { "process/browser.js": 24, "timers": 25 }], 26: [function (require, module, exports) {
      module.exports = function isBuffer(arg) {
        return arg && typeof arg === 'object'
          && typeof arg.copy === 'function'
          && typeof arg.fill === 'function'
          && typeof arg.readUInt8 === 'function';
      }
    }, {}], 27: [function (require, module, exports) {
      // Currently in sync with Node.js lib/internal/util/types.js
      // https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

      'use strict';

      var isArgumentsObject = require('is-arguments');
      var isGeneratorFunction = require('is-generator-function');
      var whichTypedArray = require('which-typed-array');
      var isTypedArray = require('is-typed-array');

      function uncurryThis(f) {
        return f.call.bind(f);
      }

      var BigIntSupported = typeof BigInt !== 'undefined';
      var SymbolSupported = typeof Symbol !== 'undefined';

      var ObjectToString = uncurryThis(Object.prototype.toString);

      var numberValue = uncurryThis(Number.prototype.valueOf);
      var stringValue = uncurryThis(String.prototype.valueOf);
      var booleanValue = uncurryThis(Boolean.prototype.valueOf);

      if (BigIntSupported) {
        var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
      }

      if (SymbolSupported) {
        var symbolValue = uncurryThis(Symbol.prototype.valueOf);
      }

      function checkBoxedPrimitive(value, prototypeValueOf) {
        if (typeof value !== 'object') {
          return false;
        }
        try {
          prototypeValueOf(value);
          return true;
        } catch (e) {
          return false;
        }
      }

      exports.isArgumentsObject = isArgumentsObject;
      exports.isGeneratorFunction = isGeneratorFunction;
      exports.isTypedArray = isTypedArray;

      // Taken from here and modified for better browser support
      // https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
      function isPromise(input) {
        return (
          (
            typeof Promise !== 'undefined' &&
            input instanceof Promise
          ) ||
          (
            input !== null &&
            typeof input === 'object' &&
            typeof input.then === 'function' &&
            typeof input.catch === 'function'
          )
        );
      }
      exports.isPromise = isPromise;

      function isArrayBufferView(value) {
        if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
          return ArrayBuffer.isView(value);
        }

        return (
          isTypedArray(value) ||
          isDataView(value)
        );
      }
      exports.isArrayBufferView = isArrayBufferView;


      function isUint8Array(value) {
        return whichTypedArray(value) === 'Uint8Array';
      }
      exports.isUint8Array = isUint8Array;

      function isUint8ClampedArray(value) {
        return whichTypedArray(value) === 'Uint8ClampedArray';
      }
      exports.isUint8ClampedArray = isUint8ClampedArray;

      function isUint16Array(value) {
        return whichTypedArray(value) === 'Uint16Array';
      }
      exports.isUint16Array = isUint16Array;

      function isUint32Array(value) {
        return whichTypedArray(value) === 'Uint32Array';
      }
      exports.isUint32Array = isUint32Array;

      function isInt8Array(value) {
        return whichTypedArray(value) === 'Int8Array';
      }
      exports.isInt8Array = isInt8Array;

      function isInt16Array(value) {
        return whichTypedArray(value) === 'Int16Array';
      }
      exports.isInt16Array = isInt16Array;

      function isInt32Array(value) {
        return whichTypedArray(value) === 'Int32Array';
      }
      exports.isInt32Array = isInt32Array;

      function isFloat32Array(value) {
        return whichTypedArray(value) === 'Float32Array';
      }
      exports.isFloat32Array = isFloat32Array;

      function isFloat64Array(value) {
        return whichTypedArray(value) === 'Float64Array';
      }
      exports.isFloat64Array = isFloat64Array;

      function isBigInt64Array(value) {
        return whichTypedArray(value) === 'BigInt64Array';
      }
      exports.isBigInt64Array = isBigInt64Array;

      function isBigUint64Array(value) {
        return whichTypedArray(value) === 'BigUint64Array';
      }
      exports.isBigUint64Array = isBigUint64Array;

      function isMapToString(value) {
        return ObjectToString(value) === '[object Map]';
      }
      isMapToString.working = (
        typeof Map !== 'undefined' &&
        isMapToString(new Map())
      );

      function isMap(value) {
        if (typeof Map === 'undefined') {
          return false;
        }

        return isMapToString.working
          ? isMapToString(value)
          : value instanceof Map;
      }
      exports.isMap = isMap;

      function isSetToString(value) {
        return ObjectToString(value) === '[object Set]';
      }
      isSetToString.working = (
        typeof Set !== 'undefined' &&
        isSetToString(new Set())
      );
      function isSet(value) {
        if (typeof Set === 'undefined') {
          return false;
        }

        return isSetToString.working
          ? isSetToString(value)
          : value instanceof Set;
      }
      exports.isSet = isSet;

      function isWeakMapToString(value) {
        return ObjectToString(value) === '[object WeakMap]';
      }
      isWeakMapToString.working = (
        typeof WeakMap !== 'undefined' &&
        isWeakMapToString(new WeakMap())
      );
      function isWeakMap(value) {
        if (typeof WeakMap === 'undefined') {
          return false;
        }

        return isWeakMapToString.working
          ? isWeakMapToString(value)
          : value instanceof WeakMap;
      }
      exports.isWeakMap = isWeakMap;

      function isWeakSetToString(value) {
        return ObjectToString(value) === '[object WeakSet]';
      }
      isWeakSetToString.working = (
        typeof WeakSet !== 'undefined' &&
        isWeakSetToString(new WeakSet())
      );
      function isWeakSet(value) {
        return isWeakSetToString(value);
      }
      exports.isWeakSet = isWeakSet;

      function isArrayBufferToString(value) {
        return ObjectToString(value) === '[object ArrayBuffer]';
      }
      isArrayBufferToString.working = (
        typeof ArrayBuffer !== 'undefined' &&
        isArrayBufferToString(new ArrayBuffer())
      );
      function isArrayBuffer(value) {
        if (typeof ArrayBuffer === 'undefined') {
          return false;
        }

        return isArrayBufferToString.working
          ? isArrayBufferToString(value)
          : value instanceof ArrayBuffer;
      }
      exports.isArrayBuffer = isArrayBuffer;

      function isDataViewToString(value) {
        return ObjectToString(value) === '[object DataView]';
      }
      isDataViewToString.working = (
        typeof ArrayBuffer !== 'undefined' &&
        typeof DataView !== 'undefined' &&
        isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
      );
      function isDataView(value) {
        if (typeof DataView === 'undefined') {
          return false;
        }

        return isDataViewToString.working
          ? isDataViewToString(value)
          : value instanceof DataView;
      }
      exports.isDataView = isDataView;

      function isSharedArrayBufferToString(value) {
        return ObjectToString(value) === '[object SharedArrayBuffer]';
      }
      isSharedArrayBufferToString.working = (
        typeof SharedArrayBuffer !== 'undefined' &&
        isSharedArrayBufferToString(new SharedArrayBuffer())
      );
      function isSharedArrayBuffer(value) {
        if (typeof SharedArrayBuffer === 'undefined') {
          return false;
        }

        return isSharedArrayBufferToString.working
          ? isSharedArrayBufferToString(value)
          : value instanceof SharedArrayBuffer;
      }
      exports.isSharedArrayBuffer = isSharedArrayBuffer;

      function isAsyncFunction(value) {
        return ObjectToString(value) === '[object AsyncFunction]';
      }
      exports.isAsyncFunction = isAsyncFunction;

      function isMapIterator(value) {
        return ObjectToString(value) === '[object Map Iterator]';
      }
      exports.isMapIterator = isMapIterator;

      function isSetIterator(value) {
        return ObjectToString(value) === '[object Set Iterator]';
      }
      exports.isSetIterator = isSetIterator;

      function isGeneratorObject(value) {
        return ObjectToString(value) === '[object Generator]';
      }
      exports.isGeneratorObject = isGeneratorObject;

      function isWebAssemblyCompiledModule(value) {
        return ObjectToString(value) === '[object WebAssembly.Module]';
      }
      exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

      function isNumberObject(value) {
        return checkBoxedPrimitive(value, numberValue);
      }
      exports.isNumberObject = isNumberObject;

      function isStringObject(value) {
        return checkBoxedPrimitive(value, stringValue);
      }
      exports.isStringObject = isStringObject;

      function isBooleanObject(value) {
        return checkBoxedPrimitive(value, booleanValue);
      }
      exports.isBooleanObject = isBooleanObject;

      function isBigIntObject(value) {
        return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
      }
      exports.isBigIntObject = isBigIntObject;

      function isSymbolObject(value) {
        return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
      }
      exports.isSymbolObject = isSymbolObject;

      function isBoxedPrimitive(value) {
        return (
          isNumberObject(value) ||
          isStringObject(value) ||
          isBooleanObject(value) ||
          isBigIntObject(value) ||
          isSymbolObject(value)
        );
      }
      exports.isBoxedPrimitive = isBoxedPrimitive;

      function isAnyArrayBuffer(value) {
        return typeof Uint8Array !== 'undefined' && (
          isArrayBuffer(value) ||
          isSharedArrayBuffer(value)
        );
      }
      exports.isAnyArrayBuffer = isAnyArrayBuffer;

      ['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function (method) {
        Object.defineProperty(exports, method, {
          enumerable: false,
          value: function () {
            throw new Error(method + ' is not supported in userland');
          }
        });
      });

    }, { "is-arguments": 18, "is-generator-function": 20, "is-typed-array": 21, "which-typed-array": 29 }], 28: [function (require, module, exports) {
      (function (process) {
        (function () {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.

          var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
            function getOwnPropertyDescriptors(obj) {
              var keys = Object.keys(obj);
              var descriptors = {};
              for (var i = 0; i < keys.length; i++) {
                descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
              }
              return descriptors;
            };

          var formatRegExp = /%[sdj%]/g;
          exports.format = function (f) {
            if (!isString(f)) {
              var objects = [];
              for (var i = 0; i < arguments.length; i++) {
                objects.push(inspect(arguments[i]));
              }
              return objects.join(' ');
            }

            var i = 1;
            var args = arguments;
            var len = args.length;
            var str = String(f).replace(formatRegExp, function (x) {
              if (x === '%%') return '%';
              if (i >= len) return x;
              switch (x) {
                case '%s': return String(args[i++]);
                case '%d': return Number(args[i++]);
                case '%j':
                  try {
                    return JSON.stringify(args[i++]);
                  } catch (_) {
                    return '[Circular]';
                  }
                default:
                  return x;
              }
            });
            for (var x = args[i]; i < len; x = args[++i]) {
              if (isNull(x) || !isObject(x)) {
                str += ' ' + x;
              } else {
                str += ' ' + inspect(x);
              }
            }
            return str;
          };


          // Mark that a method should not be used.
          // Returns a modified function which warns once by default.
          // If --no-deprecation is set, then it is a no-op.
          exports.deprecate = function (fn, msg) {
            if (typeof process !== 'undefined' && process.noDeprecation === true) {
              return fn;
            }

            // Allow for deprecating things in the process of starting up.
            if (typeof process === 'undefined') {
              return function () {
                return exports.deprecate(fn, msg).apply(this, arguments);
              };
            }

            var warned = false;
            function deprecated() {
              if (!warned) {
                if (process.throwDeprecation) {
                  throw new Error(msg);
                } else if (process.traceDeprecation) {
                  console.trace(msg);
                } else {
                  console.error(msg);
                }
                warned = true;
              }
              return fn.apply(this, arguments);
            }

            return deprecated;
          };


          var debugs = {};
          var debugEnvRegex = /^$/;

          if (process.env.NODE_DEBUG) {
            var debugEnv = process.env.NODE_DEBUG;
            debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
              .replace(/\*/g, '.*')
              .replace(/,/g, '$|^')
              .toUpperCase();
            debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
          }
          exports.debuglog = function (set) {
            set = set.toUpperCase();
            if (!debugs[set]) {
              if (debugEnvRegex.test(set)) {
                var pid = process.pid;
                debugs[set] = function () {
                  var msg = exports.format.apply(exports, arguments);
                  console.error('%s %d: %s', set, pid, msg);
                };
              } else {
                debugs[set] = function () { };
              }
            }
            return debugs[set];
          };


          /**
           * Echos the value of a value. Trys to print the value out
           * in the best way possible given the different types.
           *
           * @param {Object} obj The object to print out.
           * @param {Object} opts Optional options object that alters the output.
           */
          /* legacy: obj, showHidden, depth, colors*/
          function inspect(obj, opts) {
            // default options
            var ctx = {
              seen: [],
              stylize: stylizeNoColor
            };
            // legacy...
            if (arguments.length >= 3) ctx.depth = arguments[2];
            if (arguments.length >= 4) ctx.colors = arguments[3];
            if (isBoolean(opts)) {
              // legacy...
              ctx.showHidden = opts;
            } else if (opts) {
              // got an "options" object
              exports._extend(ctx, opts);
            }
            // set default options
            if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
            if (isUndefined(ctx.depth)) ctx.depth = 2;
            if (isUndefined(ctx.colors)) ctx.colors = false;
            if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
            if (ctx.colors) ctx.stylize = stylizeWithColor;
            return formatValue(ctx, obj, ctx.depth);
          }
          exports.inspect = inspect;


          // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
          inspect.colors = {
            'bold': [1, 22],
            'italic': [3, 23],
            'underline': [4, 24],
            'inverse': [7, 27],
            'white': [37, 39],
            'grey': [90, 39],
            'black': [30, 39],
            'blue': [34, 39],
            'cyan': [36, 39],
            'green': [32, 39],
            'magenta': [35, 39],
            'red': [31, 39],
            'yellow': [33, 39]
          };

          // Don't use 'blue' not visible on cmd.exe
          inspect.styles = {
            'special': 'cyan',
            'number': 'yellow',
            'boolean': 'yellow',
            'undefined': 'grey',
            'null': 'bold',
            'string': 'green',
            'date': 'magenta',
            // "name": intentionally not styling
            'regexp': 'red'
          };


          function stylizeWithColor(str, styleType) {
            var style = inspect.styles[styleType];

            if (style) {
              return '\u001b[' + inspect.colors[style][0] + 'm' + str +
                '\u001b[' + inspect.colors[style][1] + 'm';
            } else {
              return str;
            }
          }


          function stylizeNoColor(str, styleType) {
            return str;
          }


          function arrayToHash(array) {
            var hash = {};

            array.forEach(function (val, idx) {
              hash[val] = true;
            });

            return hash;
          }


          function formatValue(ctx, value, recurseTimes) {
            // Provide a hook for user-specified inspect functions.
            // Check that value is an object with an inspect function on it
            if (ctx.customInspect &&
              value &&
              isFunction(value.inspect) &&
              // Filter out the util module, it's inspect function is special
              value.inspect !== exports.inspect &&
              // Also filter out any prototype objects using the circular check.
              !(value.constructor && value.constructor.prototype === value)) {
              var ret = value.inspect(recurseTimes, ctx);
              if (!isString(ret)) {
                ret = formatValue(ctx, ret, recurseTimes);
              }
              return ret;
            }

            // Primitive types cannot have properties
            var primitive = formatPrimitive(ctx, value);
            if (primitive) {
              return primitive;
            }

            // Look up the keys of the object.
            var keys = Object.keys(value);
            var visibleKeys = arrayToHash(keys);

            if (ctx.showHidden) {
              keys = Object.getOwnPropertyNames(value);
            }

            // IE doesn't make error fields non-enumerable
            // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
            if (isError(value)
              && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
              return formatError(value);
            }

            // Some type of object without properties can be shortcutted.
            if (keys.length === 0) {
              if (isFunction(value)) {
                var name = value.name ? ': ' + value.name : '';
                return ctx.stylize('[Function' + name + ']', 'special');
              }
              if (isRegExp(value)) {
                return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
              }
              if (isDate(value)) {
                return ctx.stylize(Date.prototype.toString.call(value), 'date');
              }
              if (isError(value)) {
                return formatError(value);
              }
            }

            var base = '', array = false, braces = ['{', '}'];

            // Make Array say that they are Array
            if (isArray(value)) {
              array = true;
              braces = ['[', ']'];
            }

            // Make functions say that they are functions
            if (isFunction(value)) {
              var n = value.name ? ': ' + value.name : '';
              base = ' [Function' + n + ']';
            }

            // Make RegExps say that they are RegExps
            if (isRegExp(value)) {
              base = ' ' + RegExp.prototype.toString.call(value);
            }

            // Make dates with properties first say the date
            if (isDate(value)) {
              base = ' ' + Date.prototype.toUTCString.call(value);
            }

            // Make error with message first say the error
            if (isError(value)) {
              base = ' ' + formatError(value);
            }

            if (keys.length === 0 && (!array || value.length == 0)) {
              return braces[0] + base + braces[1];
            }

            if (recurseTimes < 0) {
              if (isRegExp(value)) {
                return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
              } else {
                return ctx.stylize('[Object]', 'special');
              }
            }

            ctx.seen.push(value);

            var output;
            if (array) {
              output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
            } else {
              output = keys.map(function (key) {
                return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
              });
            }

            ctx.seen.pop();

            return reduceToSingleString(output, base, braces);
          }


          function formatPrimitive(ctx, value) {
            if (isUndefined(value))
              return ctx.stylize('undefined', 'undefined');
            if (isString(value)) {
              var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                .replace(/'/g, "\\'")
                .replace(/\\"/g, '"') + '\'';
              return ctx.stylize(simple, 'string');
            }
            if (isNumber(value))
              return ctx.stylize('' + value, 'number');
            if (isBoolean(value))
              return ctx.stylize('' + value, 'boolean');
            // For some reason typeof null is "object", so special case here.
            if (isNull(value))
              return ctx.stylize('null', 'null');
          }


          function formatError(value) {
            return '[' + Error.prototype.toString.call(value) + ']';
          }


          function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
            var output = [];
            for (var i = 0, l = value.length; i < l; ++i) {
              if (hasOwnProperty(value, String(i))) {
                output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                  String(i), true));
              } else {
                output.push('');
              }
            }
            keys.forEach(function (key) {
              if (!key.match(/^\d+$/)) {
                output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                  key, true));
              }
            });
            return output;
          }


          function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
            var name, str, desc;
            desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
            if (desc.get) {
              if (desc.set) {
                str = ctx.stylize('[Getter/Setter]', 'special');
              } else {
                str = ctx.stylize('[Getter]', 'special');
              }
            } else {
              if (desc.set) {
                str = ctx.stylize('[Setter]', 'special');
              }
            }
            if (!hasOwnProperty(visibleKeys, key)) {
              name = '[' + key + ']';
            }
            if (!str) {
              if (ctx.seen.indexOf(desc.value) < 0) {
                if (isNull(recurseTimes)) {
                  str = formatValue(ctx, desc.value, null);
                } else {
                  str = formatValue(ctx, desc.value, recurseTimes - 1);
                }
                if (str.indexOf('\n') > -1) {
                  if (array) {
                    str = str.split('\n').map(function (line) {
                      return '  ' + line;
                    }).join('\n').substr(2);
                  } else {
                    str = '\n' + str.split('\n').map(function (line) {
                      return '   ' + line;
                    }).join('\n');
                  }
                }
              } else {
                str = ctx.stylize('[Circular]', 'special');
              }
            }
            if (isUndefined(name)) {
              if (array && key.match(/^\d+$/)) {
                return str;
              }
              name = JSON.stringify('' + key);
              if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                name = name.substr(1, name.length - 2);
                name = ctx.stylize(name, 'name');
              } else {
                name = name.replace(/'/g, "\\'")
                  .replace(/\\"/g, '"')
                  .replace(/(^"|"$)/g, "'");
                name = ctx.stylize(name, 'string');
              }
            }

            return name + ': ' + str;
          }


          function reduceToSingleString(output, base, braces) {
            var numLinesEst = 0;
            var length = output.reduce(function (prev, cur) {
              numLinesEst++;
              if (cur.indexOf('\n') >= 0) numLinesEst++;
              return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
            }, 0);

            if (length > 60) {
              return braces[0] +
                (base === '' ? '' : base + '\n ') +
                ' ' +
                output.join(',\n  ') +
                ' ' +
                braces[1];
            }

            return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
          }


          // NOTE: These type checking functions intentionally don't use `instanceof`
          // because it is fragile and can be easily faked with `Object.create()`.
          exports.types = require('./support/types');

          function isArray(ar) {
            return Array.isArray(ar);
          }
          exports.isArray = isArray;

          function isBoolean(arg) {
            return typeof arg === 'boolean';
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
            return typeof arg === 'number';
          }
          exports.isNumber = isNumber;

          function isString(arg) {
            return typeof arg === 'string';
          }
          exports.isString = isString;

          function isSymbol(arg) {
            return typeof arg === 'symbol';
          }
          exports.isSymbol = isSymbol;

          function isUndefined(arg) {
            return arg === void 0;
          }
          exports.isUndefined = isUndefined;

          function isRegExp(re) {
            return isObject(re) && objectToString(re) === '[object RegExp]';
          }
          exports.isRegExp = isRegExp;
          exports.types.isRegExp = isRegExp;

          function isObject(arg) {
            return typeof arg === 'object' && arg !== null;
          }
          exports.isObject = isObject;

          function isDate(d) {
            return isObject(d) && objectToString(d) === '[object Date]';
          }
          exports.isDate = isDate;
          exports.types.isDate = isDate;

          function isError(e) {
            return isObject(e) &&
              (objectToString(e) === '[object Error]' || e instanceof Error);
          }
          exports.isError = isError;
          exports.types.isNativeError = isError;

          function isFunction(arg) {
            return typeof arg === 'function';
          }
          exports.isFunction = isFunction;

          function isPrimitive(arg) {
            return arg === null ||
              typeof arg === 'boolean' ||
              typeof arg === 'number' ||
              typeof arg === 'string' ||
              typeof arg === 'symbol' ||  // ES6 symbol
              typeof arg === 'undefined';
          }
          exports.isPrimitive = isPrimitive;

          exports.isBuffer = require('./support/isBuffer');

          function objectToString(o) {
            return Object.prototype.toString.call(o);
          }


          function pad(n) {
            return n < 10 ? '0' + n.toString(10) : n.toString(10);
          }


          var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
            'Oct', 'Nov', 'Dec'];

          // 26 Feb 16:19:34
          function timestamp() {
            var d = new Date();
            var time = [pad(d.getHours()),
            pad(d.getMinutes()),
            pad(d.getSeconds())].join(':');
            return [d.getDate(), months[d.getMonth()], time].join(' ');
          }


          // log is just a thin wrapper to console.log that prepends a timestamp
          exports.log = function () {
            console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
          };


          /**
           * Inherit the prototype methods from one constructor into another.
           *
           * The Function.prototype.inherits from lang.js rewritten as a standalone
           * function (not on Function.prototype). NOTE: If this file is to be loaded
           * during bootstrapping this function needs to be rewritten using some native
           * functions as prototype setup using normal JavaScript does not work as
           * expected during bootstrapping (see mirror.js in r114903).
           *
           * @param {function} ctor Constructor function which needs to inherit the
           *     prototype.
           * @param {function} superCtor Constructor function to inherit prototype from.
           */
          exports.inherits = require('inherits');

          exports._extend = function (origin, add) {
            // Don't do anything if add isn't an object
            if (!add || !isObject(add)) return origin;

            var keys = Object.keys(add);
            var i = keys.length;
            while (i--) {
              origin[keys[i]] = add[keys[i]];
            }
            return origin;
          };

          function hasOwnProperty(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
          }

          var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

          exports.promisify = function promisify(original) {
            if (typeof original !== 'function')
              throw new TypeError('The "original" argument must be of type Function');

            if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
              var fn = original[kCustomPromisifiedSymbol];
              if (typeof fn !== 'function') {
                throw new TypeError('The "util.promisify.custom" argument must be of type Function');
              }
              Object.defineProperty(fn, kCustomPromisifiedSymbol, {
                value: fn, enumerable: false, writable: false, configurable: true
              });
              return fn;
            }

            function fn() {
              var promiseResolve, promiseReject;
              var promise = new Promise(function (resolve, reject) {
                promiseResolve = resolve;
                promiseReject = reject;
              });

              var args = [];
              for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
              }
              args.push(function (err, value) {
                if (err) {
                  promiseReject(err);
                } else {
                  promiseResolve(value);
                }
              });

              try {
                original.apply(this, args);
              } catch (err) {
                promiseReject(err);
              }

              return promise;
            }

            Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

            if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
              value: fn, enumerable: false, writable: false, configurable: true
            });
            return Object.defineProperties(
              fn,
              getOwnPropertyDescriptors(original)
            );
          }

          exports.promisify.custom = kCustomPromisifiedSymbol

          function callbackifyOnRejected(reason, cb) {
            // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
            // Because `null` is a special error value in callbacks which means "no error
            // occurred", we error-wrap so the callback consumer can distinguish between
            // "the promise rejected with null" or "the promise fulfilled with undefined".
            if (!reason) {
              var newReason = new Error('Promise was rejected with a falsy value');
              newReason.reason = reason;
              reason = newReason;
            }
            return cb(reason);
          }

          function callbackify(original) {
            if (typeof original !== 'function') {
              throw new TypeError('The "original" argument must be of type Function');
            }

            // We DO NOT return the promise as it gives the user a false sense that
            // the promise is actually somehow related to the callback's execution
            // and that the callback throwing will reject the promise.
            function callbackified() {
              var args = [];
              for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
              }

              var maybeCb = args.pop();
              if (typeof maybeCb !== 'function') {
                throw new TypeError('The last argument must be of type Function');
              }
              var self = this;
              var cb = function () {
                return maybeCb.apply(self, arguments);
              };
              // In true node style we process the callback on `nextTick` with all the
              // implications (stack, `uncaughtException`, `async_hooks`)
              original.apply(this, args)
                .then(function (ret) { process.nextTick(cb.bind(null, null, ret)) },
                  function (rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
            }

            Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
            Object.defineProperties(callbackified,
              getOwnPropertyDescriptors(original));
            return callbackified;
          }
          exports.callbackify = callbackify;

        }).call(this)
      }).call(this, require('_process'))
    }, { "./support/isBuffer": 26, "./support/types": 27, "_process": 24, "inherits": 17 }], 29: [function (require, module, exports) {
      (function (global) {
        (function () {
          'use strict';

          var forEach = require('foreach');
          var availableTypedArrays = require('available-typed-arrays');
          var callBound = require('es-abstract/helpers/callBound');

          var $toString = callBound('Object.prototype.toString');
          var hasSymbols = require('has-symbols')();
          var hasToStringTag = hasSymbols && typeof Symbol.toStringTag === 'symbol';

          var typedArrays = availableTypedArrays();

          var $slice = callBound('String.prototype.slice');
          var toStrTags = {};
          var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
          var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
          if (hasToStringTag && gOPD && getPrototypeOf) {
            forEach(typedArrays, function (typedArray) {
              if (typeof global[typedArray] === 'function') {
                var arr = new global[typedArray]();
                if (!(Symbol.toStringTag in arr)) {
                  throw new EvalError('this engine has support for Symbol.toStringTag, but ' + typedArray + ' does not have the property! Please report this.');
                }
                var proto = getPrototypeOf(arr);
                var descriptor = gOPD(proto, Symbol.toStringTag);
                if (!descriptor) {
                  var superProto = getPrototypeOf(proto);
                  descriptor = gOPD(superProto, Symbol.toStringTag);
                }
                toStrTags[typedArray] = descriptor.get;
              }
            });
          }

          var tryTypedArrays = function tryAllTypedArrays(value) {
            var foundName = false;
            forEach(toStrTags, function (getter, typedArray) {
              if (!foundName) {
                try {
                  var name = getter.call(value);
                  if (name === typedArray) {
                    foundName = name;
                  }
                } catch (e) { }
              }
            });
            return foundName;
          };

          var isTypedArray = require('is-typed-array');

          module.exports = function whichTypedArray(value) {
            if (!isTypedArray(value)) { return false; }
            if (!hasToStringTag) { return $slice($toString(value), 8, -1); }
            return tryTypedArrays(value);
          };

        }).call(this)
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "available-typed-arrays": 2, "es-abstract/helpers/callBound": 8, "es-abstract/helpers/getOwnPropertyDescriptor": 9, "foreach": 11, "has-symbols": 14, "is-typed-array": 21 }], 30: [function (require, module, exports) {
      var rangeEmitter = require('range-emitter')

      module.exports = client

      function client(db) {
        var re = rangeEmitter()

        db.on('put', onPut)
        db.on('del', onDel)
        db.on('batch', onBatch)

        return {
          session: session,
          emitter: re
        }

        function onPut(key) { onChange(key, 'put') }
        function onDel(key) { onChange(key, 'del') }
        function onBatch(ary) {
          ary.forEach(function (item) {
            onChange(item.key, item.type)
          })
        }

        function onChange(key, type) {
          re.publish(key, type)
        }

        function session(dbStream, wsStream) {
          var reStream = re.connect()
          wsStream.on('error', wsStream.destroy.bind(wsStream))
          wsStream.on('close', function () {
            dbStream.destroy()
            reStream.destroy()
          })
          wsStream.on('data', function (data) {
            reStream.write(data)
            dbStream.write(data)
          })
          dbStream.on('data', function (data) {
            wsStream.write(data)
          })
          reStream.on('data', function (data) {
            wsStream.write(data)
          })
        }
      }

    }, { "range-emitter": 59 }], 31: [function (require, module, exports) {
      exports.server = require('./server')
      exports.client = require('./client')

    }, { "./client": 30, "./server": 80 }], 32: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          function allocUnsafe(size) {
            if (typeof size !== 'number') {
              throw new TypeError('"size" argument must be a number')
            }

            if (size < 0) {
              throw new RangeError('"size" argument must not be negative')
            }

            if (Buffer.allocUnsafe) {
              return Buffer.allocUnsafe(size)
            } else {
              return new Buffer(size)
            }
          }

          module.exports = allocUnsafe

        }).call(this)
      }).call(this, require("buffer").Buffer)
    }, { "buffer": 5 }], 33: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.

          // NOTE: These type checking functions intentionally don't use `instanceof`
          // because it is fragile and can be easily faked with `Object.create()`.

          function isArray(arg) {
            if (Array.isArray) {
              return Array.isArray(arg);
            }
            return objectToString(arg) === '[object Array]';
          }
          exports.isArray = isArray;

          function isBoolean(arg) {
            return typeof arg === 'boolean';
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
            return typeof arg === 'number';
          }
          exports.isNumber = isNumber;

          function isString(arg) {
            return typeof arg === 'string';
          }
          exports.isString = isString;

          function isSymbol(arg) {
            return typeof arg === 'symbol';
          }
          exports.isSymbol = isSymbol;

          function isUndefined(arg) {
            return arg === void 0;
          }
          exports.isUndefined = isUndefined;

          function isRegExp(re) {
            return objectToString(re) === '[object RegExp]';
          }
          exports.isRegExp = isRegExp;

          function isObject(arg) {
            return typeof arg === 'object' && arg !== null;
          }
          exports.isObject = isObject;

          function isDate(d) {
            return objectToString(d) === '[object Date]';
          }
          exports.isDate = isDate;

          function isError(e) {
            return (objectToString(e) === '[object Error]' || e instanceof Error);
          }
          exports.isError = isError;

          function isFunction(arg) {
            return typeof arg === 'function';
          }
          exports.isFunction = isFunction;

          function isPrimitive(arg) {
            return arg === null ||
              typeof arg === 'boolean' ||
              typeof arg === 'number' ||
              typeof arg === 'string' ||
              typeof arg === 'symbol' ||  // ES6 symbol
              typeof arg === 'undefined';
          }
          exports.isPrimitive = isPrimitive;

          exports.isBuffer = Buffer.isBuffer;

          function objectToString(o) {
            return Object.prototype.toString.call(o);
          }

        }).call(this)
      }).call(this, { "isBuffer": require("../../../../../.npm/_npx/74190/lib/node_modules/browserify/node_modules/is-buffer/index.js") })
    }, { "../../../../../.npm/_npx/74190/lib/node_modules/browserify/node_modules/is-buffer/index.js": 19 }], 34: [function (require, module, exports) {
      (function (process, Buffer) {
        (function () {
          var stream = require('readable-stream')
          var eos = require('end-of-stream')
          var inherits = require('inherits')
          var shift = require('stream-shift')

          var SIGNAL_FLUSH = (Buffer.from && Buffer.from !== Uint8Array.from)
            ? Buffer.from([0])
            : new Buffer([0])

          var onuncork = function (self, fn) {
            if (self._corked) self.once('uncork', fn)
            else fn()
          }

          var autoDestroy = function (self, err) {
            if (self._autoDestroy) self.destroy(err)
          }

          var destroyer = function (self, end) {
            return function (err) {
              if (err) autoDestroy(self, err.message === 'premature close' ? null : err)
              else if (end && !self._ended) self.end()
            }
          }

          var end = function (ws, fn) {
            if (!ws) return fn()
            if (ws._writableState && ws._writableState.finished) return fn()
            if (ws._writableState) return ws.end(fn)
            ws.end()
            fn()
          }

          var toStreams2 = function (rs) {
            return new (stream.Readable)({ objectMode: true, highWaterMark: 16 }).wrap(rs)
          }

          var Duplexify = function (writable, readable, opts) {
            if (!(this instanceof Duplexify)) return new Duplexify(writable, readable, opts)
            stream.Duplex.call(this, opts)

            this._writable = null
            this._readable = null
            this._readable2 = null

            this._autoDestroy = !opts || opts.autoDestroy !== false
            this._forwardDestroy = !opts || opts.destroy !== false
            this._forwardEnd = !opts || opts.end !== false
            this._corked = 1 // start corked
            this._ondrain = null
            this._drained = false
            this._forwarding = false
            this._unwrite = null
            this._unread = null
            this._ended = false

            this.destroyed = false

            if (writable) this.setWritable(writable)
            if (readable) this.setReadable(readable)
          }

          inherits(Duplexify, stream.Duplex)

          Duplexify.obj = function (writable, readable, opts) {
            if (!opts) opts = {}
            opts.objectMode = true
            opts.highWaterMark = 16
            return new Duplexify(writable, readable, opts)
          }

          Duplexify.prototype.cork = function () {
            if (++this._corked === 1) this.emit('cork')
          }

          Duplexify.prototype.uncork = function () {
            if (this._corked && --this._corked === 0) this.emit('uncork')
          }

          Duplexify.prototype.setWritable = function (writable) {
            if (this._unwrite) this._unwrite()

            if (this.destroyed) {
              if (writable && writable.destroy) writable.destroy()
              return
            }

            if (writable === null || writable === false) {
              this.end()
              return
            }

            var self = this
            var unend = eos(writable, { writable: true, readable: false }, destroyer(this, this._forwardEnd))

            var ondrain = function () {
              var ondrain = self._ondrain
              self._ondrain = null
              if (ondrain) ondrain()
            }

            var clear = function () {
              self._writable.removeListener('drain', ondrain)
              unend()
            }

            if (this._unwrite) process.nextTick(ondrain) // force a drain on stream reset to avoid livelocks

            this._writable = writable
            this._writable.on('drain', ondrain)
            this._unwrite = clear

            this.uncork() // always uncork setWritable
          }

          Duplexify.prototype.setReadable = function (readable) {
            if (this._unread) this._unread()

            if (this.destroyed) {
              if (readable && readable.destroy) readable.destroy()
              return
            }

            if (readable === null || readable === false) {
              this.push(null)
              this.resume()
              return
            }

            var self = this
            var unend = eos(readable, { writable: false, readable: true }, destroyer(this))

            var onreadable = function () {
              self._forward()
            }

            var onend = function () {
              self.push(null)
            }

            var clear = function () {
              self._readable2.removeListener('readable', onreadable)
              self._readable2.removeListener('end', onend)
              unend()
            }

            this._drained = true
            this._readable = readable
            this._readable2 = readable._readableState ? readable : toStreams2(readable)
            this._readable2.on('readable', onreadable)
            this._readable2.on('end', onend)
            this._unread = clear

            this._forward()
          }

          Duplexify.prototype._read = function () {
            this._drained = true
            this._forward()
          }

          Duplexify.prototype._forward = function () {
            if (this._forwarding || !this._readable2 || !this._drained) return
            this._forwarding = true

            var data

            while (this._drained && (data = shift(this._readable2)) !== null) {
              if (this.destroyed) continue
              this._drained = this.push(data)
            }

            this._forwarding = false
          }

          Duplexify.prototype.destroy = function (err) {
            if (this.destroyed) return
            this.destroyed = true

            var self = this
            process.nextTick(function () {
              self._destroy(err)
            })
          }

          Duplexify.prototype._destroy = function (err) {
            if (err) {
              var ondrain = this._ondrain
              this._ondrain = null
              if (ondrain) ondrain(err)
              else this.emit('error', err)
            }

            if (this._forwardDestroy) {
              if (this._readable && this._readable.destroy) this._readable.destroy()
              if (this._writable && this._writable.destroy) this._writable.destroy()
            }

            this.emit('close')
          }

          Duplexify.prototype._write = function (data, enc, cb) {
            if (this.destroyed) return cb()
            if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb))
            if (data === SIGNAL_FLUSH) return this._finish(cb)
            if (!this._writable) return cb()

            if (this._writable.write(data) === false) this._ondrain = cb
            else cb()
          }

          Duplexify.prototype._finish = function (cb) {
            var self = this
            this.emit('preend')
            onuncork(this, function () {
              end(self._forwardEnd && self._writable, function () {
                // haxx to not emit prefinish twice
                if (self._writableState.prefinished === false) self._writableState.prefinished = true
                self.emit('prefinish')
                onuncork(self, cb)
              })
            })
          }

          Duplexify.prototype.end = function (data, enc, cb) {
            if (typeof data === 'function') return this.end(null, null, data)
            if (typeof enc === 'function') return this.end(data, null, enc)
            this._ended = true
            if (data) this.write(data)
            if (!this._writableState.ending) this.write(SIGNAL_FLUSH)
            return stream.Writable.prototype.end.call(this, cb)
          }

          module.exports = Duplexify

        }).call(this)
      }).call(this, require('_process'), require("buffer").Buffer)
    }, { "_process": 24, "buffer": 5, "end-of-stream": 35, "inherits": 38, "readable-stream": 69, "stream-shift": 72 }], 35: [function (require, module, exports) {
      var once = require('once');

      var noop = function () { };

      var isRequest = function (stream) {
        return stream.setHeader && typeof stream.abort === 'function';
      };

      var isChildProcess = function (stream) {
        return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
      };

      var eos = function (stream, opts, callback) {
        if (typeof opts === 'function') return eos(stream, null, opts);
        if (!opts) opts = {};

        callback = once(callback || noop);

        var ws = stream._writableState;
        var rs = stream._readableState;
        var readable = opts.readable || (opts.readable !== false && stream.readable);
        var writable = opts.writable || (opts.writable !== false && stream.writable);

        var onlegacyfinish = function () {
          if (!stream.writable) onfinish();
        };

        var onfinish = function () {
          writable = false;
          if (!readable) callback.call(stream);
        };

        var onend = function () {
          readable = false;
          if (!writable) callback.call(stream);
        };

        var onexit = function (exitCode) {
          callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
        };

        var onerror = function (err) {
          callback.call(stream, err);
        };

        var onclose = function () {
          if (readable && !(rs && rs.ended)) return callback.call(stream, new Error('premature close'));
          if (writable && !(ws && ws.ended)) return callback.call(stream, new Error('premature close'));
        };

        var onrequest = function () {
          stream.req.on('finish', onfinish);
        };

        if (isRequest(stream)) {
          stream.on('complete', onfinish);
          stream.on('abort', onclose);
          if (stream.req) onrequest();
          else stream.on('request', onrequest);
        } else if (writable && !ws) { // legacy streams
          stream.on('end', onlegacyfinish);
          stream.on('close', onlegacyfinish);
        }

        if (isChildProcess(stream)) stream.on('exit', onexit);

        stream.on('end', onend);
        stream.on('finish', onfinish);
        if (opts.error !== false) stream.on('error', onerror);
        stream.on('close', onclose);

        return function () {
          stream.removeListener('complete', onfinish);
          stream.removeListener('abort', onclose);
          stream.removeListener('request', onrequest);
          if (stream.req) stream.req.removeListener('finish', onfinish);
          stream.removeListener('end', onlegacyfinish);
          stream.removeListener('close', onlegacyfinish);
          stream.removeListener('finish', onfinish);
          stream.removeListener('exit', onexit);
          stream.removeListener('end', onend);
          stream.removeListener('error', onerror);
          stream.removeListener('close', onclose);
        };
      };

      module.exports = eos;

    }, { "once": 45 }], 36: [function (require, module, exports) {
      var util = require('util')
      var isProperty = require('is-property')

      var INDENT_START = /[\{\[]/
      var INDENT_END = /[\}\]]/

      // from https://mathiasbynens.be/notes/reserved-keywords
      var RESERVED = [
        'do',
        'if',
        'in',
        'for',
        'let',
        'new',
        'try',
        'var',
        'case',
        'else',
        'enum',
        'eval',
        'null',
        'this',
        'true',
        'void',
        'with',
        'await',
        'break',
        'catch',
        'class',
        'const',
        'false',
        'super',
        'throw',
        'while',
        'yield',
        'delete',
        'export',
        'import',
        'public',
        'return',
        'static',
        'switch',
        'typeof',
        'default',
        'extends',
        'finally',
        'package',
        'private',
        'continue',
        'debugger',
        'function',
        'arguments',
        'interface',
        'protected',
        'implements',
        'instanceof',
        'NaN',
        'undefined'
      ]

      var RESERVED_MAP = {}

      for (var i = 0; i < RESERVED.length; i++) {
        RESERVED_MAP[RESERVED[i]] = true
      }

      var isVariable = function (name) {
        return isProperty(name) && !RESERVED_MAP.hasOwnProperty(name)
      }

      var formats = {
        s: function (s) {
          return '' + s
        },
        d: function (d) {
          return '' + Number(d)
        },
        o: function (o) {
          return JSON.stringify(o)
        }
      }

      var genfun = function () {
        var lines = []
        var indent = 0
        var vars = {}

        var push = function (str) {
          var spaces = ''
          while (spaces.length < indent * 2) spaces += '  '
          lines.push(spaces + str)
        }

        var pushLine = function (line) {
          if (INDENT_END.test(line.trim()[0]) && INDENT_START.test(line[line.length - 1])) {
            indent--
            push(line)
            indent++
            return
          }
          if (INDENT_START.test(line[line.length - 1])) {
            push(line)
            indent++
            return
          }
          if (INDENT_END.test(line.trim()[0])) {
            indent--
            push(line)
            return
          }

          push(line)
        }

        var line = function (fmt) {
          if (!fmt) return line

          if (arguments.length === 1 && fmt.indexOf('\n') > -1) {
            var lines = fmt.trim().split('\n')
            for (var i = 0; i < lines.length; i++) {
              pushLine(lines[i].trim())
            }
          } else {
            pushLine(util.format.apply(util, arguments))
          }

          return line
        }

        line.scope = {}
        line.formats = formats

        line.sym = function (name) {
          if (!name || !isVariable(name)) name = 'tmp'
          if (!vars[name]) vars[name] = 0
          return name + (vars[name]++ || '')
        }

        line.property = function (obj, name) {
          if (arguments.length === 1) {
            name = obj
            obj = ''
          }

          name = name + ''

          if (isProperty(name)) return (obj ? obj + '.' + name : name)
          return obj ? obj + '[' + JSON.stringify(name) + ']' : JSON.stringify(name)
        }

        line.toString = function () {
          return lines.join('\n')
        }

        line.toFunction = function (scope) {
          if (!scope) scope = {}

          var src = 'return (' + line.toString() + ')'

          Object.keys(line.scope).forEach(function (key) {
            if (!scope[key]) scope[key] = line.scope[key]
          })

          var keys = Object.keys(scope).map(function (key) {
            return key
          })

          var vals = keys.map(function (key) {
            return scope[key]
          })

          return Function.apply(null, keys.concat(src)).apply(null, vals)
        }

        if (arguments.length) line.apply(null, arguments)

        return line
      }

      genfun.formats = formats
      module.exports = genfun

    }, { "is-property": 39, "util": 28 }], 37: [function (require, module, exports) {
      var isProperty = require('is-property')

      var gen = function (obj, prop) {
        return isProperty(prop) ? obj + '.' + prop : obj + '[' + JSON.stringify(prop) + ']'
      }

      gen.valid = isProperty
      gen.property = function (prop) {
        return isProperty(prop) ? prop : JSON.stringify(prop)
      }

      module.exports = gen

    }, { "is-property": 39 }], 38: [function (require, module, exports) {
      arguments[4][17][0].apply(exports, arguments)
    }, { "dup": 17 }], 39: [function (require, module, exports) {
      "use strict"
      function isProperty(str) {
        return /^[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/.test(str)
      }
      module.exports = isProperty
    }, {}], 40: [function (require, module, exports) {
      var toString = {}.toString;

      module.exports = Array.isArray || function (arr) {
        return toString.call(arr) == '[object Array]';
      };

    }, {}], 41: [function (require, module, exports) {
      var varint = require('varint')
      var stream = require('readable-stream')
      var util = require('util')
      var bufferAlloc = require('buffer-alloc-unsafe')

      var Decoder = function (opts) {
        if (!(this instanceof Decoder)) return new Decoder(opts)
        stream.Transform.call(this)

        this._destroyed = false
        this._missing = 0
        this._message = null
        this._limit = opts && opts.limit || 0
        this._allowEmpty = !!(opts && opts.allowEmpty)
        this._prefix = bufferAlloc(this._limit ? varint.encodingLength(this._limit) : 100)
        this._ptr = 0

        if (this._allowEmpty) {
          this._readableState.highWaterMark = 16
          this._readableState.objectMode = true
        }
      }

      util.inherits(Decoder, stream.Transform)

      Decoder.prototype._push = function (message) {
        this._ptr = 0
        this._missing = 0
        this._message = null
        this.push(message)
      }

      Decoder.prototype._parseLength = function (data, offset) {
        for (offset; offset < data.length; offset++) {
          if (this._ptr >= this._prefix.length) return this._prefixError(data)
          this._prefix[this._ptr++] = data[offset]
          if (!(data[offset] & 0x80)) {
            this._missing = varint.decode(this._prefix)
            if (this._limit && this._missing > this._limit) return this._prefixError(data)
            if (!this._missing && this._allowEmpty) this._push(bufferAlloc(0))
            this._ptr = 0
            return offset + 1
          }
        }
        return data.length
      }

      Decoder.prototype._prefixError = function (data) {
        this.destroy(new Error('Message is larger than max length'))
        return data.length
      }

      Decoder.prototype._parseMessage = function (data, offset) {
        var free = data.length - offset
        var missing = this._missing

        if (!this._message) {
          if (missing <= free) { // fast track - no copy
            this._push(data.slice(offset, offset + missing))
            return offset + missing
          }
          this._message = bufferAlloc(missing)
        }

        // TODO: add opt-in "partial mode" to completely avoid copys
        data.copy(this._message, this._ptr, offset, offset + missing)

        if (missing <= free) {
          this._push(this._message)
          return offset + missing
        }

        this._missing -= free
        this._ptr += free

        return data.length
      }

      Decoder.prototype._transform = function (data, enc, cb) {
        var offset = 0

        while (!this._destroyed && offset < data.length) {
          if (this._missing) offset = this._parseMessage(data, offset)
          else offset = this._parseLength(data, offset)
        }

        cb()
      }

      Decoder.prototype.destroy = function (err) {
        if (this._destroyed) return
        this._destroyed = true
        if (err) this.emit('error', err)
        this.emit('close')
      }

      module.exports = Decoder

    }, { "buffer-alloc-unsafe": 32, "readable-stream": 69, "util": 28, "varint": 77 }], 42: [function (require, module, exports) {
      var varint = require('varint')
      var stream = require('readable-stream')
      var util = require('util')
      var bufferAlloc = require('buffer-alloc-unsafe')

      var pool = bufferAlloc(10 * 1024)
      var used = 0

      var Encoder = function () {
        if (!(this instanceof Encoder)) return new Encoder()
        stream.Transform.call(this)
        this._destroyed = false
      }

      util.inherits(Encoder, stream.Transform)

      Encoder.prototype._transform = function (data, enc, cb) {
        if (this._destroyed) return cb()

        varint.encode(data.length, pool, used)
        used += varint.encode.bytes

        this.push(pool.slice(used - varint.encode.bytes, used))
        this.push(data)

        if (pool.length - used < 100) {
          pool = bufferAlloc(10 * 1024)
          used = 0
        }

        cb()
      }

      Encoder.prototype.destroy = function (err) {
        if (this._destroyed) return
        this._destroyed = true
        if (err) this.emit('error', err)
        this.emit('close')
      }

      module.exports = Encoder

    }, { "buffer-alloc-unsafe": 32, "readable-stream": 69, "util": 28, "varint": 77 }], 43: [function (require, module, exports) {
      exports.encode = require('./encode')
      exports.decode = require('./decode')

    }, { "./decode": 41, "./encode": 42 }], 44: [function (require, module, exports) {
      (function (Buffer) {
        (function () {

          exports.compare = function (a, b) {

            if (Buffer.isBuffer(a)) {
              var l = Math.min(a.length, b.length)
              for (var i = 0; i < l; i++) {
                var cmp = a[i] - b[i]
                if (cmp) return cmp
              }
              return a.length - b.length
            }

            return a < b ? -1 : a > b ? 1 : 0
          }

          // to be compatible with the current abstract-leveldown tests
          // nullish or empty strings.
          // I could use !!val but I want to permit numbers and booleans,
          // if possible.

          function isDef(val) {
            return val !== undefined && val !== ''
          }

          function has(range, name) {
            return Object.hasOwnProperty.call(range, name)
          }

          function hasKey(range, name) {
            return Object.hasOwnProperty.call(range, name) && name
          }

          var lowerBoundKey = exports.lowerBoundKey = function (range) {
            return (
              hasKey(range, 'gt')
              || hasKey(range, 'gte')
              || hasKey(range, 'min')
              || (range.reverse ? hasKey(range, 'end') : hasKey(range, 'start'))
              || undefined
            )
          }

          var lowerBound = exports.lowerBound = function (range, def) {
            var k = lowerBoundKey(range)
            return k ? range[k] : def
          }

          var lowerBoundInclusive = exports.lowerBoundInclusive = function (range) {
            return has(range, 'gt') ? false : true
          }

          var upperBoundInclusive = exports.upperBoundInclusive =
            function (range) {
              return (has(range, 'lt') /*&& !range.maxEx*/) ? false : true
            }

          var lowerBoundExclusive = exports.lowerBoundExclusive =
            function (range) {
              return !lowerBoundInclusive(range)
            }

          var upperBoundExclusive = exports.upperBoundExclusive =
            function (range) {
              return !upperBoundInclusive(range)
            }

          var upperBoundKey = exports.upperBoundKey = function (range) {
            return (
              hasKey(range, 'lt')
              || hasKey(range, 'lte')
              || hasKey(range, 'max')
              || (range.reverse ? hasKey(range, 'start') : hasKey(range, 'end'))
              || undefined
            )
          }

          var upperBound = exports.upperBound = function (range, def) {
            var k = upperBoundKey(range)
            return k ? range[k] : def
          }

          exports.start = function (range, def) {
            return range.reverse ? upperBound(range, def) : lowerBound(range, def)
          }
          exports.end = function (range, def) {
            return range.reverse ? lowerBound(range, def) : upperBound(range, def)
          }
          exports.startInclusive = function (range) {
            return (
              range.reverse
                ? upperBoundInclusive(range)
                : lowerBoundInclusive(range)
            )
          }
          exports.endInclusive = function (range) {
            return (
              range.reverse
                ? lowerBoundInclusive(range)
                : upperBoundInclusive(range)
            )
          }

          function id(e) { return e }

          exports.toLtgt = function (range, _range, map, lower, upper) {
            _range = _range || {}
            map = map || id
            var defaults = arguments.length > 3
            var lb = exports.lowerBoundKey(range)
            var ub = exports.upperBoundKey(range)
            if (lb) {
              if (lb === 'gt') _range.gt = map(range.gt, false)
              else _range.gte = map(range[lb], false)
            }
            else if (defaults)
              _range.gte = map(lower, false)

            if (ub) {
              if (ub === 'lt') _range.lt = map(range.lt, true)
              else _range.lte = map(range[ub], true)
            }
            else if (defaults)
              _range.lte = map(upper, true)

            if (range.reverse != null)
              _range.reverse = !!range.reverse

            //if range was used mutably
            //(in level-sublevel it's part of an options object
            //that has more properties on it.)
            if (has(_range, 'max')) delete _range.max
            if (has(_range, 'min')) delete _range.min
            if (has(_range, 'start')) delete _range.start
            if (has(_range, 'end')) delete _range.end

            return _range
          }

          exports.contains = function (range, key, compare) {
            compare = compare || exports.compare

            var lb = lowerBound(range)
            if (isDef(lb)) {
              var cmp = compare(key, lb)
              if (cmp < 0 || (cmp === 0 && lowerBoundExclusive(range)))
                return false
            }

            var ub = upperBound(range)
            if (isDef(ub)) {
              var cmp = compare(key, ub)
              if (cmp > 0 || (cmp === 0) && upperBoundExclusive(range))
                return false
            }

            return true
          }

          exports.filter = function (range, compare) {
            return function (key) {
              return exports.contains(range, key, compare)
            }
          }



        }).call(this)
      }).call(this, { "isBuffer": require("../../../../.npm/_npx/74190/lib/node_modules/browserify/node_modules/is-buffer/index.js") })
    }, { "../../../../.npm/_npx/74190/lib/node_modules/browserify/node_modules/is-buffer/index.js": 19 }], 45: [function (require, module, exports) {
      var wrappy = require('wrappy')
      module.exports = wrappy(once)
      module.exports.strict = wrappy(onceStrict)

      once.proto = once(function () {
        Object.defineProperty(Function.prototype, 'once', {
          value: function () {
            return once(this)
          },
          configurable: true
        })

        Object.defineProperty(Function.prototype, 'onceStrict', {
          value: function () {
            return onceStrict(this)
          },
          configurable: true
        })
      })

      function once(fn) {
        var f = function () {
          if (f.called) return f.value
          f.called = true
          return f.value = fn.apply(this, arguments)
        }
        f.called = false
        return f
      }

      function onceStrict(fn) {
        var f = function () {
          if (f.called)
            throw new Error(f.onceError)
          f.called = true
          return f.value = fn.apply(this, arguments)
        }
        var name = fn.name || 'Function wrapped with `once`'
        f.onceError = name + " shouldn't be called more than once"
        f.called = false
        return f
      }

    }, { "wrappy": 79 }], 46: [function (require, module, exports) {
      (function (process) {
        (function () {
          'use strict';

          if (typeof process === 'undefined' ||
            !process.version ||
            process.version.indexOf('v0.') === 0 ||
            process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
            module.exports = { nextTick: nextTick };
          } else {
            module.exports = process
          }

          function nextTick(fn, arg1, arg2, arg3) {
            if (typeof fn !== 'function') {
              throw new TypeError('"callback" argument must be a function');
            }
            var len = arguments.length;
            var args, i;
            switch (len) {
              case 0:
              case 1:
                return process.nextTick(fn);
              case 2:
                return process.nextTick(function afterTickOne() {
                  fn.call(null, arg1);
                });
              case 3:
                return process.nextTick(function afterTickTwo() {
                  fn.call(null, arg1, arg2);
                });
              case 4:
                return process.nextTick(function afterTickThree() {
                  fn.call(null, arg1, arg2, arg3);
                });
              default:
                args = new Array(len - 1);
                i = 0;
                while (i < args.length) {
                  args[i++] = arguments[i];
                }
                return process.nextTick(function afterTick() {
                  fn.apply(null, args);
                });
            }
          }


        }).call(this)
      }).call(this, require('_process'))
    }, { "_process": 24 }], 47: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          var varint = require('varint')
          var svarint = require('signed-varint')

          exports.make = encoder

          exports.name = function (enc) {
            var keys = Object.keys(exports)
            for (var i = 0; i < keys.length; i++) {
              if (exports[keys[i]] === enc) return keys[i]
            }
            return null
          }

          exports.skip = function (type, buffer, offset) {
            switch (type) {
              case 0:
                varint.decode(buffer, offset)
                return offset + varint.decode.bytes

              case 1:
                return offset + 8

              case 2:
                var len = varint.decode(buffer, offset)
                return offset + varint.decode.bytes + len

              case 3:
              case 4:
                throw new Error('Groups are not supported')

              case 5:
                return offset + 4
            }

            throw new Error('Unknown wire type: ' + type)
          }

          exports.bytes = encoder(2,
            function encode(val, buffer, offset) {
              var oldOffset = offset
              var len = bufferLength(val)

              varint.encode(len, buffer, offset)
              offset += varint.encode.bytes

              if (Buffer.isBuffer(val)) val.copy(buffer, offset)
              else buffer.write(val, offset, len)
              offset += len

              encode.bytes = offset - oldOffset
              return buffer
            },
            function decode(buffer, offset) {
              var oldOffset = offset

              var len = varint.decode(buffer, offset)
              offset += varint.decode.bytes

              var val = buffer.slice(offset, offset + len)
              offset += val.length

              decode.bytes = offset - oldOffset
              return val
            },
            function encodingLength(val) {
              var len = bufferLength(val)
              return varint.encodingLength(len) + len
            }
          )

          exports.string = encoder(2,
            function encode(val, buffer, offset) {
              var oldOffset = offset
              var len = Buffer.byteLength(val)

              varint.encode(len, buffer, offset, 'utf-8')
              offset += varint.encode.bytes

              buffer.write(val, offset, len)
              offset += len

              encode.bytes = offset - oldOffset
              return buffer
            },
            function decode(buffer, offset) {
              var oldOffset = offset

              var len = varint.decode(buffer, offset)
              offset += varint.decode.bytes

              var val = buffer.toString('utf-8', offset, offset + len)
              offset += len

              decode.bytes = offset - oldOffset
              return val
            },
            function encodingLength(val) {
              var len = Buffer.byteLength(val)
              return varint.encodingLength(len) + len
            }
          )

          exports.bool = encoder(0,
            function encode(val, buffer, offset) {
              buffer[offset] = val ? 1 : 0
              encode.bytes = 1
              return buffer
            },
            function decode(buffer, offset) {
              var bool = buffer[offset] > 0
              decode.bytes = 1
              return bool
            },
            function encodingLength() {
              return 1
            }
          )

          exports.int32 = encoder(0,
            function encode(val, buffer, offset) {
              varint.encode(val < 0 ? val + 4294967296 : val, buffer, offset)
              encode.bytes = varint.encode.bytes
              return buffer
            },
            function decode(buffer, offset) {
              var val = varint.decode(buffer, offset)
              decode.bytes = varint.decode.bytes
              return val > 2147483647 ? val - 4294967296 : val
            },
            function encodingLength(val) {
              return varint.encodingLength(val < 0 ? val + 4294967296 : val)
            }
          )

          exports.int64 = encoder(0,
            function encode(val, buffer, offset) {
              if (val < 0) {
                var last = offset + 9
                varint.encode(val * -1, buffer, offset)
                offset += varint.encode.bytes - 1
                buffer[offset] = buffer[offset] | 0x80
                while (offset < last - 1) {
                  offset++
                  buffer[offset] = 0xff
                }
                buffer[last] = 0x01
                encode.bytes = 10
              } else {
                varint.encode(val, buffer, offset)
                encode.bytes = varint.encode.bytes
              }
              return buffer
            },
            function decode(buffer, offset) {
              var val = varint.decode(buffer, offset)
              if (val >= Math.pow(2, 63)) {
                var limit = 9
                while (buffer[offset + limit - 1] === 0xff) limit--
                limit = limit || 9
                var subset = Buffer.allocUnsafe(limit)
                buffer.copy(subset, 0, offset, offset + limit)
                subset[limit - 1] = subset[limit - 1] & 0x7f
                val = -1 * varint.decode(subset, 0)
                decode.bytes = 10
              } else {
                decode.bytes = varint.decode.bytes
              }
              return val
            },
            function encodingLength(val) {
              return val < 0 ? 10 : varint.encodingLength(val)
            }
          )

          exports.sint32 =
            exports.sint64 = encoder(0,
              svarint.encode,
              svarint.decode,
              svarint.encodingLength
            )

          exports.uint32 =
            exports.uint64 =
            exports.enum =
            exports.varint = encoder(0,
              varint.encode,
              varint.decode,
              varint.encodingLength
            )

          // we cannot represent these in javascript so we just use buffers
          exports.fixed64 =
            exports.sfixed64 = encoder(1,
              function encode(val, buffer, offset) {
                val.copy(buffer, offset)
                encode.bytes = 8
                return buffer
              },
              function decode(buffer, offset) {
                var val = buffer.slice(offset, offset + 8)
                decode.bytes = 8
                return val
              },
              function encodingLength() {
                return 8
              }
            )

          exports.double = encoder(1,
            function encode(val, buffer, offset) {
              buffer.writeDoubleLE(val, offset)
              encode.bytes = 8
              return buffer
            },
            function decode(buffer, offset) {
              var val = buffer.readDoubleLE(offset)
              decode.bytes = 8
              return val
            },
            function encodingLength() {
              return 8
            }
          )

          exports.fixed32 = encoder(5,
            function encode(val, buffer, offset) {
              buffer.writeUInt32LE(val, offset)
              encode.bytes = 4
              return buffer
            },
            function decode(buffer, offset) {
              var val = buffer.readUInt32LE(offset)
              decode.bytes = 4
              return val
            },
            function encodingLength() {
              return 4
            }
          )

          exports.sfixed32 = encoder(5,
            function encode(val, buffer, offset) {
              buffer.writeInt32LE(val, offset)
              encode.bytes = 4
              return buffer
            },
            function decode(buffer, offset) {
              var val = buffer.readInt32LE(offset)
              decode.bytes = 4
              return val
            },
            function encodingLength() {
              return 4
            }
          )

          exports.float = encoder(5,
            function encode(val, buffer, offset) {
              buffer.writeFloatLE(val, offset)
              encode.bytes = 4
              return buffer
            },
            function decode(buffer, offset) {
              var val = buffer.readFloatLE(offset)
              decode.bytes = 4
              return val
            },
            function encodingLength() {
              return 4
            }
          )

          function encoder(type, encode, decode, encodingLength) {
            encode.bytes = decode.bytes = 0

            return {
              type: type,
              encode: encode,
              decode: decode,
              encodingLength: encodingLength
            }
          }

          function bufferLength(val) {
            return Buffer.isBuffer(val) ? val.length : Buffer.byteLength(val)
          }

        }).call(this)
      }).call(this, require("buffer").Buffer)
    }, { "buffer": 5, "signed-varint": 71, "varint": 50 }], 48: [function (require, module, exports) {
      module.exports = read

      var MSB = 0x80
        , REST = 0x7F

      function read(buf, offset) {
        var res = 0
          , offset = offset || 0
          , shift = 0
          , counter = offset
          , b
          , l = buf.length

        do {
          if (counter >= l) {
            read.bytes = 0
            throw new RangeError('Could not decode varint')
          }
          b = buf[counter++]
          res += shift < 28
            ? (b & REST) << shift
            : (b & REST) * Math.pow(2, shift)
          shift += 7
        } while (b >= MSB)

        read.bytes = counter - offset

        return res
      }

    }, {}], 49: [function (require, module, exports) {
      module.exports = encode

      var MSB = 0x80
        , REST = 0x7F
        , MSBALL = ~REST
        , INT = Math.pow(2, 31)

      function encode(num, out, offset) {
        out = out || []
        offset = offset || 0
        var oldOffset = offset

        while (num >= INT) {
          out[offset++] = (num & 0xFF) | MSB
          num /= 128
        }
        while (num & MSBALL) {
          out[offset++] = (num & 0xFF) | MSB
          num >>>= 7
        }
        out[offset] = num | 0

        encode.bytes = offset - oldOffset + 1

        return out
      }

    }, {}], 50: [function (require, module, exports) {
      module.exports = {
        encode: require('./encode.js')
        , decode: require('./decode.js')
        , encodingLength: require('./length.js')
      }

    }, { "./decode.js": 48, "./encode.js": 49, "./length.js": 51 }], 51: [function (require, module, exports) {

      var N1 = Math.pow(2, 7)
      var N2 = Math.pow(2, 14)
      var N3 = Math.pow(2, 21)
      var N4 = Math.pow(2, 28)
      var N5 = Math.pow(2, 35)
      var N6 = Math.pow(2, 42)
      var N7 = Math.pow(2, 49)
      var N8 = Math.pow(2, 56)
      var N9 = Math.pow(2, 63)

      module.exports = function (value) {
        return (
          value < N1 ? 1
            : value < N2 ? 2
              : value < N3 ? 3
                : value < N4 ? 4
                  : value < N5 ? 5
                    : value < N6 ? 6
                      : value < N7 ? 7
                        : value < N8 ? 8
                          : value < N9 ? 9
                            : 10
        )
      }

    }, {}], 52: [function (require, module, exports) {
      var parse = require('./parse')
      var stringify = require('./stringify')

      module.exports = parse
      module.exports.parse = parse
      module.exports.stringify = stringify

    }, { "./parse": 53, "./stringify": 54 }], 53: [function (require, module, exports) {
      var tokenize = require('./tokenize')
      var MAX_RANGE = 0x1FFFFFFF

      // "Only repeated fields of primitive numeric types (types which use the varint, 32-bit, or 64-bit wire types) can be declared "packed"."
      // https://developers.google.com/protocol-buffers/docs/encoding#optional
      var PACKABLE_TYPES = [
        // varint wire types
        'int32', 'int64', 'uint32', 'uint64', 'sint32', 'sint64', 'bool',
        // + ENUMS
        // 64-bit wire types
        'fixed64', 'sfixed64', 'double',
        // 32-bit wire types
        'fixed32', 'sfixed32', 'float'
      ]

      var onfieldoptions = function (tokens) {
        var opts = {}

        while (tokens.length) {
          switch (tokens[0]) {
            case '[':
            case ',':
              tokens.shift()
              var name = tokens.shift()
              if (name === '(') { // handling [(A) = B]
                name = tokens.shift()
                tokens.shift() // remove the end of bracket
              }
              if (tokens[0] !== '=') throw new Error('Unexpected token in field options: ' + tokens[0])
              tokens.shift()
              if (tokens[0] === ']') throw new Error('Unexpected ] in field option')
              opts[name] = tokens.shift()
              break
            case ']':
              tokens.shift()
              return opts

            default:
              throw new Error('Unexpected token in field options: ' + tokens[0])
          }
        }

        throw new Error('No closing tag for field options')
      }

      var onfield = function (tokens) {
        var field = {
          name: null,
          type: null,
          tag: -1,
          map: null,
          oneof: null,
          required: false,
          repeated: false,
          options: {}
        }

        while (tokens.length) {
          switch (tokens[0]) {
            case '=':
              tokens.shift()
              field.tag = Number(tokens.shift())
              break

            case 'map':
              field.type = 'map'
              field.map = { from: null, to: null }
              tokens.shift()
              if (tokens[0] !== '<') throw new Error('Unexpected token in map type: ' + tokens[0])
              tokens.shift()
              field.map.from = tokens.shift()
              if (tokens[0] !== ',') throw new Error('Unexpected token in map type: ' + tokens[0])
              tokens.shift()
              field.map.to = tokens.shift()
              if (tokens[0] !== '>') throw new Error('Unexpected token in map type: ' + tokens[0])
              tokens.shift()
              field.name = tokens.shift()
              break

            case 'repeated':
            case 'required':
            case 'optional':
              var t = tokens.shift()
              field.required = t === 'required'
              field.repeated = t === 'repeated'
              field.type = tokens.shift()
              field.name = tokens.shift()
              break

            case '[':
              field.options = onfieldoptions(tokens)
              break

            case ';':
              if (field.name === null) throw new Error('Missing field name')
              if (field.type === null) throw new Error('Missing type in message field: ' + field.name)
              if (field.tag === -1) throw new Error('Missing tag number in message field: ' + field.name)
              tokens.shift()
              return field

            default:
              throw new Error('Unexpected token in message field: ' + tokens[0])
          }
        }

        throw new Error('No ; found for message field')
      }

      var onmessagebody = function (tokens) {
        var body = {
          enums: [],
          options: {},
          messages: [],
          fields: [],
          extends: [],
          extensions: null
        }

        while (tokens.length) {
          switch (tokens[0]) {
            case 'map':
            case 'repeated':
            case 'optional':
            case 'required':
              body.fields.push(onfield(tokens))
              break

            case 'enum':
              body.enums.push(onenum(tokens))
              break

            case 'message':
              body.messages.push(onmessage(tokens))
              break

            case 'extensions':
              body.extensions = onextensions(tokens)
              break

            case 'oneof':
              tokens.shift()
              var name = tokens.shift()
              if (tokens[0] !== '{') throw new Error('Unexpected token in oneof: ' + tokens[0])
              tokens.shift()
              while (tokens[0] !== '}') {
                tokens.unshift('optional')
                var field = onfield(tokens)
                field.oneof = name
                body.fields.push(field)
              }
              tokens.shift()
              break

            case 'extend':
              body.extends.push(onextend(tokens))
              break

            case ';':
              tokens.shift()
              break

            case 'reserved':
              tokens.shift()
              while (tokens[0] !== ';') {
                tokens.shift()
              }
              break

            case 'option':
              var opt = onoption(tokens)
              if (body.options[opt.name] !== undefined) throw new Error('Duplicate option ' + opt.name)
              body.options[opt.name] = opt.value
              break

            default:
              // proto3 does not require the use of optional/required, assumed as optional
              // "singular: a well-formed message can have zero or one of this field (but not more than one)."
              // https://developers.google.com/protocol-buffers/docs/proto3#specifying-field-rules
              tokens.unshift('optional')
              body.fields.push(onfield(tokens))
          }
        }

        return body
      }

      var onextend = function (tokens) {
        var out = {
          name: tokens[1],
          message: onmessage(tokens)
        }
        return out
      }

      var onextensions = function (tokens) {
        tokens.shift()
        var from = Number(tokens.shift())
        if (isNaN(from)) throw new Error('Invalid from in extensions definition')
        if (tokens.shift() !== 'to') throw new Error("Expected keyword 'to' in extensions definition")
        var to = tokens.shift()
        if (to === 'max') to = MAX_RANGE
        to = Number(to)
        if (isNaN(to)) throw new Error('Invalid to in extensions definition')
        if (tokens.shift() !== ';') throw new Error('Missing ; in extensions definition')
        return { from: from, to: to }
      }
      var onmessage = function (tokens) {
        tokens.shift()

        var lvl = 1
        var body = []
        var msg = {
          name: tokens.shift(),
          options: {},
          enums: [],
          extends: [],
          messages: [],
          fields: []
        }

        if (tokens[0] !== '{') throw new Error('Expected { but found ' + tokens[0])
        tokens.shift()

        while (tokens.length) {
          if (tokens[0] === '{') lvl++
          else if (tokens[0] === '}') lvl--

          if (!lvl) {
            tokens.shift()
            body = onmessagebody(body)
            msg.enums = body.enums
            msg.messages = body.messages
            msg.fields = body.fields
            msg.extends = body.extends
            msg.extensions = body.extensions
            msg.options = body.options
            return msg
          }

          body.push(tokens.shift())
        }

        if (lvl) throw new Error('No closing tag for message')
      }

      var onpackagename = function (tokens) {
        tokens.shift()
        var name = tokens.shift()
        if (tokens[0] !== ';') throw new Error('Expected ; but found ' + tokens[0])
        tokens.shift()
        return name
      }

      var onsyntaxversion = function (tokens) {
        tokens.shift()

        if (tokens[0] !== '=') throw new Error('Expected = but found ' + tokens[0])
        tokens.shift()

        var version = tokens.shift()
        switch (version) {
          case '"proto2"':
            version = 2
            break

          case '"proto3"':
            version = 3
            break

          default:
            throw new Error('Expected protobuf syntax version but found ' + version)
        }

        if (tokens[0] !== ';') throw new Error('Expected ; but found ' + tokens[0])
        tokens.shift()

        return version
      }

      var onenumvalue = function (tokens) {
        if (tokens.length < 4) throw new Error('Invalid enum value: ' + tokens.slice(0, 3).join(' '))
        if (tokens[1] !== '=') throw new Error('Expected = but found ' + tokens[1])
        if (tokens[3] !== ';' && tokens[3] !== '[') throw new Error('Expected ; or [ but found ' + tokens[1])

        var name = tokens.shift()
        tokens.shift()
        var val = {
          value: null,
          options: {}
        }
        val.value = Number(tokens.shift())
        if (tokens[0] === '[') {
          val.options = onfieldoptions(tokens)
        }
        tokens.shift() // expecting the semicolon here

        return {
          name: name,
          val: val
        }
      }

      var onenum = function (tokens) {
        tokens.shift()
        var options = {}
        var e = {
          name: tokens.shift(),
          values: {},
          options: {}
        }

        if (tokens[0] !== '{') throw new Error('Expected { but found ' + tokens[0])
        tokens.shift()

        while (tokens.length) {
          if (tokens[0] === '}') {
            tokens.shift()
            // there goes optional semicolon after the enclosing "}"
            if (tokens[0] === ';') tokens.shift()
            return e
          }
          if (tokens[0] === 'option') {
            options = onoption(tokens)
            e.options[options.name] = options.value
            continue
          }
          var val = onenumvalue(tokens)
          e.values[val.name] = val.val
        }

        throw new Error('No closing tag for enum')
      }

      var onoption = function (tokens) {
        var name = null
        var value = null

        var parse = function (value) {
          if (value === 'true') return true
          if (value === 'false') return false
          return value.replace(/^"+|"+$/gm, '')
        }

        while (tokens.length) {
          if (tokens[0] === ';') {
            tokens.shift()
            return { name: name, value: value }
          }
          switch (tokens[0]) {
            case 'option':
              tokens.shift()

              var hasBracket = tokens[0] === '('
              if (hasBracket) tokens.shift()

              name = tokens.shift()

              if (hasBracket) {
                if (tokens[0] !== ')') throw new Error('Expected ) but found ' + tokens[0])
                tokens.shift()
              }

              if (tokens[0][0] === '.') {
                name += tokens.shift()
              }

              break

            case '=':
              tokens.shift()
              if (name === null) throw new Error('Expected key for option with value: ' + tokens[0])
              value = parse(tokens.shift())

              if (name === 'optimize_for' && !/^(SPEED|CODE_SIZE|LITE_RUNTIME)$/.test(value)) {
                throw new Error('Unexpected value for option optimize_for: ' + value)
              } else if (value === '{') {
                // option foo = {bar: baz}
                value = onoptionMap(tokens)
              }
              break

            default:
              throw new Error('Unexpected token in option: ' + tokens[0])
          }
        }
      }

      var onoptionMap = function (tokens) {
        var parse = function (value) {
          if (value === 'true') return true
          if (value === 'false') return false
          return value.replace(/^"+|"+$/gm, '')
        }

        var map = {}

        while (tokens.length) {
          if (tokens[0] === '}') {
            tokens.shift()
            return map
          }

          var hasBracket = tokens[0] === '('
          if (hasBracket) tokens.shift()

          var key = tokens.shift()
          if (hasBracket) {
            if (tokens[0] !== ')') throw new Error('Expected ) but found ' + tokens[0])
            tokens.shift()
          }

          var value = null

          switch (tokens[0]) {
            case ':':
              if (map[key] !== undefined) throw new Error('Duplicate option map key ' + key)

              tokens.shift()

              value = parse(tokens.shift())

              if (value === '{') {
                // option foo = {bar: baz}
                value = onoptionMap(tokens)
              }

              map[key] = value

              if (tokens[0] === ';') {
                tokens.shift()
              }
              break

            case '{':
              tokens.shift()
              value = onoptionMap(tokens)

              if (map[key] === undefined) map[key] = []
              if (!Array.isArray(map[key])) throw new Error('Duplicate option map key ' + key)

              map[key].push(value)
              break

            default:
              throw new Error('Unexpected token in option map: ' + tokens[0])
          }
        }

        throw new Error('No closing tag for option map')
      }

      var onimport = function (tokens) {
        tokens.shift()
        var file = tokens.shift().replace(/^"+|"+$/gm, '')

        if (tokens[0] !== ';') throw new Error('Unexpected token: ' + tokens[0] + '. Expected ";"')

        tokens.shift()
        return file
      }

      var onservice = function (tokens) {
        tokens.shift()

        var service = {
          name: tokens.shift(),
          methods: [],
          options: {}
        }

        if (tokens[0] !== '{') throw new Error('Expected { but found ' + tokens[0])
        tokens.shift()

        while (tokens.length) {
          if (tokens[0] === '}') {
            tokens.shift()
            // there goes optional semicolon after the enclosing "}"
            if (tokens[0] === ';') tokens.shift()
            return service
          }

          switch (tokens[0]) {
            case 'option':
              var opt = onoption(tokens)
              if (service.options[opt.name] !== undefined) throw new Error('Duplicate option ' + opt.name)
              service.options[opt.name] = opt.value
              break
            case 'rpc':
              service.methods.push(onrpc(tokens))
              break
            default:
              throw new Error('Unexpected token in service: ' + tokens[0])
          }
        }

        throw new Error('No closing tag for service')
      }

      var onrpc = function (tokens) {
        tokens.shift()

        var rpc = {
          name: tokens.shift(),
          input_type: null,
          output_type: null,
          client_streaming: false,
          server_streaming: false,
          options: {}
        }

        if (tokens[0] !== '(') throw new Error('Expected ( but found ' + tokens[0])
        tokens.shift()

        if (tokens[0] === 'stream') {
          tokens.shift()
          rpc.client_streaming = true
        }

        rpc.input_type = tokens.shift()

        if (tokens[0] !== ')') throw new Error('Expected ) but found ' + tokens[0])
        tokens.shift()

        if (tokens[0] !== 'returns') throw new Error('Expected returns but found ' + tokens[0])
        tokens.shift()

        if (tokens[0] !== '(') throw new Error('Expected ( but found ' + tokens[0])
        tokens.shift()

        if (tokens[0] === 'stream') {
          tokens.shift()
          rpc.server_streaming = true
        }

        rpc.output_type = tokens.shift()

        if (tokens[0] !== ')') throw new Error('Expected ) but found ' + tokens[0])
        tokens.shift()

        if (tokens[0] === ';') {
          tokens.shift()
          return rpc
        }

        if (tokens[0] !== '{') throw new Error('Expected { but found ' + tokens[0])
        tokens.shift()

        while (tokens.length) {
          if (tokens[0] === '}') {
            tokens.shift()
            // there goes optional semicolon after the enclosing "}"
            if (tokens[0] === ';') tokens.shift()
            return rpc
          }

          if (tokens[0] === 'option') {
            var opt = onoption(tokens)
            if (rpc.options[opt.name] !== undefined) throw new Error('Duplicate option ' + opt.name)
            rpc.options[opt.name] = opt.value
          } else {
            throw new Error('Unexpected token in rpc options: ' + tokens[0])
          }
        }

        throw new Error('No closing tag for rpc')
      }

      var parse = function (buf) {
        var tokens = tokenize(buf.toString())
        // check for isolated strings in tokens by looking for opening quote
        for (var i = 0; i < tokens.length; i++) {
          if (/^("|')([^'"]*)$/.test(tokens[i])) {
            var j
            if (tokens[i].length === 1) {
              j = i + 1
            } else {
              j = i
            }
            // look ahead for the closing quote and collapse all
            // in-between tokens into a single token
            for (j; j < tokens.length; j++) {
              if (/^[^'"\\]*(?:\\.[^'"\\]*)*("|')$/.test(tokens[j])) {
                tokens = tokens.slice(0, i).concat(tokens.slice(i, j + 1).join('')).concat(tokens.slice(j + 1))
                break
              }
            }
          }
        }
        var schema = {
          syntax: 3,
          package: null,
          imports: [],
          enums: [],
          messages: [],
          options: {},
          extends: []
        }

        var firstline = true

        while (tokens.length) {
          switch (tokens[0]) {
            case 'package':
              schema.package = onpackagename(tokens)
              break

            case 'syntax':
              if (!firstline) throw new Error('Protobuf syntax version should be first thing in file')
              schema.syntax = onsyntaxversion(tokens)
              break

            case 'message':
              schema.messages.push(onmessage(tokens))
              break

            case 'enum':
              schema.enums.push(onenum(tokens))
              break

            case 'option':
              var opt = onoption(tokens)
              if (schema.options[opt.name]) throw new Error('Duplicate option ' + opt.name)
              schema.options[opt.name] = opt.value
              break

            case 'import':
              schema.imports.push(onimport(tokens))
              break

            case 'extend':
              schema.extends.push(onextend(tokens))
              break

            case 'service':
              if (!schema.services) schema.services = []
              schema.services.push(onservice(tokens))
              break

            default:
              throw new Error('Unexpected token: ' + tokens[0])
          }
          firstline = false
        }

        // now iterate over messages and propagate extends
        schema.extends.forEach(function (ext) {
          schema.messages.forEach(function (msg) {
            if (msg.name === ext.name) {
              ext.message.fields.forEach(function (field) {
                if (!msg.extensions || field.tag < msg.extensions.from || field.tag > msg.extensions.to) {
                  throw new Error(msg.name + ' does not declare ' + field.tag + ' as an extension number')
                }
                msg.fields.push(field)
              })
            }
          })
        })

        schema.messages.forEach(function (msg) {
          msg.fields.forEach(function (field) {
            var fieldSplit
            var messageName
            var nestedEnumName
            var message

            function enumNameIsFieldType(en) {
              return en.name === field.type
            }

            function enumNameIsNestedEnumName(en) {
              return en.name === nestedEnumName
            }

            if (field.options && field.options.packed === 'true') {
              if (PACKABLE_TYPES.indexOf(field.type) === -1) {
                // let's see if it's an enum
                if (field.type.indexOf('.') === -1) {
                  if (msg.enums && msg.enums.some(enumNameIsFieldType)) {
                    return
                  }
                } else {
                  fieldSplit = field.type.split('.')
                  if (fieldSplit.length > 2) {
                    throw new Error('what is this?')
                  }

                  messageName = fieldSplit[0]
                  nestedEnumName = fieldSplit[1]

                  schema.messages.some(function (msg) {
                    if (msg.name === messageName) {
                      message = msg
                      return msg
                    }
                  })

                  if (message && message.enums && message.enums.some(enumNameIsNestedEnumName)) {
                    return
                  }
                }

                throw new Error(
                  'Fields of type ' + field.type + ' cannot be declared [packed=true]. ' +
                  'Only repeated fields of primitive numeric types (types which use ' +
                  'the varint, 32-bit, or 64-bit wire types) can be declared "packed". ' +
                  'See https://developers.google.com/protocol-buffers/docs/encoding#optional'
                )
              }
            }
          })
        })

        return schema
      }

      module.exports = parse

    }, { "./tokenize": 55 }], 54: [function (require, module, exports) {
      var onfield = function (f, result) {
        var prefix = f.repeated ? 'repeated' : f.required ? 'required' : 'optional'
        if (f.type === 'map') prefix = 'map<' + f.map.from + ',' + f.map.to + '>'
        if (f.oneof) prefix = ''

        var opts = Object.keys(f.options || {}).map(function (key) {
          return key + ' = ' + f.options[key]
        }).join(',')

        if (opts) opts = ' [' + opts + ']'

        result.push((prefix ? prefix + ' ' : '') + (f.map === 'map' ? '' : f.type + ' ') + f.name + ' = ' + f.tag + opts + ';')
        return result
      }

      var onmessage = function (m, result) {
        result.push('message ' + m.name + ' {')

        if (!m.options) m.options = {}
        onoption(m.options, result)

        if (!m.enums) m.enums = []
        m.enums.forEach(function (e) {
          result.push(onenum(e, []))
        })

        if (!m.messages) m.messages = []
        m.messages.forEach(function (m) {
          result.push(onmessage(m, []))
        })

        var oneofs = {}

        if (!m.fields) m.fields = []
        m.fields.forEach(function (f) {
          if (f.oneof) {
            if (!oneofs[f.oneof]) oneofs[f.oneof] = []
            oneofs[f.oneof].push(onfield(f, []))
          } else {
            result.push(onfield(f, []))
          }
        })

        Object.keys(oneofs).forEach(function (n) {
          oneofs[n].unshift('oneof ' + n + ' {')
          oneofs[n].push('}')
          result.push(oneofs[n])
        })

        result.push('}', '')
        return result
      }

      var onenum = function (e, result) {
        result.push('enum ' + e.name + ' {')
        if (!e.options) e.options = {}
        var options = onoption(e.options, [])
        if (options.length > 1) {
          result.push(options.slice(0, -1))
        }
        Object.keys(e.values).map(function (v) {
          var val = onenumvalue(e.values[v])
          result.push([v + ' = ' + val + ';'])
        })
        result.push('}', '')
        return result
      }

      var onenumvalue = function (v, result) {
        var opts = Object.keys(v.options || {}).map(function (key) {
          return key + ' = ' + v.options[key]
        }).join(',')

        if (opts) opts = ' [' + opts + ']'
        var val = v.value + opts
        return val
      }

      var onoption = function (o, result) {
        var keys = Object.keys(o)
        keys.forEach(function (option) {
          var v = o[option]
          if (~option.indexOf('.')) option = '(' + option + ')'

          var type = typeof v

          if (type === 'object') {
            v = onoptionMap(v, [])
            if (v.length) result.push('option ' + option + ' = {', v, '};')
          } else {
            if (type === 'string' && option !== 'optimize_for') v = '"' + v + '"'
            result.push('option ' + option + ' = ' + v + ';')
          }
        })
        if (keys.length > 0) {
          result.push('')
        }

        return result
      }

      var onoptionMap = function (o, result) {
        var keys = Object.keys(o)
        keys.forEach(function (k) {
          var v = o[k]

          var type = typeof v

          if (type === 'object') {
            if (Array.isArray(v)) {
              v.forEach(function (v) {
                v = onoptionMap(v, [])
                if (v.length) result.push(k + ' {', v, '}')
              })
            } else {
              v = onoptionMap(v, [])
              if (v.length) result.push(k + ' {', v, '}')
            }
          } else {
            if (type === 'string') v = '"' + v + '"'
            result.push(k + ': ' + v)
          }
        })

        return result
      }

      var onservices = function (s, result) {
        result.push('service ' + s.name + ' {')

        if (!s.options) s.options = {}
        onoption(s.options, result)
        if (!s.methods) s.methods = []
        s.methods.forEach(function (m) {
          result.push(onrpc(m, []))
        })

        result.push('}', '')
        return result
      }

      var onrpc = function (rpc, result) {
        var def = 'rpc ' + rpc.name + '('
        if (rpc.client_streaming) def += 'stream '
        def += rpc.input_type + ') returns ('
        if (rpc.server_streaming) def += 'stream '
        def += rpc.output_type + ')'

        if (!rpc.options) rpc.options = {}

        var options = onoption(rpc.options, [])
        if (options.length > 1) {
          result.push(def + ' {', options.slice(0, -1), '}')
        } else {
          result.push(def + ';')
        }

        return result
      }

      var indent = function (lvl) {
        return function (line) {
          if (Array.isArray(line)) return line.map(indent(lvl + '  ')).join('\n')
          return lvl + line
        }
      }

      module.exports = function (schema) {
        var result = []

        result.push('syntax = "proto' + schema.syntax + '";', '')

        if (schema.package) result.push('package ' + schema.package + ';', '')

        if (!schema.options) schema.options = {}

        onoption(schema.options, result)

        if (!schema.enums) schema.enums = []
        schema.enums.forEach(function (e) {
          onenum(e, result)
        })

        if (!schema.messages) schema.messages = []
        schema.messages.forEach(function (m) {
          onmessage(m, result)
        })

        if (schema.services) {
          schema.services.forEach(function (s) {
            onservices(s, result)
          })
        }
        return result.map(indent('')).join('\n')
      }

    }, {}], 55: [function (require, module, exports) {
      module.exports = function (sch) {
        var noComments = function (line) {
          var i = line.indexOf('//')
          return i > -1 ? line.slice(0, i) : line
        }

        var noMultilineComments = function () {
          var inside = false
          return function (token) {
            if (token === '/*') {
              inside = true
              return false
            }
            if (token === '*/') {
              inside = false
              return false
            }
            return !inside
          }
        }

        var trim = function (line) {
          return line.trim()
        }

        return sch
          .replace(/([;,{}()=:[\]<>]|\/\*|\*\/)/g, ' $1 ')
          .split(/\n/)
          .map(trim)
          .filter(Boolean)
          .map(noComments)
          .map(trim)
          .filter(Boolean)
          .join('\n')
          .split(/\s+|\n+/gm)
          .filter(noMultilineComments())
      }

    }, {}], 56: [function (require, module, exports) {
      var encodings = require('protocol-buffers-encodings')
      var os = require('os')

      var RESERVED = {
        type: true,
        message: true,
        name: true,
        buffer: true,
        encode: true,
        decode: true,
        encodingLength: true,
        dependencies: true
      }

      function isEncoder(m) {
        return typeof m.encode === 'function'
      }

      function compile(messages) {
        var out = ''

        out += '// This file is auto generated by the protocol-buffers compiler' + os.EOL
        out += os.EOL
        out += '/* eslint-disable quotes */' + os.EOL
        out += '/* eslint-disable indent */' + os.EOL
        out += '/* eslint-disable no-redeclare */' + os.EOL
        out += '/* eslint-disable camelcase */' + os.EOL
        out += os.EOL
        out += '// Remember to `npm install --save protocol-buffers-encodings`' + os.EOL
        out += 'var encodings = require(\'protocol-buffers-encodings\')' + os.EOL
        out += 'var varint = encodings.varint' + os.EOL
        out += 'var skip = encodings.skip' + os.EOL
        out += os.EOL

        visit(messages, 'exports', '')

        function visit(messages, exports, spaces) {
          var encoders = Object.keys(messages).filter(function (name) {
            if (RESERVED[name]) return false
            return isEncoder(messages[name])
          })

          var enums = Object.keys(messages).filter(function (name) {
            if (RESERVED[name]) return false
            return !isEncoder(messages[name])
          })

          enums.forEach(function (name) {
            out += spaces + exports + '.' + name + ' = ' +
              JSON.stringify(messages[name], null, 2).replace(/\n/g, os.EOL) + os.EOL + os.EOL
          })

          encoders.forEach(function (name) {
            out += spaces + 'var ' + name + ' = ' + exports + '.' + name + ' = {' + os.EOL
            out += spaces + '  buffer: true,' + os.EOL
            out += spaces + '  encodingLength: null,' + os.EOL
            out += spaces + '  encode: null,' + os.EOL
            out += spaces + '  decode: null' + os.EOL
            out += spaces + '}' + os.EOL
            out += os.EOL
          })

          encoders.forEach(function (name) {
            out += spaces + 'define' + name + '()' + os.EOL
          })

          if (encoders.length) out += os.EOL

          encoders.forEach(function (name) {
            out += spaces + 'function define' + name + ' () {' + os.EOL

            visit(messages[name], name, spaces + '  ')
            out += spaces + '  var enc = [' + os.EOL

            messages[name].dependencies.forEach(function (e, i, enc) {
              var name = encodings.name(e)
              if (name) name = 'encodings.' + name
              else if (!e.name) name = 'encodings.enum'
              else name = e.name
              out += spaces + '    ' + name + (i < enc.length - 1 ? ',' : '') + os.EOL
            })

            out += spaces + '  ]' + os.EOL + os.EOL
            out += spaces + '  ' + name + '.encodingLength = encodingLength' + os.EOL
            out += spaces + '  ' + name + '.encode = encode' + os.EOL
            out += spaces + '  ' + name + '.decode = decode' + os.EOL + os.EOL
            out += spaces + '  ' + funToString(messages[name].encodingLength, spaces + '  ') + os.EOL + os.EOL
            out += spaces + '  ' + funToString(messages[name].encode, spaces + '  ') + os.EOL + os.EOL
            out += spaces + '  ' + funToString(messages[name].decode, spaces + '  ') + os.EOL
            out += spaces + '}' + os.EOL + os.EOL
          })
        }

        out += funToString(require('./compile').defined, '') + os.EOL

        return out

        function funToString(fn, spaces) {
          return fn.toString().split('\n').map(indent).join('\n')

          function indent(n, i) {
            if (!i) return n.replace(/(function \w+)\(/, '$1 (')
            return spaces + n
          }
        }
      }

      module.exports = compile

    }, { "./compile": 57, "os": 22, "protocol-buffers-encodings": 47 }], 57: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          /* eslint-disable no-spaced-func */
          /* eslint-disable no-unexpected-multiline */
          /* eslint-disable func-call-spacing */

          var encodings = require('protocol-buffers-encodings')
          var varint = require('varint')
          var genobj = require('generate-object-property')
          var genfun = require('generate-function')

          var flatten = function (values) {
            if (!values) return null
            var result = {}
            Object.keys(values).forEach(function (k) {
              result[k] = values[k].value
            })
            return result
          }

          var defined = function defined(val) {
            return val !== null && val !== undefined && (typeof val !== 'number' || !isNaN(val))
          }

          var isString = function (def) {
            try {
              return !!def && typeof JSON.parse(def) === 'string'
            } catch (err) {
              return false
            }
          }

          var defaultValue = function (f, def) {
            if (f.map) return '{}'
            if (f.repeated) return '[]'

            switch (f.type) {
              case 'string':
                return isString(def) ? def : '""'

              case 'bool':
                if (def === 'true') return 'true'
                return 'false'

              case 'float':
              case 'double':
              case 'sfixed32':
              case 'fixed32':
              case 'varint':
              case 'enum':
              case 'uint64':
              case 'uint32':
              case 'int64':
              case 'int32':
              case 'sint64':
              case 'sint32':
                return '' + Number(def || 0)

              default:
                return 'null'
            }
          }

          var unique = function () {
            var seen = {}
            return function (key) {
              if (seen.hasOwnProperty(key)) return false
              seen[key] = true
              return true
            }
          }

          module.exports = function (schema, extraEncodings) {
            var messages = {}
            var enums = {}
            var cache = {}

            var visit = function (schema, prefix) {
              if (schema.enums) {
                schema.enums.forEach(function (e) {
                  e.id = prefix + (prefix ? '.' : '') + e.name
                  enums[e.id] = e
                  visit(e, e.id)
                })
              }
              if (schema.messages) {
                schema.messages.forEach(function (m) {
                  m.id = prefix + (prefix ? '.' : '') + m.name
                  messages[m.id] = m
                  m.fields.forEach(function (f) {
                    if (!f.map) return

                    var name = 'Map_' + f.map.from + '_' + f.map.to
                    var map = {
                      name: name,
                      enums: [],
                      messages: [],
                      fields: [{
                        name: 'key',
                        type: f.map.from,
                        tag: 1,
                        repeated: false,
                        required: true
                      }, {
                        name: 'value',
                        type: f.map.to,
                        tag: 2,
                        repeated: false,
                        required: false
                      }],
                      extensions: null,
                      id: prefix + (prefix ? '.' : '') + name
                    }

                    if (!messages[map.id]) {
                      messages[map.id] = map
                      schema.messages.push(map)
                    }
                    f.type = name
                    f.repeated = true
                  })
                  visit(m, m.id)
                })
              }
            }

            visit(schema, '')

            var compileEnum = function (e) {
              var conditions = Object.keys(e.values)
                .map(function (k) {
                  return 'val !== ' + parseInt(e.values[k].value, 10)
                })
                .join(' && ')

              if (!conditions) conditions = 'true'

              var encode = genfun()
                ('function encode (val, buf, offset) {')
                ('if (%s) throw new Error("Invalid enum value: "+val)', conditions)
                ('varint.encode(val, buf, offset)')
                ('encode.bytes = varint.encode.bytes')
                ('return buf')
                ('}')
                .toFunction({
                  varint: varint
                })

              var decode = genfun()
                ('function decode (buf, offset) {')
                ('var val = varint.decode(buf, offset)')
                ('if (%s) throw new Error("Invalid enum value: "+val)', conditions)
                ('decode.bytes = varint.decode.bytes')
                ('return val')
                ('}')
                .toFunction({
                  varint: varint
                })

              return encodings.make(0, encode, decode, varint.encodingLength)
            }

            var compileMessage = function (m, exports) {
              m.messages.forEach(function (nested) {
                exports[nested.name] = resolve(nested.name, m.id)
              })

              m.enums.forEach(function (val) {
                exports[val.name] = flatten(val.values)
              })

              exports.type = 2
              exports.message = true
              exports.name = m.name

              var oneofs = {}

              m.fields.forEach(function (f) {
                if (!f.oneof) return
                if (!oneofs[f.oneof]) oneofs[f.oneof] = []
                oneofs[f.oneof].push(f.name)
              })

              var enc = m.fields.map(function (f) {
                return resolve(f.type, m.id)
              })

              var dedupEnc = enc.filter(function (e, i) {
                return enc.indexOf(e) === i
              })

              var dedupIndex = enc.map(function (e) {
                return dedupEnc.indexOf(e)
              })

              var forEach = function (fn) {
                for (var i = 0; i < enc.length; i++) fn(enc[i], m.fields[i], genobj('obj', m.fields[i].name), i)
              }

              // compile encodingLength

              var encodingLength = genfun()
                ('function encodingLength (obj) {')
                ('var length = 0')

              Object.keys(oneofs).forEach(function (name) {
                var msg = JSON.stringify('only one of the properties defined in oneof ' + name + ' can be set')
                var cnt = oneofs[name]
                  .map(function (prop) {
                    return '+defined(' + genobj('obj', prop) + ')'
                  })
                  .join(' + ')

                encodingLength('if ((%s) > 1) throw new Error(%s)', cnt, msg)
              })

              forEach(function (e, f, val, i) {
                var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'
                var hl = varint.encodingLength(f.tag << 3 | e.type)

                if (f.required) encodingLength('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name + ' is required'))
                else encodingLength('if (defined(%s)) {', val)

                if (f.map) {
                  encodingLength()
                    ('var tmp = Object.keys(%s)', val)
                    ('for (var i = 0; i < tmp.length; i++) {')
                    ('tmp[i] = {key: tmp[i], value: %s[tmp[i]]}', val)
                    ('}')
                  val = 'tmp'
                }

                if (packed) {
                  encodingLength()
                    ('var packedLen = 0')
                    ('for (var i = 0; i < %s.length; i++) {', val)
                    ('if (!defined(%s)) continue', val + '[i]')
                    ('var len = enc[%d].encodingLength(%s)', dedupIndex[i], val + '[i]')
                    ('packedLen += len')

                  if (e.message) encodingLength('packedLen += varint.encodingLength(len)')

                  encodingLength('}')
                    ('if (packedLen) {')
                    ('length += %d + packedLen + varint.encodingLength(packedLen)', hl)
                    ('}')
                } else {
                  if (f.repeated) {
                    encodingLength('for (var i = 0; i < %s.length; i++) {', val)
                    val += '[i]'
                    encodingLength('if (!defined(%s)) continue', val)
                  }

                  encodingLength('var len = enc[%d].encodingLength(%s)', dedupIndex[i], val)
                  if (e.message) encodingLength('length += varint.encodingLength(len)')
                  encodingLength('length += %d + len', hl)
                  if (f.repeated) encodingLength('}')
                }

                if (!f.required) encodingLength('}')
              })

              encodingLength()
                ('return length')
                ('}')

              encodingLength = encodingLength.toFunction({
                defined: defined,
                varint: varint,
                enc: dedupEnc
              })

              // compile encode

              var encode = genfun()
                ('function encode (obj, buf, offset) {')
                ('if (!offset) offset = 0')
                ('if (!buf) buf = Buffer.allocUnsafe(encodingLength(obj))')
                ('var oldOffset = offset')

              Object.keys(oneofs).forEach(function (name) {
                var msg = JSON.stringify('only one of the properties defined in oneof ' + name + ' can be set')
                var cnt = oneofs[name]
                  .map(function (prop) {
                    return '+defined(' + genobj('obj', prop) + ')'
                  })
                  .join(' + ')

                encode('if ((%s) > 1) throw new Error(%s)', cnt, msg)
              })

              forEach(function (e, f, val, i) {
                if (f.required) encode('if (!defined(%s)) throw new Error(%s)', val, JSON.stringify(f.name + ' is required'))
                else encode('if (defined(%s)) {', val)

                var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'
                var p = varint.encode(f.tag << 3 | 2)
                var h = varint.encode(f.tag << 3 | e.type)
                var j

                if (f.map) {
                  encode()
                    ('var tmp = Object.keys(%s)', val)
                    ('for (var i = 0; i < tmp.length; i++) {')
                    ('tmp[i] = {key: tmp[i], value: %s[tmp[i]]}', val)
                    ('}')
                  val = 'tmp'
                }

                if (packed) {
                  encode()
                    ('var packedLen = 0')
                    ('for (var i = 0; i < %s.length; i++) {', val)
                    ('if (!defined(%s)) continue', val + '[i]')
                    ('packedLen += enc[%d].encodingLength(%s)', dedupIndex[i], val + '[i]')
                    ('}')

                  encode('if (packedLen) {')
                  for (j = 0; j < h.length; j++) encode('buf[offset++] = %d', p[j])
                  encode('varint.encode(packedLen, buf, offset)')
                  encode('offset += varint.encode.bytes')
                  encode('}')
                }

                if (f.repeated) {
                  encode('for (var i = 0; i < %s.length; i++) {', val)
                  val += '[i]'
                  encode('if (!defined(%s)) continue', val)
                }

                if (!packed) for (j = 0; j < h.length; j++) encode('buf[offset++] = %d', h[j])

                if (e.message) {
                  encode('varint.encode(enc[%d].encodingLength(%s), buf, offset)', dedupIndex[i], val)
                  encode('offset += varint.encode.bytes')
                }

                encode('enc[%d].encode(%s, buf, offset)', dedupIndex[i], val)
                encode('offset += enc[%d].encode.bytes', dedupIndex[i])

                if (f.repeated) encode('}')
                if (!f.required) encode('}')
              })

              encode()
                ('encode.bytes = offset - oldOffset')
                ('return buf')
                ('}')

              encode = encode.toFunction({
                encodingLength: encodingLength,
                defined: defined,
                varint: varint,
                enc: dedupEnc,
                Buffer: Buffer
              })

              // compile decode

              var invalid = m.fields
                .map(function (f, i) {
                  return f.required && '!found' + i
                })
                .filter(function (f) {
                  return f
                })
                .join(' || ')

              var decode = genfun()

              var objectKeys = []

              forEach(function (e, f) {
                var def = f.options && f.options.default
                var resolved = resolve(f.type, m.id, false)
                var vals = resolved && resolved.values

                if (vals) { // is enum
                  if (f.repeated) {
                    objectKeys.push(genobj.property(f.name) + ': []')
                  } else {
                    def = (def && vals[def]) ? vals[def].value : vals[Object.keys(vals)[0]].value
                    objectKeys.push(genobj.property(f.name) + ': ' + parseInt(def || 0, 10))
                  }
                  return
                }

                objectKeys.push(genobj.property(f.name) + ': ' + defaultValue(f, def))
              })

              objectKeys = objectKeys.filter(unique())

              decode()
                ('function decode (buf, offset, end) {')
                ('if (!offset) offset = 0')
                ('if (!end) end = buf.length')
                ('if (!(end <= buf.length && offset <= buf.length)) throw new Error("Decoded message is not valid")')
                ('var oldOffset = offset')
                ('var obj = {')

              objectKeys.forEach(function (prop, i) {
                decode(prop + (i === objectKeys.length - 1 ? '' : ','))
              })

              decode('}')

              forEach(function (e, f, val, i) {
                if (f.required) decode('var found%d = false', i)
              })

              decode('while (true) {')
                ('if (end <= offset) {')
                (invalid && 'if (%s) throw new Error("Decoded message is not valid")', invalid)
                ('decode.bytes = offset - oldOffset')
                ('return obj')
                ('}')
                ('var prefix = varint.decode(buf, offset)')
                ('offset += varint.decode.bytes')
                ('var tag = prefix >> 3')
                ('switch (tag) {')

              forEach(function (e, f, val, i) {
                var packed = f.repeated && f.options && f.options.packed && f.options.packed !== 'false'

                decode('case %d:', f.tag)

                if (f.oneof) {
                  m.fields.forEach(function (otherField) {
                    if (otherField.oneof === f.oneof && f.name !== otherField.name) {
                      decode('delete %s', genobj('obj', otherField.name))
                    }
                  })
                }

                if (packed) {
                  decode()
                    ('var packedEnd = varint.decode(buf, offset)')
                    ('offset += varint.decode.bytes')
                    ('packedEnd += offset')
                    ('while (offset < packedEnd) {')
                }

                if (e.message) {
                  decode('var len = varint.decode(buf, offset)')
                  decode('offset += varint.decode.bytes')
                  if (f.map) {
                    decode('var tmp = enc[%d].decode(buf, offset, offset + len)', dedupIndex[i])
                    decode('%s[tmp.key] = tmp.value', val)
                  } else if (f.repeated) {
                    decode('%s.push(enc[%d].decode(buf, offset, offset + len))', val, dedupIndex[i])
                  } else {
                    decode('%s = enc[%d].decode(buf, offset, offset + len)', val, dedupIndex[i])
                  }
                } else {
                  if (f.repeated) {
                    decode('%s.push(enc[%d].decode(buf, offset))', val, dedupIndex[i])
                  } else {
                    decode('%s = enc[%d].decode(buf, offset)', val, dedupIndex[i])
                  }
                }

                decode('offset += enc[%d].decode.bytes', dedupIndex[i])

                if (packed) decode('}')
                if (f.required) decode('found%d = true', i)
                decode('break')
              })

              decode()
                ('default:')
                ('offset = skip(prefix & 7, buf, offset)')
                ('}')
                ('}')
                ('}')

              decode = decode.toFunction({
                varint: varint,
                skip: encodings.skip,
                enc: dedupEnc
              })

              // end of compilation - return all the things

              encode.bytes = decode.bytes = 0

              exports.buffer = true
              exports.encode = encode
              exports.decode = decode
              exports.encodingLength = encodingLength
              exports.dependencies = dedupEnc

              return exports
            }

            var resolve = function (name, from, compile) {
              if (extraEncodings && extraEncodings[name]) return extraEncodings[name]
              if (encodings[name]) return encodings[name]

              var m = (from ? from + '.' + name : name).split('.')
                .map(function (part, i, list) {
                  return list.slice(0, i).concat(name).join('.')
                })
                .reverse()
                .reduce(function (result, id) {
                  return result || messages[id] || enums[id]
                }, null)

              if (compile === false) return m
              if (!m) throw new Error('Could not resolve ' + name)

              if (m.values) return compileEnum(m)
              if (cache[m.id]) return cache[m.id]

              cache[m.id] = {}
              return compileMessage(m, cache[m.id])
            }

            return (schema.enums || []).concat((schema.messages || []).map(function (message) {
              return resolve(message.id)
            }))
          }

          module.exports.defined = defined

        }).call(this)
      }).call(this, require("buffer").Buffer)
    }, { "buffer": 5, "generate-function": 36, "generate-object-property": 37, "protocol-buffers-encodings": 47, "varint": 77 }], 58: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          var schema = require('protocol-buffers-schema')
          var compile = require('./compile')
          var compileToJS = require('./compile-to-js')

          var flatten = function (values) {
            if (!values) return null
            var result = {}
            Object.keys(values).forEach(function (k) {
              result[k] = values[k].value
            })
            return result
          }

          module.exports = function (proto, opts) {
            if (!opts) opts = {}
            if (!proto) throw new Error('Pass in a .proto string or a protobuf-schema parsed object')

            var sch = (typeof proto === 'object' && !Buffer.isBuffer(proto)) ? proto : schema.parse(proto)

            // to not make toString,toJSON enumarable we make a fire-and-forget prototype
            var Messages = function () {
              var self = this

              compile(sch, opts.encodings || {}).forEach(function (m) {
                self[m.name] = flatten(m.values) || m
              })
            }

            Messages.prototype.toString = function () {
              return schema.stringify(sch)
            }

            Messages.prototype.toJSON = function () {
              return sch
            }

            return new Messages()
          }

          module.exports.toJS = function (proto) {
            return compileToJS(module.exports(proto))
          }

        }).call(this)
      }).call(this, { "isBuffer": require("../../../../.npm/_npx/74190/lib/node_modules/browserify/node_modules/is-buffer/index.js") })
    }, { "../../../../.npm/_npx/74190/lib/node_modules/browserify/node_modules/is-buffer/index.js": 19, "./compile": 57, "./compile-to-js": 56, "protocol-buffers-schema": 52 }], 59: [function (require, module, exports) {
      (function (Buffer) {
        (function () {
          var lpstream = require('length-prefixed-stream')
          var duplexify = require('duplexify')
          var ltgt = require('ltgt')
          var eos = require('end-of-stream')
          var messages = require('./messages')

          var ENCODERS = {
            'S': messages.Subscribe,
            'U': messages.Unsubscribe,
            'P': messages.Publish
          }

          var DECODERS = {
            'S': messages.Subscribe,
            'U': messages.Unsubscribe,
            'P': messages.Publish
          }

          module.exports = Ranges

          function Ranges() {
            if (!(this instanceof Ranges)) return new Ranges()
            this._ranges = []
            this._encode = lpstream.encode()
          }

          Ranges.prototype.subscribe = function (range, cb, resend) {
            if (typeof range === 'string') range = { lte: range, gte: range }
            if (typeof range === 'function') {
              resend = cb
              cb = range
              range = { lte: '*', gte: '*' }
            }
            if (!resend) {
              this._addSubscription(range, cb)
            }
            this._write({
              message: 'S',
              range: range
            })
          }

          Ranges.prototype.unsubscribe = function (range) {
            this._removeSubscription(range)
            this._write({
              message: 'U',
              range: range
            })
          }

          Ranges.prototype.publish = function (key, type) {
            this._write({
              message: 'P',
              key: key,
              type: type
            })
          }

          Ranges.prototype._addSubscription = function (range, cb) {
            this._ranges.push([range, cb])
          }

          Ranges.prototype.subscriptionExists = function (key) {
            for (var i = 0; i < this._ranges.length; i++) {
              var item = this._ranges[i]
              if (keyInRange(key, item[0])) return true
            }
          }

          Ranges.prototype.subscriptions = function (key) {
            var callbacks = []
            this._ranges.forEach(function (item) {
              if (keyInRange(key, item[0])) callbacks.push(item[1])
            })
            return callbacks
          }

          Ranges.prototype.connect = function (opts, proxy) {
            if (this._streaming) throw new Error('Only one rpc stream can be active')
            if (!opts) opts = {}
            proxy = proxy || duplexify()
            var decode = lpstream.decode()
            proxy.setWritable(decode)
            proxy.setReadable(this._encode)

            var self = this

            decode.on('data', function (data) {
              if (!data.length) return
              var tag = String.fromCharCode(data[0])
              var dec = DECODERS[tag]
              if (dec) {
                try {
                  var req = dec.decode(data, 1)
                } catch (err) {
                  return
                }
                switch (tag) {
                  case 'P':
                    this.subscriptions(req.key).forEach(function (fn) {
                      if (typeof fn === 'function') {
                        fn(req.key, req.type)
                      }
                    })
                    break
                  case 'S':
                    this._addSubscription(req.range)
                    break
                  case 'U':
                    this._removeSubscription(req.range)
                    break
                }
              }
            }.bind(this))

            eos(proxy, cleanup)
            this._streaming = proxy
            return proxy

            function cleanup() {
              self._streaming = null
              self._encode = lpstream.encode()
              self._ranges.forEach(function (item) {
                self.subscribe(item[0], item[1], true)
              })
            }
          }

          Ranges.prototype._removeSubscription = function (range) {
            var i = this._ranges.length
            while (i--) {
              var activeRange = this._ranges[i][0]
              if (rangesEqual(range, activeRange)) {
                this._ranges.splice(i, 1)
              }
            }
          }

          Ranges.prototype._write = function (req) {
            var enc = ENCODERS[req.message]
            var buf = Buffer.alloc(enc.encodingLength(req) + 1)
            buf[0] = req.message.charCodeAt(0)
            enc.encode(req, buf, 1)
            this._encode.write(buf)
          }

          function rangesEqual(range1, range2) {
            var keys = ['gt', 'gte', 'lt', 'lte']
            return keys.filter(function (op) {
              return range1[op] === range2[op]
            }).length === keys.length
          }

          function keyInRange(key, range) {
            return (range.gte === '*' && range.lte === '*') ||
              ltgt.contains(range, key)
          }

        }).call(this)
      }).call(this, require("buffer").Buffer)
    }, { "./messages": 60, "buffer": 5, "duplexify": 34, "end-of-stream": 35, "length-prefixed-stream": 43, "ltgt": 44 }], 60: [function (require, module, exports) {

      var path = require('path')
      var protobuf = require('protocol-buffers')

      module.exports = protobuf("message Publish {\n  required string key = 1;\n  required string type = 2;\n}\n\nmessage Subscribe {\n  required Range range = 1;\n}\n\nmessage Unsubscribe {\n  required Range range = 1;\n}\n\nmessage Range {\n  optional string gt = 1;\n  optional string gte = 2;\n  optional string lt = 3;\n  optional string lte = 4;\n}\n")

    }, { "path": 23, "protocol-buffers": 58 }], 61: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      // a duplex stream is just a stream that is both readable and writable.
      // Since JS doesn't have multiple prototypal inheritance, this class
      // prototypally inherits from Readable, and then parasitically from
      // Writable.

      'use strict';

      /*<replacement>*/

      var pna = require('process-nextick-args');
      /*</replacement>*/

      /*<replacement>*/
      var objectKeys = Object.keys || function (obj) {
        var keys = [];
        for (var key in obj) {
          keys.push(key);
        } return keys;
      };
      /*</replacement>*/

      module.exports = Duplex;

      /*<replacement>*/
      var util = Object.create(require('core-util-is'));
      util.inherits = require('inherits');
      /*</replacement>*/

      var Readable = require('./_stream_readable');
      var Writable = require('./_stream_writable');

      util.inherits(Duplex, Readable);

      {
        // avoid scope creep, the keys array can then be collected
        var keys = objectKeys(Writable.prototype);
        for (var v = 0; v < keys.length; v++) {
          var method = keys[v];
          if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
        }
      }

      function Duplex(options) {
        if (!(this instanceof Duplex)) return new Duplex(options);

        Readable.call(this, options);
        Writable.call(this, options);

        if (options && options.readable === false) this.readable = false;

        if (options && options.writable === false) this.writable = false;

        this.allowHalfOpen = true;
        if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

        this.once('end', onend);
      }

      Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
        // making it explicit this property is not enumerable
        // because otherwise some prototype manipulation in
        // userland will fail
        enumerable: false,
        get: function () {
          return this._writableState.highWaterMark;
        }
      });

      // the no-half-open enforcer
      function onend() {
        // if we allow half-open state, or if the writable side ended,
        // then we're ok.
        if (this.allowHalfOpen || this._writableState.ended) return;

        // no more data can be written.
        // But allow more writes to happen in this tick.
        pna.nextTick(onEndNT, this);
      }

      function onEndNT(self) {
        self.end();
      }

      Object.defineProperty(Duplex.prototype, 'destroyed', {
        get: function () {
          if (this._readableState === undefined || this._writableState === undefined) {
            return false;
          }
          return this._readableState.destroyed && this._writableState.destroyed;
        },
        set: function (value) {
          // we ignore the value if the stream
          // has not been initialized yet
          if (this._readableState === undefined || this._writableState === undefined) {
            return;
          }

          // backward compatibility, the user is explicitly
          // managing destroyed
          this._readableState.destroyed = value;
          this._writableState.destroyed = value;
        }
      });

      Duplex.prototype._destroy = function (err, cb) {
        this.push(null);
        this.end();

        pna.nextTick(cb, err);
      };
    }, { "./_stream_readable": 63, "./_stream_writable": 65, "core-util-is": 33, "inherits": 38, "process-nextick-args": 46 }], 62: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      // a passthrough stream.
      // basically just the most minimal sort of Transform stream.
      // Every written chunk gets output as-is.

      'use strict';

      module.exports = PassThrough;

      var Transform = require('./_stream_transform');

      /*<replacement>*/
      var util = Object.create(require('core-util-is'));
      util.inherits = require('inherits');
      /*</replacement>*/

      util.inherits(PassThrough, Transform);

      function PassThrough(options) {
        if (!(this instanceof PassThrough)) return new PassThrough(options);

        Transform.call(this, options);
      }

      PassThrough.prototype._transform = function (chunk, encoding, cb) {
        cb(null, chunk);
      };
    }, { "./_stream_transform": 64, "core-util-is": 33, "inherits": 38 }], 63: [function (require, module, exports) {
      (function (process, global) {
        (function () {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.

          'use strict';

          /*<replacement>*/

          var pna = require('process-nextick-args');
          /*</replacement>*/

          module.exports = Readable;

          /*<replacement>*/
          var isArray = require('isarray');
          /*</replacement>*/

          /*<replacement>*/
          var Duplex;
          /*</replacement>*/

          Readable.ReadableState = ReadableState;

          /*<replacement>*/
          var EE = require('events').EventEmitter;

          var EElistenerCount = function (emitter, type) {
            return emitter.listeners(type).length;
          };
          /*</replacement>*/

          /*<replacement>*/
          var Stream = require('./internal/streams/stream');
          /*</replacement>*/

          /*<replacement>*/

          var Buffer = require('safe-buffer').Buffer;
          var OurUint8Array = global.Uint8Array || function () { };
          function _uint8ArrayToBuffer(chunk) {
            return Buffer.from(chunk);
          }
          function _isUint8Array(obj) {
            return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
          }

          /*</replacement>*/

          /*<replacement>*/
          var util = Object.create(require('core-util-is'));
          util.inherits = require('inherits');
          /*</replacement>*/

          /*<replacement>*/
          var debugUtil = require('util');
          var debug = void 0;
          if (debugUtil && debugUtil.debuglog) {
            debug = debugUtil.debuglog('stream');
          } else {
            debug = function () { };
          }
          /*</replacement>*/

          var BufferList = require('./internal/streams/BufferList');
          var destroyImpl = require('./internal/streams/destroy');
          var StringDecoder;

          util.inherits(Readable, Stream);

          var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

          function prependListener(emitter, event, fn) {
            // Sadly this is not cacheable as some libraries bundle their own
            // event emitter implementation with them.
            if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

            // This is a hack to make sure that our error handler is attached before any
            // userland ones.  NEVER DO THIS. This is here only because this code needs
            // to continue to work with older versions of Node.js that do not include
            // the prependListener() method. The goal is to eventually remove this hack.
            if (!emitter._events || !emitter._events[event]) emitter.on(event, fn); else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn); else emitter._events[event] = [fn, emitter._events[event]];
          }

          function ReadableState(options, stream) {
            Duplex = Duplex || require('./_stream_duplex');

            options = options || {};

            // Duplex streams are both readable and writable, but share
            // the same options object.
            // However, some cases require setting options to different
            // values for the readable and the writable sides of the duplex stream.
            // These options can be provided separately as readableXXX and writableXXX.
            var isDuplex = stream instanceof Duplex;

            // object stream flag. Used to make read(n) ignore n and to
            // make all the buffer merging and length checks go away
            this.objectMode = !!options.objectMode;

            if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

            // the point at which it stops calling _read() to fill the buffer
            // Note: 0 is a valid value, means "don't call _read preemptively ever"
            var hwm = options.highWaterMark;
            var readableHwm = options.readableHighWaterMark;
            var defaultHwm = this.objectMode ? 16 : 16 * 1024;

            if (hwm || hwm === 0) this.highWaterMark = hwm; else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm; else this.highWaterMark = defaultHwm;

            // cast to ints.
            this.highWaterMark = Math.floor(this.highWaterMark);

            // A linked list is used to store data chunks instead of an array because the
            // linked list can remove elements from the beginning faster than
            // array.shift()
            this.buffer = new BufferList();
            this.length = 0;
            this.pipes = null;
            this.pipesCount = 0;
            this.flowing = null;
            this.ended = false;
            this.endEmitted = false;
            this.reading = false;

            // a flag to be able to tell if the event 'readable'/'data' is emitted
            // immediately, or on a later tick.  We set this to true at first, because
            // any actions that shouldn't happen until "later" should generally also
            // not happen before the first read call.
            this.sync = true;

            // whenever we return null, then we set a flag to say
            // that we're awaiting a 'readable' event emission.
            this.needReadable = false;
            this.emittedReadable = false;
            this.readableListening = false;
            this.resumeScheduled = false;

            // has it been destroyed
            this.destroyed = false;

            // Crypto is kind of old and crusty.  Historically, its default string
            // encoding is 'binary' so we have to make this configurable.
            // Everything else in the universe uses 'utf8', though.
            this.defaultEncoding = options.defaultEncoding || 'utf8';

            // the number of writers that are awaiting a drain event in .pipe()s
            this.awaitDrain = 0;

            // if true, a maybeReadMore has been scheduled
            this.readingMore = false;

            this.decoder = null;
            this.encoding = null;
            if (options.encoding) {
              if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
              this.decoder = new StringDecoder(options.encoding);
              this.encoding = options.encoding;
            }
          }

          function Readable(options) {
            Duplex = Duplex || require('./_stream_duplex');

            if (!(this instanceof Readable)) return new Readable(options);

            this._readableState = new ReadableState(options, this);

            // legacy
            this.readable = true;

            if (options) {
              if (typeof options.read === 'function') this._read = options.read;

              if (typeof options.destroy === 'function') this._destroy = options.destroy;
            }

            Stream.call(this);
          }

          Object.defineProperty(Readable.prototype, 'destroyed', {
            get: function () {
              if (this._readableState === undefined) {
                return false;
              }
              return this._readableState.destroyed;
            },
            set: function (value) {
              // we ignore the value if the stream
              // has not been initialized yet
              if (!this._readableState) {
                return;
              }

              // backward compatibility, the user is explicitly
              // managing destroyed
              this._readableState.destroyed = value;
            }
          });

          Readable.prototype.destroy = destroyImpl.destroy;
          Readable.prototype._undestroy = destroyImpl.undestroy;
          Readable.prototype._destroy = function (err, cb) {
            this.push(null);
            cb(err);
          };

          // Manually shove something into the read() buffer.
          // This returns true if the highWaterMark has not been hit yet,
          // similar to how Writable.write() returns true if you should
          // write() some more.
          Readable.prototype.push = function (chunk, encoding) {
            var state = this._readableState;
            var skipChunkCheck;

            if (!state.objectMode) {
              if (typeof chunk === 'string') {
                encoding = encoding || state.defaultEncoding;
                if (encoding !== state.encoding) {
                  chunk = Buffer.from(chunk, encoding);
                  encoding = '';
                }
                skipChunkCheck = true;
              }
            } else {
              skipChunkCheck = true;
            }

            return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
          };

          // Unshift should *always* be something directly out of read()
          Readable.prototype.unshift = function (chunk) {
            return readableAddChunk(this, chunk, null, true, false);
          };

          function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
            var state = stream._readableState;
            if (chunk === null) {
              state.reading = false;
              onEofChunk(stream, state);
            } else {
              var er;
              if (!skipChunkCheck) er = chunkInvalid(state, chunk);
              if (er) {
                stream.emit('error', er);
              } else if (state.objectMode || chunk && chunk.length > 0) {
                if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
                  chunk = _uint8ArrayToBuffer(chunk);
                }

                if (addToFront) {
                  if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event')); else addChunk(stream, state, chunk, true);
                } else if (state.ended) {
                  stream.emit('error', new Error('stream.push() after EOF'));
                } else {
                  state.reading = false;
                  if (state.decoder && !encoding) {
                    chunk = state.decoder.write(chunk);
                    if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false); else maybeReadMore(stream, state);
                  } else {
                    addChunk(stream, state, chunk, false);
                  }
                }
              } else if (!addToFront) {
                state.reading = false;
              }
            }

            return needMoreData(state);
          }

          function addChunk(stream, state, chunk, addToFront) {
            if (state.flowing && state.length === 0 && !state.sync) {
              stream.emit('data', chunk);
              stream.read(0);
            } else {
              // update the buffer info.
              state.length += state.objectMode ? 1 : chunk.length;
              if (addToFront) state.buffer.unshift(chunk); else state.buffer.push(chunk);

              if (state.needReadable) emitReadable(stream);
            }
            maybeReadMore(stream, state);
          }

          function chunkInvalid(state, chunk) {
            var er;
            if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
              er = new TypeError('Invalid non-string/buffer chunk');
            }
            return er;
          }

          // if it's past the high water mark, we can push in some more.
          // Also, if we have no data yet, we can stand some
          // more bytes.  This is to work around cases where hwm=0,
          // such as the repl.  Also, if the push() triggered a
          // readable event, and the user called read(largeNumber) such that
          // needReadable was set, then we ought to push more, so that another
          // 'readable' event will be triggered.
          function needMoreData(state) {
            return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
          }

          Readable.prototype.isPaused = function () {
            return this._readableState.flowing === false;
          };

          // backwards compatibility.
          Readable.prototype.setEncoding = function (enc) {
            if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
            this._readableState.decoder = new StringDecoder(enc);
            this._readableState.encoding = enc;
            return this;
          };

          // Don't raise the hwm > 8MB
          var MAX_HWM = 0x800000;
          function computeNewHighWaterMark(n) {
            if (n >= MAX_HWM) {
              n = MAX_HWM;
            } else {
              // Get the next highest power of 2 to prevent increasing hwm excessively in
              // tiny amounts
              n--;
              n |= n >>> 1;
              n |= n >>> 2;
              n |= n >>> 4;
              n |= n >>> 8;
              n |= n >>> 16;
              n++;
            }
            return n;
          }

          // This function is designed to be inlinable, so please take care when making
          // changes to the function body.
          function howMuchToRead(n, state) {
            if (n <= 0 || state.length === 0 && state.ended) return 0;
            if (state.objectMode) return 1;
            if (n !== n) {
              // Only flow one buffer at a time
              if (state.flowing && state.length) return state.buffer.head.data.length; else return state.length;
            }
            // If we're asking for more than the current hwm, then raise the hwm.
            if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
            if (n <= state.length) return n;
            // Don't have enough
            if (!state.ended) {
              state.needReadable = true;
              return 0;
            }
            return state.length;
          }

          // you can override either this method, or the async _read(n) below.
          Readable.prototype.read = function (n) {
            debug('read', n);
            n = parseInt(n, 10);
            var state = this._readableState;
            var nOrig = n;

            if (n !== 0) state.emittedReadable = false;

            // if we're doing read(0) to trigger a readable event, but we
            // already have a bunch of data in the buffer, then just trigger
            // the 'readable' event and move on.
            if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
              debug('read: emitReadable', state.length, state.ended);
              if (state.length === 0 && state.ended) endReadable(this); else emitReadable(this);
              return null;
            }

            n = howMuchToRead(n, state);

            // if we've ended, and we're now clear, then finish it up.
            if (n === 0 && state.ended) {
              if (state.length === 0) endReadable(this);
              return null;
            }

            // All the actual chunk generation logic needs to be
            // *below* the call to _read.  The reason is that in certain
            // synthetic stream cases, such as passthrough streams, _read
            // may be a completely synchronous operation which may change
            // the state of the read buffer, providing enough data when
            // before there was *not* enough.
            //
            // So, the steps are:
            // 1. Figure out what the state of things will be after we do
            // a read from the buffer.
            //
            // 2. If that resulting state will trigger a _read, then call _read.
            // Note that this may be asynchronous, or synchronous.  Yes, it is
            // deeply ugly to write APIs this way, but that still doesn't mean
            // that the Readable class should behave improperly, as streams are
            // designed to be sync/async agnostic.
            // Take note if the _read call is sync or async (ie, if the read call
            // has returned yet), so that we know whether or not it's safe to emit
            // 'readable' etc.
            //
            // 3. Actually pull the requested chunks out of the buffer and return.

            // if we need a readable event, then we need to do some reading.
            var doRead = state.needReadable;
            debug('need readable', doRead);

            // if we currently have less than the highWaterMark, then also read some
            if (state.length === 0 || state.length - n < state.highWaterMark) {
              doRead = true;
              debug('length less than watermark', doRead);
            }

            // however, if we've ended, then there's no point, and if we're already
            // reading, then it's unnecessary.
            if (state.ended || state.reading) {
              doRead = false;
              debug('reading or ended', doRead);
            } else if (doRead) {
              debug('do read');
              state.reading = true;
              state.sync = true;
              // if the length is currently zero, then we *need* a readable event.
              if (state.length === 0) state.needReadable = true;
              // call internal read method
              this._read(state.highWaterMark);
              state.sync = false;
              // If _read pushed data synchronously, then `reading` will be false,
              // and we need to re-evaluate how much data we can return to the user.
              if (!state.reading) n = howMuchToRead(nOrig, state);
            }

            var ret;
            if (n > 0) ret = fromList(n, state); else ret = null;

            if (ret === null) {
              state.needReadable = true;
              n = 0;
            } else {
              state.length -= n;
            }

            if (state.length === 0) {
              // If we have nothing in the buffer, then we want to know
              // as soon as we *do* get something into the buffer.
              if (!state.ended) state.needReadable = true;

              // If we tried to read() past the EOF, then emit end on the next tick.
              if (nOrig !== n && state.ended) endReadable(this);
            }

            if (ret !== null) this.emit('data', ret);

            return ret;
          };

          function onEofChunk(stream, state) {
            if (state.ended) return;
            if (state.decoder) {
              var chunk = state.decoder.end();
              if (chunk && chunk.length) {
                state.buffer.push(chunk);
                state.length += state.objectMode ? 1 : chunk.length;
              }
            }
            state.ended = true;

            // emit 'readable' now to make sure it gets picked up.
            emitReadable(stream);
          }

          // Don't emit readable right away in sync mode, because this can trigger
          // another read() call => stack overflow.  This way, it might trigger
          // a nextTick recursion warning, but that's not so bad.
          function emitReadable(stream) {
            var state = stream._readableState;
            state.needReadable = false;
            if (!state.emittedReadable) {
              debug('emitReadable', state.flowing);
              state.emittedReadable = true;
              if (state.sync) pna.nextTick(emitReadable_, stream); else emitReadable_(stream);
            }
          }

          function emitReadable_(stream) {
            debug('emit readable');
            stream.emit('readable');
            flow(stream);
          }

          // at this point, the user has presumably seen the 'readable' event,
          // and called read() to consume some data.  that may have triggered
          // in turn another _read(n) call, in which case reading = true if
          // it's in progress.
          // However, if we're not ended, or reading, and the length < hwm,
          // then go ahead and try to read some more preemptively.
          function maybeReadMore(stream, state) {
            if (!state.readingMore) {
              state.readingMore = true;
              pna.nextTick(maybeReadMore_, stream, state);
            }
          }

          function maybeReadMore_(stream, state) {
            var len = state.length;
            while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
              debug('maybeReadMore read 0');
              stream.read(0);
              if (len === state.length)
                // didn't get any data, stop spinning.
                break; else len = state.length;
            }
            state.readingMore = false;
          }

          // abstract method.  to be overridden in specific implementation classes.
          // call cb(er, data) where data is <= n in length.
          // for virtual (non-string, non-buffer) streams, "length" is somewhat
          // arbitrary, and perhaps not very meaningful.
          Readable.prototype._read = function (n) {
            this.emit('error', new Error('_read() is not implemented'));
          };

          Readable.prototype.pipe = function (dest, pipeOpts) {
            var src = this;
            var state = this._readableState;

            switch (state.pipesCount) {
              case 0:
                state.pipes = dest;
                break;
              case 1:
                state.pipes = [state.pipes, dest];
                break;
              default:
                state.pipes.push(dest);
                break;
            }
            state.pipesCount += 1;
            debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

            var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

            var endFn = doEnd ? onend : unpipe;
            if (state.endEmitted) pna.nextTick(endFn); else src.once('end', endFn);

            dest.on('unpipe', onunpipe);
            function onunpipe(readable, unpipeInfo) {
              debug('onunpipe');
              if (readable === src) {
                if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
                  unpipeInfo.hasUnpiped = true;
                  cleanup();
                }
              }
            }

            function onend() {
              debug('onend');
              dest.end();
            }

            // when the dest drains, it reduces the awaitDrain counter
            // on the source.  This would be more elegant with a .once()
            // handler in flow(), but adding and removing repeatedly is
            // too slow.
            var ondrain = pipeOnDrain(src);
            dest.on('drain', ondrain);

            var cleanedUp = false;
            function cleanup() {
              debug('cleanup');
              // cleanup event handlers once the pipe is broken
              dest.removeListener('close', onclose);
              dest.removeListener('finish', onfinish);
              dest.removeListener('drain', ondrain);
              dest.removeListener('error', onerror);
              dest.removeListener('unpipe', onunpipe);
              src.removeListener('end', onend);
              src.removeListener('end', unpipe);
              src.removeListener('data', ondata);

              cleanedUp = true;

              // if the reader is waiting for a drain event from this
              // specific writer, then it would cause it to never start
              // flowing again.
              // So, if this is awaiting a drain, then we just call it now.
              // If we don't know, then assume that we are waiting for one.
              if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
            }

            // If the user pushes more data while we're writing to dest then we'll end up
            // in ondata again. However, we only want to increase awaitDrain once because
            // dest will only emit one 'drain' event for the multiple writes.
            // => Introduce a guard on increasing awaitDrain.
            var increasedAwaitDrain = false;
            src.on('data', ondata);
            function ondata(chunk) {
              debug('ondata');
              increasedAwaitDrain = false;
              var ret = dest.write(chunk);
              if (false === ret && !increasedAwaitDrain) {
                // If the user unpiped during `dest.write()`, it is possible
                // to get stuck in a permanently paused state if that write
                // also returned false.
                // => Check whether `dest` is still a piping destination.
                if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
                  debug('false write response, pause', src._readableState.awaitDrain);
                  src._readableState.awaitDrain++;
                  increasedAwaitDrain = true;
                }
                src.pause();
              }
            }

            // if the dest has an error, then stop piping into it.
            // however, don't suppress the throwing behavior for this.
            function onerror(er) {
              debug('onerror', er);
              unpipe();
              dest.removeListener('error', onerror);
              if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
            }

            // Make sure our error handler is attached before userland ones.
            prependListener(dest, 'error', onerror);

            // Both close and finish should trigger unpipe, but only once.
            function onclose() {
              dest.removeListener('finish', onfinish);
              unpipe();
            }
            dest.once('close', onclose);
            function onfinish() {
              debug('onfinish');
              dest.removeListener('close', onclose);
              unpipe();
            }
            dest.once('finish', onfinish);

            function unpipe() {
              debug('unpipe');
              src.unpipe(dest);
            }

            // tell the dest that it's being piped to
            dest.emit('pipe', src);

            // start the flow if it hasn't been started already.
            if (!state.flowing) {
              debug('pipe resume');
              src.resume();
            }

            return dest;
          };

          function pipeOnDrain(src) {
            return function () {
              var state = src._readableState;
              debug('pipeOnDrain', state.awaitDrain);
              if (state.awaitDrain) state.awaitDrain--;
              if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
                state.flowing = true;
                flow(src);
              }
            };
          }

          Readable.prototype.unpipe = function (dest) {
            var state = this._readableState;
            var unpipeInfo = { hasUnpiped: false };

            // if we're not piping anywhere, then do nothing.
            if (state.pipesCount === 0) return this;

            // just one destination.  most common case.
            if (state.pipesCount === 1) {
              // passed in one, but it's not the right one.
              if (dest && dest !== state.pipes) return this;

              if (!dest) dest = state.pipes;

              // got a match.
              state.pipes = null;
              state.pipesCount = 0;
              state.flowing = false;
              if (dest) dest.emit('unpipe', this, unpipeInfo);
              return this;
            }

            // slow case. multiple pipe destinations.

            if (!dest) {
              // remove all.
              var dests = state.pipes;
              var len = state.pipesCount;
              state.pipes = null;
              state.pipesCount = 0;
              state.flowing = false;

              for (var i = 0; i < len; i++) {
                dests[i].emit('unpipe', this, unpipeInfo);
              } return this;
            }

            // try to find the right one.
            var index = indexOf(state.pipes, dest);
            if (index === -1) return this;

            state.pipes.splice(index, 1);
            state.pipesCount -= 1;
            if (state.pipesCount === 1) state.pipes = state.pipes[0];

            dest.emit('unpipe', this, unpipeInfo);

            return this;
          };

          // set up data events if they are asked for
          // Ensure readable listeners eventually get something
          Readable.prototype.on = function (ev, fn) {
            var res = Stream.prototype.on.call(this, ev, fn);

            if (ev === 'data') {
              // Start flowing on next tick if stream isn't explicitly paused
              if (this._readableState.flowing !== false) this.resume();
            } else if (ev === 'readable') {
              var state = this._readableState;
              if (!state.endEmitted && !state.readableListening) {
                state.readableListening = state.needReadable = true;
                state.emittedReadable = false;
                if (!state.reading) {
                  pna.nextTick(nReadingNextTick, this);
                } else if (state.length) {
                  emitReadable(this);
                }
              }
            }

            return res;
          };
          Readable.prototype.addListener = Readable.prototype.on;

          function nReadingNextTick(self) {
            debug('readable nexttick read 0');
            self.read(0);
          }

          // pause() and resume() are remnants of the legacy readable stream API
          // If the user uses them, then switch into old mode.
          Readable.prototype.resume = function () {
            var state = this._readableState;
            if (!state.flowing) {
              debug('resume');
              state.flowing = true;
              resume(this, state);
            }
            return this;
          };

          function resume(stream, state) {
            if (!state.resumeScheduled) {
              state.resumeScheduled = true;
              pna.nextTick(resume_, stream, state);
            }
          }

          function resume_(stream, state) {
            if (!state.reading) {
              debug('resume read 0');
              stream.read(0);
            }

            state.resumeScheduled = false;
            state.awaitDrain = 0;
            stream.emit('resume');
            flow(stream);
            if (state.flowing && !state.reading) stream.read(0);
          }

          Readable.prototype.pause = function () {
            debug('call pause flowing=%j', this._readableState.flowing);
            if (false !== this._readableState.flowing) {
              debug('pause');
              this._readableState.flowing = false;
              this.emit('pause');
            }
            return this;
          };

          function flow(stream) {
            var state = stream._readableState;
            debug('flow', state.flowing);
            while (state.flowing && stream.read() !== null) { }
          }

          // wrap an old-style stream as the async data source.
          // This is *not* part of the readable stream interface.
          // It is an ugly unfortunate mess of history.
          Readable.prototype.wrap = function (stream) {
            var _this = this;

            var state = this._readableState;
            var paused = false;

            stream.on('end', function () {
              debug('wrapped end');
              if (state.decoder && !state.ended) {
                var chunk = state.decoder.end();
                if (chunk && chunk.length) _this.push(chunk);
              }

              _this.push(null);
            });

            stream.on('data', function (chunk) {
              debug('wrapped data');
              if (state.decoder) chunk = state.decoder.write(chunk);

              // don't skip over falsy values in objectMode
              if (state.objectMode && (chunk === null || chunk === undefined)) return; else if (!state.objectMode && (!chunk || !chunk.length)) return;

              var ret = _this.push(chunk);
              if (!ret) {
                paused = true;
                stream.pause();
              }
            });

            // proxy all the other methods.
            // important when wrapping filters and duplexes.
            for (var i in stream) {
              if (this[i] === undefined && typeof stream[i] === 'function') {
                this[i] = function (method) {
                  return function () {
                    return stream[method].apply(stream, arguments);
                  };
                }(i);
              }
            }

            // proxy certain important events.
            for (var n = 0; n < kProxyEvents.length; n++) {
              stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
            }

            // when we try to consume some more bytes, simply unpause the
            // underlying stream.
            this._read = function (n) {
              debug('wrapped _read', n);
              if (paused) {
                paused = false;
                stream.resume();
              }
            };

            return this;
          };

          Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: false,
            get: function () {
              return this._readableState.highWaterMark;
            }
          });

          // exposed for testing purposes only.
          Readable._fromList = fromList;

          // Pluck off n bytes from an array of buffers.
          // Length is the combined lengths of all the buffers in the list.
          // This function is designed to be inlinable, so please take care when making
          // changes to the function body.
          function fromList(n, state) {
            // nothing buffered
            if (state.length === 0) return null;

            var ret;
            if (state.objectMode) ret = state.buffer.shift(); else if (!n || n >= state.length) {
              // read it all, truncate the list
              if (state.decoder) ret = state.buffer.join(''); else if (state.buffer.length === 1) ret = state.buffer.head.data; else ret = state.buffer.concat(state.length);
              state.buffer.clear();
            } else {
              // read part of list
              ret = fromListPartial(n, state.buffer, state.decoder);
            }

            return ret;
          }

          // Extracts only enough buffered data to satisfy the amount requested.
          // This function is designed to be inlinable, so please take care when making
          // changes to the function body.
          function fromListPartial(n, list, hasStrings) {
            var ret;
            if (n < list.head.data.length) {
              // slice is the same for buffers and strings
              ret = list.head.data.slice(0, n);
              list.head.data = list.head.data.slice(n);
            } else if (n === list.head.data.length) {
              // first chunk is a perfect match
              ret = list.shift();
            } else {
              // result spans more than one buffer
              ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
            }
            return ret;
          }

          // Copies a specified amount of characters from the list of buffered data
          // chunks.
          // This function is designed to be inlinable, so please take care when making
          // changes to the function body.
          function copyFromBufferString(n, list) {
            var p = list.head;
            var c = 1;
            var ret = p.data;
            n -= ret.length;
            while (p = p.next) {
              var str = p.data;
              var nb = n > str.length ? str.length : n;
              if (nb === str.length) ret += str; else ret += str.slice(0, n);
              n -= nb;
              if (n === 0) {
                if (nb === str.length) {
                  ++c;
                  if (p.next) list.head = p.next; else list.head = list.tail = null;
                } else {
                  list.head = p;
                  p.data = str.slice(nb);
                }
                break;
              }
              ++c;
            }
            list.length -= c;
            return ret;
          }

          // Copies a specified amount of bytes from the list of buffered data chunks.
          // This function is designed to be inlinable, so please take care when making
          // changes to the function body.
          function copyFromBuffer(n, list) {
            var ret = Buffer.allocUnsafe(n);
            var p = list.head;
            var c = 1;
            p.data.copy(ret);
            n -= p.data.length;
            while (p = p.next) {
              var buf = p.data;
              var nb = n > buf.length ? buf.length : n;
              buf.copy(ret, ret.length - n, 0, nb);
              n -= nb;
              if (n === 0) {
                if (nb === buf.length) {
                  ++c;
                  if (p.next) list.head = p.next; else list.head = list.tail = null;
                } else {
                  list.head = p;
                  p.data = buf.slice(nb);
                }
                break;
              }
              ++c;
            }
            list.length -= c;
            return ret;
          }

          function endReadable(stream) {
            var state = stream._readableState;

            // If we get here before consuming all the bytes, then that is a
            // bug in node.  Should never happen.
            if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

            if (!state.endEmitted) {
              state.ended = true;
              pna.nextTick(endReadableNT, state, stream);
            }
          }

          function endReadableNT(state, stream) {
            // Check that we didn't get one last unshift.
            if (!state.endEmitted && state.length === 0) {
              state.endEmitted = true;
              stream.readable = false;
              stream.emit('end');
            }
          }

          function indexOf(xs, x) {
            for (var i = 0, l = xs.length; i < l; i++) {
              if (xs[i] === x) return i;
            }
            return -1;
          }
        }).call(this)
      }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "./_stream_duplex": 61, "./internal/streams/BufferList": 66, "./internal/streams/destroy": 67, "./internal/streams/stream": 68, "_process": 24, "core-util-is": 33, "events": 10, "inherits": 38, "isarray": 40, "process-nextick-args": 46, "safe-buffer": 70, "string_decoder/": 73, "util": 4 }], 64: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      // a transform stream is a readable/writable stream where you do
      // something with the data.  Sometimes it's called a "filter",
      // but that's not a great name for it, since that implies a thing where
      // some bits pass through, and others are simply ignored.  (That would
      // be a valid example of a transform, of course.)
      //
      // While the output is causally related to the input, it's not a
      // necessarily symmetric or synchronous transformation.  For example,
      // a zlib stream might take multiple plain-text writes(), and then
      // emit a single compressed chunk some time in the future.
      //
      // Here's how this works:
      //
      // The Transform stream has all the aspects of the readable and writable
      // stream classes.  When you write(chunk), that calls _write(chunk,cb)
      // internally, and returns false if there's a lot of pending writes
      // buffered up.  When you call read(), that calls _read(n) until
      // there's enough pending readable data buffered up.
      //
      // In a transform stream, the written data is placed in a buffer.  When
      // _read(n) is called, it transforms the queued up data, calling the
      // buffered _write cb's as it consumes chunks.  If consuming a single
      // written chunk would result in multiple output chunks, then the first
      // outputted bit calls the readcb, and subsequent chunks just go into
      // the read buffer, and will cause it to emit 'readable' if necessary.
      //
      // This way, back-pressure is actually determined by the reading side,
      // since _read has to be called to start processing a new chunk.  However,
      // a pathological inflate type of transform can cause excessive buffering
      // here.  For example, imagine a stream where every byte of input is
      // interpreted as an integer from 0-255, and then results in that many
      // bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
      // 1kb of data being output.  In this case, you could write a very small
      // amount of input, and end up with a very large amount of output.  In
      // such a pathological inflating mechanism, there'd be no way to tell
      // the system to stop doing the transform.  A single 4MB write could
      // cause the system to run out of memory.
      //
      // However, even in such a pathological case, only a single written chunk
      // would be consumed, and then the rest would wait (un-transformed) until
      // the results of the previous transformed chunk were consumed.

      'use strict';

      module.exports = Transform;

      var Duplex = require('./_stream_duplex');

      /*<replacement>*/
      var util = Object.create(require('core-util-is'));
      util.inherits = require('inherits');
      /*</replacement>*/

      util.inherits(Transform, Duplex);

      function afterTransform(er, data) {
        var ts = this._transformState;
        ts.transforming = false;

        var cb = ts.writecb;

        if (!cb) {
          return this.emit('error', new Error('write callback called multiple times'));
        }

        ts.writechunk = null;
        ts.writecb = null;

        if (data != null) // single equals check for both `null` and `undefined`
          this.push(data);

        cb(er);

        var rs = this._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
          this._read(rs.highWaterMark);
        }
      }

      function Transform(options) {
        if (!(this instanceof Transform)) return new Transform(options);

        Duplex.call(this, options);

        this._transformState = {
          afterTransform: afterTransform.bind(this),
          needTransform: false,
          transforming: false,
          writecb: null,
          writechunk: null,
          writeencoding: null
        };

        // start out asking for a readable event once data is transformed.
        this._readableState.needReadable = true;

        // we have implemented the _read method, and done the other things
        // that Readable wants before the first _read call, so unset the
        // sync guard flag.
        this._readableState.sync = false;

        if (options) {
          if (typeof options.transform === 'function') this._transform = options.transform;

          if (typeof options.flush === 'function') this._flush = options.flush;
        }

        // When the writable side finishes, then flush out anything remaining.
        this.on('prefinish', prefinish);
      }

      function prefinish() {
        var _this = this;

        if (typeof this._flush === 'function') {
          this._flush(function (er, data) {
            done(_this, er, data);
          });
        } else {
          done(this, null, null);
        }
      }

      Transform.prototype.push = function (chunk, encoding) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk, encoding);
      };

      // This is the part where you do stuff!
      // override this function in implementation classes.
      // 'chunk' is an input chunk.
      //
      // Call `push(newChunk)` to pass along transformed output
      // to the readable side.  You may call 'push' zero or more times.
      //
      // Call `cb(err)` when you are done with this chunk.  If you pass
      // an error, then that'll put the hurt on the whole operation.  If you
      // never call cb(), then you'll never get another chunk.
      Transform.prototype._transform = function (chunk, encoding, cb) {
        throw new Error('_transform() is not implemented');
      };

      Transform.prototype._write = function (chunk, encoding, cb) {
        var ts = this._transformState;
        ts.writecb = cb;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
          var rs = this._readableState;
          if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
      };

      // Doesn't matter what the args are here.
      // _transform does all the work.
      // That we got here means that the readable side wants more data.
      Transform.prototype._read = function (n) {
        var ts = this._transformState;

        if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
          ts.transforming = true;
          this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
        } else {
          // mark that we need a transform, so that any data that comes in
          // will get processed, now that we've asked for it.
          ts.needTransform = true;
        }
      };

      Transform.prototype._destroy = function (err, cb) {
        var _this2 = this;

        Duplex.prototype._destroy.call(this, err, function (err2) {
          cb(err2);
          _this2.emit('close');
        });
      };

      function done(stream, er, data) {
        if (er) return stream.emit('error', er);

        if (data != null) // single equals check for both `null` and `undefined`
          stream.push(data);

        // if there's nothing in the write buffer, then that means
        // that nothing more will ever be provided
        if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

        if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

        return stream.push(null);
      }
    }, { "./_stream_duplex": 61, "core-util-is": 33, "inherits": 38 }], 65: [function (require, module, exports) {
      (function (process, global, setImmediate) {
        (function () {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.

          // A bit simpler than readable streams.
          // Implement an async ._write(chunk, encoding, cb), and it'll handle all
          // the drain event emission and buffering.

          'use strict';

          /*<replacement>*/

          var pna = require('process-nextick-args');
          /*</replacement>*/

          module.exports = Writable;

          /* <replacement> */
          function WriteReq(chunk, encoding, cb) {
            this.chunk = chunk;
            this.encoding = encoding;
            this.callback = cb;
            this.next = null;
          }

          // It seems a linked list but it is not
          // there will be only 2 of these for each stream
          function CorkedRequest(state) {
            var _this = this;

            this.next = null;
            this.entry = null;
            this.finish = function () {
              onCorkedFinish(_this, state);
            };
          }
          /* </replacement> */

          /*<replacement>*/
          var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
          /*</replacement>*/

          /*<replacement>*/
          var Duplex;
          /*</replacement>*/

          Writable.WritableState = WritableState;

          /*<replacement>*/
          var util = Object.create(require('core-util-is'));
          util.inherits = require('inherits');
          /*</replacement>*/

          /*<replacement>*/
          var internalUtil = {
            deprecate: require('util-deprecate')
          };
          /*</replacement>*/

          /*<replacement>*/
          var Stream = require('./internal/streams/stream');
          /*</replacement>*/

          /*<replacement>*/

          var Buffer = require('safe-buffer').Buffer;
          var OurUint8Array = global.Uint8Array || function () { };
          function _uint8ArrayToBuffer(chunk) {
            return Buffer.from(chunk);
          }
          function _isUint8Array(obj) {
            return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
          }

          /*</replacement>*/

          var destroyImpl = require('./internal/streams/destroy');

          util.inherits(Writable, Stream);

          function nop() { }

          function WritableState(options, stream) {
            Duplex = Duplex || require('./_stream_duplex');

            options = options || {};

            // Duplex streams are both readable and writable, but share
            // the same options object.
            // However, some cases require setting options to different
            // values for the readable and the writable sides of the duplex stream.
            // These options can be provided separately as readableXXX and writableXXX.
            var isDuplex = stream instanceof Duplex;

            // object stream flag to indicate whether or not this stream
            // contains buffers or objects.
            this.objectMode = !!options.objectMode;

            if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

            // the point at which write() starts returning false
            // Note: 0 is a valid value, means that we always return false if
            // the entire buffer is not flushed immediately on write()
            var hwm = options.highWaterMark;
            var writableHwm = options.writableHighWaterMark;
            var defaultHwm = this.objectMode ? 16 : 16 * 1024;

            if (hwm || hwm === 0) this.highWaterMark = hwm; else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm; else this.highWaterMark = defaultHwm;

            // cast to ints.
            this.highWaterMark = Math.floor(this.highWaterMark);

            // if _final has been called
            this.finalCalled = false;

            // drain event flag.
            this.needDrain = false;
            // at the start of calling end()
            this.ending = false;
            // when end() has been called, and returned
            this.ended = false;
            // when 'finish' is emitted
            this.finished = false;

            // has it been destroyed
            this.destroyed = false;

            // should we decode strings into buffers before passing to _write?
            // this is here so that some node-core streams can optimize string
            // handling at a lower level.
            var noDecode = options.decodeStrings === false;
            this.decodeStrings = !noDecode;

            // Crypto is kind of old and crusty.  Historically, its default string
            // encoding is 'binary' so we have to make this configurable.
            // Everything else in the universe uses 'utf8', though.
            this.defaultEncoding = options.defaultEncoding || 'utf8';

            // not an actual buffer we keep track of, but a measurement
            // of how much we're waiting to get pushed to some underlying
            // socket or file.
            this.length = 0;

            // a flag to see when we're in the middle of a write.
            this.writing = false;

            // when true all writes will be buffered until .uncork() call
            this.corked = 0;

            // a flag to be able to tell if the onwrite cb is called immediately,
            // or on a later tick.  We set this to true at first, because any
            // actions that shouldn't happen until "later" should generally also
            // not happen before the first write call.
            this.sync = true;

            // a flag to know if we're processing previously buffered items, which
            // may call the _write() callback in the same tick, so that we don't
            // end up in an overlapped onwrite situation.
            this.bufferProcessing = false;

            // the callback that's passed to _write(chunk,cb)
            this.onwrite = function (er) {
              onwrite(stream, er);
            };

            // the callback that the user supplies to write(chunk,encoding,cb)
            this.writecb = null;

            // the amount that is being written when _write is called.
            this.writelen = 0;

            this.bufferedRequest = null;
            this.lastBufferedRequest = null;

            // number of pending user-supplied write callbacks
            // this must be 0 before 'finish' can be emitted
            this.pendingcb = 0;

            // emit prefinish if the only thing we're waiting for is _write cbs
            // This is relevant for synchronous Transform streams
            this.prefinished = false;

            // True if the error was already emitted and should not be thrown again
            this.errorEmitted = false;

            // count buffered requests
            this.bufferedRequestCount = 0;

            // allocate the first CorkedRequest, there is always
            // one allocated and free to use, and we maintain at most two
            this.corkedRequestsFree = new CorkedRequest(this);
          }

          WritableState.prototype.getBuffer = function getBuffer() {
            var current = this.bufferedRequest;
            var out = [];
            while (current) {
              out.push(current);
              current = current.next;
            }
            return out;
          };

          (function () {
            try {
              Object.defineProperty(WritableState.prototype, 'buffer', {
                get: internalUtil.deprecate(function () {
                  return this.getBuffer();
                }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
              });
            } catch (_) { }
          })();

          // Test _writableState for inheritance to account for Duplex streams,
          // whose prototype chain only points to Readable.
          var realHasInstance;
          if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
            realHasInstance = Function.prototype[Symbol.hasInstance];
            Object.defineProperty(Writable, Symbol.hasInstance, {
              value: function (object) {
                if (realHasInstance.call(this, object)) return true;
                if (this !== Writable) return false;

                return object && object._writableState instanceof WritableState;
              }
            });
          } else {
            realHasInstance = function (object) {
              return object instanceof this;
            };
          }

          function Writable(options) {
            Duplex = Duplex || require('./_stream_duplex');

            // Writable ctor is applied to Duplexes, too.
            // `realHasInstance` is necessary because using plain `instanceof`
            // would return false, as no `_writableState` property is attached.

            // Trying to use the custom `instanceof` for Writable here will also break the
            // Node.js LazyTransform implementation, which has a non-trivial getter for
            // `_writableState` that would lead to infinite recursion.
            if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
              return new Writable(options);
            }

            this._writableState = new WritableState(options, this);

            // legacy.
            this.writable = true;

            if (options) {
              if (typeof options.write === 'function') this._write = options.write;

              if (typeof options.writev === 'function') this._writev = options.writev;

              if (typeof options.destroy === 'function') this._destroy = options.destroy;

              if (typeof options.final === 'function') this._final = options.final;
            }

            Stream.call(this);
          }

          // Otherwise people can pipe Writable streams, which is just wrong.
          Writable.prototype.pipe = function () {
            this.emit('error', new Error('Cannot pipe, not readable'));
          };

          function writeAfterEnd(stream, cb) {
            var er = new Error('write after end');
            // TODO: defer error events consistently everywhere, not just the cb
            stream.emit('error', er);
            pna.nextTick(cb, er);
          }

          // Checks that a user-supplied chunk is valid, especially for the particular
          // mode the stream is in. Currently this means that `null` is never accepted
          // and undefined/non-string values are only allowed in object mode.
          function validChunk(stream, state, chunk, cb) {
            var valid = true;
            var er = false;

            if (chunk === null) {
              er = new TypeError('May not write null values to stream');
            } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
              er = new TypeError('Invalid non-string/buffer chunk');
            }
            if (er) {
              stream.emit('error', er);
              pna.nextTick(cb, er);
              valid = false;
            }
            return valid;
          }

          Writable.prototype.write = function (chunk, encoding, cb) {
            var state = this._writableState;
            var ret = false;
            var isBuf = !state.objectMode && _isUint8Array(chunk);

            if (isBuf && !Buffer.isBuffer(chunk)) {
              chunk = _uint8ArrayToBuffer(chunk);
            }

            if (typeof encoding === 'function') {
              cb = encoding;
              encoding = null;
            }

            if (isBuf) encoding = 'buffer'; else if (!encoding) encoding = state.defaultEncoding;

            if (typeof cb !== 'function') cb = nop;

            if (state.ended) writeAfterEnd(this, cb); else if (isBuf || validChunk(this, state, chunk, cb)) {
              state.pendingcb++;
              ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
            }

            return ret;
          };

          Writable.prototype.cork = function () {
            var state = this._writableState;

            state.corked++;
          };

          Writable.prototype.uncork = function () {
            var state = this._writableState;

            if (state.corked) {
              state.corked--;

              if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
            }
          };

          Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
            // node::ParseEncoding() requires lower case.
            if (typeof encoding === 'string') encoding = encoding.toLowerCase();
            if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
            this._writableState.defaultEncoding = encoding;
            return this;
          };

          function decodeChunk(state, chunk, encoding) {
            if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
              chunk = Buffer.from(chunk, encoding);
            }
            return chunk;
          }

          Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: false,
            get: function () {
              return this._writableState.highWaterMark;
            }
          });

          // if we're already writing something, then just put this
          // in the queue, and wait our turn.  Otherwise, call _write
          // If we return false, then we need a drain event, so set that flag.
          function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
            if (!isBuf) {
              var newChunk = decodeChunk(state, chunk, encoding);
              if (chunk !== newChunk) {
                isBuf = true;
                encoding = 'buffer';
                chunk = newChunk;
              }
            }
            var len = state.objectMode ? 1 : chunk.length;

            state.length += len;

            var ret = state.length < state.highWaterMark;
            // we must ensure that previous needDrain will not be reset to false.
            if (!ret) state.needDrain = true;

            if (state.writing || state.corked) {
              var last = state.lastBufferedRequest;
              state.lastBufferedRequest = {
                chunk: chunk,
                encoding: encoding,
                isBuf: isBuf,
                callback: cb,
                next: null
              };
              if (last) {
                last.next = state.lastBufferedRequest;
              } else {
                state.bufferedRequest = state.lastBufferedRequest;
              }
              state.bufferedRequestCount += 1;
            } else {
              doWrite(stream, state, false, len, chunk, encoding, cb);
            }

            return ret;
          }

          function doWrite(stream, state, writev, len, chunk, encoding, cb) {
            state.writelen = len;
            state.writecb = cb;
            state.writing = true;
            state.sync = true;
            if (writev) stream._writev(chunk, state.onwrite); else stream._write(chunk, encoding, state.onwrite);
            state.sync = false;
          }

          function onwriteError(stream, state, sync, er, cb) {
            --state.pendingcb;

            if (sync) {
              // defer the callback if we are being called synchronously
              // to avoid piling up things on the stack
              pna.nextTick(cb, er);
              // this can emit finish, and it will always happen
              // after error
              pna.nextTick(finishMaybe, stream, state);
              stream._writableState.errorEmitted = true;
              stream.emit('error', er);
            } else {
              // the caller expect this to happen before if
              // it is async
              cb(er);
              stream._writableState.errorEmitted = true;
              stream.emit('error', er);
              // this can emit finish, but finish must
              // always follow error
              finishMaybe(stream, state);
            }
          }

          function onwriteStateUpdate(state) {
            state.writing = false;
            state.writecb = null;
            state.length -= state.writelen;
            state.writelen = 0;
          }

          function onwrite(stream, er) {
            var state = stream._writableState;
            var sync = state.sync;
            var cb = state.writecb;

            onwriteStateUpdate(state);

            if (er) onwriteError(stream, state, sync, er, cb); else {
              // Check if we're actually ready to finish, but don't emit yet
              var finished = needFinish(state);

              if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
                clearBuffer(stream, state);
              }

              if (sync) {
                /*<replacement>*/
                asyncWrite(afterWrite, stream, state, finished, cb);
                /*</replacement>*/
              } else {
                afterWrite(stream, state, finished, cb);
              }
            }
          }

          function afterWrite(stream, state, finished, cb) {
            if (!finished) onwriteDrain(stream, state);
            state.pendingcb--;
            cb();
            finishMaybe(stream, state);
          }

          // Must force callback to be called on nextTick, so that we don't
          // emit 'drain' before the write() consumer gets the 'false' return
          // value, and has a chance to attach a 'drain' listener.
          function onwriteDrain(stream, state) {
            if (state.length === 0 && state.needDrain) {
              state.needDrain = false;
              stream.emit('drain');
            }
          }

          // if there's something in the buffer waiting, then process it
          function clearBuffer(stream, state) {
            state.bufferProcessing = true;
            var entry = state.bufferedRequest;

            if (stream._writev && entry && entry.next) {
              // Fast case, write everything using _writev()
              var l = state.bufferedRequestCount;
              var buffer = new Array(l);
              var holder = state.corkedRequestsFree;
              holder.entry = entry;

              var count = 0;
              var allBuffers = true;
              while (entry) {
                buffer[count] = entry;
                if (!entry.isBuf) allBuffers = false;
                entry = entry.next;
                count += 1;
              }
              buffer.allBuffers = allBuffers;

              doWrite(stream, state, true, state.length, buffer, '', holder.finish);

              // doWrite is almost always async, defer these to save a bit of time
              // as the hot path ends with doWrite
              state.pendingcb++;
              state.lastBufferedRequest = null;
              if (holder.next) {
                state.corkedRequestsFree = holder.next;
                holder.next = null;
              } else {
                state.corkedRequestsFree = new CorkedRequest(state);
              }
              state.bufferedRequestCount = 0;
            } else {
              // Slow case, write chunks one-by-one
              while (entry) {
                var chunk = entry.chunk;
                var encoding = entry.encoding;
                var cb = entry.callback;
                var len = state.objectMode ? 1 : chunk.length;

                doWrite(stream, state, false, len, chunk, encoding, cb);
                entry = entry.next;
                state.bufferedRequestCount--;
                // if we didn't call the onwrite immediately, then
                // it means that we need to wait until it does.
                // also, that means that the chunk and cb are currently
                // being processed, so move the buffer counter past them.
                if (state.writing) {
                  break;
                }
              }

              if (entry === null) state.lastBufferedRequest = null;
            }

            state.bufferedRequest = entry;
            state.bufferProcessing = false;
          }

          Writable.prototype._write = function (chunk, encoding, cb) {
            cb(new Error('_write() is not implemented'));
          };

          Writable.prototype._writev = null;

          Writable.prototype.end = function (chunk, encoding, cb) {
            var state = this._writableState;

            if (typeof chunk === 'function') {
              cb = chunk;
              chunk = null;
              encoding = null;
            } else if (typeof encoding === 'function') {
              cb = encoding;
              encoding = null;
            }

            if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

            // .end() fully uncorks
            if (state.corked) {
              state.corked = 1;
              this.uncork();
            }

            // ignore unnecessary end() calls.
            if (!state.ending && !state.finished) endWritable(this, state, cb);
          };

          function needFinish(state) {
            return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
          }
          function callFinal(stream, state) {
            stream._final(function (err) {
              state.pendingcb--;
              if (err) {
                stream.emit('error', err);
              }
              state.prefinished = true;
              stream.emit('prefinish');
              finishMaybe(stream, state);
            });
          }
          function prefinish(stream, state) {
            if (!state.prefinished && !state.finalCalled) {
              if (typeof stream._final === 'function') {
                state.pendingcb++;
                state.finalCalled = true;
                pna.nextTick(callFinal, stream, state);
              } else {
                state.prefinished = true;
                stream.emit('prefinish');
              }
            }
          }

          function finishMaybe(stream, state) {
            var need = needFinish(state);
            if (need) {
              prefinish(stream, state);
              if (state.pendingcb === 0) {
                state.finished = true;
                stream.emit('finish');
              }
            }
            return need;
          }

          function endWritable(stream, state, cb) {
            state.ending = true;
            finishMaybe(stream, state);
            if (cb) {
              if (state.finished) pna.nextTick(cb); else stream.once('finish', cb);
            }
            state.ended = true;
            stream.writable = false;
          }

          function onCorkedFinish(corkReq, state, err) {
            var entry = corkReq.entry;
            corkReq.entry = null;
            while (entry) {
              var cb = entry.callback;
              state.pendingcb--;
              cb(err);
              entry = entry.next;
            }
            if (state.corkedRequestsFree) {
              state.corkedRequestsFree.next = corkReq;
            } else {
              state.corkedRequestsFree = corkReq;
            }
          }

          Object.defineProperty(Writable.prototype, 'destroyed', {
            get: function () {
              if (this._writableState === undefined) {
                return false;
              }
              return this._writableState.destroyed;
            },
            set: function (value) {
              // we ignore the value if the stream
              // has not been initialized yet
              if (!this._writableState) {
                return;
              }

              // backward compatibility, the user is explicitly
              // managing destroyed
              this._writableState.destroyed = value;
            }
          });

          Writable.prototype.destroy = destroyImpl.destroy;
          Writable.prototype._undestroy = destroyImpl.undestroy;
          Writable.prototype._destroy = function (err, cb) {
            this.end();
            cb(err);
          };
        }).call(this)
      }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("timers").setImmediate)
    }, { "./_stream_duplex": 61, "./internal/streams/destroy": 67, "./internal/streams/stream": 68, "_process": 24, "core-util-is": 33, "inherits": 38, "process-nextick-args": 46, "safe-buffer": 70, "timers": 25, "util-deprecate": 74 }], 66: [function (require, module, exports) {
      'use strict';

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      var Buffer = require('safe-buffer').Buffer;
      var util = require('util');

      function copyBuffer(src, target, offset) {
        src.copy(target, offset);
      }

      module.exports = function () {
        function BufferList() {
          _classCallCheck(this, BufferList);

          this.head = null;
          this.tail = null;
          this.length = 0;
        }

        BufferList.prototype.push = function push(v) {
          var entry = { data: v, next: null };
          if (this.length > 0) this.tail.next = entry; else this.head = entry;
          this.tail = entry;
          ++this.length;
        };

        BufferList.prototype.unshift = function unshift(v) {
          var entry = { data: v, next: this.head };
          if (this.length === 0) this.tail = entry;
          this.head = entry;
          ++this.length;
        };

        BufferList.prototype.shift = function shift() {
          if (this.length === 0) return;
          var ret = this.head.data;
          if (this.length === 1) this.head = this.tail = null; else this.head = this.head.next;
          --this.length;
          return ret;
        };

        BufferList.prototype.clear = function clear() {
          this.head = this.tail = null;
          this.length = 0;
        };

        BufferList.prototype.join = function join(s) {
          if (this.length === 0) return '';
          var p = this.head;
          var ret = '' + p.data;
          while (p = p.next) {
            ret += s + p.data;
          } return ret;
        };

        BufferList.prototype.concat = function concat(n) {
          if (this.length === 0) return Buffer.alloc(0);
          if (this.length === 1) return this.head.data;
          var ret = Buffer.allocUnsafe(n >>> 0);
          var p = this.head;
          var i = 0;
          while (p) {
            copyBuffer(p.data, ret, i);
            i += p.data.length;
            p = p.next;
          }
          return ret;
        };

        return BufferList;
      }();

      if (util && util.inspect && util.inspect.custom) {
        module.exports.prototype[util.inspect.custom] = function () {
          var obj = util.inspect({ length: this.length });
          return this.constructor.name + ' ' + obj;
        };
      }
    }, { "safe-buffer": 70, "util": 4 }], 67: [function (require, module, exports) {
      'use strict';

      /*<replacement>*/

      var pna = require('process-nextick-args');
      /*</replacement>*/

      // undocumented cb() API, needed for core, not for public API
      function destroy(err, cb) {
        var _this = this;

        var readableDestroyed = this._readableState && this._readableState.destroyed;
        var writableDestroyed = this._writableState && this._writableState.destroyed;

        if (readableDestroyed || writableDestroyed) {
          if (cb) {
            cb(err);
          } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
            pna.nextTick(emitErrorNT, this, err);
          }
          return this;
        }

        // we set destroyed to true before firing error callbacks in order
        // to make it re-entrance safe in case destroy() is called within callbacks

        if (this._readableState) {
          this._readableState.destroyed = true;
        }

        // if this is a duplex stream mark the writable part as destroyed as well
        if (this._writableState) {
          this._writableState.destroyed = true;
        }

        this._destroy(err || null, function (err) {
          if (!cb && err) {
            pna.nextTick(emitErrorNT, _this, err);
            if (_this._writableState) {
              _this._writableState.errorEmitted = true;
            }
          } else if (cb) {
            cb(err);
          }
        });

        return this;
      }

      function undestroy() {
        if (this._readableState) {
          this._readableState.destroyed = false;
          this._readableState.reading = false;
          this._readableState.ended = false;
          this._readableState.endEmitted = false;
        }

        if (this._writableState) {
          this._writableState.destroyed = false;
          this._writableState.ended = false;
          this._writableState.ending = false;
          this._writableState.finished = false;
          this._writableState.errorEmitted = false;
        }
      }

      function emitErrorNT(self, err) {
        self.emit('error', err);
      }

      module.exports = {
        destroy: destroy,
        undestroy: undestroy
      };
    }, { "process-nextick-args": 46 }], 68: [function (require, module, exports) {
      module.exports = require('events').EventEmitter;

    }, { "events": 10 }], 69: [function (require, module, exports) {
      exports = module.exports = require('./lib/_stream_readable.js');
      exports.Stream = exports;
      exports.Readable = exports;
      exports.Writable = require('./lib/_stream_writable.js');
      exports.Duplex = require('./lib/_stream_duplex.js');
      exports.Transform = require('./lib/_stream_transform.js');
      exports.PassThrough = require('./lib/_stream_passthrough.js');

    }, { "./lib/_stream_duplex.js": 61, "./lib/_stream_passthrough.js": 62, "./lib/_stream_readable.js": 63, "./lib/_stream_transform.js": 64, "./lib/_stream_writable.js": 65 }], 70: [function (require, module, exports) {
      /* eslint-disable node/no-deprecated-api */
      var buffer = require('buffer')
      var Buffer = buffer.Buffer

      // alternative to using Object.keys for old browsers
      function copyProps(src, dst) {
        for (var key in src) {
          dst[key] = src[key]
        }
      }
      if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
        module.exports = buffer
      } else {
        // Copy properties from require('buffer')
        copyProps(buffer, exports)
        exports.Buffer = SafeBuffer
      }

      function SafeBuffer(arg, encodingOrOffset, length) {
        return Buffer(arg, encodingOrOffset, length)
      }

      // Copy static methods from Buffer
      copyProps(Buffer, SafeBuffer)

      SafeBuffer.from = function (arg, encodingOrOffset, length) {
        if (typeof arg === 'number') {
          throw new TypeError('Argument must not be a number')
        }
        return Buffer(arg, encodingOrOffset, length)
      }

      SafeBuffer.alloc = function (size, fill, encoding) {
        if (typeof size !== 'number') {
          throw new TypeError('Argument must be a number')
        }
        var buf = Buffer(size)
        if (fill !== undefined) {
          if (typeof encoding === 'string') {
            buf.fill(fill, encoding)
          } else {
            buf.fill(fill)
          }
        } else {
          buf.fill(0)
        }
        return buf
      }

      SafeBuffer.allocUnsafe = function (size) {
        if (typeof size !== 'number') {
          throw new TypeError('Argument must be a number')
        }
        return Buffer(size)
      }

      SafeBuffer.allocUnsafeSlow = function (size) {
        if (typeof size !== 'number') {
          throw new TypeError('Argument must be a number')
        }
        return buffer.SlowBuffer(size)
      }

    }, { "buffer": 5 }], 71: [function (require, module, exports) {
      var varint = require('varint')
      exports.encode = function encode(v, b, o) {
        v = v >= 0 ? v * 2 : v * -2 - 1
        var r = varint.encode(v, b, o)
        encode.bytes = varint.encode.bytes
        return r
      }
      exports.decode = function decode(b, o) {
        var v = varint.decode(b, o)
        decode.bytes = varint.decode.bytes
        return v & 1 ? (v + 1) / -2 : v / 2
      }

      exports.encodingLength = function (v) {
        return varint.encodingLength(v >= 0 ? v * 2 : v * -2 - 1)
      }

    }, { "varint": 77 }], 72: [function (require, module, exports) {
      module.exports = shift

      function shift(stream) {
        var rs = stream._readableState
        if (!rs) return null
        return (rs.objectMode || typeof stream._duplexState === 'number') ? stream.read() : stream.read(getStateLength(rs))
      }

      function getStateLength(state) {
        if (state.buffer.length) {
          // Since node 6.3.0 state.buffer is a BufferList not an array
          if (state.buffer.head) {
            return state.buffer.head.data.length
          }

          return state.buffer[0].length
        }

        return state.length
      }

    }, {}], 73: [function (require, module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      'use strict';

      /*<replacement>*/

      var Buffer = require('safe-buffer').Buffer;
      /*</replacement>*/

      var isEncoding = Buffer.isEncoding || function (encoding) {
        encoding = '' + encoding;
        switch (encoding && encoding.toLowerCase()) {
          case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw':
            return true;
          default:
            return false;
        }
      };

      function _normalizeEncoding(enc) {
        if (!enc) return 'utf8';
        var retried;
        while (true) {
          switch (enc) {
            case 'utf8':
            case 'utf-8':
              return 'utf8';
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
              return 'utf16le';
            case 'latin1':
            case 'binary':
              return 'latin1';
            case 'base64':
            case 'ascii':
            case 'hex':
              return enc;
            default:
              if (retried) return; // undefined
              enc = ('' + enc).toLowerCase();
              retried = true;
          }
        }
      };

      // Do not cache `Buffer.isEncoding` when checking encoding names as some
      // modules monkey-patch it to support additional encodings
      function normalizeEncoding(enc) {
        var nenc = _normalizeEncoding(enc);
        if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
        return nenc || enc;
      }

      // StringDecoder provides an interface for efficiently splitting a series of
      // buffers into a series of JS strings without breaking apart multi-byte
      // characters.
      exports.StringDecoder = StringDecoder;
      function StringDecoder(encoding) {
        this.encoding = normalizeEncoding(encoding);
        var nb;
        switch (this.encoding) {
          case 'utf16le':
            this.text = utf16Text;
            this.end = utf16End;
            nb = 4;
            break;
          case 'utf8':
            this.fillLast = utf8FillLast;
            nb = 4;
            break;
          case 'base64':
            this.text = base64Text;
            this.end = base64End;
            nb = 3;
            break;
          default:
            this.write = simpleWrite;
            this.end = simpleEnd;
            return;
        }
        this.lastNeed = 0;
        this.lastTotal = 0;
        this.lastChar = Buffer.allocUnsafe(nb);
      }

      StringDecoder.prototype.write = function (buf) {
        if (buf.length === 0) return '';
        var r;
        var i;
        if (this.lastNeed) {
          r = this.fillLast(buf);
          if (r === undefined) return '';
          i = this.lastNeed;
          this.lastNeed = 0;
        } else {
          i = 0;
        }
        if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
        return r || '';
      };

      StringDecoder.prototype.end = utf8End;

      // Returns only complete characters in a Buffer
      StringDecoder.prototype.text = utf8Text;

      // Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
      StringDecoder.prototype.fillLast = function (buf) {
        if (this.lastNeed <= buf.length) {
          buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
          return this.lastChar.toString(this.encoding, 0, this.lastTotal);
        }
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
        this.lastNeed -= buf.length;
      };

      // Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
      // continuation byte. If an invalid byte is detected, -2 is returned.
      function utf8CheckByte(byte) {
        if (byte <= 0x7F) return 0; else if (byte >> 5 === 0x06) return 2; else if (byte >> 4 === 0x0E) return 3; else if (byte >> 3 === 0x1E) return 4;
        return byte >> 6 === 0x02 ? -1 : -2;
      }

      // Checks at most 3 bytes at the end of a Buffer in order to detect an
      // incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
      // needed to complete the UTF-8 character (if applicable) are returned.
      function utf8CheckIncomplete(self, buf, i) {
        var j = buf.length - 1;
        if (j < i) return 0;
        var nb = utf8CheckByte(buf[j]);
        if (nb >= 0) {
          if (nb > 0) self.lastNeed = nb - 1;
          return nb;
        }
        if (--j < i || nb === -2) return 0;
        nb = utf8CheckByte(buf[j]);
        if (nb >= 0) {
          if (nb > 0) self.lastNeed = nb - 2;
          return nb;
        }
        if (--j < i || nb === -2) return 0;
        nb = utf8CheckByte(buf[j]);
        if (nb >= 0) {
          if (nb > 0) {
            if (nb === 2) nb = 0; else self.lastNeed = nb - 3;
          }
          return nb;
        }
        return 0;
      }

      // Validates as many continuation bytes for a multi-byte UTF-8 character as
      // needed or are available. If we see a non-continuation byte where we expect
      // one, we "replace" the validated continuation bytes we've seen so far with
      // a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
      // behavior. The continuation byte check is included three times in the case
      // where all of the continuation bytes for a character exist in the same buffer.
      // It is also done this way as a slight performance increase instead of using a
      // loop.
      function utf8CheckExtraBytes(self, buf, p) {
        if ((buf[0] & 0xC0) !== 0x80) {
          self.lastNeed = 0;
          return '\ufffd';
        }
        if (self.lastNeed > 1 && buf.length > 1) {
          if ((buf[1] & 0xC0) !== 0x80) {
            self.lastNeed = 1;
            return '\ufffd';
          }
          if (self.lastNeed > 2 && buf.length > 2) {
            if ((buf[2] & 0xC0) !== 0x80) {
              self.lastNeed = 2;
              return '\ufffd';
            }
          }
        }
      }

      // Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
      function utf8FillLast(buf) {
        var p = this.lastTotal - this.lastNeed;
        var r = utf8CheckExtraBytes(this, buf, p);
        if (r !== undefined) return r;
        if (this.lastNeed <= buf.length) {
          buf.copy(this.lastChar, p, 0, this.lastNeed);
          return this.lastChar.toString(this.encoding, 0, this.lastTotal);
        }
        buf.copy(this.lastChar, p, 0, buf.length);
        this.lastNeed -= buf.length;
      }

      // Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
      // partial character, the character's bytes are buffered until the required
      // number of bytes are available.
      function utf8Text(buf, i) {
        var total = utf8CheckIncomplete(this, buf, i);
        if (!this.lastNeed) return buf.toString('utf8', i);
        this.lastTotal = total;
        var end = buf.length - (total - this.lastNeed);
        buf.copy(this.lastChar, 0, end);
        return buf.toString('utf8', i, end);
      }

      // For UTF-8, a replacement character is added when ending on a partial
      // character.
      function utf8End(buf) {
        var r = buf && buf.length ? this.write(buf) : '';
        if (this.lastNeed) return r + '\ufffd';
        return r;
      }

      // UTF-16LE typically needs two bytes per character, but even if we have an even
      // number of bytes available, we need to check if we end on a leading/high
      // surrogate. In that case, we need to wait for the next two bytes in order to
      // decode the last character properly.
      function utf16Text(buf, i) {
        if ((buf.length - i) % 2 === 0) {
          var r = buf.toString('utf16le', i);
          if (r) {
            var c = r.charCodeAt(r.length - 1);
            if (c >= 0xD800 && c <= 0xDBFF) {
              this.lastNeed = 2;
              this.lastTotal = 4;
              this.lastChar[0] = buf[buf.length - 2];
              this.lastChar[1] = buf[buf.length - 1];
              return r.slice(0, -1);
            }
          }
          return r;
        }
        this.lastNeed = 1;
        this.lastTotal = 2;
        this.lastChar[0] = buf[buf.length - 1];
        return buf.toString('utf16le', i, buf.length - 1);
      }

      // For UTF-16LE we do not explicitly append special replacement characters if we
      // end on a partial character, we simply let v8 handle that.
      function utf16End(buf) {
        var r = buf && buf.length ? this.write(buf) : '';
        if (this.lastNeed) {
          var end = this.lastTotal - this.lastNeed;
          return r + this.lastChar.toString('utf16le', 0, end);
        }
        return r;
      }

      function base64Text(buf, i) {
        var n = (buf.length - i) % 3;
        if (n === 0) return buf.toString('base64', i);
        this.lastNeed = 3 - n;
        this.lastTotal = 3;
        if (n === 1) {
          this.lastChar[0] = buf[buf.length - 1];
        } else {
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
        }
        return buf.toString('base64', i, buf.length - n);
      }

      function base64End(buf) {
        var r = buf && buf.length ? this.write(buf) : '';
        if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
        return r;
      }

      // Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
      function simpleWrite(buf) {
        return buf.toString(this.encoding);
      }

      function simpleEnd(buf) {
        return buf && buf.length ? this.write(buf) : '';
      }
    }, { "safe-buffer": 70 }], 74: [function (require, module, exports) {
      (function (global) {
        (function () {

          /**
           * Module exports.
           */

          module.exports = deprecate;

          /**
           * Mark that a method should not be used.
           * Returns a modified function which warns once by default.
           *
           * If `localStorage.noDeprecation = true` is set, then it is a no-op.
           *
           * If `localStorage.throwDeprecation = true` is set, then deprecated functions
           * will throw an Error when invoked.
           *
           * If `localStorage.traceDeprecation = true` is set, then deprecated functions
           * will invoke `console.trace()` instead of `console.error()`.
           *
           * @param {Function} fn - the function to deprecate
           * @param {String} msg - the string to print to the console when `fn` is invoked
           * @returns {Function} a new "deprecated" version of `fn`
           * @api public
           */

          function deprecate(fn, msg) {
            if (config('noDeprecation')) {
              return fn;
            }

            var warned = false;
            function deprecated() {
              if (!warned) {
                if (config('throwDeprecation')) {
                  throw new Error(msg);
                } else if (config('traceDeprecation')) {
                  console.trace(msg);
                } else {
                  console.warn(msg);
                }
                warned = true;
              }
              return fn.apply(this, arguments);
            }

            return deprecated;
          }

          /**
           * Checks `localStorage` for boolean values for the given `name`.
           *
           * @param {String} name
           * @returns {Boolean}
           * @api private
           */

          function config(name) {
            // accessing global.localStorage can trigger a DOMException in sandboxed iframes
            try {
              if (!global.localStorage) return false;
            } catch (_) {
              return false;
            }
            var val = global.localStorage[name];
            if (null == val) return false;
            return String(val).toLowerCase() === 'true';
          }

        }).call(this)
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, {}], 75: [function (require, module, exports) {
      arguments[4][48][0].apply(exports, arguments)
    }, { "dup": 48 }], 76: [function (require, module, exports) {
      arguments[4][49][0].apply(exports, arguments)
    }, { "dup": 49 }], 77: [function (require, module, exports) {
      arguments[4][50][0].apply(exports, arguments)
    }, { "./decode.js": 75, "./encode.js": 76, "./length.js": 78, "dup": 50 }], 78: [function (require, module, exports) {
      arguments[4][51][0].apply(exports, arguments)
    }, { "dup": 51 }], 79: [function (require, module, exports) {
      // Returns a wrapper function that returns a wrapped callback
      // The wrapper function should do some stuff, and return a
      // presumably different callback function.
      // This makes sure that own properties are retained, so that
      // decorations and such are not lost along the way.
      module.exports = wrappy
      function wrappy(fn, cb) {
        if (fn && cb) return wrappy(fn)(cb)

        if (typeof fn !== 'function')
          throw new TypeError('need wrapper function')

        Object.keys(fn).forEach(function (k) {
          wrapper[k] = fn[k]
        })

        return wrapper

        function wrapper() {
          var args = new Array(arguments.length)
          for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i]
          }
          var ret = fn.apply(this, args)
          var cb = args[args.length - 1]
          if (typeof ret === 'function' && ret !== cb) {
            Object.keys(cb).forEach(function (k) {
              ret[k] = cb[k]
            })
          }
          return ret
        }
      }

    }, {}], 80: [function (require, module, exports) {
      var rangeEmitter = require('range-emitter')
      var eos = require('end-of-stream')

      module.exports = server

      function server(db) {
        var emitters = []
        var re = rangeEmitter()
        var reMainStream = re.connect()
        re.subscribe(function (key, type) {
          emitters.forEach(function (e) {
            onChange(e, key, type)
          })
        })

        return {
          session: newSession,
          emitter: re
        }

        function newSession(dbStream, wsStream) {
          function onPut(key) { onChange(re, key, 'put') }
          function onDel(key) { onChange(re, key, 'del') }
          function onBatch(ary) {
            ary.forEach(function (item) {
              onChange(re, item.key, item.type)
            })
          }

          var re = rangeEmitter()
          emitters.push(re)
          var reStream = re.connect()

          db.on('put', onPut)
          db.on('del', onDel)
          db.on('batch', onBatch)

          eos(wsStream, function () {
            db.removeListener('put', onPut)
            db.removeListener('del', onDel)
            db.removeListener('batch', onBatch)
            emitters = emitters.filter(function (e) { return e !== re })
          })

          reStream.on('data', wsStream.write.bind(wsStream))
          dbStream.on('data', wsStream.write.bind(wsStream))

          wsStream.on('data', function (data) {
            dbStream.write(data)
            reStream.write(data)
            reMainStream.write(data)
          })
        }
      }

      function onChange(re, key, type) {
        if (re.subscriptionExists(key)) {
          re.publish(key.toString(), type)
        }
      }

    }, { "end-of-stream": 35, "range-emitter": 59 }]
  }, {}, [31])(31)
});

export default LevelRangeEmitter;
