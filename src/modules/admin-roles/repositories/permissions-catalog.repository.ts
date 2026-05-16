import { Injectable } from '@nestjs/common';
import { PERMISSION_CATALOG } from '../constants/permission-catalog';

@Injectable()
export class PermissionsCatalogRepository {
  getPermissionCatalog() {
    return PERMISSION_CATALOG;
  }
}
