import { Injectable } from '@nestjs/common';
import { PERMISSION_CATALOG } from '../auth/permission-catalog';

@Injectable()
export class PermissionsCatalogRepository {
  getPermissionCatalog() {
    return PERMISSION_CATALOG;
  }
}
