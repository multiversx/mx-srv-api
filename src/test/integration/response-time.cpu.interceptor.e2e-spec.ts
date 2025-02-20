import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpServer, Logger, Controller, Get } from '@nestjs/common';
import request from 'supertest';
import { MetricsService } from '@multiversx/sdk-nestjs-monitoring';
import { ResponseTimeCpuInterceptor } from 'src/interceptors/response-time.cpu.interceptor';
import { PublicAppModule } from 'src/public.app.module';

@Controller('test')
class TestController {
  @Get('endpoint')
  getFastEndpoint() {
    return { message: 'Test Endpoint' };
  }
}

describe('ResponseTimeCpuInterceptor (e2e)', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let metricsService: MetricsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    metricsService = app.get<MetricsService>(MetricsService);
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should log response time and CPU usage for test endpoint', async () => {
    app.useGlobalInterceptors(new ResponseTimeCpuInterceptor(metricsService, { shouldLog: true }));
    await app.init();

    const logSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await request(httpServer)
      .get('/test/endpoint')
      .expect(200);

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Warning: Response time for'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Warning: CPU usage for'));

    logSpy.mockRestore();
  });

  it('should not log response time and CPU usage when logging is disabled', async () => {
    app.useGlobalInterceptors(new ResponseTimeCpuInterceptor(metricsService, { shouldLog: false }));
    await app.init();

    const logSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await request(httpServer)
      .get('/test/endpoint')
      .expect(200);

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Warning: Response time for'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Warning: CPU usage for'));

    logSpy.mockRestore();
  });
});
