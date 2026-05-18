import { AuthUserContext } from '../../common/decorators/current-user.decorator';
export const marketplaceActorFactory = (user: AuthUserContext) => user;
