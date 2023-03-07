import support from './support'
import {
  isDataView,
  iteratorFor,
  normalizeName,
  normalizeValue,
  bufferClone,
  consumed,
  fileReaderReady,
  readArrayBufferAsText,
  readBlobAsArrayBuffer,
  readBlobAsText,
  isArrayBufferView
} from './util'
import { Headers } from './headers'
var global =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  (typeof global !== 'undefined' && global) ||
  {}

// HTTP methods whose capitalization should be normalized
const methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

function normalizeMethod(method) {
  const upcased = method.toUpperCase()
  return methods.indexOf(upcased) > -1 ? upcased : method
}

export function Request(input, options) {
  if (!(this instanceof Request)) {
    throw new TypeError(
      'Please use the "new" operator, this DOM object constructor cannot be called as a function.'
    )
  }

  options = options || {}
  let body = options.body

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url
    this.credentials = input.credentials
    if (!options.headers) {
      this.headers = new Headers(input.headers)
    }
    this.method = input.method
    this.mode = input.mode
    this.signal = input.signal
    if (!body && input._bodyInit != null) {
      body = input._bodyInit
      input.bodyUsed = true
    }
  } else {
    this.url = String(input)
  }

  this.credentials = options.credentials || this.credentials || 'same-origin'
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers)
  }
  this.method = normalizeMethod(options.method || this.method || 'GET')
  this.mode = options.mode || this.mode || null
  this.signal =
    options.signal ||
    this.signal ||
    (function () {
      if ('AbortController' in global) {
        const ctrl = new AbortController()
        return ctrl.signal
      }
    })()
  this.referrer = null

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body)

  if (this.method === 'GET' || this.method === 'HEAD') {
    if (options.cache === 'no-store' || options.cache === 'no-cache') {
      // Search for a '_' parameter in the query string
      const reParamSearch = /([?&])_=[^&]*/
      if (reParamSearch.test(this.url)) {
        // If it already exists then set the value with the current time
        this.url = this.url.replace(
          reParamSearch,
          '$1_=' + new Date().getTime()
        )
      } else {
        // Otherwise add a new '_' parameter to the end with the current time
        const reQueryString = /\?/
        this.url +=
          (reQueryString.test(this.url) ? '&' : '?') +
          '_=' +
          new Date().getTime()
      }
    }
  }
}

Request.prototype.clone = function () {
  return new Request(this, { body: this._bodyInit })
}

function decode(body) {
  const form = new FormData()
  body
    .trim()
    .split('&')
    .forEach(function (bytes) {
      if (bytes) {
        const split = bytes.split('=')
        const name = split.shift().replace(/\+/g, ' ')
        const value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
  return form
}

function parseHeaders(rawHeaders) {
  const headers = new Headers()
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
  // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
  // https://github.com/github/fetch/issues/748
  // https://github.com/zloirock/core-js/issues/751
  preProcessedHeaders
    .split('\r')
    .map(function (header) {
      return header.indexOf('\n') === 0
        ? header.substr(1, header.length)
        : header
    })
    .forEach(function (line) {
      const parts = line.split(':')
      const key = parts.shift().trim()
      if (key) {
        const value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
  return headers
}

Body.call(Request.prototype)

export function Response(bodyInit, options) {
  if (!(this instanceof Response)) {
    throw new TypeError(
      'Please use the "new" operator, this DOM object constructor cannot be called as a function.'
    )
  }
  if (!options) {
    options = {}
  }

  this.type = 'default'
  this.status = options.status === undefined ? 200 : options.status
  this.ok = this.status >= 200 && this.status < 300
  this.statusText =
    options.statusText === undefined ? '' : '' + options.statusText
  this.headers = new Headers(options.headers)
  this.url = options.url || ''
  this._initBody(bodyInit)
}

Body.call(Response.prototype)

Response.prototype.clone = function () {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
}

Response.error = function () {
  const response = new Response(null, { status: 0, statusText: '' })
  response.type = 'error'
  return response
}

const redirectStatuses = [301, 302, 303, 307, 308]

Response.redirect = function (url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, { status, headers: { location: url } })
}

export var DOMException = global.DOMException
try {
  new DOMException()
} catch (err) {
  DOMException = function (message, name) {
    this.message = message
    this.name = name
    const error = Error(message)
    this.stack = error.stack
  }
  DOMException.prototype = Object.create(Error.prototype)
  DOMException.prototype.constructor = DOMException
}

export function fetch(input, init) {
  return new Promise(function (resolve, reject) {
    const request = new Request(input, init)

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    const xhr = new XMLHttpRequest()

    function abortXhr() {
      xhr.abort()
    }

    xhr.onload = function () {
      const options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      }
      options.url =
        'responseURL' in xhr
          ? xhr.responseURL
          : options.headers.get('X-Request-URL')
      const body = 'response' in xhr ? xhr.response : xhr.responseText
      setTimeout(function () {
        resolve(new Response(body, options))
      }, 0)
    }

    xhr.onerror = function () {
      setTimeout(function () {
        reject(new TypeError('Network request failed'))
      }, 0)
    }

    xhr.ontimeout = function () {
      setTimeout(function () {
        reject(new TypeError('Network request failed'))
      }, 0)
    }

    xhr.onabort = function () {
      setTimeout(function () {
        reject(new DOMException('Aborted', 'AbortError'))
      }, 0)
    }

    function fixUrl(url) {
      try {
        return url === '' && global.location.href ? global.location.href : url
      } catch (e) {
        return url
      }
    }

    xhr.open(request.method, fixUrl(request.url), true)

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }

    if ('responseType' in xhr) {
      if (support.blob) {
        xhr.responseType = 'blob'
      } else if (
        support.arrayBuffer &&
        request.headers.get('Content-Type') &&
        request.headers
          .get('Content-Type')
          .indexOf('application/octet-stream') !== -1
      ) {
        xhr.responseType = 'arraybuffer'
      }
    }

    if (
      init &&
      typeof init.headers === 'object' &&
      !(init.headers instanceof Headers)
    ) {
      Object.getOwnPropertyNames(init.headers).forEach(function (name) {
        xhr.setRequestHeader(name, normalizeValue(init.headers[name]))
      })
    } else {
      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value)
      })
    }

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr)

      xhr.onreadystatechange = function () {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr)
        }
      }
    }

    xhr.send(
      typeof request._bodyInit === 'undefined' ? null : request._bodyInit
    )
  })
}

fetch.polyfill = true

if (!global.fetch) {
  global.fetch = fetch
  global.Headers = Headers
  global.Request = Request
  global.Response = Response
}
