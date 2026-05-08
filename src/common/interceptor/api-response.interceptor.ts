// src/common/interceptors/api-response.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const responseMessage =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ||
      'Request successful';

    return next.handle().pipe(
      map((data) => {
        // Check if the response has pagination structure (items + meta)
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'meta' in data
        ) {
          return {
            success: true,
            message: responseMessage,
            data: data.items,
            meta: data.meta,
          };
        }

        // For single entities, arrays without pagination, or other responses
        return {
          success: true,
          message: responseMessage,
          data,
        };
      }),
    );
  }
}
