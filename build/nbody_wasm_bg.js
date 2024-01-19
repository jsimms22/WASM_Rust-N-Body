import * as wasm from './nbody_wasm_bg.wasm';

const lAudioContext = (typeof AudioContext !== 'undefined' ? AudioContext : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : undefined));

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = new Float64Array();

function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_32(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures__invoke1_mut__h0c8a69eb096fbe25(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_41(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures__invoke0_mut__hb397d21981bc6f3e(arg0, arg1);
}

function __wbg_adapter_52(arg0, arg1) {
    wasm.wasm_bindgen__convert__closures__invoke0_mut__h21c06d946c06cf95(arg0, arg1);
}

function __wbg_adapter_55(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures__invoke1_mut__h3de20604e0b214b5(arg0, arg1, addHeapObject(arg2));
}

/**
*/
export function game() {
    wasm.game();
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

let cachedFloat32Memory0 = new Float32Array();

function getFloat32Memory0() {
    if (cachedFloat32Memory0.byteLength === 0) {
        cachedFloat32Memory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32Memory0;
}

function getArrayF32FromWasm0(ptr, len) {
    return getFloat32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI32FromWasm0(ptr, len) {
    return getInt32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedUint32Memory0 = new Uint32Array();

function getUint32Memory0() {
    if (cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

function getArrayU32FromWasm0(ptr, len) {
    return getUint32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_is_null(arg0) {
    const ret = getObject(arg0) === null;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbg_log_c9486ca5d8e2cbe8(arg0, arg1) {
    try {
        console.log(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbg_log_aba5996d9bde071f(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    try {
        console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbg_mark_40e050a77cc39fea(arg0, arg1) {
    performance.mark(getStringFromWasm0(arg0, arg1));
};

export function __wbg_measure_aa7a73f17813f708() { return handleError(function (arg0, arg1, arg2, arg3) {
    try {
        performance.measure(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
        wasm.__wbindgen_free(arg2, arg3);
    }
}, arguments) };

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
    try {
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(arg0, arg1);
    }
};

export function __wbg_instanceof_WebGl2RenderingContext_e29e70ae6c00bfdd(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof WebGL2RenderingContext;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_beginQuery_ef35c4dfd46accdf(arg0, arg1, arg2) {
    getObject(arg0).beginQuery(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindBufferRange_dddda598033d750c(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).bindBufferRange(arg1 >>> 0, arg2 >>> 0, getObject(arg3), arg4, arg5);
};

export function __wbg_bindSampler_5a79668eabf16324(arg0, arg1, arg2) {
    getObject(arg0).bindSampler(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindVertexArray_48cb510596ac473e(arg0, arg1) {
    getObject(arg0).bindVertexArray(getObject(arg1));
};

export function __wbg_blitFramebuffer_80af15adba6372b4(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).blitFramebuffer(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
};

export function __wbg_bufferData_113c513969656209(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
};

export function __wbg_bufferData_1a4454da4ff413cc(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
};

export function __wbg_bufferSubData_a3d79ed0b605b30a(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferSubData(arg1 >>> 0, arg2, getObject(arg3));
};

export function __wbg_clearBufferfv_2319e28e0f6bcbe9(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4));
};

export function __wbg_clearBufferiv_6d87adc14fc5380a(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4));
};

export function __wbg_clearBufferuiv_8f7179aece72942c(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4));
};

export function __wbg_clientWaitSync_3f6600969db8421e(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).clientWaitSync(getObject(arg1), arg2 >>> 0, arg3 >>> 0);
    return ret;
};

export function __wbg_compressedTexSubImage2D_bb25b419487cecde(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
};

export function __wbg_compressedTexSubImage2D_cb17efff875f36d3(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getObject(arg8));
};

export function __wbg_compressedTexSubImage3D_2e87e12b0b9694db(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
};

export function __wbg_compressedTexSubImage3D_7a3dc255a391e422(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getObject(arg10));
};

export function __wbg_copyBufferSubData_b5d07472fe72da45(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
};

export function __wbg_copyTexSubImage3D_16d4991641ca6614(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).copyTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
};

export function __wbg_createSampler_7a6a515fd97fec06(arg0) {
    const ret = getObject(arg0).createSampler();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createVertexArray_de40c88a3bf0369a(arg0) {
    const ret = getObject(arg0).createVertexArray();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_deleteQuery_5c47fdb30fc406c2(arg0, arg1) {
    getObject(arg0).deleteQuery(getObject(arg1));
};

export function __wbg_deleteSampler_25642dd486330545(arg0, arg1) {
    getObject(arg0).deleteSampler(getObject(arg1));
};

export function __wbg_deleteSync_dd2cf9bffbef1f79(arg0, arg1) {
    getObject(arg0).deleteSync(getObject(arg1));
};

export function __wbg_deleteVertexArray_88ff45a0afd3e542(arg0, arg1) {
    getObject(arg0).deleteVertexArray(getObject(arg1));
};

export function __wbg_drawArraysInstanced_d554a17d36f42f0f(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawArraysInstanced(arg1 >>> 0, arg2, arg3, arg4);
};

export function __wbg_drawBuffers_a606a498b5eaba73(arg0, arg1) {
    getObject(arg0).drawBuffers(getObject(arg1));
};

export function __wbg_drawElementsInstanced_11a1ac661a5f99f9(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};

export function __wbg_endQuery_6c39eb3f5c986272(arg0, arg1) {
    getObject(arg0).endQuery(arg1 >>> 0);
};

export function __wbg_fenceSync_76d44c37501be82c(arg0, arg1, arg2) {
    const ret = getObject(arg0).fenceSync(arg1 >>> 0, arg2 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_framebufferTextureLayer_dd8c4427fdc80b42(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTextureLayer(arg1 >>> 0, arg2 >>> 0, getObject(arg3), arg4, arg5);
};

export function __wbg_getBufferSubData_ca134d28f22653bf(arg0, arg1, arg2, arg3) {
    getObject(arg0).getBufferSubData(arg1 >>> 0, arg2, getObject(arg3));
};

export function __wbg_getIndexedParameter_6e0c38c96b72faa0() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).getIndexedParameter(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getQueryParameter_45e87466c1060904(arg0, arg1, arg2) {
    const ret = getObject(arg0).getQueryParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getSyncParameter_f6072b718dac6d0e(arg0, arg1, arg2) {
    const ret = getObject(arg0).getSyncParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getUniformBlockIndex_0c918dab20956ced(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).getUniformBlockIndex(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return ret;
};

export function __wbg_invalidateFramebuffer_f9560d9f8de9d073() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).invalidateFramebuffer(arg1 >>> 0, getObject(arg2));
}, arguments) };

export function __wbg_readBuffer_13c8ea4f7c603ce4(arg0, arg1) {
    getObject(arg0).readBuffer(arg1 >>> 0);
};

export function __wbg_readPixels_e0a916a31379045b() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    getObject(arg0).readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, getObject(arg7));
}, arguments) };

export function __wbg_readPixels_08de6bc2c42ac374() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    getObject(arg0).readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
}, arguments) };

export function __wbg_renderbufferStorageMultisample_d5392684ea6df760(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).renderbufferStorageMultisample(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};

export function __wbg_samplerParameterf_594ccbeb4d28a71d(arg0, arg1, arg2, arg3) {
    getObject(arg0).samplerParameterf(getObject(arg1), arg2 >>> 0, arg3);
};

export function __wbg_samplerParameteri_e8bc530ad3f8610a(arg0, arg1, arg2, arg3) {
    getObject(arg0).samplerParameteri(getObject(arg1), arg2 >>> 0, arg3);
};

export function __wbg_texStorage2D_71aadb66c5b0efe9(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).texStorage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};

export function __wbg_texStorage3D_d06f53c309d7cdb2(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).texStorage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6);
};

export function __wbg_texSubImage2D_c14bf28d07ec5c5b() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };

export function __wbg_texSubImage2D_f533ccf419af9305() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
}, arguments) };

export function __wbg_texSubImage3D_78050c0c88c07ffc() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
}, arguments) };

export function __wbg_texSubImage3D_9483167c9841e4a6() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, getObject(arg11));
}, arguments) };

export function __wbg_uniformBlockBinding_3091fa35b65a2e80(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniformBlockBinding(getObject(arg1), arg2 >>> 0, arg3 >>> 0);
};

export function __wbg_vertexAttribDivisor_5398f4fb31a5d688(arg0, arg1, arg2) {
    getObject(arg0).vertexAttribDivisor(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_vertexAttribIPointer_0636565263d98371(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};

export function __wbg_activeTexture_4c5fbecb8a6751c7(arg0, arg1) {
    getObject(arg0).activeTexture(arg1 >>> 0);
};

export function __wbg_attachShader_508b395353cfea3c(arg0, arg1, arg2) {
    getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
};

export function __wbg_bindBuffer_1c07a1c1b4badd6b(arg0, arg1, arg2) {
    getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindFramebuffer_aa4326d94595717d(arg0, arg1, arg2) {
    getObject(arg0).bindFramebuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindRenderbuffer_8448dec7e451d7fe(arg0, arg1, arg2) {
    getObject(arg0).bindRenderbuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindTexture_2170432a0e1e96a5(arg0, arg1, arg2) {
    getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
};

export function __wbg_blendColor_ae4688b71eacef4d(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendColor(arg1, arg2, arg3, arg4);
};

export function __wbg_blendEquation_49163b1ebb7544d6(arg0, arg1) {
    getObject(arg0).blendEquation(arg1 >>> 0);
};

export function __wbg_blendEquationSeparate_ff552993763a137f(arg0, arg1, arg2) {
    getObject(arg0).blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_blendFunc_90c0be39b3c65c66(arg0, arg1, arg2) {
    getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_blendFuncSeparate_868c933d69f5cbee(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};

export function __wbg_colorMask_90441088f82ffdbc(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
};

export function __wbg_compileShader_b5c1669afdfaec13(arg0, arg1) {
    getObject(arg0).compileShader(getObject(arg1));
};

export function __wbg_copyTexSubImage2D_c81c17de8ed3c47f(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
};

export function __wbg_createBuffer_ad18673ecf93364a(arg0) {
    const ret = getObject(arg0).createBuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createFramebuffer_71938241c433e68a(arg0) {
    const ret = getObject(arg0).createFramebuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createProgram_cba5d9c3dccfecab(arg0) {
    const ret = getObject(arg0).createProgram();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createRenderbuffer_bd0ebb84352e959c(arg0) {
    const ret = getObject(arg0).createRenderbuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createShader_5ce8581c05641306(arg0, arg1) {
    const ret = getObject(arg0).createShader(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createTexture_0085c2b16877a463(arg0) {
    const ret = getObject(arg0).createTexture();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_cullFace_d49665bfe254f335(arg0, arg1) {
    getObject(arg0).cullFace(arg1 >>> 0);
};

export function __wbg_deleteBuffer_43f1c1c4d32100d1(arg0, arg1) {
    getObject(arg0).deleteBuffer(getObject(arg1));
};

export function __wbg_deleteFramebuffer_2692f9309b02472d(arg0, arg1) {
    getObject(arg0).deleteFramebuffer(getObject(arg1));
};

export function __wbg_deleteProgram_6c6fcb7fcee7d0ce(arg0, arg1) {
    getObject(arg0).deleteProgram(getObject(arg1));
};

export function __wbg_deleteRenderbuffer_6674ca97077e256e(arg0, arg1) {
    getObject(arg0).deleteRenderbuffer(getObject(arg1));
};

export function __wbg_deleteShader_dff44e945e31d0bc(arg0, arg1) {
    getObject(arg0).deleteShader(getObject(arg1));
};

export function __wbg_deleteTexture_3bff2c6d387bdb53(arg0, arg1) {
    getObject(arg0).deleteTexture(getObject(arg1));
};

export function __wbg_depthFunc_b3a31ea87ce7184a(arg0, arg1) {
    getObject(arg0).depthFunc(arg1 >>> 0);
};

export function __wbg_depthMask_d704601ae2c54009(arg0, arg1) {
    getObject(arg0).depthMask(arg1 !== 0);
};

export function __wbg_depthRange_adcf9f07d2d00772(arg0, arg1, arg2) {
    getObject(arg0).depthRange(arg1, arg2);
};

export function __wbg_disable_fc5f4d048c61339f(arg0, arg1) {
    getObject(arg0).disable(arg1 >>> 0);
};

export function __wbg_disableVertexAttribArray_1072f4917261f605(arg0, arg1) {
    getObject(arg0).disableVertexAttribArray(arg1 >>> 0);
};

export function __wbg_drawArrays_cde0f84c08ae294f(arg0, arg1, arg2, arg3) {
    getObject(arg0).drawArrays(arg1 >>> 0, arg2, arg3);
};

export function __wbg_drawElements_696f52008122f622(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
};

export function __wbg_enable_bf2cc1d283856f62(arg0, arg1) {
    getObject(arg0).enable(arg1 >>> 0);
};

export function __wbg_enableVertexAttribArray_950e67d457cc33d3(arg0, arg1) {
    getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
};

export function __wbg_framebufferRenderbuffer_43aab255682840eb(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4));
};

export function __wbg_framebufferTexture2D_55062a40659a599c(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5);
};

export function __wbg_frontFace_0905393d4b1ad4a0(arg0, arg1) {
    getObject(arg0).frontFace(arg1 >>> 0);
};

export function __wbg_getActiveUniform_8c77b4cae264ca97(arg0, arg1, arg2) {
    const ret = getObject(arg0).getActiveUniform(getObject(arg1), arg2 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_getExtension_20f7c113f94964b9() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).getExtension(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_getParameter_d540906c5375b1d1() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).getParameter(arg1 >>> 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getProgramInfoLog_ca215a5b893b5371(arg0, arg1, arg2) {
    const ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getProgramParameter_f96710addeb4a569(arg0, arg1, arg2) {
    const ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getShaderInfoLog_7bb704c665e4a07b(arg0, arg1, arg2) {
    const ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getShaderParameter_d89d2e675f0220cc(arg0, arg1, arg2) {
    const ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getSupportedExtensions_b0a904f246e1e119(arg0) {
    const ret = getObject(arg0).getSupportedExtensions();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_getUniformLocation_dc97cf2e79f5657a(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).getUniformLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_linkProgram_59a69c0279983602(arg0, arg1) {
    getObject(arg0).linkProgram(getObject(arg1));
};

export function __wbg_pixelStorei_a7a1a09a34a88ba4(arg0, arg1, arg2) {
    getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
};

export function __wbg_polygonOffset_4be51deceaeb05a6(arg0, arg1, arg2) {
    getObject(arg0).polygonOffset(arg1, arg2);
};

export function __wbg_renderbufferStorage_1d69e2da1af2baf0(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
};

export function __wbg_scissor_63dfa92ea1ca440b(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).scissor(arg1, arg2, arg3, arg4);
};

export function __wbg_shaderSource_ada4481e7f64b59b(arg0, arg1, arg2, arg3) {
    getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
};

export function __wbg_stencilFuncSeparate_974e35f5fd349f9e(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
};

export function __wbg_stencilMask_788bc17f620fa0bd(arg0, arg1) {
    getObject(arg0).stencilMask(arg1 >>> 0);
};

export function __wbg_stencilMaskSeparate_2c14306ff80dd128(arg0, arg1, arg2) {
    getObject(arg0).stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_stencilOpSeparate_89c1a7ecf95be129(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};

export function __wbg_texParameteri_2b17c6b2eb162904(arg0, arg1, arg2, arg3) {
    getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
};

export function __wbg_uniform1i_52e7375418604a1d(arg0, arg1, arg2) {
    getObject(arg0).uniform1i(getObject(arg1), arg2);
};

export function __wbg_uniform4f_af0baa78d4637b1c(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).uniform4f(getObject(arg1), arg2, arg3, arg4, arg5);
};

export function __wbg_useProgram_cbbec0eb937f0880(arg0, arg1) {
    getObject(arg0).useProgram(getObject(arg1));
};

export function __wbg_vertexAttribPointer_15414a8557f85fde(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
};

export function __wbg_viewport_2ea457ddc071f65c(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).viewport(arg1, arg2, arg3, arg4);
};

export function __wbg_instanceof_Window_0e6c0f1096d66c3c(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_document_d0bac061933b26c1(arg0) {
    const ret = getObject(arg0).document;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_navigator_89e71ca0be99733e(arg0) {
    const ret = getObject(arg0).navigator;
    return addHeapObject(ret);
};

export function __wbg_innerWidth_76fb141cbf9cb1e4() { return handleError(function (arg0) {
    const ret = getObject(arg0).innerWidth;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_innerHeight_5d9e25fc9940bfa5() { return handleError(function (arg0) {
    const ret = getObject(arg0).innerHeight;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_devicePixelRatio_433a57ae570165c6(arg0) {
    const ret = getObject(arg0).devicePixelRatio;
    return ret;
};

export function __wbg_cancelAnimationFrame_97993243fbac902e() { return handleError(function (arg0, arg1) {
    getObject(arg0).cancelAnimationFrame(arg1);
}, arguments) };

export function __wbg_matchMedia_f1f54434b496d226() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).matchMedia(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_open_538190637805f2e1() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_requestAnimationFrame_c6f7d52346edca29() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).requestAnimationFrame(getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_get_36bc7edcd5f7782e(arg0, arg1, arg2) {
    const ret = getObject(arg0)[getStringFromWasm0(arg1, arg2)];
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_clearTimeout_4d1e10d1de1c1ac9(arg0, arg1) {
    getObject(arg0).clearTimeout(arg1);
};

export function __wbg_fetch_abfaf20dcbcaeada(arg0, arg1, arg2) {
    const ret = getObject(arg0).fetch(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_e69b495baa51d892() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_getBoundingClientRect_e547e9868e29e399(arg0) {
    const ret = getObject(arg0).getBoundingClientRect();
    return addHeapObject(ret);
};

export function __wbg_requestFullscreen_a502f428375a9f6d() { return handleError(function (arg0) {
    getObject(arg0).requestFullscreen();
}, arguments) };

export function __wbg_requestPointerLock_60330aed0e40228e(arg0) {
    getObject(arg0).requestPointerLock();
};

export function __wbg_setAttribute_16d7681c5ae6bc09() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_setPointerCapture_4e4f3aafb82450f3() { return handleError(function (arg0, arg1) {
    getObject(arg0).setPointerCapture(arg1);
}, arguments) };

export function __wbg_body_2ac9821051552b0f(arg0) {
    const ret = getObject(arg0).body;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_fullscreenElement_20a494bdb171be54(arg0) {
    const ret = getObject(arg0).fullscreenElement;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createElement_5ca641a382492ca8() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_exitFullscreen_4dc8f9960c8aaf99(arg0) {
    getObject(arg0).exitFullscreen();
};

export function __wbg_exitPointerLock_8231df44c22c7b27(arg0) {
    getObject(arg0).exitPointerLock();
};

export function __wbg_querySelector_95f9f997363209a7() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).querySelector(getStringFromWasm0(arg1, arg2));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_style_502d8f9e29c68b63(arg0) {
    const ret = getObject(arg0).style;
    return addHeapObject(ret);
};

export function __wbg_bufferData_7cac83e3a5ada7eb(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
};

export function __wbg_bufferData_8eb7406b0cf28b09(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
};

export function __wbg_bufferSubData_e6bdcff2e33b80b0(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferSubData(arg1 >>> 0, arg2, getObject(arg3));
};

export function __wbg_compressedTexSubImage2D_d3d089f5ae7e8252(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getObject(arg8));
};

export function __wbg_readPixels_f9457193dac71ec7() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    getObject(arg0).readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, getObject(arg7));
}, arguments) };

export function __wbg_texSubImage2D_22bc2cb44685219e() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };

export function __wbg_activeTexture_daa91f21403ceec5(arg0, arg1) {
    getObject(arg0).activeTexture(arg1 >>> 0);
};

export function __wbg_attachShader_5ae5c90303b18698(arg0, arg1, arg2) {
    getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
};

export function __wbg_bindBuffer_e0dced5f2ece74e8(arg0, arg1, arg2) {
    getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindFramebuffer_50e959deb5431956(arg0, arg1, arg2) {
    getObject(arg0).bindFramebuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindRenderbuffer_38ae00f431742547(arg0, arg1, arg2) {
    getObject(arg0).bindRenderbuffer(arg1 >>> 0, getObject(arg2));
};

export function __wbg_bindTexture_b5b5a8f409c98094(arg0, arg1, arg2) {
    getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
};

export function __wbg_blendColor_0cb2d192801d08a8(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendColor(arg1, arg2, arg3, arg4);
};

export function __wbg_blendEquation_b210f3bfeaa49a00(arg0, arg1) {
    getObject(arg0).blendEquation(arg1 >>> 0);
};

export function __wbg_blendEquationSeparate_d204cc8fd6ef5102(arg0, arg1, arg2) {
    getObject(arg0).blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_blendFunc_41a0c6368ac2caff(arg0, arg1, arg2) {
    getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_blendFuncSeparate_d2fd07369172a02a(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};

export function __wbg_colorMask_a98440726363cd47(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
};

export function __wbg_compileShader_05a9708569d83fce(arg0, arg1) {
    getObject(arg0).compileShader(getObject(arg1));
};

export function __wbg_copyTexSubImage2D_2e2dfd80e59ad6a9(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
};

export function __wbg_createBuffer_ce15a68e1252d581(arg0) {
    const ret = getObject(arg0).createBuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createFramebuffer_fa9f0e78e44a757b(arg0) {
    const ret = getObject(arg0).createFramebuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createProgram_bd425772d6f68f5b(arg0) {
    const ret = getObject(arg0).createProgram();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createRenderbuffer_a8081f3f47a5474e(arg0) {
    const ret = getObject(arg0).createRenderbuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createShader_9872e1b3afd8d089(arg0, arg1) {
    const ret = getObject(arg0).createShader(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_createTexture_5199a262e1135922(arg0) {
    const ret = getObject(arg0).createTexture();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_cullFace_58c6b913af68087e(arg0, arg1) {
    getObject(arg0).cullFace(arg1 >>> 0);
};

export function __wbg_deleteBuffer_b622dabf349015ab(arg0, arg1) {
    getObject(arg0).deleteBuffer(getObject(arg1));
};

export function __wbg_deleteFramebuffer_bce5278d23d4fed5(arg0, arg1) {
    getObject(arg0).deleteFramebuffer(getObject(arg1));
};

export function __wbg_deleteProgram_b47fbad8d56ac79a(arg0, arg1) {
    getObject(arg0).deleteProgram(getObject(arg1));
};

export function __wbg_deleteRenderbuffer_a400807e90d141f4(arg0, arg1) {
    getObject(arg0).deleteRenderbuffer(getObject(arg1));
};

export function __wbg_deleteShader_d2b618b4b0adc1d6(arg0, arg1) {
    getObject(arg0).deleteShader(getObject(arg1));
};

export function __wbg_deleteTexture_cc293d409b2ac2da(arg0, arg1) {
    getObject(arg0).deleteTexture(getObject(arg1));
};

export function __wbg_depthFunc_d51318dc36b94359(arg0, arg1) {
    getObject(arg0).depthFunc(arg1 >>> 0);
};

export function __wbg_depthMask_78b53ee0d02b2318(arg0, arg1) {
    getObject(arg0).depthMask(arg1 !== 0);
};

export function __wbg_depthRange_2592e8900efffdd2(arg0, arg1, arg2) {
    getObject(arg0).depthRange(arg1, arg2);
};

export function __wbg_disable_0ea446922c277ac9(arg0, arg1) {
    getObject(arg0).disable(arg1 >>> 0);
};

export function __wbg_disableVertexAttribArray_a67a305e4481c274(arg0, arg1) {
    getObject(arg0).disableVertexAttribArray(arg1 >>> 0);
};

export function __wbg_drawArrays_c5191d7787a88a21(arg0, arg1, arg2, arg3) {
    getObject(arg0).drawArrays(arg1 >>> 0, arg2, arg3);
};

export function __wbg_drawElements_2360851bbd4a1d8a(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
};

export function __wbg_enable_775a58f3b9a1b326(arg0, arg1) {
    getObject(arg0).enable(arg1 >>> 0);
};

export function __wbg_enableVertexAttribArray_fae26009e050884f(arg0, arg1) {
    getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
};

export function __wbg_framebufferRenderbuffer_115cdbae1fe83488(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4));
};

export function __wbg_framebufferTexture2D_1b1b218c5aedac67(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5);
};

export function __wbg_frontFace_533c0549afff2573(arg0, arg1) {
    getObject(arg0).frontFace(arg1 >>> 0);
};

export function __wbg_getActiveUniform_9372a821eb6ce93b(arg0, arg1, arg2) {
    const ret = getObject(arg0).getActiveUniform(getObject(arg1), arg2 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_getParameter_55b5c45524d44b9c() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).getParameter(arg1 >>> 0);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getProgramInfoLog_927ea6ba0be3adf8(arg0, arg1, arg2) {
    const ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getProgramParameter_c3c357dd0f328a20(arg0, arg1, arg2) {
    const ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getShaderInfoLog_013586abb9b0c778(arg0, arg1, arg2) {
    const ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
    var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getShaderParameter_4fa494b1bf9174c4(arg0, arg1, arg2) {
    const ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_getUniformLocation_bf364d4e0ea4bf7d(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).getUniformLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_linkProgram_92812e7e1d6f1964(arg0, arg1) {
    getObject(arg0).linkProgram(getObject(arg1));
};

export function __wbg_pixelStorei_0c9f1b244b01bb66(arg0, arg1, arg2) {
    getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
};

export function __wbg_polygonOffset_9ae22cd23f6484ce(arg0, arg1, arg2) {
    getObject(arg0).polygonOffset(arg1, arg2);
};

export function __wbg_renderbufferStorage_b9d8cee541f3741a(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
};

export function __wbg_scissor_6300d9c04a530564(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).scissor(arg1, arg2, arg3, arg4);
};

export function __wbg_shaderSource_ee6736760085f6d5(arg0, arg1, arg2, arg3) {
    getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
};

export function __wbg_stencilFuncSeparate_239feed28c1d1713(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
};

export function __wbg_stencilMask_0ce096eb2d1e1a73(arg0, arg1) {
    getObject(arg0).stencilMask(arg1 >>> 0);
};

export function __wbg_stencilMaskSeparate_a054d1d320fe0206(arg0, arg1, arg2) {
    getObject(arg0).stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_stencilOpSeparate_45ce637b6c214467(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};

export function __wbg_texParameteri_022fc2aa60490893(arg0, arg1, arg2, arg3) {
    getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
};

export function __wbg_uniform1i_3211929c5f0ecdf8(arg0, arg1, arg2) {
    getObject(arg0).uniform1i(getObject(arg1), arg2);
};

export function __wbg_uniform4f_40e6c4d73e2a4d4e(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).uniform4f(getObject(arg1), arg2, arg3, arg4, arg5);
};

export function __wbg_useProgram_79cf53ff131a1570(arg0, arg1) {
    getObject(arg0).useProgram(getObject(arg1));
};

export function __wbg_vertexAttribPointer_b299ee54f90f0edd(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
};

export function __wbg_viewport_dec03e2220fd7c60(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).viewport(arg1, arg2, arg3, arg4);
};

export function __wbg_charCode_47114a6dc513450a(arg0) {
    const ret = getObject(arg0).charCode;
    return ret;
};

export function __wbg_keyCode_2f432c9e03114433(arg0) {
    const ret = getObject(arg0).keyCode;
    return ret;
};

export function __wbg_altKey_450360bccefdbfb1(arg0) {
    const ret = getObject(arg0).altKey;
    return ret;
};

export function __wbg_ctrlKey_369252bc3040041f(arg0) {
    const ret = getObject(arg0).ctrlKey;
    return ret;
};

export function __wbg_shiftKey_938c211e3ca8bef3(arg0) {
    const ret = getObject(arg0).shiftKey;
    return ret;
};

export function __wbg_metaKey_41b042131f94a501(arg0) {
    const ret = getObject(arg0).metaKey;
    return ret;
};

export function __wbg_key_8f799b48d97db561(arg0, arg1) {
    const ret = getObject(arg1).key;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_code_b35334b0fb28bae5(arg0, arg1) {
    const ret = getObject(arg1).code;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_getModifierState_4476a237c5176bff(arg0, arg1, arg2) {
    const ret = getObject(arg0).getModifierState(getStringFromWasm0(arg1, arg2));
    return ret;
};

export function __wbg_size_3a09f1de2d605bb9(arg0) {
    const ret = getObject(arg0).size;
    return ret;
};

export function __wbg_type_6fdd517b967ef329(arg0) {
    const ret = getObject(arg0).type;
    return ret;
};

export function __wbg_name_06baebeab3141a5e(arg0, arg1) {
    const ret = getObject(arg1).name;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_matches_b0a85bab6120e8dc(arg0) {
    const ret = getObject(arg0).matches;
    return ret;
};

export function __wbg_addListener_fc6dcad032f66c29() { return handleError(function (arg0, arg1) {
    getObject(arg0).addListener(getObject(arg1));
}, arguments) };

export function __wbg_removeListener_67c8d28b6b20f37f() { return handleError(function (arg0, arg1) {
    getObject(arg0).removeListener(getObject(arg1));
}, arguments) };

export function __wbg_getGamepads_ab7daff86f3cd679() { return handleError(function (arg0) {
    const ret = getObject(arg0).getGamepads();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_drawBuffersWEBGL_12ce572b8f8b9543(arg0, arg1) {
    getObject(arg0).drawBuffersWEBGL(getObject(arg1));
};

export function __wbg_setbuffer_461e3d47c4066e59(arg0, arg1) {
    getObject(arg0).buffer = getObject(arg1);
};

export function __wbg_setonended_1710ec398b345cbb(arg0, arg1) {
    getObject(arg0).onended = getObject(arg1);
};

export function __wbg_start_d0e409d718127633() { return handleError(function (arg0, arg1) {
    getObject(arg0).start(arg1);
}, arguments) };

export function __wbg_pressed_eedbbdcfe3057a81(arg0) {
    const ret = getObject(arg0).pressed;
    return ret;
};

export function __wbg_instanceof_Response_ccfeb62399355bcd(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_arrayBuffer_c846f828a86c56cf() { return handleError(function (arg0) {
    const ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_drawArraysInstancedANGLE_c9bc9f12348d06e3(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
};

export function __wbg_drawElementsInstancedANGLE_a7d44a23728f80ee(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};

export function __wbg_vertexAttribDivisorANGLE_81ba99694cd357ff(arg0, arg1, arg2) {
    getObject(arg0).vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
};

export function __wbg_x_79e594166156ad78(arg0) {
    const ret = getObject(arg0).x;
    return ret;
};

export function __wbg_y_2a9fb251aabe4931(arg0) {
    const ret = getObject(arg0).y;
    return ret;
};

export function __wbg_target_25d0a0af0588ba99(arg0) {
    const ret = getObject(arg0).target;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_cancelBubble_b05386dd0a9e9bbf(arg0) {
    const ret = getObject(arg0).cancelBubble;
    return ret;
};

export function __wbg_preventDefault_4e2c657e9c01d7fc(arg0) {
    getObject(arg0).preventDefault();
};

export function __wbg_stopPropagation_dddca50cbd8775c6(arg0) {
    getObject(arg0).stopPropagation();
};

export function __wbg_error_c04eeace266436b4(arg0, arg1) {
    console.error(getObject(arg0), getObject(arg1));
};

export function __wbg_setProperty_28d579f9c15848c5() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_instanceof_HtmlCanvasElement_b94545433bb4d2ef(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof HTMLCanvasElement;
    } catch {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_width_20743a3d4f804928(arg0) {
    const ret = getObject(arg0).width;
    return ret;
};

export function __wbg_setwidth_18ec5eda4c4617b4(arg0, arg1) {
    getObject(arg0).width = arg1 >>> 0;
};

export function __wbg_height_5ab1306d8d18baf4(arg0) {
    const ret = getObject(arg0).height;
    return ret;
};

export function __wbg_setheight_56ca229310ba885a(arg0, arg1) {
    getObject(arg0).height = arg1 >>> 0;
};

export function __wbg_getContext_99e77f282516dee7() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2), getObject(arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_matches_56e9d83fd664e34f(arg0) {
    const ret = getObject(arg0).matches;
    return ret;
};

export function __wbg_bindVertexArrayOES_b1d7feba24fa1935(arg0, arg1) {
    getObject(arg0).bindVertexArrayOES(getObject(arg1));
};

export function __wbg_createVertexArrayOES_32c8b44c6ff37ac6(arg0) {
    const ret = getObject(arg0).createVertexArrayOES();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_deleteVertexArrayOES_e7632ad3b988cc57(arg0, arg1) {
    getObject(arg0).deleteVertexArrayOES(getObject(arg1));
};

export function __wbg_appendChild_1f71ff9f4c25cb99() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).appendChild(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_pointerId_ce63681710863137(arg0) {
    const ret = getObject(arg0).pointerId;
    return ret;
};

export function __wbg_connect_a7bcab79b404cdac() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).connect(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_addEventListener_28b7bd2588b5d3f8() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
}, arguments) };

export function __wbg_addEventListener_80f44f0373a4ddcf() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
}, arguments) };

export function __wbg_removeEventListener_59fa74a031c5fc1d() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
}, arguments) };

export function __wbg_copyToChannel_5266c4045d3c9e99() { return handleError(function (arg0, arg1, arg2, arg3) {
    getObject(arg0).copyToChannel(getArrayF32FromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_id_581d2ae58926a379(arg0, arg1) {
    const ret = getObject(arg1).id;
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbg_index_f1b4705f227cfc36(arg0) {
    const ret = getObject(arg0).index;
    return ret;
};

export function __wbg_mapping_87c0783d84b5b8e5(arg0) {
    const ret = getObject(arg0).mapping;
    return addHeapObject(ret);
};

export function __wbg_connected_1536b6cd8324110e(arg0) {
    const ret = getObject(arg0).connected;
    return ret;
};

export function __wbg_buttons_1cfc16b1fdece149(arg0) {
    const ret = getObject(arg0).buttons;
    return addHeapObject(ret);
};

export function __wbg_axes_513afc1ce0ecdf94(arg0) {
    const ret = getObject(arg0).axes;
    return addHeapObject(ret);
};

export function __wbg_clientX_e7fc47bc7520b746(arg0) {
    const ret = getObject(arg0).clientX;
    return ret;
};

export function __wbg_clientY_cdcfa2d448faa205(arg0) {
    const ret = getObject(arg0).clientY;
    return ret;
};

export function __wbg_offsetX_9cd27b438e5897e1(arg0) {
    const ret = getObject(arg0).offsetX;
    return ret;
};

export function __wbg_offsetY_2b6db1a63d48871b(arg0) {
    const ret = getObject(arg0).offsetY;
    return ret;
};

export function __wbg_ctrlKey_41177ea5ca2d0e20(arg0) {
    const ret = getObject(arg0).ctrlKey;
    return ret;
};

export function __wbg_shiftKey_63109f31fffaae88(arg0) {
    const ret = getObject(arg0).shiftKey;
    return ret;
};

export function __wbg_altKey_c88db7062e567dc3(arg0) {
    const ret = getObject(arg0).altKey;
    return ret;
};

export function __wbg_metaKey_5e5a70bdf96145ac(arg0) {
    const ret = getObject(arg0).metaKey;
    return ret;
};

export function __wbg_button_aa31df90c614ac2f(arg0) {
    const ret = getObject(arg0).button;
    return ret;
};

export function __wbg_buttons_49a61c8517c86f55(arg0) {
    const ret = getObject(arg0).buttons;
    return ret;
};

export function __wbg_movementX_3582aabddf312baa(arg0) {
    const ret = getObject(arg0).movementX;
    return ret;
};

export function __wbg_movementY_003849633a9c93ba(arg0) {
    const ret = getObject(arg0).movementY;
    return ret;
};

export function __wbg_deltaX_de032cf3a1827b26(arg0) {
    const ret = getObject(arg0).deltaX;
    return ret;
};

export function __wbg_deltaY_b7960b06b4a2bd76(arg0) {
    const ret = getObject(arg0).deltaY;
    return ret;
};

export function __wbg_deltaMode_caed80fc4f06f6c4(arg0) {
    const ret = getObject(arg0).deltaMode;
    return ret;
};

export function __wbg_destination_f7bc875a9343b54c(arg0) {
    const ret = getObject(arg0).destination;
    return addHeapObject(ret);
};

export function __wbg_currentTime_e9bff66ae93d989b(arg0) {
    const ret = getObject(arg0).currentTime;
    return ret;
};

export function __wbg_newwithcontextoptions_819159f2416ec600() { return handleError(function (arg0) {
    const ret = new lAudioContext(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_close_f557a1404c1528b5() { return handleError(function (arg0) {
    const ret = getObject(arg0).close();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_createBuffer_c4222f76b40f764b() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).createBuffer(arg1 >>> 0, arg2 >>> 0, arg3);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_createBufferSource_3a624d1647e8753d() { return handleError(function (arg0) {
    const ret = getObject(arg0).createBufferSource();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_resume_f58f65613f4648c1() { return handleError(function (arg0) {
    const ret = getObject(arg0).resume();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_now_e58d2f1c4b481e88(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};

export function __wbg_process_0cc2ada8524d6f83(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbg_versions_c11acceab27a6c87(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_7ff1ce49caf23815(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_crypto_2036bed7c44c25e7(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_msCrypto_a21fc88caf1ecdc8(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_static_accessor_NODE_MODULE_cf6401cc1091279e() {
    const ret = module;
    return addHeapObject(ret);
};

export function __wbg_require_a746e79b322b9336() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_randomFillSync_065afffde01daa66() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_getRandomValues_b99eec4244a475bb() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_get_57245cc7d7c7619d(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_6e3bbe7c8bd4dbd8(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_1d9a920c6bfc44a8() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_b5b063fc6c2f0376(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_get_765201544a2b6869() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_97ae9d8645dc388b() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_0b9bfdd97583284e() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_6d479506f72c6a71() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_f2557cc78490aceb() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_7f206bda628d5286() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_ba75c50d1cf384f4() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_eval_6dc8993472839847() { return handleError(function (arg0, arg1) {
    const ret = eval(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_of_d79bf3cec607f7a4(arg0) {
    const ret = Array.of(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_push_740e4b286702d964(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_now_58886682b7e790d7() {
    const ret = Date.now();
    return ret;
};

export function __wbg_is_40a66842732708e7(arg0, arg1) {
    const ret = Object.is(getObject(arg0), getObject(arg1));
    return ret;
};

export function __wbg_then_cedad20fbbd9418a(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_buffer_3f3d764d4747d564(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_890b478c8d7226ff(arg0, arg1, arg2) {
    const ret = new Int8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_698c5100ae9c3365(arg0, arg1, arg2) {
    const ret = new Int16Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_7be13f49af2b2012(arg0, arg1, arg2) {
    const ret = new Int32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_d9aa266703cb98be(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_8c3f0052272a457a(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_83db9690f9353e79(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_9e1ae1900cb0fbd5(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_newwithbyteoffsetandlength_5540e144e9b8b907(arg0, arg1, arg2) {
    const ret = new Uint16Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_9cc9adccd861aa26(arg0, arg1, arg2) {
    const ret = new Uint32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_be22e5fcf4f69ab4(arg0, arg1, arg2) {
    const ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_newwithlength_f5933855e4f48a19(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_58ad4efbb5bcb886(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_set_bf3f89b92d5a34bf() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2971(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2973(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2975(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2977(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2979(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_41);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2981(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2983(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2985(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2987(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1135, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper20151(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 10848, __wbg_adapter_52);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper25968(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 14385, __wbg_adapter_55);
    return addHeapObject(ret);
};

