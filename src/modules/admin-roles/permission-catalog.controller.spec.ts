import { Test } from '@nestjs/testing';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionCatalogController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';

describe('PermissionCatalogController', () => {
  it('injects AdminRolesService and returns catalog without undefined service crash', async () => {
    const catalog = { data: [{ module: 'users', permissions: [{ key: 'read' }] }], message: 'Permission catalog fetched successfully' };
    const moduleRef = await Test.createTestingModule({
      controllers: [PermissionCatalogController],
      providers: [{ provide: AdminRolesService, useValue: { catalog: jest.fn().mockReturnValue(catalog) } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const controller = moduleRef.get(PermissionCatalogController);
    expect(controller.catalog()).toBe(catalog);
  });
});
