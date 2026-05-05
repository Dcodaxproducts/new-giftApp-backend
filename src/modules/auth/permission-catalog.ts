export const PERMISSION_CATALOG = [
  {
    module: 'users',
    label: 'User Management',
    permissions: [
      { key: 'read', label: 'View Users', description: 'View user lists and profiles.' },
      { key: 'update', label: 'Edit Users', description: 'Modify user profile fields.' },
      { key: 'updateStatus', label: 'Activate/Deactivate Users', description: 'Restrict or restore user access.' },
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
      { key: 'approve', label: 'Approve Providers', description: 'Approve provider onboarding.' },
      { key: 'reject', label: 'Reject Providers', description: 'Reject provider onboarding.' },
      { key: 'updateStatus', label: 'Activate/Deactivate Providers', description: 'Restrict or restore provider access.' },
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
