import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, CacheEntry>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.getCacheKey(request);
    const ttlSeconds = this.getTTL(request);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached)) {
      return of(cached.data);
    }

    // Execute and cache
    return next.handle().pipe(
      tap((response) => {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
          ttl: ttlSeconds * 1000,
        });

        // Simple cleanup - remove expired entries periodically
        this.cleanup();
      }),
    );
  }

  private getCacheKey(request: any): string {
    const url = request.url;
    const query = JSON.stringify(request.query || {});
    return `${url}:${query}`;
  }

  private getTTL(request: any): number {
    // Different TTL based on endpoint
    if (request.url.includes('/recommendations')) {
      return 900; // 15 minutes
    }
    if (request.url.includes('/portfolio/analysis')) {
      return 300; // 5 minutes
    }
    return 60; // 1 minute default
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
