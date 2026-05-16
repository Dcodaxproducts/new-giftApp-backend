import { GiftCategoriesController } from '../controllers/gift-categories.controller';
import { GiftCategoriesLookupController } from '../controllers/gift-categories-lookup.controller';
import { GiftManagementModule } from '../gift-management.module';

describe('GiftManagementModule', () => {
  it('registers gift category lookup controller before dynamic category controller', () => {
    const metadata = Reflect.getMetadata('controllers', GiftManagementModule) as unknown[];
    expect(metadata.indexOf(GiftCategoriesLookupController)).toBeLessThan(metadata.indexOf(GiftCategoriesController));
  });
});
