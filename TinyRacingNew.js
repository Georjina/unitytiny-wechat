var Module = Module;

function out(text) {
    console.log(text)
}

function err(text) {
    console.error(text)
}

function ready() {
    run()
}

function ready() {
    try {
        if (typeof ENVIRONMENT_IS_PTHREAD === "undefined" || !ENVIRONMENT_IS_PTHREAD) run()
    } catch (e) {
        if (e !== "unwind") throw e
    }
}

(function (global, module) {
    var _allocateArrayOnHeap = function (typedArray) {
        var requiredMemorySize = typedArray.length * typedArray.BYTES_PER_ELEMENT;
        var ptr = _malloc(requiredMemorySize);
        var heapBytes = new Uint8Array(HEAPU8.buffer, ptr, requiredMemorySize);
        heapBytes.set(new Uint8Array(typedArray.buffer));
        return heapBytes
    };
    var _allocateStringOnHeap = function (string) {
        var bufferSize = lengthBytesUTF8(string) + 1;
        var ptr = _malloc(bufferSize);
        stringToUTF8(string, ptr, bufferSize);
        return ptr
    };
    var _freeArrayFromHeap = function (heapBytes) {
        if (typeof heapBytes !== "undefined") _free(heapBytes.byteOffset)
    };
    var _freeStringFromHeap = function (stringPtr) {
        if (typeof stringPtr !== "undefined") _free(stringPtr)
    };
    var _sendMessage = function (message, intArr, floatArr, byteArray) {
        if (!Array.isArray(intArr)) {
            intArr = []
        }
        if (!Array.isArray(floatArr)) {
            floatArr = []
        }
        if (!Array.isArray(byteArray)) {
            byteArray = []
        }
        var messageOnHeap, intOnHeap, floatOnHeap, bytesOnHeap;
        try {
            messageOnHeap = _allocateStringOnHeap(message);
            intOnHeap = _allocateArrayOnHeap(new Int32Array(intArr));
            floatOnHeap = _allocateArrayOnHeap(new Float32Array(floatArr));
            bytesOnHeap = _allocateArrayOnHeap(new Uint8Array(byteArray));
            _SendMessage(messageOnHeap, intOnHeap.byteOffset, intArr.length, floatOnHeap.byteOffset, floatArr.length, bytesOnHeap.byteOffset, byteArray.length)
        } finally {
            _freeStringFromHeap(messageOnHeap);
            _freeArrayFromHeap(intOnHeap);
            _freeArrayFromHeap(floatOnHeap);
            _freeArrayFromHeap(bytesOnHeap)
        }
    };
    global["SendMessage"] = _sendMessage;
    module["SendMessage"] = _sendMessage
})(this, Module);

function abort(what) {
    throw what
}

var tempRet0 = 0;
var setTempRet0 = function (value) {
    tempRet0 = value
};
var getTempRet0 = function () {
    return tempRet0
};
var jsCallStartIndex = 1;
var functionPointers = new Array(0);
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = u8Array[idx++];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}

function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4
    }
    return len
}

var GLOBAL_BASE = 8, STACK_BASE = 788368, STACK_MAX = 6031248, DYNAMICTOP_PTR = 788160;
var buffer = new ArrayBuffer(134217728);
var HEAP8 = new Int8Array(buffer);
var HEAP16 = new Int16Array(buffer);
var HEAP32 = new Int32Array(buffer);
var HEAPU8 = new Uint8Array(buffer);
var HEAPU16 = new Uint16Array(buffer);
var HEAPU32 = new Uint32Array(buffer);
var HEAPF32 = new Float32Array(buffer);
var HEAPF64 = new Float64Array(buffer);
HEAPU8.set(new Uint8Array(Module["mem"]), GLOBAL_BASE);
HEAP32[DYNAMICTOP_PTR >> 2] = 6031248;

function unSign(value, bits, ignore) {
    if (value >= 0) {
        return value
    }
    return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value
}

function reSign(value, bits, ignore) {
    if (value <= 0) {
        return value
    }
    var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
    if (value >= half && (bits <= 32 || value > half)) {
        value = -2 * half + value
    }
    return value
}

if (!Math.imul || Math.imul(4294967295, 5) !== -5) Math.imul = function imul(a, b) {
    var ah = a >>> 16;
    var al = a & 65535;
    var bh = b >>> 16;
    var bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0
};
if (!Math.clz32) Math.clz32 = function (x) {
    var n = 32;
    var y = x >> 16;
    if (y) {
        n -= 16;
        x = y
    }
    y = x >> 8;
    if (y) {
        n -= 8;
        x = y
    }
    y = x >> 4;
    if (y) {
        n -= 4;
        x = y
    }
    y = x >> 2;
    if (y) {
        n -= 2;
        x = y
    }
    y = x >> 1;
    if (y) return n - 2;
    return n - x
};
if (!Math.trunc) Math.trunc = function (x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x)
};
var memoryInitializer = null;
var ASM_CONSTS = [function () {
    debugger
}];

function _emscripten_asm_const_i(code) {
    return ASM_CONSTS[code]()
}

memoryInitializer = "TinyRacing.mem";
var tempDoublePtr = 788352;

function ___lock() {
}

function ___setErrNo(value) {
    return 0
}

var PATH = {
    splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    }, normalizeArray: function (parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    }, normalize: function (path) {
        var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function (p) {
            return !!p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    }, dirname: function (path) {
        var result = PATH.splitPath(path), root = result[0], dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    }, basename: function (path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    }, extname: function (path) {
        return PATH.splitPath(path)[3]
    }, join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    }, join2: function (l, r) {
        return PATH.normalize(l + "/" + r)
    }
};
var SYSCALLS = {
    buffers: [null, [], []], printChar: function (stream, curr) {
        var buffer = SYSCALLS.buffers[stream];
        if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
            buffer.length = 0
        } else {
            buffer.push(curr)
        }
    }, varargs: undefined, get: function () {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    }, getStr: function (ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    }, get64: function (low, high) {
        return low
    }
};

function ___syscall221(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    return 0
}

function ___syscall4(fd, buf, count) {
    for (var i = 0; i < count; i++) {
        SYSCALLS.printChar(fd, HEAPU8[buf + i])
    }
    return count
}

function ___syscall5(path, flags, varargs) {
    SYSCALLS.varargs = varargs
}

function ___syscall54(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    return 0
}

function ___unlock() {
}

function _fd_close(fd) {
    return 0
}

function ___wasi_fd_close(a0) {
    return _fd_close(a0)
}

function _fd_read(fd, iov, iovcnt, pnum) {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = SYSCALLS.doReadv(stream, iov, iovcnt);
    HEAP32[pnum >> 2] = num;
    return 0
}

function ___wasi_fd_read(a0, a1, a2, a3) {
    return _fd_read(a0, a1, a2, a3)
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
}

function ___wasi_fd_seek(a0, a1, a2, a3, a4) {
    return _fd_seek(a0, a1, a2, a3, a4)
}

function _fd_write(fd, iov, iovcnt, pnum) {
    var num = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[iov + i * 8 >> 2];
        var len = HEAP32[iov + (i * 8 + 4) >> 2];
        for (var j = 0; j < len; j++) {
            SYSCALLS.printChar(fd, HEAPU8[ptr + j])
        }
        num += len
    }
    HEAP32[pnum >> 2] = num;
    return 0
}

function ___wasi_fd_write(a0, a1, a2, a3) {
    return _fd_write(a0, a1, a2, a3)
}

function __emscripten_fetch_free(id) {
    delete Fetch.xhrs[id - 1]
}

function _abort() {
    throw"abort"
}

function _emscripten_asm_const_int() {
}

function _emscripten_get_heap_size() {
    return HEAPU8.length
}

var _emscripten_get_now;
if (typeof performance !== "undefined" && performance.now) {
    _emscripten_get_now = function () {
        return performance.now()
    }
} else {
    _emscripten_get_now = Date.now
}

function __webgl_acquireInstancedArraysExtension(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = function (index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor)
        };
        ctx["drawArraysInstanced"] = function (mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount)
        };
        ctx["drawElementsInstanced"] = function (mode, count, type, indices, primcount) {
            ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
        }
    }
}

function __webgl_acquireVertexArrayObjectExtension(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = function () {
            return ext["createVertexArrayOES"]()
        };
        ctx["deleteVertexArray"] = function (vao) {
            ext["deleteVertexArrayOES"](vao)
        };
        ctx["bindVertexArray"] = function (vao) {
            ext["bindVertexArrayOES"](vao)
        };
        ctx["isVertexArray"] = function (vao) {
            return ext["isVertexArrayOES"](vao)
        }
    }
}

function __webgl_acquireDrawBuffersExtension(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = function (n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs)
        }
    }
}

var GL = {
    counter: 1,
    lastError: 0,
    buffers: [],
    mappedBuffers: {},
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    uniforms: [],
    shaders: [],
    vaos: [],
    contexts: {},
    currentContext: null,
    offscreenCanvases: {},
    timerQueriesEXT: [],
    queries: [],
    samplers: [],
    transformFeedbacks: [],
    syncs: [],
    programInfos: {},
    stringCache: {},
    stringiCache: {},
    unpackAlignment: 4,
    init: function () {
        var miniTempFloatBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
            GL.miniTempBufferFloatViews[i] = miniTempFloatBuffer.subarray(0, i + 1)
        }
        var miniTempIntBuffer = new Int32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
            GL.miniTempBufferIntViews[i] = miniTempIntBuffer.subarray(0, i + 1)
        }
    },
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        return ret
    },
    MINI_TEMP_BUFFER_SIZE: 256,
    miniTempBufferFloatViews: [0],
    miniTempBufferIntViews: [0],
    getSource: function (shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[length + i * 4 >> 2] : -1;
            source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
        }
        return source
    },
    createContext: function (canvas, webGLContextAttributes) {
        function getChromeVersion() {
            var chromeVersion = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
            if (chromeVersion) return chromeVersion[2] | 0
        }

        var ctx = webGLContextAttributes.majorVersion > 1 ? !(getChromeVersion() <= 57) && canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);

        function disableHalfFloatExtensionIfBroken(ctx) {
            var t = ctx.createTexture();
            ctx.bindTexture(3553, t);
            for (var i = 0; i < 8 && ctx.getError(); ++i) ;
            var ext = ctx.getExtension("OES_texture_half_float");
            if (!ext) return;
            ctx.texImage2D(3553, 0, 6408, 1, 1, 0, 6408, 36193, new Uint16Array(4));
            var broken = ctx.getError();
            ctx.bindTexture(3553, null);
            ctx.deleteTexture(t);
            if (broken) {
                ctx.realGetSupportedExtensions = ctx.getSupportedExtensions;
                ctx.getSupportedExtensions = function () {
                    return (this.realGetSupportedExtensions() || []).filter(function (ext) {
                        return ext.indexOf("texture_half_float") == -1
                    })
                }
            }
        }

        disableHalfFloatExtensionIfBroken(ctx);
        return handle
    },
    registerContext: function (ctx, webGLContextAttributes) {
        var handle = _malloc(8);
        var context = {
            handle: handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        context.cannotHandleOffsetsInUniformArrayViews = function (g) {
            function b(c, t) {
                var s = g.createShader(t);
                g.shaderSource(s, c);
                g.compileShader(s);
                return s
            }

            try {
                var p = g.createProgram();
                g.attachShader(p, b("attribute vec4 p;void main(){gl_Position=p;}", 35633));
                g.attachShader(p, b("precision lowp float;uniform vec4 u;void main(){gl_FragColor=u;}", 35632));
                g.linkProgram(p);
                var h = new Float32Array(8);
                h[4] = 1;
                g.useProgram(p);
                var l = g.getUniformLocation(p, "u");
                g.uniform4fv(l, h.subarray(4, 8));
                return !g.getUniform(p, l)[0]
            } catch (e) {
                return false
            }
        }();
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        return handle
    },
    makeContextCurrent: function (contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx)
    },
    getContext: function (contextHandle) {
        return GL.contexts[contextHandle]
    },
    deleteContext: function (contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        _free(GL.contexts[contextHandle]);
        GL.contexts[contextHandle] = null
    },
    initExtensions: function (context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        if (context.version < 2) {
            __webgl_acquireInstancedArraysExtension(GLctx);
            __webgl_acquireVertexArrayObjectExtension(GLctx);
            __webgl_acquireDrawBuffersExtension(GLctx)
        }
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        var automaticallyEnabledExtensions = ["OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives", "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture", "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth", "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear", "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod", "EXT_texture_norm16", "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float", "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float", "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2", "WEBKIT_WEBGL_compressed_texture_pvrtc"];
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function (ext) {
            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
                GLctx.getExtension(ext)
            }
        })
    },
    populateUniformTable: function (program) {
        var p = GL.programs[program];
        var ptable = GL.programInfos[program] = {
            uniforms: {},
            maxUniformLength: 0,
            maxAttributeLength: -1,
            maxUniformBlockNameLength: -1
        };
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
            var u = GLctx.getActiveUniform(p, i);
            var name = u.name;
            ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
            if (name.slice(-1) == "]") {
                name = name.slice(0, name.lastIndexOf("["))
            }
            var loc = GLctx.getUniformLocation(p, name);
            if (loc) {
                var id = GL.getNewId(GL.uniforms);
                utable[name] = [u.size, id];
                GL.uniforms[id] = loc;
                for (var j = 1; j < u.size; ++j) {
                    var n = name + "[" + j + "]";
                    loc = GLctx.getUniformLocation(p, n);
                    id = GL.getNewId(GL.uniforms);
                    GL.uniforms[id] = loc
                }
            }
        }
    }
};

function _emscripten_glActiveTexture(x0) {
    GLctx["activeTexture"](x0)
}

function _emscripten_glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}

function _emscripten_glBeginQueryEXT(target, id) {
    GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.timerQueriesEXT[id])
}

function _emscripten_glBindAttribLocation(program, index, name) {
    GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
}

function _emscripten_glBindBuffer(target, buffer) {
    if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer
    } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer
    }
    GLctx.bindBuffer(target, GL.buffers[buffer])
}

function _emscripten_glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}

function _emscripten_glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}

function _emscripten_glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture])
}

function _emscripten_glBindVertexArrayOES(vao) {
    GLctx["bindVertexArray"](GL.vaos[vao])
}

function _emscripten_glBlendColor(x0, x1, x2, x3) {
    GLctx["blendColor"](x0, x1, x2, x3)
}

function _emscripten_glBlendEquation(x0) {
    GLctx["blendEquation"](x0)
}

function _emscripten_glBlendEquationSeparate(x0, x1) {
    GLctx["blendEquationSeparate"](x0, x1)
}

function _emscripten_glBlendFunc(x0, x1) {
    GLctx["blendFunc"](x0, x1)
}

function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
    GLctx["blendFuncSeparate"](x0, x1, x2, x3)
}

function _emscripten_glBufferData(target, size, data, usage) {
    if (GL.currentContext.version >= 2) {
        if (data) {
            GLctx.bufferData(target, HEAPU8, usage, data, size)
        } else {
            GLctx.bufferData(target, size, usage)
        }
    } else {
        GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
    }
}

function _emscripten_glBufferSubData(target, offset, size, data) {
    if (GL.currentContext.version >= 2) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return
    }
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
}

function _emscripten_glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0)
}

function _emscripten_glClear(x0) {
    GLctx["clear"](x0)
}

function _emscripten_glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3)
}

function _emscripten_glClearDepthf(x0) {
    GLctx["clearDepth"](x0)
}

function _emscripten_glClearStencil(x0) {
    GLctx["clearStencil"](x0)
}

function _emscripten_glColorMask(red, green, blue, alpha) {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
}

function _emscripten_glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader])
}

function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, imageSize, data)
        } else {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, imageSize, data)
        } else {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}

function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
    GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7)
}

function _emscripten_glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    GL.programs[id] = program;
    return id
}

function _emscripten_glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}

function _emscripten_glCullFace(x0) {
    GLctx["cullFace"](x0)
}

function _emscripten_glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0
    }
}

function _emscripten_glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}

function _emscripten_glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
    GL.programInfos[id] = null
}

function _emscripten_glDeleteQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[ids + i * 4 >> 2];
        var query = GL.timerQueriesEXT[id];
        if (!query) continue;
        GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
        GL.timerQueriesEXT[id] = null
    }
}

function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}

function _emscripten_glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
}

function _emscripten_glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}

function _emscripten_glDeleteVertexArraysOES(n, vaos) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[vaos + i * 4 >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null
    }
}

function _emscripten_glDepthFunc(x0) {
    GLctx["depthFunc"](x0)
}

function _emscripten_glDepthMask(flag) {
    GLctx.depthMask(!!flag)
}

function _emscripten_glDepthRangef(x0, x1) {
    GLctx["depthRange"](x0, x1)
}

function _emscripten_glDetachShader(program, shader) {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader])
}

function _emscripten_glDisable(x0) {
    GLctx["disable"](x0)
}

function _emscripten_glDisableVertexAttribArray(index) {
    GLctx.disableVertexAttribArray(index)
}

function _emscripten_glDrawArrays(mode, first, count) {
    GLctx.drawArrays(mode, first, count)
}

function _emscripten_glDrawArraysInstancedANGLE(mode, first, count, primcount) {
    GLctx["drawArraysInstanced"](mode, first, count, primcount)
}

var __tempFixedLengthArray = [];

function _emscripten_glDrawBuffersWEBGL(n, bufs) {
    var bufArray = __tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[bufs + i * 4 >> 2]
    }
    GLctx["drawBuffers"](bufArray)
}

function _emscripten_glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices)
}

function _emscripten_glDrawElementsInstancedANGLE(mode, count, type, indices, primcount) {
    GLctx["drawElementsInstanced"](mode, count, type, indices, primcount)
}

function _emscripten_glEnable(x0) {
    GLctx["enable"](x0)
}

function _emscripten_glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index)
}

function _emscripten_glEndQueryEXT(target) {
    GLctx.disjointTimerQueryExt["endQueryEXT"](target)
}

function _emscripten_glFinish() {
    GLctx["finish"]()
}

function _emscripten_glFlush() {
    GLctx["flush"]()
}

function _emscripten_glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}

function _emscripten_glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}

function _emscripten_glFrontFace(x0) {
    GLctx["frontFace"](x0)
}

function __glGenObject(n, buffers, createFunction, objectTable) {
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer
        } else {
            GL.recordError(1282)
        }
        HEAP32[buffers + i * 4 >> 2] = id
    }
}

function _emscripten_glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}

function _emscripten_glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}

function _emscripten_glGenQueriesEXT(n, ids) {
    for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
        if (!query) {
            GL.recordError(1282);
            while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
            return
        }
        var id = GL.getNewId(GL.timerQueriesEXT);
        query.name = id;
        GL.timerQueriesEXT[id] = query;
        HEAP32[ids + i * 4 >> 2] = id
    }
}

function _emscripten_glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}

function _emscripten_glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures)
}

function _emscripten_glGenVertexArraysOES(n, arrays) {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos)
}

function _emscripten_glGenerateMipmap(x0) {
    GLctx["generateMipmap"](x0)
}

function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx.getActiveAttrib(program, index);
    if (!info) return;
    var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    if (size) HEAP32[size >> 2] = info.size;
    if (type) HEAP32[type >> 2] = info.type
}

function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx.getActiveUniform(program, index);
    if (!info) return;
    var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    if (size) HEAP32[size >> 2] = info.size;
    if (type) HEAP32[type >> 2] = info.type
}

function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
        len = maxCount
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[shaders + i * 4 >> 2] = id
    }
}

function _emscripten_glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}

function writeI53ToI64(ptr, num) {
    HEAPU32[ptr >> 2] = num;
    HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296
}

function emscriptenWebGLGet(name_, p, type) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    var ret = undefined;
    switch (name_) {
        case 36346:
            ret = 1;
            break;
        case 36344:
            if (type != 0 && type != 1) {
                GL.recordError(1280)
            }
            return;
        case 34814:
        case 36345:
            ret = 0;
            break;
        case 34466:
            var formats = GLctx.getParameter(34467);
            ret = formats ? formats.length : 0;
            break;
        case 33309:
            if (GL.currentContext.version < 2) {
                GL.recordError(1282);
                return
            }
            var exts = GLctx.getSupportedExtensions() || [];
            ret = 2 * exts.length;
            break;
        case 33307:
        case 33308:
            if (GL.currentContext.version < 2) {
                GL.recordError(1280);
                return
            }
            ret = name_ == 33307 ? 3 : 0;
            break
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
            case"number":
                ret = result;
                break;
            case"boolean":
                ret = result ? 1 : 0;
                break;
            case"string":
                GL.recordError(1280);
                return;
            case"object":
                if (result === null) {
                    switch (name_) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 35097:
                        case 36389:
                        case 34068: {
                            ret = 0;
                            break
                        }
                        default: {
                            GL.recordError(1280);
                            return
                        }
                    }
                } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                    for (var i = 0; i < result.length; ++i) {
                        switch (type) {
                            case 0:
                                HEAP32[p + i * 4 >> 2] = result[i];
                                break;
                            case 2:
                                HEAPF32[p + i * 4 >> 2] = result[i];
                                break;
                            case 4:
                                HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                                break
                        }
                    }
                    return
                } else {
                    try {
                        ret = result.name | 0
                    } catch (e) {
                        GL.recordError(1280);
                        err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                        return
                    }
                }
                break;
            default:
                GL.recordError(1280);
                err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
                return
        }
    }
    switch (type) {
        case 1:
            writeI53ToI64(p, ret);
            break;
        case 0:
            HEAP32[p >> 2] = ret;
            break;
        case 2:
            HEAPF32[p >> 2] = ret;
            break;
        case 4:
            HEAP8[p >> 0] = ret ? 1 : 0;
            break
    }
}

function _emscripten_glGetBooleanv(name_, p) {
    emscriptenWebGLGet(name_, p, 4)
}

function _emscripten_glGetBufferParameteriv(target, value, data) {
    if (!data) {
        GL.recordError(1281);
        return
    }
    HEAP32[data >> 2] = GLctx.getBufferParameter(target, value)
}

function _emscripten_glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
}

function _emscripten_glGetFloatv(name_, p) {
    emscriptenWebGLGet(name_, p, 2)
}

function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
    var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
    if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
        result = result.name | 0
    }
    HEAP32[params >> 2] = result
}

function _emscripten_glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0)
}

function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _emscripten_glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    var ptable = GL.programInfos[program];
    if (!ptable) {
        GL.recordError(1282);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength
    } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
            program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, 35721);
            ptable.maxAttributeLength = 0;
            for (var i = 0; i < numAttribs; ++i) {
                var activeAttrib = GLctx.getActiveAttrib(program, i);
                ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength
    } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
            program = GL.programs[program];
            var numBlocks = GLctx.getProgramParameter(program, 35382);
            ptable.maxUniformBlockNameLength = 0;
            for (var i = 0; i < numBlocks; ++i) {
                var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname)
    }
}

function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    writeI53ToI64(params, ret)
}

function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}

function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    writeI53ToI64(params, ret)
}

function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var query = GL.timerQueriesEXT[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
        ret = param ? 1 : 0
    } else {
        ret = param
    }
    HEAP32[params >> 2] = ret
}

function _emscripten_glGetQueryivEXT(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
}

function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
}

function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
    var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
    HEAP32[range >> 2] = result.rangeMin;
    HEAP32[range + 4 >> 2] = result.rangeMax;
    HEAP32[precision >> 2] = result.precision
}

function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
    var result = GLctx.getShaderSource(GL.shaders[shader]);
    if (!result) return;
    var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _emscripten_glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}

function stringToNewUTF8(jsString) {
    var length = lengthBytesUTF8(jsString) + 1;
    var cString = _malloc(length);
    stringToUTF8(jsString, cString, length);
    return cString
}

function _emscripten_glGetString(name_) {
    if (GL.stringCache[name_]) return GL.stringCache[name_];
    var ret;
    switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function (e) {
                return "GL_" + e
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280)
            }
            ret = stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(7938);
            if (GL.currentContext.version >= 2) glVersion = "OpenGL ES 3.0 (" + glVersion + ")"; else {
                glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
            }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280);
            return 0
    }
    GL.stringCache[name_] = ret;
    return ret
}

function _emscripten_glGetTexParameterfv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname)
}

function _emscripten_glGetTexParameteriv(target, pname, params) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    HEAP32[params >> 2] = GLctx.getTexParameter(target, pname)
}

function jstoi_q(str) {
    return parseInt(str, undefined)
}

function _emscripten_glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    var arrayIndex = 0;
    if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace)
    }
    var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
    if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex
    } else {
        return -1
    }
}

function emscriptenWebGLGetUniform(program, location, params, type) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
    if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
            default:
                throw"internal emscriptenWebGLGetUniform() error, bad type: " + type
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[params + i * 4 >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[params + i * 4 >> 2] = data[i];
                    break;
                default:
                    throw"internal emscriptenWebGLGetUniform() error, bad type: " + type
            }
        }
    }
}

function _emscripten_glGetUniformfv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 2)
}

function _emscripten_glGetUniformiv(program, location, params) {
    emscriptenWebGLGetUniform(program, location, params, 0)
}

function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
    if (!pointer) {
        GL.recordError(1281);
        return
    }
    HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
}

function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
    if (!params) {
        GL.recordError(1281);
        return
    }
    var data = GLctx.getVertexAttrib(index, pname);
    if (pname == 34975) {
        HEAP32[params >> 2] = data["name"]
    } else if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
            case 0:
                HEAP32[params >> 2] = data;
                break;
            case 2:
                HEAPF32[params >> 2] = data;
                break;
            case 5:
                HEAP32[params >> 2] = Math.fround(data);
                break;
            default:
                throw"internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            switch (type) {
                case 0:
                    HEAP32[params + i * 4 >> 2] = data[i];
                    break;
                case 2:
                    HEAPF32[params + i * 4 >> 2] = data[i];
                    break;
                case 5:
                    HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
                    break;
                default:
                    throw"internal emscriptenWebGLGetVertexAttrib() error, bad type: " + type
            }
        }
    }
}

function _emscripten_glGetVertexAttribfv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 2)
}

function _emscripten_glGetVertexAttribiv(index, pname, params) {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 5)
}

function _emscripten_glHint(x0, x1) {
    GLctx["hint"](x0, x1)
}

function _emscripten_glIsBuffer(buffer) {
    var b = GL.buffers[buffer];
    if (!b) return 0;
    return GLctx.isBuffer(b)
}

function _emscripten_glIsEnabled(x0) {
    return GLctx["isEnabled"](x0)
}

function _emscripten_glIsFramebuffer(framebuffer) {
    var fb = GL.framebuffers[framebuffer];
    if (!fb) return 0;
    return GLctx.isFramebuffer(fb)
}

function _emscripten_glIsProgram(program) {
    program = GL.programs[program];
    if (!program) return 0;
    return GLctx.isProgram(program)
}

function _emscripten_glIsQueryEXT(id) {
    var query = GL.timerQueriesEXT[id];
    if (!query) return 0;
    return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
}

function _emscripten_glIsRenderbuffer(renderbuffer) {
    var rb = GL.renderbuffers[renderbuffer];
    if (!rb) return 0;
    return GLctx.isRenderbuffer(rb)
}

function _emscripten_glIsShader(shader) {
    var s = GL.shaders[shader];
    if (!s) return 0;
    return GLctx.isShader(s)
}

function _emscripten_glIsTexture(id) {
    var texture = GL.textures[id];
    if (!texture) return 0;
    return GLctx.isTexture(texture)
}

function _emscripten_glIsVertexArrayOES(array) {
    var vao = GL.vaos[array];
    if (!vao) return 0;
    return GLctx["isVertexArray"](vao)
}

function _emscripten_glLineWidth(x0) {
    GLctx["lineWidth"](x0)
}

function _emscripten_glLinkProgram(program) {
    GLctx.linkProgram(GL.programs[program]);
    GL.populateUniformTable(program)
}

function _emscripten_glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
}

function _emscripten_glPolygonOffset(x0, x1) {
    GLctx["polygonOffset"](x0, x1)
}

function _emscripten_glQueryCounterEXT(id, target) {
    GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.timerQueriesEXT[id], target)
}

function __computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
    function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y
    }

    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize
}

function __colorChannelsInGlTextureFormat(format) {
    var colorChannels = {5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4, 26917: 2, 26918: 2, 29846: 3, 29847: 4};
    return colorChannels[format - 6402] || 1
}

function __heapObjectForWebGLType(type) {
    type -= 5120;
    if (type == 0) return HEAP8;
    if (type == 1) return HEAPU8;
    if (type == 2) return HEAP16;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return HEAPU32;
    return HEAPU16
}

function __heapAccessShiftForWebGLHeap(heap) {
    return 31 - Math.clz32(heap.BYTES_PER_ELEMENT)
}

function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
    var heap = __heapObjectForWebGLType(type);
    var shift = __heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = __computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >> shift, pixels + bytes >> shift)
}

function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelPackBufferBinding) {
            GLctx.readPixels(x, y, width, height, format, type, pixels)
        } else {
            var heap = __heapObjectForWebGLType(type);
            GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap))
        }
        return
    }
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}

function _emscripten_glReleaseShaderCompiler() {
}

function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3)
}

function _emscripten_glSampleCoverage(value, invert) {
    GLctx.sampleCoverage(value, !!invert)
}

function _emscripten_glScissor(x0, x1, x2, x3) {
    GLctx["scissor"](x0, x1, x2, x3)
}

function _emscripten_glShaderBinary() {
    GL.recordError(1280)
}

function _emscripten_glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}

function _emscripten_glStencilFunc(x0, x1, x2) {
    GLctx["stencilFunc"](x0, x1, x2)
}

function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}

function _emscripten_glStencilMask(x0) {
    GLctx["stencilMask"](x0)
}

function _emscripten_glStencilMaskSeparate(x0, x1) {
    GLctx["stencilMaskSeparate"](x0, x1)
}

function _emscripten_glStencilOp(x0, x1, x2) {
    GLctx["stencilOp"](x0, x1, x2)
}

function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}

function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels)
        } else if (pixels) {
            var heap = __heapObjectForWebGLType(type);
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null)
        }
        return
    }
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}

function _emscripten_glTexParameterf(x0, x1, x2) {
    GLctx["texParameterf"](x0, x1, x2)
}

function _emscripten_glTexParameterfv(target, pname, params) {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param)
}

function _emscripten_glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2)
}

function _emscripten_glTexParameteriv(target, pname, params) {
    var param = HEAP32[params >> 2];
    GLctx.texParameteri(target, pname, param)
}

function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels)
        } else if (pixels) {
            var heap = __heapObjectForWebGLType(type);
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null)
        }
        return
    }
    var pixelData = null;
    if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}

function _emscripten_glUniform1f(location, v0) {
    GLctx.uniform1f(GL.uniforms[location], v0)
}

function _emscripten_glUniform1fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform1fv(GL.uniforms[location], HEAPF32, value >> 2, count);
        return
    }
    if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniform1fv(GL.uniforms[location], view)
}

function _emscripten_glUniform1i(location, v0) {
    GLctx.uniform1i(GL.uniforms[location], v0)
}

function _emscripten_glUniform1iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform1iv(GL.uniforms[location], HEAP32, value >> 2, count);
        return
    }
    if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferIntViews[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAP32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Int32Array(view)
    }
    GLctx.uniform1iv(GL.uniforms[location], view)
}

function _emscripten_glUniform2f(location, v0, v1) {
    GLctx.uniform2f(GL.uniforms[location], v0, v1)
}

function _emscripten_glUniform2fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform2fv(GL.uniforms[location], HEAPF32, value >> 2, count * 2);
        return
    }
    if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniform2fv(GL.uniforms[location], view)
}

function _emscripten_glUniform2i(location, v0, v1) {
    GLctx.uniform2i(GL.uniforms[location], v0, v1)
}

function _emscripten_glUniform2iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform2iv(GL.uniforms[location], HEAP32, value >> 2, count * 2);
        return
    }
    if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferIntViews[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Int32Array(view)
    }
    GLctx.uniform2iv(GL.uniforms[location], view)
}

function _emscripten_glUniform3f(location, v0, v1, v2) {
    GLctx.uniform3f(GL.uniforms[location], v0, v1, v2)
}

function _emscripten_glUniform3fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform3fv(GL.uniforms[location], HEAPF32, value >> 2, count * 3);
        return
    }
    if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniform3fv(GL.uniforms[location], view)
}

function _emscripten_glUniform3i(location, v0, v1, v2) {
    GLctx.uniform3i(GL.uniforms[location], v0, v1, v2)
}

function _emscripten_glUniform3iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform3iv(GL.uniforms[location], HEAP32, value >> 2, count * 3);
        return
    }
    if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferIntViews[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAP32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Int32Array(view)
    }
    GLctx.uniform3iv(GL.uniforms[location], view)
}

function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
    GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3)
}

function _emscripten_glUniform4fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return
    }
    if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniform4fv(GL.uniforms[location], view)
}

function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
    GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3)
}

function _emscripten_glUniform4iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform4iv(GL.uniforms[location], HEAP32, value >> 2, count * 4);
        return
    }
    if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferIntViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAP32[value + 4 * i >> 2];
            view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAP32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Int32Array(view)
    }
    GLctx.uniform4iv(GL.uniforms[location], view)
}

function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 4);
        return
    }
    if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view)
}

function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 9);
        return
    }
    if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view)
}

function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 16);
        return
    }
    if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[16 * count - 1];
        for (var i = 0; i < 16 * count; i += 16) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
            view[i + 9] = HEAPF32[value + (4 * i + 36) >> 2];
            view[i + 10] = HEAPF32[value + (4 * i + 40) >> 2];
            view[i + 11] = HEAPF32[value + (4 * i + 44) >> 2];
            view[i + 12] = HEAPF32[value + (4 * i + 48) >> 2];
            view[i + 13] = HEAPF32[value + (4 * i + 52) >> 2];
            view[i + 14] = HEAPF32[value + (4 * i + 56) >> 2];
            view[i + 15] = HEAPF32[value + (4 * i + 60) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view)
}

function _emscripten_glUseProgram(program) {
    GLctx.useProgram(GL.programs[program])
}

function _emscripten_glValidateProgram(program) {
    GLctx.validateProgram(GL.programs[program])
}

function _emscripten_glVertexAttrib1f(x0, x1) {
    GLctx["vertexAttrib1f"](x0, x1)
}

function _emscripten_glVertexAttrib1fv(index, v) {
    GLctx.vertexAttrib1f(index, HEAPF32[v >> 2])
}

function _emscripten_glVertexAttrib2f(x0, x1, x2) {
    GLctx["vertexAttrib2f"](x0, x1, x2)
}

function _emscripten_glVertexAttrib2fv(index, v) {
    GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2])
}

function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
    GLctx["vertexAttrib3f"](x0, x1, x2, x3)
}

function _emscripten_glVertexAttrib3fv(index, v) {
    GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2])
}

function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
    GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4)
}

function _emscripten_glVertexAttrib4fv(index, v) {
    GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2])
}

function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
    GLctx["vertexAttribDivisor"](index, divisor)
}

function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}

function _emscripten_glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3)
}

function __reallyNegative(x) {
    return x < 0 || x === 0 && 1 / x === -Infinity
}

function convertI32PairToI53(lo, hi) {
    return (lo >>> 0) + hi * 4294967296
}

function convertU32PairToI53(lo, hi) {
    return (lo >>> 0) + (hi >>> 0) * 4294967296
}

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}

function __formatString(format, varargs) {
    var textIndex = format;
    var argIndex = varargs;

    function prepVararg(ptr, type) {
        if (type === "double" || type === "i64") {
            if (ptr & 7) {
                ptr += 4
            }
        } else {
        }
        return ptr
    }

    function getNextArg(type) {
        var ret;
        argIndex = prepVararg(argIndex, type);
        if (type === "double") {
            ret = HEAPF64[argIndex >> 3];
            argIndex += 8
        } else if (type == "i64") {
            ret = [HEAP32[argIndex >> 2], HEAP32[argIndex + 4 >> 2]];
            argIndex += 8
        } else {
            type = "i32";
            ret = HEAP32[argIndex >> 2];
            argIndex += 4
        }
        return ret
    }

    var ret = [];
    var curr, next, currArg;
    while (1) {
        var startTextIndex = textIndex;
        curr = HEAP8[textIndex >> 0];
        if (curr === 0) break;
        next = HEAP8[textIndex + 1 >> 0];
        if (curr == 37) {
            var flagAlwaysSigned = false;
            var flagLeftAlign = false;
            var flagAlternative = false;
            var flagZeroPad = false;
            var flagPadSign = false;
            flagsLoop:while (1) {
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
                            break flagsLoop
                        } else {
                            flagZeroPad = true;
                            break
                        }
                    case 32:
                        flagPadSign = true;
                        break;
                    default:
                        break flagsLoop
                }
                textIndex++;
                next = HEAP8[textIndex + 1 >> 0]
            }
            var width = 0;
            if (next == 42) {
                width = getNextArg("i32");
                textIndex++;
                next = HEAP8[textIndex + 1 >> 0]
            } else {
                while (next >= 48 && next <= 57) {
                    width = width * 10 + (next - 48);
                    textIndex++;
                    next = HEAP8[textIndex + 1 >> 0]
                }
            }
            var precisionSet = false, precision = -1;
            if (next == 46) {
                precision = 0;
                precisionSet = true;
                textIndex++;
                next = HEAP8[textIndex + 1 >> 0];
                if (next == 42) {
                    precision = getNextArg("i32");
                    textIndex++
                } else {
                    while (1) {
                        var precisionChr = HEAP8[textIndex + 1 >> 0];
                        if (precisionChr < 48 || precisionChr > 57) break;
                        precision = precision * 10 + (precisionChr - 48);
                        textIndex++
                    }
                }
                next = HEAP8[textIndex + 1 >> 0]
            }
            if (precision < 0) {
                precision = 6;
                precisionSet = false
            }
            var argSize;
            switch (String.fromCharCode(next)) {
                case"h":
                    var nextNext = HEAP8[textIndex + 2 >> 0];
                    if (nextNext == 104) {
                        textIndex++;
                        argSize = 1
                    } else {
                        argSize = 2
                    }
                    break;
                case"l":
                    var nextNext = HEAP8[textIndex + 2 >> 0];
                    if (nextNext == 108) {
                        textIndex++;
                        argSize = 8
                    } else {
                        argSize = 4
                    }
                    break;
                case"L":
                case"q":
                case"j":
                    argSize = 8;
                    break;
                case"z":
                case"t":
                case"I":
                    argSize = 4;
                    break;
                default:
                    argSize = null
            }
            if (argSize) textIndex++;
            next = HEAP8[textIndex + 1 >> 0];
            switch (String.fromCharCode(next)) {
                case"d":
                case"i":
                case"u":
                case"o":
                case"x":
                case"X":
                case"p": {
                    var signed = next == 100 || next == 105;
                    argSize = argSize || 4;
                    currArg = getNextArg("i" + argSize * 8);
                    var argText;
                    if (argSize == 8) {
                        currArg = next == 117 ? convertU32PairToI53(currArg[0], currArg[1]) : convertI32PairToI53(currArg[0], currArg[1])
                    }
                    if (argSize <= 4) {
                        var limit = Math.pow(256, argSize) - 1;
                        currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8)
                    }
                    var currAbsArg = Math.abs(currArg);
                    var prefix = "";
                    if (next == 100 || next == 105) {
                        argText = reSign(currArg, 8 * argSize, 1).toString(10)
                    } else if (next == 117) {
                        argText = unSign(currArg, 8 * argSize, 1).toString(10);
                        currArg = Math.abs(currArg)
                    } else if (next == 111) {
                        argText = (flagAlternative ? "0" : "") + currAbsArg.toString(8)
                    } else if (next == 120 || next == 88) {
                        prefix = flagAlternative && currArg != 0 ? "0x" : "";
                        if (currArg < 0) {
                            currArg = -currArg;
                            argText = (currAbsArg - 1).toString(16);
                            var buffer = [];
                            for (var i = 0; i < argText.length; i++) {
                                buffer.push((15 - parseInt(argText[i], 16)).toString(16))
                            }
                            argText = buffer.join("");
                            while (argText.length < argSize * 2) argText = "f" + argText
                        } else {
                            argText = currAbsArg.toString(16)
                        }
                        if (next == 88) {
                            prefix = prefix.toUpperCase();
                            argText = argText.toUpperCase()
                        }
                    } else if (next == 112) {
                        if (currAbsArg === 0) {
                            argText = "(nil)"
                        } else {
                            prefix = "0x";
                            argText = currAbsArg.toString(16)
                        }
                    }
                    if (precisionSet) {
                        while (argText.length < precision) {
                            argText = "0" + argText
                        }
                    }
                    if (currArg >= 0) {
                        if (flagAlwaysSigned) {
                            prefix = "+" + prefix
                        } else if (flagPadSign) {
                            prefix = " " + prefix
                        }
                    }
                    if (argText.charAt(0) == "-") {
                        prefix = "-" + prefix;
                        argText = argText.substr(1)
                    }
                    while (prefix.length + argText.length < width) {
                        if (flagLeftAlign) {
                            argText += " "
                        } else {
                            if (flagZeroPad) {
                                argText = "0" + argText
                            } else {
                                prefix = " " + prefix
                            }
                        }
                    }
                    argText = prefix + argText;
                    argText.split("").forEach(function (chr) {
                        ret.push(chr.charCodeAt(0))
                    });
                    break
                }
                case"f":
                case"F":
                case"e":
                case"E":
                case"g":
                case"G": {
                    currArg = getNextArg("double");
                    var argText;
                    if (isNaN(currArg)) {
                        argText = "nan";
                        flagZeroPad = false
                    } else if (!isFinite(currArg)) {
                        argText = (currArg < 0 ? "-" : "") + "inf";
                        flagZeroPad = false
                    } else {
                        var isGeneral = false;
                        var effectivePrecision = Math.min(precision, 20);
                        if (next == 103 || next == 71) {
                            isGeneral = true;
                            precision = precision || 1;
                            var exponent = parseInt(currArg.toExponential(effectivePrecision).split("e")[1], 10);
                            if (precision > exponent && exponent >= -4) {
                                next = (next == 103 ? "f" : "F").charCodeAt(0);
                                precision -= exponent + 1
                            } else {
                                next = (next == 103 ? "e" : "E").charCodeAt(0);
                                precision--
                            }
                            effectivePrecision = Math.min(precision, 20)
                        }
                        if (next == 101 || next == 69) {
                            argText = currArg.toExponential(effectivePrecision);
                            if (/[eE][-+]\d$/.test(argText)) {
                                argText = argText.slice(0, -1) + "0" + argText.slice(-1)
                            }
                        } else if (next == 102 || next == 70) {
                            argText = currArg.toFixed(effectivePrecision);
                            if (currArg === 0 && __reallyNegative(currArg)) {
                                argText = "-" + argText
                            }
                        }
                        var parts = argText.split("e");
                        if (isGeneral && !flagAlternative) {
                            while (parts[0].length > 1 && parts[0].indexOf(".") != -1 && (parts[0].slice(-1) == "0" || parts[0].slice(-1) == ".")) {
                                parts[0] = parts[0].slice(0, -1)
                            }
                        } else {
                            if (flagAlternative && argText.indexOf(".") == -1) parts[0] += ".";
                            while (precision > effectivePrecision++) parts[0] += "0"
                        }
                        argText = parts[0] + (parts.length > 1 ? "e" + parts[1] : "");
                        if (next == 69) argText = argText.toUpperCase();
                        if (currArg >= 0) {
                            if (flagAlwaysSigned) {
                                argText = "+" + argText
                            } else if (flagPadSign) {
                                argText = " " + argText
                            }
                        }
                    }
                    while (argText.length < width) {
                        if (flagLeftAlign) {
                            argText += " "
                        } else {
                            if (flagZeroPad && (argText[0] == "-" || argText[0] == "+")) {
                                argText = argText[0] + "0" + argText.slice(1)
                            } else {
                                argText = (flagZeroPad ? "0" : " ") + argText
                            }
                        }
                    }
                    if (next < 97) argText = argText.toUpperCase();
                    argText.split("").forEach(function (chr) {
                        ret.push(chr.charCodeAt(0))
                    });
                    break
                }
                case"s": {
                    var arg = getNextArg("i8*");
                    var argLength = arg ? _strlen(arg) : "(null)".length;
                    if (precisionSet) argLength = Math.min(argLength, precision);
                    if (!flagLeftAlign) {
                        while (argLength < width--) {
                            ret.push(32)
                        }
                    }
                    if (arg) {
                        for (var i = 0; i < argLength; i++) {
                            ret.push(HEAPU8[arg++ >> 0])
                        }
                    } else {
                        ret = ret.concat(intArrayFromString("(null)".substr(0, argLength), true))
                    }
                    if (flagLeftAlign) {
                        while (argLength < width--) {
                            ret.push(32)
                        }
                    }
                    break
                }
                case"c": {
                    if (flagLeftAlign) ret.push(getNextArg("i8"));
                    while (--width > 0) {
                        ret.push(32)
                    }
                    if (!flagLeftAlign) ret.push(getNextArg("i8"));
                    break
                }
                case"n": {
                    var ptr = getNextArg("i32*");
                    HEAP32[ptr >> 2] = ret.length;
                    break
                }
                case"%": {
                    ret.push(curr);
                    break
                }
                default: {
                    for (var i = startTextIndex; i < textIndex + 2; i++) {
                        ret.push(HEAP8[i >> 0])
                    }
                }
            }
            textIndex += 2
        } else {
            ret.push(curr);
            textIndex += 1
        }
    }
    return ret
}

function __emscripten_traverse_stack(args) {
    if (!args || !args.callee || !args.callee.name) {
        return [null, "", ""]
    }
    var funstr = args.callee.toString();
    var funcname = args.callee.name;
    var str = "(";
    var first = true;
    for (var i in args) {
        var a = args[i];
        if (!first) {
            str += ", "
        }
        first = false;
        if (typeof a === "number" || typeof a === "string") {
            str += a
        } else {
            str += "(" + typeof a + ")"
        }
    }
    str += ")";
    var caller = args.callee.caller;
    args = caller ? caller.arguments : [];
    if (first) str = "";
    return [args, funcname, str]
}

function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error
        } catch (e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}

function abortStackOverflow(allocSize) {
    abort("Stack overflow! Attempted to allocate " + allocSize + " bytes on the stack, but stack has only " + (STACK_MAX - stackSave() + allocSize) + " bytes available!")
}

function demangle(func) {
    return func
}

function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text)
    }
}

function _emscripten_get_callstack_js(flags) {
    var callstack = jsStackTrace();
    var iThisFunc = callstack.lastIndexOf("_emscripten_log");
    var iThisFunc2 = callstack.lastIndexOf("_emscripten_get_callstack");
    var iNextLine = callstack.indexOf("\n", Math.max(iThisFunc, iThisFunc2)) + 1;
    callstack = callstack.slice(iNextLine);
    if (flags & 8 && typeof emscripten_source_map === "undefined") {
        warnOnce('Source map information is not available, emscripten_log with EM_LOG_C_STACK will be ignored. Build with "--pre-js $EMSCRIPTEN/src/emscripten-source-map.min.js" linker flag to add source map loading to code.');
        flags ^= 8;
        flags |= 16
    }
    var stack_args = null;
    if (flags & 128) {
        stack_args = __emscripten_traverse_stack(arguments);
        while (stack_args[1].indexOf("_emscripten_") >= 0) stack_args = __emscripten_traverse_stack(stack_args[0])
    }
    var lines = callstack.split("\n");
    callstack = "";
    var newFirefoxRe = new RegExp("\\s*(.*?)@(.*?):([0-9]+):([0-9]+)");
    var firefoxRe = new RegExp("\\s*(.*?)@(.*):(.*)(:(.*))?");
    var chromeRe = new RegExp("\\s*at (.*?) \\((.*):(.*):(.*)\\)");
    for (var l in lines) {
        var line = lines[l];
        var jsSymbolName = "";
        var file = "";
        var lineno = 0;
        var column = 0;
        var parts = chromeRe.exec(line);
        if (parts && parts.length == 5) {
            jsSymbolName = parts[1];
            file = parts[2];
            lineno = parts[3];
            column = parts[4]
        } else {
            parts = newFirefoxRe.exec(line);
            if (!parts) parts = firefoxRe.exec(line);
            if (parts && parts.length >= 4) {
                jsSymbolName = parts[1];
                file = parts[2];
                lineno = parts[3];
                column = parts[4] | 0
            } else {
                callstack += line + "\n";
                continue
            }
        }
        var cSymbolName = flags & 32 ? demangle(jsSymbolName) : jsSymbolName;
        if (!cSymbolName) {
            cSymbolName = jsSymbolName
        }
        var haveSourceMap = false;
        if (flags & 8) {
            var orig = emscripten_source_map.originalPositionFor({line: lineno, column: column});
            haveSourceMap = orig && orig.source;
            if (haveSourceMap) {
                if (flags & 64) {
                    orig.source = orig.source.substring(orig.source.replace(/\\/g, "/").lastIndexOf("/") + 1)
                }
                callstack += "    at " + cSymbolName + " (" + orig.source + ":" + orig.line + ":" + orig.column + ")\n"
            }
        }
        if (flags & 16 || !haveSourceMap) {
            if (flags & 64) {
                file = file.substring(file.replace(/\\/g, "/").lastIndexOf("/") + 1)
            }
            callstack += (haveSourceMap ? "     = " + jsSymbolName : "    at " + cSymbolName) + " (" + file + ":" + lineno + ":" + column + ")\n"
        }
        if (flags & 128 && stack_args[0]) {
            if (stack_args[1] == jsSymbolName && stack_args[2].length > 0) {
                callstack = callstack.replace(/\s+$/, "");
                callstack += " with values: " + stack_args[1] + stack_args[2] + "\n"
            }
            stack_args = __emscripten_traverse_stack(stack_args[0])
        }
    }
    callstack = callstack.replace(/\s+$/, "");
    return callstack
}

function _emscripten_log_js(flags, str) {
    if (flags & 24) {
        str = str.replace(/\s+$/, "");
        str += (str.length > 0 ? "\n" : "") + _emscripten_get_callstack_js(flags)
    }
    if (flags & 1) {
        if (flags & 4) {
            console.error(str)
        } else if (flags & 2) {
            console.warn(str)
        } else {
            console.log(str)
        }
    } else if (flags & 6) {
        err(str)
    } else {
        out(str)
    }
}

function _emscripten_log(flags, varargs) {
    var format = HEAP32[varargs >> 2];
    varargs += 4;
    var str = "";
    if (format) {
        var result = __formatString(format, varargs);
        for (var i = 0; i < result.length; ++i) {
            str += String.fromCharCode(result[i])
        }
    }
    _emscripten_log_js(flags, str)
}

function _emscripten_performance_now() {
    return performance.now()
}

function _emscripten_request_animation_frame_loop(cb, userData) {
    function tick(timeStamp) {
        if (dynCall_idi(cb, timeStamp, userData)) {
            requestAnimationFrame(tick)
        }
    }

    return requestAnimationFrame(tick)
}

function abortOnCannotGrowMemory(requestedSize) {
    abort("OOM")
}

function _emscripten_resize_heap(requestedSize) {
    abortOnCannotGrowMemory(requestedSize)
}

var JSEvents = {
    keyEvent: 0,
    mouseEvent: 0,
    wheelEvent: 0,
    uiEvent: 0,
    focusEvent: 0,
    deviceOrientationEvent: 0,
    deviceMotionEvent: 0,
    fullscreenChangeEvent: 0,
    pointerlockChangeEvent: 0,
    visibilityChangeEvent: 0,
    touchEvent: 0,
    previousFullscreenElement: null,
    previousScreenX: null,
    previousScreenY: null,
    removeEventListenersRegistered: false,
    removeAllEventListeners: function () {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i)
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = []
    },
    deferredCalls: [],
    deferCall: function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false
            }
            return true
        }

        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({targetFunction: targetFunction, precedence: precedence, argsList: argsList});
        JSEvents.deferredCalls.sort(function (x, y) {
            return x.precedence < y.precedence
        })
    },
    removeDeferredCalls: function (targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i
            }
        }
    },
    canPerformEventHandlerRequests: function () {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls: function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList)
        }
    },
    inEventHandler: 0,
    currentEventHandler: null,
    eventHandlers: [],
    isInternetExplorer: function () {
        return navigator.userAgent.indexOf("MSIE") !== -1 || navigator.appVersion.indexOf("Trident/") > 0
    },
    removeAllHandlersOnTarget: function (target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    },
    _removeHandler: function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler: function (eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler)
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
    },
    getNodeNameForTarget: function (target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName : ""
    },
    fullscreenEnabled: function () {
        return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled
    }
};

function __maybeCStringToJsString(cString) {
    return cString === cString + 0 ? UTF8ToString(cString) : cString
}

var __specialEventTargets = [0, document, window];

function __findEventTarget(target) {
    var domElement = __specialEventTargets[target] || document.querySelector(__maybeCStringToJsString(target));
    return domElement
}

function __findCanvasEventTarget(target) {
    return __findEventTarget(target)
}

function _emscripten_set_canvas_element_size(target, width, height) {
    var canvas = __findCanvasEventTarget(target);
    if (!canvas) return -4;
    canvas.width = width;
    canvas.height = height;
    return 0
}

var Fetch = {
    xhrs: [], setu64: function (addr, val) {
        HEAPU32[addr >> 2] = val;
        HEAPU32[addr + 4 >> 2] = val / 4294967296 | 0
    }, staticInit: function () {
    }
};

function __emscripten_fetch_xhr(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
    var url = HEAPU32[fetch + 8 >> 2];
    if (!url) {
        onerror(fetch, 0, "no url specified!");
        return
    }
    var url_ = UTF8ToString(url);
    var fetch_attr = fetch + 112;
    var requestMethod = UTF8ToString(fetch_attr);
    if (!requestMethod) requestMethod = "GET";
    var userData = HEAPU32[fetch_attr + 32 >> 2];
    var fetchAttributes = HEAPU32[fetch_attr + 52 >> 2];
    var timeoutMsecs = HEAPU32[fetch_attr + 56 >> 2];
    var withCredentials = !!HEAPU32[fetch_attr + 60 >> 2];
    var destinationPath = HEAPU32[fetch_attr + 64 >> 2];
    var userName = HEAPU32[fetch_attr + 68 >> 2];
    var password = HEAPU32[fetch_attr + 72 >> 2];
    var requestHeaders = HEAPU32[fetch_attr + 76 >> 2];
    var overriddenMimeType = HEAPU32[fetch_attr + 80 >> 2];
    var dataPtr = HEAPU32[fetch_attr + 84 >> 2];
    var dataLength = HEAPU32[fetch_attr + 88 >> 2];
    var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
    var fetchAttrStreamData = !!(fetchAttributes & 2);
    var fetchAttrAppend = !!(fetchAttributes & 8);
    var fetchAttrReplace = !!(fetchAttributes & 16);
    var fetchAttrSynchronous = !!(fetchAttributes & 64);
    var fetchAttrWaitable = !!(fetchAttributes & 128);
    var userNameStr = userName ? UTF8ToString(userName) : undefined;
    var passwordStr = password ? UTF8ToString(password) : undefined;
    var overriddenMimeTypeStr = overriddenMimeType ? UTF8ToString(overriddenMimeType) : undefined;
    var xhr = new XMLHttpRequest;
    xhr.withCredentials = withCredentials;
    xhr.open(requestMethod, url_, !fetchAttrSynchronous, userNameStr, passwordStr);
    if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs;
    xhr.url_ = url_;
    xhr.responseType = "arraybuffer";
    if (overriddenMimeType) {
        xhr.overrideMimeType(overriddenMimeTypeStr)
    }
    if (requestHeaders) {
        for (; ;) {
            var key = HEAPU32[requestHeaders >> 2];
            if (!key) break;
            var value = HEAPU32[requestHeaders + 4 >> 2];
            if (!value) break;
            requestHeaders += 8;
            var keyStr = UTF8ToString(key);
            var valueStr = UTF8ToString(value);
            xhr.setRequestHeader(keyStr, valueStr)
        }
    }
    Fetch.xhrs.push(xhr);
    var id = Fetch.xhrs.length;
    HEAPU32[fetch + 0 >> 2] = id;
    var data = dataPtr && dataLength ? HEAPU8.slice(dataPtr, dataPtr + dataLength) : null;
    xhr.onload = function (e) {
        var len = xhr.response ? xhr.response.byteLength : 0;
        var ptr = 0;
        var ptrLen = 0;
        if (fetchAttrLoadToMemory && !fetchAttrStreamData) {
            ptrLen = len;
            ptr = _malloc(ptrLen);
            HEAPU8.set(new Uint8Array(xhr.response), ptr)
        }
        HEAPU32[fetch + 12 >> 2] = ptr;
        Fetch.setu64(fetch + 16, ptrLen);
        Fetch.setu64(fetch + 24, 0);
        if (len) {
            Fetch.setu64(fetch + 32, len)
        }
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        if (xhr.readyState === 4 && xhr.status === 0) {
            if (len > 0) xhr.status = 200; else xhr.status = 404
        }
        HEAPU16[fetch + 42 >> 1] = xhr.status;
        if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
        if (xhr.status >= 200 && xhr.status < 300) {
            if (onsuccess) onsuccess(fetch, xhr, e)
        } else {
            if (onerror) onerror(fetch, xhr, e)
        }
    };
    xhr.onerror = function (e) {
        var status = xhr.status;
        if (xhr.readyState === 4 && status === 0) status = 404;
        HEAPU32[fetch + 12 >> 2] = 0;
        Fetch.setu64(fetch + 16, 0);
        Fetch.setu64(fetch + 24, 0);
        Fetch.setu64(fetch + 32, 0);
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        HEAPU16[fetch + 42 >> 1] = status;
        if (onerror) onerror(fetch, xhr, e)
    };
    xhr.ontimeout = function (e) {
        if (onerror) onerror(fetch, xhr, e)
    };
    xhr.onprogress = function (e) {
        var ptrLen = fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response ? xhr.response.byteLength : 0;
        var ptr = 0;
        if (fetchAttrLoadToMemory && fetchAttrStreamData) {
            ptr = _malloc(ptrLen);
            HEAPU8.set(new Uint8Array(xhr.response), ptr)
        }
        HEAPU32[fetch + 12 >> 2] = ptr;
        Fetch.setu64(fetch + 16, ptrLen);
        Fetch.setu64(fetch + 24, e.loaded - ptrLen);
        Fetch.setu64(fetch + 32, e.total);
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0) xhr.status = 200;
        HEAPU16[fetch + 42 >> 1] = xhr.status;
        if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
        if (onprogress) onprogress(fetch, xhr, e)
    };
    xhr.onreadystatechange = function (e) {
        HEAPU16[fetch + 40 >> 1] = xhr.readyState;
        if (xhr.readyState >= 2) {
            HEAPU16[fetch + 42 >> 1] = xhr.status
        }
        if (onreadystatechange) onreadystatechange(fetch, xhr, e)
    };
    try {
        xhr.send(data)
    } catch (e) {
        if (onerror) onerror(fetch, xhr, e)
    }
}

var _fetch_work_queue = 788336;

function __emscripten_get_fetch_work_queue() {
    return _fetch_work_queue
}

function _emscripten_start_fetch(fetch, successcb, errorcb, progresscb, readystatechangecb) {
    if (typeof noExitRuntime !== "undefined") noExitRuntime = true;
    var fetch_attr = fetch + 112;
    var requestMethod = UTF8ToString(fetch_attr);
    var onsuccess = HEAPU32[fetch_attr + 36 >> 2];
    var onerror = HEAPU32[fetch_attr + 40 >> 2];
    var onprogress = HEAPU32[fetch_attr + 44 >> 2];
    var onreadystatechange = HEAPU32[fetch_attr + 48 >> 2];
    var fetchAttributes = HEAPU32[fetch_attr + 52 >> 2];
    var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
    var fetchAttrStreamData = !!(fetchAttributes & 2);
    var fetchAttrAppend = !!(fetchAttributes & 8);
    var fetchAttrReplace = !!(fetchAttributes & 16);
    var reportSuccess = function (fetch, xhr, e) {
        if (onsuccess) dynCall_vi(onsuccess, fetch); else if (successcb) successcb(fetch)
    };
    var reportProgress = function (fetch, xhr, e) {
        if (onprogress) dynCall_vi(onprogress, fetch); else if (progresscb) progresscb(fetch)
    };
    var reportError = function (fetch, xhr, e) {
        if (onerror) dynCall_vi(onerror, fetch); else if (errorcb) errorcb(fetch)
    };
    var reportReadyStateChange = function (fetch, xhr, e) {
        if (onreadystatechange) dynCall_vi(onreadystatechange, fetch); else if (readystatechangecb) readystatechangecb(fetch)
    };
    __emscripten_fetch_xhr(fetch, reportSuccess, reportError, reportProgress, reportReadyStateChange);
    return fetch
}

function _emscripten_throw_string(str) {
    throw UTF8ToString(str)
}

var __emscripten_webgl_power_preferences = ["default", "low-power", "high-performance"];

function _emscripten_webgl_do_create_context(target, attributes) {
    var contextAttributes = {};
    var a = attributes >> 2;
    contextAttributes["alpha"] = !!HEAP32[a + (0 >> 2)];
    contextAttributes["depth"] = !!HEAP32[a + (4 >> 2)];
    contextAttributes["stencil"] = !!HEAP32[a + (8 >> 2)];
    contextAttributes["antialias"] = !!HEAP32[a + (12 >> 2)];
    contextAttributes["premultipliedAlpha"] = !!HEAP32[a + (16 >> 2)];
    contextAttributes["preserveDrawingBuffer"] = !!HEAP32[a + (20 >> 2)];
    var powerPreference = HEAP32[a + (24 >> 2)];
    contextAttributes["powerPreference"] = __emscripten_webgl_power_preferences[powerPreference];
    contextAttributes["failIfMajorPerformanceCaveat"] = !!HEAP32[a + (28 >> 2)];
    contextAttributes.majorVersion = HEAP32[a + (32 >> 2)];
    contextAttributes.minorVersion = HEAP32[a + (36 >> 2)];
    contextAttributes.enableExtensionsByDefault = HEAP32[a + (40 >> 2)];
    contextAttributes.explicitSwapControl = HEAP32[a + (44 >> 2)];
    contextAttributes.proxyContextToMainThread = HEAP32[a + (48 >> 2)];
    contextAttributes.renderViaOffscreenBackBuffer = HEAP32[a + (52 >> 2)];
    var canvas = __findCanvasEventTarget(target);
    if (!canvas) {
        return 0
    }
    if (contextAttributes.explicitSwapControl) {
        return 0
    }
    var contextHandle = GL.createContext(canvas, contextAttributes);
    return contextHandle
}

function _emscripten_webgl_create_context(a0, a1) {
    return _emscripten_webgl_do_create_context(a0, a1)
}

function _emscripten_webgl_destroy_context_calling_thread(contextHandle) {
    if (GL.currentContext == contextHandle) GL.currentContext = 0;
    GL.deleteContext(contextHandle)
}

function _emscripten_webgl_destroy_context(a0) {
    return _emscripten_webgl_destroy_context_calling_thread(a0)
}

function _emscripten_webgl_init_context_attributes(attributes) {
    var a = attributes >> 2;
    for (var i = 0; i < 56 >> 2; ++i) {
        HEAP32[a + i] = 0
    }
    HEAP32[a + (0 >> 2)] = HEAP32[a + (4 >> 2)] = HEAP32[a + (12 >> 2)] = HEAP32[a + (16 >> 2)] = HEAP32[a + (32 >> 2)] = HEAP32[a + (40 >> 2)] = 1
}

function _emscripten_webgl_make_context_current(contextHandle) {
    var success = GL.makeContextCurrent(contextHandle);
    return success ? 0 : -5
}

Module["_emscripten_webgl_make_context_current"] = _emscripten_webgl_make_context_current;

function _exit(status) {
    throw"exit(" + status + ")"
}

function _glActiveTexture(x0) {
    GLctx["activeTexture"](x0)
}

function _glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}

function _glBindBuffer(target, buffer) {
    if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer
    } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer
    }
    GLctx.bindBuffer(target, GL.buffers[buffer])
}

function _glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}

function _glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}

function _glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture])
}

function _glBlendColor(x0, x1, x2, x3) {
    GLctx["blendColor"](x0, x1, x2, x3)
}

function _glBlendEquationSeparate(x0, x1) {
    GLctx["blendEquationSeparate"](x0, x1)
}

function _glBlendFuncSeparate(x0, x1, x2, x3) {
    GLctx["blendFuncSeparate"](x0, x1, x2, x3)
}

function _glBufferData(target, size, data, usage) {
    if (GL.currentContext.version >= 2) {
        if (data) {
            GLctx.bufferData(target, HEAPU8, usage, data, size)
        } else {
            GLctx.bufferData(target, size, usage)
        }
    } else {
        GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
    }
}

function _glBufferSubData(target, offset, size, data) {
    if (GL.currentContext.version >= 2) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return
    }
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
}

function _glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0)
}

function _glClear(x0) {
    GLctx["clear"](x0)
}

function _glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3)
}

function _glClearDepthf(x0) {
    GLctx["clearDepth"](x0)
}

function _glClearStencil(x0) {
    GLctx["clearStencil"](x0)
}

function _glColorMask(red, green, blue, alpha) {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
}

function _glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader])
}

function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, imageSize, data)
        } else {
            GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, imageSize, data)
        } else {
            GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize)
        }
        return
    }
    GLctx["compressedTexSubImage2D"](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
}

function _glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    GL.programs[id] = program;
    return id
}

function _glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}

function _glCullFace(x0) {
    GLctx["cullFace"](x0)
}

function _glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0
    }
}

function _glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}

function _glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
    GL.programInfos[id] = null
}

function _glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}

function _glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
}

function _glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}

function _glDepthFunc(x0) {
    GLctx["depthFunc"](x0)
}

function _glDepthMask(flag) {
    GLctx.depthMask(!!flag)
}

function _glDetachShader(program, shader) {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader])
}

function _glDisable(x0) {
    GLctx["disable"](x0)
}

function _glDisableVertexAttribArray(index) {
    GLctx.disableVertexAttribArray(index)
}

function _glDrawArrays(mode, first, count) {
    GLctx.drawArrays(mode, first, count)
}

function _glDrawElements(mode, count, type, indices) {
    GLctx.drawElements(mode, count, type, indices)
}

function _glEnable(x0) {
    GLctx["enable"](x0)
}

function _glEnableVertexAttribArray(index) {
    GLctx.enableVertexAttribArray(index)
}

function _glFlush() {
    GLctx["flush"]()
}

function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}

function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}

function _glFrontFace(x0) {
    GLctx["frontFace"](x0)
}

function _glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}

function _glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}

function _glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}

function _glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures)
}

function _glGenerateMipmap(x0) {
    GLctx["generateMipmap"](x0)
}

function _glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx.getActiveAttrib(program, index);
    if (!info) return;
    var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    if (size) HEAP32[size >> 2] = info.size;
    if (type) HEAP32[type >> 2] = info.type
}

function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    program = GL.programs[program];
    var info = GLctx.getActiveUniform(program, index);
    if (!info) return;
    var numBytesWrittenExclNull = bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    if (size) HEAP32[size >> 2] = info.size;
    if (type) HEAP32[type >> 2] = info.type
}

function _glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}

function _glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
}

function _glGetFloatv(name_, p) {
    emscriptenWebGLGet(name_, p, 2)
}

function _glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0)
}

function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    var ptable = GL.programInfos[program];
    if (!ptable) {
        GL.recordError(1282);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength
    } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
            program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, 35721);
            ptable.maxAttributeLength = 0;
            for (var i = 0; i < numAttribs; ++i) {
                var activeAttrib = GLctx.getActiveAttrib(program, i);
                ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength
    } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
            program = GL.programs[program];
            var numBlocks = GLctx.getProgramParameter(program, 35382);
            ptable.maxUniformBlockNameLength = 0;
            for (var i = 0; i < numBlocks; ++i) {
                var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname)
    }
}

function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}

function _glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}

function _glGetString(name_) {
    if (GL.stringCache[name_]) return GL.stringCache[name_];
    var ret;
    switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function (e) {
                return "GL_" + e
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280)
            }
            ret = stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(7938);
            if (GL.currentContext.version >= 2) glVersion = "OpenGL ES 3.0 (" + glVersion + ")"; else {
                glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
            }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280);
            return 0
    }
    GL.stringCache[name_] = ret;
    return ret
}

function _glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    var arrayIndex = 0;
    if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? jstoi_q(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace)
    }
    var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
    if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex
    } else {
        return -1
    }
}

function _glLinkProgram(program) {
    GLctx.linkProgram(GL.programs[program]);
    GL.populateUniformTable(program)
}

function _glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
}

function _glReadPixels(x, y, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelPackBufferBinding) {
            GLctx.readPixels(x, y, width, height, format, type, pixels)
        } else {
            var heap = __heapObjectForWebGLType(type);
            GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap))
        }
        return
    }
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}

function _glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3)
}

function _glScissor(x0, x1, x2, x3) {
    GLctx["scissor"](x0, x1, x2, x3)
}

function _glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}

function _glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}

function _glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}

function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels)
        } else if (pixels) {
            var heap = __heapObjectForWebGLType(type);
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null)
        }
        return
    }
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}

function _glTexParameterf(x0, x1, x2) {
    GLctx["texParameterf"](x0, x1, x2)
}

function _glTexParameterfv(target, pname, params) {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param)
}

function _glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2)
}

function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels)
        } else if (pixels) {
            var heap = __heapObjectForWebGLType(type);
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> __heapAccessShiftForWebGLHeap(heap))
        } else {
            GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null)
        }
        return
    }
    var pixelData = null;
    if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}

function _glUniform1i(location, v0) {
    GLctx.uniform1i(GL.uniforms[location], v0)
}

function _glUniform1iv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform1iv(GL.uniforms[location], HEAP32, value >> 2, count);
        return
    }
    if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferIntViews[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAP32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Int32Array(view)
    }
    GLctx.uniform1iv(GL.uniforms[location], view)
}

function _glUniform4fv(location, count, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return
    }
    if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniform4fv(GL.uniforms[location], view)
}

function _glUniformMatrix3fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 9);
        return
    }
    if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view)
}

function _glUniformMatrix4fv(location, count, transpose, value) {
    if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, HEAPF32, value >> 2, count * 16);
        return
    }
    if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferFloatViews[16 * count - 1];
        for (var i = 0; i < 16 * count; i += 16) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
            view[i + 9] = HEAPF32[value + (4 * i + 36) >> 2];
            view[i + 10] = HEAPF32[value + (4 * i + 40) >> 2];
            view[i + 11] = HEAPF32[value + (4 * i + 44) >> 2];
            view[i + 12] = HEAPF32[value + (4 * i + 48) >> 2];
            view[i + 13] = HEAPF32[value + (4 * i + 52) >> 2];
            view[i + 14] = HEAPF32[value + (4 * i + 56) >> 2];
            view[i + 15] = HEAPF32[value + (4 * i + 60) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
        if (GL.currentContext.cannotHandleOffsetsInUniformArrayViews) view = new Float32Array(view)
    }
    GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view)
}

function _glUseProgram(program) {
    GLctx.useProgram(GL.programs[program])
}

function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}

function _glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3)
}

function _js_html_audioCheckLoad(audioClipIdx) {
    var WORKING_ON_IT = 0;
    var SUCCESS = 1;
    var FAILED = 2;
    if (!this.audioContext || audioClipIdx < 0) return FAILED;
    if (this.audioBuffers[audioClipIdx] == null) return FAILED;
    if (this.audioBuffers[audioClipIdx] === "loading") return WORKING_ON_IT;
    if (this.audioBuffers[audioClipIdx] === "error") return FAILED;
    return SUCCESS
}

function _js_html_audioFree(audioClipIdx) {
    var audioBuffer = this.audioBuffers[audioClipIdx];
    if (!audioBuffer) return;
    for (var i = 0; i < this.audioSources.length; ++i) {
        var sourceNode = this.audioSources[i];
        if (sourceNode && sourceNode.buffer === audioBuffer) sourceNode.stop()
    }
    this.audioBuffers[audioClipIdx] = null
}

function _js_html_audioIsPlaying(audioSourceIdx) {
    if (!this.audioContext || audioSourceIdx < 0) return false;
    if (this.audioSources[audioSourceIdx] == null) return false;
    return this.audioSources[audioSourceIdx].isPlaying
}

function _js_html_audioIsUnlocked() {
    return this.unlocked
}

function _js_html_audioPause() {
    if (this.audioContext && this.audioContext.suspend) {
        this.audioContext.suspend()
    }
}

function _js_html_audioPlay(audioClipIdx, audioSourceIdx, volume, pitch, pan, loop) {
    if (!this.audioContext || audioClipIdx < 0 || audioSourceIdx < 0) return false;
    if (this.audioContext.state !== "running") return false;
    var srcBuffer = this.audioBuffers[audioClipIdx];
    if (!srcBuffer || typeof srcBuffer === "string") return false;
    var sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = srcBuffer;
    sourceNode.playbackRate.value = pitch;
    var panNode = this.audioContext.createPanner();
    panNode.panningModel = "equalpower";
    sourceNode.panNode = panNode;
    var gainNode = this.audioContext.createGain();
    gainNode.buffer = srcBuffer;
    sourceNode.gainNode = gainNode;
    sourceNode.connect(gainNode);
    sourceNode.gainNode.connect(panNode);
    sourceNode.panNode.connect(this.audioContext.destination);
    ut._HTML.audio_setGain(sourceNode, volume);
    ut._HTML.audio_setPan(sourceNode, pan);
    sourceNode.loop = loop;
    if (this.audioSources[audioSourceIdx] != undefined) this.audioSources[audioSourceIdx].stop();
    this.audioSources[audioSourceIdx] = sourceNode;
    sourceNode.onended = function (event) {
        sourceNode.stop();
        sourceNode.isPlaying = false
    };
    sourceNode.start();
    sourceNode.isPlaying = true;
    return true
}

function _js_html_audioResume() {
    if (this.audioContext && this.audioContext.resume) {
        this.audioContext.resume()
    }
}

function _js_html_audioSetPan(audioSourceIdx, pan) {
    if (!this.audioContext || audioSourceIdx < 0) return false;
    var sourceNode = this.audioSources[audioSourceIdx];
    if (!sourceNode) return false;
    ut._HTML.audio_setPan(sourceNode, pan);
    return true
}

function _js_html_audioSetPitch(audioSourceIdx, pitch) {
    if (!this.audioContext || audioSourceIdx < 0) return false;
    var sourceNode = this.audioSources[audioSourceIdx];
    if (!sourceNode) return false;
    sourceNode.playbackRate.value = pitch;
    return true
}

function _js_html_audioSetVolume(audioSourceIdx, volume) {
    if (!this.audioContext || audioSourceIdx < 0) return false;
    var sourceNode = this.audioSources[audioSourceIdx];
    if (!sourceNode) return false;
    ut._HTML.audio_setGain(sourceNode, volume);
    return true
}

function _js_html_audioStartLoadFile(audioClipName, audioClipIdx) {
    if (!this.audioContext || audioClipIdx < 0) return -1;
    audioClipName = UTF8ToString(audioClipName);
    var url = audioClipName;
    if (url.substring(0, 9) === "ut-asset:") url = UT_ASSETS[url.substring(9)];
    var self = this;
    var request = new XMLHttpRequest;
    self.audioBuffers[audioClipIdx] = "loading";
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
        self.audioContext.decodeAudioData(request.response, function (buffer) {
            self.audioBuffers[audioClipIdx] = buffer
        })
    };
    request.onerror = function () {
        self.audioBuffers[audioClipIdx] = "error"
    };
    try {
        request.send()
    } catch (e) {
        self.audioBuffers[audioClipIdx] = "error"
    }
    return audioClipIdx
}

function _js_html_audioStop(audioSourceIdx, dostop) {
    if (!this.audioContext || audioSourceIdx < 0) return;
    var sourceNode = this.audioSources[audioSourceIdx];
    if (!sourceNode) return;
    sourceNode.onended = null;
    this.audioSources[audioSourceIdx] = null;
    if (sourceNode.isPlaying && dostop) {
        sourceNode.stop();
        sourceNode.isPlaying = false
    }
}

function _js_html_audioUnlock() {
    var self = this;
    if (self.unlocked || !self.audioContext || typeof self.audioContext.resume !== "function") return;
    document.addEventListener("click", ut._HTML.unlock, true);
    document.addEventListener("touchstart", ut._HTML.unlock, true);
    document.addEventListener("touchend", ut._HTML.unlock, true);
    document.addEventListener("keydown", ut._HTML.unlock, true);
    document.addEventListener("keyup", ut._HTML.unlock, true)
}

function _js_html_checkLoadImage(idx) {
    var img = ut._HTML.images[idx];
    if (img.loaderror) {
        return 2
    }
    if (img.image) {
        if (!img.image.complete || !img.image.naturalWidth || !img.image.naturalHeight) return 0
    }
    if (img.mask) {
        if (!img.mask.complete || !img.mask.naturalWidth || !img.mask.naturalHeight) return 0
    }
    return 1
}

function _js_html_finishLoadImage(idx, wPtr, hPtr, alphaPtr) {
    var img = ut._HTML.images[idx];
    if (img.image && img.mask) {
        var width = img.image.naturalWidth;
        var height = img.image.naturalHeight;
        var maskwidth = img.mask.naturalWidth;
        var maskheight = img.mask.naturalHeight;
        var cvscolor = document.createElement("canvas");
        cvscolor.width = width;
        cvscolor.height = height;
        var cxcolor = cvscolor.getContext("2d");
        cxcolor.globalCompositeOperation = "copy";
        cxcolor.drawImage(img.image, 0, 0);
        var cvsalpha = document.createElement("canvas");
        cvsalpha.width = width;
        cvsalpha.height = height;
        var cxalpha = cvsalpha.getContext("2d");
        cxalpha.globalCompositeOperation = "copy";
        cxalpha.drawImage(img.mask, 0, 0, width, height);
        var colorBits = cxcolor.getImageData(0, 0, width, height);
        var alphaBits = cxalpha.getImageData(0, 0, width, height);
        var cdata = colorBits.data, adata = alphaBits.data;
        var sz = width * height;
        for (var i = 0; i < sz; i++) cdata[(i << 2) + 3] = adata[i << 2];
        cxcolor.putImageData(colorBits, 0, 0);
        img.image = cvscolor;
        img.image.naturalWidth = width;
        img.image.naturalHeight = height;
        img.hasAlpha = true
    } else if (!img.image && img.mask) {
        var width = img.mask.naturalWidth;
        var height = img.mask.naturalHeight;
        var cvscolor = document.createElement("canvas");
        cvscolor.width = width;
        cvscolor.height = height;
        var cxcolor = cvscolor.getContext("2d");
        cxcolor.globalCompositeOperation = "copy";
        cxcolor.drawImage(img.mask, 0, 0);
        var colorBits = cxcolor.getImageData(0, 0, width, height);
        var cdata = colorBits.data;
        var sz = width * height;
        for (var i = 0; i < sz; i++) {
            cdata[(i << 2) + 1] = cdata[i << 2];
            cdata[(i << 2) + 2] = cdata[i << 2];
            cdata[(i << 2) + 3] = cdata[i << 2]
        }
        cxcolor.putImageData(colorBits, 0, 0);
        img.image = cvscolor;
        img.image.naturalWidth = width;
        img.image.naturalHeight = height;
        img.hasAlpha = true
    }
    HEAP32[wPtr >> 2] = img.image.naturalWidth;
    HEAP32[hPtr >> 2] = img.image.naturalHeight;
    HEAP32[alphaPtr >> 2] = img.hasAlpha
}

function _js_html_freeImage(idx) {
    ut._HTML.images[idx] = null
}

function _js_html_getCanvasSize(wPtr, hPtr) {
    var html = ut._HTML;
    HEAP32[wPtr >> 2] = html.canvasElement.width | 0;
    HEAP32[hPtr >> 2] = html.canvasElement.height | 0
}

function _js_html_getDPIScale() {
    return window.devicePixelRatio
}

function _js_html_getFrameSize(wPtr, hPtr) {
    HEAP32[wPtr >> 2] = window.innerWidth | 0;
    HEAP32[hPtr >> 2] = window.innerHeight | 0
}

function _js_html_getScreenSize(wPtr, hPtr) {
    HEAP32[wPtr >> 2] = screen.width | 0;
    HEAP32[hPtr >> 2] = screen.height | 0
}

function _js_html_imageToMemory(idx, w, h, dest) {
    var cvs = ut._HTML.readyCanvasForReadback(idx, w, h);
    if (!cvs) return 0;
    var cx = cvs.getContext("2d");
    var imd = cx.getImageData(0, 0, w, h);
    HEAPU8.set(imd.data, dest);
    return 1
}

function _js_html_init() {
    ut = ut || {};
    ut._HTML = ut._HTML || {};
    var html = ut._HTML;
    html.visible = true;
    html.focused = true
}

function _js_html_initAudio() {
    ut = ut || {};
    ut._HTML = ut._HTML || {};
    ut._HTML.audio_setGain = function (sourceNode, volume) {
        sourceNode.gainNode.gain.value = volume
    };
    ut._HTML.audio_setPan = function (sourceNode, pan) {
        sourceNode.panNode.setPosition(pan, 0, 1 - Math.abs(pan))
    };
    ut._HTML.unlock = function () {
        if (!self.audioContext || self.unlocked) return;

        function unlocked() {
            self.unlocked = true;
            delete self.unlockBuffer;
            document.removeEventListener("click", ut._HTML.unlock, true);
            document.removeEventListener("touchstart", ut._HTML.unlock, true);
            document.removeEventListener("touchend", ut._HTML.unlock, true);
            document.removeEventListener("keydown", ut._HTML.unlock, true);
            document.removeEventListener("keyup", ut._HTML.unlock, true)
        }

        if (self.audioContext.state === "running") {
            unlocked();
            return
        }
        var now = performance.now();
        if (self.lastUnlockAttempted && now - self.lastUnlockAttempted < 500) return;
        self.lastUnlockAttempted = now;
        if (self.audioContext.resume) self.audioContext.resume();
        if (!self.unlockBuffer) {
            self.unlockBuffer = self.audioContext.createBuffer(1, 1, 22050)
        }
        var source = self.audioContext.createBufferSource();
        source.buffer = self.unlockBuffer;
        source.connect(self.audioContext.destination);
        if (typeof source.start === "undefined") {
            source.noteOn(0)
        } else {
            source.start(0)
        }
        if (self.audioContext.resume) self.audioContext.resume();
        source.onended = function () {
            source.disconnect(0);
            unlocked()
        }
    };
    if (!window.AudioContext && !window.webkitAudioContext) return false;
    var audioContext = new (window.AudioContext || window.webkitAudioContext);
    if (!audioContext) return false;
    audioContext.listener.setPosition(0, 0, 0);
    this.audioContext = audioContext;
    this.audioBuffers = {};
    this.audioSources = {};
    this.unlocked = false;
    var navigator = typeof window !== "undefined" && window.navigator ? window.navigator : null;
    var isMobile = /iPhone|iPad|iPod|Android|BlackBerry|BB10|Silk|Mobi/i.test(navigator && navigator.userAgent);
    var isTouch = !!(isMobile || navigator && navigator.maxTouchPoints > 0 || navigator && navigator.msMaxTouchPoints > 0);
    if (this.audioContext.state !== "running" || isMobile || isTouch) {
        ut._HTML.unlock()
    } else {
        this.unlocked = true
    }
    return true
}

function _js_html_initImageLoading() {
    ut = ut || {};
    ut._HTML = ut._HTML || {};
    ut._HTML.images = [null];
    ut._HTML.tintedSprites = [null];
    ut._HTML.tintedSpritesFreeList = [];
    ut._HTML.initImage = function (idx) {
        ut._HTML.images[idx] = {
            image: null,
            mask: null,
            loaderror: false,
            hasAlpha: true,
            glTexture: null,
            glDisableSmoothing: false
        }
    };
    ut._HTML.ensureImageIsReadable = function (idx, w, h) {
        if (ut._HTML.canvasMode == "webgl2" || ut._HTML.canvasMode == "webgl") {
            var gl = ut._HTML.canvasContext;
            if (ut._HTML.images[idx].isrt) {
                if (!ut._HTML.images[idx].glTexture) return false;
                var pixels = new Uint8Array(w * h * 4);
                var fbo = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ut._HTML.images[idx].glTexture, 0);
                gl.viewport(0, 0, w, h);
                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
                    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
                } else {
                    console.log("Warning, can not read back from WebGL framebuffer.");
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.deleteFramebuffer(fbo);
                    return false
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.deleteFramebuffer(fbo);
                var canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                var cx = canvas.getContext("2d");
                var imd = cx.createImageData(w, h);
                imd.data.set(pixels);
                cx.putImageData(imd, 0, 0);
                ut._HTML.images[idx].image = canvas;
                return true
            }
        }
        if (ut._HTML.images[idx].isrt) return ut._HTML.images[idx].image && ut._HTML.images[idx].width == w && ut._HTML.images[idx].height == h; else return ut._HTML.images[idx].image && ut._HTML.images[idx].image.naturalWidth === w && ut._HTML.images[idx].image.naturalHeight === h
    };
    ut._HTML.readyCanvasForReadback = function (idx, w, h) {
        if (!ut._HTML.ensureImageIsReadable(idx, w, h)) return null;
        if (ut._HTML.images[idx].image instanceof HTMLCanvasElement) {
            return ut._HTML.images[idx].image
        } else {
            var cvs = document.createElement("canvas");
            cvs.width = w;
            cvs.height = h;
            var cx = cvs.getContext("2d");
            var srcimg = ut._HTML.images[idx].image;
            cx.globalCompositeOperation = "copy";
            cx.drawImage(srcimg, 0, 0, w, h);
            return cvs
        }
    };
    ut._HTML.loadWebPFallback = function (url, idx) {
        function decode_base64(base64) {
            var size = base64.length;
            while (base64.charCodeAt(size - 1) == 61) size--;
            var data = new Uint8Array(size * 3 >> 2);
            for (var c, cPrev = 0, s = 6, d = 0, b = 0; b < size; cPrev = c, s = s + 2 & 7) {
                c = base64.charCodeAt(b++);
                c = c >= 97 ? c - 71 : c >= 65 ? c - 65 : c >= 48 ? c + 4 : c == 47 ? 63 : 62;
                if (s < 6) data[d++] = cPrev << 2 + s | c >> 4 - s
            }
            return data
        }

        if (!url) return false;
        if (!(typeof WebPDecoder == "object")) return false;
        if (WebPDecoder.nativeSupport) return false;
        var webpCanvas;
        var webpPrefix = "data:image/webp;base64,";
        if (!url.lastIndexOf(webpPrefix, 0)) {
            webpCanvas = document.createElement("canvas");
            WebPDecoder.decode(decode_base64(url.substring(webpPrefix.length)), webpCanvas);
            webpCanvas.naturalWidth = webpCanvas.width;
            webpCanvas.naturalHeight = webpCanvas.height;
            webpCanvas.complete = true;
            ut._HTML.initImage(idx);
            ut._HTML.images[idx].image = webpCanvas;
            return true
        }
        if (url.lastIndexOf("data:image/", 0) && url.match(/\.webp$/i)) {
            webpCanvas = document.createElement("canvas");
            webpCanvas.naturalWidth = 0;
            webpCanvas.naturalHeight = 0;
            webpCanvas.complete = false;
            ut._HTML.initImage(idx);
            ut._HTML.images[idx].image = webpCanvas;
            var webpRequest = new XMLHttpRequest;
            webpRequest.responseType = "arraybuffer";
            webpRequest.open("GET", url);
            webpRequest.onerror = function () {
                ut._HTML.images[idx].loaderror = true
            };
            webpRequest.onload = function () {
                WebPDecoder.decode(new Uint8Array(webpRequest.response), webpCanvas);
                webpCanvas.naturalWidth = webpCanvas.width;
                webpCanvas.naturalHeight = webpCanvas.height;
                webpCanvas.complete = true
            };
            webpRequest.send();
            return true
        }
        return false
    }
}

function _js_html_loadImage(colorName, maskName) {
    colorName = colorName ? UTF8ToString(colorName) : null;
    maskName = maskName ? UTF8ToString(maskName) : null;
    if (colorName == "::white1x1") {
        colorName = "data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
    } else if (colorName && colorName.substring(0, 9) == "ut-asset:") {
        colorName = UT_ASSETS[colorName.substring(9)]
    }
    if (maskName && maskName.substring(0, 9) == "ut-asset:") {
        maskName = UT_ASSETS[maskName.substring(9)]
    }
    var idx;
    for (var i = 1; i <= ut._HTML.images.length; i++) {
        if (!ut._HTML.images[i]) {
            idx = i;
            break
        }
    }
    ut._HTML.initImage(idx);
    if (ut._HTML.loadWebPFallback(colorName, idx)) return idx;
    if (colorName) {
        var imgColor = new Image;
        var isjpg = !!colorName.match(/\.jpe?g$/i);
        ut._HTML.images[idx].image = imgColor;
        ut._HTML.images[idx].hasAlpha = !isjpg;
        imgColor.onerror = function () {
            ut._HTML.images[idx].loaderror = true
        };
        imgColor.src = colorName
    }
    if (maskName) {
        var imgMask = new Image;
        ut._HTML.images[idx].mask = imgMask;
        ut._HTML.images[idx].hasAlpha = true;
        imgMask.onerror = function () {
            ut._HTML.images[idx].loaderror = true
        };
        imgMask.src = maskName
    }
    return idx
}

function _js_html_setCanvasSize(width, height, fbwidth, fbheight) {
    if (!width > 0 || !height > 0) throw"Bad canvas size at init.";
    var canvas = ut._HTML.canvasElement;
    if (!canvas) {
        canvas = document.getElementById("UT_CANVAS")
    }
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("id", "UT_CANVAS");
        canvas.setAttribute("tabindex", "1");
        canvas.style.touchAction = "none";
        if (document.body) {
            document.body.style.margin = "0px";
            document.body.style.border = "0";
            document.body.style.overflow = "hidden";
            document.body.style.display = "block";
            document.body.insertBefore(canvas, document.body.firstChild)
        } else {
            document.documentElement.appendChild(canvas)
        }
    }
    ut._HTML.canvasElement = canvas;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = fbwidth || width;
    canvas.height = fbheight || height;
    ut._HTML.canvasMode = "bgfx";
    if (!canvas.tiny_initialized) {
        canvas.addEventListener("webglcontextlost", function (event) {
            event.preventDefault()
        }, false);
        canvas.focus();
        canvas.tiny_initialized = true
    }
    if (!window.tiny_initialized) {
        window.addEventListener("focus", function (event) {
            ut._HTML.focus = true
        });
        window.addEventListener("blur", function (event) {
            ut._HTML.focus = false
        });
        window.tiny_initialized = true
    }
    return true
}

function _js_html_validateWebGLContextFeatures(requireSrgb) {
    if (requireSrgb && GL.currentContext.version == 1 && !GLctx.getExtension("EXT_sRGB")) {
        fatal("WebGL implementation in current browser does not support sRGB rendering (No EXT_sRGB or WebGL 2), but sRGB is required by this page!")
    }
}

function _js_inputGetCanvasLost() {
    var inp = ut._HTML.input;
    var canvas = ut._HTML.canvasElement;
    return canvas != inp.canvas
}

function _js_inputGetFocusLost() {
    var inp = ut._HTML.input;
    if (inp.focusLost) {
        inp.focusLost = false;
        return true
    }
    return false
}

function _js_inputGetKeyStream(maxLen, destPtr) {
    var inp = ut._HTML.input;
    return inp.getStream(inp.keyStream, maxLen, destPtr)
}

function _js_inputGetMouseStream(maxLen, destPtr) {
    var inp = ut._HTML.input;
    return inp.getStream(inp.mouseStream, maxLen, destPtr)
}

function _js_inputGetTouchStream(maxLen, destPtr) {
    var inp = ut._HTML.input;
    return inp.getStream(inp.touchStream, maxLen, destPtr)
}

function _js_inputInit() {
    ut._HTML = ut._HTML || {};
    ut._HTML.input = {};
    var inp = ut._HTML.input;
    var canvas = ut._HTML.canvasElement;
    if (!canvas) return false;
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    inp.getStream = function (stream, maxLen, destPtr) {
        destPtr >>= 2;
        var l = stream.length;
        if (l > maxLen) l = maxLen;
        for (var i = 0; i < l; i++) HEAP32[destPtr + i] = stream[i];
        return l
    };
    inp.updateCursor = function () {
        if (ut.inpActiveMouseMode == ut.inpSavedMouseMode) return;
        var canvas = ut._HTML.canvasElement;
        var hasPointerLock = document.pointerLockElement === canvas || document.mozPointerLockElement === canvas;
        if (ut.inpSavedMouseMode == 0) {
            document.body.style.cursor = "auto";
            if (hasPointerLock) document.exitPointerLock();
            ut.inpActiveMouseMode = 0
        } else if (ut.inpSavedMouseMode == 1) {
            document.body.style.cursor = "none";
            if (hasPointerLock) document.exitPointerLock();
            ut.inpActiveMouseMode = 1
        } else {
            canvas.requestPointerLock()
        }
    };
    inp.mouseEventFn = function (ev) {
        if (ut.inpSavedMouseMode != ut.inpActiveMouseMode) return;
        var inp = ut._HTML.input;
        var eventType;
        var buttons = 0;
        if (ev.type == "mouseup") {
            eventType = 0;
            buttons = ev.button
        } else if (ev.type == "mousedown") {
            eventType = 1;
            buttons = ev.button
        } else if (ev.type == "mousemove") {
            eventType = 2
        } else return;
        var rect = inp.canvas.getBoundingClientRect();
        var x = ev.pageX - rect.left;
        var y = rect.bottom - 1 - ev.pageY;
        var dx = ev.movementX;
        var dy = ev.movementY;
        inp.mouseStream.push(eventType | 0);
        inp.mouseStream.push(buttons | 0);
        inp.mouseStream.push(x | 0);
        inp.mouseStream.push(y | 0);
        inp.mouseStream.push(dx | 0);
        inp.mouseStream.push(dy | 0);
        ev.preventDefault();
        ev.stopPropagation()
    };
    inp.touchEventFn = function (ev) {
        var inp = ut._HTML.input;
        var eventType, x, y, touches = ev.changedTouches;
        if (ev.type == "touchstart") eventType = 1; else if (ev.type == "touchend") eventType = 0; else if (ev.type == "touchcanceled") eventType = 3; else eventType = 2;
        var rect = inp.canvas.getBoundingClientRect();
        for (var i = 0; i < touches.length; ++i) {
            var t = touches[i];
            x = t.pageX - rect.left;
            y = rect.bottom - 1 - t.pageY;
            inp.touchStream.push(eventType | 0);
            inp.touchStream.push(t.identifier | 0);
            inp.touchStream.push(x | 0);
            inp.touchStream.push(y | 0)
        }
        ev.preventDefault();
        ev.stopPropagation()
    };
    inp.keyEventFn = function (ev) {
        var eventType;
        if (ev.type == "keydown") eventType = 1; else if (ev.type == "keyup") eventType = 0; else return;
        inp.keyStream.push(eventType | 0);
        inp.keyStream.push(ev.keyCode | 0)
    };
    inp.clickEventFn = function () {
        this.focus();
        inp.updateCursor()
    };
    inp.focusoutEventFn = function () {
        var inp = ut._HTML.input;
        inp.focusLost = true;
        ut.inpActiveMouseMode = 0
    };
    inp.cursorLockChangeFn = function () {
        var canvas = ut._HTML.canvasElement;
        if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
            ut.inpActiveMouseMode = 2
        } else {
            if (ut.inpActiveMouseMode === 2) ut.inpActiveMouseMode = 0
        }
    };
    inp.mouseStream = [];
    inp.keyStream = [];
    inp.touchStream = [];
    inp.canvas = canvas;
    inp.focusLost = false;
    ut.inpSavedMouseMode = ut.inpSavedMouseMode || 0;
    ut.inpActiveMouseMode = ut.inpActiveMouseMode || 0;
    var events = {};
    events["keydown"] = inp.keyEventFn;
    events["keyup"] = inp.keyEventFn;
    events["touchstart"] = events["touchend"] = events["touchmove"] = events["touchcancel"] = inp.touchEventFn;
    events["mousedown"] = events["mouseup"] = events["mousemove"] = inp.mouseEventFn;
    events["focusout"] = inp.focusoutEventFn;
    events["click"] = inp.clickEventFn;
    for (var ev in events) canvas.addEventListener(ev, events[ev]);
    document.addEventListener("pointerlockchange", inp.cursorLockChangeFn);
    document.addEventListener("mozpointerlockchange", inp.cursorLockChangeFn);
    return true
}

function _js_inputResetStreams(maxLen, destPtr) {
    var inp = ut._HTML.input;
    inp.mouseStream.length = 0;
    inp.keyStream.length = 0;
    inp.touchStream.length = 0
}

function _llvm_bswap_i64(l, h) {
    var retl = _llvm_bswap_i32(h) >>> 0;
    var reth = _llvm_bswap_i32(l) >>> 0;
    return (setTempRet0(reth), retl) | 0
}

function _llvm_stackrestore(p) {
    var self = _llvm_stacksave;
    var ret = self.LLVM_SAVEDSTACKS[p];
    self.LLVM_SAVEDSTACKS.splice(p, 1);
    stackRestore(ret)
}

function _llvm_stacksave() {
    var self = _llvm_stacksave;
    if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = []
    }
    self.LLVM_SAVEDSTACKS.push(stackSave());
    return self.LLVM_SAVEDSTACKS.length - 1
}

function _llvm_trap() {
    abort("trap!")
}

var _emscripten_memcpy_big = Uint8Array.prototype.copyWithin ? function (dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
} : function (dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
};

function _usleep(useconds) {
    var start = _emscripten_get_now();
    while (_emscripten_get_now() - start < useconds / 1e3) {
    }
}

function _nanosleep(rqtp, rmtp) {
    if (rqtp === 0) {
        ___setErrNo(28);
        return -1
    }
    var seconds = HEAP32[rqtp >> 2];
    var nanoseconds = HEAP32[rqtp + 4 >> 2];
    if (nanoseconds < 0 || nanoseconds > 999999999 || seconds < 0) {
        ___setErrNo(28);
        return -1
    }
    if (rmtp !== 0) {
        HEAP32[rmtp >> 2] = 0;
        HEAP32[rmtp + 4 >> 2] = 0
    }
    return _usleep(seconds * 1e6 + nanoseconds / 1e3)
}

var GLctx;
GL.init();
for (var i = 0; i < 32; i++) __tempFixedLengthArray.push(new Array(i));
Fetch.staticInit();
var ut;
var asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
    "NaN": NaN,
    Infinity: Infinity
};
var asmLibraryArg = {
    "$": _emscripten_glClear,
    "A": __reallyNegative,
    "B": __webgl_acquireDrawBuffersExtension,
    "C": __webgl_acquireInstancedArraysExtension,
    "D": __webgl_acquireVertexArrayObjectExtension,
    "E": _abort,
    "F": _emscripten_asm_const_i,
    "G": _emscripten_asm_const_int,
    "H": _emscripten_get_callstack_js,
    "I": _emscripten_get_heap_size,
    "J": _emscripten_get_now,
    "K": _emscripten_glActiveTexture,
    "L": _emscripten_glAttachShader,
    "M": _emscripten_glBeginQueryEXT,
    "N": _emscripten_glBindAttribLocation,
    "O": _emscripten_glBindBuffer,
    "P": _emscripten_glBindFramebuffer,
    "Q": _emscripten_glBindRenderbuffer,
    "R": _emscripten_glBindTexture,
    "S": _emscripten_glBindVertexArrayOES,
    "T": _emscripten_glBlendColor,
    "U": _emscripten_glBlendEquation,
    "V": _emscripten_glBlendEquationSeparate,
    "W": _emscripten_glBlendFunc,
    "X": _emscripten_glBlendFuncSeparate,
    "Y": _emscripten_glBufferData,
    "Z": _emscripten_glBufferSubData,
    "_": _emscripten_glCheckFramebufferStatus,
    "a": abort,
    "a$": _emscripten_glGetFloatv,
    "aA": _emscripten_glDrawArrays,
    "aB": _emscripten_glDrawArraysInstancedANGLE,
    "aC": _emscripten_glDrawBuffersWEBGL,
    "aD": _emscripten_glDrawElements,
    "aE": _emscripten_glDrawElementsInstancedANGLE,
    "aF": _emscripten_glEnable,
    "aG": _emscripten_glEnableVertexAttribArray,
    "aH": _emscripten_glEndQueryEXT,
    "aI": _emscripten_glFinish,
    "aJ": _emscripten_glFlush,
    "aK": _emscripten_glFramebufferRenderbuffer,
    "aL": _emscripten_glFramebufferTexture2D,
    "aM": _emscripten_glFrontFace,
    "aN": _emscripten_glGenBuffers,
    "aO": _emscripten_glGenFramebuffers,
    "aP": _emscripten_glGenQueriesEXT,
    "aQ": _emscripten_glGenRenderbuffers,
    "aR": _emscripten_glGenTextures,
    "aS": _emscripten_glGenVertexArraysOES,
    "aT": _emscripten_glGenerateMipmap,
    "aU": _emscripten_glGetActiveAttrib,
    "aV": _emscripten_glGetActiveUniform,
    "aW": _emscripten_glGetAttachedShaders,
    "aX": _emscripten_glGetAttribLocation,
    "aY": _emscripten_glGetBooleanv,
    "aZ": _emscripten_glGetBufferParameteriv,
    "a_": _emscripten_glGetError,
    "aa": _emscripten_glClearColor,
    "ab": _emscripten_glClearDepthf,
    "ac": _emscripten_glClearStencil,
    "ad": _emscripten_glColorMask,
    "ae": _emscripten_glCompileShader,
    "af": _emscripten_glCompressedTexImage2D,
    "ag": _emscripten_glCompressedTexSubImage2D,
    "ah": _emscripten_glCopyTexImage2D,
    "ai": _emscripten_glCopyTexSubImage2D,
    "aj": _emscripten_glCreateProgram,
    "ak": _emscripten_glCreateShader,
    "al": _emscripten_glCullFace,
    "am": _emscripten_glDeleteBuffers,
    "an": _emscripten_glDeleteFramebuffers,
    "ao": _emscripten_glDeleteProgram,
    "ap": _emscripten_glDeleteQueriesEXT,
    "aq": _emscripten_glDeleteRenderbuffers,
    "ar": _emscripten_glDeleteShader,
    "as": _emscripten_glDeleteTextures,
    "at": _emscripten_glDeleteVertexArraysOES,
    "au": _emscripten_glDepthFunc,
    "av": _emscripten_glDepthMask,
    "aw": _emscripten_glDepthRangef,
    "ax": _emscripten_glDetachShader,
    "ay": _emscripten_glDisable,
    "az": _emscripten_glDisableVertexAttribArray,
    "b": setTempRet0,
    "b$": _emscripten_glTexParameterfv,
    "bA": _emscripten_glIsFramebuffer,
    "bB": _emscripten_glIsProgram,
    "bC": _emscripten_glIsQueryEXT,
    "bD": _emscripten_glIsRenderbuffer,
    "bE": _emscripten_glIsShader,
    "bF": _emscripten_glIsTexture,
    "bG": _emscripten_glIsVertexArrayOES,
    "bH": _emscripten_glLineWidth,
    "bI": _emscripten_glLinkProgram,
    "bJ": _emscripten_glPixelStorei,
    "bK": _emscripten_glPolygonOffset,
    "bL": _emscripten_glQueryCounterEXT,
    "bM": _emscripten_glReadPixels,
    "bN": _emscripten_glReleaseShaderCompiler,
    "bO": _emscripten_glRenderbufferStorage,
    "bP": _emscripten_glSampleCoverage,
    "bQ": _emscripten_glScissor,
    "bR": _emscripten_glShaderBinary,
    "bS": _emscripten_glShaderSource,
    "bT": _emscripten_glStencilFunc,
    "bU": _emscripten_glStencilFuncSeparate,
    "bV": _emscripten_glStencilMask,
    "bW": _emscripten_glStencilMaskSeparate,
    "bX": _emscripten_glStencilOp,
    "bY": _emscripten_glStencilOpSeparate,
    "bZ": _emscripten_glTexImage2D,
    "b_": _emscripten_glTexParameterf,
    "ba": _emscripten_glGetFramebufferAttachmentParameteriv,
    "bb": _emscripten_glGetIntegerv,
    "bc": _emscripten_glGetProgramInfoLog,
    "bd": _emscripten_glGetProgramiv,
    "be": _emscripten_glGetQueryObjecti64vEXT,
    "bf": _emscripten_glGetQueryObjectivEXT,
    "bg": _emscripten_glGetQueryObjectui64vEXT,
    "bh": _emscripten_glGetQueryObjectuivEXT,
    "bi": _emscripten_glGetQueryivEXT,
    "bj": _emscripten_glGetRenderbufferParameteriv,
    "bk": _emscripten_glGetShaderInfoLog,
    "bl": _emscripten_glGetShaderPrecisionFormat,
    "bm": _emscripten_glGetShaderSource,
    "bn": _emscripten_glGetShaderiv,
    "bo": _emscripten_glGetString,
    "bp": _emscripten_glGetTexParameterfv,
    "bq": _emscripten_glGetTexParameteriv,
    "br": _emscripten_glGetUniformLocation,
    "bs": _emscripten_glGetUniformfv,
    "bt": _emscripten_glGetUniformiv,
    "bu": _emscripten_glGetVertexAttribPointerv,
    "bv": _emscripten_glGetVertexAttribfv,
    "bw": _emscripten_glGetVertexAttribiv,
    "bx": _emscripten_glHint,
    "by": _emscripten_glIsBuffer,
    "bz": _emscripten_glIsEnabled,
    "c": getTempRet0,
    "c$": _fd_seek,
    "cA": _emscripten_glVertexAttrib2f,
    "cB": _emscripten_glVertexAttrib2fv,
    "cC": _emscripten_glVertexAttrib3f,
    "cD": _emscripten_glVertexAttrib3fv,
    "cE": _emscripten_glVertexAttrib4f,
    "cF": _emscripten_glVertexAttrib4fv,
    "cG": _emscripten_glVertexAttribDivisorANGLE,
    "cH": _emscripten_glVertexAttribPointer,
    "cI": _emscripten_glViewport,
    "cJ": _emscripten_log,
    "cK": _emscripten_log_js,
    "cL": _emscripten_memcpy_big,
    "cM": _emscripten_performance_now,
    "cN": _emscripten_request_animation_frame_loop,
    "cO": _emscripten_resize_heap,
    "cP": _emscripten_set_canvas_element_size,
    "cQ": _emscripten_start_fetch,
    "cR": _emscripten_throw_string,
    "cS": _emscripten_webgl_create_context,
    "cT": _emscripten_webgl_destroy_context,
    "cU": _emscripten_webgl_destroy_context_calling_thread,
    "cV": _emscripten_webgl_do_create_context,
    "cW": _emscripten_webgl_init_context_attributes,
    "cX": _emscripten_webgl_make_context_current,
    "cY": _exit,
    "cZ": _fd_close,
    "c_": _fd_read,
    "ca": _emscripten_glTexParameteri,
    "cb": _emscripten_glTexParameteriv,
    "cc": _emscripten_glTexSubImage2D,
    "cd": _emscripten_glUniform1f,
    "ce": _emscripten_glUniform1fv,
    "cf": _emscripten_glUniform1i,
    "cg": _emscripten_glUniform1iv,
    "ch": _emscripten_glUniform2f,
    "ci": _emscripten_glUniform2fv,
    "cj": _emscripten_glUniform2i,
    "ck": _emscripten_glUniform2iv,
    "cl": _emscripten_glUniform3f,
    "cm": _emscripten_glUniform3fv,
    "cn": _emscripten_glUniform3i,
    "co": _emscripten_glUniform3iv,
    "cp": _emscripten_glUniform4f,
    "cq": _emscripten_glUniform4fv,
    "cr": _emscripten_glUniform4i,
    "cs": _emscripten_glUniform4iv,
    "ct": _emscripten_glUniformMatrix2fv,
    "cu": _emscripten_glUniformMatrix3fv,
    "cv": _emscripten_glUniformMatrix4fv,
    "cw": _emscripten_glUseProgram,
    "cx": _emscripten_glValidateProgram,
    "cy": _emscripten_glVertexAttrib1f,
    "cz": _emscripten_glVertexAttrib1fv,
    "d": ___lock,
    "d$": _glGetFloatv,
    "dA": _glDeleteFramebuffers,
    "dB": _glDeleteProgram,
    "dC": _glDeleteRenderbuffers,
    "dD": _glDeleteShader,
    "dE": _glDeleteTextures,
    "dF": _glDepthFunc,
    "dG": _glDepthMask,
    "dH": _glDetachShader,
    "dI": _glDisable,
    "dJ": _glDisableVertexAttribArray,
    "dK": _glDrawArrays,
    "dL": _glDrawElements,
    "dM": _glEnable,
    "dN": _glEnableVertexAttribArray,
    "dO": _glFlush,
    "dP": _glFramebufferRenderbuffer,
    "dQ": _glFramebufferTexture2D,
    "dR": _glFrontFace,
    "dS": _glGenBuffers,
    "dT": _glGenFramebuffers,
    "dU": _glGenRenderbuffers,
    "dV": _glGenTextures,
    "dW": _glGenerateMipmap,
    "dX": _glGetActiveAttrib,
    "dY": _glGetActiveUniform,
    "dZ": _glGetAttribLocation,
    "d_": _glGetError,
    "da": _fd_write,
    "db": _glActiveTexture,
    "dc": _glAttachShader,
    "dd": _glBindBuffer,
    "de": _glBindFramebuffer,
    "df": _glBindRenderbuffer,
    "dg": _glBindTexture,
    "dh": _glBlendColor,
    "di": _glBlendEquationSeparate,
    "dj": _glBlendFuncSeparate,
    "dk": _glBufferData,
    "dl": _glBufferSubData,
    "dm": _glCheckFramebufferStatus,
    "dn": _glClear,
    "dp": _glClearColor,
    "dq": _glClearDepthf,
    "dr": _glClearStencil,
    "ds": _glColorMask,
    "dt": _glCompileShader,
    "du": _glCompressedTexImage2D,
    "dv": _glCompressedTexSubImage2D,
    "dw": _glCreateProgram,
    "dx": _glCreateShader,
    "dy": _glCullFace,
    "dz": _glDeleteBuffers,
    "e": ___setErrNo,
    "e$": _js_html_setCanvasSize,
    "eA": _glVertexAttribPointer,
    "eB": _glViewport,
    "eC": _js_html_audioCheckLoad,
    "eD": _js_html_audioFree,
    "eE": _js_html_audioIsPlaying,
    "eF": _js_html_audioIsUnlocked,
    "eG": _js_html_audioPause,
    "eH": _js_html_audioPlay,
    "eI": _js_html_audioResume,
    "eJ": _js_html_audioSetPan,
    "eK": _js_html_audioSetPitch,
    "eL": _js_html_audioSetVolume,
    "eM": _js_html_audioStartLoadFile,
    "eN": _js_html_audioStop,
    "eO": _js_html_audioUnlock,
    "eP": _js_html_checkLoadImage,
    "eQ": _js_html_finishLoadImage,
    "eR": _js_html_freeImage,
    "eS": _js_html_getCanvasSize,
    "eT": _js_html_getDPIScale,
    "eU": _js_html_getFrameSize,
    "eV": _js_html_getScreenSize,
    "eW": _js_html_imageToMemory,
    "eX": _js_html_init,
    "eY": _js_html_initAudio,
    "eZ": _js_html_initImageLoading,
    "e_": _js_html_loadImage,
    "ea": _glGetIntegerv,
    "eb": _glGetProgramInfoLog,
    "ec": _glGetProgramiv,
    "ed": _glGetShaderInfoLog,
    "ee": _glGetShaderiv,
    "ef": _glGetString,
    "eg": _glGetUniformLocation,
    "eh": _glLinkProgram,
    "ei": _glPixelStorei,
    "ej": _glReadPixels,
    "ek": _glRenderbufferStorage,
    "el": _glScissor,
    "em": _glShaderSource,
    "en": _glStencilFuncSeparate,
    "eo": _glStencilOpSeparate,
    "ep": _glTexImage2D,
    "eq": _glTexParameterf,
    "er": _glTexParameterfv,
    "es": _glTexParameteri,
    "et": _glTexSubImage2D,
    "eu": _glUniform1i,
    "ev": _glUniform1iv,
    "ew": _glUniform4fv,
    "ex": _glUniformMatrix3fv,
    "ey": _glUniformMatrix4fv,
    "ez": _glUseProgram,
    "f": ___syscall221,
    "fa": _js_html_validateWebGLContextFeatures,
    "fb": _js_inputGetCanvasLost,
    "fc": _js_inputGetFocusLost,
    "fd": _js_inputGetKeyStream,
    "fe": _js_inputGetMouseStream,
    "ff": _js_inputGetTouchStream,
    "fg": _js_inputInit,
    "fh": _js_inputResetStreams,
    "fi": _llvm_bswap_i64,
    "fj": _llvm_stackrestore,
    "fk": _llvm_stacksave,
    "fl": _llvm_trap,
    "fm": _nanosleep,
    "fn": _usleep,
    "fo": abortStackOverflow,
    "fp": tempDoublePtr,
    "g": ___syscall4,
    "h": ___syscall5,
    "i": ___syscall54,
    "j": ___unlock,
    "k": ___wasi_fd_close,
    "l": ___wasi_fd_read,
    "m": ___wasi_fd_seek,
    "n": ___wasi_fd_write,
    "o": __colorChannelsInGlTextureFormat,
    "p": __computeUnpackAlignedImageSize,
    "q": __emscripten_fetch_free,
    "r": __emscripten_get_fetch_work_queue,
    "s": __emscripten_traverse_stack,
    "t": __findCanvasEventTarget,
    "u": __findEventTarget,
    "v": __formatString,
    "w": __glGenObject,
    "x": __heapAccessShiftForWebGLHeap,
    "y": __heapObjectForWebGLType,
    "z": __maybeCStringToJsString
};// EMSCRIPTEN_START_ASM
var asm = Module["asm"]// EMSCRIPTEN_END_ASM
    (asmGlobalArg, asmLibraryArg, buffer);
var ___divdi3 = asm["___divdi3"];
var ___muldi3 = asm["___muldi3"];
var ___udivdi3 = asm["___udivdi3"];
var _bitshift64Ashr = asm["_bitshift64Ashr"];
var _bitshift64Lshr = asm["_bitshift64Lshr"];
var _bitshift64Shl = asm["_bitshift64Shl"];
var _emscripten_get_sbrk_ptr = asm["_emscripten_get_sbrk_ptr"];
var _emscripten_is_main_browser_thread = asm["_emscripten_is_main_browser_thread"];
var _free = asm["_free"];
var _htonl = asm["_htonl"];
var _htons = asm["_htons"];
var _i64Add = asm["_i64Add"];
var _i64Subtract = asm["_i64Subtract"];
var _llvm_bswap_i16 = asm["_llvm_bswap_i16"];
var _llvm_bswap_i32 = asm["_llvm_bswap_i32"];
var _llvm_cttz_i32 = asm["_llvm_cttz_i32"];
var _main = asm["_main"];
var _malloc = asm["_malloc"];
var _memalign = asm["_memalign"];
var _memcpy = asm["_memcpy"];
var _memmove = asm["_memmove"];
var _memset = asm["_memset"];
var _ntohs = asm["_ntohs"];
var _strlen = asm["_strlen"];
var globalCtors = asm["globalCtors"];
var stackAlloc = asm["stackAlloc"];
var stackRestore = asm["stackRestore"];
var stackSave = asm["stackSave"];
var dynCall_i = asm["dynCall_i"];
var dynCall_idi = asm["dynCall_idi"];
var dynCall_ii = asm["dynCall_ii"];
var dynCall_iid = asm["dynCall_iid"];
var dynCall_iii = asm["dynCall_iii"];
var dynCall_iiid = asm["dynCall_iiid"];
var dynCall_iiii = asm["dynCall_iiii"];
var dynCall_iiiii = asm["dynCall_iiiii"];
var dynCall_iiiiii = asm["dynCall_iiiiii"];
var dynCall_iiiiiii = asm["dynCall_iiiiiii"];
var dynCall_iiiiiiiii = asm["dynCall_iiiiiiiii"];
var dynCall_v = asm["dynCall_v"];
var dynCall_vd = asm["dynCall_vd"];
var dynCall_vdd = asm["dynCall_vdd"];
var dynCall_vdddd = asm["dynCall_vdddd"];
var dynCall_vdi = asm["dynCall_vdi"];
var dynCall_vi = asm["dynCall_vi"];
var dynCall_vid = asm["dynCall_vid"];
var dynCall_vidd = asm["dynCall_vidd"];
var dynCall_viddd = asm["dynCall_viddd"];
var dynCall_vidddd = asm["dynCall_vidddd"];
var dynCall_vii = asm["dynCall_vii"];
var dynCall_viid = asm["dynCall_viid"];
var dynCall_viii = asm["dynCall_viii"];
var dynCall_viiii = asm["dynCall_viiii"];
var dynCall_viiiii = asm["dynCall_viiiii"];
var dynCall_viiiiii = asm["dynCall_viiiiii"];
var dynCall_viiiiiii = asm["dynCall_viiiiiii"];
var dynCall_viiiiiiii = asm["dynCall_viiiiiiii"];
var dynCall_viiiiiiiii = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiiiii = asm["dynCall_viiiiiiiiii"];
var dynCall_viiiiiiiiiii = asm["dynCall_viiiiiiiiiii"];
var dynCall_viiiiiiiiiiiiiii = asm["dynCall_viiiiiiiiiiiiiii"];

function run() {
    var ret = _main()
}

function initRuntime(asm) {
    asm["globalCtors"]()
}

initRuntime(asm);
ready();

