import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';

@Injectable()
export class ResponseTimeCpuInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseTimeCpuInterceptor.name);
  private readonly shouldLog: boolean;

  constructor(
    private readonly metricsService: MetricsService,
    options: { shouldLog?: boolean } = {},
  ) {
    this.shouldLog = options.shouldLog ?? true;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const profiler = new PerformanceProfiler();
    const startCpuUsage = process.cpuUsage();

    return next.handle().pipe(
      tap(() => {
        const duration = profiler.stop();
        const endCpuUsage = process.cpuUsage(startCpuUsage);
        const cpuUsage = (endCpuUsage.user + endCpuUsage.system) / 1000;

        const request = context.switchToHttp().getRequest();
        const endpoint = request.url;

        console.log(`${endpoint} - ${duration}ms - ${cpuUsage}ms`);
        this.metricsService.setExternalCall('response_time', duration);
        this.metricsService.setExternalCall('cpu_usage', cpuUsage);

        if (this.shouldLog) {
          if (duration > 1000) {
            this.logger.warn(`Warning: Response time for ${endpoint} is ${duration}ms`);
          }

          if (cpuUsage > 500) {
            this.logger.warn(`Warning: CPU usage for ${endpoint} is ${cpuUsage}ms`);
          }
        }
      }),
    );
  }
}
