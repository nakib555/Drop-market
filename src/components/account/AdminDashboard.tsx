import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  FolderPlus,
  RefreshCw,
  Search,
  ShieldCheck,
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
  updateAdminCurrencyApi,
  updateAdminShippingRulesApi,
  updateAdminUserApi,
  updateCategoryNodeApi,
  updateOrderStatusApi,
  updateSellerStatusApi,
} from '../../services/api';
import {
  AdminDashboardData,
  CategoryNode,
  CurrencyCode,
  OrderStage,
  ShippingZoneRule,
  UserRole,
} from '../../types/commerce';
import { formatCurrency, formatDirectCurrency } from '../../utils/format';
import { IMAGE_PRESET_OPTIONS } from '../../utils/imagePresets';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/FormFields';
import { SkeletonLoader } from '../ui/Primitives';

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

export const AdminDashboard: React.FC = () => {
  const { currency, showToast, refreshOrders, refreshStorefrontSync, navigate } = useStore();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'orders' | 'sellers' | 'users' | 'categories' | 'currency' | 'shipping'
  >('orders');
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

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminDashboardApi();
      setData(res);
      setFxRateInput(String(res.currencyConfig.rates.BDT));
      setFxDefaultCurrency(res.currencyConfig.defaultCurrency);
      setFxSource(res.currencyConfig.source);
      setFxFreq(String(res.currencyConfig.updateFrequencyMinutes));
      setRestrictedKeywordsInput(res.shippingConfig.restrictedAreaKeywords.join(', '));
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

  const handleOrderStageChange = async (orderId: string, nextStage: OrderStage) => {
    setBusyKey(orderId);
    try {
      await updateOrderStatusApi(orderId, nextStage, `Status updated by Platform Admin`);
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
      showToast(
        node.isActive ? 'Category deactivated' : 'Category activated',
        node.name,
        'info'
      );
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
      <div className="p-6 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] space-y-3">
        <p className="text-sm font-medium text-[#B91C1C] dark:text-[#F87171]">
          {error || 'Admin console unavailable'}
        </p>
        <Button variant="outline" size="sm" onClick={loadAdmin}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Marketplace Operations Console
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">
            Platform Administration &amp; Configuration
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadAdmin}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Live Metrics</span>
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Platform GMV (MTD)</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {formatCurrency(data.kpis.totalGmv, currency)}
          </p>
          <p className="text-[11px] font-mono-num text-[#5C5B57] dark:text-[#A3A19B] mt-1">
            {data.kpis.totalOrders} total orders
          </p>
        </div>
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Verified Sellers</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {data.kpis.activeSellers}
          </p>
          <p className="text-[11px] text-[#B45309] dark:text-[#FBBF24] mt-1 font-mono-num">
            {data.kpis.pendingSellers} pending approval
          </p>
        </div>
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Registered Accounts</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {data.kpis.registeredUsers}
          </p>
          <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] mt-1">
            Customers, Sellers &amp; Staff
          </p>
        </div>
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Active Departments / Nodes</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {data.kpis.activeCategories} / {data.categories.length}
          </p>
          <p className="text-[11px] text-[#1F6E43] dark:text-[#4ADE80] mt-1">
            1 USD = ৳{data.currencyConfig.rates.BDT}
          </p>
        </div>
      </div>

      {/* Department Revenue Distribution */}
      <div className="p-5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] space-y-3">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">
          10-Department GMV Distribution
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {(() => {
            const maxShare = Math.max(...data.departmentShare.map((d) => d.sharePercent), 1);
            return data.departmentShare.map((dept) => (
              <div key={dept.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate pr-2">{dept.label}</span>
                  <span className="font-mono-num text-[#5C5B57] dark:text-[#A3A19B] shrink-0">
                    {formatCurrency(dept.gmv, currency)} ({dept.sharePercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#E5E3DD] dark:bg-[#2C2C28] overflow-hidden">
                  <div
                    className="h-full bg-[#8F6438] dark:bg-[#C89B67]"
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

      {/* Console Sub-Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E3DD] dark:border-[#2C2C28] overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'orders', label: `Orders (${data.orders.length})` },
            { id: 'sellers', label: `Sellers (${data.sellerApplications.length})` },
            { id: 'users', label: `Users (${data.users.length})` },
            { id: 'categories', label: `Categories (${data.categories.length})` },
            { id: 'currency', label: 'FX & Currency' },
            { id: 'shipping', label: 'BD Shipping Rules' },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                active
                  ? 'text-[#171716] dark:text-[#F4F3EF]'
                  : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
              }`}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="admin-console-tab"
                  transition={STUDIO_TRANSITION.springTab}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#171716] dark:bg-[#F4F3EF]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Orders Control */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[#84827B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter orders by ID, customer, email, or ref..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-md bg-white dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Order</th>
                  <th className="py-2.5 px-3 font-medium">Customer</th>
                  <th className="py-2.5 px-3 font-medium">Payment &amp; Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Settled Amount</th>
                  <th className="py-2.5 px-3 font-medium">Fulfillment Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-3 text-center text-xs text-[#84827B]">
                      No orders match your current search filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F9F8F6]/70 dark:hover:bg-[#1F1F1C]/60">
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
                        <p className="text-[11px] text-[#84827B]">{ord.email}</p>
                      </td>
                      <td className="py-2.5 px-3 text-[#5C5B57] dark:text-[#A3A19B] whitespace-nowrap">
                        <p>{ord.paymentLabel}</p>
                        <p className="text-[10px] font-mono-num uppercase text-[#8F6438] dark:text-[#C89B67]">
                          {ord.paymentStatus}
                          {ord.transactionRef ? ` · ${ord.transactionRef}` : ''}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right whitespace-nowrap">
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
                          onChange={(e) => handleOrderStageChange(ord.id, e.target.value as OrderStage)}
                          className="h-8 px-2 text-xs rounded border border-[#E5E3DD] dark:border-[#2C2C28] bg-white dark:bg-[#141413]"
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

      {/* Tab 2: Seller Approvals */}
      {activeTab === 'sellers' && (
        <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-medium">Studio</th>
                <th className="py-2.5 px-3 font-medium">Department</th>
                <th className="py-2.5 px-3 font-medium text-right">Monthly Rev</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
              {data.sellerApplications.map((app) => (
                <tr key={app.id} className="hover:bg-[#F9F8F6]/70 dark:hover:bg-[#1F1F1C]/60">
                  <td className="py-3 px-3">
                    <p className="font-medium text-[#171716] dark:text-[#F4F3EF]">
                      {app.studioName}
                    </p>
                    <p className="text-[11px] text-[#84827B]">
                      {app.ownerName} · {app.origin}
                    </p>
                  </td>
                  <td className="py-3 px-3">{app.department}</td>
                  <td className="py-3 px-3 font-mono-num text-right">
                    {formatCurrency(app.monthlyRevenue, currency)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-medium capitalize ${
                        app.status === 'approved'
                          ? 'text-[#1F6E43] dark:text-[#4ADE80]'
                          : app.status === 'pending'
                          ? 'text-[#B45309] dark:text-[#FBBF24]'
                          : 'text-[#B91C1C] dark:text-[#F87171]'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
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
                        className="text-xs text-[#B91C1C] dark:text-[#F87171] hover:underline cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: User Accounts Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Users className="w-4 h-4 text-[#84827B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or role..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-md bg-white dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Account</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium">Role</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                {filteredUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-[#F9F8F6]/70 dark:hover:bg-[#1F1F1C]/60">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-[#171716] dark:text-[#F4F3EF]">
                        {usr.fullName}
                      </p>
                      <p className="text-[11px] text-[#84827B]">{usr.email}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[#5C5B57] dark:text-[#A3A19B]">
                      {usr.location}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        aria-label={`Role for ${usr.fullName}`}
                        disabled={busyKey === usr.id}
                        value={usr.role}
                        onChange={(e) =>
                          handleUserUpdate(usr.id, { role: e.target.value as UserRole })
                        }
                        className="h-8 px-2 text-xs rounded border border-[#E5E3DD] dark:border-[#2C2C28] bg-white dark:bg-[#141413]"
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
                        className="h-8 px-2 text-xs rounded border border-[#E5E3DD] dark:border-[#2C2C28] bg-white dark:bg-[#141413]"
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

      {/* Tab 4: Hierarchical Category Tree CRUD */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border border-[#E5E3DD] dark:border-[#2C2C28] rounded-md max-h-[580px] overflow-y-auto">
            {orderedCategoryTree.map((node) => (
              <div
                key={node.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#F9F8F6]/70 dark:hover:bg-[#1F1F1C]/60"
                style={{ paddingLeft: `${14 + node.depth * 18}px` }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-num text-[#84827B]">
                      L{node.depth}
                    </span>
                    <p
                      className={`text-sm truncate ${
                        node.depth === 0 ? 'font-semibold' : 'font-medium'
                      } ${!node.isActive ? 'line-through text-[#84827B]' : ''}`}
                    >
                      {node.name}
                    </p>
                    <span className="text-[11px] font-mono-num text-[#84827B] truncate">
                      /{node.slug}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] mt-0.5 truncate">
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
                        ? 'border-[#1F6E43]/40 text-[#1F6E43] dark:text-[#4ADE80]'
                        : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B]'
                    }`}
                  >
                    {node.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryNode(node)}
                    disabled={busyKey === node.id}
                    aria-label={`Delete ${node.name}`}
                    className="p-1.5 text-[#B91C1C] dark:text-[#F87171] hover:opacity-80 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddCategoryNode}
            className="lg:col-span-5 p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-4"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
              <h3 className="text-base font-medium">Create Department or Subcategory</h3>
            </div>

            <Select
              label="Parent Category (Optional for Nested Tree)"
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
              label="Category / Department Name"
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
              label="Collection Associations (comma-separated)"
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
            <Button type="submit" variant="primary" size="md" fullWidth disabled={busyKey === 'add-cat'}>
              Publish Category Node
            </Button>
          </form>
        </div>
      )}

      {/* Tab 5: FX & Currency Configuration */}
      {activeTab === 'currency' && (
        <form
          onSubmit={handleSaveCurrency}
          className="max-w-2xl p-6 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-5"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
            <h3 className="text-base font-medium">Global BDT / USD Exchange Rate &amp; Rounding Rules</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="BDT per 1 USD Rate"
              type="number"
              step="0.01"
              required
              value={fxRateInput}
              onChange={(e) => setFxRateInput(e.target.value)}
              helperText="Base catalog prices in USD; live converted to integer Taka (ceil)."
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
              label="Exchange-Rate Provider Source"
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
          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] font-mono-num">
            Last FX Snapshot Timestamp: {data.currencyConfig.updatedAt}
          </p>
          <Button type="submit" variant="primary" size="md" disabled={busyKey === 'fx-save'}>
            Save &amp; Broadcast FX Rate
          </Button>
        </form>
      )}

      {/* Tab 6: Bangladesh Hierarchical Shipping Configuration */}
      {activeTab === 'shipping' && zoneDraft && (
        <form
          onSubmit={handleSaveShippingZone}
          className="p-6 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
              <h3 className="text-base font-medium">Bangladesh Zone Logistics &amp; COD Rules</h3>
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
              className="h-10 px-3 text-xs rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
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
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={zoneDraft.expressAvailable}
                onChange={(e) =>
                  setZoneDraft({ ...zoneDraft, expressAvailable: e.target.checked })
                }
              />
              <span>Express Courier Active</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={zoneDraft.codEligible}
                onChange={(e) => setZoneDraft({ ...zoneDraft, codEligible: e.target.checked })}
              />
              <span>Cash on Delivery (COD) Eligible</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-[#B91C1C] dark:text-[#F87171]">
              <input
                type="checkbox"
                checked={zoneDraft.isRestricted}
                onChange={(e) => setZoneDraft({ ...zoneDraft, isRestricted: e.target.checked })}
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
  );
};
