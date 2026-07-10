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
      { key: 'resetPassword', label: 'Reset User Password', description: 'Change registered user passwords from the dashboard.' },
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
      { key: 'updateStatus', label: 'Update Provider Status', description: 'Manage provider lifecycle status from the unified status endpoint.' },
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
      { key: 'delete', label: 'Delete Gifts', description: 'Permanently delete gift inventory records.' },
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
      { key: 'delete', label: 'Delete Gift Categories', description: 'Permanently delete gift categories.' },
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
      { key: 'create', label: 'Send Broadcasts', description: 'Send broadcast notifications.' },
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
      { key: 'delete', label: 'Delete Provider Business Categories', description: 'Permanently delete provider business categories.' },
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
      { key: 'read', label: 'View Platform Analytics', description: 'View platform analytics summary, filters, and revenue transactions.' },
      { key: 'export', label: 'Export Platform Analytics', description: 'Generate platform analytics reports.' },
    ],
  },
  {
    module: 'providerPayouts',
    label: 'Provider Payouts',
    permissions: [
      { key: 'read', label: 'View Provider Payouts', description: 'View provider payout dashboard, lists, and details.' },
      { key: 'export', label: 'Export Provider Payouts', description: 'Export provider payout records.' },
      { key: 'initiate', label: 'Initiate Provider Payouts', description: 'Start provider payout workflows from the dashboard.' },
      { key: 'approve', label: 'Approve Provider Payouts', description: 'Approve pending provider payout requests.' },
      { key: 'hold', label: 'Hold Provider Payouts', description: 'Place pending provider payout requests on hold.' },
      { key: 'reject', label: 'Reject Provider Payouts', description: 'Reject provider payout requests and release locked balance when required.' },
    ],
  },
  {
    module: 'payoutSettings',
    label: 'Commission & Payout Settings',
    permissions: [
      { key: 'read', label: 'View Commission & Payout Settings', description: 'View platform commission, payout schedule, and commission tiers.' },
      { key: 'update', label: 'Update Commission & Payout Settings', description: 'Update future payout settings and commission tiers.' },
    ],
  },
  {
    module: 'transactions',
    label: 'Transactions',
    permissions: [
      { key: 'read', label: 'View Transactions', description: 'View platform transactions.' },
      { key: 'approve', label: 'Approve Transactions', description: 'Approve transaction workflows.' },
      { key: 'refund', label: 'Refund Transactions', description: 'Issue refunds.' },
      { key: 'openDispute', label: 'Open Transaction Disputes', description: 'Open dispute cases from transaction details.' },
      { key: 'notifyUser', label: 'Notify Transaction User', description: 'Send transaction notifications to users.' },
      { key: 'receipt.download', label: 'Download Transaction Receipts', description: 'Download transaction receipts.' },
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
    module: 'disputes',
    label: 'Dispute Manager',
    permissions: [
      { key: 'read', label: 'View Disputes', description: 'View dispute queue, stats, and details.' },
      { key: 'create', label: 'Create Disputes', description: 'Create dispute records.' },
      { key: 'review', label: 'Review Disputes', description: 'Approve or reject disputes.' },
    ],
  },
  {
    module: 'refundPolicies',
    label: 'Refund Policy Settings',
    permissions: [
      { key: 'read', label: 'View Refund Policy Settings', description: 'View global refund policy settings.' },
      { key: 'update', label: 'Update Refund Policy Settings', description: 'Update global refund rules.' },
    ],
  },
  {
    module: 'systemSettings',
    label: 'System Settings',
    permissions: [
      { key: 'read', label: 'View System Settings', description: 'View platform, security, payment, and notification settings.' },
      { key: 'update', label: 'Update System Settings', description: 'Update platform, security, payment, notification, logo, and SMTP test settings.' },
    ],
  },
  {
    module: 'seasonalThemes',
    label: 'Seasonal Themes',
    permissions: [
      { key: 'read', label: 'View Seasonal Themes', description: 'View seasonal theme settings.' },
      { key: 'create', label: 'Create Seasonal Themes', description: 'Create seasonal theme image schedules.' },
      { key: 'update', label: 'Update Seasonal Themes', description: 'Update seasonal theme image schedules.' },
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
      { key: 'update', label: 'Update Settings', description: 'Modify operational settings.' },
    ],
  },
  {
    module: 'referralSettings',
    label: 'Referral Settings',
    permissions: [
      { key: 'read', label: 'View Referral Settings', description: 'View global referral program settings and stats.' },
      { key: 'update', label: 'Update Referral Settings', description: 'Update global referral program settings.' },
    ],
  },

  {
    module: 'socialModeration',
    label: 'Social Moderation',
    permissions: [
      { key: 'read', label: 'View Social Moderation', description: 'View social feed moderation stats, queue, and details.' },
      { key: 'moderate', label: 'Moderate Social Content', description: 'Run social moderation actions.' },
      { key: 'hide', label: 'Hide Social Posts', description: 'Hide reported social feed posts.' },
      { key: 'remove', label: 'Remove Social Posts', description: 'Remove reported social feed posts.' },
      { key: 'warn', label: 'Warn Social Users', description: 'Issue social feed warnings.' },
      { key: 'export', label: 'Export Social Moderation', description: 'Export social moderation reports.' },
    ],
  },
  {
    module: 'socialReportingRules',
    label: 'Social Reporting Rules',
    permissions: [
      { key: 'read', label: 'View Social Reporting Rules', description: 'View social reporting rule settings.' },
      { key: 'create', label: 'Create Social Reporting Rules', description: 'Create report categories and escalation rules.' },
      { key: 'update', label: 'Update Social Reporting Rules', description: 'Update reporting rules and status.' },
      { key: 'delete', label: 'Delete Social Reporting Rules', description: 'Permanently delete social reporting rules.' },
      { key: 'export', label: 'Export Social Reporting Rules', description: 'Export social reporting rules.' },
    ],
  },
  {
    module: 'userSafety',
    label: 'User Safety Moderation',
    permissions: [
      { key: 'read', label: 'View User Safety Reports', description: 'View generic user safety report queues and details.' },
      { key: 'moderate', label: 'Moderate User Safety Reports', description: 'Warn, suspend, dismiss, review, or escalate user safety reports.' },
      { key: 'export', label: 'Export User Safety Reports', description: 'Export generic user safety reports.' },
    ],
  },
  {
    module: 'reviews',
    label: 'Reviews Management',
    permissions: [
      { key: 'read', label: 'View Reviews', description: 'View platform review dashboard, stats, lists, and details.' },
      { key: 'moderate', label: 'Moderate Reviews', description: 'Moderate flagged and pending reviews.' },
      { key: 'approve', label: 'Approve Reviews', description: 'Approve reviews from moderation.' },
      { key: 'remove', label: 'Remove Reviews', description: 'Remove reviews from public visibility without physical deletion.' },
      { key: 'hide', label: 'Hide Reviews', description: 'Hide reviews pending moderation or policy decisions.' },
      { key: 'penalize', label: 'Penalize Review Actors', description: 'Apply review policy penalty status markers.' },
      { key: 'export', label: 'Export Reviews', description: 'Export review analytics and moderation summaries.' },
    ],
  },
  {
    module: 'reviewPolicies',
    label: 'Review Policies',
    permissions: [
      { key: 'read', label: 'View Review Policies', description: 'View auto-moderation policy settings and thresholds.' },
      { key: 'update', label: 'Update Review Policies', description: 'Update review policy settings and thresholds.' },
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
