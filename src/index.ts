import { Headers, Request, Response, normalizeValue } from './fetch'
import { defu } from 'defu'
import { fixUrl, isPlainObject } from './util'
import { UserDefinedOptions } from './type'

// declare function fetch(
//   input: RequestInfo | URL,
//   init?: RequestInit
// ): Promise<Response>

// readonly headers: Headers;
//     readonly ok: boolean;
//     readonly redirected: boolean;
//     readonly status: number;
//     readonly statusText: string;
//     readonly type: ResponseType;
//     readonly url: string;
//     clone(): Response;

// type OrignResponse = typeof window.Response

interface OrginResponse extends Body {
  readonly headers: Headers
  readonly ok: boolean
  readonly redirected: boolean
  readonly status: number
  readonly statusText: string
  readonly type: ResponseType
  readonly url: string
  clone(): OrginResponse
}

type SimpleResponse = {
  cookies: string[]
  profile: WechatMiniprogram.RequestProfile
} & OrginResponse

function makeSimpleResponse(
  response: WechatMiniprogram.RequestSuccessCallbackResult<
    string | WechatMiniprogram.IAnyObject | ArrayBuffer
  >,
  options: UserDefinedOptions
): SimpleResponse {
  return {
    cookies: response.cookies,
    profile: response.profile,
    ok: ((response.statusCode / 100) | 0) === 2, // 200-299
    statusText: response.errMsg,
    status: response.statusCode,
    url: response.header['X-Request-URL'] || options.url,
    text: () => Promise.resolve(JSON.stringify(response.data)),
    json: () => Promise.resolve(response.data),

    clone: function () {
      return this
    },
    // @ts-ignore
    headers: new Headers(response.header),
    /**
     * @deprecated start
     */
    blob: () => Promise.reject(new Error('weapp has no blob object!')),
    body: null,
    bodyUsed: false,
    type: 'basic',
    redirected: false,
    formData: () => Promise.reject(new Error('weapp has no formData object!')),
    // 其实是有的
    arrayBuffer: () =>
      Promise.reject(new Error('weapp has no arrayBuffer object!'))

    /**
     * @deprecated end
     */
  }
}

export function createSimpleFetch(
  requestFn: typeof wx.request,
  defaults?: UserDefinedOptions
) {
  return function simpleFetch(url: string, options: UserDefinedOptions = {}) {
    const {
      enableCache,
      enableChunked,
      enableHttp2,
      enableHttpDNS,
      enableQuic,
      forceCellularNetwork,
      httpDNSServiceId,
      timeout,
      complete,
      getTask,
      headers,
      method,
      body,
      dataType
    } = defu(options, defaults)
    const promise = new Promise((resolve, reject) => {
      const innerOptions: WechatMiniprogram.RequestOption = {
        url,
        header: headers,
        method: method || 'GET',
        // @ts-ignore
        data: body,
        dataType,
        // dataType:options.d
        fail: reject,
        success(response) {
          resolve(makeSimpleResponse(response, innerOptions))
        },
        responseType: options.responseType,
        enableCache,
        enableChunked,
        enableHttp2,
        enableHttpDNS,
        enableQuic,
        forceCellularNetwork,
        httpDNSServiceId,
        timeout,
        complete
      }
      const task = requestFn(innerOptions)
      getTask?.(task, innerOptions)
    })
    return promise
  }
}

function createFetch(
  requestFn: typeof wx.request,
  defaults?: UserDefinedOptions
) {
  return function fetch(
    input: string, // RequestInfo | URL,
    init?: UserDefinedOptions
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
            options.url = result.header['X-Request-URL'] || url

            let body = result.data

            if (isPlainObject(result.data)) {
              body = JSON.stringify(result.data)
            }

            setTimeout(function () {
              // @ts-ignore
              resolve(new Response(body, options))
            }, 0)
          },
          method: request.method || 'GET',
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

export { Headers, Request, Response, UserDefinedOptions, createFetch }
