// export type PromiseWithTask = Promise<unknown> & {
//   task?: WechatMiniprogram.RequestTask
// }

// export function createWeappFetch(requestFn: typeof wx.request) {
//   return function weappFetch(
//     url: string,
//     options: Omit<
//       WechatMiniprogram.RequestOption<
//         string | ArrayBuffer | WechatMiniprogram.IAnyObject
//       >,
//       'url'
//     > &
//       RequestInit & {
//         getTask?: (task: WechatMiniprogram.RequestTask, options: any) => void
//       } = {}
//   ): PromiseWithTask {
//     const opt = options
//     const {
//       enableCache,
//       enableChunked,
//       enableHttp2,
//       enableHttpDNS,
//       enableQuic,
//       forceCellularNetwork,
//       httpDNSServiceId,
//       timeout,
//       complete,
//       getTask,
//       headers,
//       method,
//       body,
//       dataType
//     } = opt
//     const promise: PromiseWithTask = new Promise((resolve, reject) => {
//       const innerOptions: Parameters<typeof requestFn>[0] = {
//         url,
//         header: headers,
//         method: method || 'GET',
//         // @ts-ignore
//         data: body,
//         dataType,
//         // dataType:options.d
//         fail: reject,
//         success(response) {
//           const res = () => ({
//             cookies: response.cookies,
//             profile: response.profile,

//             ok: ((response.statusCode / 100) | 0) === 2, // 200-299
//             statusText: response.errMsg,
//             status: response.statusCode,
//             url,
//             text: () => Promise.resolve(JSON.stringify(response.data)),
//             json: () => Promise.resolve(response.data),
//             blob: () => Promise.reject(new Error('weapp has no blob object!')),
//             clone: response,
//             headers: {
//               ...response.header,
//               keys: () => Object.keys(response.header),
//               entries: () =>
//                 Object.keys(response.header).map((x) => {
//                   return [x, response.header[x]]
//                 }),
//               get: (n: string) => response.header[n],
//               has: (n: string) => response.header[n] != null,
//               forEach: (
//                 callbackFn: (
//                   value: string,
//                   key: string,
//                   object: Record<string, string>
//                 ) => void
//               ) => {
//                 Object.keys(response.header).forEach((key, idx) => {
//                   callbackFn(response.header[key], key, response.header)
//                 })
//               },
//               values: () =>
//                 Object.keys(response.header).map((x) => {
//                   return response.header[x]
//                 })
//             }
//           })
//           resolve(res())
//         },
//         responseType: options.responseType,
//         enableCache,
//         enableChunked,
//         enableHttp2,
//         enableHttpDNS,
//         enableQuic,
//         forceCellularNetwork,
//         httpDNSServiceId,
//         timeout,
//         complete
//       }
//       const task = requestFn(innerOptions)
//       getTask?.(task, innerOptions)
//       // request.onload = () => {
//       //   request
//       //     .getAllResponseHeaders()
//       //     .toLowerCase()
//       //     .replace(/^(.+?):/gm, (m, key) => {
//       //       headers[key] || keys.push((headers[key] = key))
//       //     })
//       //   resolve(response())
//       // }
//     })
//     return promise
//   }
// }

// export const weappFetch = createWeappFetch(wx.request)

import {
  Headers,
  Request,
  Response,
  support,
  parseHeaders,
  normalizeValue
} from './fetch'
import { defu } from 'defu'

interface GetTaskOption {
  getTask?: (task: WechatMiniprogram.RequestTask, options: any) => void
}
// declare function fetch(
//   input: RequestInfo | URL,
//   init?: RequestInit
// ): Promise<Response>

function fixUrl(url: string) {
  try {
    return url === '' && global.location.href ? global.location.href : url
  } catch (e) {
    return url
  }
}

export function createFetch(
  requestFn: typeof wx.request,
  defaults?: Partial<
    RequestInit & WechatMiniprogram.RequestOption & GetTaskOption
  >
) {
  return function fetch(
    input: string, // RequestInfo | URL,
    init?: Partial<
      RequestInit & WechatMiniprogram.RequestOption & GetTaskOption
    >
  ): Promise<Response> {
    return new Promise(function (resolve, reject) {
      const request = new Request(input, init)

      if (request.signal && request.signal.aborted) {
        return reject(new DOMException('Aborted', 'AbortError'))
      }

      const options = defu<WechatMiniprogram.RequestOption, any>(
        {
          url: fixUrl(input),
          data:
            typeof request._bodyInit === 'undefined' ? null : request._bodyInit,
          success(result) {
            const options = {
              status: result.statusCode,
              statusText: result.errMsg,
              headers: result.header // parseHeaders(result.header || '')
            }
            options.url = options.headers['X-Request-URL']
            const body = result.data
            setTimeout(function () {
              resolve(new Response(body, options))
            }, 0)
          },
          method: request.method,
          fail(err) {
            setTimeout(function () {
              reject(err)
            }, 0)
          },
          dataType: init?.dataType,
          enableCache: init?.enableCache,
          enableChunked: init?.enableChunked,
          enableHttp2: init?.enableHttp2,
          enableHttpDNS: init?.enableHttpDNS,
          enableQuic: init?.enableQuic,
          forceCellularNetwork: init?.forceCellularNetwork,
          header: init?.header,
          httpDNSServiceId: init?.httpDNSServiceId,
          responseType: init?.responseType,
          timeout: init?.timeout
        },
        defaults
      )
      if (!options.header) {
        options.header = {}
      }

      if (
        init &&
        typeof init.headers === 'object' &&
        !(init.headers instanceof Headers)
      ) {
        Object.getOwnPropertyNames(init.headers).forEach(function (name) {
          options.header![name] = normalizeValue(init.headers[name])
        })
      } else {
        request.headers.forEach(function (value, name) {
          options.header![name] = value
        })
      }
      const task = requestFn(options)
      init?.getTask?.(task, options)
      // function abortTask() {
      //   task.abort()
      // }

      // if (request.credentials === 'include') {
      //   xhr.withCredentials = true
      // } else if (request.credentials === 'omit') {
      //   xhr.withCredentials = false
      // }

      // if ('responseType' in xhr) {
      //   if (support.blob) {
      //     xhr.responseType = 'blob'
      //   } else if (
      //     support.arrayBuffer &&
      //     request.headers.get('Content-Type') &&
      //     request.headers
      //       .get('Content-Type')
      //       .indexOf('application/octet-stream') !== -1
      //   ) {
      //     xhr.responseType = 'arraybuffer'
      //   }
      // }

      // if (request.signal) {
      //   request.signal.addEventListener('abort', abortXhr)

      //   xhr.onreadystatechange = function () {
      //     // DONE (success or failure)
      //     if (xhr.readyState === 4) {
      //       request.signal.removeEventListener('abort', abortXhr)
      //     }
      //   }
      // }

      // xhr.send(
      //   typeof request._bodyInit === 'undefined' ? null : request._bodyInit
      // )
    })
  }
}

export { Headers, Request, Response }
