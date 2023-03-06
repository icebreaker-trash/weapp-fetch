export type PromiseWithTask = Promise<unknown> & {
  task?: WechatMiniprogram.RequestTask
}

export function createWeappFetch(requestFn: typeof wx.request) {
  return function weappFetch(
    url: string,
    options: RequestInit &
      WechatMiniprogram.RequestOption<
        string | ArrayBuffer | WechatMiniprogram.IAnyObject
      >
  ): PromiseWithTask {
    options = options || {}
    const {
      enableCache,
      enableChunked,
      enableHttp2,
      enableHttpDNS,
      enableQuic,
      forceCellularNetwork,
      httpDNSServiceId,
      timeout,
      complete
    } = options
    const promise: PromiseWithTask = new Promise((resolve, reject) => {
      promise.task = requestFn({
        url,
        header: options.headers,
        method: options.method || ('GET' as const),
        // @ts-ignore
        data: options.body,
        dataType: options.dataType,
        // dataType:options.d
        fail: reject,
        success(response) {
          const res = () => ({
            cookies: response.cookies,
            profile: response.profile,

            ok: ((response.statusCode / 100) | 0) === 2, // 200-299
            statusText: response.errMsg,
            status: response.statusCode,
            url,
            text: () => Promise.resolve(JSON.stringify(response.data)),
            json: () => Promise.resolve(response.data),
            blob: () => Promise.reject(new Error('weapp has no blob object!')),
            clone: response,
            headers: {
              ...response.header,
              keys: () => Object.keys(response.header),
              entries: () =>
                Object.keys(response.header).map((x) => {
                  return [x, response.header[x]]
                }),
              get: (n: string) => response.header[n],
              has: (n: string) => response.header[n] != null
            }
          })
          resolve(res())
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
      })

      // request.onload = () => {
      //   request
      //     .getAllResponseHeaders()
      //     .toLowerCase()
      //     .replace(/^(.+?):/gm, (m, key) => {
      //       headers[key] || keys.push((headers[key] = key))
      //     })
      //   resolve(response())
      // }
    })
    return promise
  }
}

export const weappFetch = createWeappFetch(wx.request)
