/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function host(response: { status: jest.Mock; json: jest.Mock }) {
  return {
    switchToHttp: () => ({ getResponse: () => response }),
  } as never;
}

describe('HttpExceptionFilter', () => {
  it('uses the standard failure envelope for HTTP exceptions', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const filter = new HttpExceptionFilter();

    filter.catch(new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Validation failed', details: ['name is required'] }), host(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      data: null,
      message: 'Validation failed',
      error: expect.objectContaining({ code: 'VALIDATION_FAILED', message: 'Validation failed', details: ['name is required'] }),
      meta: expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST, timestamp: expect.any(String) }),
    }));
  });

  it('uses the standard failure envelope for unexpected errors', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const filter = new HttpExceptionFilter();

    filter.catch(new Error('boom'), host(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      data: null,
      message: 'boom',
      error: expect.objectContaining({ code: 'InternalServerError', message: 'boom' }),
      meta: expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, timestamp: expect.any(String) }),
    }));
  });
});
