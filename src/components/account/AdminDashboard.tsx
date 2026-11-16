import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  Database,
  FileText,
  FolderPlus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import {
  createCategoryNodeApi,
  deleteCategoryNodeApi,
  fetchAdminDashboardApi,
  fetchAdminReadinessApi,
  processAdminRefundApi,
  updateAdminCurrencyApi,
  updateAdminPlatformSettingsApi,
  updateAdminPromotionsApi,
  updateAdminShippingRulesApi,
  updateAdminUserApi,
  updateCategoryNodeApi,
  updateOrderStatusApi,
  updateSellerProductApi,
  updateSellerStatusApi,
} from '../../services/api';
import {
  AdminDashboardData,
  AdminSystemReadiness,
  CategoryNode,
  CurrencyCode,
  LanguageCode,
  OrderStage,
  PlatformSettingsState,
  ShippingZoneRule,
  UserRole,
} from '../../types/commerce';
import { formatCurrency, formatDirectCurrency } from '../../utils/format';
import { t } from '../../utils/i18n';
import { IMAGE_PRESET_OPTIONS, resolveImagePreset } from '../../utils/imagePresets';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/FormFields';
import { ResilientImage, SkeletonLoader } from '../ui/Primitives';

const ORDER_STAGES: OrderStage[] = [
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const ICON_OPTIONS = [
  'Cpu',
  'Shirt',
  'Sofa',
  'Droplets',
  'Coffee',
  'Compass',
  'BookOpen',
  'Wrench',
  'Blocks',
  'HeartPulse',
  'Tag',
];

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'sellers'
  | 'inventory'
  | 'payments'
  | 'refunds'
  | 'promotions'
  | 'reports'
  | 'content'
  | 'settings';

export const AdminDashboard: React.FC = () => {
  const { language, currency, showToast, refreshOrders, refreshStorefrontSync, navigate } = useStore();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Hierarchical Category Node Creation State
  const [catParentId, setCatParentId] = useState<string>('');
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [catSub, setCatSub] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catPreset, setCatPreset] = useState('clock');
  const [catCollections, setCatCollections] = useState('featured');

  // FX Currency Form State
  const [fxRateInput, setFxRateInput] = useState('120.5');
  const [fxDefaultCurrency, setFxDefaultCurrency] = useState<CurrencyCode>('BDT');
  const [fxSource, setFxSource] = useState('');
  const [fxFreq, setFxFreq] = useState('30');

  // Shipping Rules State
  const [selectedZoneId, setSelectedZoneId] = useState<string>('dhaka_metro');
  const [zoneDraft, setZoneDraft] = useState<ShippingZoneRule | null>(null);
  const [restrictedKeywordsInput, setRestrictedKeywordsInput] = useState('');

  // Platform Settings & System Readiness State
  const [platformDraft, setPlatformDraft] = useState<PlatformSettingsState | null>(null);
  const [readiness, setReadiness] = useState<AdminSystemReadiness | null>(null);

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, readinessRes] = await Promise.all([
        fetchAdminDashboardApi(),
        fetchAdminReadinessApi().catch(() => null),
      ]);
      setData(res);
      setReadiness(readinessRes);
      setFxRateInput(String(res.currencyConfig.rates.BDT));
      setFxDefaultCurrency(res.currencyConfig.defaultCurrency);
      setFxSource(res.currencyConfig.source);
      setFxFreq(String(res.currencyConfig.updateFrequencyMinutes));
      setRestrictedKeywordsInput(res.shippingConfig.restrictedAreaKeywords.join(', '));
      setPlatformDraft(res.platformSettings);
      const initialZone =
        res.shippingConfig.zones.find((z) => z.zoneId === selectedZoneId) ||
        res.shippingConfig.zones[0];
      if (initialZone) {
        setSelectedZoneId(initialZone.zoneId);
        setZoneDraft(initialZone);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Admin Console API.');
    } finally {
      setLoading(false);
    }
  }, [selectedZoneId]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const orderedCategoryTree = useMemo(() => {
    if (!data) return [];
    const nodes = [...data.categories];
    const childrenMap = new Map<string | null, CategoryNode[]>();
    for (const node of nodes) {
      const pid = node.parentId || null;
      const list = childrenMap.get(pid) || [];
      list.push(node);
      childrenMap.set(pid, list);
    }
    for (const list of childrenMap.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    const flattened: CategoryNode[] = [];
    const visit = (parentId: string | null) => {
      const children = childrenMap.get(parentId) || [];
      for (const child of children) {
        flattened.push(child);
        visit(child.id);
      }
    };
    visit(null);
    return flattened;
  }, [data]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.orders;
    return data.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        (o.transactionRef && o.transactionRef.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const filteredInventory = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.inventory;
    return data.inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const refundOrders = useMemo(
    () =>
      (data?.orders || []).filter(
        (o) =>
          o.currentStage === 'Return Requested' ||
          o.paymentStatus === 'cancelled' ||
          o.currentStage === 'Cancelled'
      ),
    [data]
  );

  const handleOrderStageChange = async (orderId: string, nextStage: OrderStage) => {
    setBusyKey(orderId);
    try {
      await updateOrderStatusApi(orderId, nextStage, 'Status updated by Platform Admin');
      await Promise.all([loadAdmin(), refreshOrders()]);
      showToast(`Order #${orderId} updated`, `Fulfillment moved to ${nextStage}.`, 'success');
    } catch (err) {
      showToast('Failed to update order', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSellerStatus = async (
    appId: string,
    status: 'approved' | 'pending' | 'suspended'
  ) => {
    setBusyKey(appId);
    try {
      await updateSellerStatusApi(appId, status);
      await loadAdmin();
      showToast('Seller status updated', `Studio is now ${status}.`, 'success');
    } catch (err) {
      showToast('Update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleUserUpdate = async (
    userId: string,
    updates: { role?: UserRole; status?: 'active' | 'pending' | 'suspended' }
  ) => {
    setBusyKey(userId);
    try {
      await updateAdminUserApi(userId, updates);
      await loadAdmin();
      showToast('Account privileges updated', undefined, 'success');
    } catch (err) {
      showToast('Update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleInventoryAdjust = async (id: string, stockCount: number) => {
    setBusyKey(id);
    try {
      await updateSellerProductApi(id, { stockCount });
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast('Stock adjusted', `Updated SKU to ${stockCount} units.`, 'success');
    } catch (err) {
      showToast('Stock update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddCategoryNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setBusyKey('add-cat');
    try {
      const collections = catCollections
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const res = await createCategoryNodeApi({
        name: catName,
        shortName: catShort || catName,
        parentId: catParentId || null,
        subcategoryName: catParentId ? undefined : catSub || undefined,
        description: catDesc,
        iconName: catIcon,
        imagePresetKey: catPreset,
        collectionIds: collections.length > 0 ? collections : ['featured'],
      });
      setCatName('');
      setCatShort('');
      setCatSub('');
      setCatDesc('');
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast(
        'Category node published',
        `${res.category.name} is now active in the Mega Menu & Shop filters.`,
        'success'
      );
    } catch (err) {
      showToast('Failed to create category', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleCategoryActive = async (node: CategoryNode) => {
    setBusyKey(node.id);
    try {
      await updateCategoryNodeApi(node.id, { isActive: !node.isActive });
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast(node.isActive ? 'Category deactivated' : 'Category activated', node.name, 'info');
    } catch (err) {
      showToast('Update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteCategoryNode = async (node: CategoryNode) => {
    setBusyKey(node.id);
    try {
      const res = await deleteCategoryNodeApi(node.id);
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast('Category removed', `Removed ${res.removedCount} node(s) from tree.`, 'info');
    } catch (err) {
      showToast('Delete failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(fxRateInput);
    const freq = Number(fxFreq);
    if (!Number.isFinite(rate) || rate < 50 || rate > 500) {
      showToast('Invalid FX rate', 'Enter a valid BDT rate per 1 USD (50–500).', 'error');
      return;
    }
    setBusyKey('fx-save');
    try {
      await updateAdminCurrencyApi({
        bdtRate: rate,
        defaultCurrency: fxDefaultCurrency,
        source: fxSource.trim(),
        updateFrequencyMinutes: Number.isFinite(freq) && freq >= 1 ? freq : 30,
      });
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast('Currency & FX rules saved', `1 USD = ৳${rate.toFixed(2)} synced.`, 'success');
    } catch (err) {
      showToast('FX update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveShippingZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneDraft) return;
    setBusyKey('ship-save');
    try {
      const kws = restrictedKeywordsInput
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      await updateAdminShippingRulesApi({
        zoneId: zoneDraft.zoneId,
        updates: zoneDraft,
        restrictedAreaKeywords: kws,
      });
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast('Shipping rules updated', `${zoneDraft.label} saved.`, 'success');
    } catch (err) {
      showToast('Shipping save failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRefundDecision = async (
    orderId: string,
    action: 'approve_refund' | 'decline_return'
  ) => {
    setBusyKey(orderId);
    try {
      await processAdminRefundApi(orderId, action);
      await Promise.all([loadAdmin(), refreshOrders()]);
      showToast(
        action === 'approve_refund' ? 'Refund approved' : 'Return declined',
        `Order #${orderId} updated.`,
        'success'
      );
    } catch (err) {
      showToast('Refund action failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleTogglePromo = async (code: string, active: boolean) => {
    setBusyKey(code);
    try {
      await updateAdminPromotionsApi({ code, active: !active });
      await loadAdmin();
      showToast(`Promo ${code}`, !active ? 'Activated' : 'Paused', 'info');
    } catch (err) {
      showToast('Promo update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformDraft) return;
    setBusyKey('platform-save');
    try {
      await updateAdminPlatformSettingsApi(platformDraft);
      await loadAdmin();
      showToast('Platform settings saved', undefined, 'success');
    } catch (err) {
      showToast('Settings save failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-24 w-full" />
          ))}
        </div>
        <SkeletonLoader className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3">
        <p className="text-sm font-medium text-[var(--ks-error)]">
          {error || 'Admin console unavailable'}
        </p>
        <Button variant="outline" size="sm" onClick={loadAdmin}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'overview', label: 'Business Overview' },
    { id: 'products', label: `Products (${data.inventory.length})` },
    { id: 'categories', label: `Categories (${data.categories.length})` },
    { id: 'orders', label: `Orders (${data.orders.length})` },
    { id: 'customers', label: `Customers (${data.users.length})` },
    { id: 'sellers', label: `Sellers (${data.sellerApplications.length})` },
    { id: 'inventory', label: 'Inventory' },
    { id: 'payments', label: 'Payments & FX' },
    { id: 'refunds', label: `Refunds (${data.kpis.openReturnsCount})` },
    { id: 'promotions', label: 'Promotions' },
    { id: 'reports', label: 'Reports' },
    { id: 'content', label: 'Content' },
    { id: 'settings', label: 'Platform Settings' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--ks-border)]">
        <div>
          <p className="text-xs leading-snug uppercase tracking-wider text-[var(--ks-accent)] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Platform Admin Console
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">
            Marketplace Operations &amp; Governance
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadAdmin}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Metrics</span>
        </Button>
      </div>

      {/* 13-Section Console Tab Strip (Mobile Select + Desktop Tabs) */}
      <div className="md:hidden">
        <Select
          label={t(language, 'workspaceSectionLabel')}
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as AdminTab)}
          options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
        />
      </div>
      <div className="hidden md:flex items-center gap-5 border-b border-[var(--ks-border)] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                active
                  ? 'text-[var(--ks-text-primary)]'
                  : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
              }`}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="admin-console-tab"
                  transition={STUDIO_TRANSITION.springTab}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--ks-text-primary)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 1. Business Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Platform GMV</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {formatCurrency(data.kpis.totalGmv, currency)}
              </p>
              <p className="text-[11px] font-mono-num text-[var(--ks-text-secondary)] mt-1">
                {data.kpis.totalOrders} total orders
              </p>
            </div>
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Verified Sellers</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {data.kpis.activeSellers}
              </p>
              <p className="text-[11px] text-[var(--ks-warning)] mt-1 font-mono-num">
                {data.kpis.pendingSellers} pending approval
              </p>
            </div>
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Registered Accounts</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {data.kpis.registeredUsers}
              </p>
              <p className="text-[11px] text-[var(--ks-text-secondary)] mt-1">
                Open Returns: {data.kpis.openReturnsCount}
              </p>
            </div>
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Active Departments / Nodes</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {data.kpis.activeCategories} / {data.categories.length}
              </p>
              <p className="text-[11px] text-[var(--ks-success)] mt-1 font-mono-num">
                1 USD = ৳{data.currencyConfig.rates.BDT}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3">
            <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
              10-Department GMV Distribution
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {(() => {
                const maxShare = Math.max(...data.departmentShare.map((d) => d.sharePercent), 1);
                return data.departmentShare.map((dept) => (
                  <div key={dept.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate pe-2">{dept.label}</span>
                      <span className="font-mono-num text-[var(--ks-text-secondary)] shrink-0">
                        {formatCurrency(dept.gmv, currency)} ({dept.sharePercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--ks-border)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--ks-accent)]"
                        style={{
                          width: `${Math.min(100, Math.round((dept.sharePercent / maxShare) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 2 & 7. Products & Inventory */}
      {(activeTab === 'products' || activeTab === 'inventory') && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[var(--ks-text-muted)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter products by title, SKU, or maker..."
              className="w-full min-h-[44px] sm:h-10 ps-9 pe-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)]"
            />
          </div>

          {/* Mobile Stacked Inventory Cards */}
          <div className="md:hidden space-y-3">
            {filteredInventory.slice(0, 25).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ResilientImage
                      src={resolveImagePreset(item.imagePresetKey, item.category)}
                      alt={item.name}
                      className="w-11 h-9 rounded-sm object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-[var(--ks-text-muted)] truncate">
                        {item.brand} · {item.categoryLabel}
                      </p>
                      <p className="text-[11px] font-mono-num text-[var(--ks-text-secondary)]">
                        {item.sku}
                      </p>
                    </div>
                  </div>
                  <div className="text-end shrink-0 font-mono-num">
                    <p className="text-sm font-semibold">{formatCurrency(item.price, currency)}</p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        item.stockCount <= 0
                          ? 'text-[var(--ks-error)] font-semibold'
                          : item.stockCount <= 8
                          ? 'text-[var(--ks-warning)] font-semibold'
                          : 'text-[var(--ks-text-secondary)]'
                      }`}
                    >
                      Qty: {item.stockCount}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--ks-border)] flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyKey === item.id}
                    onClick={() => handleInventoryAdjust(item.id, item.stockCount + 10)}
                  >
                    +10 Stock
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyKey === item.id || item.stockCount === 0}
                    onClick={() => handleInventoryAdjust(item.id, 0)}
                  >
                    Pause
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">SKU</th>
                  <th className="py-2.5 px-3 font-medium text-end">Price</th>
                  <th className="py-2.5 px-3 font-medium text-end">Stock</th>
                  <th className="py-2.5 px-3 font-medium text-end">Quick Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)] [&_td]:align-middle">
                {filteredInventory.slice(0, 25).map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--ks-bg)]/70">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <ResilientImage
                          src={resolveImagePreset(item.imagePresetKey, item.category)}
                          alt={item.name}
                          className="w-9 h-7 rounded-sm object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[220px]">{item.name}</p>
                          <p className="text-[11px] text-[var(--ks-text-muted)]">
                            {item.brand} · {item.categoryLabel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono-num whitespace-nowrap">{item.sku}</td>
                    <td className="py-2.5 px-3 font-mono-num tabular-nums text-end whitespace-nowrap">
                      {formatCurrency(item.price, currency)}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num tabular-nums text-end whitespace-nowrap">
                      <span
                        className={
                          item.stockCount <= 0
                            ? 'text-[var(--ks-error)] font-semibold'
                            : item.stockCount <= 8
                            ? 'text-[var(--ks-warning)] font-semibold'
                            : ''
                        }
                      >
                        {item.stockCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-end whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={busyKey === item.id}
                          onClick={() => handleInventoryAdjust(item.id, item.stockCount + 10)}
                        >
                          +10 Stock
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={busyKey === item.id || item.stockCount === 0}
                          onClick={() => handleInventoryAdjust(item.id, 0)}
                        >
                          Pause
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Hierarchical Category Tree CRUD */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)] max-h-[580px] overflow-y-auto">
            {orderedCategoryTree.map((node) => (
              <div
                key={node.id}
                className="p-3.5 flex items-start sm:items-center justify-between gap-3 hover:bg-[var(--ks-bg)]/70"
                style={{ paddingInlineStart: `${14 + node.depth * 18}px` }}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-[10px] font-mono-num text-[var(--ks-text-muted)] shrink-0">
                      L{node.depth}
                    </span>
                    <p
                      className={`text-sm truncate ${
                        node.depth === 0 ? 'font-semibold' : 'font-medium'
                      } ${!node.isActive ? 'line-through text-[var(--ks-text-muted)]' : ''}`}
                    >
                      {node.name}
                    </p>
                    <span className="text-[11px] font-mono-num text-[var(--ks-text-muted)] truncate">
                      /{node.slug}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ks-text-secondary)] mt-0.5 truncate">
                    Order #{node.sortOrder} · {node.iconName} ·{' '}
                    {node.collectionIds.join(', ') || 'featured'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyKey === node.id}
                    onClick={() => handleToggleCategoryActive(node)}
                    className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                      node.isActive
                        ? 'border-[var(--ks-success)]/40 text-[var(--ks-success)]'
                        : 'border-[var(--ks-border)] text-[var(--ks-text-muted)]'
                    }`}
                  >
                    {node.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryNode(node)}
                    disabled={busyKey === node.id}
                    aria-label={`Delete ${node.name}`}
                    className="p-1.5 text-[var(--ks-error)] hover:opacity-80 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddCategoryNode}
            className="lg:col-span-5 p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
              <h3 className="text-base font-medium leading-snug">
                Create Department or Subcategory
              </h3>
            </div>

            <Select
              label="Parent Category"
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
              options={[
                { value: '', label: 'Top-Level Department (Depth 0)' },
                ...orderedCategoryTree.map((n) => ({
                  value: n.id,
                  label: `${'— '.repeat(n.depth)}${n.name}`,
                })),
              ]}
            />

            <Input
              label="Category Name"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g., Smart Kitchen Appliances"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nav Short Name"
                value={catShort}
                onChange={(e) => setCatShort(e.target.value)}
                placeholder="Smart Kitchen"
              />
              {!catParentId && (
                <Input
                  label="Initial Child Category"
                  value={catSub}
                  onChange={(e) => setCatSub(e.target.value)}
                  placeholder="Espresso Machines"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Icon"
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                options={ICON_OPTIONS.map((ic) => ({ value: ic, label: ic }))}
              />
              <Select
                label="Banner Image Preset"
                value={catPreset}
                onChange={(e) => setCatPreset(e.target.value)}
                options={IMAGE_PRESET_OPTIONS.map((opt) => ({
                  value: opt.key,
                  label: opt.label,
                }))}
              />
            </div>
            <Input
              label="Collection Associations (CSV)"
              value={catCollections}
              onChange={(e) => setCatCollections(e.target.value)}
              placeholder="featured, trending, new-arrivals"
            />
            <Input
              label="SEO Description"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Curated selection with category-aware attribute facets."
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={busyKey === 'add-cat'}
            >
              Publish Category Node
            </Button>
          </form>
        </div>
      )}

      {/* 4. Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[var(--ks-text-muted)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter orders by ID, customer, email, or ref..."
              className="w-full min-h-[44px] sm:h-10 ps-9 pe-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)]"
            />
          </div>

          {/* Mobile Stacked Order Cards */}
          <div className="md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="p-6 text-center rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs text-[var(--ks-text-muted)]">
                No orders match your filter.
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                        className="text-sm font-mono-num font-semibold hover:underline cursor-pointer"
                      >
                        #{ord.id}
                      </button>
                      <p className="text-xs font-medium mt-0.5">{ord.customerName}</p>
                      <p className="text-[11px] text-[var(--ks-text-muted)] truncate">
                        {ord.email}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-mono-num font-semibold">
                        {ord.currencySnapshot
                          ? formatDirectCurrency(
                              ord.currencySnapshot.chargedTotal,
                              ord.currencySnapshot.transactionCurrency
                            )
                          : formatCurrency(ord.total, currency)}
                      </p>
                      <p className="text-[10px] font-mono-num uppercase text-[var(--ks-accent)] mt-0.5">
                        {ord.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--ks-text-secondary)]">
                    {ord.paymentLabel}
                    {ord.transactionRef ? ` · ${ord.transactionRef}` : ''}
                  </p>

                  <label className="block space-y-1">
                    <span className="text-[11px] text-[var(--ks-text-muted)] block">
                      Fulfillment Stage
                    </span>
                    <select
                      aria-label={`Order ${ord.id} stage`}
                      disabled={busyKey === ord.id}
                      value={ord.currentStage}
                      onChange={(e) =>
                        handleOrderStageChange(ord.id, e.target.value as OrderStage)
                      }
                      className="w-full min-h-[44px] px-3 text-base rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] bg-[var(--ks-bg)]"
                    >
                      {ORDER_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      {ord.currentStage === 'Return Requested' && (
                        <option value="Return Requested">Return Requested</option>
                      )}
                    </select>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Order</th>
                  <th className="py-2.5 px-3 font-medium">Customer</th>
                  <th className="py-2.5 px-3 font-medium">Payment &amp; Status</th>
                  <th className="py-2.5 px-3 font-medium text-end">Settled Amount</th>
                  <th className="py-2.5 px-3 font-medium">Fulfillment Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)] [&_td]:align-middle">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-3 text-center text-xs text-[var(--ks-text-muted)]">
                      No orders match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[var(--ks-bg)]/70">
                      <td className="py-2.5 px-3 font-mono-num font-semibold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                          className="hover:underline cursor-pointer"
                        >
                          #{ord.id}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium">{ord.customerName}</p>
                        <p className="text-[11px] text-[var(--ks-text-muted)]">{ord.email}</p>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--ks-text-secondary)] whitespace-nowrap">
                        <p>{ord.paymentLabel}</p>
                        <p className="text-[10px] font-mono-num uppercase text-[var(--ks-accent)]">
                          {ord.paymentStatus}
                          {ord.transactionRef ? ` · ${ord.transactionRef}` : ''}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 font-mono-num tabular-nums text-end whitespace-nowrap">
                        {ord.currencySnapshot
                          ? formatDirectCurrency(
                              ord.currencySnapshot.chargedTotal,
                              ord.currencySnapshot.transactionCurrency
                            )
                          : formatCurrency(ord.total, currency)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          aria-label={`Order ${ord.id} stage`}
                          disabled={busyKey === ord.id}
                          value={ord.currentStage}
                          onChange={(e) =>
                            handleOrderStageChange(ord.id, e.target.value as OrderStage)
                          }
                          className="min-h-[38px] px-2 text-sm sm:text-xs rounded border border-[var(--ks-border)] bg-[var(--ks-surface)]"
                        >
                          {ORDER_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                          {ord.currentStage === 'Return Requested' && (
                            <option value="Return Requested">Return Requested</option>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Customers / Accounts Directory */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Users className="w-4 h-4 text-[var(--ks-text-muted)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts by name, email, or role..."
              className="w-full min-h-[44px] sm:h-10 ps-9 pe-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)]"
            />
          </div>

          {/* Mobile Stacked Customer Cards */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((usr) => (
              <div
                key={usr.id}
                className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ks-text-primary)]">{usr.fullName}</p>
                  <p className="text-xs text-[var(--ks-text-muted)] truncate">{usr.email}</p>
                  <p className="text-[11px] text-[var(--ks-text-secondary)] mt-0.5">{usr.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--ks-border)]">
                  <label className="space-y-1">
                    <span className="text-[11px] text-[var(--ks-text-muted)] block">Role</span>
                    <select
                      aria-label={`Role for ${usr.fullName}`}
                      disabled={busyKey === usr.id}
                      value={usr.role}
                      onChange={(e) =>
                        handleUserUpdate(usr.id, { role: e.target.value as UserRole })
                      }
                      className="w-full min-h-[44px] px-2.5 text-base rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] bg-[var(--ks-bg)]"
                    >
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-[var(--ks-text-muted)] block">Status</span>
                    <select
                      aria-label={`Status for ${usr.fullName}`}
                      disabled={busyKey === usr.id}
                      value={usr.status}
                      onChange={(e) =>
                        handleUserUpdate(usr.id, {
                          status: e.target.value as 'active' | 'pending' | 'suspended',
                        })
                      }
                      className="w-full min-h-[44px] px-2.5 text-base rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] bg-[var(--ks-bg)]"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Account</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)] [&_td]:align-middle">
                {filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[var(--ks-bg)]/70">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-[var(--ks-text-primary)]">{usr.fullName}</p>
                      <p className="text-[11px] text-[var(--ks-text-muted)]">{usr.email}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--ks-text-secondary)]">{usr.location}</td>
                    <td className="py-2.5 px-3">
                      <select
                        aria-label={`Role for ${usr.fullName}`}
                        disabled={busyKey === usr.id}
                        value={usr.role}
                        onChange={(e) =>
                          handleUserUpdate(usr.id, { role: e.target.value as UserRole })
                        }
                        className="min-h-[38px] px-2 text-sm sm:text-xs rounded border border-[var(--ks-border)] bg-[var(--ks-surface)]"
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        aria-label={`Status for ${usr.fullName}`}
                        disabled={busyKey === usr.id}
                        value={usr.status}
                        onChange={(e) =>
                          handleUserUpdate(usr.id, {
                            status: e.target.value as 'active' | 'pending' | 'suspended',
                          })
                        }
                        className="min-h-[38px] px-2 text-sm sm:text-xs rounded border border-[var(--ks-border)] bg-[var(--ks-surface)]"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Sellers */}
      {activeTab === 'sellers' && (
        <>
          {/* Mobile Stacked Seller Cards */}
          <div className="md:hidden space-y-3">
            {data.sellerApplications.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--ks-text-primary)]">
                      {app.studioName}
                    </p>
                    <p className="text-[11px] text-[var(--ks-text-muted)]">
                      {app.ownerName} · {app.origin}
                    </p>
                    <p className="text-[11px] text-[var(--ks-text-secondary)] mt-0.5">
                      {app.department}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-mono-num font-semibold">
                      {formatCurrency(app.monthlyRevenue, currency)}
                    </p>
                    <p
                      className={`text-[11px] font-medium capitalize mt-0.5 ${
                        app.status === 'approved'
                          ? 'text-[var(--ks-success)]'
                          : app.status === 'pending'
                          ? 'text-[var(--ks-warning)]'
                          : 'text-[var(--ks-error)]'
                      }`}
                    >
                      {app.status}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--ks-border)] flex items-center justify-end gap-2">
                  {app.status !== 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busyKey === app.id}
                      onClick={() => handleSellerStatus(app.id, 'approved')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </Button>
                  )}
                  {app.status !== 'suspended' && (
                    <button
                      type="button"
                      disabled={busyKey === app.id}
                      onClick={() => handleSellerStatus(app.id, 'suspended')}
                      className="min-h-[40px] px-3 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-error)] hover:bg-[var(--ks-bg)] cursor-pointer"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Studio</th>
                  <th className="py-2.5 px-3 font-medium">Department</th>
                  <th className="py-2.5 px-3 font-medium text-end">Monthly Rev</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)] [&_td]:align-middle">
                {data.sellerApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--ks-bg)]/70">
                    <td className="py-3 px-3">
                      <p className="font-medium text-[var(--ks-text-primary)]">{app.studioName}</p>
                      <p className="text-[11px] text-[var(--ks-text-muted)]">
                        {app.ownerName} · {app.origin}
                      </p>
                    </td>
                    <td className="py-3 px-3">{app.department}</td>
                    <td className="py-3 px-3 font-mono-num tabular-nums text-end whitespace-nowrap">
                      {formatCurrency(app.monthlyRevenue, currency)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-medium capitalize ${
                          app.status === 'approved'
                            ? 'text-[var(--ks-success)]'
                            : app.status === 'pending'
                            ? 'text-[var(--ks-warning)]'
                            : 'text-[var(--ks-error)]'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        {app.status !== 'approved' && (
                          <Button
                            variant="primary"
                            size="xs"
                            disabled={busyKey === app.id}
                            onClick={() => handleSellerStatus(app.id, 'approved')}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </Button>
                        )}
                        {app.status !== 'suspended' && (
                          <button
                            type="button"
                            disabled={busyKey === app.id}
                            onClick={() => handleSellerStatus(app.id, 'suspended')}
                            className="min-h-[32px] text-xs text-[var(--ks-error)] hover:underline cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 8. Payments & FX Configuration */}
      {activeTab === 'payments' && (
        <form
          onSubmit={handleSaveCurrency}
          className="max-w-2xl p-6 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-5"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
            <h3 className="text-base font-medium leading-snug">
              Payment Settlement &amp; BDT / USD Exchange Rate
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="BDT per 1 USD Rate"
              type="number"
              step="0.01"
              required
              value={fxRateInput}
              onChange={(e) => setFxRateInput(e.target.value)}
              helperText="Base catalog prices in USD; integer Taka (ceil) at checkout."
            />
            <Select
              label="Default Storefront Currency"
              value={fxDefaultCurrency}
              onChange={(e) => setFxDefaultCurrency(e.target.value as CurrencyCode)}
              options={[
                { value: 'BDT', label: 'BDT (৳) — Bangladesh Default' },
                { value: 'USD', label: 'USD ($) — International' },
              ]}
            />
            <Input
              label="Exchange-Rate Source"
              value={fxSource}
              onChange={(e) => setFxSource(e.target.value)}
            />
            <Input
              label="Update Frequency (Minutes)"
              type="number"
              min={1}
              value={fxFreq}
              onChange={(e) => setFxFreq(e.target.value)}
            />
          </div>
          <p className="text-xs text-[var(--ks-text-secondary)] font-mono-num">
            Last FX Snapshot Timestamp: {data.currencyConfig.updatedAt}
          </p>
          <Button type="submit" variant="primary" size="md" disabled={busyKey === 'fx-save'}>
            Save &amp; Sync FX Rules
          </Button>
        </form>
      )}

      {/* 9. Refunds & Return Disputes */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-[var(--ks-text-secondary)]">
            <RotateCcw className="w-4 h-4 text-[var(--ks-accent)]" />
            <span>
              Moderate buyer refund requests, return disputes, and gateway reversals.
            </span>
          </div>
          {refundOrders.length === 0 ? (
            <div className="p-8 text-center rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-xs text-[var(--ks-text-muted)]">
              No return or refund requests require action.
            </div>
          ) : (
            <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)]">
              {refundOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-mono-num font-semibold">
                      Order #{ord.id} · {ord.currentStage}
                    </p>
                    <p className="text-xs text-[var(--ks-text-secondary)]">
                      {ord.customerName} ({ord.email}) · Payment: {ord.paymentStatus.toUpperCase()} ·{' '}
                      {formatCurrency(ord.total, currency)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ord.currentStage === 'Return Requested' && (
                      <>
                        <Button
                          variant="primary"
                          size="xs"
                          disabled={busyKey === ord.id}
                          onClick={() => handleRefundDecision(ord.id, 'approve_refund')}
                        >
                          Approve Refund
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={busyKey === ord.id}
                          onClick={() => handleRefundDecision(ord.id, 'decline_return')}
                        >
                          Decline Return
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                    >
                      Inspect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 10. Promotions */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-[var(--ks-text-secondary)]">
            <Tag className="w-4 h-4 text-[var(--ks-accent)]" />
            <span>Active checkout promotional codes and qualifying thresholds.</span>
          </div>
          <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)]">
            {data.promotions.map((promo) => (
              <div
                key={promo.code}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-mono-num font-semibold">
                    {promo.code}{' '}
                    <span
                      className={`text-[11px] font-sans ms-2 ${
                        promo.active ? 'text-[var(--ks-success)]' : 'text-[var(--ks-text-muted)]'
                      }`}
                    >
                      {promo.active ? 'Active' : 'Paused'}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--ks-text-secondary)]">
                    {promo.description} · Min subtotal:{' '}
                    {formatCurrency(promo.minSubtotal, currency)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={busyKey === promo.code}
                  onClick={() => handleTogglePromo(promo.code, promo.active)}
                >
                  {promo.active ? 'Pause Promo' : 'Activate Promo'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ks-text-secondary)]">
            Department share and operational volume across {data.kpis.activeCategories} active departments.
          </p>
          <div className="overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Department</th>
                  <th className="py-2.5 px-3 font-medium text-end">Estimated GMV</th>
                  <th className="py-2.5 px-3 font-medium text-end">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)]">
                {data.departmentShare.map((d) => (
                  <tr key={d.category}>
                    <td className="py-2.5 px-3 font-medium">{d.label}</td>
                    <td className="py-2.5 px-3 font-mono-num tabular-nums text-end">
                      {formatCurrency(d.gmv, currency)}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num tabular-nums text-end">
                      {d.sharePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                Customer Support Inquiries ({data.supportInquiries?.length ?? 0})
              </h3>
              <span className="text-xs text-[var(--ks-text-secondary)]">
                Newsletter subscribers: {data.newsletterSubscribersCount ?? 0}
              </span>
            </div>
            {data.supportInquiries && data.supportInquiries.length > 0 ? (
              <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)]">
                {data.supportInquiries.slice(0, 10).map((inq) => (
                  <div key={inq.id} className="p-3.5 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-num font-semibold text-[var(--ks-accent)]">
                        {inq.ticketRef} · {inq.topic}
                      </span>
                      <span className="text-[var(--ks-text-muted)]">
                        {inq.name} ({inq.email})
                      </span>
                    </div>
                    <p className="text-[var(--ks-text-secondary)] leading-relaxed">{inq.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--ks-text-muted)]">
                No customer support inquiries submitted during the active server session.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 12. Content Governance */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {[
            {
              title: 'Legal & Governance Hub (17 Policies)',
              desc: 'Bangladesh statutory policies, consumer protection, seller agreement, and privacy standards.',
              action: () => navigate({ name: 'legal' }),
            },
            {
              title: 'Studio Journal & Editorial',
              desc: 'Manage department monographs, product research essays, and material stories.',
              action: () => navigate({ name: 'journal' }),
            },
            {
              title: 'Help & Frequently Asked Questions',
              desc: 'Public guidance on Dhaka delivery zones, COD caps, returns, and warranties.',
              action: () => navigate({ name: 'faq' }),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <FileText className="w-4 h-4 text-[var(--ks-accent)]" />
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="text-[var(--ks-text-secondary)] leading-relaxed">{card.desc}</p>
              </div>
              <Button variant="outline" size="xs" onClick={card.action}>
                <span>Open Section</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 13. Platform Settings & Bangladesh Shipping Zones */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {readiness && (
            <section
              aria-label="System Readiness and Integration Audit"
              className="p-6 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
                  <div>
                    <h3 className="text-base font-medium leading-snug">
                      System Readiness &amp; Configuration Transparency
                    </h3>
                    <p className="text-xs text-[var(--ks-text-secondary)]">
                      Live server audit of persistence, email transport, payment gateways, and Bangladesh statutory compliance.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono-num text-[var(--ks-text-muted)]">
                  Support open: {readiness.metrics.openSupportInquiries} · Newsletter:{' '}
                  {readiness.metrics.newsletterSubscribers}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[readiness.persistence, readiness.emailTransport, readiness.crawlerSurface].map(
                  (item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--ks-text-primary)]">
                          {item.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            item.status === 'operational'
                              ? 'text-[var(--ks-success)]'
                              : 'text-[var(--ks-warning)]'
                          }`}
                        >
                          {item.status === 'operational' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>
                            {item.status === 'operational'
                              ? 'Operational'
                              : item.status === 'in-memory'
                              ? 'In-Memory Only'
                              : 'Pending Config'}
                          </span>
                        </span>
                      </div>
                      <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                        {item.summary}
                      </p>
                      {item.requiredAction && (
                        <p className="text-[11px] text-[var(--ks-accent)]">
                          Next: {item.requiredAction}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                <div className="space-y-2">
                  <p className="ks-eyebrow">Payment Gateway Readiness</p>
                  <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)]">
                    {readiness.paymentGateways.map((gw) => (
                      <div key={gw.id} className="p-3 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-medium text-[var(--ks-text-primary)]">{gw.label}</p>
                          <p className="text-[var(--ks-text-secondary)]">
                            {gw.requiredAction || gw.summary}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 font-medium ${
                            gw.status === 'operational'
                              ? 'text-[var(--ks-success)]'
                              : 'text-[var(--ks-text-muted)]'
                          }`}
                        >
                          {gw.status === 'operational' ? 'Enabled' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="ks-eyebrow">Bangladesh Legal &amp; Regulatory Checklist</p>
                  <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)]">
                    {readiness.businessCompliance.map((reg) => (
                      <div key={reg.id} className="p-3 flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-medium text-[var(--ks-text-primary)]">{reg.label}</p>
                          <p className="text-[var(--ks-text-secondary)]">{reg.summary}</p>
                        </div>
                        <span
                          className={`shrink-0 font-medium ${
                            reg.status === 'operational'
                              ? 'text-[var(--ks-success)]'
                              : 'text-[var(--ks-warning)]'
                          }`}
                        >
                          {reg.status === 'operational' ? 'Filed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {platformDraft && (
            <form
              onSubmit={handleSavePlatformSettings}
              className="max-w-2xl p-6 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[var(--ks-accent)]" />
                <h3 className="text-base font-medium">General Storefront Configuration</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Storefront Brand Name"
                  value={platformDraft.storefrontName}
                  onChange={(e) =>
                    setPlatformDraft({ ...platformDraft, storefrontName: e.target.value })
                  }
                />
                <Input
                  label="Support Desk Email"
                  type="email"
                  value={platformDraft.supportEmail}
                  onChange={(e) =>
                    setPlatformDraft({ ...platformDraft, supportEmail: e.target.value })
                  }
                />
                <Select
                  label="Default Language"
                  value={platformDraft.defaultLanguage}
                  onChange={(e) =>
                    setPlatformDraft({
                      ...platformDraft,
                      defaultLanguage: e.target.value as LanguageCode,
                    })
                  }
                  options={[
                    { value: 'en', label: 'English (EN)' },
                    { value: 'bn', label: 'বাংলা (BN)' },
                    { value: 'hi', label: 'हिन्दी (HI)' },
                    { value: 'ar', label: 'العربية (AR)' },
                    { value: 'es', label: 'Español (ES)' },
                    { value: 'fr', label: 'Français (FR)' },
                  ]}
                />
              </div>
              <label className="inline-flex items-start gap-2 text-xs leading-snug cursor-pointer">
                <input
                  type="checkbox"
                  checked={platformDraft.maintenanceNoticeEnabled}
                  onChange={(e) =>
                    setPlatformDraft({
                      ...platformDraft,
                      maintenanceNoticeEnabled: e.target.checked,
                    })
                  }
                  className="mt-[2px] shrink-0"
                />
                <span>Display scheduled catalog maintenance notice</span>
              </label>
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={busyKey === 'platform-save'}
                >
                  Save Platform Settings
                </Button>
              </div>
            </form>
          )}

          {zoneDraft && (
            <form
              onSubmit={handleSaveShippingZone}
              className="p-6 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
                  <h3 className="text-base font-medium leading-snug">
                    Bangladesh Zone Logistics &amp; COD Rules
                  </h3>
                </div>
                <select
                  aria-label="Select shipping zone"
                  value={selectedZoneId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedZoneId(nextId);
                    const found = data.shippingConfig.zones.find((z) => z.zoneId === nextId);
                    if (found) setZoneDraft(found);
                  }}
                  className="min-h-[44px] sm:h-10 px-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)]"
                >
                  {data.shippingConfig.zones.map((z) => (
                    <option key={z.zoneId} value={z.zoneId}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Standard Fee (USD)"
                  type="number"
                  step="0.05"
                  value={zoneDraft.standardFeeUsd}
                  onChange={(e) =>
                    setZoneDraft({ ...zoneDraft, standardFeeUsd: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Express Fee (USD)"
                  type="number"
                  step="0.05"
                  value={zoneDraft.expressFeeUsd}
                  onChange={(e) =>
                    setZoneDraft({ ...zoneDraft, expressFeeUsd: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Free Shipping Threshold (USD)"
                  type="number"
                  step="5"
                  value={zoneDraft.freeThresholdUsd}
                  onChange={(e) =>
                    setZoneDraft({ ...zoneDraft, freeThresholdUsd: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Extra Kg Surcharge (USD/kg)"
                  type="number"
                  step="0.05"
                  value={zoneDraft.perExtraKgUsd}
                  onChange={(e) =>
                    setZoneDraft({ ...zoneDraft, perExtraKgUsd: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Bulky Handling Surcharge (USD)"
                  type="number"
                  step="0.5"
                  value={zoneDraft.bulkySurchargeUsd}
                  onChange={(e) =>
                    setZoneDraft({ ...zoneDraft, bulkySurchargeUsd: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="COD Max Order Cap (USD)"
                  type="number"
                  step="10"
                  value={zoneDraft.codMaxOrderUsd}
                  onChange={(e) =>
                    setZoneDraft({ ...zoneDraft, codMaxOrderUsd: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Standard Delivery ETA"
                  value={zoneDraft.standardEta}
                  onChange={(e) => setZoneDraft({ ...zoneDraft, standardEta: e.target.value })}
                />
                <Input
                  label="Express Delivery ETA"
                  value={zoneDraft.expressEta}
                  onChange={(e) => setZoneDraft({ ...zoneDraft, expressEta: e.target.value })}
                />
                <Input
                  label="Restricted Area Keywords (CSV)"
                  value={restrictedKeywordsInput}
                  onChange={(e) => setRestrictedKeywordsInput(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-6 text-xs">
                <label className="inline-flex items-start gap-2 leading-snug cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zoneDraft.expressAvailable}
                    onChange={(e) =>
                      setZoneDraft({ ...zoneDraft, expressAvailable: e.target.checked })
                    }
                    className="mt-[2px] shrink-0"
                  />
                  <span>Express Courier Active</span>
                </label>
                <label className="inline-flex items-start gap-2 leading-snug cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zoneDraft.codEligible}
                    onChange={(e) => setZoneDraft({ ...zoneDraft, codEligible: e.target.checked })}
                    className="mt-[2px] shrink-0"
                  />
                  <span>Cash on Delivery (COD) Eligible</span>
                </label>
                <label className="inline-flex items-start gap-2 leading-snug cursor-pointer text-[var(--ks-error)]">
                  <input
                    type="checkbox"
                    checked={zoneDraft.isRestricted}
                    onChange={(e) =>
                      setZoneDraft({ ...zoneDraft, isRestricted: e.target.checked })
                    }
                    className="mt-[2px] shrink-0"
                  />
                  <span>Zone Restricted / Suspended</span>
                </label>
              </div>

              <Button type="submit" variant="primary" size="md" disabled={busyKey === 'ship-save'}>
                Update Zone Shipping Rules
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
