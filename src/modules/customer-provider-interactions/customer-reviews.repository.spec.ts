import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer reviews repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'customer-provider-interactions.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'customer-reviews.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-provider-interactions.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'customer-provider-interactions.module.ts'), 'utf8');
  const submitReviewSource = service.slice(service.indexOf('async submitReview'), service.indexOf('async reviews'));
  const listReviewsSource = service.slice(service.indexOf('async reviews'), service.indexOf('async reviewDetails'));
  const detailsSource = service.slice(service.indexOf('async reviewDetails'), service.indexOf('async updateReview'));
  const updateSource = service.slice(service.indexOf('async updateReview'), service.indexOf('async deleteReview'));
  const deleteSource = service.slice(service.indexOf('async deleteReview'), service.indexOf('providerReportReasons'));

  it('keeps customer reviews API routes stable', () => {
    for (const route of ["@Post('orders/:id/reviews')", "@Get('reviews')", "@Get('reviews/:id')", "@Patch('reviews/:id')", "@Delete('reviews/:id')"]) expect(controller).toContain(route);
    expect(controller).toContain("@ApiTags('05 Customer - Reviews')");
    expect(controller).toContain('submitReview(@CurrentUser() user: AuthUserContext, @Param(\'id\') id: string, @Body() dto: CreateReviewDto)');
    expect(controller).toContain('reviews(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerReviewsDto)');
    expect(controller).toContain('updateReview(@CurrentUser() user: AuthUserContext, @Param(\'id\') id: string, @Body() dto: UpdateReviewDto)');
    expect(moduleFile).toContain('CustomerReviewsRepository');
  });

  it('repository owns review DB access', () => {
    for (const method of ['findOrderForReviewByUser', 'findExistingReviewForProviderOrder', 'createReview', 'findReviewsForUser', 'countReviewsForUser', 'findReviewsAndCountForUser', 'findReviewForUser', 'updateReview', 'softDeleteReview', 'createReviewNotification', 'createReviewModerationLog']) expect(repository).toContain(method);
    expect(repository).toContain('this.prisma.order.findFirst');
    expect(repository).toContain('this.prisma.review.findFirst');
    expect(repository).toContain('this.prisma.review.create');
    expect(repository).toContain('this.prisma.review.findMany');
    expect(repository).toContain('this.prisma.review.count');
    expect(repository).toContain('this.prisma.review.update');
    expect(repository).toContain('this.prisma.notification.create');
    expect(repository).toContain('this.prisma.reviewModerationLog.create');
  });

  it('customer can submit review for own completed order', () => {
    expect(submitReviewSource).toContain('getOrderForReview(user.uid, orderId)');
    expect(submitReviewSource).toContain('this.isReviewable(order.status, providerOrder.status)');
    expect(service).toContain('orderStatus === OrderStatus.DELIVERED || orderStatus === OrderStatus.COMPLETED');
    expect(service).toContain('providerStatus === ProviderOrderStatus.DELIVERED || providerStatus === ProviderOrderStatus.COMPLETED');
    expect(submitReviewSource).toContain('createReview({ reviewCode: await this.reviewCode()');
  });

  it('customer cannot review another user order', () => {
    expect(repository).toContain('where: { id: orderId, userId: customerId }');
    expect(service).toContain('private async getOrderForReview(customerId: string, orderId: string): Promise<OrderWithProviderOrders>');
    expect(service).toContain("throw new NotFoundException('Order not found')");
  });

  it('customer cannot review pending or cancelled order', () => {
    expect(submitReviewSource).toContain("throw new BadRequestException('Only delivered or completed orders can be reviewed')");
    expect(service).toContain('private isReviewable(orderStatus: OrderStatus, providerStatus: ProviderOrderStatus): boolean');
    expect(service).not.toContain('OrderStatus.PENDING || providerStatus');
    expect(service).not.toContain('OrderStatus.CANCELLED || providerStatus');
  });

  it('provider must belong to the order and duplicate provider order reviews are blocked', () => {
    expect(submitReviewSource).toContain('order.providerOrders.find((item) => item.providerId === dto.providerId)');
    expect(submitReviewSource).toContain("throw new ForbiddenException('Provider is not part of this order')");
    expect(submitReviewSource).toContain('findExistingReviewForProviderOrder(user.uid, providerOrder.id, [ReviewStatus.REMOVED])');
    expect(repository).toContain('providerOrderId, deletedAt: null, status: { notIn: removedStatuses }');
    expect(submitReviewSource).toContain("throw new BadRequestException('You have already reviewed this provider order')");
  });

  it('customer can list only own reviews', () => {
    expect(listReviewsSource).toContain('userId: user.uid');
    expect(listReviewsSource).toContain('deletedAt: null');
    expect(listReviewsSource).toContain('findReviewsAndCountForUser');
    expect(repository).toContain('orderBy: { createdAt: \'desc\' }');
  });

  it('customer cannot fetch another user review', () => {
    expect(detailsSource).toContain('findReviewForUser(user.uid, id)');
    expect(repository).toContain('where: { id, userId, deletedAt: null }');
    expect(detailsSource).toContain("throw new NotFoundException('Review not found')");
  });

  it('customer can update own review and update moderation is recalculated', () => {
    expect(updateSource).toContain('findReviewForUser(user.uid, id)');
    expect(updateSource).toContain('current.status === ReviewStatus.REMOVED');
    expect(updateSource).toContain('const moderation = this.moderateText(comment, rating)');
    expect(updateSource).toContain('updateReview(id, { rating, comment, status: moderation.status');
    expect(updateSource).toContain('detectedCategoriesJson: moderation.categories');
  });

  it('customer can soft-delete own review and provider response remains intact', () => {
    expect(deleteSource).toContain('findReviewForUser(user.uid, id)');
    expect(deleteSource).toContain('softDeleteReview(id)');
    expect(repository).toContain('data: { deletedAt: new Date() }');
    expect(repository).not.toContain('reviewResponse.delete');
    expect(repository).not.toContain('response.delete');
  });

  it('moderation status decision, notification, and moderation log orchestration stay in service', () => {
    expect(submitReviewSource).toContain('const moderation = this.moderateText(dto.comment, dto.rating)');
    expect(submitReviewSource).toContain('ReviewModerationAction.AUTO_APPROVED');
    expect(submitReviewSource).toContain('ReviewModerationAction.AUTO_FLAGGED');
    expect(submitReviewSource).toContain('createReviewModerationLog');
    expect(submitReviewSource).toContain('review.status === ReviewStatus.PUBLISHED');
    expect(submitReviewSource).toContain('createReviewNotification');
    expect(submitReviewSource).toContain('PROVIDER_REVIEW');
  });
});
