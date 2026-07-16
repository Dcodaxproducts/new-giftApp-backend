// Staff roles are granted only the 4 CRUD verbs per module. The PermissionsGuard
// collapses every granular backend action (suspend, approve, refund, export, ...) onto
// one of these verbs, so a single CRUD grant unlocks all related endpoints:
//   read   -> view + export + download + analytics
//   create -> create + initiate
//   update -> edit + status changes + approve/reject + moderation + refund, etc.
//   delete -> delete
// Each module lists only the verbs that map to at least one real endpoint.
export const PERMISSION_CATALOG = [
  {
    module: 'users',
    label: 'User Management',
    permissions: [
      { key: 'read', label: 'View Users', description: 'View user lists and profiles, and export user data.' },
      { key: 'update', label: 'Manage Users', description: 'Edit users and run account actions (status, suspend/unsuspend, reset password).' },
    ],
  },
  {
    module: 'admins',
    label: 'Admin Management',
    permissions: [
      { key: 'read', label: 'View Admins', description: 'View staff/admin accounts.' },
      { key: 'create', label: 'Create Admins', description: 'Invite or create admin users.' },
      { key: 'update', label: 'Manage Admins', description: 'Update admin profile, role, status, and reset passwords.' },
    ],
  },
  {
    module: 'providers',
    label: 'Provider Management',
    permissions: [
      { key: 'read', label: 'View Providers', description: 'View provider profiles and applications, and export provider data.' },
      { key: 'create', label: 'Create Providers', description: 'Create provider accounts from the dashboard.' },
      { key: 'update', label: 'Manage Providers', description: 'Edit providers and run actions (approve, reject, status, suspend/unsuspend, message).' },
    ],
  },
  {
    module: 'documents',
    label: 'Document Management',
    permissions: [
      { key: 'read', label: 'View Documents', description: 'View document definitions providers must upload.' },
      { key: 'create', label: 'Create Documents', description: 'Create new document types for provider onboarding.' },
      { key: 'update', label: 'Manage Documents', description: 'Update document name, requirement, or active status.' },
      { key: 'delete', label: 'Delete Documents', description: 'Permanently delete document definitions.' },
    ],
  },
  {
    module: 'gifts',
    label: 'Gift Management',
    permissions: [
      { key: 'read', label: 'View Gifts', description: 'View gift inventory and details, and export gift data.' },
      { key: 'create', label: 'Create Gifts', description: 'Create gift inventory records.' },
      { key: 'update', label: 'Manage Gifts', description: 'Update gift records and listing status.' },
      { key: 'delete', label: 'Delete Gifts', description: 'Permanently delete gift inventory records.' },
    ],
  },
  {
    module: 'giftCategories',
    label: 'Gift Categories',
    permissions: [
      { key: 'read', label: 'View Gift Categories', description: 'View gift categories.' },
      { key: 'create', label: 'Create Gift Categories', description: 'Create gift categories.' },
      { key: 'update', label: 'Manage Gift Categories', description: 'Update gift categories.' },
      { key: 'delete', label: 'Delete Gift Categories', description: 'Permanently delete gift categories.' },
    ],
  },
  {
    module: 'giftModeration',
    label: 'Gift Moderation',
    permissions: [
      { key: 'read', label: 'View Gift Moderation', description: 'View moderation queue.' },
      { key: 'update', label: 'Moderate Gifts', description: 'Approve, reject, or flag gift submissions.' },
    ],
  },
  {
    module: 'broadcasts',
    label: 'Broadcast Notifications',
    permissions: [
      { key: 'create', label: 'Send Broadcasts', description: 'Send broadcast notifications.' },
    ],
  },
  {
    module: 'notifications',
    label: 'Notifications',
    permissions: [
      { key: 'read', label: 'View Notifications', description: 'View notification center.' },
      { key: 'update', label: 'Manage Notifications', description: 'Mark notifications as read.' },
    ],
  },
  {
    module: 'subscriptionPlans',
    label: 'Subscription Plans',
    permissions: [
      { key: 'read', label: 'View Subscription Plans', description: 'View subscription plans and analytics.' },
      { key: 'create', label: 'Create Subscription Plans', description: 'Create subscription plans.' },
      { key: 'update', label: 'Manage Subscription Plans', description: 'Update plans, status, and visibility.' },
      { key: 'delete', label: 'Delete Subscription Plans', description: 'Archive subscription plans.' },
    ],
  },
  {
    module: 'planFeatures',
    label: 'Plan Features',
    permissions: [
      { key: 'read', label: 'View Plan Features', description: 'View plan feature catalog.' },
      { key: 'create', label: 'Create Plan Features', description: 'Create plan feature catalog entries.' },
      { key: 'update', label: 'Manage Plan Features', description: 'Update plan feature catalog.' },
      { key: 'delete', label: 'Delete Plan Features', description: 'Archive plan feature catalog entries.' },
    ],
  },
  {
    module: 'providerBusinessCategories',
    label: 'Provider Business Categories',
    permissions: [
      { key: 'read', label: 'View Provider Business Categories', description: 'View provider business categories.' },
      { key: 'create', label: 'Create Provider Business Categories', description: 'Create provider business categories.' },
      { key: 'update', label: 'Manage Provider Business Categories', description: 'Update provider business categories.' },
      { key: 'delete', label: 'Delete Provider Business Categories', description: 'Permanently delete provider business categories.' },
    ],
  },
  {
    module: 'promotionalOffers',
    label: 'Promotional Offers',
    permissions: [
      { key: 'read', label: 'View Promotional Offers', description: 'View and export promotional offers.' },
      { key: 'create', label: 'Create Promotional Offers', description: 'Create promotional offers.' },
      { key: 'update', label: 'Manage Promotional Offers', description: 'Update offers, status, and approve/reject provider offers.' },
      { key: 'delete', label: 'Delete Promotional Offers', description: 'Archive promotional offers.' },
    ],
  },
  {
    module: 'dashboard',
    label: 'Dashboard Overview',
    permissions: [
      { key: 'read', label: 'View Dashboard Overview', description: 'View Super Admin dashboard analytics overview.' },
    ],
  },
  {
    module: 'analytics',
    label: 'Platform Analytics',
    permissions: [
      { key: 'read', label: 'View Platform Analytics', description: 'View and export platform analytics, filters, and revenue transactions.' },
    ],
  },
  {
    module: 'providerPayouts',
    label: 'Provider Payouts',
    permissions: [
      { key: 'read', label: 'View Provider Payouts', description: 'View and export provider payout dashboard, lists, and details.' },
      { key: 'create', label: 'Initiate Provider Payouts', description: 'Start provider payout workflows from the dashboard.' },
      { key: 'update', label: 'Manage Provider Payouts', description: 'Approve, hold, or reject provider payout requests.' },
    ],
  },
  {
    module: 'payoutSettings',
    label: 'Commission & Payout Settings',
    permissions: [
      { key: 'read', label: 'View Commission & Payout Settings', description: 'View platform commission, payout schedule, and commission tiers.' },
      { key: 'update', label: 'Manage Commission & Payout Settings', description: 'Update future payout settings and commission tiers.' },
    ],
  },
  {
    module: 'transactions',
    label: 'Transactions',
    permissions: [
      { key: 'read', label: 'View Transactions', description: 'View platform transactions and download receipts.' },
      { key: 'update', label: 'Manage Transactions', description: 'Approve, refund, open disputes, notify users, and review high-value transactions.' },
    ],
  },
  {
    module: 'reports',
    label: 'Reports',
    permissions: [
      { key: 'read', label: 'View Reports', description: 'View, generate, and export analytics and operational reports.' },
    ],
  },
  {
    module: 'disputes',
    label: 'Dispute Manager',
    permissions: [
      { key: 'read', label: 'View Disputes', description: 'View dispute queue, stats, and details.' },
      { key: 'create', label: 'Create Disputes', description: 'Create dispute records.' },
      { key: 'update', label: 'Manage Disputes', description: 'Review, approve, or reject disputes.' },
    ],
  },
  {
    module: 'refundPolicies',
    label: 'Refund Policy Settings',
    permissions: [
      { key: 'read', label: 'View Refund Policy Settings', description: 'View global refund policy settings.' },
      { key: 'update', label: 'Manage Refund Policy Settings', description: 'Update global refund rules.' },
    ],
  },
  {
    module: 'systemSettings',
    label: 'System Settings',
    permissions: [
      { key: 'read', label: 'View System Settings', description: 'View platform, security, payment, and notification settings.' },
      { key: 'update', label: 'Manage System Settings', description: 'Update platform, security, payment, notification, logo, and SMTP settings.' },
    ],
  },
  {
    module: 'seasonalThemes',
    label: 'Seasonal Themes',
    permissions: [
      { key: 'read', label: 'View Seasonal Themes', description: 'View seasonal theme settings.' },
      { key: 'create', label: 'Create Seasonal Themes', description: 'Create seasonal theme image schedules.' },
      { key: 'update', label: 'Manage Seasonal Themes', description: 'Update seasonal theme image schedules.' },
      { key: 'delete', label: 'Delete Seasonal Themes', description: 'Delete seasonal theme schedules.' },
    ],
  },
  {
    module: 'systemHealth',
    label: 'System Health Monitoring',
    permissions: [
      { key: 'read', label: 'View System Health', description: 'View server resource usage and API reliability metrics.' },
    ],
  },
  {
    module: 'settings',
    label: 'Settings',
    permissions: [
      { key: 'read', label: 'View Settings', description: 'View platform settings.' },
      { key: 'update', label: 'Manage Settings', description: 'Modify operational settings.' },
    ],
  },
  {
    module: 'referralSettings',
    label: 'Referral Settings',
    permissions: [
      { key: 'read', label: 'View Referral Settings', description: 'View global referral program settings and stats.' },
      { key: 'update', label: 'Manage Referral Settings', description: 'Update global referral program settings.' },
    ],
  },

  {
    module: 'socialModeration',
    label: 'Social Moderation',
    permissions: [
      { key: 'read', label: 'View Social Moderation', description: 'View and export social feed moderation stats, queue, and details.' },
      { key: 'update', label: 'Moderate Social Content', description: 'Run moderation actions: hide, remove, or warn on reported social content.' },
    ],
  },
  {
    module: 'socialReportingRules',
    label: 'Social Reporting Rules',
    permissions: [
      { key: 'read', label: 'View Social Reporting Rules', description: 'View and export social reporting rule settings.' },
      { key: 'create', label: 'Create Social Reporting Rules', description: 'Create report categories and escalation rules.' },
      { key: 'update', label: 'Manage Social Reporting Rules', description: 'Update reporting rules and status.' },
      { key: 'delete', label: 'Delete Social Reporting Rules', description: 'Permanently delete social reporting rules.' },
    ],
  },
  {
    module: 'userSafety',
    label: 'User Safety Moderation',
    permissions: [
      { key: 'read', label: 'View User Safety Reports', description: 'View and export generic user safety report queues and details.' },
      { key: 'update', label: 'Moderate User Safety Reports', description: 'Warn, suspend, dismiss, review, or escalate user safety reports.' },
    ],
  },
  {
    module: 'reviews',
    label: 'Reviews Management',
    permissions: [
      { key: 'read', label: 'View Reviews', description: 'View and export platform review dashboard, stats, lists, and details.' },
      { key: 'update', label: 'Moderate Reviews', description: 'Moderate, approve, remove, hide, or penalize reviews and review actors.' },
    ],
  },
  {
    module: 'reviewPolicies',
    label: 'Review Policies',
    permissions: [
      { key: 'read', label: 'View Review Policies', description: 'View auto-moderation policy settings and thresholds.' },
      { key: 'update', label: 'Manage Review Policies', description: 'Update review policy settings and thresholds.' },
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
