import { UserRole } from '../types';

export type AppRoute = 
  | 'home'
  | 'store'
  | 'tracker'
  | 'designer'
  | 'replica'
  | 'portal'
  | 'technician'
  | 'postal'
  | 'admin';

export type RbacAction =
  // Store & Purchasing
  | 'browse_catalog'
  | 'add_to_cart'
  | 'submit_postal_order'
  | 'track_postal_order'
  // Switch Panel Design & Quotes
  | 'use_panel_designer'
  | 'request_custom_panel_quote'
  | 'request_replica_quote'
  | 'request_diagnostic_booking'
  // Vessel Owner Portal
  | 'view_vessel_specs'
  | 'edit_vessel_spec'
  | 'approve_quote'
  | 'pay_deposit'
  | 'send_client_message'
  // Technician Operations
  | 'view_technician_jobs'
  | 'log_diagnostic_hours'
  | 'log_materials_used'
  | 'update_job_status'
  | 'upload_fitment_proof'
  | 'send_technician_message'
  // Postal Fulfillment Operations
  | 'view_postal_queue'
  | 'pack_postal_consignment'
  | 'update_postal_status'
  | 'assign_tracking_number'
  | 'print_packing_slip'
  // Workshop Master Administration
  | 'access_admin_dashboard'
  | 'edit_catalog_pricing'
  | 'create_catalog_snapshot'
  | 'restore_catalog_snapshot'
  | 'draft_supplier_purchase_order'
  | 'restock_catalog_inventory'
  | 'dismiss_stock_alert'
  | 'access_laser_print_studio'
  | 'manage_user_roles'
  // Website Platform Administration
  | 'manage_site_settings'
  | 'manage_api_keys'
  | 'switch_environments'
  | 'manage_site_roles';

export interface RouteAccessRule {
  route: AppRoute;
  name: string;
  category: 'Public Services' | 'Vessel Owner' | 'Workshop Operations' | 'Administration';
  allowedRoles: UserRole[];
  description: string;
  defaultFallback: AppRoute;
}

export interface ActionAccessRule {
  action: RbacAction;
  name: string;
  category: 'Store & Quotes' | 'Vessel Management' | 'Technician Diagnostics' | 'Postal Dispatch' | 'Master Administration' | 'Website Administration';
  allowedRoles: UserRole[];
  description: string;
}

/**
 * Route-Level Access Control Rules Matrix.
 * Defines which roles can navigate to and render each route.
 */
export const ROUTE_ACCESS_MATRIX: Record<AppRoute, RouteAccessRule> = {
  home: {
    route: 'home',
    name: 'Services & Solent Overview',
    category: 'Public Services',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Public landing page, service rate cards, and Solent coverage information.',
    defaultFallback: 'home'
  },
  store: {
    route: 'store',
    name: 'Marine Electrical Parts Store',
    category: 'Public Services',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Online store for tinned cables, Victron equipment, fuses, and postal ordering.',
    defaultFallback: 'home'
  },
  tracker: {
    route: 'tracker',
    name: 'Postal Order Consignment Tracker',
    category: 'Public Services',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Consignment tracker for checking packaging and Royal Mail/courier tracking numbers.',
    defaultFallback: 'home'
  },
  designer: {
    route: 'designer',
    name: 'Custom Switch Panel Designer',
    category: 'Vessel Owner',
    allowedRoles: ['guest', 'client', 'admin', 'site'],
    description: 'Interactive visual switch panel CAD configurator and quote builder.',
    defaultFallback: 'home'
  },
  replica: {
    route: 'replica',
    name: 'Replica Panel Photo Quote',
    category: 'Vessel Owner',
    allowedRoles: ['guest', 'client', 'admin', 'site'],
    description: 'Upload photos of weathered boat switchboards for exact CAD laser replica quotes.',
    defaultFallback: 'home'
  },
  portal: {
    route: 'portal',
    name: 'Boat Owner Vessel Portal',
    category: 'Vessel Owner',
    allowedRoles: ['client', 'admin'],
    description: 'Vessel specifications, battery & solar profiles, diagnostic job tracking, and deposits.',
    defaultFallback: 'home'
  },
  technician: {
    route: 'technician',
    name: 'Solent Marine Technician Workstation',
    category: 'Workshop Operations',
    allowedRoles: ['technician', 'admin'],
    description: 'Field technician station for logging diagnostic hours (£25/hr), materials used, and job status.',
    defaultFallback: 'home'
  },
  postal: {
    route: 'postal',
    name: 'Workshop Postal Dispatch Station',
    category: 'Workshop Operations',
    allowedRoles: ['postal', 'admin'],
    description: 'Packing station for fulfilling online orders, printing packing slips, and assigning tracking.',
    defaultFallback: 'home'
  },
  admin: {
    route: 'admin',
    name: "Anthony's Master Workshop",
    category: 'Administration',
    allowedRoles: ['admin'],
    description: 'Full oversight: catalog pricing, snapshots, zero-stock alerts, supplier reorders, and laser print studio.',
    defaultFallback: 'home'
  }
};

/**
 * Action-Level Access Control Rules Matrix.
 * Defines which roles are authorized to execute specific state-altering or privileged operations.
 */
export const ACTION_ACCESS_MATRIX: Record<RbacAction, ActionAccessRule> = {
  // Store & Purchasing
  browse_catalog: {
    action: 'browse_catalog',
    name: 'Browse Hardware Catalog',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Browse marine cables, fuses, busbars, and Victron components.'
  },
  add_to_cart: {
    action: 'add_to_cart',
    name: 'Add Items to Postal Basket',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Add marine components to cart for postal dispatch or marina collection.'
  },
  submit_postal_order: {
    action: 'submit_postal_order',
    name: 'Place Postal Order',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Submit an online store order and reserve warehouse stock.'
  },
  track_postal_order: {
    action: 'track_postal_order',
    name: 'Track Postal Consignment',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Look up live delivery status and carrier tracking numbers.'
  },

  // Switch Panel Design & Quotes
  use_panel_designer: {
    action: 'use_panel_designer',
    name: 'Design Switch Panel',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'admin', 'site'],
    description: 'Configure custom acrylic/teak panels and generate live quotes.'
  },
  request_custom_panel_quote: {
    action: 'request_custom_panel_quote',
    name: 'Order Custom Panel',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'admin', 'site'],
    description: 'Submit custom panel configuration for fabrication.'
  },
  request_replica_quote: {
    action: 'request_replica_quote',
    name: 'Request Replica Panel Quote',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'admin', 'site'],
    description: 'Upload photos of existing panels for identical replacement quotes.'
  },
  request_diagnostic_booking: {
    action: 'request_diagnostic_booking',
    name: 'Book Diagnostic Visit',
    category: 'Store & Quotes',
    allowedRoles: ['guest', 'client', 'technician', 'postal', 'admin', 'site'],
    description: 'Request a £25/hr on-vessel diagnostic booking in the Solent area.'
  },

  // Vessel Owner Portal
  view_vessel_specs: {
    action: 'view_vessel_specs',
    name: 'View Vessel Specifications',
    category: 'Vessel Management',
    allowedRoles: ['client', 'admin'],
    description: 'Inspect boat electrical layout, battery capacity, and past maintenance history.'
  },
  edit_vessel_spec: {
    action: 'edit_vessel_spec',
    name: 'Update Vessel Specifications',
    category: 'Vessel Management',
    allowedRoles: ['client', 'admin'],
    description: 'Save changes to boat specs, alternator rating, solar controller, and electrical history.'
  },
  approve_quote: {
    action: 'approve_quote',
    name: 'Approve Job Quote',
    category: 'Vessel Management',
    allowedRoles: ['client', 'admin'],
    description: 'Confirm quote acceptance to proceed with workshop diagnostic or installation work.'
  },
  pay_deposit: {
    action: 'pay_deposit',
    name: 'Pay Deposit via Stripe',
    category: 'Vessel Management',
    allowedRoles: ['client', 'admin'],
    description: 'Secure booking with initial deposit via Stripe checkout.'
  },
  send_client_message: {
    action: 'send_client_message',
    name: 'Send Client Message',
    category: 'Vessel Management',
    allowedRoles: ['client', 'admin'],
    description: 'Communicate with marine engineers regarding active vessel job.'
  },

  // Technician Operations
  view_technician_jobs: {
    action: 'view_technician_jobs',
    name: 'View Field Jobs Queue',
    category: 'Technician Diagnostics',
    allowedRoles: ['technician', 'admin'],
    description: 'Access assigned Solent marina job queue, vessel fault notes, and client contact info.'
  },
  log_diagnostic_hours: {
    action: 'log_diagnostic_hours',
    name: 'Log Diagnostic Labor Hours',
    category: 'Technician Diagnostics',
    allowedRoles: ['technician', 'admin'],
    description: 'Start/stop diagnostic stopwatch or log hours at the flat £25/hour rate.'
  },
  log_materials_used: {
    action: 'log_materials_used',
    name: 'Log Hardware Materials Used',
    category: 'Technician Diagnostics',
    allowedRoles: ['technician', 'admin'],
    description: 'Add marine cables, fuses, and connectors used during on-vessel diagnostic work.'
  },
  update_job_status: {
    action: 'update_job_status',
    name: 'Update Job Progress Status',
    category: 'Technician Diagnostics',
    allowedRoles: ['technician', 'admin'],
    description: 'Advance job through scheduled, in_progress, and completed states.'
  },
  upload_fitment_proof: {
    action: 'upload_fitment_proof',
    name: 'Upload Bench & Fitment Proof Photos',
    category: 'Technician Diagnostics',
    allowedRoles: ['technician', 'admin'],
    description: 'Upload wiring harness photos and installation proof to Firebase Storage.'
  },
  send_technician_message: {
    action: 'send_technician_message',
    name: 'Send Technician Job Update',
    category: 'Technician Diagnostics',
    allowedRoles: ['technician', 'admin'],
    description: 'Post technical updates and fault explanations to the vessel job thread.'
  },

  // Postal Fulfillment Operations
  view_postal_queue: {
    action: 'view_postal_queue',
    name: 'View Postal Fulfillment Queue',
    category: 'Postal Dispatch',
    allowedRoles: ['postal', 'admin'],
    description: 'Access orders awaiting packing, cutting, and dispatch from Gosport workshop.'
  },
  pack_postal_consignment: {
    action: 'pack_postal_consignment',
    name: 'Process Consignment Packing',
    category: 'Postal Dispatch',
    allowedRoles: ['postal', 'admin'],
    description: 'Mark orders as packed, measured, cut, and sealed for shipment.'
  },
  update_postal_status: {
    action: 'update_postal_status',
    name: 'Update Postal Order Status',
    category: 'Postal Dispatch',
    allowedRoles: ['postal', 'admin'],
    description: 'Progress orders through received, processing, packed, ready_for_pickup, dispatched, and delivered.'
  },
  assign_tracking_number: {
    action: 'assign_tracking_number',
    name: 'Assign Carrier Tracking',
    category: 'Postal Dispatch',
    allowedRoles: ['postal', 'admin'],
    description: 'Record Royal Mail Tracked or DPD consignment number and carrier name.'
  },
  print_packing_slip: {
    action: 'print_packing_slip',
    name: 'Generate Packing Slips & Labels',
    category: 'Postal Dispatch',
    allowedRoles: ['postal', 'admin'],
    description: 'Print A4 packing slips, pick lists, and waterproof marina delivery labels.'
  },

  // Workshop Master Administration
  access_admin_dashboard: {
    action: 'access_admin_dashboard',
    name: 'Access Master Workshop Dashboard',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Comprehensive administrative control reserved exclusively for Anthony Wrather.'
  },
  edit_catalog_pricing: {
    action: 'edit_catalog_pricing',
    name: 'Modify Hardware Catalog & Prices',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Update product prices, specifications, stock counts, and add new inventory items.'
  },
  create_catalog_snapshot: {
    action: 'create_catalog_snapshot',
    name: 'Create Catalog Save Point',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Capture immutable snapshots of the entire parts inventory.'
  },
  restore_catalog_snapshot: {
    action: 'restore_catalog_snapshot',
    name: 'Restore Catalog Save Point',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Rollback inventory catalog to a previous baseline save point.'
  },
  draft_supplier_purchase_order: {
    action: 'draft_supplier_purchase_order',
    name: 'Draft Supplier Purchase Orders',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Generate POs for marine suppliers (MakeFast, Solent Marine, Victron UK).'
  },
  restock_catalog_inventory: {
    action: 'restock_catalog_inventory',
    name: 'Restock Inventory Count',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Acknowledge restock deliveries and increase catalog quantity counts.'
  },
  dismiss_stock_alert: {
    action: 'dismiss_stock_alert',
    name: 'Manage Zero-Stock Email Alerts',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Review and dismiss automated stock depletion alerts sent to anthonywrather@gmail.com.'
  },
  access_laser_print_studio: {
    action: 'access_laser_print_studio',
    name: 'Laser & Print Marketing Studio',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Export CAD cut files, print Solent marina service flyers and business cards.'
  },
  manage_user_roles: {
    action: 'manage_user_roles',
    name: 'Manage User Roles & Permissions',
    category: 'Master Administration',
    allowedRoles: ['admin'],
    description: 'Assign and modify user roles in Firebase Authentication and Firestore.'
  },

  // Website Platform Administration
  manage_site_settings: {
    action: 'manage_site_settings',
    name: 'Manage Platform & Site Settings',
    category: 'Website Administration',
    allowedRoles: ['site'],
    description: 'Inspect multi-environment configuration, rollout updates, and platform guides.'
  },
  manage_api_keys: {
    action: 'manage_api_keys',
    name: 'Manage Firebase & Stripe API Keys',
    category: 'Website Administration',
    allowedRoles: ['site'],
    description: 'View, set, override, or reset Firebase Web API keys and Stripe publishable keys.'
  },
  switch_environments: {
    action: 'switch_environments',
    name: 'Switch Runtime Environments',
    category: 'Website Administration',
    allowedRoles: ['site'],
    description: 'Switch between Dev, Preview, Staging, and Production deployment simulations.'
  },
  manage_site_roles: {
    action: 'manage_site_roles',
    name: 'Manage Website Administrator Accounts',
    category: 'Website Administration',
    allowedRoles: ['site'],
    description: 'Assign, modify, or manage Website Administrator (site) user accounts.'
  }
};

/**
 * Check if a given user role is authorized to access a route.
 */
export function canAccessRoute(role: UserRole, route: AppRoute): boolean {
  const rule = ROUTE_ACCESS_MATRIX[route];
  if (!rule) return false;
  return rule.allowedRoles.includes(role);
}

/**
 * Check if a given user role is authorized to perform an action.
 */
export function canPerformAction(role: UserRole, action: RbacAction): boolean {
  const rule = ACTION_ACCESS_MATRIX[action];
  if (!rule) return false;
  return rule.allowedRoles.includes(role);
}

/**
 * Get all routes accessible to a user role.
 */
export function getAccessibleRoutes(role: UserRole): AppRoute[] {
  return (Object.keys(ROUTE_ACCESS_MATRIX) as AppRoute[]).filter(route =>
    canAccessRoute(role, route)
  );
}

/**
 * Return the primary default landing route for a given user role.
 */
export function getDefaultRouteForRole(role: UserRole): AppRoute {
  switch (role) {
    case 'technician':
      return 'technician';
    case 'postal':
      return 'postal';
    case 'admin':
      return 'admin';
    case 'client':
      return 'portal';
    case 'site':
    case 'guest':
    default:
      return 'home';
  }
}

/**
 * Detailed route access check result.
 */
export interface RouteAccessCheckResult {
  allowed: boolean;
  route: AppRoute;
  currentRole: UserRole;
  requiredRoles: UserRole[];
  routeName: string;
  category: string;
  reason?: string;
  fallbackRoute: AppRoute;
}

/**
 * Evaluate route access and provide rich diagnostic information.
 */
export function checkRouteAccess(role: UserRole, route: AppRoute): RouteAccessCheckResult {
  const rule = ROUTE_ACCESS_MATRIX[route];
  if (!rule) {
    return {
      allowed: false,
      route,
      currentRole: role,
      requiredRoles: [],
      routeName: route,
      category: 'Unknown',
      reason: `Route "${route}" is unrecognized in the system RBAC registry.`,
      fallbackRoute: 'home'
    };
  }

  const allowed = rule.allowedRoles.includes(role);
  if (allowed) {
    return {
      allowed: true,
      route,
      currentRole: role,
      requiredRoles: rule.allowedRoles,
      routeName: rule.name,
      category: rule.category,
      fallbackRoute: rule.defaultFallback
    };
  }

  const roleLabels = rule.allowedRoles.map(r => r.toUpperCase()).join(', ');
  let roleSpecificExplanation = '';

  if (route === 'admin') {
    roleSpecificExplanation = `The Master Workshop contains sensitive parts pricing, snapshots, and laser export tools reserved strictly for Anthony Wrather (Admin).`;
  } else if (route === 'technician') {
    roleSpecificExplanation = `The Technician Workstation is reserved for Solent Marine Technicians and Admins to log boat diagnostic hours (£25/hr) and materials used.`;
  } else if (route === 'postal') {
    roleSpecificExplanation = `The Postal Dispatch Station is reserved for Workshop Postal Dispatchers and Admins to package tinned cables and dispatch orders.`;
  } else if (route === 'portal') {
    roleSpecificExplanation = `The Vessel Portal requires a registered Boat Owner (Client) or Admin account to view private vessel electrical specifications.`;
  } else {
    roleSpecificExplanation = `This section is restricted to ${roleLabels} accounts.`;
  }

  return {
    allowed: false,
    route,
    currentRole: role,
    requiredRoles: rule.allowedRoles,
    routeName: rule.name,
    category: rule.category,
    reason: `Access Denied: Current role "${role.toUpperCase()}" lacks required permission for "${rule.name}". Requires: ${roleLabels}. ${roleSpecificExplanation}`,
    fallbackRoute: getDefaultRouteForRole(role)
  };
}

/**
 * Detailed action check result.
 */
export interface ActionCheckResult {
  allowed: boolean;
  action: RbacAction;
  actionName: string;
  currentRole: UserRole;
  requiredRoles: UserRole[];
  reason?: string;
}

/**
 * Evaluate action permission with clear denial explanation.
 */
export function checkActionPermission(role: UserRole, action: RbacAction): ActionCheckResult {
  const rule = ACTION_ACCESS_MATRIX[action];
  if (!rule) {
    return {
      allowed: false,
      action,
      actionName: action,
      currentRole: role,
      requiredRoles: [],
      reason: `Action "${action}" is not defined in the RBAC registry.`
    };
  }

  const allowed = rule.allowedRoles.includes(role);
  if (allowed) {
    return {
      allowed: true,
      action,
      actionName: rule.name,
      currentRole: role,
      requiredRoles: rule.allowedRoles
    };
  }

  const roleLabels = rule.allowedRoles.map(r => r.toUpperCase()).join(', ');
  return {
    allowed: false,
    action,
    actionName: rule.name,
    currentRole: role,
    requiredRoles: rule.allowedRoles,
    reason: `Permission Denied: "${rule.name}" cannot be performed by "${role.toUpperCase()}" role. Authorized roles: ${roleLabels}.`
  };
}

/**
 * Centralized Action Enforcement Middleware.
 * Wraps any execution with strict RBAC verification.
 * If permitted: runs callback and returns result.
 * If denied: invokes onDenied handler (if provided) and returns null.
 */
export function enforceAction<T>(
  role: UserRole,
  action: RbacAction,
  callback: () => T,
  onDenied?: (result: ActionCheckResult) => void
): T | null {
  const check = checkActionPermission(role, action);
  if (check.allowed) {
    return callback();
  }

  if (onDenied) {
    onDenied(check);
  } else {
    console.warn(`[RBAC ENFORCEMENT BLOCK] ${check.reason}`);
  }
  return null;
}
