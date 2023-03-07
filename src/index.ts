import { Headers, Request, Response, normalizeValue } from './fetch'
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
      // @ts-ignore
      const request = new Request(input, init)

      if (request.signal && request.signal.aborted) {
        return reject(new DOMException('Aborted', 'AbortError'))
      }
      const url = fixUrl(input)
      const options = defu<WechatMiniprogram.RequestOption, any>(
        {
          url,
          data:
            typeof request._bodyInit === 'undefined' ? null : request._bodyInit,
          success(result) {
            const options = {
              status: result.statusCode,
              statusText: result.errMsg,
              headers: result.header, // parseHeaders(result.header || '')
              url: undefined
            }
            options.url = options.headers['X-Request-URL'] || url
            const body = result.data
            setTimeout(function () {
              // @ts-ignore
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
          // @ts-ignore
          options.header![name] = normalizeValue(init.headers[name])
        })
      } else {
        request.headers.forEach(function (value: string, name: string) {
          // @ts-ignore
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
