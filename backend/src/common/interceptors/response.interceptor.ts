import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import {
  BaseApiResponse,
  SuccessResponse,
  CreatedResponse,
  PaginatedResponse,
} from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // If data is already a BaseApiResponse, return it as is
        if (data instanceof BaseApiResponse) {
          data.path = path;
          return data;
        }

        // If data is null or undefined, return a simple success response
        if (data === null || data === undefined) {
          return new SuccessResponse(
            'Operation completed successfully',
            undefined,
            path,
          );
        }

        // Handle different response types based on HTTP status
        const statusCode = response.statusCode;

        // Handle paginated responses
        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'meta' in data
        ) {
          const { items, meta } = data;
          return new PaginatedResponse(
            'Data retrieved successfully',
            items,
            {
              page: meta.page || 1,
              limit: meta.limit || items.length,
              total: meta.total || items.length,
              totalPages: meta.totalPages || 1,
              hasNext: meta.hasNext || false,
              hasPrev: meta.hasPrev || false,
            },
            path,
          );
        }

        // Handle created responses (201)
        if (statusCode === HttpStatus.CREATED) {
          return new CreatedResponse(
            'Resource created successfully',
            data,
            path,
          );
        }

        // Handle success responses (200)
        if (statusCode === HttpStatus.OK) {
          // Determine appropriate message based on the data structure
          let message = 'Operation completed successfully';

          if (data && typeof data === 'object') {
            if ('message' in data) {
              message = data.message;
              delete data.message;
            } else if ('accessToken' in data) {
              message = 'Authentication successful';
            } else if (Array.isArray(data)) {
              message = `Retrieved ${data.length} items successfully`;
            } else if (Object.keys(data).length === 0) {
              message = 'Operation completed successfully';
            } else {
              message = 'Data retrieved successfully';
            }
          }

          return new SuccessResponse(message, data, path);
        }

        // Default success response
        return new SuccessResponse(
          'Operation completed successfully',
          data,
          path,
        );
      }),
    );
  }
}
