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
    module: 'dashboard',
    label: 'Dashboard Overview',
    permissions: [
      { key: 'read', label: 'View Dashboard Overview', description: 'View Super Admin dashboard analytics overview.' },
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
      { key: 'read', label: 'View Disputes', description: 'View dispute queue, stats, details, internal data, and timeline.' },
      { key: 'create', label: 'Create Disputes', description: 'Create dispute cases.' },
      { key: 'update', label: 'Update Disputes', description: 'Update dispute cases.' },
      { key: 'assign', label: 'Assign Disputes', description: 'Assign disputes to admin users.' },
      { key: 'linkTransaction', label: 'Link Dispute Transaction', description: 'Link disputes to original transactions.' },
      { key: 'refund.evaluate', label: 'Evaluate Dispute Refunds', description: 'Preview and validate dispute refund selection.' },
      { key: 'decide', label: 'Make Dispute Decisions', description: 'Submit dispute approval, rejection, or escalation decisions.' },
      { key: 'approve', label: 'Approve Disputes', description: 'Approve disputes and process eligible refunds.' },
      { key: 'reject', label: 'Reject Disputes', description: 'Reject disputes with reason and comment.' },
      { key: 'escalate', label: 'Escalate Disputes', description: 'Escalate disputes to supervisors/admins.' },
      { key: 'tracking.read', label: 'View Dispute Tracking', description: 'View full dispute tracking log.' },
      { key: 'tracking.export', label: 'Export Dispute Tracking', description: 'Export full dispute tracking log.' },
      { key: 'notes.create', label: 'Create Dispute Notes', description: 'Add internal notes to dispute cases.' },
      { key: 'export', label: 'Export Disputes', description: 'Export dispute cases.' },
      { key: 'evidence.read', label: 'View Dispute Evidence', description: 'View dispute evidence files.' },
      { key: 'timeline.read', label: 'View Dispute Timeline', description: 'View dispute timeline events.' },
    ],
  },
  {
    module: 'providerDisputes',
    label: 'Provider Dispute Manager',
    permissions: [
      { key: 'read', label: 'View Provider Disputes', description: 'View provider dispute queue, stats, details, evidence, notes, and timeline.' },
      { key: 'create', label: 'Create Provider Disputes', description: 'Create provider dispute cases.' },
      { key: 'update', label: 'Update Provider Disputes', description: 'Update provider dispute cases.' },
      { key: 'assign', label: 'Assign Provider Disputes', description: 'Assign provider dispute cases to admins.' },
      { key: 'evidence.read', label: 'View Provider Dispute Evidence', description: 'View evidence exchange for provider disputes.' },
      { key: 'evidence.request', label: 'Request Provider Dispute Evidence', description: 'Request additional evidence from provider or customer.' },
      { key: 'ruling.read', label: 'View Provider Dispute Rulings', description: 'View provider dispute ruling and financial impact summaries.' },
      { key: 'ruling.create', label: 'Create Provider Dispute Rulings', description: 'Create provider dispute rulings.' },
      { key: 'ruling.update', label: 'Update Provider Dispute Rulings', description: 'Update provider dispute rulings.' },
      { key: 'financial.read', label: 'View Provider Financial Impact', description: 'View provider financial impact and account preview.' },
      { key: 'financial.link', label: 'Link Provider Financial Adjustments', description: 'Create payout and penalty linkage for provider disputes.' },
      { key: 'penalty.apply', label: 'Apply Provider Dispute Penalties', description: 'Apply penalty decisions for provider disputes.' },
      { key: 'resolve', label: 'Finalize Provider Disputes', description: 'Finalize provider dispute resolutions.' },
      { key: 'notify', label: 'Notify Provider Dispute Parties', description: 'Resend provider dispute notifications.' },
      { key: 'logs.read', label: 'View Provider Dispute Logs', description: 'View provider dispute resolution logs.' },
      { key: 'logs.export', label: 'Export Provider Dispute Logs', description: 'Export provider dispute resolution logs.' },
      { key: 'notes.create', label: 'Create Provider Dispute Notes', description: 'Add internal notes to provider disputes.' },
      { key: 'export', label: 'Export Provider Disputes', description: 'Export provider dispute cases.' },
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
    module: 'settings',
    label: 'Settings',
    permissions: [
      { key: 'read', label: 'View Settings', description: 'View platform settings.' },
      { key: 'update', label: 'Update Settings', description: 'Modify operational settings.' },
    ],
  },
  {
    module: 'mediaPolicy',
    label: 'Media Upload Policy',
    permissions: [
      { key: 'read', label: 'View Media Upload Policy', description: 'View global media upload rules.' },
      { key: 'update', label: 'Update Media Upload Policy', description: 'Update global media upload rules.' },
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
      { key: 'export', label: 'Export Social Moderation', description: 'Export social moderation logs.' },
    ],
  },
  {
    module: 'socialReportingRules',
    label: 'Social Reporting Rules',
    permissions: [
      { key: 'read', label: 'View Social Reporting Rules', description: 'View social reporting rule settings.' },
      { key: 'create', label: 'Create Social Reporting Rules', description: 'Create report categories and escalation rules.' },
      { key: 'update', label: 'Update Social Reporting Rules', description: 'Update reporting rules and status.' },
      { key: 'delete', label: 'Delete Social Reporting Rules', description: 'Soft-delete social reporting rules.' },
      { key: 'export', label: 'Export Social Reporting Rules', description: 'Export social reporting rules.' },
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
    module: 'reviewModerationLogs',
    label: 'Review Moderation Logs',
    permissions: [
      { key: 'read', label: 'View Review Moderation Logs', description: 'View review moderation activity logs.' },
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
