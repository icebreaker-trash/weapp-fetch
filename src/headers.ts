import { normalizeName, normalizeValue, iteratorFor } from './util'
import support from './support'

export default class Headers {
  public map: Record<string, string>
  constructor(headers: Headers) {
    this.map = {}
    if (headers instanceof Headers) {
      headers.forEach((value, name) => {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach((header) => {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach((name) => {
        this.append(name, headers[name])
      }, this)
    }
  }

  append(name: any, value: any) {
    name = normalizeName(name)
    value = normalizeValue(value)
    const oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue + ', ' + value : value
  }

  delete(name: any) {
    delete this.map[normalizeName(name)]
  }

  get(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  has(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  set(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  forEach(callback, thisArg?) {
    for (const name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  keys() {
    const items = []
    this.forEach(function (value, name) {
      items.push(name)
    })
    return iteratorFor(items)
  }

  values() {
    const items = []
    this.forEach(function (value) {
      items.push(value)
    })
    return iteratorFor(items)
  }

  entries() {
    const items = []
    this.forEach(function (value, name) {
      items.push([name, value])
    })
    return iteratorFor(items)
  }
}

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries
}
