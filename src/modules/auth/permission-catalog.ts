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
