import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminRolesController, PermissionCatalogController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';

const superAdmin = { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN };

describe('AdminRoles controllers', () => {
  async function setup() {
    const service = {
      list: jest.fn().mockReturnValue({ data: [], message: 'Admin roles fetched successfully' }),
      catalog: jest.fn().mockReturnValue({ data: [], message: 'Permission catalog fetched successfully' }),
      create: jest.fn(),
      details: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updatePermissions: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminRolesController, PermissionCatalogController],
      providers: [{ provide: AdminRolesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    return { moduleRef, service };
  }

  it('GET /admin-roles controller has injected service and calls list', async () => {
    const { moduleRef, service } = await setup();
    const controller = moduleRef.get(AdminRolesController);
    expect(controller.list(superAdmin, {})).toEqual({ data: [], message: 'Admin roles fetched successfully' });
    expect(service.list).toHaveBeenCalledWith(superAdmin, {});
  });

  it('GET /permissions/catalog controller has injected service and calls catalog', async () => {
    const { moduleRef, service } = await setup();
    const controller = moduleRef.get(PermissionCatalogController);
    expect(controller.catalog()).toEqual({ data: [], message: 'Permission catalog fetched successfully' });
    expect(service.catalog).toHaveBeenCalledWith();
  });
});
