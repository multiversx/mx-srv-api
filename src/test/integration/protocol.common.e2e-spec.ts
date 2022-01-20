import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {ProtocolService} from "../../common/protocol/protocol.service";

describe('Protocol Service', () => {
  let protocolService: ProtocolService;

  beforeAll(async () => {
    await Initializer.initialize();
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    protocolService = publicAppModule.get<ProtocolService>(ProtocolService);

  }, Constants.oneHour() * 1000);

  describe('Get Shards Ids', () => {
    it('should return shards ids', async () => {
      const returnShardsId = await protocolService.getShardIds();
      expect(returnShardsId).toBeInstanceOf(Array);
    });
  });

  describe('Get Seconds Remaining Until Next Round', () => {
    it('should return the remaining seconds until next round', async () => {
      const returnSeconds: Number = new Number(await protocolService.getSecondsRemainingUntilNextRound());
      expect(returnSeconds).toBeInstanceOf(Number);
    });
  });
});