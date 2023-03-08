export function isObject(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

export function isPlainObject(o: any): boolean {
  let ctor, prot

  if (isObject(o) === false) return false

  // If has modified constructor
  // eslint-disable-next-line prefer-const
  ctor = o.constructor
  if (ctor === undefined) return true

  // If has modified prototype
  // eslint-disable-next-line prefer-const
  prot = ctor.prototype
  if (isObject(prot) === false) return false

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false
  }

  // Most likely a plain Object
  return true
}

export function fixUrl(url: string) {
  try {
    return url === '' && global.location.href ? global.location.href : url
  } catch (e) {
    return url
  }
}
