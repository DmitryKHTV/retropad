import { Test, TestingModule } from '@nestjs/testing';
import { StickersController } from './stickers.controller';

describe('StickersController', () => {
  let controller: StickersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StickersController],
    }).compile();

    controller = module.get<StickersController>(StickersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
