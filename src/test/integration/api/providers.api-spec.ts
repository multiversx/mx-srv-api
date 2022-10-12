import { CleanupInterceptor, FieldsInterceptor } from '@elrondnetwork/erdnest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { ApiChecker } from 'src/utils/api.checker';

describe("API Testing", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      new FieldsInterceptor(),
      new CleanupInterceptor(),
    );
    await app.init();
  });

  it("/providers", async () => {
    const checker = new ApiChecker('providers', app.getHttpServer());
    await checker.checkStatus();
    await checker.checkDetails();
    await checker.checkFilter(['identity']);
  });
});
