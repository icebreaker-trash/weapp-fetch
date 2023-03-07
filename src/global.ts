/* eslint-disable no-use-before-define */
export const global =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  (typeof global !== 'undefined' && global) ||
  {}
