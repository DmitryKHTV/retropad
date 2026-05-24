import { Test, TestingModule } from '@nestjs/testing';
import { StickersService } from './stickers.service';

describe('StickersService', () => {
  let service: StickersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StickersService],
    }).compile();

    service = module.get<StickersService>(StickersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
