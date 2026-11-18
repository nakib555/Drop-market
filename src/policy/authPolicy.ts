import type {
  AuthPrefill,
  AuthPromptContext,
  CustomerProfile,
  PendingAction,
  ProtectedActionId,
  StorePolicyConfig,
  UserRole,
} from '../types/commerce';

export const PENDING_ACTION_STORAGE_KEY = 'kinto-pending-action';

export const DEFAULT_STORE_POLICY: StorePolicyConfig = {
  wishlistAuthRequired: true,
  checkoutAuthRequired: false,
  reviewsRequireAuth: true,
  reviewsRequireDeliveredPurchase: false,
  pendingActionTtlMs: 15 * 60 * 1000,
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
};

export interface ActionAccessDecision {
  allowed: boolean;
  reason?: 'auth_required' | 'role_required';
  requiredRoles?: UserRole[];
  defaultAuthTab: 'signin' | 'register';
}

export function getProtectedActionPolicyRequirement(
  actionId: ProtectedActionId,
  policy: StorePolicyConfig = DEFAULT_STORE_POLICY
): { requiresAuth: boolean; requiredRoles?: UserRole[]; defaultAuthTab: 'signin' | 'register' } {
  switch (actionId) {
    case 'wishlist:toggle':
    case 'wishlist:view':
      return {
        requiresAuth: policy.wishlistAuthRequired,
        defaultAuthTab: 'signin',
      };
    case 'checkout:proceed':
      return {
        requiresAuth: policy.checkoutAuthRequired,
        defaultAuthTab: 'signin',
      };
    case 'review:submit':
      return {
        requiresAuth: policy.reviewsRequireAuth,
        defaultAuthTab: 'signin',
      };
    case 'order:claim':
      return {
        requiresAuth: true,
        defaultAuthTab: 'register',
      };
    case 'seller:workspace':
      return {
        requiresAuth: true,
        requiredRoles: ['seller', 'admin'],
        defaultAuthTab: 'signin',
      };
    case 'admin:workspace':
      return {
        requiresAuth: true,
        requiredRoles: ['admin'],
        defaultAuthTab: 'signin',
      };
    case 'account:open':
    case 'address:save':
    case 'payment:save':
    case 'order:cancel':
    case 'order:return':
    default:
      return {
        requiresAuth: true,
        defaultAuthTab: 'signin',
      };
  }
}

export function evaluateActionAccess(
  actionId: ProtectedActionId,
  profile: Pick<CustomerProfile, 'isAuthenticated' | 'role'>,
  policy: StorePolicyConfig = DEFAULT_STORE_POLICY
): ActionAccessDecision {
  const requirement = getProtectedActionPolicyRequirement(actionId, policy);

  if (!requirement.requiresAuth) {
    return {
      allowed: true,
      defaultAuthTab: requirement.defaultAuthTab,
    };
  }

  if (!profile.isAuthenticated) {
    return {
      allowed: false,
      reason: 'auth_required',
      requiredRoles: requirement.requiredRoles,
      defaultAuthTab: requirement.defaultAuthTab,
    };
  }

  if (
    requirement.requiredRoles &&
    requirement.requiredRoles.length > 0 &&
    !requirement.requiredRoles.includes(profile.role)
  ) {
    return {
      allowed: false,
      reason: 'role_required',
      requiredRoles: requirement.requiredRoles,
      defaultAuthTab: requirement.defaultAuthTab,
    };
  }

  return {
    allowed: true,
    defaultAuthTab: requirement.defaultAuthTab,
  };
}

export function buildAuthPromptContext(
  actionId: ProtectedActionId,
  options?: {
    itemName?: string;
    preferredTab?: 'signin' | 'register';
    prefill?: AuthPrefill;
  }
): AuthPromptContext {
  const itemName = options?.itemName?.trim();
  const baseMap: Record<
    ProtectedActionId,
    {
      titleKey: string;
      descriptionKey: string;
      benefitKeys: string[];
      defaultTab: 'signin' | 'register';
    }
  > = {
    'wishlist:toggle': {
      titleKey: 'authCtxWishlistTitle',
      descriptionKey: 'authCtxWishlistDesc',
      benefitKeys: [
        'authCtxBenefitWishlistSync',
        'authCtxBenefitRestockAlerts',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'wishlist:view': {
      titleKey: 'authCtxWishlistTitle',
      descriptionKey: 'authCtxWishlistViewDesc',
      benefitKeys: [
        'authCtxBenefitWishlistSync',
        'authCtxBenefitRestockAlerts',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'account:open': {
      titleKey: 'authCtxAccountTitle',
      descriptionKey: 'authCtxAccountDesc',
      benefitKeys: [
        'authCtxBenefitOrderHistory',
        'authCtxBenefitSavedAddresses',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'address:save': {
      titleKey: 'authCtxAddressTitle',
      descriptionKey: 'authCtxAddressDesc',
      benefitKeys: [
        'authCtxBenefitSavedAddresses',
        'authCtxBenefitFasterCheckout',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'payment:save': {
      titleKey: 'authCtxPaymentTitle',
      descriptionKey: 'authCtxPaymentDesc',
      benefitKeys: [
        'authCtxBenefitFasterCheckout',
        'authCtxBenefitOrderHistory',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'review:submit': {
      titleKey: 'authCtxReviewTitle',
      descriptionKey: 'authCtxReviewDesc',
      benefitKeys: [
        'authCtxBenefitVerifiedReview',
        'authCtxBenefitOrderHistory',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'order:cancel': {
      titleKey: 'authCtxOrderManageTitle',
      descriptionKey: 'authCtxOrderCancelDesc',
      benefitKeys: [
        'authCtxBenefitOrderHistory',
        'authCtxBenefitReturnsTracking',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'order:return': {
      titleKey: 'authCtxOrderManageTitle',
      descriptionKey: 'authCtxOrderReturnDesc',
      benefitKeys: [
        'authCtxBenefitReturnsTracking',
        'authCtxBenefitOrderHistory',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'order:claim': {
      titleKey: 'authCtxOrderClaimTitle',
      descriptionKey: 'authCtxOrderClaimDesc',
      benefitKeys: [
        'authCtxBenefitOrderHistory',
        'authCtxBenefitSavedAddresses',
        'authCtxBenefitReturnsTracking',
      ],
      defaultTab: 'register',
    },
    'checkout:proceed': {
      titleKey: 'authCtxCheckoutTitle',
      descriptionKey: 'authCtxCheckoutDesc',
      benefitKeys: [
        'authCtxBenefitFasterCheckout',
        'authCtxBenefitSavedAddresses',
        'authCtxBenefitKeepPlace',
      ],
      defaultTab: 'signin',
    },
    'seller:workspace': {
      titleKey: 'authCtxSellerTitle',
      descriptionKey: 'authCtxSellerDesc',
      benefitKeys: ['authCtxBenefitSellerTools', 'authCtxBenefitKeepPlace'],
      defaultTab: 'signin',
    },
    'admin:workspace': {
      titleKey: 'authCtxAdminTitle',
      descriptionKey: 'authCtxAdminDesc',
      benefitKeys: ['authCtxBenefitAdminTools', 'authCtxBenefitKeepPlace'],
      defaultTab: 'signin',
    },
  };

  const entry = baseMap[actionId];
  return {
    actionId,
    titleKey: entry.titleKey,
    descriptionKey: entry.descriptionKey,
    benefitKeys: entry.benefitKeys,
    defaultTab: options?.preferredTab || entry.defaultTab,
    itemName,
    prefill: options?.prefill,
  };
}

export function isPendingActionExpired(
  action: PendingAction | null | undefined,
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_STORE_POLICY.pendingActionTtlMs
): boolean {
  if (!action) return true;
  if (typeof action.expiresAt === 'number' && Number.isFinite(action.expiresAt)) {
    return nowMs > action.expiresAt;
  }
  if (typeof action.createdAt === 'number' && Number.isFinite(action.createdAt)) {
    return nowMs - action.createdAt > ttlMs;
  }
  return true;
}

export function serializePendingAction(
  action: Omit<PendingAction, 'expiresAt'> & { expiresAt?: number },
  ttlMs: number = DEFAULT_STORE_POLICY.pendingActionTtlMs
): string {
  const createdAt = typeof action.createdAt === 'number' ? action.createdAt : Date.now();
  const payload: PendingAction = {
    ...action,
    createdAt,
    expiresAt: action.expiresAt ?? createdAt + ttlMs,
  };
  return JSON.stringify(payload);
}

export function parsePendingAction(
  raw: string | null | undefined,
  nowMs: number = Date.now(),
  ttlMs: number = DEFAULT_STORE_POLICY.pendingActionTtlMs
): PendingAction | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingAction>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.actionId !== 'string') {
      return null;
    }
    const candidate = parsed as PendingAction;
    if (isPendingActionExpired(candidate, nowMs, ttlMs)) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}
