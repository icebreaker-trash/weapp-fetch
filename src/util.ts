import support from './support'

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
    iterator[Symbol.iterator] = function () {
      return iterator
    }
  }

  return iterator
}
