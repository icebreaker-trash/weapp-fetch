import support from './support'

export function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

export function normalizeName(name: any): string {
  if (typeof name !== 'string') {
    name = String(name)
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
    throw new TypeError(
      'Invalid character in header field name: "' + name + '"'
    )
  }
  return name.toLowerCase()
}

export function normalizeValue(value: any): string {
  if (typeof value !== 'string') {
    value = String(value)
  }
  return value
}

// Build a destructive iterator for the value list
export function iteratorFor(items: unknown[]) {
  const iterator = {
    next: function () {
      const value = items.shift()
      return { done: value === undefined, value }
    }
  }

  if (support.iterable) {
    // @ts-ignore
    iterator[Symbol.iterator] = function () {
      return iterator
    }
  }

  return iterator
}

export function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true
}

export function fileReaderReady(reader) {
  return new Promise(function (resolve, reject) {
    reader.onload = function () {
      resolve(reader.result)
    }
    reader.onerror = function () {
      reject(reader.error)
    }
  })
}

export function readBlobAsArrayBuffer(blob) {
  const reader = new FileReader()
  const promise = fileReaderReady(reader)
  reader.readAsArrayBuffer(blob)
  return promise
}

export function readBlobAsText(blob) {
  const reader = new FileReader()
  const promise = fileReaderReady(reader)
  reader.readAsText(blob)
  return promise
}

export function readArrayBufferAsText(buf) {
  const view = new Uint8Array(buf)
  const chars = new Array(view.length)

  for (let i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i])
  }
  return chars.join('')
}

export function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    const view = new Uint8Array(buf.byteLength)
    view.set(new Uint8Array(buf))
    return view.buffer
  }
}
let innerisArrayBufferView = () => {}
if (support.arrayBuffer) {
  const viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ]

  innerisArrayBufferView =
    ArrayBuffer.isView ||
    function (obj) {
      return (
        obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      )
    }
}

export function isArrayBufferView(obj) {
  return innerisArrayBufferView(obj)
}
