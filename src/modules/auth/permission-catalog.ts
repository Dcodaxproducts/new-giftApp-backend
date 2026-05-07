export const PERMISSION_CATALOG = [
  {
    module: 'users',
    label: 'User Management',
    permissions: [
      { key: 'read', label: 'View Users', description: 'View user lists and profiles.' },
      { key: 'update', label: 'Edit Users', description: 'Modify user profile fields.' },
      { key: 'status.update', label: 'Update User Status', description: 'Enable or disable user access.' },
      { key: 'suspend', label: 'Suspend Users', description: 'Suspend registered user accounts.' },
      { key: 'unsuspend', label: 'Unsuspend Users', description: 'Restore suspended registered user accounts.' },
      { key: 'resetPassword', label: 'Reset User Password', description: 'Send registered user password reset emails.' },
      { key: 'export', label: 'Export Users', description: 'Export registered user data.' },
    ],
  },
  {
    module: 'admins',
    label: 'Admin Management',
    permissions: [
      { key: 'read', label: 'View Admins', description: 'View staff/admin accounts.' },
      { key: 'create', label: 'Create Admins', description: 'Invite or create admin users.' },
      { key: 'update', label: 'Edit Admins', description: 'Update admin profile, role, and status.' },
      { key: 'resetPassword', label: 'Reset Admin Password', description: 'Set temporary passwords.' },
    ],
  },
  {
    module: 'providers',
    label: 'Provider Management',
    permissions: [
      { key: 'read', label: 'View Providers', description: 'View provider profiles and applications.' },
      { key: 'create', label: 'Create Providers', description: 'Create provider accounts from the dashboard.' },
      { key: 'update', label: 'Edit Providers', description: 'Update provider profile fields.' },
      { key: 'approve', label: 'Approve Providers', description: 'Approve provider onboarding.' },
      { key: 'reject', label: 'Reject Providers', description: 'Reject provider onboarding.' },
      { key: 'status.update', label: 'Update Provider Status', description: 'Enable or disable provider access.' },
      { key: 'suspend', label: 'Suspend Providers', description: 'Suspend provider accounts.' },
      { key: 'unsuspend', label: 'Unsuspend Providers', description: 'Restore suspended provider accounts.' },
      { key: 'export', label: 'Export Providers', description: 'Export provider data.' },
      { key: 'message', label: 'Message Providers', description: 'Send provider account messages.' },
    ],
  },
  {
    module: 'gifts',
    label: 'Gift Management',
    permissions: [
      { key: 'read', label: 'View Gifts', description: 'View gift inventory and details.' },
      { key: 'create', label: 'Create Gifts', description: 'Create gift inventory records.' },
      { key: 'update', label: 'Edit Gifts', description: 'Update gift inventory records.' },
      { key: 'delete', label: 'Delete Gifts', description: 'Soft-delete gift inventory records.' },
      { key: 'status.update', label: 'Update Gift Status', description: 'Update gift listing status.' },
      { key: 'export', label: 'Export Gifts', description: 'Export gift inventory data.' },
    ],
  },
  {
    module: 'giftCategories',
    label: 'Gift Categories',
    permissions: [
      { key: 'read', label: 'View Gift Categories', description: 'View gift categories.' },
      { key: 'create', label: 'Create Gift Categories', description: 'Create gift categories.' },
      { key: 'update', label: 'Edit Gift Categories', description: 'Update gift categories.' },
      { key: 'delete', label: 'Delete Gift Categories', description: 'Soft-delete gift categories.' },
    ],
  },
  {
    module: 'giftModeration',
    label: 'Gift Moderation',
    permissions: [
      { key: 'read', label: 'View Gift Moderation', description: 'View moderation queue.' },
      { key: 'approve', label: 'Approve Gifts', description: 'Approve gifts for publishing.' },
      { key: 'reject', label: 'Reject Gifts', description: 'Reject gift submissions.' },
      { key: 'flag', label: 'Flag Gifts', description: 'Flag gifts for manual review.' },
    ],
  },
  {
    module: 'broadcasts',
    label: 'Broadcast Notifications',
    permissions: [
      { key: 'read', label: 'View Broadcasts', description: 'View broadcast campaigns.' },
      { key: 'create', label: 'Create Broadcasts', description: 'Create broadcast drafts.' },
      { key: 'update', label: 'Update Broadcasts', description: 'Update broadcast content and targeting.' },
      { key: 'delete', label: 'Delete Broadcasts', description: 'Delete broadcast drafts.' },
      { key: 'schedule', label: 'Schedule Broadcasts', description: 'Schedule broadcasts.' },
      { key: 'send', label: 'Send Broadcasts', description: 'Send broadcasts now.' },
      { key: 'cancel', label: 'Cancel Broadcasts', description: 'Cancel scheduled broadcasts.' },
      { key: 'report.read', label: 'View Broadcast Reports', description: 'View delivery reports.' },
      { key: 'export', label: 'Export Broadcasts', description: 'Export broadcast reports.' },
    ],
  },
  {
    module: 'notifications',
    label: 'Notifications',
    permissions: [
      { key: 'read', label: 'View Notifications', description: 'View notification center.' },
      { key: 'markRead', label: 'Mark Notifications Read', description: 'Mark notifications as read.' },
    ],
  },
  {
    module: 'subscriptionPlans',
    label: 'Subscription Plans',
    permissions: [
      { key: 'read', label: 'View Subscription Plans', description: 'View subscription plans.' },
      { key: 'create', label: 'Create Subscription Plans', description: 'Create subscription plans.' },
      { key: 'update', label: 'Update Subscription Plans', description: 'Update subscription plans.' },
      { key: 'delete', label: 'Delete Subscription Plans', description: 'Archive subscription plans.' },
      { key: 'status.update', label: 'Update Plan Status', description: 'Update plan status.' },
      { key: 'visibility.update', label: 'Update Plan Visibility', description: 'Update plan visibility.' },
      { key: 'analytics.read', label: 'View Plan Analytics', description: 'View subscription analytics.' },
    ],
  },
  {
    module: 'planFeatures',
    label: 'Plan Features',
    permissions: [
      { key: 'read', label: 'View Plan Features', description: 'View plan feature catalog.' },
      { key: 'create', label: 'Create Plan Features', description: 'Create plan feature catalog entries.' },
      { key: 'update', label: 'Update Plan Features', description: 'Update plan feature catalog.' },
      { key: 'delete', label: 'Delete Plan Features', description: 'Archive plan feature catalog entries.' },
    ],
  },
  {
    module: 'providerBusinessCategories',
    label: 'Provider Business Categories',
    permissions: [
      { key: 'read', label: 'View Provider Business Categories', description: 'View provider business categories.' },
      { key: 'create', label: 'Create Provider Business Categories', description: 'Create provider business categories.' },
      { key: 'update', label: 'Update Provider Business Categories', description: 'Update provider business categories.' },
      { key: 'delete', label: 'Delete Provider Business Categories', description: 'Soft-delete provider business categories.' },
    ],
  },
  {
    module: 'coupons',
    label: 'Coupons',
    permissions: [
      { key: 'read', label: 'View Coupons', description: 'View coupon codes.' },
      { key: 'create', label: 'Create Coupons', description: 'Create coupon codes.' },
      { key: 'update', label: 'Update Coupons', description: 'Update coupon codes.' },
      { key: 'delete', label: 'Delete Coupons', description: 'Delete coupon codes.' },
      { key: 'status.update', label: 'Update Coupon Status', description: 'Activate, deactivate, or expire coupon codes.' },
    ],
  },
  {
    module: 'promotionalOffers',
    label: 'Promotional Offers',
    permissions: [
      { key: 'read', label: 'View Promotional Offers', description: 'View promotional offers.' },
      { key: 'create', label: 'Create Promotional Offers', description: 'Create promotional offers.' },
      { key: 'update', label: 'Update Promotional Offers', description: 'Update promotional offers.' },
      { key: 'delete', label: 'Delete Promotional Offers', description: 'Archive promotional offers.' },
      { key: 'status.update', label: 'Update Offer Status', description: 'Activate or deactivate promotional offers.' },
      { key: 'approve', label: 'Approve Promotional Offers', description: 'Approve provider promotional offers.' },
      { key: 'reject', label: 'Reject Promotional Offers', description: 'Reject provider promotional offers.' },
      { key: 'export', label: 'Export Promotional Offers', description: 'Export promotional offers.' },
    ],
  },
  {
    module: 'transactions',
    label: 'Transactions',
    permissions: [
      { key: 'read', label: 'View Transactions', description: 'View platform transactions.' },
      { key: 'approve', label: 'Approve Transactions', description: 'Approve transaction workflows.' },
      { key: 'refund', label: 'Refund Transactions', description: 'Issue refunds.' },
      { key: 'reviewHighValue', label: 'Review High Value', description: 'Review high-value transactions.' },
    ],
  },
  {
    module: 'reports',
    label: 'Reports',
    permissions: [
      { key: 'read', label: 'View Reports', description: 'View analytics and reports.' },
      { key: 'generate', label: 'Generate Reports', description: 'Generate operational reports.' },
      { key: 'export', label: 'Export Reports', description: 'Export reports.' },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    permissions: [
      { key: 'read', label: 'View Settings', description: 'View platform settings.' },
      { key: 'update', label: 'Update Settings', description: 'Modify operational settings.' },
    ],
  },
  {
    module: 'loginAttempts',
    label: 'Login Attempts',
    permissions: [
      { key: 'read', label: 'View Login Attempts', description: 'View login attempt security logs.' },
      { key: 'export', label: 'Export Login Attempts', description: 'Export login attempt security logs.' },
    ],
  },
  {
    module: 'auditLogs',
    label: 'Audit Logs',
    permissions: [
      { key: 'read', label: 'View Audit Logs', description: 'View administrative audit trail.' },
    ],
  },
] as const;

export const SUPER_ADMIN_PERMISSIONS = PERMISSION_CATALOG.reduce<Record<string, string[]>>(
  (acc, item) => {
    acc[item.module] = item.permissions.map((permission) => permission.key);
    return acc;
  },
  {},
);
