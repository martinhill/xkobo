// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 171672;
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,48,192,0,0,62,0,0,0,110,0,0,0,90,0,0,0,120,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,64,192,0,0,62,0,0,0,20,0,0,0,90,0,0,0,120,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });
var __ZN8win_cmapC1Ev;
var __ZN8win_cmapD1Ev;
var __ZN11win_backingC1Ev;
var __ZN11win_backingD1Ev;
var __ZN8win_chipC1Ev;
var __ZN8win_chipD1Ev;
/* memory initializer */ allocate([78,97,109,101,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,83,99,111,114,101,32,32,32,32,83,116,97,103,101,115,0,0,0,0,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,91,45,119,97,105,116,32,88,88,88,93,0,0,0,0,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,91,45,100,105,115,112,108,97,121,93,0,32,32,32,32,32,32,32,32,32,32,32,32,32,91,45,99,104,101,97,116,93,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,91,45,102,105,116,93,0,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,91,45,102,97,115,116,93,0,0,0,0,32,32,32,32,32,32,32,120,107,111,98,111,32,91,45,100,111,117,98,108,101,115,105,122,101,93,0,0,0,0,0,0,85,115,97,103,101,58,32,120,107,111,98,111,32,45,104,105,115,99,111,114,101,115,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,128,0,0,0,144,186,0,0,16,0,0,0,1,0,0,0,80,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,48,0,0,0,64,0,0,0,4,0,0,0,4,0,0,0,24,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,64,0,0,0,144,186,0,0,64,0,0,0,3,0,0,0,80,185,0,0,10,0,0,0,5,0,0,0,80,185,0,0,10,0,0,0,5,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,16,0,0,0,48,0,0,0,6,0,0,0,6,0,0,0,48,0,0,0,48,0,0,0,6,0,0,0,6,0,0,0,16,0,0,0,64,0,0,0,6,0,0,0,6,0,0,0,48,0,0,0,64,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,32,0,0,0,64,0,0,0,144,186,0,0,64,0,0,0,144,186,0,0,16,0,0,0,1,0,0,0,112,183,0,0,20,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,16,0,0,0,40,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,60,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,40,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,60,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,32,0,0,0,144,186,0,0,8,0,0,0,1,0,0,0,80,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,14,0,0,0,55,0,0,0,6,0,0,0,6,0,0,0,55,0,0,0,14,0,0,0,6,0,0,0,6,0,0,0,35,0,0,0,70,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,128,0,0,0,144,186,0,0,128,0,0,0,3,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,80,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,32,0,0,0,32,0,0,0,6,0,0,0,6,0,0,0,32,0,0,0,64,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,200,185,0,0,32,0,0,0,200,185,0,0,8,0,0,0,0,0,0,0,200,185,0,0,40,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,64,0,0,0,8,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,152,183,0,0,64,0,0,0,200,185,0,0,32,0,0,0,2,0,0,0,120,185,0,0,30,0,0,0,5,0,0,0,0,185,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,32,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,80,185,0,0,64,0,0,0,200,185,0,0,8,0,0,0,3,0,0,0,152,183,0,0,20,0,0,0,5,0,0,0,152,183,0,0,20,0,0,0,5,0,0,0,152,183,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,48,0,0,0,64,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,64,0,0,0,4,0,0,0,4,0,0,0,32,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,32,0,0,0,48,0,0,0,4,0,0,0,4,0,0,0,44,0,0,0,76,0,0,0,4,0,0,0,4,0,0,0,20,0,0,0,76,0,0,0,4,0,0,0,4,0,0,0,44,0,0,0,52,0,0,0,4,0,0,0,4,0,0,0,20,0,0,0,52,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,16,0,0,0,144,186,0,0,8,0,0,0,1,0,0,0,64,186,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,32,0,0,0,7,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,104,186,0,0,128,0,0,0,104,186,0,0,4,0,0,0,1,0,0,0,112,183,0,0,100,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,64,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,160,185,0,0,128,0,0,0,200,185,0,0,32,0,0,0,5,0,0,0,112,183,0,0,30,0,0,0,5,0,0,0,120,185,0,0,50,0,0,0,5,0,0,0,0,185,0,0,20,0,0,0,5,0,0,0,216,184,0,0,10,0,0,0,5,0,0,0,104,186,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,5,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,15,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,25,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,35,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,45,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,55,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0].concat([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,0,0,0,33,0,0,0,144,186,0,0,128,0,0,0,144,186,0,0,16,0,0,0,3,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,112,183,0,0,100,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,88,0,0,0,12,0,0,0,12,0,0,0,21,0,0,0,20,0,0,0,12,0,0,0,12,0,0,0,50,0,0,0,70,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,64,186,0,0,128,0,0,0,200,185,0,0,32,0,0,0,2,0,0,0,104,186,0,0,30,0,0,0,5,0,0,0,104,186,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,24,0,0,0,66,0,0,0,3,0,0,0,3,0,0,0,23,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,44,0,0,0,50,0,0,0,3,0,0,0,3,0,0,0,39,0,0,0,102,0,0,0,3,0,0,0,3,0,0,0,15,0,0,0,43,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,107,0,0,0,160,185,0,0,128,0,0,0,144,186,0,0,8,0,0,0,4,0,0,0,120,185,0,0,10,0,0,0,5,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,112,183,0,0,100,0,0,0,5,0,0,0,160,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,9,0,0,0,36,0,0,0,5,0,0,0,5,0,0,0,44,0,0,0,19,0,0,0,5,0,0,0,5,0,0,0,46,0,0,0,79,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,0,0,0,94,0,0,0,80,185,0,0,64,0,0,0,104,186,0,0,32,0,0,0,2,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,16,0,0,0,54,0,0,0,4,0,0,0,4,0,0,0,47,0,0,0,56,0,0,0,4,0,0,0,4,0,0,0,24,0,0,0,70,0,0,0,4,0,0,0,4,0,0,0,31,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,27,0,0,0,31,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,37,0,0,0,0,185,0,0,64,0,0,0,0,185,0,0,8,0,0,0,3,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,120,185,0,0,10,0,0,0,5,0,0,0,112,183,0,0,100,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,41,0,0,0,84,0,0,0,6,0,0,0,10,0,0,0,12,0,0,0,115,0,0,0,6,0,0,0,5,0,0,0,22,0,0,0,92,0,0,0,6,0,0,0,10,0,0,0,11,0,0,0,26,0,0,0,8,0,0,0,8,0,0,0,51,0,0,0,65,0,0,0,9,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,53,0,0,0,17,0,0,0,144,186,0,0,32,0,0,0,200,185,0,0,32,0,0,0,1,0,0,0,120,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,14,0,0,0,99,0,0,0,6,0,0,0,6,0,0,0,37,0,0,0,18,0,0,0,6,0,0,0,6,0,0,0,13,0,0,0,67,0,0,0,6,0,0,0,6,0,0,0,19,0,0,0,46,0,0,0,6,0,0,0,6,0,0,0,41,0,0,0,59,0,0,0,6,0,0,0,6,0,0,0,39,0,0,0,97,0,0,0,6,0,0,0,6,0,0,0,47,0,0,0,32,0,0,0,6,0,0,0,6,0,0,0,56,0,0,0,100,0,0,0,6,0,0,0,6,0,0,0,19,0,0,0,25,0,0,0,6,0,0,0,6,0,0,0,54,0,0,0,76,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,80,0,0,0,200,185,0,0,32,0,0,0,152,183,0,0,8,0,0,0,4,0,0,0,112,183,0,0,40,0,0,0,2,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,112,183,0,0,40,0,0,0,5,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,27,0,0,0,104,0,0,0,5,0,0,0,5,0,0,0,49,0,0,0,105,0,0,0,5,0,0,0,5,0,0,0,32,0,0,0,90,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,152,183,0,0,128,0,0,0,200,185,0,0,8,0,0,0,0,0,0,0,200,185,0,0,30,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,32,0,0,0,91,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,89,0,0,0,3,0,0,0,3,0,0,0,51,0,0,0,83,0,0,0,3,0,0,0,3,0,0,0,57,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,59,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,57,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,51,0,0,0,45,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,39,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,37,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,39,0,0,0,3,0,0,0,3,0,0,0,13,0,0,0,45,0,0,0,3,0,0,0,3,0,0,0,7,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,5,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,7,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,13,0,0,0,83,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,89,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,84,0,0,0,216,184,0,0,128,0,0,0,40,185,0,0,16,0,0,0,0,0,0,0,64,186,0,0,30,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,37,0,0,0,82,0,0,0,6,0,0,0,6,0,0,0,13,0,0,0,99,0,0,0,6,0,0,0,6,0,0,0,30,0,0,0,44,0,0,0,6,0,0,0,6,0,0,0,19,0,0,0,14,0,0,0,6,0,0,0,6,0,0,0,55,0,0,0,85,0,0,0,6,0,0,0,6,0,0,0,23,0,0,0,69,0,0,0,6,0,0,0,6,0,0,0,16,0,0,0,35,0,0,0,6,0,0,0,6,0,0,0,11,0,0,0,52,0,0,0,6,0,0,0,6,0,0,0,36,0,0,0,116,0,0,0,6,0,0,0,6,0,0,0,39,0,0,0,97,0,0,0,6,0,0,0,6,0,0,0,50,0,0,0,114,0,0,0,6,0,0,0,6,0,0,0,39,0,0,0,22,0,0,0,6,0,0,0,6,0,0,0,55,0,0,0,43,0,0,0,6,0,0,0,6,0,0,0,52,0,0,0,71,0,0,0,6,0,0,0,6,0,0,0,56,0,0,0,100,0,0,0,6,0,0,0,6,0,0,0,54,0,0,0,25,0,0,0,6,0,0,0,6,0,0,0,51,0,0,0,57,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,115,0,0,0,6,0,0,0,6,0,0,0,47,0,0,0,8,0,0,0,6,0,0,0,6,0,0,0,8,0,0,0,70,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,30,0,0,0,200,185,0,0,128,0,0,0,144,186,0,0,16,0,0,0,2,0,0,0,120,185,0,0,20,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,27,0,0,0,79,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,105,0,0,0,5,0,0,0,5,0,0,0,11,0,0,0,50,0,0,0,5,0,0,0,5,0,0,0,11,0,0,0,23,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,57,0,0,0,5,0,0,0,5,0,0,0,7,0,0,0,70,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,0,0,0,120,0,0,0,152,183,0,0,128,0,0,0,144,186,0,0,16,0,0,0,6,0,0,0,152,183,0,0,10,0,0,0,5,0,0,0,152,183,0,0,10,0,0,0,5,0,0,0,152,183,0,0,10,0,0,0,5,0,0,0,152,183,0,0,10,0,0,0,5,0,0,0,152,183,0,0,10,0,0,0,5,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,30,0,0,0,55,0,0,0,25,0,0,0,4,0,0,0,4,0,0,0,49,0,0,0,12,0,0,0,4,0,0,0,4,0,0,0,30,0,0,0,84,0,0,0,4,0,0,0,4,0,0,0,33,0,0,0,97,0,0,0,4,0,0,0,4,0,0,0,24,0,0,0,21,0,0,0,4,0,0,0,4,0,0,0,28,0,0,0,52,0,0,0,4,0,0,0,4,0,0,0,50,0,0,0,117,0,0,0,4,0,0,0,4,0,0,0,22,0,0,0,95,0,0,0,4,0,0,0,4,0,0,0,46,0,0,0,56,0,0,0,4,0,0,0,4,0,0,0,36,0,0,0,10,0,0,0,4,0,0,0,4,0,0,0,15,0,0,0,77,0,0,0,4,0,0,0,4,0,0,0,32,0,0,0,74,0,0,0,4,0,0,0,4,0,0,0,7,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,13,0,0,0,107,0,0,0,4,0,0,0,4,0,0,0,6,0,0,0,51,0,0,0,4,0,0,0,4,0,0,0,11,0,0,0,62,0,0,0,4,0,0,0,4,0,0,0,57,0,0,0,76,0,0,0,4,0,0,0,4,0,0,0,57,0,0,0,95,0,0,0,4,0,0,0,4,0,0,0,11,0,0,0,90,0,0,0,4,0,0,0,4,0,0,0,46,0,0,0,93,0,0,0,4,0,0,0,4,0,0,0,34,0,0,0,27,0,0,0,4,0,0,0,4,0,0,0,58,0,0,0,56,0,0,0,4,0,0,0,4,0,0,0,40,0,0,0,45,0,0,0,4,0,0,0,4,0,0,0,10,0,0,0,31,0,0,0,4,0,0,0,4,0,0,0,44,0,0,0,35,0,0,0,4,0,0,0,4,0,0,0,25,0,0,0,122,0,0,0,4,0,0,0,4,0,0,0,24,0,0,0,62,0,0,0,4,0,0,0,4,0,0,0,51,0,0,0,107,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,50,0,0,0,4,0,0,0,4,0,0,0,25,0,0,0,110,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,92,0,0,0,104,186,0,0,64,0,0,0,104,186,0,0,32,0,0,0,4,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,160,185,0,0,10,0,0,0,5,0,0,0,216,184,0,0,10,0,0,0,5,0,0,0,0,185,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
.concat([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,40,0,0,0,95,0,0,0,15,0,0,0,15,0,0,0,44,0,0,0,28,0,0,0,13,0,0,0,18,0,0,0,15,0,0,0,16,0,0,0,12,0,0,0,15,0,0,0,14,0,0,0,50,0,0,0,13,0,0,0,12,0,0,0,49,0,0,0,62,0,0,0,12,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,0,0,0,32,0,0,0,41,0,0,0,200,185,0,0,128,0,0,0,144,186,0,0,16,0,0,0,3,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,160,185,0,0,20,0,0,0,5,0,0,0,64,186,0,0,30,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,38,0,0,0,73,0,0,0,4,0,0,0,4,0,0,0,27,0,0,0,98,0,0,0,4,0,0,0,4,0,0,0,27,0,0,0,71,0,0,0,4,0,0,0,4,0,0,0,56,0,0,0,89,0,0,0,4,0,0,0,4,0,0,0,39,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,12,0,0,0,67,0,0,0,4,0,0,0,4,0,0,0,58,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,14,0,0,0,21,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,32,0,0,0,96,0,0,0,144,186,0,0,32,0,0,0,200,185,0,0,32,0,0,0,2,0,0,0,0,185,0,0,50,0,0,0,5,0,0,0,112,183,0,0,100,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,25,0,0,0,53,0,0,0,7,0,0,0,6,0,0,0,40,0,0,0,70,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,152,183,0,0,64,0,0,0,152,183,0,0,16,0,0,0,0,0,0,0,200,185,0,0,40,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,8,0,0,0,8,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,8,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,8,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,8,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,24,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,24,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,24,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,24,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,40,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,40,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,40,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,40,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,56,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,56,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,56,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,56,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,72,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,72,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,72,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,72,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,88,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,88,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,88,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,88,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,104,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,104,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,104,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,104,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,120,0,0,0,5,0,0,0,5,0,0,0,24,0,0,0,120,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,120,0,0,0,5,0,0,0,5,0,0,0,56,0,0,0,120,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,144,186,0,0,32,0,0,0,40,185,0,0,32,0,0,0,3,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,104,186,0,0,50,0,0,0,5,0,0,0,136,184,0,0,1,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,49,0,0,0,64,0,0,0,6,0,0,0,10,0,0,0,40,0,0,0,40,0,0,0,11,0,0,0,4,0,0,0,36,0,0,0,95,0,0,0,13,0,0,0,4,0,0,0,13,0,0,0,74,0,0,0,8,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,45,0,0,0,107,0,0,0,200,185,0,0,32,0,0,0,40,185,0,0,16,0,0,0,1,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,15,0,0,0,108,0,0,0,11,0,0,0,18,0,0,0,13,0,0,0,62,0,0,0,12,0,0,0,19,0,0,0,46,0,0,0,42,0,0,0,11,0,0,0,41,0,0,0,16,0,0,0,23,0,0,0,13,0,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,60,0,0,0,160,185,0,0,128,0,0,0,144,186,0,0,4,0,0,0,5,0,0,0,40,185,0,0,20,0,0,0,5,0,0,0,64,186,0,0,10,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,216,184,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,40,0,0,0,46,0,0,0,13,0,0,0,9,0,0,0,20,0,0,0,74,0,0,0,12,0,0,0,8,0,0,0,24,0,0,0,106,0,0,0,11,0,0,0,6,0,0,0,29,0,0,0,120,0,0,0,14,0,0,0,6,0,0,0,54,0,0,0,90,0,0,0,5,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,0,0,0,71,0,0,0,40,185,0,0,64,0,0,0,144,186,0,0,16,0,0,0,3,0,0,0,0,185,0,0,2,0,0,0,5,0,0,0,0,185,0,0,2,0,0,0,5,0,0,0,56,184,0,0,1,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,38,0,0,0,120,0,0,0,5,0,0,0,5,0,0,0,43,0,0,0,64,0,0,0,5,0,0,0,5,0,0,0,32,0,0,0,106,0,0,0,5,0,0,0,5,0,0,0,14,0,0,0,52,0,0,0,5,0,0,0,5,0,0,0,48,0,0,0,76,0,0,0,5,0,0,0,5,0,0,0,9,0,0,0,110,0,0,0,5,0,0,0,5,0,0,0,12,0,0,0,34,0,0,0,5,0,0,0,5,0,0,0,40,0,0,0,90,0,0,0,5,0,0,0,5,0,0,0,38,0,0,0,33,0,0,0,5,0,0,0,5,0,0,0,23,0,0,0,9,0,0,0,5,0,0,0,5,0,0,0,22,0,0,0,120,0,0,0,5,0,0,0,5,0,0,0,9,0,0,0,90,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,15,0,0,0,5,0,0,0,5,0,0,0,41,0,0,0,46,0,0,0,5,0,0,0,5,0,0,0,43,0,0,0,13,0,0,0,5,0,0,0,5,0,0,0,25,0,0,0,88,0,0,0,5,0,0,0,5,0,0,0,8,0,0,0,65,0,0,0,5,0,0,0,5,0,0,0,57,0,0,0,49,0,0,0,5,0,0,0,5,0,0,0,52,0,0,0,108,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,77,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,120,0,0,0,152,183,0,0,64,0,0,0,152,183,0,0,8,0,0,0,0,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,24,0,0,0,8,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,24,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,40,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,56,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,72,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,88,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,104,0,0,0,6,0,0,0,6,0,0,0,24,0,0,0,120,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,8,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,24,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,40,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,56,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,72,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,88,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,104,0,0,0,6,0,0,0,6,0,0,0,40,0,0,0,120,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,128,0,0,0,144,186,0,0,16,0,0,0,0,0,0,0,200,185,0,0,40,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,64,0,0,0,24,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,113,0,0,0,80,185,0,0,32,0,0,0,80,185,0,0,16,0,0,0,5,0,0,0,40,185,0,0,30,0,0,0,5,0,0,0,104,186,0,0,50,0,0,0,5,0,0,0,136,184,0,0,1,0,0,0,5,0,0,0,160,185,0,0,20,0,0,0,5,0,0,0,112,183,0,0,100,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,17,0,0,0,70,0,0,0,13,0,0,0,21,0,0,0,46,0,0,0,32,0,0,0,10,0,0,0,10,0,0,0,49,0,0,0,63,0,0,0,10,0,0,0,11,0,0,0,18,0,0,0,25,0,0,0,14,0,0,0,21,0,0,0,45,0,0,0,109,0,0,0,10,0,0,0,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,120,0,0,0,0,185,0,0,64,0,0,0,144,186,0,0,16,0,0,0,1,0,0,0,64,186,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
.concat([0,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,8,0,0,0,87,0,0,0,6,0,0,0,15,0,0,0,26,0,0,0,72,0,0,0,9,0,0,0,12,0,0,0,37,0,0,0,110,0,0,0,9,0,0,0,6,0,0,0,36,0,0,0,31,0,0,0,16,0,0,0,5,0,0,0,32,0,0,0,11,0,0,0,17,0,0,0,9,0,0,0,46,0,0,0,51,0,0,0,6,0,0,0,12,0,0,0,54,0,0,0,96,0,0,0,5,0,0,0,10,0,0,0,12,0,0,0,39,0,0,0,5,0,0,0,11,0,0,0,13,0,0,0,116,0,0,0,9,0,0,0,9,0,0,0,40,0,0,0,93,0,0,0,7,0,0,0,6,0,0,0,7,0,0,0,64,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,10,0,0,0,5,0,0,0,8,0,0,0,47,0,0,0,77,0,0,0,8,0,0,0,5,0,0,0,28,0,0,0,46,0,0,0,5,0,0,0,6,0,0,0,56,0,0,0,14,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,120,185,0,0,128,0,0,0,152,183,0,0,32,0,0,0,8,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,64,186,0,0,10,0,0,0,5,0,0,0,160,185,0,0,10,0,0,0,5,0,0,0,136,184,0,0,1,0,0,0,5,0,0,0,80,185,0,0,10,0,0,0,5,0,0,0,40,185,0,0,10,0,0,0,5,0,0,0,216,184,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,32,0,0,0,48,0,0,0,7,0,0,0,7,0,0,0,48,0,0,0,48,0,0,0,7,0,0,0,7,0,0,0,48,0,0,0,64,0,0,0,7,0,0,0,7,0,0,0,48,0,0,0,80,0,0,0,7,0,0,0,7,0,0,0,32,0,0,0,80,0,0,0,7,0,0,0,7,0,0,0,16,0,0,0,80,0,0,0,7,0,0,0,7,0,0,0,16,0,0,0,64,0,0,0,7,0,0,0,7,0,0,0,16,0,0,0,48,0,0,0,7,0,0,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,144,186,0,0,16,0,0,0,160,185,0,0,64,0,0,0,5,0,0,0,200,185,0,0,10,0,0,0,10,0,0,0,160,185,0,0,10,0,0,0,10,0,0,0,64,186,0,0,10,0,0,0,10,0,0,0,176,184,0,0,1,0,0,0,10,0,0,0,136,184,0,0,1,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,16,0,0,0,20,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,40,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,60,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,100,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,20,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,40,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,60,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,48,0,0,0,100,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,32,0,0,0,96,0,0,0,144,186,0,0,64,0,0,0,152,183,0,0,64,0,0,0,0,0,0,0,152,183,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,58,0,0,0,18,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,72,0,0,0,152,183,0,0,64,0,0,0,104,186,0,0,4,0,0,0,1,0,0,0,112,183,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,16,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,24,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,40,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,48,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,16,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,24,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,40,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,48,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,16,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,24,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,40,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,48,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,16,0,0,0,96,0,0,0,3,0,0,0,3,0,0,0,24,0,0,0,96,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,96,0,0,0,3,0,0,0,3,0,0,0,40,0,0,0,96,0,0,0,3,0,0,0,3,0,0,0,48,0,0,0,96,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,50,0,0,0,40,185,0,0,32,0,0,0,160,185,0,0,16,0,0,0,6,0,0,0,136,184,0,0,1,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,112,183,0,0,50,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,34,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,16,0,0,0,22,0,0,0,4,0,0,0,4,0,0,0,6,0,0,0,35,0,0,0,4,0,0,0,4,0,0,0,22,0,0,0,38,0,0,0,4,0,0,0,4,0,0,0,45,0,0,0,40,0,0,0,4,0,0,0,4,0,0,0,6,0,0,0,52,0,0,0,4,0,0,0,4,0,0,0,46,0,0,0,66,0,0,0,4,0,0,0,4,0,0,0,30,0,0,0,70,0,0,0,4,0,0,0,4,0,0,0,15,0,0,0,90,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,0,0,0,11,0,0,0,104,186,0,0,128,0,0,0,200,185,0,0,16,0,0,0,1,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,0,0,0,12,0,0,0,48,0,0,0,9,0,0,0,9,0,0,0,14,0,0,0,80,0,0,0,6,0,0,0,5,0,0,0,42,0,0,0,14,0,0,0,7,0,0,0,3,0,0,0,52,0,0,0,112,0,0,0,4,0,0,0,9,0,0,0,33,0,0,0,103,0,0,0,5,0,0,0,6,0,0,0,17,0,0,0,12,0,0,0,4,0,0,0,3,0,0,0,49,0,0,0,78,0,0,0,5,0,0,0,4,0,0,0,49,0,0,0,50,0,0,0,4,0,0,0,5,0,0,0,19,0,0,0,32,0,0,0,5,0,0,0,5,0,0,0,32,0,0,0,77,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,113,0,0,0,4,0,0,0,9,0,0,0,36,0,0,0,38,0,0,0,7,0,0,0,6,0,0,0,50,0,0,0,96,0,0,0,8,0,0,0,3,0,0,0,57,0,0,0,7,0,0,0,3,0,0,0,5,0,0,0,53,0,0,0,34,0,0,0,5,0,0,0,7,0,0,0,11,0,0,0,94,0,0,0,5,0,0,0,3,0,0,0,27,0,0,0,63,0,0,0,3,0,0,0,6,0,0,0,44,0,0,0,4,0,0,0,3,0,0,0,3,0,0,0,48,0,0,0,63,0,0,0,5,0,0,0,6,0,0,0,37,0,0,0,51,0,0,0,6,0,0,0,3,0,0,0,28,0,0,0,116,0,0,0,3,0,0,0,3,0,0,0,8,0,0,0,31,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,18,0,0,0,3,0,0,0,3,0,0,0,13,0,0,0,69,0,0,0,6,0,0,0,4,0,0,0,21,0,0,0,96,0,0,0,3,0,0,0,3,0,0,0,36,0,0,0,114,0,0,0,3,0,0,0,3,0,0,0,55,0,0,0,87,0,0,0,5,0,0,0,3,0,0,0,58,0,0,0,63,0,0,0,3,0,0,0,7,0,0,0,35,0,0,0,87,0,0,0,4,0,0,0,4,0,0,0,35,0,0,0,25,0,0,0,3,0,0,0,4,0,0,0,20,0,0,0,107,0,0,0,3,0,0,0,5,0,0,0,13,0,0,0,4,0,0,0,3,0,0,0,3,0,0,0,23,0,0,0,21,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,8,0,0,0,3,0,0,0,5,0,0,0,47,0,0,0,22,0,0,0,7,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,96,0,0,0,144,186,0,0,64,0,0,0,144,186,0,0,16,0,0,0,1,0,0,0,64,186,0,0,40,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,64,0,0,0,18,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,54,0,0,0,46,0,0,0,216,184,0,0,64,0,0,0,40,185,0,0,32,0,0,0,3,0,0,0,64,186,0,0,10,0,0,0,5,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,0,185,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,8,0,0,0,106,0,0,0,5,0,0,0,8,0,0,0,7,0,0,0,32,0,0,0,5,0,0,0,13,0,0,0,39,0,0,0,83,0,0,0,9,0,0,0,7,0,0,0,54,0,0,0,63,0,0,0,8,0,0,0,9,0,0,0,28,0,0,0,20,0,0,0,6,0,0,0,13,0,0,0,16,0,0,0,61,0,0,0,14,0,0,0,10,0,0,0,55,0,0,0,25,0,0,0,6,0,0,0,13,0,0,0,53,0,0,0,106,0,0,0,8,0,0,0,7,0,0,0,38,0,0,0,115,0,0,0,5,0,0,0,7,0,0,0,22,0,0,0,109,0,0,0,7,0,0,0,14,0,0,0,12,0,0,0,82,0,0,0,7,0,0,0,8,0,0,0,39,0,0,0,51,0,0,0,5,0,0,0,5,0,0,0,57,0,0,0,89,0,0,0,5,0,0,0,7,0,0,0,41,0,0,0,21,0,0,0,5,0,0,0,7,0,0,0,10,0,0,0,10,0,0,0,9,0,0,0,6,0,0,0,20,0,0,0,41,0,0,0,5,0,0,0,5,0,0,0,38,0,0,0,66,0,0,0,5,0,0,0,5,0,0,0,54,0,0,0,121,0,0,0,7,0,0,0,5,0,0,0,37,0,0,0,100,0,0,0,5,0,0,0,6,0,0,0,41,0,0,0,7,0,0,0,5,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,107,0,0,0,160,185,0,0,64,0,0,0,104,186,0,0,8,0,0,0,7,0,0,0,80,185,0,0,20,0,0,0,5,0,0,0,64,186,0,0,30,0,0,0,5,0,0,0,160,185,0,0,20,0,0,0,5,0,0,0,0,185,0,0,20,0,0,0,5,0,0,0,64,186,0,0,30,0,0,0,5,0,0,0,216,184,0,0,30,0,0,0,5,0,0,0,96,184,0,0,1,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,49,0,0,0,38,0,0,0,8,0,0,0,14,0,0,0,20,0,0,0,86,0,0,0,5,0,0,0,10,0,0,0,19,0,0,0,28,0,0,0,14,0,0,0,16,0,0,0,19,0,0,0,57,0,0,0,17,0,0,0,8,0,0,0,48,0,0,0,86,0,0,0,8,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,64,0,0,0,160,185,0,0,64,0,0,0,152,183,0,0,8,0,0,0,4,0,0,0,64,186,0,0,20,0,0,0,7,0,0,0,112,183,0,0,20,0,0,0,8,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,112,183,0,0,20,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,46,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,18,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,79,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,43,0,0,0,75,0,0,0,3,0,0,0,3,0,0,0,21,0,0,0,75,0,0,0,3,0,0,0,3,0,0,0,43,0,0,0,53,0,0,0,3,0,0,0,3,0,0,0,21,0,0,0,53,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,91,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,89,0,0,0,3,0,0,0,3,0,0,0,51,0,0,0,83,0,0,0,3,0,0,0,3,0,0,0,57,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,59,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,57,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,51,0,0,0,45,0,0,0,3,0,0,0,3,0,0,0,42,0,0,0,39,0,0,0,3,0,0,0,3,0,0,0,32,0,0,0,37,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,39,0,0,0,3,0,0,0,3,0,0,0,13,0,0,0,45,0,0,0,3,0,0,0,3,0,0,0,7,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,5,0,0,0,64,0,0,0,3,0,0,0,3,0,0,0,7,0,0,0,74,0,0,0,3,0,0,0,3,0,0,0,13,0,0,0,83,0,0,0,3,0,0,0,3,0,0,0,22,0,0,0,89,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,87,0,0,0,104,186,0,0,64,0,0,0,152,183,0,0,16,0,0,0,1,0,0,0,64,186,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,18,0,0,0,66,0,0,0,15,0,0,0,15,0,0,0,52,0,0,0,59,0,0,0,7,0,0,0,54,0,0,0,31,0,0,0,101,0,0,0,8,0,0,0,7,0,0,0,39,0,0,0,41,0,0,0,4,0,0,0,30,0,0,0,9,0,0,0,97,0,0,0,7,0,0,0,13,0,0,0,21,0,0,0,44,0,0,0,11,0,0,0,5,0,0,0,25,0,0,0,118,0,0,0,5,0,0,0,5,0,0,0,20,0,0,0,16,0,0,0,8,0,0,0,14,0,0,0,42,0,0,0,122,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0])
.concat([16,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,59,0,0,0,34,0,0,0,144,186,0,0,64,0,0,0,144,186,0,0,16,0,0,0,4,0,0,0,112,183,0,0,15,0,0,0,5,0,0,0,96,184,0,0,1,0,0,0,5,0,0,0,112,183,0,0,15,0,0,0,5,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,0,0,0,46,0,0,0,19,0,0,0,9,0,0,0,10,0,0,0,45,0,0,0,115,0,0,0,10,0,0,0,4,0,0,0,14,0,0,0,60,0,0,0,5,0,0,0,8,0,0,0,48,0,0,0,60,0,0,0,5,0,0,0,10,0,0,0,21,0,0,0,45,0,0,0,8,0,0,0,5,0,0,0,11,0,0,0,83,0,0,0,5,0,0,0,13,0,0,0,39,0,0,0,97,0,0,0,13,0,0,0,8,0,0,0,36,0,0,0,49,0,0,0,4,0,0,0,3,0,0,0,18,0,0,0,8,0,0,0,5,0,0,0,4,0,0,0,40,0,0,0,80,0,0,0,9,0,0,0,5,0,0,0,54,0,0,0,44,0,0,0,8,0,0,0,4,0,0,0,13,0,0,0,27,0,0,0,9,0,0,0,3,0,0,0,15,0,0,0,110,0,0,0,3,0,0,0,5,0,0,0,9,0,0,0,122,0,0,0,5,0,0,0,4,0,0,0,28,0,0,0,63,0,0,0,6,0,0,0,6,0,0,0,35,0,0,0,39,0,0,0,3,0,0,0,3,0,0,0,6,0,0,0,5,0,0,0,5,0,0,0,3,0,0,0,6,0,0,0,113,0,0,0,4,0,0,0,3,0,0,0,6,0,0,0,40,0,0,0,4,0,0,0,5,0,0,0,29,0,0,0,116,0,0,0,3,0,0,0,9,0,0,0,29,0,0,0,9,0,0,0,4,0,0,0,4,0,0,0,59,0,0,0,65,0,0,0,3,0,0,0,10,0,0,0,21,0,0,0,86,0,0,0,3,0,0,0,7,0,0,0,4,0,0,0,60,0,0,0,3,0,0,0,6,0,0,0,6,0,0,0,18,0,0,0,5,0,0,0,4,0,0,0,29,0,0,0,22,0,0,0,5,0,0,0,6,0,0,0,52,0,0,0,4,0,0,0,10,0,0,0,3,0,0,0,18,0,0,0,19,0,0,0,4,0,0,0,3,0,0,0,46,0,0,0,34,0,0,0,5,0,0,0,3,0,0,0,57,0,0,0,91,0,0,0,3,0,0,0,4,0,0,0,59,0,0,0,103,0,0,0,3,0,0,0,6,0,0,0,25,0,0,0,35,0,0,0,4,0,0,0,3,0,0,0,19,0,0,0,122,0,0,0,3,0,0,0,4,0,0,0,54,0,0,0,80,0,0,0,3,0,0,0,3,0,0,0,5,0,0,0,101,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,31,0,0,0,40,185,0,0,64,0,0,0,152,183,0,0,32,0,0,0,5,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,216,184,0,0,10,0,0,0,5,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,216,184,0,0,10,0,0,0,5,0,0,0,64,186,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,0,0,0,29,0,0,0,37,0,0,0,19,0,0,0,2,0,0,0,24,0,0,0,109,0,0,0,3,0,0,0,11,0,0,0,7,0,0,0,62,0,0,0,3,0,0,0,4,0,0,0,47,0,0,0,92,0,0,0,2,0,0,0,4,0,0,0,50,0,0,0,112,0,0,0,7,0,0,0,12,0,0,0,54,0,0,0,22,0,0,0,8,0,0,0,10,0,0,0,35,0,0,0,104,0,0,0,5,0,0,0,7,0,0,0,32,0,0,0,69,0,0,0,9,0,0,0,5,0,0,0,27,0,0,0,46,0,0,0,17,0,0,0,5,0,0,0,32,0,0,0,14,0,0,0,9,0,0,0,10,0,0,0,12,0,0,0,28,0,0,0,8,0,0,0,4,0,0,0,5,0,0,0,94,0,0,0,4,0,0,0,18,0,0,0,46,0,0,0,57,0,0,0,7,0,0,0,2,0,0,0,46,0,0,0,83,0,0,0,11,0,0,0,3,0,0,0,58,0,0,0,76,0,0,0,4,0,0,0,2,0,0,0,56,0,0,0,94,0,0,0,4,0,0,0,4,0,0,0,59,0,0,0,63,0,0,0,2,0,0,0,3,0,0,0,16,0,0,0,120,0,0,0,3,0,0,0,4,0,0,0,14,0,0,0,75,0,0,0,2,0,0,0,11,0,0,0,17,0,0,0,18,0,0,0,2,0,0,0,2,0,0,0,7,0,0,0,6,0,0,0,6,0,0,0,4,0,0,0,37,0,0,0,28,0,0,0,6,0,0,0,2,0,0,0,6,0,0,0,47,0,0,0,2,0,0,0,3,0,0,0,50,0,0,0,72,0,0,0,2,0,0,0,2,0,0,0,57,0,0,0,44,0,0,0,2,0,0,0,9,0,0,0,18,0,0,0,8,0,0,0,2,0,0,0,6,0,0,0,46,0,0,0,8,0,0,0,2,0,0,0,2,0,0,0,25,0,0,0,90,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,37,0,0,0,3,0,0,0,3,0,0,0,17,0,0,0,98,0,0,0,2,0,0,0,2,0,0,0,27,0,0,0,58,0,0,0,9,0,0,0,2,0,0,0,27,0,0,0,81,0,0,0,5,0,0,0,3,0,0,0,57,0,0,0,7,0,0,0,5,0,0,0,2,0,0,0,7,0,0,0,120,0,0,0,2,0,0,0,6,0,0,0,36,0,0,0,92,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,19,0,0,0,92,0,0,0,200,185,0,0,64,0,0,0,160,185,0,0,128,0,0,0,3,0,0,0,200,185,0,0,10,0,0,0,5,0,0,0,64,186,0,0,10,0,0,0,5,0,0,0,112,183,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,0,0,0,16,0,0,0,54,0,0,0,3,0,0,0,3,0,0,0,47,0,0,0,56,0,0,0,3,0,0,0,4,0,0,0,24,0,0,0,70,0,0,0,4,0,0,0,3,0,0,0,31,0,0,0,14,0,0,0,3,0,0,0,3,0,0,0,27,0,0,0,31,0,0,0,4,0,0,0,3,0,0,0,36,0,0,0,94,0,0,0,4,0,0,0,4,0,0,0,21,0,0,0,19,0,0,0,3,0,0,0,4,0,0,0,36,0,0,0,68,0,0,0,4,0,0,0,3,0,0,0,53,0,0,0,4,0,0,0,3,0,0,0,3,0,0,0,36,0,0,0,80,0,0,0,4,0,0,0,4,0,0,0,17,0,0,0,36,0,0,0,4,0,0,0,3,0,0,0,34,0,0,0,118,0,0,0,4,0,0,0,3,0,0,0,40,0,0,0,13,0,0,0,3,0,0,0,4,0,0,0,55,0,0,0,121,0,0,0,4,0,0,0,4,0,0,0,43,0,0,0,26,0,0,0,4,0,0,0,3,0,0,0,12,0,0,0,71,0,0,0,4,0,0,0,4,0,0,0,58,0,0,0,108,0,0,0,3,0,0,0,4,0,0,0,51,0,0,0,36,0,0,0,4,0,0,0,4,0,0,0,23,0,0,0,94,0,0,0,3,0,0,0,3,0,0,0,46,0,0,0,73,0,0,0,4,0,0,0,4,0,0,0,9,0,0,0,25,0,0,0,4,0,0,0,3,0,0,0,27,0,0,0,48,0,0,0,3,0,0,0,3,0,0,0,50,0,0,0,91,0,0,0,3,0,0,0,3,0,0,0,14,0,0,0,122,0,0,0,3,0,0,0,3,0,0,0,17,0,0,0,113,0,0,0,3,0,0,0,4,0,0,0,16,0,0,0,8,0,0,0,3,0,0,0,4,0,0,0,36,0,0,0,38,0,0,0,3,0,0,0,4,0,0,0,25,0,0,0,103,0,0,0,4,0,0,0,3,0,0,0,55,0,0,0,70,0,0,0,3,0,0,0,4,0,0,0,28,0,0,0,56,0,0,0,3,0,0,0,3,0,0,0,23,0,0,0,85,0,0,0,3,0,0,0,3,0,0,0,50,0,0,0,108,0,0,0,3,0,0,0,3,0,0,0,25,0,0,0,122,0,0,0,3,0,0,0,3,0,0,0,14,0,0,0,82,0,0,0,4,0,0,0,4,0,0,0,50,0,0,0,16,0,0,0,4,0,0,0,4,0,0,0,38,0,0,0,49,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,3,0,0,0,3,0,0,0,7,0,0,0,38,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,0,0,0,67,0,0,0,144,186,0,0,32,0,0,0,144,186,0,0,8,0,0,0,6,0,0,0,160,185,0,0,10,0,0,0,5,0,0,0,104,186,0,0,50,0,0,0,5,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,160,185,0,0,10,0,0,0,5,0,0,0,176,184,0,0,1,0,0,0,5,0,0,0,200,185,0,0,20,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,0,0,0,28,0,0,0,104,0,0,0,10,0,0,0,6,0,0,0,43,0,0,0,28,0,0,0,12,0,0,0,7,0,0,0,22,0,0,0,72,0,0,0,7,0,0,0,10,0,0,0,11,0,0,0,16,0,0,0,8,0,0,0,6,0,0,0,50,0,0,0,102,0,0,0,8,0,0,0,4,0,0,0,12,0,0,0,40,0,0,0,5,0,0,0,6,0,0,0,49,0,0,0,80,0,0,0,11,0,0,0,5,0,0,0,6,0,0,0,95,0,0,0,4,0,0,0,13,0,0,0,51,0,0,0,61,0,0,0,6,0,0,0,10,0,0,0,30,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,17,0,0,0,118,0,0,0,6,0,0,0,6,0,0,0,34,0,0,0,52,0,0,0,6,0,0,0,7,0,0,0,40,0,0,0,119,0,0,0,15,0,0,0,6,0,0,0,31,0,0,0,91,0,0,0,15,0,0,0,4,0,0,0,53,0,0,0,10,0,0,0,8,0,0,0,9,0,0,0,8,0,0,0,61,0,0,0,4,0,0,0,7,0,0,0,7,0,0,0,28,0,0,0,5,0,0,0,4,0,0,0,58,0,0,0,92,0,0,0,4,0,0,0,4,0,0,0,19,0,0,0,55,0,0,0,5,0,0,0,5,0,0,0,25,0,0,0,29,0,0,0,4,0,0,0,5,0,0,0,58,0,0,0,44,0,0,0,4,0,0,0,4,0,0,0,9,0,0,0,76,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,120,0,0,0,144,186,0,0,8,0,0,0,200,185,0,0,8,0,0,0,1,0,0,0,64,186,0,0,80,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,32,0,0,0,60,0,0,0,30,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,200,185,0,0,0,0,0,0,200,185,0,0,0,0,0,0,0,0,0,0,200,185,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,48,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,30,0,0,0,0,0,0,0,4,0,0,0,15,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,1,0,0,0,16,0,0,0,0,0,0,0,100,0,0,0,124,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,12,0,0,0,8,0,0,0,4,0,0,0,32,0,0,0,0,0,0,0,50,0,0,0,84,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,12,0,0,0,8,0,0,0,4,0,0,0,32,0,0,0,0,0,0,0,50,0,0,0,82,0,0,0,0,0,0,0,108,0,0,0,0,0,0,0,12,0,0,0,8,0,0,0,4,0,0,0,32,0,0,0,0,0,0,0,50,0,0,0,126,0,0,0,0,0,0,0,60,0,0,0,0,0,0,0,12,0,0,0,8,0,0,0,4,0,0,0,32,0,0,0,0,0,0,0,5,0,0,0,68,0,0,0,0,0,0,0,74,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,6,0,0,0,16,0,0,0,0,0,0,0,2,0,0,0,68,0,0,0,0,0,0,0,96,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,5,0,0,0,16,0,0,0,0,0,0,0,5,0,0,0,68,0,0,0,0,0,0,0,78,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,1,0,0,0,34,0,0,0,0,0,0,0,42,0,0,0,0,0,0,0,6,0,0,0,8,0,0,0,3,0,0,0,16,0,0,0,0,0,0,0,1,0,0,0,22,0,0,0,0,0,0,0,92,0,0,0,0,0,0,0,6,0,0,0,8,0,0,0,2,0,0,0,16,0,0,0,0,0,0,0,10,0,0,0,104,0,0,0,0,0,0,0,88,0,0,0,0,0,0,0,6,0,0,0,8,0,0,0,1,0,0,0,16,0,0,0,0,0,0,0,2,0,0,0,52,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,6,0,0,0,8,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,200,0,0,0,76,0,0,0,0,0,0,0,54,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,64,0,0,0,0,0,0,0,100,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,98,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,5,0,0,0,14,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,5,0,0,0,98,0,0,0,0,0,0,0,28,0,0,0,0,0,0,0,5,0,0,0,14,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,112,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,37,115,47,37,115,47,37,115,0,0,0,0,0,0,0,0,37,115,47,37,115,0,0,0,104,105,103,104,32,115,99,111,114,101,32,58,32,37,48,57,100,0,0,0,0,0,0,0,39,113,39,32,116,111,32,113,117,105,116,0,0,0,0,0,120,107,111,98,111,32,58,32,40,119,97,114,110,105,110,103,41,32,99,97,110,39,116,32,117,112,100,97,116,101,32,116,104,101,32,115,99,111,114,101,45,102,105,108,101,10,0,0,32,32,32,32,32,32,32,32,32,32,0,0,0,0,0,0,39,110,39,44,39,109,39,32,116,111,32,99,104,111,111,115,101,32,97,32,115,116,97,103,101,0,0,0,0,0,0,0,120,107,111,98,111,32,58,32,40,119,97,114,110,105,110,103,41,32,99,97,110,39,116,32,114,101,97,100,32,116,104,101,32,115,99,111,114,101,45,102,105,108,101,32,102,114,111,109,32,37,115,10,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,0,0,0,0,0,0,112,117,115,104,32,39,115,39,32,107,101,121,32,116,111,32,115,116,97,114,116,32,97,32,103,97,109,101,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,0,0,0,0,99,104,101,97,116,32,109,111,100,101,0,0,0,0,0,0,72,79,77,69,0,0,0,0,57,57,57,57,57,57,57,57,57,0,0,0,0,0,0,0,70,114,105,32,74,97,110,32,49,48,32,49,49,58,49,55,58,53,48,32,74,83,84,32,49,57,57,55,0,0,0,0,86,101,114,115,105,111,110,32,49,46,49,49,0,0,0,0,37,115,47,37,115,47,37,117,0,0,0,0,0,0,0,0,83,67,79,82,69,0,0,0,83,72,73,80,83,0,0,0,45,97,100,111,98,101,45,110,101,119,32,99,101,110,116,117,114,121,32,115,99,104,111,111,108,98,111,111,107,45,98,111,108,100,45,114,45,110,111,114,109,97,108,45,45,50,52,45,50,52,48,45,55,53,45,55,53,45,112,45,49,52,57,45,42,0,0,0,0,0,0,0,86,101,114,115,105,111,110,32,49,46,49,49,0,0,0,0,37,117,0,0,0,0,0,0,83,84,65,71,69,0,0,0,45,97,100,111,98,101,45,104,101,108,118,101,116,105,99,97,45,98,111,108,100,45,114,45,110,111,114,109,97,108,45,45,49,50,45,49,50,48,45,55,53,45,55,53,45,112,45,55,48,45,105,115,111,56,56,53,57,45,49,0,0,0,0,0,45,104,105,115,99,111,114,101,115,0,0,0,0,0,0,0,45,119,97,105,116,0,0,0,45,97,100,111,98,101,45,104,101,108,118,101,116,105,99,97,45,98,111,108,100,45,114,45,110,111,114,109,97,108,45,45,49,50,45,49,50,48,45,55,53,45,55,53,45,112,45,55,48,45,105,115,111,56,56,53,57,45,49,0,0,0,0,0,45,100,105,115,112,108,97,121,0,0,0,0,0,0,0,0,45,99,104,101,97,116,0,0,45,102,105,116,0,0,0,0,120,107,111,98,111,32,58,32,103,101,116,112,119,117,105,100,40,41,32,102,97,105,108,101,100,10,0,0,0,0,0,0,45,112,114,105,118,97,116,101,0,0,0,0,0,0,0,0,37,48,57,117,0,0,0,0,45,100,111,117,98,108,101,115,105,122,101,0,0,0,0,0,99,108,101,97,114,101,100,32,115,116,97,103,101,115,0,0,45,102,97,115,116,0,0,0,37,48,57,100,0,0,0,0,104,105,103,104,32,115,99,111,114,101,0,0,0,0,0,0,45,115,112,101,101,100,0,0,110,97,109,101,0,0,0,0,37,45,50,48,115,32,37,57,117,32,37,57,117,10,0,0,88,75,79,66,79,0,0,0,10,88,75,79,66,79,32,37,115,10,0,0,0,0,0,0,0,0,0,0,12,0,0,0,23,0,0,0,30,0,0,0,32,0,0,0,30,0,0,0,23,0,0,0,12,0,0,0,0,0,0,0,244,255,255,255,233,255,255,255,226,255,255,255,224,255,255,255,226,255,255,255,233,255,255,255,244,255,255,255,32,0,0,0,30,0,0,0,23,0,0,0,12,0,0,0,0,0,0,0,244,255,255,255,233,255,255,255,226,255,255,255,224,255,255,255,226,255,255,255,233,255,255,255,244,255,255,255,0,0,0,0,12,0,0,0,23,0,0,0,30,0,0,0,200,185,0,0,160,185,0,0,64,186,0,0,152,183,0,0,200,185,0,0,160,185,0,0,152,183,0,0,200,185,0,0,0,0,0,0,96,192,0,0,94,0,0,0,118,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,192,0,0,70,0,0,0,80,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,192,0,0,26,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,192,0,0,58,0,0,0,50,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,192,0,0,56,0,0,0,106,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,56,119,105,110,95,99,109,97,112,0,0,0,0,0,0,0,56,119,105,110,95,99,104,105,112,0,0,0,0,0,0,0,51,119,105,110,0,0,0,0,49,49,119,105,110,95,98,97,99,107,105,110,103,0,0,0,49,48,119,105,110,95,115,99,114,111,108,108,0,0,0,0,0,0,0,0,88,191,0,0,0,0,0,0,104,191,0,0,64,192,0,0,0,0,0,0,0,0,0,0,144,191,0,0,80,192,0,0,0,0,0,0,0,0,0,0,184,191,0,0,40,192,0,0,0,0,0,0,0,0,0,0,224,191,0,0,136,192,0,0,0,0,0,0,0,0,0,0,240,191,0,0,152,192,0,0,0,0,0,0,0,0,0,0,0,192,0,0,0,0,0,0,8,192,0,0,128,192,0,0,0,0,0,0,0,0,0,0,24,192,0,0,136,192,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,128,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  function _pause() {
      // int pause(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/pause.html
      // We don't support signals, so we return immediately.
      ___setErrNo(ERRNO_CODES.EINTR);
      return -1;
    }
  function _emscripten_cancel_main_loop() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.shouldPause = true;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return ((asm["setTempRet0"]((tempDouble=ret,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)),ret>>>0)|0);
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  function _sigaction(set) {
      // TODO:
      return 0;
    }
  function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
      Module['noExitRuntime'] = true;
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from non-main loop sources
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        if (Module['preMainLoop']) {
          Module['preMainLoop']();
        }
        try {
          Runtime.dynCall('v', func);
        } catch (e) {
          if (e instanceof ExitStatus) {
            return;
          } else {
            if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
            throw e;
          }
        }
        if (Module['postMainLoop']) {
          Module['postMainLoop']();
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from the main loop itself
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        Browser.mainLoop.scheduler();
      }
      if (fps && fps > 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, 1000/fps); // doing this each time means that on exception, we stop
        }
      } else {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        }
      }
      Browser.mainLoop.scheduler();
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  Module["_strncpy"] = _strncpy;
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_strcpy"] = _strcpy;
  function _getpwuid(uid) {
      return 0; // NULL
    }
  function _getgid() {
      // gid_t getgid(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/getgid.html
      // We have just one process/group/user, all with ID 0.
      return 0;
    }var _getuid=_getgid;
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function _opendir(dirname) {
      // DIR *opendir(const char *dirname);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/opendir.html
      // NOTE: Calculating absolute path redundantly since we need to associate it
      //       with the opened stream.
      var path = Pointer_stringify(dirname);
      if (!path) {
        ___setErrNo(ERRNO_CODES.ENOENT);
        return 0;
      }
      var node;
      try {
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
      } catch (e) {
        FS.handleFSError(e);
        return 0;
      }
      if (!FS.isDir(node.mode)) {
        ___setErrNo(ERRNO_CODES.ENOTDIR);
        return 0;
      }
      var err = _open(dirname, 0, allocate([0, 0, 0, 0], 'i32', ALLOC_STACK));
      // open returns 0 on failure, not -1
      return err === -1 ? 0 : err;
    }
  function _readdir_r(dirp, entry, result) {
      // int readdir_r(DIR *dirp, struct dirent *entry, struct dirent **result);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/readdir_r.html
      var stream = FS.getStream(dirp);
      if (!stream) {
        return ___setErrNo(ERRNO_CODES.EBADF);
      }
      var entries;
      try {
        entries = FS.readdir(stream.path);
      } catch (e) {
        return FS.handleFSError(e);
      }
      if (stream.position < 0 || stream.position >= entries.length) {
        HEAP32[((result)>>2)]=0
        return 0;
      }
      var id;
      var type;
      var name = entries[stream.position];
      var offset = stream.position + 1;
      if (!name.indexOf('.')) {
        id = 1;
        type = 4;
      } else {
        var child = FS.lookupNode(stream.node, name);
        id = child.id;
        type = FS.isChrdev(child.mode) ? 2 :  // DT_CHR, character device.
               FS.isDir(child.mode) ? 4 :     // DT_DIR, directory.
               FS.isLink(child.mode) ? 10 :   // DT_LNK, symbolic link.
               8;                             // DT_REG, regular file.
      }
      HEAP32[((entry)>>2)]=id
      HEAP32[(((entry)+(4))>>2)]=offset
      HEAP32[(((entry)+(8))>>2)]=name.length + 1
      for (var i = 0; i < name.length; i++) {
        HEAP8[(((entry + 11)+(i))|0)]=name.charCodeAt(i)
      }
      HEAP8[(((entry + 11)+(i))|0)]=0
      HEAP8[(((entry)+(10))|0)]=type
      HEAP32[((result)>>2)]=entry
      stream.position++;
      return 0;
    }function _readdir(dirp) {
      // struct dirent *readdir(DIR *dirp);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/readdir_r.html
      var stream = FS.getStream(dirp);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      // TODO Is it supposed to be safe to execute multiple readdirs?
      if (!_readdir.entry) _readdir.entry = _malloc(268);
      if (!_readdir.result) _readdir.result = _malloc(4);
      var err = _readdir_r(dirp, _readdir.entry, _readdir.result);
      if (err) {
        ___setErrNo(err);
        return 0;
      }
      return HEAP32[((_readdir.result)>>2)];
    }
  function _stat(path, buf, dontResolveLastLink) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/stat.html
      // int stat(const char *path, struct stat *buf);
      // NOTE: dontResolveLastLink is a shortcut for lstat(). It should never be
      //       used in client code.
      path = typeof path !== 'string' ? Pointer_stringify(path) : path;
      try {
        var stat = dontResolveLastLink ? FS.lstat(path) : FS.stat(path);
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode
        HEAP32[(((buf)+(16))>>2)]=stat.nlink
        HEAP32[(((buf)+(20))>>2)]=stat.uid
        HEAP32[(((buf)+(24))>>2)]=stat.gid
        HEAP32[(((buf)+(28))>>2)]=stat.rdev
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size
        HEAP32[(((buf)+(40))>>2)]=4096
        HEAP32[(((buf)+(44))>>2)]=stat.blocks
        HEAP32[(((buf)+(48))>>2)]=Math.floor(stat.atime.getTime() / 1000)
        HEAP32[(((buf)+(52))>>2)]=0
        HEAP32[(((buf)+(56))>>2)]=Math.floor(stat.mtime.getTime() / 1000)
        HEAP32[(((buf)+(60))>>2)]=0
        HEAP32[(((buf)+(64))>>2)]=Math.floor(stat.ctime.getTime() / 1000)
        HEAP32[(((buf)+(68))>>2)]=0
        HEAP32[(((buf)+(72))>>2)]=stat.ino
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _closedir(dirp) {
      // int closedir(DIR *dirp);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/closedir.html
      return _close(dirp);
    }
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return Module['dynCall_iii'](cmp, base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  function ___gxx_personality_v0() {
    }
  var Sprite={value:0,currentTextClass:{},currentFgColor:{},currentBgColor:{},events:[],textElement:{},init:function (viewport, level, background) {
              Sprite.maxSprites = Module['maxSprites']; 
              Sprite.viewport = viewport;
              Sprite.level = level;
              Sprite.background = background;
              Sprite.viewportW = viewport.clientWidth;
              // size of the the viewport and the larger level within
              Sprite.viewportW = viewport.clientWidth;
              Sprite.viewportH = viewport.clientHeight;
              Sprite.levelW = level.clientWidth;
              Sprite.levelH = level.clientHeight;
              // how fast do we scroll the level tiles
              Sprite.levelSpeed = -1;
              // the current scroll location of the level
              Sprite.levelx = 0;
              Sprite.spriteCount = 0;
              Sprite.levelSprites = [];
              Sprite.levelSpriteCount = 0;
              // timer and stats
              Sprite.currentTimestamp = new Date().getTime();
              Sprite.previousTimestamp = 0;
              Sprite.framesThisSecond = 0;
              Sprite.elapsedMs = 0;
              Sprite.currentFPS = 60;
              // each second, add severl new entities
              Sprite.newMovingSpritesPerSecond = 1;
              Sprite.newLevelSpritesPerSecond = 25;
              // no blank screens if the FPS is low
              Sprite.minSpriteCount = 40;
              // add new sprites until the FPS gets too low
              // note: if we set this to 60 it never goes
              // above the threshold: use 55 instead
              Sprite.targetFramerate = 30;
              // SPRITESHEET: all sprite frames stored in a single image
              Sprite.spritesheetWidth = 256;
              Sprite.spritesheetHeight = 128;
              Sprite.spritesheetFrameWidth = 16;
              Sprite.spritesheetFrameHeight = 16;
              Sprite.spritesheetXFrames = Sprite.spritesheetWidth / Sprite.spritesheetFrameWidth;
              Sprite.spritesheetYFrames = Sprite.spritesheetHeight / Sprite.spritesheetFrameHeight;
              Sprite.spritesheetFrames = Sprite.spritesheetXFrames * Sprite.spritesheetYFrames;
              Sprite.demosprites = [];
              // can this web brower handle CSS3 transforms (to trigger HW accel?)
              Sprite.has3d = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
              if (window.console) console.log ('Browser is capable of CSS3 transform3d: ' + Sprite.has3d);
              // ensure that we have requestAnimationFrame
              // this is Paul Irish's compatibility shim
              if (!window.requestAnimationFrame) 
              {
                  window.requestAnimationFrame = (function() 
                          {
                              return window.webkitRequestAnimationFrame ||
                      window.mozRequestAnimationFrame ||
                      window.oRequestAnimationFrame ||
                      window.msRequestAnimationFrame ||
                      function(callback,element) 
                  {
                      window.setTimeout(callback, 1000 / 60);
                  };
                          })();
              }
          },maybeMoreSprites:function ()
          {
              var howmany = 0;
              // keep adding sprites until we go below the target fps
              if ((Sprite.currentFPS > Sprite.targetFramerate) || (Sprite.spriteCount < Sprite.minSpriteCount))
              {
                  howmany = Sprite.newMovingSpritesPerSecond;
                  while (howmany--)
                  {
                      // add one new animated sprite
                      var sprite = new Sprite.SpriteX();
                      Sprite.demoInit(sprite);
                      Sprite.demosprites[Sprite.spriteCount] = sprite;
                      Sprite.spriteCount++;
                  }
                  howmany = Sprite.newLevelSpritesPerSecond;
                  while (howmany--)
                  {
                      // also add tiles to the static level geometry
                      var sprite = new Sprite.SpriteX(Sprite.level);
                      Sprite.demoInit(sprite);
                      Sprite.levelSprites[Sprite.levelSpriteCount] = sprite;
                      Sprite.levelSpriteCount++;
                  }
              }
              // remove sprites if the FPS dips too low
              else
              {
                  howmany = Sprite.newMovingSpritesPerSecond;
                  while (howmany--)
                  {
                      if (Sprite.spriteCount)
                      {
                          Sprite.demosprites[Sprite.spriteCount-1].destroy();
                          Sprite.spriteCount--;
                      }
                  }
                  howmany = Sprite.newLevelSpritesPerSecond;
                  while (howmany--)
                  {
                      if (Sprite.levelSpriteCount)
                      {
                          Sprite.levelSprites[Sprite.levelSpriteCount-1].destroy();
                          Sprite.levelSpriteCount--;
                      }
                  }
              }
          },checkFPS:function () 
          {
              Sprite.framesThisSecond++;
              Sprite.previousTimestamp = Sprite.currentTimestamp;
              Sprite.currentTimestamp = new Date().getTime();
              Sprite.elapsedMs += Sprite.currentTimestamp - Sprite.previousTimestamp;
              Sprite.currentFPS = 1000 / (Sprite.currentTimestamp - Sprite.previousTimestamp);
              // only update once per second
              if (Sprite.elapsedMs >= 1000)
              {
                  stats.innerHTML = (Sprite.spriteCount + Sprite.levelSpriteCount) +
                      ' sprites at ' + Sprite.framesThisSecond + 'fps - viewport size: ' +  
                      Sprite.viewportW+'x'+Sprite.viewportH+ ' - ' + Sprite.spriteCount + ' moving entities - ' 
                      + Sprite.levelSpriteCount + ' level tiles';
                  Sprite.elapsedMs -= 1000;
                  Sprite.framesThisSecond = 0;
                  // add more sprites if possible
                  // only done once per second so we aren't touching
                  // the DOM every single frame
                  Sprite.maybeMoreSprites();
              }
          },demoInit:function (sprite) {
              // random starting position
              if (sprite.parent == Sprite.level) 
              {
                  sprite.x = Math.round(Math.random() * Sprite.levelW);
                  sprite.y = Math.round(Math.random() * Sprite.levelH);
              }
              else // regular sprite in the viewport
              {
                  sprite.x = Math.round(Math.random() * Sprite.viewportW);
                  sprite.y = Math.round(Math.random() * Sprite.viewportH);
              }
              sprite.reposition();
              // give it a random speed
              sprite.xSpeed = Math.round(Math.random() * 10) - 5;
              sprite.ySpeed = Math.round(Math.random() * 10) - 5;
              // no still sprites
              if (sprite.xSpeed == 0) sprite.xSpeed  = 1;
              if (sprite.ySpeed == 0) sprite.ySpeed  = 1;
              // random spritesheet frame
              sprite.frame(Sprite.spriteCount);
          },repositionSprite:function () {
              if (!this) return;
              // CSS3 version - forces hardware accel on mobile
              // Surprisingly, this is SLOWER on PC Windows using Chrome	
              // but may be faster on iOS and other mobile platforms
              if (Module.use3d && Sprite.has3d)
              {
                  this.style.webkitTransform = 'translate3d('+this.x+'px,'+this.y+'px,0px)';
              }
              else
              {
                  this.style.left = this.x + 'px';
                  this.style.top = this.y + 'px';
                  if ( this.hasOwnProperty('w') && this.hasOwnProperty('h') ) {
                      this.style.width = this.w + 'px';
                      this.style.height = this.h + 'px';
                  }
              }
          },changeSpriteFrame:function (num) {
              if (!this) return;
              this.style.backgroundPosition = 
                  (-1 * (num % Sprite.spritesheetXFrames) * Sprite.spritesheetFrameWidth + 'px ') +
                  (-1 * (Math.round(num / Sprite.spritesheetXFrames) % Sprite.spritesheetYFrames)) 
                  * Sprite.spritesheetFrameHeight + 'px ';
          },destroySprite:function () {
              if (!this) return;
              this.parent.removeChild(this.element);
          },changeSpriteFrameXY:function (x, y) {
              if (!this) return;
              this.style.backgroundPosition =
                  (-1 * x) + 'px ' + (-1 * y) + 'px ';
          },showSprite:function () {
              this.style.visibility = 'visible';
          },hideSprite:function () {
              this.style.visibility = 'hidden';
          },SpriteX:function SpriteX(parentElement) {
                  // function references
                  this.reposition = Sprite.repositionSprite;
                  // changes the spritesheet frame of a sprite
                  // by shifting the background image location
                  this.frame = Sprite.changeSpriteFrame;
                  this.framexy = Sprite.changeSpriteFrameXY;
                  this.show = Sprite.showSprite;
                  this.hide = Sprite.hideSprite;
                  // removes a sprite from a container DOM element
                  this.destroy = Sprite.destroySprite;
                  // where do this sprite live? (default: viewport)
                  this.parent = parentElement ? parentElement : Sprite.viewport;
                  // create a DOM sprite
                  this.element = document.createElement("div");
                  this.element.className = 'sprite';
                  // optimized pointer to style object
                  this.style = this.element.style;
                  // put it into the game window
                  this.parent.appendChild(this.element);
              },animateSprites:function ()
          {
              for (var loop=0; loop < Sprite.spriteCount; loop++)
              {
                  Sprite.demosprites[loop].x += Sprite.demosprites[loop].xSpeed;
                  Sprite.demosprites[loop].y += Sprite.demosprites[loop].ySpeed;
                  // bounce at edges
                  if ((Sprite.demosprites[loop].x <= 0) || (Sprite.demosprites[loop].x >= Sprite.viewportW))
                      Sprite.demosprites[loop].xSpeed = -1 * Sprite.demosprites[loop].xSpeed;
                  if ((Sprite.demosprites[loop].y <= 0) || (Sprite.demosprites[loop].y >= Sprite.viewportH))
                      Sprite.demosprites[loop].ySpeed = -1 * Sprite.demosprites[loop].ySpeed;
                  Sprite.demosprites[loop].reposition();
              }
              // also scroll the level tiles
              Sprite.levelx += Sprite.levelSpeed;
              // change direction once we get to the edge
              if (Sprite.levelx <= (-Sprite.levelW+Sprite.viewportW)) Sprite.levelSpeed = -1 * Sprite.levelSpeed;
              if (Sprite.levelx >= 0) Sprite.levelSpeed = -1 * Sprite.levelSpeed;
              Sprite.level.style.left = Sprite.levelx + 'px';
              // and the background parallax layer half as fast
              Sprite.background.style.backgroundPosition = Math.round(Sprite.levelx/2) + 'px 0px';
          },animate:function () 
          {
              // call this function again asap
              requestAnimationFrame(Sprite.animate);
              // measure time and add or remove sprites
              Sprite.checkFPS();
              // bounce the sprites around and scroll the level
              Sprite.animateSprites();
          },receiveEvent:function (event) {
              Sprite.events.push(event);
              if (Sprite.events.length >= 10000) {
                  Module.printErr('event queue full, dropping events');
                  Sprite.events = Sprite.events.slice(0, 10000);
              }
              switch ( event.type ) {
                  case "keydown": case "keyup": {
                      //Module.print('Received ' + event.type + ' event. Keycode = ' + event.keyCode);
                      if ( Module.keycodelist.indexOf(event.keyCode) > -1 ) {
                          event.preventDefault();
                      }
                  }
              }
          }};function _GetEventType() {
          if ( Sprite.event ) {
              var eventType = Module.eventTypes[Sprite.event.type];
              //Module.print('EventType ' + eventType);
              return eventType;
          }
          Module.print('event undefined');
      }
  function _GetEventKeycode() {
          if ( Sprite.event ) {
              switch (Sprite.event.type) {
                  case 'keydown': case 'keyup': {
                      var down = Sprite.event.type === 'keydown';
                      //Module.print('Received key event: ' + event.keyCode);
                      var key = Sprite.event.keyCode;
                      if (key >= 65 && key <= 90) {
                          key += 32; // make lowercase for SDL
                      }
                      //Module.print('Got ' + Sprite.event.type + ' event. Keycode = ' + key);
                      return key;
                  }
              }
          }
          return 0;
      }
  function _PollEvent() {
          if ( Sprite.events.length > 0 ) {
              Sprite.event = Sprite.events.shift();
              //Module.print('Polled ' + Sprite.event.type + ' event. Keycode = ' + Sprite.event.keyCode);
              return 1;
          }
          Sprite.event = undefined;
          return 0;
      }
  function _ClearElements(parentId) {
          var parent = Module.parentmap[parentId];
          if ( !parent  ) {
              Module.printErr("ClearElements: invalid parentId " + parentId);
              return;
          }
          //Module.print('ClearElements(' + parentId + ')');
          for ( var i = parent.childNodes.length - 1; i >= 0; i-- ) {
              var child = parent.childNodes[i];
              // Remove only non-container "parent" elements
              if ( Module.parents.indexOf(child) < 0 ) {
                  if ( child.className != 'sprite' ) {
                      //Module.print('Removing node class=' + child.classname + ' content=' + child.innerHTML);
                      parent.removeChild(child);
                  } else {
                      // only hide sprites - don't remove from DOM
                      child.style.visibility = 'hidden';
                  }
              }
          }
          for ( var key in Sprite.textElement ) {
              if ( key.split('_')[0] == parentId ) {
  //                Module.print('ClearElements deleting Sprite.textElement[' + key + '] (' + 
  //                            Sprite.textElement[key].innerHTML + ')');
                  delete Sprite.textElement[key];
              }
          }
      }
  function _ClearCanvas(id) {
          var canvas = Module.parentmap[id];
          if ( !canvas  ) {
              Module.printErr("ClearCanvas: invalid id " + id);
              return;
          }
          // check if it's a canvas
          if ( canvas && typeof canvas.getContext === 'function' ) {
              var ctx = canvas.getContext('2d');
              var bgcolor = Sprite.currentBgColor[id];
              if ( bgcolor ) {
                  ctx.fillStyle = '#' + bgcolor.toString(16);
              }
              ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
      }
  function _SetForegroundColor(parentId, color) {
          Sprite.currentFgColor[parentId] = color;
          //Module.print('foreground for ' + parentId + ' is ' + color);
      }
  function _SetBackgroundColor(parentId, color) {
          Sprite.currentBgColor[parentId] = color;
          //Module.print('background for ' + parentId + ' is ' + color);
      }
  function _SelectFont(parentId, s) {
          s = Pointer_stringify(s);
          Sprite.currentTextClass[parentId] = Module.fontmap[s] || Module.fontmap.def;
          //Module.print('SelectFont(' + s + '): ' + Sprite.currentTextClass[parentId]);
      }
  function _FillRect(id, x, y, w, h) {
          var canvas = Module.parentmap[id];
          var ctx = canvas.getContext('2d');
          var fgcolor = Sprite.currentFgColor[id];
          if ( fgcolor ) {
              ctx.fillStyle = '#' + fgcolor.toString(16);
          }
          ctx.fillRect(x, y, w, h);
          //Module.print('DrawPoint(' + id + ', ' + x + ', ' + y + ')');
      }
  function _AddTextElement(parentId, x, y, text) {
          text = Pointer_stringify(text);
          // generate unique key based on the placement of the text
          var key = parentId + '_' + x + '_' + y;
          var parent = Module.parentmap[parentId] || Module.viewport;
          var element = Sprite.textElement[key];
          if ( ! element ) {
              // create a DOM element
              element = document.createElement("div");
              element.className = Sprite.currentTextClass[parentId];
              // optimized pointer to style object
              var style = element.style;
              style.left = x + 'px';
              style.top = y + 'px';
              // put it into the game window
              parent.appendChild(element);
              Sprite.textElement[key] = element;
          }
          // set color
          var fgcolor = Sprite.currentFgColor[parentId];
          if ( fgcolor ) {
              element.style.color = '#' + fgcolor.toString(16);
          }
          element.innerHTML = text;
          //Module.print('AddTextElement('+ parentId + ', ' + x + ', ' + y + ', ' + text + ')');
      }
  function _SpriteInit(parentId) {
          Sprite.init(Module['wchip'], Module['map'], Module['background']);
          if (!Module['doNotCaptureKeyboard']) {
              document.addEventListener("keydown", Sprite.receiveEvent);
              document.addEventListener("keyup", Sprite.receiveEvent);
              //document.addEventListener("keypress", Sprite.receiveEvent);
          }
          var parent = Module.parentmap[parentId];
          Sprite.sprites = new Array(Sprite.maxSprites);
          Sprite.mapsprites = {};
          for ( var i = 0; i < Sprite.maxSprites; i++ ) {
              Sprite.sprites[i] = new Sprite.SpriteX(parent);
              Sprite.sprites[i].hide();
          }
          Sprite.saveUpdateIndex = 0;
      }
  function _SpriteAdd(cx, cy, h, v, x, y) {
          var sprite = new Sprite.SpriteX(Sprite.level);
          sprite.framexy(cx, cy);
          sprite.x = x;
          sprite.y = y;
          sprite.reposition();
          Sprite.mapsprites[x + "_" + y] = sprite;
      }
  function _SpriteRemove(x, y) {
          var key = x + "_" + y;
          var sprite = Sprite.mapsprites[key];
          if ( sprite ) {
              sprite.destroy();
              delete Sprite.mapsprites[key];
          }
      }
  function _SpriteRemoveAll() {
          var count = 0;
          for ( var key in Sprite.mapsprites ) {
              if ( Sprite.mapsprites.hasOwnProperty(key) ) {
                  Sprite.mapsprites[key].destroy();
                  delete Sprite.mapsprites[key];
                  count++;
              }
          }
          //Module.print("SpriteRemoveAll removed " + count + " map sprites");
      }
  function _SpriteUpdate(cx, cy, h, v, x, y) {
          if ( Sprite.updateIndex < Sprite.maxSprites ) {
              var sprite = Sprite.sprites[Sprite.updateIndex++];
              sprite.framexy(cx, cy);
              sprite.x = x;
              sprite.y = y;
              sprite.w = h;
              sprite.h = v;
              sprite.reposition();
              sprite.show();
              //Module.print('SpriteUpdate( ' + cx + ', ' + cy + ', ' + h + ', ' + v + ', ' + x + ', ' + y + ')');
          }
      }
  function _SpriteEndUpdate() {
          // hide all the sprites from updateIndex to saveUpdateIndex
          for ( var i = Sprite.updateIndex; i < Sprite.saveUpdateIndex; i++ ) {
              Sprite.sprites[i].hide();
          }
          Sprite.saveUpdateIndex = Sprite.updateIndex;
          Sprite.updateIndex = 0;
      }
  function _SetPosition(vx, vy) {
          Sprite.level.style.left = -vx + 'px';
          Sprite.level.style.top  = -vy + 'px';
      }
  function _abort() {
      Module['abort']();
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            ['experimental-webgl', 'webgl'].some(function(webglId) {
              return ctx = canvas.getContext(webglId, contextAttributes);
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.___dso_handle|0;var n=env._stderr|0;var o=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=+env.NaN;var r=+env.Infinity;var s=0;var t=0;var u=0;var v=0;var w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0.0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=global.Math.floor;var Q=global.Math.abs;var R=global.Math.sqrt;var S=global.Math.pow;var T=global.Math.cos;var U=global.Math.sin;var V=global.Math.tan;var W=global.Math.acos;var X=global.Math.asin;var Y=global.Math.atan;var Z=global.Math.atan2;var _=global.Math.exp;var $=global.Math.log;var aa=global.Math.ceil;var ab=global.Math.imul;var ac=env.abort;var ad=env.assert;var ae=env.asmPrintInt;var af=env.asmPrintFloat;var ag=env.min;var ah=env.invoke_viiiii;var ai=env.invoke_vi;var aj=env.invoke_ii;var ak=env.invoke_iiii;var al=env.invoke_v;var am=env.invoke_viiiiii;var an=env.invoke_iii;var ao=env.invoke_viiii;var ap=env._strncmp;var aq=env._open;var ar=env._AddTextElement;var as=env._PollEvent;var at=env._snprintf;var au=env._readdir;var av=env._SpriteRemove;var aw=env._atexit;var ax=env._abort;var ay=env._fprintf;var az=env._printf;var aA=env._close;var aB=env._pread;var aC=env._fflush;var aD=env.___buildEnvironment;var aE=env.__reallyNegative;var aF=env._getgid;var aG=env._strtol;var aH=env._fputc;var aI=env._pause;var aJ=env._GetEventType;var aK=env._sysconf;var aL=env._puts;var aM=env.___setErrNo;var aN=env._fwrite;var aO=env._SetBackgroundColor;var aP=env._qsort;var aQ=env._send;var aR=env._write;var aS=env._fputs;var aT=env._exit;var aU=env._sprintf;var aV=env._SpriteInit;var aW=env._SetPosition;var aX=env._isspace;var aY=env._SetForegroundColor;var aZ=env._SpriteRemoveAll;var a_=env._recv;var a$=env._stat;var a0=env._ClearCanvas;var a1=env._SelectFont;var a2=env._ClearElements;var a3=env._read;var a4=env._emscripten_set_main_loop;var a5=env._readdir_r;var a6=env.__formatString;var a7=env._getenv;var a8=env._closedir;var a9=env._SpriteEndUpdate;var ba=env._atoi;var bb=env._SpriteUpdate;var bc=env._sigaction;var bd=env._pwrite;var be=env._putchar;var bf=env._sbrk;var bg=env._FillRect;var bh=env.___errno_location;var bi=env.___gxx_personality_v0;var bj=env._emscripten_cancel_main_loop;var bk=env._GetEventKeycode;var bl=env._opendir;var bm=env.__parseInt;var bn=env._time;var bo=env._SpriteAdd;var bp=env.__exit;var bq=env._getpwuid;var br=env._strcmp;var bs=0.0;
// EMSCRIPTEN_START_FUNCS
function bB(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function bC(){return i|0}function bD(a){a=a|0;i=a}function bE(a,b){a=a|0;b=b|0;if((s|0)==0){s=a;t=b}}function bF(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function bG(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function bH(a){a=a|0;F=a}function bI(a){a=a|0;G=a}function bJ(a){a=a|0;H=a}function bK(a){a=a|0;I=a}function bL(a){a=a|0;J=a}function bM(a){a=a|0;K=a}function bN(a){a=a|0;L=a}function bO(a){a=a|0;M=a}function bP(a){a=a|0;N=a}function bQ(a){a=a|0;O=a}function bR(){c[12298]=p+8;c[12300]=o+8;c[12304]=o+8;c[12308]=o+8;c[12312]=o+8;c[12316]=o+8;c[12320]=p+8;c[12322]=o+8;c[12326]=o+8}function bS(a){a=a|0;cY(dE(a)|0);return}function bT(a){a=a|0;cZ(dE(a)|0);return}function bU(){var a=0;az(48656,(a=i,i=i+8|0,c[a>>2]=48160,a)|0)|0;i=a;aL(216)|0;aL(184)|0;aL(160)|0;aL(136)|0;aL(112)|0;aL(88)|0;aL(56)|0;be(10)|0;aT(1)}function bV(){dr(1);aT(0)}function bW(){if((c[42918]|0)!=0&a[49392]){aI()|0}a[49392]=1;if((df()|0)==0){return}bj();return}function bX(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;i=i+144|0;e=d|0;c[18560]=0;c[18572]=0;c[42918]=30;L13:do{if((a|0)>1){f=1;g=1;h=1;L14:while(1){j=c[b+(h<<2)>>2]|0;do{if((br(48616,j|0)|0)==0){k=h;l=0;m=f}else{if((br(48584,j|0)|0)==0){k=h;l=0;m=f;break}if((br(48552,j|0)|0)==0){c[18560]=1;k=h;l=g;m=f;break}if((br(48528,j|0)|0)==0){k=h;l=g;m=0;break}if((br(48488,j|0)|0)==0){k=h;l=g;m=0;break}if((br(48480,j|0)|0)==0){c[18572]=1;k=h;l=g;m=f;break}if((br(48464,j|0)|0)==0){n=h+1|0;o=c[b+(n<<2)>>2]|0;er(169560,o|0,1024)|0;k=n;l=g;m=f;break}if((br(48392,j|0)|0)!=0){break L14}n=h+1|0;c[42918]=ba(c[b+(n<<2)>>2]|0)|0;k=n;l=g;m=f}}while(0);n=k+1|0;if((n|0)<(a|0)){f=m;g=l;h=n}else{p=m;q=l;break L13}}if((br(48376,j|0)|0)==0){bV();return 0}else{bU();return 0}}else{p=1;q=1}}while(0);dC(74176,2,6)|0;dC(74176,3,116)|0;dF(74176,0);dF(49512,1);dF(49456,3);dF(49400,4);j=c[18560]|0;dw(74176,0,0,0,(290<<j)+36|0,(226<<j)+24|0,p);p=c[18560]|0;j=226<<p;dY(49512,74176,12,12,j,j,1250<<p,2274<<p,320<<p,240<<p,q);q=c[18560]|0;dK(49456,74176,(226<<q)+24|0,(98<<q)+12|0,64<<q,128<<q);dK(49400,0,0,0,250,240);dQ(74176,48312);dO(74176,dx(74176,65535,65535,65535)|0);dP(74176,dx(74176,0,0,0)|0);dN(74176);dO(49512,dx(74176,65535,65535,65535)|0);dP(49512,dx(74176,0,0,0)|0);dx(74176,0,0,0)|0;dO(49456,dx(74176,65535,65535,65535)|0);dP(49456,dx(74176,0,0,0)|0);dx(74176,0,0,0)|0;dQ(49400,48312);dO(49400,dx(74176,65535,65535,5e4)|0);dP(49400,dx(74176,0,0,0)|0);dN(49400);c[19718]=bn(0)|0;de();eq(e|0,0,140);c[e>>2]=24;bc(14,e|0,0)|0;a4(2,1e3/(c[42918]|0)|0|0,0);i=d;return 0}function bY(b){b=b|0;a[49392]=0;return}function bZ(){dt(74176);aw(8,74176,m|0)|0;dV(49512);aw(36,49512,m|0)|0;dH(49456);aw(12,49456,m|0)|0;dH(49400);aw(12,49400,m|0)|0;return}function b_(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+8|0;e=a+12|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,0,-300,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,200,-200,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,300,0,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,200,200,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,0,300,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,-200,200,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,-300,0,0)|0;cJ(b,c[d>>2]>>6,c[e>>2]>>6,-200,-200,0)|0;return}function b$(a){a=a|0;c[a+24>>2]=1;c[a+40>>2]=-1;return}function b0(a){a=a|0;var b=0;if((c[a+52>>2]|0)>144){c[a+4>>2]=0}b=a+24|0;a=(c[b>>2]|0)+1|0;c[b>>2]=(a|0)>8?1:a;return}function b1(a){a=a|0;var b=0;c[a+36>>2]=500;c[a+40>>2]=255;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+24>>2]=((b>>>0)%3|0)+1;return}function b2(a){a=a|0;return}function b3(a){a=a|0;c[a+36>>2]=500;c[a+40>>2]=1;c[a+24>>2]=1;return}function b4(a){a=a|0;return}function b5(a){a=a|0;c[a+36>>2]=500;c[a+40>>2]=1;c[a+24>>2]=1;return}function b6(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=c[a+44>>2]|0;d=-b|0;e=(b|0)>-1?b:d;b=c[a+48>>2]|0;f=-b|0;g=(b|0)>-1?b:f;do{if(!((e|0)<100&(g|0)<30)){if((e|0)<30&(g|0)<100){break}return}}while(0);g=(d<<3|0)/3|0;d=(f<<3|0)/3|0;f=d>>4;e=g+f|0;b=g>>4;h=d-b|0;i=g-f|0;f=d+b|0;b=e+(h>>4)|0;d=h-(e>>4)|0;e=i-(f>>4)|0;h=f+(i>>4)|0;i=b+(d>>4)|0;f=d-(b>>4)|0;b=e-(h>>4)|0;d=h+(e>>4)|0;e=a+8|0;h=a+12|0;cJ(47760,c[e>>2]>>6,c[h>>2]>>6,i+(f>>4)|0,f-(i>>4)|0,0)|0;cJ(47760,c[e>>2]>>6,c[h>>2]>>6,b-(d>>4)|0,d+(b>>4)|0,0)|0;c[a+4>>2]=0;return}function b7(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=c[a+44>>2]|0;d=-b|0;e=(b|0)>-1?b:d;b=c[a+48>>2]|0;f=-b|0;g=(b|0)>-1?b:f;do{if(!((e|0)<100&(g|0)<20)){if((e|0)<20&(g|0)<100){break}return}}while(0);g=(d<<3|0)/3|0;d=(f<<3|0)/3|0;f=d>>4;e=g+f|0;b=g>>4;h=d-b|0;i=g-f|0;f=b+d|0;b=e+(h>>4)|0;j=h-(e>>4)|0;e=i-(f>>4)|0;h=(i>>4)+f|0;f=b+(j>>4)|0;i=j-(b>>4)|0;b=e-(h>>4)|0;j=(e>>4)+h|0;h=f+(i>>4)|0;e=i-(f>>4)|0;f=b-(j>>4)|0;i=(b>>4)+j|0;j=h+(e>>4)|0;b=e-(h>>4)|0;h=f-(i>>4)|0;e=(f>>4)+i|0;i=j+(b>>4)|0;f=b-(j>>4)|0;j=h-(e>>4)|0;b=(h>>4)+e|0;e=i+(f>>4)|0;h=f-(i>>4)|0;k=j-(b>>4)|0;l=(j>>4)+b|0;m=e+(h>>4)|0;n=h-(e>>4)|0;e=k-(l>>4)|0;h=(k>>4)+l|0;l=m+(n>>4)|0;k=n-(m>>4)|0;m=e-(h>>4)|0;n=(e>>4)+h|0;h=l+(k>>4)|0;e=k-(l>>4)|0;l=m-(n>>4)|0;k=(m>>4)+n|0;n=h+(e>>4)|0;m=e-(h>>4)|0;h=l-(k>>4)|0;e=(l>>4)+k|0;k=a+8|0;l=a+12|0;cJ(47760,c[k>>2]>>6,c[l>>2]>>6,g,d,0)|0;cJ(47760,c[k>>2]>>6,c[l>>2]>>6,n+(m>>4)|0,m-(n>>4)|0,0)|0;cJ(47760,c[k>>2]>>6,c[l>>2]>>6,h-(e>>4)|0,(h>>4)+e|0,0)|0;cJ(47760,c[k>>2]>>6,c[l>>2]>>6,i,f,0)|0;cJ(47760,c[k>>2]>>6,c[l>>2]>>6,j,b,0)|0;c[a+4>>2]=0;return}function b8(a){a=a|0;c[a+24>>2]=0;c[a+40>>2]=-1;return}function b9(a){a=a|0;var b=0,d=0;b=a+24|0;d=(c[b>>2]|0)+1|0;c[b>>2]=d;if((d|0)<=8){return}c[a+4>>2]=0;return}function ca(a){a=a|0;var b=0,d=0;c[a+36>>2]=0;c[a+40>>2]=1;b=a+32|0;c[b>>2]=(c[38160]|0)-1;d=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=d;c[a+28>>2]=d&c[b>>2];return}function cb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=a+36|0;d=(c[b>>2]|0)+1&c[a+32>>2];c[b>>2]=d;if((d|0)!=(c[a+28>>2]|0)){return}if((c[a+52>>2]|0)>=121){return}d=c[38156]|0;b=c[a+44>>2]|0;e=c[a+48>>2]|0;f=(ab(c[19718]|0,1566083941)|0)+1|0;g=(ab(f,1566083941)|0)+1|0;c[19718]=g;h=(d|0)!=47760|0;i=(f&15)-b<<h;b=(g&15)-e<<h;cJ(d,i+(c[a+8>>2]|0)>>6,b+(c[a+12>>2]|0)>>6,i,b,0)|0;return}function cc(a){a=a|0;var b=0,d=0;c[a+36>>2]=0;c[a+40>>2]=1;b=a+32|0;c[b>>2]=(c[38158]|0)-1;d=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=d;c[a+28>>2]=d&c[b>>2];return}function cd(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+36|0;d=(c[b>>2]|0)+1&c[a+32>>2];c[b>>2]=d;if((d|0)!=(c[a+28>>2]|0)){return}if((c[a+52>>2]|0)>=121){return}d=c[38154]|0;b=(d|0)!=47760|0;e=-(c[a+44>>2]|0)<<b;f=-(c[a+48>>2]|0)<<b;cJ(d,(c[a+8>>2]|0)+e>>6,(c[a+12>>2]|0)+f>>6,e,f,0)|0;return}function ce(a){a=a|0;c[a+40>>2]=-1;c[a+36>>2]=4;c[a+28>>2]=0;return}function cf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+52|0;d=a+36|0;do{if((c[b>>2]|0)<145){if((c[d>>2]|0)!=1){break}e=c[a+8>>2]>>6;f=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=f;g=e-8+(f>>>28)|0;e=c[a+12>>2]>>6;h=(ab(f,1566083941)|0)+1|0;c[19718]=h;f=e-8+(h>>>28)|0;cJ(47120,g,f,0,0,0)|0}}while(0);f=(c[d>>2]|0)+1|0;c[d>>2]=f;if((f|0)<4){return}c[d>>2]=0;d=a+8|0;f=(c[d>>2]|0)>>>10&63;g=a+12|0;h=(c[g>>2]|0)>>>10&127;e=c9(f,h)|0;if((e|0)==0){c[a+4>>2]=0;return}if((c[b>>2]|0)<145){b=c[d>>2]>>6;i=c[g>>2]>>6;cJ(47120,b,i,0,0,0)|0}i=a+28|0;b=c[i>>2]^e;j=(b|0)==1;k=(b|0)==2;l=(b|0)==4;m=(b|0)==8;n=m?2:l?1:k?8:j?4:0;if((n|0)!=0){da(f,h,0);c[d>>2]=(c[d>>2]|0)+(m?-1024:k?1024:0);c[g>>2]=(c[g>>2]|0)+(l?1024:j?-1024:0);c[i>>2]=n;return}if((e|0)!=16){da(f,h,b)}c[a+4>>2]=0;return}function cg(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;d=a+12|0;da((c[b>>2]|0)>>>10&63,(c[d>>2]|0)>>>10&127,0);c[a+40>>2]=-1;c[a+36>>2]=4;e=c[a+24>>2]|0;if((e|0)==7){c[a+28>>2]=2;c[b>>2]=(c[b>>2]|0)-1024;return}else if((e|0)==1){c[a+28>>2]=4;c[d>>2]=(c[d>>2]|0)-1024;return}else if((e|0)==3){c[a+28>>2]=8;c[b>>2]=(c[b>>2]|0)+1024;return}else if((e|0)==5){c[a+28>>2]=1;c[d>>2]=(c[d>>2]|0)+1024;return}else{return}}function ch(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+52|0;d=a+36|0;do{if((c[b>>2]|0)<145){if((c[d>>2]|0)!=1){break}e=c[a+8>>2]>>6;f=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=f;g=e-8+(f>>>28)|0;e=c[a+12>>2]>>6;h=(ab(f,1566083941)|0)+1|0;c[19718]=h;f=e-8+(h>>>28)|0;cJ(47120,g,f,0,0,0)|0}}while(0);f=(c[d>>2]|0)+1|0;c[d>>2]=f;if((f|0)<4){return}c[d>>2]=0;d=a+8|0;f=(c[d>>2]|0)>>>10&63;g=a+12|0;h=(c[g>>2]|0)>>>10&127;e=c9(f,h)|0;if((e|0)==0){c[a+4>>2]=0;return}if((c[b>>2]|0)<145){b=c[d>>2]>>6;i=c[g>>2]>>6;cJ(47120,b,i,0,0,0)|0}i=a+28|0;b=c[i>>2]|0;if((e|0)==(b|0)){dm(30);c[a+4>>2]=0;cK(f,h)|0;da(f,h,0);return}j=b^e;if((j|0)==32){c[a+4>>2]=0;da(f,h,0);return}else if((j|0)==1){k=-1024;l=4}else{k=0;l=0}b=(j|0)==2;m=(j|0)==4;n=(j|0)==8;j=n?2:m?1:b?8:l;da(f,h,0);if((j|0)!=0){c[d>>2]=(c[d>>2]|0)+(n?-1024:b?1024:0);c[g>>2]=(c[g>>2]|0)+(m?1024:k);c[i>>2]=j;return}j=c[i>>2]^e;if((j&1|0)!=0){e=c[d>>2]>>6;i=c[g>>2]>>6;cJ(47040,e,i,0,0,1)|0}if((j&2|0)!=0){i=c[d>>2]>>6;e=c[g>>2]>>6;cJ(47040,i,e,0,0,3)|0}if((j&4|0)!=0){e=c[d>>2]>>6;i=c[g>>2]>>6;cJ(47040,e,i,0,0,5)|0}if((j&8|0)!=0){j=c[d>>2]>>6;d=c[g>>2]>>6;cJ(47040,j,d,0,0,7)|0}dm(10);c[a+4>>2]=0;return}function ci(a){a=a|0;c[a+24>>2]=1;c[a+40>>2]=1;return}function cj(a){a=a|0;ck(a,2,256);return}function ck(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=c[a+44>>2]|0;do{if((e|0)>0){f=a+16|0;g=c[f>>2]|0;if((g|0)<=(-d|0)){break}c[f>>2]=g-b}else{if((e|0)>=0){break}g=a+16|0;f=c[g>>2]|0;if((f|0)>=(d|0)){break}c[g>>2]=f+b}}while(0);e=c[a+48>>2]|0;do{if((e|0)>0){f=a+20|0;g=c[f>>2]|0;if((g|0)<=(-d|0)){h=g;break}i=g-b|0;c[f>>2]=i;h=i}else{i=a+20|0;f=c[i>>2]|0;if(!((e|0)<0&(f|0)<(d|0))){h=f;break}g=f+b|0;c[i>>2]=g;h=g}}while(0);b=c[a+16>>2]|0;d=-b|0;e=(b|0)>(d|0)?b:d;g=-h|0;i=(h|0)>(g|0)?h:g;f=(e|0)>(i|0)?e:i;if((f|0)==(b|0)){i=b>>1;if((i|0)<(h|0)){c[a+24>>2]=4;return}e=a+24|0;if((i|0)<(g|0)){c[e>>2]=2;return}else{c[e>>2]=3;return}}if((f|0)==(d|0)){e=d>>1;if((e|0)<(h|0)){c[a+24>>2]=6;return}i=a+24|0;if((e|0)<(g|0)){c[i>>2]=8;return}else{c[i>>2]=7;return}}i=f>>1;g=(i|0)<(b|0);if((f|0)==(h|0)){if(g){c[a+24>>2]=4;return}h=a+24|0;if((i|0)<(d|0)){c[h>>2]=6;return}else{c[h>>2]=5;return}}else{if(g){c[a+24>>2]=2;return}g=a+24|0;if((i|0)<(d|0)){c[g>>2]=8;return}else{c[g>>2]=1;return}}}function cl(a){a=a|0;var b=0;c[a+24>>2]=1;c[a+40>>2]=1;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+36>>2]=b&63;return}function cm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;ck(a,4,192);b=a+36|0;d=(c[b>>2]|0)-1|0;c[b>>2]=d;if((d|0)>=1){return}if((c[a+52>>2]|0)<121){d=-(c[a+44>>2]|0)<<1;e=-(c[a+48>>2]|0)<<1;f=(c[a+8>>2]|0)+d>>6;g=(c[a+12>>2]|0)+e>>6;cJ(47760,f,g,d,e,0)|0}c[b>>2]=32;return}function cn(a){a=a|0;c[a+24>>2]=1;c[a+40>>2]=1;return}function co(a){a=a|0;ck(a,32,96);return}function cp(a){a=a|0;c[a+24>>2]=1;c[a+40>>2]=1;return}function cq(a){a=a|0;ck(a,4,96);return}function cr(a){a=a|0;var b=0;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+36>>2]=b&127;c[a+24>>2]=1;c[a+40>>2]=1;c[a+28>>2]=0;return}function cs(a){a=a|0;var b=0,d=0,e=0;b=a+28|0;d=a+52|0;e=c[d>>2]|0;do{if((c[b>>2]|0)==0){if((e|0)>81){ck(a,6,192);break}else{c[b>>2]=1;break}}else{if((e|0)<226){ct(a,4,192);break}else{c[b>>2]=0;break}}}while(0);b=a+36|0;e=(c[b>>2]|0)-1|0;c[b>>2]=e;if((e|0)>=1){return}c[b>>2]=8;if((c[d>>2]|0)<=81){return}d=c[a+44>>2]|0;b=c[a+48>>2]|0;cJ(47760,(c[a+8>>2]|0)-d>>6,(c[a+12>>2]|0)-b>>6,-d|0,-b|0,0)|0;return}function ct(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=c[a+48>>2]|0;f=6-b|0;g=e<<f;h=-g|0;i=a+16|0;c[i>>2]=h;j=c[a+44>>2]|0;k=j<<f;f=a+20|0;c[f>>2]=k;do{if((j|0)>0){if((h|0)<=(-d|0)){l=h;break}m=h-b|0;c[i>>2]=m;l=m}else{if(!((j|0)<0&(h|0)<(d|0))){l=h;break}m=b-g|0;c[i>>2]=m;l=m}}while(0);do{if((e|0)>0){if((k|0)<=(-d|0)){n=k;break}i=k-b|0;c[f>>2]=i;n=i}else{if(!((e|0)<0&(k|0)<(d|0))){n=k;break}i=k+b|0;c[f>>2]=i;n=i}}while(0);f=-l|0;b=(l|0)>(f|0)?l:f;k=-n|0;d=(n|0)>(k|0)?n:k;e=(b|0)>(d|0)?b:d;if((e|0)==(l|0)){d=l>>1;if((d|0)<(n|0)){c[a+24>>2]=4;return}b=a+24|0;if((d|0)<(k|0)){c[b>>2]=2;return}else{c[b>>2]=3;return}}if((e|0)==(f|0)){b=f>>1;if((b|0)<(n|0)){c[a+24>>2]=6;return}d=a+24|0;if((b|0)<(k|0)){c[d>>2]=8;return}else{c[d>>2]=7;return}}d=e>>1;k=(d|0)<(l|0);if((e|0)==(n|0)){if(k){c[a+24>>2]=4;return}n=a+24|0;if((d|0)<(f|0)){c[n>>2]=6;return}else{c[n>>2]=5;return}}else{if(k){c[a+24>>2]=2;return}k=a+24|0;if((d|0)<(f|0)){c[k>>2]=8;return}else{c[k>>2]=1;return}}}function cu(a){a=a|0;var b=0,d=0,e=0;b=a+28|0;d=a+52|0;e=c[d>>2]|0;do{if((c[b>>2]|0)==0){if((e|0)>113){ck(a,6,192);break}else{c[b>>2]=1;break}}else{if((e|0)<226){ct(a,5,192);break}else{c[b>>2]=0;break}}}while(0);b=a+36|0;e=(c[b>>2]|0)-1|0;c[b>>2]=e;if((e|0)>=1){return}c[b>>2]=128;if((c[d>>2]|0)<=81){return}d=c[a+44>>2]|0;b=c[a+48>>2]|0;cJ(47760,(c[a+8>>2]|0)-d>>6,(c[a+12>>2]|0)-b>>6,-d|0,-b|0,0)|0;return}function cv(a){a=a|0;var b=0,d=0,e=0;b=a+28|0;d=a+52|0;e=c[d>>2]|0;do{if((c[b>>2]|0)==0){if((e|0)>81){ck(a,6,192);break}else{c[b>>2]=1;break}}else{if((e|0)<226){cw(a,4,192);break}else{c[b>>2]=0;break}}}while(0);b=a+36|0;e=(c[b>>2]|0)-1|0;c[b>>2]=e;if((e|0)>=1){return}c[b>>2]=8;if((c[d>>2]|0)<=81){return}d=c[a+44>>2]|0;b=c[a+48>>2]|0;cJ(47760,(c[a+8>>2]|0)-d>>6,(c[a+12>>2]|0)-b>>6,-d|0,-b|0,0)|0;return}function cw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=c[a+48>>2]|0;f=6-b|0;g=e<<f;h=a+16|0;c[h>>2]=g;i=c[a+44>>2]|0;j=i<<f;f=-j|0;k=a+20|0;c[k>>2]=f;do{if((i|0)>0){if((g|0)<=(-d|0)){l=g;break}m=g-b|0;c[h>>2]=m;l=m}else{if(!((i|0)<0&(g|0)<(d|0))){l=g;break}m=g+b|0;c[h>>2]=m;l=m}}while(0);do{if((e|0)>0){if((f|0)<=(-d|0)){n=f;break}h=f-b|0;c[k>>2]=h;n=h}else{if(!((e|0)<0&(f|0)<(d|0))){n=f;break}h=b-j|0;c[k>>2]=h;n=h}}while(0);k=-l|0;j=(l|0)>(k|0)?l:k;b=-n|0;f=(n|0)>(b|0)?n:b;d=(j|0)>(f|0)?j:f;if((d|0)==(l|0)){f=l>>1;if((f|0)<(n|0)){c[a+24>>2]=4;return}j=a+24|0;if((f|0)<(b|0)){c[j>>2]=2;return}else{c[j>>2]=3;return}}if((d|0)==(k|0)){j=k>>1;if((j|0)<(n|0)){c[a+24>>2]=6;return}f=a+24|0;if((j|0)<(b|0)){c[f>>2]=8;return}else{c[f>>2]=7;return}}f=d>>1;b=(f|0)<(l|0);if((d|0)==(n|0)){if(b){c[a+24>>2]=4;return}n=a+24|0;if((f|0)<(k|0)){c[n>>2]=6;return}else{c[n>>2]=5;return}}else{if(b){c[a+24>>2]=2;return}b=a+24|0;if((f|0)<(k|0)){c[b>>2]=8;return}else{c[b>>2]=1;return}}}function cx(a){a=a|0;var b=0;c[a+24>>2]=1;c[a+40>>2]=26;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+36>>2]=b&15;return}function cy(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;ck(a,3,128);c[a+24>>2]=1;b=a+36|0;d=c[b>>2]|0;c[b>>2]=d-1;do{if((d|0)<1){c[b>>2]=4;if((c[a+52>>2]|0)>=97){break}e=-(c[a+44>>2]|0)<<2;f=-(c[a+48>>2]|0)<<2;g=(c[a+8>>2]|0)+e>>6;h=(c[a+12>>2]|0)+f>>6;cJ(47560,g,h,e,f,0)|0}}while(0);if((c[a+40>>2]|0)>=10){return}b_(a,47520);c[a+4>>2]=0;return}function cz(a){a=a|0;var b=0;c[a+24>>2]=1;c[a+40>>2]=26;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+36>>2]=b&15;return}function cA(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;ck(a,3,128);c[a+24>>2]=1;b=a+36|0;d=c[b>>2]|0;c[b>>2]=d-1;do{if((d|0)<1){c[b>>2]=8;if((c[a+52>>2]|0)>=121){break}e=c[a+44>>2]|0;f=c[a+48>>2]|0;g=(ab(c[19718]|0,1566083941)|0)+1|0;h=(ab(g,1566083941)|0)+1|0;c[19718]=h;i=(g&63)-e<<2;e=(h&63)-f<<2;if((i|0)>192){j=192}else{j=(i|0)<-192?-192:i}if((e|0)>192){k=192}else{k=(e|0)<-192?-192:e}e=(c[a+8>>2]|0)+j>>6;i=(c[a+12>>2]|0)+k>>6;cJ(47520,e,i,j,k,0)|0}}while(0);if((c[a+40>>2]|0)>=10){return}b_(a,47680);c[a+4>>2]=0;return}function cB(a){a=a|0;var b=0;c[a+24>>2]=1;c[a+40>>2]=26;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+36>>2]=b&15;return}function cC(a){a=a|0;var b=0,d=0;ck(a,3,128);c[a+24>>2]=1;b=a+36|0;d=c[b>>2]|0;c[b>>2]=d-1;do{if((d|0)<1){c[b>>2]=64;if((c[a+52>>2]|0)>=121){break}b_(a,47680)}}while(0);if((c[a+40>>2]|0)>=10){return}b_(a,46960);c[a+4>>2]=0;return}function cD(a){a=a|0;var b=0;c[a+24>>2]=1;c[a+40>>2]=26;b=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=b;c[a+36>>2]=b&15;return}function cE(a){a=a|0;var b=0,d=0,e=0;ck(a,2,96);c[a+24>>2]=1;b=a+36|0;d=c[b>>2]|0;c[b>>2]=d-1;do{if((d|0)<1){c[b>>2]=64;if((c[a+52>>2]|0)>=121){break}e=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=e;b_(a,c[48800+((e&7)<<2)>>2]|0)}}while(0);if((c[a+40>>2]|0)>=10){return}b_(a,46960);c[a+4>>2]=0;return}function cF(){var a=0;a=78888;do{c[a+4>>2]=0;a=a+72|0;}while(a>>>0<152616>>>0);c[19720]=78888;c[38156]=0;c[38154]=0;c[38160]=1;c[38158]=1;return 0}function cG(){var a=0,b=0,d=0,e=0,f=0;a=78888;do{b=a+4|0;d=c[b>>2]|0;if((d|0)==1){c[b>>2]=2;e=380}else if((d|0)==2){e=380}if((e|0)==380){e=0;c[19720]=a}a=a+72|0;}while(a>>>0<152616>>>0);if((c[19720]|0)>>>0<78888>>>0){return}else{f=78888}do{cH(f);f=f+72|0;}while(f>>>0<=(c[19720]|0)>>>0);return}function cH(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;if((c[a+4>>2]|0)!=2){return}b=a+8|0;d=(c[b>>2]|0)+(c[a+16>>2]|0)|0;c[b>>2]=d;e=a+12|0;f=(c[e>>2]|0)+(c[a+20>>2]|0)|0;c[e>>2]=f;g=(d>>6)-(c[42330]|0)|0;h=a+44|0;c[h>>2]=g;i=(f>>6)-(c[42328]|0)|0;j=a+48|0;c[j>>2]=i;if((g|0)>512){k=g-1024|0;c[h>>2]=k;l=d-65536|0;c[b>>2]=l;m=k;n=l}else{m=g;n=d}if((m|0)<-512){d=m+1024|0;c[h>>2]=d;c[b>>2]=n+65536;o=d}else{o=m}if((i|0)>1024){m=i-2048|0;c[j>>2]=m;d=f-131072|0;c[e>>2]=d;p=m;q=d}else{p=i;q=f}if((p|0)<-1024){f=p+2048|0;c[j>>2]=f;c[e>>2]=q+131072;r=f}else{r=p}p=(o|0)>-1?o:-o|0;o=(r|0)>-1?r:-r|0;r=a+52|0;c[r>>2]=(p|0)>(o|0)?p:o;o=(c[a>>2]|0)+12|0;p=a+(c[o+4>>2]|0)|0;f=c[o>>2]|0;if((f&1|0)==0){s=f}else{s=c[(c[p>>2]|0)+(f-1)>>2]|0}bu[s&255](p);p=a+56|0;s=c[p>>2]|0;do{if((s|0)>-1){if((c[r>>2]|0)>=(s+5|0)){break}cS()}}while(0);if((c[a+40>>2]|0)<0){return}if((c[r>>2]|0)>120){return}if((cU(c[b>>2]>>6,c[e>>2]>>6,(c[p>>2]|0)+5|0)|0)==0){return}cN(a);return}function cI(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;a=c[19720]|0;b=a>>>0<78888>>>0;if((c[18560]|0)==0){if(b){return}else{d=78888;e=a}while(1){do{if((c[d+4>>2]|0)==2){f=c[d+68>>2]|0;if((f|0)==0){g=e;break}if((c[d+52>>2]|0)>=121){g=e;break}h=f>>1;i=c[18542]|0;if(i>>>0>=74168>>>0){g=e;break}j=(c[d+12>>2]>>6)-h|0;k=(c[d+8>>2]>>6)-h|0;h=c[d+64>>2]<<4;c[i>>2]=((c[d+60>>2]|0)+(c[d+24>>2]|0)<<4)-16;c[(c[18542]|0)+4>>2]=h;c[(c[18542]|0)+8>>2]=k;c[(c[18542]|0)+12>>2]=j;c[(c[18542]|0)+16>>2]=f;c[(c[18542]|0)+20>>2]=f;c[18542]=(c[18542]|0)+24;g=c[19720]|0}else{g=e}}while(0);f=d+72|0;if(f>>>0>g>>>0){break}else{d=f;e=g}}return}else{if(b){return}else{l=78888;m=a}while(1){do{if((c[l+4>>2]|0)==2){a=c[l+68>>2]|0;if((a|0)==0){n=m;break}if((c[l+52>>2]|0)>=121){n=m;break}b=c[18560]|0;g=b+4|0;e=a<<b;d=a>>1;a=c[18542]|0;if(a>>>0>=74168>>>0){n=m;break}f=(c[l+12>>2]>>6)-d<<b;j=(c[l+8>>2]>>6)-d<<b;b=c[l+64>>2]<<g;c[a>>2]=(c[l+24>>2]|0)-1+(c[l+60>>2]|0)<<g;c[(c[18542]|0)+4>>2]=b;c[(c[18542]|0)+8>>2]=j;c[(c[18542]|0)+12>>2]=f;c[(c[18542]|0)+16>>2]=e;c[(c[18542]|0)+20>>2]=e;c[18542]=(c[18542]|0)+24;n=c[19720]|0}else{n=m}}while(0);e=l+72|0;if(e>>>0>n>>>0){break}else{l=e;m=n}}return}}function cJ(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=78888;while(1){if(h>>>0>=152616>>>0){i=1;j=439;break}k=h+4|0;if((c[k>>2]|0)==0){break}else{h=h+72|0}}if((j|0)==439){return i|0}c[k>>2]=1;c[h>>2]=a;c[h+8>>2]=b<<6;c[h+12>>2]=d<<6;c[h+24>>2]=g;c[h+16>>2]=e;c[h+20>>2]=f;c[h+28>>2]=0;c[h+32>>2]=0;c[h+36>>2]=0;c[h+40>>2]=1;c[h+56>>2]=c[a+20>>2];c[h+60>>2]=c[a+24>>2];c[h+64>>2]=c[a+28>>2];c[h+68>>2]=c[a+32>>2];f=a+4|0;a=h+(c[f+4>>2]|0)|0;h=c[f>>2]|0;if((h&1|0)==0){l=h}else{l=c[(c[a>>2]|0)+(h-1)>>2]|0}bu[l&255](a);i=0;return i|0}function cK(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=0;e=78888;do{f=e+4|0;do{if((c[f>>2]|0)==0){g=0}else{if((c[e>>2]|0)!=47640){g=0;break}if(((c[e+8>>2]|0)>>>10&63|0)!=(a|0)){g=0;break}if(((c[e+12>>2]|0)>>>10&127|0)!=(b|0)){g=0;break}c[f>>2]=0;g=1}}while(0);d=g+d|0;e=e+72|0;}while(e>>>0<152616>>>0);if((d|0)==0){return d|0}c2(a,b);return d|0}function cL(){var a=0,b=0,d=0,e=0;a=0;b=78888;do{do{if((c[b+4>>2]|0)==0){d=0}else{e=c[b>>2]|0;if((e|0)==47080){d=1;break}d=(e|0)==47040|0}}while(0);a=d+a|0;b=b+72|0;}while(b>>>0<152616>>>0);return a|0}function cM(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;c[38156]=a;c[38154]=d;c[38160]=b;c[38158]=e;return}function cN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;b=a+40|0;d=(c[b>>2]|0)-1|0;c[b>>2]=d;if((d|0)>0){return}d=a|0;dm(c[c[d>>2]>>2]|0);b=c[d>>2]|0;if((b|0)==47640){d=c[a+8>>2]&-64;e=c[a+12>>2]&-64;f=78888;while(1){if(f>>>0>=152616>>>0){break}g=f+4|0;if((c[g>>2]|0)==0){h=465;break}else{f=f+72|0}}if((h|0)==465){c[g>>2]=1;c[f>>2]=47080;c[f+8>>2]=d;c[f+12>>2]=e;eq(f+16|0,0,24);c[f+40>>2]=1;c[f+56>>2]=c[11775];c[f+60>>2]=c[11776];c[f+64>>2]=c[11777];c[f+68>>2]=c[11778];e=47084;d=f+(c[e+4>>2]|0)|0;f=c[e>>2]|0;if((f&1|0)==0){i=f}else{i=c[(c[d>>2]|0)+(f-1)>>2]|0}bu[i&255](d)}c[a+4>>2]=0;return}d=a+8|0;i=c[d>>2]|0;f=i>>6;e=a+12|0;g=c[e>>2]|0;j=g>>6;if((b|0)==47600){k=78888}else{b=78888;while(1){if(b>>>0>=152616>>>0){break}l=b+4|0;if((c[l>>2]|0)==0){h=508;break}else{b=b+72|0}}if((h|0)==508){c[l>>2]=1;c[b>>2]=47120;c[b+8>>2]=f<<6;c[b+12>>2]=j<<6;eq(b+16|0,0,24);c[b+40>>2]=1;c[b+56>>2]=c[11785];c[b+60>>2]=c[11786];c[b+64>>2]=c[11787];c[b+68>>2]=c[11788];l=47124;m=b+(c[l+4>>2]|0)|0;b=c[l>>2]|0;if((b&1|0)==0){n=b}else{n=c[(c[m>>2]|0)+(b-1)>>2]|0}bu[n&255](m)}c[a+4>>2]=0;return}while(1){if(k>>>0>=152616>>>0){o=i;p=g;break}q=k+4|0;if((c[q>>2]|0)==0){h=473;break}else{k=k+72|0}}if((h|0)==473){c[q>>2]=1;c[k>>2]=47040;c[k+8>>2]=f<<6;c[k+12>>2]=j<<6;c[k+24>>2]=3;c[k+16>>2]=0;c[k+20>>2]=0;c[k+28>>2]=0;c[k+32>>2]=0;c[k+36>>2]=0;c[k+40>>2]=1;c[k+56>>2]=c[11765];c[k+60>>2]=c[11766];c[k+64>>2]=c[11767];c[k+68>>2]=c[11768];j=47044;f=k+(c[j+4>>2]|0)|0;k=c[j>>2]|0;if((k&1|0)==0){r=k}else{r=c[(c[f>>2]|0)+(k-1)>>2]|0}bu[r&255](f);o=c[d>>2]|0;p=c[e>>2]|0}f=o&-64;r=p&-64;k=78888;while(1){if(k>>>0>=152616>>>0){s=o;t=p;break}u=k+4|0;if((c[u>>2]|0)==0){h=480;break}else{k=k+72|0}}if((h|0)==480){c[u>>2]=1;c[k>>2]=47040;c[k+8>>2]=f;c[k+12>>2]=r;c[k+24>>2]=7;c[k+16>>2]=0;c[k+20>>2]=0;c[k+28>>2]=0;c[k+32>>2]=0;c[k+36>>2]=0;c[k+40>>2]=1;c[k+56>>2]=c[11765];c[k+60>>2]=c[11766];c[k+64>>2]=c[11767];c[k+68>>2]=c[11768];r=47044;f=k+(c[r+4>>2]|0)|0;k=c[r>>2]|0;if((k&1|0)==0){v=k}else{v=c[(c[f>>2]|0)+(k-1)>>2]|0}bu[v&255](f);s=c[d>>2]|0;t=c[e>>2]|0}f=s&-64;v=t&-64;k=78888;while(1){if(k>>>0>=152616>>>0){w=s;x=t;break}y=k+4|0;if((c[y>>2]|0)==0){h=487;break}else{k=k+72|0}}if((h|0)==487){c[y>>2]=1;c[k>>2]=47040;c[k+8>>2]=f;c[k+12>>2]=v;c[k+24>>2]=1;c[k+16>>2]=0;c[k+20>>2]=0;c[k+28>>2]=0;c[k+32>>2]=0;c[k+36>>2]=0;c[k+40>>2]=1;c[k+56>>2]=c[11765];c[k+60>>2]=c[11766];c[k+64>>2]=c[11767];c[k+68>>2]=c[11768];v=47044;f=k+(c[v+4>>2]|0)|0;k=c[v>>2]|0;if((k&1|0)==0){z=k}else{z=c[(c[f>>2]|0)+(k-1)>>2]|0}bu[z&255](f);w=c[d>>2]|0;x=c[e>>2]|0}f=w&-64;z=x&-64;k=78888;while(1){if(k>>>0>=152616>>>0){A=w;B=x;break}C=k+4|0;if((c[C>>2]|0)==0){h=494;break}else{k=k+72|0}}if((h|0)==494){c[C>>2]=1;c[k>>2]=47040;c[k+8>>2]=f;c[k+12>>2]=z;c[k+24>>2]=5;c[k+16>>2]=0;c[k+20>>2]=0;c[k+28>>2]=0;c[k+32>>2]=0;c[k+36>>2]=0;c[k+40>>2]=1;c[k+56>>2]=c[11765];c[k+60>>2]=c[11766];c[k+64>>2]=c[11767];c[k+68>>2]=c[11768];z=47044;f=k+(c[z+4>>2]|0)|0;k=c[z>>2]|0;if((k&1|0)==0){D=k}else{D=c[(c[f>>2]|0)+(k-1)>>2]|0}bu[D&255](f);A=c[d>>2]|0;B=c[e>>2]|0}e=A&-64;A=B&-64;B=78888;while(1){if(B>>>0>=152616>>>0){break}E=B+4|0;if((c[E>>2]|0)==0){h=501;break}else{B=B+72|0}}if((h|0)==501){c[E>>2]=1;c[B>>2]=47120;c[B+8>>2]=e;c[B+12>>2]=A;eq(B+16|0,0,24);c[B+40>>2]=1;c[B+56>>2]=c[11785];c[B+60>>2]=c[11786];c[B+64>>2]=c[11787];c[B+68>>2]=c[11788];A=47124;e=B+(c[A+4>>2]|0)|0;B=c[A>>2]|0;if((B&1|0)==0){F=B}else{F=c[(c[e>>2]|0)+(B-1)>>2]|0}bu[F&255](e)}c[a+4>>2]=0;dh();return}function cO(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=aq(a|0,0,(a=i,i=i+8|0,c[a>>2]=0,a)|0)|0;i=a;if((f|0)==-1){g=-1;i=e;return g|0}else{h=b;j=d}while(1){d=a3(f|0,h|0,j|0)|0;if((d|0)<0){if((c[(bh()|0)>>2]|0)==4){k=h;l=j}else{m=521}}else{m=521}if((m|0)==521){m=0;if((d|0)<1){n=-2;break}k=h+d|0;l=j-d|0}if((l|0)>0){h=k;j=l}else{n=0;break}}while(1){if((aA(f|0)|0)!=-1){continue}if((c[(bh()|0)>>2]|0)!=4){g=n;break}}i=e;return g|0}function cP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=aq(a|0,65,(a=i,i=i+8|0,c[a>>2]=420,a)|0)|0;i=a;if((f|0)==-1){g=-1;i=e;return g|0}else{h=b;j=d}while(1){d=aR(f|0,h|0,j|0)|0;if((d|0)<0){if((c[(bh()|0)>>2]|0)==4){k=h;l=j}else{m=533}}else{m=533}if((m|0)==533){m=0;if((d|0)<1){n=-2;break}k=h+d|0;l=j-d|0}if((l|0)>0){h=k;j=l}else{n=0;break}}while(1){if((aA(f|0)|0)!=-1){continue}if((c[(bh()|0)>>2]|0)!=4){g=n;break}}i=e;return g|0}function cQ(){c[42330]=512;c[42328]=1536;c[42298]=399;c[42296]=1423;c[42324]=0;c[42322]=0;c[42326]=1;c[42300]=0;eq(169248|0,0|0,40|0);eq(169208|0,0|0,40|0);eq(169144|0,0|0,40|0);eq(169104|0,0|0,40|0);return 0}function cR(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;a=c[42370]|0;c[42326]=a;b=c[42330]|0;d=b-113|0;c[42298]=d;e=c[42328]|0;c[42296]=e-113;f=c[42300]|0;L681:do{if((f|0)==0){switch(a|0){case 8:{g=b-115|0;c[42298]=g;c[42296]=e-115;h=g;break L681;break};case 3:{g=b-110|0;c[42298]=g;h=g;break L681;break};case 7:{g=b-116|0;c[42298]=g;h=g;break L681;break};case 5:{c[42296]=e-110;h=d;break L681;break};case 6:{c[42296]=e-111;g=b-115|0;c[42298]=g;h=g;break L681;break};case 1:{c[42296]=e-116;h=d;break L681;break};case 2:{c[42296]=e-115;g=b-111|0;c[42298]=g;h=g;break L681;break};case 4:{g=b-111|0;c[42298]=g;c[42296]=e-111;h=g;break L681;break};default:{h=d;break L681}}}else if((f|0)==1){g=(ab(c[19718]|0,1566083941)|0)+1|0;i=(ab(g,1566083941)|0)+1|0;c[19718]=i;cJ(47120,b-32+(g>>>26)|0,e-32+(i>>>26)|0,0,0,0)|0;h=c[42298]|0}else{h=d}}while(0);c[42324]=0;c[42322]=0;if((h|0)<0){d=h+1024|0;c[42298]=d;c[42324]=1024;j=d;k=1024}else{j=h;k=0}if((j|0)>1023){h=j-1024|0;c[42298]=h;c[42324]=-1024;l=h;m=-1024}else{l=j;m=k}k=c[42296]|0;if((k|0)<0){j=k+2048|0;c[42296]=j;c[42322]=2048;n=j;o=2048}else{n=k;o=0}if((n|0)>2047){k=n-2048|0;c[42296]=k;c[42322]=-2048;p=k;q=-2048}else{p=n;q=o}o=l+113|0;c[42330]=o;l=p+113|0;c[42328]=l;L706:do{if((c[42300]|0)!=0|(c[42374]|0)==0){r=0}else{p=0;while(1){if((p|0)>=10){s=p;break}if((c[169104+(p<<2)>>2]|0)==0){s=p;break}else{p=p+1|0}}do{s=s+1|0;if((s|0)>=10){r=0;break L706}t=169104+(s<<2)|0;}while((c[t>>2]|0)!=0);if((s|0)>9){r=0;break}n=c[42326]|0;c[169144+(p<<2)>>2]=n;c[169248+(p<<2)>>2]=o;c[169208+(p<<2)>>2]=l;c[169104+(p<<2)>>2]=1;c[169144+(s<<2)>>2]=((n|0)>4?-4:4)+n;c[169248+(s<<2)>>2]=o;c[169208+(s<<2)>>2]=l;c[t>>2]=1;r=0}}while(0);do{t=169104+(r<<2)|0;do{if((c[t>>2]|0)!=0){s=169248+(r<<2)|0;n=(c[s>>2]|0)+m|0;c[s>>2]=n;k=169208+(r<<2)|0;j=(c[k>>2]|0)+q|0;c[k>>2]=j;switch(c[169144+(r<<2)>>2]|0){case 3:{h=n+12|0;c[s>>2]=h;u=h;v=j;break};case 4:{h=n+8|0;c[s>>2]=h;d=j+8|0;c[k>>2]=d;u=h;v=d;break};case 1:{d=j-12|0;c[k>>2]=d;u=n;v=d;break};case 2:{d=j-8|0;c[k>>2]=d;h=n+8|0;c[s>>2]=h;u=h;v=d;break};case 5:{d=j+12|0;c[k>>2]=d;u=n;v=d;break};case 6:{d=j+8|0;c[k>>2]=d;h=n-8|0;c[s>>2]=h;u=h;v=d;break};case 7:{d=n-12|0;c[s>>2]=d;u=d;v=j;break};case 8:{d=n-8|0;c[s>>2]=d;s=j-8|0;c[k>>2]=s;u=d;v=s;break};default:{u=n;v=j}}j=u-o|0;if((((j|0)>-1?j:-j|0)|0)<=128){j=v-l|0;if((((j|0)>-1?j:-j|0)|0)<=128){break}}c[t>>2]=0}}while(0);r=r+1|0;}while((r|0)<10);return 0}function cS(){if((c[42300]|0)!=0){return}dg();c[42300]=1;return}function cT(){var a=0,b=0;a=0;do{b=169104+(a<<2)|0;do{if((c[b>>2]|0)!=0){if(((c9((c[169248+(a<<2)>>2]|0)>>>4&63,(c[169208+(a<<2)>>2]|0)>>>4&127)|0)&31|0)==0){break}c[b>>2]=0}}while(0);a=a+1|0;}while((a|0)<10);a=((c9((c[42330]|0)>>>4&63,(c[42328]|0)>>>4&127)|0)&31|0)!=0;if(!(a&(c[42300]|0)==0)){return 0}dg();c[42300]=1;return 0}function cU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=0;L752:while(1){f=169104+(e<<2)|0;do{if((c[f>>2]|0)!=0){g=a-(c[169248+(e<<2)>>2]|0)|0;if((((g|0)>-1?g:-g|0)|0)>=(d|0)){break}g=b-(c[169208+(e<<2)>>2]|0)|0;if((((g|0)>-1?g:-g|0)|0)<(d|0)){break L752}}}while(0);g=e+1|0;if((g|0)<10){e=g}else{h=0;i=609;break}}if((i|0)==609){return h|0}if((c[18572]|0)!=0){h=1;return h|0}c[f>>2]=0;h=1;return h|0}function cV(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;if((c[42300]|0)!=0){return 0}a=c[18560]|0;b=a+4|0;d=16<<a;e=c[18542]|0;if(e>>>0<74168>>>0){f=(c[42328]|0)-8<<a;g=(c[42330]|0)-8<<a;c[e>>2]=(c[42326]|0)-1<<b;c[(c[18542]|0)+4>>2]=3<<b;c[(c[18542]|0)+8>>2]=g;c[(c[18542]|0)+12>>2]=f;c[(c[18542]|0)+16>>2]=d;c[(c[18542]|0)+20>>2]=d;d=(c[18542]|0)+24|0;c[18542]=d;h=0;i=d}else{h=0;i=e}while(1){do{if((c[169104+(h<<2)>>2]|0)==0){j=i}else{e=c[18560]|0;d=e+4|0;f=16<<e;if(i>>>0>=74168>>>0){j=i;break}g=(c[169208+(h<<2)>>2]|0)-8<<e;b=(c[169248+(h<<2)>>2]|0)-8<<e;c[i>>2]=(c[169144+(h<<2)>>2]|0)-1<<d;c[(c[18542]|0)+4>>2]=2<<d;c[(c[18542]|0)+8>>2]=b;c[(c[18542]|0)+12>>2]=g;c[(c[18542]|0)+16>>2]=f;c[(c[18542]|0)+20>>2]=f;f=(c[18542]|0)+24|0;c[18542]=f;j=f}}while(0);f=h+1|0;if((f|0)<10){h=f;i=j}else{break}}i=c[18570]|0;h=c[18568]|0;if((h|i|0)==0){return 0}f=c[18560]|0;g=f+4|0;b=5<<f;if(j>>>0>=74168>>>0){return 0}d=h-2+(c[42328]|0)<<f;h=i-2+(c[42330]|0)<<f;c[j>>2]=15<<g;c[(c[18542]|0)+4>>2]=5<<g;c[(c[18542]|0)+8>>2]=h;c[(c[18542]|0)+12>>2]=d;c[(c[18542]|0)+16>>2]=b;c[(c[18542]|0)+20>>2]=b;c[18542]=(c[18542]|0)+24;return 0}function cW(a,b){a=a|0;b=b|0;c[42330]=a;c[42328]=b;c[42298]=a-113;c[42296]=b-113;return}function cX(){c[42370]=1;c[42376]=0;c[42372]=0;c[42382]=0;c[42378]=0;c[42374]=0;return}function cY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;if((a|0)==65464){c[42382]=1}else if((a|0)==65460){c[42376]=1}else if((a|0)==39){c[42372]=1}else if((a|0)==38){c[42382]=1}else if((a|0)==40){c[42378]=1}else if((a|0)==65458){c[42378]=1}else if((a|0)==65367){c[42388]=1}else if((a|0)==37){c[42376]=1}else if((a|0)==65462){c[42372]=1}else if((a|0)==65457){c[42388]=1}else if((a|0)==65459){c[42386]=1}else if((a|0)==65366){c[42386]=1}else if((a|0)==65463){c[42384]=1}else if((a|0)==65360){c[42384]=1}else if((a|0)==65465){c[42380]=1}else if((a|0)==65365){c[42380]=1}else if((a|0)==16){c[42374]=1}else if((a|0)==113){dj()}else if((a|0)==115){di()}else if((a|0)==109){dk()}else if((a|0)==110){dl()}a=c[42384]|0;b=c[42380]|0;d=c[42388]|0;e=c[42386]|0;f=(c[42376]|0)-(c[42372]|0)+a-b+d-e|0;g=b+a-d-e+(c[42382]|0)-(c[42378]|0)|0;do{if((f|0)>0){if((g|0)>0){c[42370]=8;break}if((g|0)<0){c[42370]=6;break}else{c[42370]=7;break}}else{e=(g|0)>0;if((f|0)>=0){if(e){c[42370]=1;break}if((g|0)>=0){break}c[42370]=5;break}if(e){c[42370]=2;break}if((g|0)<0){c[42370]=4;break}else{c[42370]=3;break}}}while(0);c[18570]=0;c[18568]=0;return}function cZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;if((a|0)==65459){c[42386]=0}else if((a|0)==65366){c[42386]=0}else if((a|0)==65463){c[42384]=0}else if((a|0)==65360){c[42384]=0}else if((a|0)==39){c[42372]=0}else if((a|0)==65465){c[42380]=0}else if((a|0)==65365){c[42380]=0}else if((a|0)==40){c[42378]=0}else if((a|0)==65457){c[42388]=0}else if((a|0)==65464){c[42382]=0}else if((a|0)==65462){c[42372]=0}else if((a|0)==16){c[42374]=0}else if((a|0)==65460){c[42376]=0}else if((a|0)==37){c[42376]=0}else if((a|0)==65367){c[42388]=0}else if((a|0)==65458){c[42378]=0}else if((a|0)==38){c[42382]=0}a=c[42384]|0;b=c[42380]|0;d=c[42388]|0;e=c[42386]|0;f=(c[42376]|0)-(c[42372]|0)+a-b+d-e|0;g=b+a-d-e+(c[42382]|0)-(c[42378]|0)|0;do{if((f|0)>0){if((g|0)>0){c[42370]=8;break}if((g|0)<0){c[42370]=6;break}else{c[42370]=7;break}}else{e=(g|0)>0;if((f|0)>=0){if(e){c[42370]=1;break}if((g|0)>=0){break}c[42370]=5;break}if(e){c[42370]=2;break}if((g|0)<0){c[42370]=4;break}else{c[42370]=3;break}}}while(0);c[18570]=0;c[18568]=0;return}function c_(b){b=b|0;var c=0,d=0;c=0;do{d=0;do{a[(d<<6)+c+(b+8196)|0]=0;d=d+1|0;}while((d|0)<128);c=c+1|0;}while((c|0)<64);return}function c$(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;h=i;i=i+16|0;j=h|0;k=j;l=d-f|0;m=f+d|0;L885:do{if((l|0)<=(m|0)){f=e-g|0;n=g+e|0;if((f|0)>(n|0)){o=l;while(1){o=o+1|0;if((o|0)>(m|0)){break L885}}}else{p=l}do{o=f;do{a[(o<<6)+p+(b+8196)|0]=0;o=o+1|0;}while((o|0)<=(n|0));p=p+1|0;}while((p|0)<=(m|0))}}while(0);p=e<<6;a[p+d+(b+8196)|0]=16;n=b+8192|0;c[n>>2]=0;f=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=f;if((f|0)>-1){f=d-1|0;c[b+(c[n>>2]<<2)>>2]=f;o=c[n>>2]|0;c[n>>2]=o+1;c[b+4096+(o<<2)>>2]=e;a[p+f+(b+8196)|0]=1;f=d+1|0;c[b+(c[n>>2]<<2)>>2]=f;o=c[n>>2]|0;c[n>>2]=o+1;c[b+4096+(o<<2)>>2]=e;a[p+f+(b+8196)|0]=1}else{f=e-1|0;c[b+(c[n>>2]<<2)>>2]=d;p=c[n>>2]|0;c[n>>2]=p+1;c[b+4096+(p<<2)>>2]=f;a[(f<<6)+d+(b+8196)|0]=1;f=e+1|0;c[b+(c[n>>2]<<2)>>2]=d;p=c[n>>2]|0;c[n>>2]=p+1;c[b+4096+(p<<2)>>2]=f;a[(f<<6)+d+(b+8196)|0]=1}if((c[n>>2]|0)==0){i=h;return}d=e-g|0;f=g+e|0;e=j|0;do{g=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=g;p=c[n>>2]|0;o=(g>>>0)%(p>>>0)|0;g=p-1|0;c[n>>2]=g;if((o|0)==(g|0)){q=o}else{p=b+(g<<2)|0;r=c[p>>2]|0;s=c[b+4096+(g<<2)>>2]|0;g=b+(o<<2)|0;c[p>>2]=c[g>>2];p=b+4096+(o<<2)|0;c[b+4096+(c[n>>2]<<2)>>2]=c[p>>2];c[g>>2]=r;c[p>>2]=s;q=c[n>>2]|0}s=c[b+(q<<2)>>2]|0;p=c[b+4096+(q<<2)>>2]|0;eq(k|0,0,16);r=s+2|0;do{if((l|0)>(r|0)|(m|0)<(r|0)){t=0}else{if((d|0)>(p|0)|(f|0)<(p|0)){t=0;break}if((a[(p<<6)+r+(b+8196)|0]|0)==1){t=0;break}c[e>>2]=1;t=1}}while(0);g=p+2|0;o=(l|0)>(s|0)|(m|0)<(s|0);do{if(o){u=t}else{if((d|0)>(g|0)|(f|0)<(g|0)){u=t;break}if((a[(g<<6)+s+(b+8196)|0]|0)==1){u=t;break}c[j+(t<<2)>>2]=2;u=t+1|0}}while(0);v=s-2|0;do{if((l|0)>(v|0)|(m|0)<(v|0)){w=u}else{if((d|0)>(p|0)|(f|0)<(p|0)){w=u;break}if((a[(p<<6)+v+(b+8196)|0]|0)==1){w=u;break}c[j+(u<<2)>>2]=3;w=u+1|0}}while(0);x=p-2|0;do{if(o){y=w}else{if((d|0)>(x|0)|(f|0)<(x|0)){y=w;break}if((a[(x<<6)+s+(b+8196)|0]|0)==1){y=w;break}c[j+(w<<2)>>2]=4;y=w+1|0}}while(0);if((y|0)==0){z=q}else{o=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=o;A=c[j+(((o>>>0)%(y>>>0)|0)<<2)>>2]|0;if((A|0)==1){B=p;C=r}else if((A|0)==2){B=g;C=s}else if((A|0)==3){B=p;C=v}else if((A|0)==4){B=x;C=s}else{B=p;C=s}c[b+(c[n>>2]<<2)>>2]=C;A=c[n>>2]|0;c[n>>2]=A+1;c[b+4096+(A<<2)>>2]=B;a[(B<<6)+C+(b+8196)|0]=1;a[(((B+p|0)/2|0)<<6)+((C+s|0)/2|0)+(b+8196)|0]=1;c[b+(c[n>>2]<<2)>>2]=s;A=c[n>>2]|0;c[n>>2]=A+1;c[b+4096+(A<<2)>>2]=p;a[(p<<6)+s+(b+8196)|0]=1;z=c[n>>2]|0}}while((z|0)!=0);i=h;return}function c0(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=0;while(1){f=e-64|0;g=e+1|0;h=e+64|0;i=(e|0)>0;j=e-1|0;if((e|0)<63){k=0;do{l=k<<6;m=l+e+(b+8196)|0;if((a[m]|0)==1){if((k|0)>0){n=(a[f+l+(b+8196)|0]|0)!=0|0}else{n=0}o=(a[g+l+(b+8196)|0]|0)==0?n:n|2;if((k|0)<127){p=(a[h+l+(b+8196)|0]|0)==0?o:o|4}else{p=o}if(i){q=(a[j+l+(b+8196)|0]|0)==0?p:p|8}else{q=p}l=q&255;do{if((q-1|0)>>>0<2>>>0|(q|0)==4|(q|0)==8){o=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=o;if(o>>>24>>>0>=d>>>0){r=l;break}r=(q|32)&255}else{r=l}}while(0);a[m]=r}k=k+1|0;}while((k|0)<128)}else{k=0;do{l=k<<6;o=l+e+(b+8196)|0;if((a[o]|0)==1){if((k|0)>0){s=(a[f+l+(b+8196)|0]|0)!=0|0;if((k|0)<127){t=s;u=763}else{v=s}}else{t=0;u=763}if((u|0)==763){u=0;v=(a[h+l+(b+8196)|0]|0)==0?t:t|4}if(i){w=(a[j+l+(b+8196)|0]|0)==0?v:v|8}else{w=v}l=w&255;do{if((w-1|0)>>>0<2>>>0|(w|0)==4|(w|0)==8){s=(ab(c[19718]|0,1566083941)|0)+1|0;c[19718]=s;if(s>>>24>>>0>=d>>>0){x=l;break}x=(w|32)&255}else{x=l}}while(0);a[o]=x}k=k+1|0;}while((k|0)<128)}if((g|0)<64){e=g}else{break}}return}function c1(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((c[12340]|0)<0){c[12340]=dx(74176,32768,61440,61440)|0;c[12338]=dx(74176,51200,61440,61440)|0;c[12336]=dx(74176,16384,32768,32768)|0;c[12342]=dx(74176,8192,12288,16384)|0}dO(49456,c[12338]|0);dP(49456,c[12342]|0);dN(49456);a=c[12346]|0;if((a|0)<=0){c[42368]=-1;c[42366]=-1;return}b=0;d=c[12344]|0;e=a;while(1){if((d|0)>0){a=0;do{f=c9(b,a)|0;do{if((f|0)==16){dO(49456,c[12338]|0);g=c[18560]|0;if((g|0)==0){dR(49456,b,a);break}else{h=1<<g;dU(49456,b<<g,a<<g,h,h);break}}else{if((f-1|0)>>>0<2>>>0|(f|0)==4|(f|0)==8){dO(49456,c[12336]|0);h=c[18560]|0;if((h|0)==0){dR(49456,b,a);break}else{g=1<<h;dU(49456,b<<h,a<<h,g,g);break}}if((f&31|0)==0){break}dO(49456,c[12336]|0);g=c[18560]|0;if((g|0)==0){dR(49456,b,a);break}else{h=1<<g;dU(49456,b<<g,a<<g,h,h);break}}}while(0);a=a+1|0;i=c[12344]|0;}while((a|0)<(i|0));j=i;k=c[12346]|0}else{j=d;k=e}a=b+1|0;if((a|0)<(k|0)){b=a;d=j;e=k}else{break}}c[42368]=-1;c[42366]=-1;return}function c2(a,b){a=a|0;b=b|0;var d=0,e=0;dO(49456,c[12342]|0);d=c[18560]|0;if((d|0)==0){dR(49456,a,b);return}else{e=1<<d;dU(49456,a<<d,b<<d,e,e);return}}function c3(){var a=0,b=0,d=0,e=0,f=0,g=0;a=(c[42330]|0)>>>4&63;b=(c[42328]|0)>>>4&127;if((a|0)==(c[42368]|0)&(b|0)==(c[42366]|0)){return}if((c9(a,b)|0)!=0){return}dO(49456,c[12340]|0);d=c[18560]|0;if((d|0)==0){dR(49456,a,b)}else{e=1<<d;dU(49456,a<<d,b<<d,e,e)}do{if((c[42368]|0)>-1){dO(49456,c[12342]|0);e=c[42368]|0;d=c[42366]|0;f=c[18560]|0;if((f|0)==0){dR(49456,e,d);break}else{g=1<<f;dU(49456,e<<f,d<<f,g,g);break}}}while(0);c[42368]=a;c[42366]=b;return}function c4(){var a=0;a=0;while(1){if((c[240+(a*916|0)>>2]|0)==-1){break}else{a=a+1|0}}c[38164]=a;if((c[12334]|0)>=0){return}c[12334]=dx(74176,51200,65280,65280)|0;c[12332]=dx(74176,35840,51200,51200)|0;c[12330]=dx(74176,25600,51200,25600)|0;c[38166]=dx(74176,4e4,15e3,5e4)|0;c[38167]=dx(74176,4e4,19e3,45e3)|0;c[38168]=dx(74176,4e4,23e3,4e4)|0;c[38169]=dx(74176,4e4,27e3,35e3)|0;c[38170]=dx(74176,4e4,31e3,3e4)|0;c[38171]=dx(74176,4e4,35e3,25e3)|0;c[38172]=dx(74176,4e4,39e3,2e4)|0;c[38173]=dx(74176,4e4,43e3,15e3)|0;return}function c5(){var a=0,b=0,d=0,e=0,f=0;a=i;i=i+256|0;b=113<<c[18560];d=a|0;dn(d);d0(49512);dO(49512,c[12334]|0);dQ(49512,48208);dS(49512,b-48|0,b-58|0,48648);dO(49512,c[12332]|0);dQ(49512,48400);dS(49512,b-30|0,b-43|0,48280);dS(49512,b-86|0,b-23|0,48128);if((c[18572]|0)==0){e=b-68|0;dS(49512,e,b+37|0,d);f=e}else{dS(49512,b-33|0,b+37|0,48088);f=b-68|0}dO(49512,c[12330]|0);dS(49512,b-83|0,b+62|0,48040);dS(49512,f,b+77|0,47928);dS(49512,b-28|0,b+92|0,47848);d1(49512,0,0);c_(152704);c1();i=a;return}function c6(a){a=a|0;var b=0,d=0;if((a|0)<0){c[38162]=-1;c5();return}b=c[38164]|0;d=(a|0)%(b|0)|0;c[38162]=d;c[38174]=(a|0)/(b|0)|0;c_(152704);b=512+(d*916|0)|0;if((c[b>>2]|0)>0){a=0;do{c$(152704,c[516+(d*916|0)+(a<<4)>>2]|0,c[516+(d*916|0)+(a<<4)+4>>2]|0,c[516+(d*916|0)+(a<<4)+8>>2]|0,c[516+(d*916|0)+(a<<4)+12>>2]|0);a=a+1|0;}while((a|0)<(c[b>>2]|0))}c0(152704,c[240+(d*916|0)>>2]|0);c[42274]=0;return}function c7(){var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=c[38162]|0;if((b|0)<0){d=0;return d|0}e=c[38174]|0;f=c[256+(b*916|0)>>2]>>e;g=c[264+(b*916|0)>>2]>>e;cM(c[252+(b*916|0)>>2]|0,(f|0)<4?4:f,c[260+(b*916|0)>>2]|0,(g|0)<4?4:g);d0(49512);g=0;f=0;while(1){e=f<<4|8;h=g;i=0;while(1){j=a[160900+((i<<6)+f)|0]|0;if(j<<24>>24!=0){k=j<<24>>24;do{if((k&32|0)==0){l=k&16;m=l>>>4^7;n=(l|0)==0?k:15}else{if((k&1|0)!=0){m=6;n=8;break}if((k&2|0)!=0){m=6;n=9;break}if((k&4|0)!=0){m=6;n=10;break}m=6;n=(k&8|0)==0?k:11}}while(0);k=c[18560]|0;l=k+4|0;o=16<<k;dZ(49512,n<<l,m<<l,o,o,f<<l,i<<l)}do{if((j-1&255)>>>0<2>>>0|j<<24>>24==4|j<<24>>24==8){l=i<<4|8;cJ(47640,e,l,0,0,0)|0;p=h}else{if(j<<24>>24!=16){p=h;break}l=i<<4|8;cJ(47600,e,l,0,0,0)|0;p=h+1|0}}while(0);j=i+1|0;if((j|0)<128){h=p;i=j}else{break}}i=f+1|0;if((i|0)<64){g=p;f=i}else{break}}dO(49512,c[38166]|0);f=0;g=c[19718]|0;do{g=(ab(g,-2091461159)|0)+1566083942|0;f=f+1|0;}while((f|0)<2e3);c[19718]=g;dO(49512,c[38167]|0);g=0;f=c[19718]|0;do{f=(ab(f,-2091461159)|0)+1566083942|0;g=g+1|0;}while((g|0)<2e3);c[19718]=f;dO(49512,c[38168]|0);f=0;g=c[19718]|0;do{g=(ab(g,-2091461159)|0)+1566083942|0;f=f+1|0;}while((f|0)<2e3);c[19718]=g;dO(49512,c[38169]|0);g=0;f=c[19718]|0;do{f=(ab(f,-2091461159)|0)+1566083942|0;g=g+1|0;}while((g|0)<2e3);c[19718]=f;dO(49512,c[38170]|0);f=0;g=c[19718]|0;do{g=(ab(g,-2091461159)|0)+1566083942|0;f=f+1|0;}while((f|0)<2e3);c[19718]=g;dO(49512,c[38171]|0);g=0;f=c[19718]|0;do{f=(ab(f,-2091461159)|0)+1566083942|0;g=g+1|0;}while((g|0)<2e3);c[19718]=f;dO(49512,c[38172]|0);f=0;g=c[19718]|0;do{g=(ab(g,-2091461159)|0)+1566083942|0;f=f+1|0;}while((f|0)<2e3);c[19718]=g;dO(49512,c[38173]|0);g=0;f=c[19718]|0;do{f=(ab(f,-2091461159)|0)+1566083942|0;g=g+1|0;}while((g|0)<2e3);c[19718]=f;d7(49512);d$(49512);cW(c[244+(b*916|0)>>2]<<4,c[248+(b*916|0)>>2]<<4);c1();d=p;return d|0}function c8(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;a=c[38162]|0;b=c[42274]|0;d=268+(a*916|0)|0;e=c[d>>2]|0;if((b|0)<(e|0)){if((c[272+(a*916|0)+(b*12|0)+4>>2]|0)>0){f=0;g=b;do{h=c[272+(a*916|0)+(g*12|0)+8>>2]|0;i=(ab(c[19718]|0,1566083941)|0)+1|0;j=(i>>>0)%572|0;k=(ab(i,1566083941)|0)+1|0;i=(k>>>0)%1596|0;l=j-60+(c[42330]|0)+(j-286>>31&-452)|0;j=i-572+(c[42328]|0)+(i-798>>31&-452)|0;i=(ab(k,1566083941)|0)+1|0;c[19718]=i;k=i>>>28;i=ab(c[48672+(k<<2)>>2]|0,h)|0;m=ab(c[48736+(k<<2)>>2]|0,h)|0;cJ(c[272+(a*916|0)+(g*12|0)>>2]|0,l,j,i,m,0)|0;f=f+1|0;g=c[42274]|0;}while((f|0)<(c[272+(a*916|0)+(g*12|0)+4>>2]|0));n=g;o=c[d>>2]|0}else{n=b;o=e}d=n+1|0;c[42274]=d;p=d;q=o}else{p=b;q=e}if((p|0)<(q|0)){return}c[42274]=0;return}function c9(b,c){b=b|0;c=c|0;return a[160900+((c<<6)+b)|0]|0}function da(b,d,e){b=b|0;d=d|0;e=e|0;a[160900+((d<<6)+b)|0]=e&255;if((e|0)!=0){return}e=(c[18560]|0)+4|0;d_(49512,b<<e,d<<e);c2(b,d);return}function db(){var a=0,b=0,d=0,e=0;a=i;b=(226<<c[18560])+26|0;dT(74176,b,25,48192);aU(75800,48592,(d=i,i=i+8|0,c[d>>2]=c[42340],d)|0)|0;i=d;dT(74176,b,40,75800);dT(74176,b,55,48304);aU(75800,48592,(d=i,i=i+8|0,c[d>>2]=(c[42332]|0)+1,d)|0)|0;i=d;dT(74176,b,70,75800);dT(74176,b,85,48200);if((c[18572]|0)==0){e=c[42338]|0;aU(75800,48592,(d=i,i=i+8|0,c[d>>2]=e,d)|0)|0;i=d;dT(74176,b,100,75800);i=a;return}else{es(75800,48112,10)|0;dT(74176,b,100,75800);i=a;return}}function dc(){var a=0,b=0,d=0,e=0;a=i;b=(226<<c[18560])+26|0;d=(c[42348]|0)-1|0;c[42348]=d;if((d&1|0)!=0){i=a;return}if((d&2|0)==0){dT(74176,b,25,48192);d=c[42340]|0;aU(77848,48592,(e=i,i=i+8|0,c[e>>2]=d,e)|0)|0;i=e;dT(74176,b,40,77848)}else{dT(74176,b,25,48072);dT(74176,b,40,48016)}if((c[42348]|0)!=0){i=a;return}c[42348]=-1;i=a;return}function dd(){var a=0,b=0,d=0,e=0;a=i;b=(226<<c[18560])+26|0;d=(c[42346]|0)-1|0;c[42346]=d;if((d&1|0)!=0){i=a;return}if((d&2|0)==0){dT(74176,b,85,48200);d=c[42338]|0;aU(76824,48592,(e=i,i=i+8|0,c[e>>2]=d,e)|0)|0;i=e;dT(74176,b,100,76824);i=a;return}else{dT(74176,b,85,47912);dT(74176,b,100,48016);i=a;return}}function de(){dq(169336,169448);c[42344]=0;c[42338]=0;c[42342]=0;c[42332]=c[42362];c[42346]=0;c[42358]=0;c4();c[42336]=0;c6(-1);db();return}function df(){var a=0,b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;a=i;if((dG()|0)!=0){do{dL(74176)|0;dL(49512)|0;dL(49456)|0;dL(49400)|0;}while((dG()|0)!=0)}if((c[42336]|0)!=1){b=c[42356]|0;i=a;return b|0}c[42344]=(c[42344]|0)+1;d=c[42358]|0;do{if((d|0)!=0){e=d-1|0;c[42358]=e;if((e|0)!=1){break}if((cL()|0)!=0){c[42358]=2;break}db();do{if((c[42352]|0)!=0){e=(c[18572]|0)==0;f=c[42338]|0;if(e){g=f-1|0;c[42338]=g;h=g}else{h=f}if((h|0)>=1){break}f=c[42362]|0;g=c[42332]|0;if((f|0)<(g|0)){c[42362]=g;j=g}else{j=f}if(e){e=c[42334]|0;f=c[42340]|0;if((e|0)<(f|0)){c[42334]=f;k=f}else{k=e}ds(k,j)}c[42338]=0;c[42336]=0;c6(-1);db();if((c[42338]|0)>=1){break}b=c[42356]|0;i=a;return b|0}}while(0);if((c[42350]|0)!=0){e=(c[42332]|0)+1|0;f=(e|0)>999999998?999999998:e;c[42332]=f;c6(f)}c[42336]=1;c[42344]=0;c[42358]=0;c[42348]=((c[42348]|0)!=0)<<31>>31;c[42346]=0;c[42354]=0;c[42352]=0;c[42350]=0;cX();cF()|0;cQ()|0;c[42360]=c7()|0;c8();db();f=c[18560]|0;d1(49512,c[42298]<<f,c[42296]<<f);b=c[42356]|0;i=a;return b|0}}while(0);cR()|0;cG();cT()|0;cV()|0;cI();if((c[42354]|0)!=0){j=(226<<c[18560])+26|0;k=c[42340]|0;aU(74776,48592,(h=i,i=i+8|0,c[h>>2]=k,h)|0)|0;i=h;dT(74176,j,40,74776);c[42354]=0}if((c[42348]|0)>0){dc()}if((c[42346]|0)!=0){dd()}c3();j=c[18560]|0;d1(49512,c[42298]<<j,c[42296]<<j);b=c[42356]|0;i=a;return b|0}function dg(){if((c[42358]|0)==0){c[42358]=20}c[42352]=1;return}function dh(){var a=0;a=(c[42360]|0)-1|0;c[42360]=a;if((a|0)==0){c[42350]=1;c[42358]=50}c8();return}function di(){var a=0,b=0;a=c[42336]|0;if((a|0)==0){c[42338]=5;c[42342]=0;c[42340]=0;c[42348]=0;c[42364]=2e3;c6(c[42332]|0);c[42336]=1;c[42344]=0;c[42358]=0;c[42348]=((c[42348]|0)!=0)<<31>>31;c[42346]=0;c[42354]=0;c[42352]=0;c[42350]=0;cX();cF()|0;cQ()|0;c[42360]=c7()|0;c8();db();b=c[18560]|0;d1(49512,c[42298]<<b,c[42296]<<b);return}else if((a|0)==1){c[42336]=2;return}else if((a|0)==2){c[42336]=1;return}else{return}}function dj(){var a=0,b=0,d=0,e=0,f=0;if((c[42336]|0)==0){c[42356]=1}c[42338]=0;a=(c[18572]|0)==0;if(a){c[42338]=-1}b=c[42362]|0;d=c[42332]|0;if((b|0)<(d|0)){c[42362]=d;e=d}else{e=b}if(a){a=c[42334]|0;b=c[42340]|0;if((a|0)<(b|0)){c[42334]=b;f=b}else{f=a}ds(f,e)}c[42338]=0;c[42336]=0;c6(-1);db();db();return}function dk(){var a=0;if((c[42336]|0)!=0){return}a=c[42332]|0;if((a|0)<(c[42362]|0)|(c[18572]|0)!=0){c[42332]=a+1}db();return}function dl(){var a=0;if((c[42336]|0)!=0){return}a=(c[42332]|0)-1|0;c[42332]=(a|0)>0?a:0;db();return}function dm(a){a=a|0;var b=0;b=(c[42340]|0)+a|0;c[42340]=b;if((b|0)>999999999){c[42340]=999999999;c[42354]=1;return}if((c[18572]|0)!=0){c[42354]=1;return}a=c[42364]|0;if((b|0)>=(a|0)){c[42364]=a+3e3;c[42338]=(c[42338]|0)+1;c[42346]=50}if(!((b|0)>=(c[42334]|0)&(c[42348]|0)==0)){c[42354]=1;return}c[42348]=50;c[42354]=1;return}function dn(a){a=a|0;var b=0;b=i;aU(a|0,47824,(a=i,i=i+8|0,c[a>>2]=c[42334],a)|0)|0;i=a;i=b;return}function dp(a,b){a=a|0;b=b|0;var c=0,e=0;c=(d[a+1|0]|0)<<8|(d[a|0]|0)|(d[a+2|0]|0)<<16|(d[a+3|0]|0)<<24;a=(d[b+1|0]|0)<<8|(d[b|0]|0)|(d[b+2|0]|0)<<16|(d[b+3|0]|0)<<24;if(c>>>0<a>>>0){e=1;return e|0}e=(c>>>0>a>>>0)<<31>>31;return e|0}function dq(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+72|0;f=e|0;g=f|0;c[g>>2]=0;c[g+4>>2]=0;g=f;c[f>>2]=0;h=f+4|0;j=h;c[h>>2]=0;c[f+8>>2]=7303014;k=bq(aF()|0)|0;if((k|0)==0){l=c[n>>2]|0;aN(48496,26,1,l|0)|0;l=aF()|0;aU(171608,48296,(m=i,i=i+8|0,c[m>>2]=l,m)|0)|0;i=m}else{l=c[k>>2]|0;et(171608,l|0)|0}l=a7(48104)|0;k=aF()|0;aU(170584,48176,(m=i,i=i+24|0,c[m>>2]=l,c[m+8>>2]=74296,c[m+16>>2]=k,m)|0)|0;i=m;k=f;if((cO(170584,k,72)|0)<0){f=c[n>>2]|0;ay(f|0,47960,(m=i,i=i+8|0,c[m>>2]=170584,m)|0)|0;i=m}c[a>>2]=(d[g+1|0]|0)<<8|(d[k]|0)|(d[g+2|0]|0)<<16|(d[g+3|0]|0)<<24;c[b>>2]=(d[j+1|0]|0)<<8|(d[h]|0)|(d[j+2|0]|0)<<16|(d[j+3|0]|0)<<24;dr(0);i=e;return}function dr(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+8560|0;f=e|0;g=e+7200|0;h=e+8224|0;j=e+8304|0;k=f+7200|0;l=f|0;while(1){m=l;n=m|0;x=0;a[n]=x&255;x=x>>8;a[n+1|0]=x&255;x=x>>8;a[n+2|0]=x&255;x=x>>8;a[n+3|0]=x&255;n=m+4|0;x=0;a[n]=x&255;x=x>>8;a[n+1|0]=x&255;x=x>>8;a[n+2|0]=x&255;x=x>>8;a[n+3|0]=x&255;n=l+72|0;if((n|0)==(k|0)){o=0;break}else{l=n}}do{l=f+(o*72|0)|0;x=0;a[l]=x&255;x=x>>8;a[l+1|0]=x&255;x=x>>8;a[l+2|0]=x&255;x=x>>8;a[l+3|0]=x&255;l=f+(o*72|0)+4|0;x=0;a[l]=x&255;x=x>>8;a[l+1|0]=x&255;x=x>>8;a[l+2|0]=x&255;x=x>>8;a[l+3|0]=x&255;l=f+(o*72|0)+8|0;x=7303014;a[l]=x&255;x=x>>8;a[l+1|0]=x&255;x=x>>8;a[l+2|0]=x&255;x=x>>8;a[l+3|0]=x&255;o=o+1|0;}while((o|0)<100);o=g|0;g=a7(48104)|0;aU(o|0,47816,(l=i,i=i+16|0,c[l>>2]=g,c[l+8>>2]=74296,l)|0)|0;i=l;g=bl(o|0)|0;if((g|0)==0){i=e;return}k=h+12|0;n=0;L1285:while(1){m=au(g|0)|0;if((m|0)==0){p=n;break}q=f+(n*72|0)|0;r=m;L1288:while(1){m=a7(48104)|0;aU(o|0,47800,(l=i,i=i+24|0,c[l>>2]=m,c[l+8>>2]=74296,c[l+16>>2]=r+11,l)|0)|0;i=l;do{if((a$(o|0,h|0)|0)==0){if((c[k>>2]&61440|0)!=32768){break}if((cO(o,q,72)|0)>=0){break L1288}}}while(0);m=au(g|0)|0;if((m|0)==0){p=n;break L1285}else{r=m}}r=n+1|0;if((r|0)>99){p=r;break}else{n=r}}a8(g|0)|0;aP(f|0,p|0,72,2);if((b|0)!=0){aL(8)|0;if((p|0)>0){s=0}else{i=e;return}do{b=(d[f+(s*72|0)+1|0]|0)<<8|(d[f+(s*72|0)|0]|0)|(d[f+(s*72|0)+2|0]|0)<<16|(d[f+(s*72|0)+3|0]|0)<<24;g=(d[f+(s*72|0)+5|0]|0)<<8|(d[f+(s*72|0)+4|0]|0)|(d[f+(s*72|0)+6|0]|0)<<16|(d[f+(s*72|0)+7|0]|0)<<24;az(48632,(l=i,i=i+24|0,c[l>>2]=f+(s*72|0)+8,c[l+8>>2]=b,c[l+16>>2]=g,l)|0)|0;i=l;s=s+1|0;}while((s|0)<(p|0));i=e;return}dN(49400);s=(p|0)>10?10:p;dT(49400,10,24,48624);dT(49400,180,24,48600);dT(49400,80,24,48568);if((s|0)<=0){i=e;return}p=j|0;j=0;do{g=(j<<4)+48|0;dT(49400,10,g,f+(j*72|0)+8|0);aU(p|0,48544,(l=i,i=i+8|0,c[l>>2]=(d[f+(j*72|0)+1|0]|0)<<8|(d[f+(j*72|0)|0]|0)|(d[f+(j*72|0)+2|0]|0)<<16|(d[f+(j*72|0)+3|0]|0)<<24,l)|0)|0;i=l;dT(49400,180,g,p);aU(p|0,48544,(l=i,i=i+8|0,c[l>>2]=(d[f+(j*72|0)+5|0]|0)<<8|(d[f+(j*72|0)+4|0]|0)|(d[f+(j*72|0)+6|0]|0)<<16|(d[f+(j*72|0)+7|0]|0)<<24,l)|0)|0;i=l;dT(49400,100,g,p);j=j+1|0;}while((j|0)<(s|0));i=e;return}function ds(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,o=0;e=i;i=i+72|0;f=e|0;g=f|0;h=f;c[g>>2]=0;c[g+4>>2]=0;g=f;c[h>>2]=0;j=f+4|0;k=j;c[j>>2]=0;l=f+8|0;m=l;c[l>>2]=7303014;l=f;cO(170584,l,72)|0;if(((d[g+1|0]|0)<<8|(d[l]|0)|(d[g+2|0]|0)<<16|(d[g+3|0]|0)<<24)>>>0<a>>>0){c[h>>2]=a;et(m|0,171608)|0;o=1}else{o=0}do{if(((d[k+1|0]|0)<<8|(d[j]|0)|(d[k+2|0]|0)<<16|(d[k+3|0]|0)<<24)>>>0<b>>>0){c[j>>2]=b;et(m|0,171608)|0}else{if((o|0)!=0){break}dr(0);i=e;return}}while(0);if((cP(170584,l,72)|0)>=0){dr(0);i=e;return}aN(47864,46,1,c[n>>2]|0)|0;dr(0);i=e;return}function dt(a){a=a|0;dH(a|0);c[a>>2]=48840;return}function du(a){a=a|0;dJ(a|0);eo(a);return}function dv(a){a=a|0;dJ(a|0);return}function dw(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;dK(a|0,b,c,d,e,f);return}function dx(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return b<<8&16711680|c&65280|d>>>8&255|0}function dy(a){a=a|0;c[a>>2]=48904;eq(a+20|0,0,16);c[a+40>>2]=-1;return}function dz(a){a=a|0;eo(a);return}function dA(a){a=a|0;return}function dB(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;c[a+4>>2]=d;c[a+8>>2]=e;c[a+12>>2]=f;c[a+16>>2]=g;return}function dC(a,b,d){a=a|0;b=b|0;d=d|0;do{if((b|0)>-1){if((c[a+44>>2]|0)>=4){break}c[a+20+(b<<2)>>2]=d}}while(0);return 0}function dD(a){a=a|0;var b=0,d=0;b=aJ()|0;c[a+44>>2]=b;if(b>>>0>=4>>>0){return 1}d=c[a+20+(b<<2)>>2]|0;if((d|0)==0){return 1}bu[d&255](a);return 1}function dE(a){a=a|0;var b=0;if(((c[a+44>>2]|0)-2|0)>>>0>=2>>>0){b=0;return b|0}b=bk()|0;return b|0}function dF(a,b){a=a|0;b=b|0;c[a+40>>2]=b;return}function dG(){return as()|0}function dH(a){a=a|0;dy(a|0);c[a>>2]=48928;return}function dI(a){a=a|0;dA(a|0);eo(a);return}function dJ(a){a=a|0;dA(a|0);return}function dK(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;dB(a|0,b,c,d,e,f);return}function dL(a){a=a|0;return(dD(a|0)|0)!=0|0}function dM(a){a=a|0;return}function dN(a){a=a|0;var b=0;b=a+40|0;a2(c[b>>2]|0);a0(c[b>>2]|0);return}function dO(a,b){a=a|0;b=b|0;aY(c[a+40>>2]|0,b|0);return}function dP(a,b){a=a|0;b=b|0;aO(c[a+40>>2]|0,b|0);return}function dQ(a,b){a=a|0;b=b|0;a1(c[a+40>>2]|0,b|0);return}function dR(a,b,d){a=a|0;b=b|0;d=d|0;bg(c[a+40>>2]|0,b|0,d|0,1,1);return}function dS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;ar(c[a+40>>2]|0,b|0,d|0,e|0);return}function dT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;ar(c[a+40>>2]|0,b|0,d|0,e|0);return}function dU(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;bg(c[a+40>>2]|0,b|0,d|0,f|0,e|0);return}function dV(a){a=a|0;d2(a|0);c[a>>2]=48872;c[a+24656>>2]=a+80;return}function dW(a){a=a|0;d4(a|0);eo(a);return}function dX(a){a=a|0;d4(a|0);return}function dY(a,b,d,e,f,g,h,i,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;d5(a|0,b,d,e,f,g,h,i);c[a+72>>2]=j;c[a+76>>2]=k;c[a+24660>>2]=l;aV(c[a+40>>2]|0);return}function dZ(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0;bo(b|0,d|0,e|0,f|0,g|0,h|0);i=a+12|0;j=c[i>>2]|0;if((j|0)>(g|0)){k=a+56|0;bo(b|0,d|0,e|0,f|0,g-j+(c[k>>2]|0)|0,h|0);j=a+16|0;l=c[j>>2]|0;if((l|0)<=(h|0)){return}m=a+60|0;bo(b|0,d|0,e|0,f|0,g|0,h-l+(c[m>>2]|0)|0);bo(b|0,d|0,e|0,f|0,(c[k>>2]|0)+g-(c[i>>2]|0)|0,(c[m>>2]|0)+h-(c[j>>2]|0)|0);return}else{j=c[a+16>>2]|0;if((j|0)<=(h|0)){return}bo(b|0,d|0,e|0,f|0,g|0,h-j+(c[a+60>>2]|0)|0);return}}function d_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;av(b|0,d|0);e=a+12|0;f=c[e>>2]|0;if((f|0)>(b|0)){g=a+56|0;av(b-f+(c[g>>2]|0)|0,d|0);f=a+16|0;h=c[f>>2]|0;if((h|0)<=(d|0)){return}i=a+60|0;av(b|0,d-h+(c[i>>2]|0)|0);av((c[g>>2]|0)+b-(c[e>>2]|0)|0,(c[i>>2]|0)+d-(c[f>>2]|0)|0);return}else{f=c[a+16>>2]|0;if((f|0)<=(d|0)){return}av(b|0,d-f+(c[a+60>>2]|0)|0);return}}function d$(a){a=a|0;return}function d0(a){a=a|0;dN(a|0);aZ();return}function d1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=a+64|0;c[e>>2]=b;f=a+68|0;c[f>>2]=d;g=a+80|0;h=a+24656|0;if(g>>>0<(c[h>>2]|0)>>>0){i=g;j=b;k=d}else{a9();l=c[e>>2]|0;m=c[f>>2]|0;aW(l|0,m|0);c[h>>2]=g;return}while(1){bb(c[i>>2]|0,c[i+4>>2]|0,c[i+16>>2]|0,c[i+20>>2]|0,(c[i+8>>2]|0)-j|0,(c[i+12>>2]|0)-k|0);d=i+24|0;if(d>>>0>=(c[h>>2]|0)>>>0){break}i=d;j=c[e>>2]|0;k=c[f>>2]|0}a9();l=c[e>>2]|0;m=c[f>>2]|0;aW(l|0,m|0);c[h>>2]=g;return}function d2(a){a=a|0;dH(a|0);c[a>>2]=48960;return}function d3(a){a=a|0;c[a>>2]=48960;dJ(a|0);eo(a);return}function d4(a){a=a|0;c[a>>2]=48960;dJ(a|0);return}function d5(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[a+56>>2]=h;c[a+60>>2]=i;c[a+64>>2]=0;c[a+68>>2]=0;dB(a|0,b,d,e,f,g);return}function d6(a){a=a|0;return}function d7(a){a=a|0;return}function d8(a){a=a|0;return}function d9(a){a=a|0;d8(a|0);return}function ea(a){a=a|0;return}function eb(a){a=a|0;return}function ec(a){a=a|0;d8(a|0);eo(a);return}function ed(a){a=a|0;d8(a|0);eo(a);return}function ee(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=eh(b,49232,49216,-1)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}eq(f|0,0,56);c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;bA[c[(c[h>>2]|0)+28>>2]&7](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function ef(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function eg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;bA[c[(c[g>>2]|0)+28>>2]&7](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function eh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;eq(e|0,0,39);if((k|0)==(d|0)){c[g+48>>2]=1;by[c[(c[k>>2]|0)+20>>2]&7](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}bt[c[(c[k>>2]|0)+24>>2]&7](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)!=0){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}if((c[m>>2]|0)==1){break}else{o=0}i=f;return o|0}}while(0);o=c[e>>2]|0;i=f;return o|0}else if((j|0)==0){if((c[n>>2]|0)!=1){o=0;i=f;return o|0}if((c[l>>2]|0)!=1){o=0;i=f;return o|0}o=(c[m>>2]|0)==1?c[b>>2]|0:0;i=f;return o|0}else{o=0;i=f;return o|0}return 0}function ei(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;bt[c[(c[h>>2]|0)+24>>2]&7](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;by[c[(c[l>>2]|0)+20>>2]&7](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=1206}else{if((a[j]&1)==0){m=1;n=1206}}L1515:do{if((n|0)==1206){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=1209;break}a[d+54|0]=1;if(m){break L1515}}else{n=1209}}while(0);if((n|0)==1209){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function ej(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function ek(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;by[c[(c[i>>2]|0)+20>>2]&7](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function el(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function em(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[18576]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=74344+(h<<2)|0;j=74344+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[18576]=e&~(1<<g)}else{if(l>>>0<(c[18580]|0)>>>0){ax();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{ax();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[18578]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=74344+(p<<2)|0;m=74344+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[18576]=e&~(1<<r)}else{if(l>>>0<(c[18580]|0)>>>0){ax();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{ax();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[18578]|0;if((l|0)!=0){q=c[18581]|0;d=l>>>3;l=d<<1;f=74344+(l<<2)|0;k=c[18576]|0;h=1<<d;do{if((k&h|0)==0){c[18576]=k|h;s=f;t=74344+(l+2<<2)|0}else{d=74344+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[18580]|0)>>>0){s=g;t=d;break}ax();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[18578]=m;c[18581]=e;n=i;return n|0}l=c[18577]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[74608+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[18580]|0;if(r>>>0<i>>>0){ax();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){ax();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){ax();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){ax();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){ax();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{ax();return 0}}}while(0);L1687:do{if((e|0)!=0){f=d+28|0;i=74608+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[18577]=c[18577]&~(1<<c[f>>2]);break L1687}else{if(e>>>0<(c[18580]|0)>>>0){ax();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L1687}}}while(0);if(v>>>0<(c[18580]|0)>>>0){ax();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[18578]|0;if((f|0)!=0){e=c[18581]|0;i=f>>>3;f=i<<1;q=74344+(f<<2)|0;k=c[18576]|0;g=1<<i;do{if((k&g|0)==0){c[18576]=k|g;y=q;z=74344+(f+2<<2)|0}else{i=74344+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[18580]|0)>>>0){y=l;z=i;break}ax();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[18578]=p;c[18581]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[18577]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[74608+(A<<2)>>2]|0;L1735:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L1735}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[74608+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[18578]|0)-g|0)>>>0){o=g;break}q=K;m=c[18580]|0;if(q>>>0<m>>>0){ax();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){ax();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){ax();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){ax();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){ax();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{ax();return 0}}}while(0);L1785:do{if((e|0)!=0){i=K+28|0;m=74608+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[18577]=c[18577]&~(1<<c[i>>2]);break L1785}else{if(e>>>0<(c[18580]|0)>>>0){ax();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L1785}}}while(0);if(L>>>0<(c[18580]|0)>>>0){ax();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=74344+(e<<2)|0;r=c[18576]|0;j=1<<i;do{if((r&j|0)==0){c[18576]=r|j;O=m;P=74344+(e+2<<2)|0}else{i=74344+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[18580]|0)>>>0){O=d;P=i;break}ax();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=74608+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[18577]|0;l=1<<Q;if((m&l|0)==0){c[18577]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=1433;break}else{l=l<<1;m=j}}if((T|0)==1433){if(S>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[18580]|0;if(m>>>0<i>>>0){ax();return 0}if(j>>>0<i>>>0){ax();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[18578]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[18581]|0;if(S>>>0>15>>>0){R=J;c[18581]=R+o;c[18578]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[18578]=0;c[18581]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[18579]|0;if(o>>>0<J>>>0){S=J-o|0;c[18579]=S;J=c[18582]|0;K=J;c[18582]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[18562]|0)==0){J=aK(30)|0;if((J-1&J|0)==0){c[18564]=J;c[18563]=J;c[18565]=-1;c[18566]=-1;c[18567]=0;c[18687]=0;c[18562]=(bn(0)|0)&-16^1431655768;break}else{ax();return 0}}}while(0);J=o+48|0;S=c[18564]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[18686]|0;do{if((O|0)!=0){P=c[18684]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1877:do{if((c[18687]&4|0)==0){O=c[18582]|0;L1879:do{if((O|0)==0){T=1463}else{L=O;P=74752;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=1463;break L1879}else{P=M}}if((P|0)==0){T=1463;break}L=R-(c[18579]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=bf(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=1472}}while(0);do{if((T|0)==1463){O=bf(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[18563]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[18684]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[18686]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=bf($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=1472}}while(0);L1899:do{if((T|0)==1472){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=1483;break L1877}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[18564]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((bf(O|0)|0)==-1){bf(m|0)|0;W=Y;break L1899}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=1483;break L1877}}}while(0);c[18687]=c[18687]|4;ad=W;T=1480}else{ad=0;T=1480}}while(0);do{if((T|0)==1480){if(S>>>0>=2147483647>>>0){break}W=bf(S|0)|0;Z=bf(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=1483}}}while(0);do{if((T|0)==1483){ad=(c[18684]|0)+aa|0;c[18684]=ad;if(ad>>>0>(c[18685]|0)>>>0){c[18685]=ad}ad=c[18582]|0;L1919:do{if((ad|0)==0){S=c[18580]|0;if((S|0)==0|ab>>>0<S>>>0){c[18580]=ab}c[18688]=ab;c[18689]=aa;c[18691]=0;c[18585]=c[18562];c[18584]=-1;S=0;do{Y=S<<1;ac=74344+(Y<<2)|0;c[74344+(Y+3<<2)>>2]=ac;c[74344+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[18582]=ab+ae;c[18579]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[18583]=c[18566]}else{S=74752;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=1495;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==1495){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[18582]|0;Y=(c[18579]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[18582]=Z+ai;c[18579]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[18583]=c[18566];break L1919}}while(0);if(ab>>>0<(c[18580]|0)>>>0){c[18580]=ab}S=ab+aa|0;Y=74752;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=1505;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==1505){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[18582]|0)){J=(c[18579]|0)+K|0;c[18579]=J;c[18582]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[18581]|0)){J=(c[18578]|0)+K|0;c[18578]=J;c[18581]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1964:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=74344+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[18580]|0)>>>0){ax();return 0}if((c[U+12>>2]|0)==(Z|0)){break}ax();return 0}}while(0);if((Q|0)==(U|0)){c[18576]=c[18576]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[18580]|0)>>>0){ax();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}ax();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[18580]|0)>>>0){ax();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){ax();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{ax();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=74608+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[18577]=c[18577]&~(1<<c[P>>2]);break L1964}else{if(m>>>0<(c[18580]|0)>>>0){ax();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L1964}}}while(0);if(an>>>0<(c[18580]|0)>>>0){ax();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=74344+(V<<2)|0;P=c[18576]|0;m=1<<J;do{if((P&m|0)==0){c[18576]=P|m;as=X;at=74344+(V+2<<2)|0}else{J=74344+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[18580]|0)>>>0){as=U;at=J;break}ax();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=74608+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[18577]|0;Q=1<<au;if((X&Q|0)==0){c[18577]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=1578;break}else{Q=Q<<1;X=m}}if((T|0)==1578){if(aw>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[18580]|0;if(X>>>0<$>>>0){ax();return 0}if(m>>>0<$>>>0){ax();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=74752;while(1){ay=c[W>>2]|0;if(ay>>>0<=Y>>>0){az=c[W+4>>2]|0;aA=ay+az|0;if(aA>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ay+(az-39)|0;if((W&7|0)==0){aB=0}else{aB=-W&7}W=ay+(az-47+aB)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aC=0}else{aC=-_&7}_=aa-40-aC|0;c[18582]=ab+aC;c[18579]=_;c[ab+(aC+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[18583]=c[18566];c[ac+4>>2]=27;c[W>>2]=c[18688];c[W+4>>2]=c[18689];c[W+8>>2]=c[18690];c[W+12>>2]=c[18691];c[18688]=ab;c[18689]=aa;c[18691]=0;c[18690]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aA>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aA>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=74344+(K<<2)|0;S=c[18576]|0;m=1<<W;do{if((S&m|0)==0){c[18576]=S|m;aD=Z;aE=74344+(K+2<<2)|0}else{W=74344+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[18580]|0)>>>0){aD=Q;aE=W;break}ax();return 0}}while(0);c[aE>>2]=ad;c[aD+12>>2]=ad;c[ad+8>>2]=aD;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aF=0}else{if(_>>>0>16777215>>>0){aF=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aF=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=74608+(aF<<2)|0;c[ad+28>>2]=aF;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[18577]|0;Q=1<<aF;if((Z&Q|0)==0){c[18577]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aF|0)==31){aG=0}else{aG=25-(aF>>>1)|0}Q=_<<aG;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aH=Z+16+(Q>>>31<<2)|0;m=c[aH>>2]|0;if((m|0)==0){T=1613;break}else{Q=Q<<1;Z=m}}if((T|0)==1613){if(aH>>>0<(c[18580]|0)>>>0){ax();return 0}else{c[aH>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[18580]|0;if(Z>>>0<m>>>0){ax();return 0}if(_>>>0<m>>>0){ax();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[18579]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[18579]=_;ad=c[18582]|0;Q=ad;c[18582]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(bh()|0)>>2]=12;n=0;return n|0}function en(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[18580]|0;if(b>>>0<e>>>0){ax()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){ax()}h=f&-8;i=a+(h-8)|0;j=i;L2136:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){ax()}if((n|0)==(c[18581]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[18578]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=74344+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){ax()}if((c[k+12>>2]|0)==(n|0)){break}ax()}}while(0);if((s|0)==(k|0)){c[18576]=c[18576]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){ax()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}ax()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){ax()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){ax()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){ax()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{ax()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=74608+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[18577]=c[18577]&~(1<<c[v>>2]);q=n;r=o;break L2136}else{if(p>>>0<(c[18580]|0)>>>0){ax()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L2136}}}while(0);if(A>>>0<(c[18580]|0)>>>0){ax()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[18580]|0)>>>0){ax()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[18580]|0)>>>0){ax()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){ax()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){ax()}do{if((e&2|0)==0){if((j|0)==(c[18582]|0)){B=(c[18579]|0)+r|0;c[18579]=B;c[18582]=q;c[q+4>>2]=B|1;if((q|0)!=(c[18581]|0)){return}c[18581]=0;c[18578]=0;return}if((j|0)==(c[18581]|0)){B=(c[18578]|0)+r|0;c[18578]=B;c[18581]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L2238:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=74344+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[18580]|0)>>>0){ax()}if((c[u+12>>2]|0)==(j|0)){break}ax()}}while(0);if((g|0)==(u|0)){c[18576]=c[18576]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[18580]|0)>>>0){ax()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}ax()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[18580]|0)>>>0){ax()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[18580]|0)>>>0){ax()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){ax()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{ax()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=74608+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[18577]=c[18577]&~(1<<c[t>>2]);break L2238}else{if(f>>>0<(c[18580]|0)>>>0){ax()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L2238}}}while(0);if(E>>>0<(c[18580]|0)>>>0){ax()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[18580]|0)>>>0){ax()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[18580]|0)>>>0){ax()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[18581]|0)){H=B;break}c[18578]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=74344+(d<<2)|0;A=c[18576]|0;E=1<<r;do{if((A&E|0)==0){c[18576]=A|E;I=e;J=74344+(d+2<<2)|0}else{r=74344+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[18580]|0)>>>0){I=h;J=r;break}ax()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=74608+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[18577]|0;d=1<<K;do{if((r&d|0)==0){c[18577]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1790;break}else{A=A<<1;J=E}}if((N|0)==1790){if(M>>>0<(c[18580]|0)>>>0){ax()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[18580]|0;if(J>>>0<E>>>0){ax()}if(B>>>0<E>>>0){ax()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[18584]|0)-1|0;c[18584]=q;if((q|0)==0){O=74760}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[18584]=-1;return}function eo(a){a=a|0;if((a|0)==0){return}en(a);return}function ep(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function eq(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function er(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0;while((e|0)<(d|0)){a[b+e|0]=f?0:a[c+e|0]|0;f=f?1:(a[c+e|0]|0)==0;e=e+1|0}return b|0}function es(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function et(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function eu(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;bt[a&7](b|0,c|0,d|0,e|0,f|0)}function ev(a,b){a=a|0;b=b|0;bu[a&255](b|0)}function ew(a,b){a=a|0;b=b|0;return bv[a&1](b|0)|0}function ex(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return bw[a&3](b|0,c|0,d|0)|0}function ey(a){a=a|0;bx[a&3]()}function ez(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;by[a&7](b|0,c|0,d|0,e|0,f|0,g|0)}function eA(a,b,c){a=a|0;b=b|0;c=c|0;return bz[a&3](b|0,c|0)|0}function eB(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;bA[a&7](b|0,c|0,d|0,e|0)}function eC(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ac(0)}function eD(a){a=a|0;ac(1)}function eE(a){a=a|0;ac(2);return 0}function eF(a,b,c){a=a|0;b=b|0;c=c|0;ac(3);return 0}function eG(){ac(4)}function eH(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ac(5)}function eI(a,b){a=a|0;b=b|0;ac(6);return 0}function eJ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ac(7)}
// EMSCRIPTEN_END_FUNCS
var bt=[eC,eC,ei,eC,ej,eC,eC,eC];var bu=[eD,eD,b0,eD,cj,eD,bS,eD,dv,eD,b3,eD,dJ,eD,b2,eD,cE,eD,ch,eD,ec,eD,cn,eD,bY,eD,dA,eD,b6,eD,b4,eD,cf,eD,cp,eD,dX,eD,d6,eD,cC,eD,cq,eD,b9,eD,cg,eD,b1,eD,dI,eD,ci,eD,cd,eD,d4,eD,dJ,eD,cy,eD,d9,eD,ca,eD,dt,eD,cr,eD,dX,eD,ce,eD,cv,eD,cc,eD,cs,eD,dW,eD,cz,eD,cB,eD,b8,eD,cm,eD,ea,eD,co,eD,dv,eD,cu,eD,b5,eD,cb,eD,dV,eD,cl,eD,d3,eD,cA,eD,ed,eD,b$,eD,dz,eD,bT,eD,du,eD,eb,eD,dM,eD,cD,eD,cx,eD,b7,eD,dH,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD,eD];var bv=[eE,eE];var bw=[eF,eF,ee,eF];var bx=[eG,eG,bW,eG];var by=[eH,eH,ek,eH,el,eH,eH,eH];var bz=[eI,eI,dp,eI];var bA=[eJ,eJ,eg,eJ,ef,eJ,eJ,eJ];return{_strlen:ep,_free:en,_main:bX,_strncpy:er,__GLOBAL__I_a:bZ,_memset:eq,_malloc:em,_memcpy:es,_strcpy:et,runPostSets:bR,stackAlloc:bB,stackSave:bC,stackRestore:bD,setThrew:bE,setTempRet0:bH,setTempRet1:bI,setTempRet2:bJ,setTempRet3:bK,setTempRet4:bL,setTempRet5:bM,setTempRet6:bN,setTempRet7:bO,setTempRet8:bP,setTempRet9:bQ,dynCall_viiiii:eu,dynCall_vi:ev,dynCall_ii:ew,dynCall_iiii:ex,dynCall_v:ey,dynCall_viiiiii:ez,dynCall_iii:eA,dynCall_viiii:eB}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "_strncmp": _strncmp, "_open": _open, "_AddTextElement": _AddTextElement, "_PollEvent": _PollEvent, "_snprintf": _snprintf, "_readdir": _readdir, "_SpriteRemove": _SpriteRemove, "_atexit": _atexit, "_abort": _abort, "_fprintf": _fprintf, "_printf": _printf, "_close": _close, "_pread": _pread, "_fflush": _fflush, "___buildEnvironment": ___buildEnvironment, "__reallyNegative": __reallyNegative, "_getgid": _getgid, "_strtol": _strtol, "_fputc": _fputc, "_pause": _pause, "_GetEventType": _GetEventType, "_sysconf": _sysconf, "_puts": _puts, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_SetBackgroundColor": _SetBackgroundColor, "_qsort": _qsort, "_send": _send, "_write": _write, "_fputs": _fputs, "_exit": _exit, "_sprintf": _sprintf, "_SpriteInit": _SpriteInit, "_SetPosition": _SetPosition, "_isspace": _isspace, "_SetForegroundColor": _SetForegroundColor, "_SpriteRemoveAll": _SpriteRemoveAll, "_recv": _recv, "_stat": _stat, "_ClearCanvas": _ClearCanvas, "_SelectFont": _SelectFont, "_ClearElements": _ClearElements, "_read": _read, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_readdir_r": _readdir_r, "__formatString": __formatString, "_getenv": _getenv, "_closedir": _closedir, "_SpriteEndUpdate": _SpriteEndUpdate, "_atoi": _atoi, "_SpriteUpdate": _SpriteUpdate, "_sigaction": _sigaction, "_pwrite": _pwrite, "_putchar": _putchar, "_sbrk": _sbrk, "_FillRect": _FillRect, "___errno_location": ___errno_location, "___gxx_personality_v0": ___gxx_personality_v0, "_emscripten_cancel_main_loop": _emscripten_cancel_main_loop, "_GetEventKeycode": _GetEventKeycode, "_opendir": _opendir, "__parseInt": __parseInt, "_time": _time, "_SpriteAdd": _SpriteAdd, "__exit": __exit, "_getpwuid": _getpwuid, "_strcmp": _strcmp, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "___dso_handle": ___dso_handle, "_stderr": _stderr, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _strncpy = Module["_strncpy"] = asm["_strncpy"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
