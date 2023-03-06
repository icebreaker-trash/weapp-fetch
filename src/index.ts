export type PromiseWithTask = Promise<unknown> & {
  task?: WechatMiniprogram.RequestTask
}

export function createWeappFetch(requestFn: typeof wx.request) {
  return function weappFetch(
    url: string,
    options: Omit<
      WechatMiniprogram.RequestOption<
        string | ArrayBuffer | WechatMiniprogram.IAnyObject
      >,
      'url'
    > &
      RequestInit & {
        getTask?: (task: WechatMiniprogram.RequestTask, options: any) => void
      } = {}
  ): PromiseWithTask {
    const opt = options
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
    } = opt
    const promise: PromiseWithTask = new Promise((resolve, reject) => {
      const innerOptions: Parameters<typeof requestFn>[0] = {
        url,
        header: headers,
        method: method || 'GET',
        // @ts-ignore
        data: body,
        dataType,
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
              has: (n: string) => response.header[n] != null,
              forEach: (
                callbackFn: (
                  value: string,
                  key: string,
                  object: Record<string, string>
                ) => void
              ) => {
                Object.keys(response.header).forEach((key, idx) => {
                  callbackFn(response.header[key], key, response.header)
                })
              },
              values: () =>
                Object.keys(response.header).map((x) => {
                  return response.header[x]
                })
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
      }
      const task = requestFn(innerOptions)
      getTask?.(task, innerOptions)
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
