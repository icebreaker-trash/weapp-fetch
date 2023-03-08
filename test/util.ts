type IHandler<
  T extends string | WechatMiniprogram.IAnyObject | ArrayBuffer =
    | string
    | WechatMiniprogram.IAnyObject
    | ArrayBuffer
> = (
  options: WechatMiniprogram.RequestOption<T>
) => WechatMiniprogram.RequestSuccessCallbackResult<T>

export function createMockRequestFn(
  fn: IHandler,
  wait = 0
): WechatMiniprogram.Wx['request'] {
  return function request(options) {
    const ts = setTimeout(() => {
      try {
        const res = fn(options)
        options.success?.(res)
      } catch (error) {
        options.fail?.(error as unknown as WechatMiniprogram.Err)
      }
    }, wait)
    return {
      abort: () => {
        clearTimeout(ts)
      },
      offChunkReceived: () => {},
      offHeadersReceived: () => {},
      onHeadersReceived: () => {},
      onChunkReceived: () => {}
    }
  }
}
