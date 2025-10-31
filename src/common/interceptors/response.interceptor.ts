import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // Don't wrap if it's already a structured response
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // For successful responses
        if (statusCode >= 200 && statusCode < 300) {
          return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
          };
        }

        return data;
      }),
    );
  }
}
