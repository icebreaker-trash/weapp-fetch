import { normalizeName, normalizeValue, iteratorFor } from './util'
import support from './support'

export function Headers(headers) {
  this.map = {}

  if (headers instanceof Headers) {
    headers.forEach(function (value, name) {
      this.append(name, value)
    }, this)
  } else if (Array.isArray(headers)) {
    headers.forEach(function (header) {
      this.append(header[0], header[1])
    }, this)
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function (name) {
      this.append(name, headers[name])
    }, this)
  }
}

Headers.prototype.append = function (name, value) {
  name = normalizeName(name)
  value = normalizeValue(value)
  const oldValue = this.map[name]
  this.map[name] = oldValue ? oldValue + ', ' + value : value
}

Headers.prototype.delete = function (name) {
  delete this.map[normalizeName(name)]
}

Headers.prototype.get = function (name) {
  name = normalizeName(name)
  return this.has(name) ? this.map[name] : null
}

Headers.prototype.has = function (name) {
  return this.map.hasOwnProperty(normalizeName(name))
}

Headers.prototype.set = function (name, value) {
  this.map[normalizeName(name)] = normalizeValue(value)
}

Headers.prototype.forEach = function (callback, thisArg) {
  for (const name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this)
    }
  }
}

Headers.prototype.keys = function () {
  const items = []
  this.forEach(function (value, name) {
    items.push(name)
  })
  return iteratorFor(items)
}

Headers.prototype.values = function () {
  const items = []
  this.forEach(function (value) {
    items.push(value)
  })
  return iteratorFor(items)
}

Headers.prototype.entries = function () {
  const items = []
  this.forEach(function (value, name) {
    items.push([name, value])
  })
  return iteratorFor(items)
}

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries
}
