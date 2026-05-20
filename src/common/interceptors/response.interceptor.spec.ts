import { ExecutionContext, StreamableFile } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function context(method = 'POST'): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
  } as unknown as ExecutionContext;
}

describe('ResponseInterceptor', () => {
  const signer = { signResponseImages: jest.fn((value: unknown) => Promise.resolve(value)) };

  beforeEach(() => jest.clearAllMocks());

  it('wraps ApiResult responses in the standard success envelope', async () => {
    const interceptor = new ResponseInterceptor(signer as never);
    const response = await lastValueFrom(interceptor.intercept(context(), { handle: () => of({ data: { id: 'item_1' }, message: 'Fetched.', meta: { page: 1 } }) }));

    expect(response).toEqual({ success: true, data: { id: 'item_1' }, message: 'Fetched.', meta: { page: 1 } });
  });

  it('wraps raw JSON controller values instead of dropping them', async () => {
    const interceptor = new ResponseInterceptor(signer as never);
    const response = await lastValueFrom(interceptor.intercept(context(), { handle: () => of({ status: 'ok' }) }));

    expect(response).toEqual({ success: true, data: { status: 'ok' }, message: 'OK' });
  });

  it('normalizes empty successful JSON responses to data null', async () => {
    const interceptor = new ResponseInterceptor(signer as never);
    const response = await lastValueFrom(interceptor.intercept(context(), { handle: () => of(undefined) }));

    expect(response).toEqual({ success: true, data: null, message: 'OK' });
  });

  it('does not double-wrap already enveloped JSON responses', async () => {
    const interceptor = new ResponseInterceptor(signer as never);
    const response = await lastValueFrom(interceptor.intercept(context(), { handle: () => of({ success: true, data: { id: 'item_1' }, message: 'Already wrapped' }) }));

    expect(response).toEqual({ success: true, data: { id: 'item_1' }, message: 'Already wrapped' });
  });

  it('keeps file downloads raw', async () => {
    const file = new StreamableFile(Buffer.from('a,b'));
    const interceptor = new ResponseInterceptor(signer as never);
    const response = await lastValueFrom(interceptor.intercept(context(), { handle: () => of(file) }));

    expect(response).toBe(file);
  });

  it('signs GET response data only', async () => {
    signer.signResponseImages.mockResolvedValueOnce({ imageUrl: 'signed' });
    const interceptor = new ResponseInterceptor(signer as never);
    const response = await lastValueFrom(interceptor.intercept(context('GET'), { handle: () => of({ data: { imageUrl: 'raw' }, message: 'Fetched.' }) }));

    expect(signer.signResponseImages).toHaveBeenCalledWith({ imageUrl: 'raw' });
    expect(response).toEqual({ success: true, data: { imageUrl: 'signed' }, message: 'Fetched.' });
  });
});
