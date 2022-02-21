import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { TokenAssetService } from "../../endpoints/tokens/token.asset.service";

describe('Token Service', () => {
  let tokenAssetService: TokenAssetService;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenAssetService = moduleRef.get<TokenAssetService>(TokenAssetService);

  }, Constants.oneHour() * 1000);

  describe('Get All Assets', () => {
    it(`should return all assets`, async () => {
      const assets = await tokenAssetService.getAllAssets();
      const assetValues = Object.values(assets);

      for (const asset of assetValues) {
        expect(asset).toHaveProperty('website');
        expect(asset).toHaveProperty('description');
        expect(asset).toHaveProperty('status');
        expect(asset).toHaveProperty('pngUrl');
        expect(asset).toHaveProperty('svgUrl');
      }
    });
  });

  describe('Get All Assets Raw', () => {
    it('should return all assets raw', async () => {
      const assets = await tokenAssetService.getAllAssetsRaw();
      const assetValues = Object.values(assets);

      for (const asset of assetValues) {
        expect(asset).toHaveProperty('website');
        expect(asset).toHaveProperty('description');
        expect(asset).toHaveProperty('status');
        expect(asset).toHaveProperty('pngUrl');
        expect(asset).toHaveProperty('svgUrl');
      }
    });
  });
});
