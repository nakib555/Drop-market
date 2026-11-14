import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FolderPlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import {
  createCategoryApi,
  deleteCategoryApi,
  fetchAdminDashboardApi,
  updateAdminUserApi,
  updateOrderStatusApi,
  updateSellerStatusApi,
} from '../../services/api';
import { AdminDashboardData, OrderStage, UserRole } from '../../types/commerce';
import { formatCurrency } from '../../utils/format';
import { IMAGE_PRESET_OPTIONS } from '../../utils/imagePresets';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
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

export const AdminDashboard: React.FC = () => {
  const { currency, categories, showToast, refreshOrders, refreshStorefrontSync, navigate } =
    useStore();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'sellers' | 'users' | 'categories'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Dynamic category creation state
  const [catName, setCatName] = useState('');
  const [catShort, setCatShort] = useState('');
  const [catSub, setCatSub] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catPreset, setCatPreset] = useState('clock');

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminDashboardApi();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Admin Console API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.orders;
    return data.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setBusyKey('add-cat');
    try {
      const created = await createCategoryApi({
        name: catName,
        shortName: catShort || catName,
        subcategoryName: catSub || 'Featured Releases',
        description: catDesc,
        imagePresetKey: catPreset,
      });
      setCatName('');
      setCatShort('');
      setCatSub('');
      setCatDesc('');
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast(
        'Department created',
        `${created.name} is now live in Mega Menu & Shop filters.`,
        'success'
      );
    } catch (err) {
      showToast('Failed to create department', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    setBusyKey(slug);
    try {
      await deleteCategoryApi(slug);
      await Promise.all([loadAdmin(), refreshStorefrontSync()]);
      showToast('Custom department removed', undefined, 'info');
    } catch (err) {
      showToast('Delete failed', err instanceof Error ? err.message : 'API error', 'error');
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
            Platform Administration &amp; Moderation
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
          <p className="text-xs text-[#84827B]">Active Departments</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {categories.length}
          </p>
          <p className="text-[11px] text-[#1F6E43] dark:text-[#4ADE80] mt-1">
            Multi-category taxonomy
          </p>
        </div>
      </div>

      {/* Department Revenue Distribution */}
      <div className="p-5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] space-y-3">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">
          Department GMV Distribution
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {data.departmentShare.map((dept) => (
            <div key={dept.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{dept.label}</span>
                <span className="font-mono-num text-[#5C5B57] dark:text-[#A3A19B]">
                  {formatCurrency(dept.gmv, currency)} ({dept.sharePercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#E5E3DD] dark:bg-[#2C2C28] overflow-hidden">
                <div
                  className="h-full bg-[#8F6438] dark:bg-[#C89B67]"
                  style={{ width: `${dept.sharePercent * 2.4}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Console Sub-Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E3DD] dark:border-[#2C2C28] overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'orders', label: `All Orders (${data.orders.length})` },
            { id: 'sellers', label: `Seller Studios (${data.sellerApplications.length})` },
            { id: 'users', label: `User Accounts (${data.users.length})` },
            { id: 'categories', label: `Departments (${categories.length})` },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
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
              placeholder="Filter orders by ID, customer, or email..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-md bg-white dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Order</th>
                  <th className="py-2.5 px-3 font-medium">Customer</th>
                  <th className="py-2.5 px-3 font-medium">Payment</th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                  <th className="py-2.5 px-3 font-medium">Fulfillment Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                {filteredOrders.map((ord) => (
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
                      {ord.paymentLabel}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-right whitespace-nowrap">
                      {formatCurrency(ord.total, currency)}
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
                ))}
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

      {/* Tab 4: Dynamic Marketplace Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border border-[#E5E3DD] dark:border-[#2C2C28] rounded-md">
            {categories.map((cat) => {
              const isCustom = data.categories.some((c) => c.slug === cat.slug);
              return (
                <div key={cat.slug} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{cat.name}</p>
                      <span className="text-[11px] font-mono-num text-[#84827B]">
                        /{cat.slug}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5 truncate">
                      {cat.subcategories.map((s) => s.name).join(' · ')}
                    </p>
                  </div>
                  {isCustom ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.slug)}
                      disabled={busyKey === cat.slug}
                      aria-label={`Delete ${cat.name}`}
                      className="text-xs text-[#B91C1C] dark:text-[#F87171] inline-flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#84827B] shrink-0">Core Dept</span>
                  )}
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleAddCategory}
            className="lg:col-span-5 p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-4"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
              <h3 className="text-base font-medium">Add Dynamic Department</h3>
            </div>
            <Input
              label="Department Name"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g., Automotive & Mobility"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nav Short Name"
                value={catShort}
                onChange={(e) => setCatShort(e.target.value)}
                placeholder="Automotive"
              />
              <Input
                label="Initial Subcategory"
                value={catSub}
                onChange={(e) => setCatSub(e.target.value)}
                placeholder="Car Tech & Tools"
              />
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium block">Banner Image Preset</span>
              <select
                value={catPreset}
                onChange={(e) => setCatPreset(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
              >
                {IMAGE_PRESET_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Department Summary"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Precision accessories, chargers, and maintenance tools."
            />
            <Button type="submit" variant="primary" size="md" fullWidth disabled={busyKey === 'add-cat'}>
              Publish Department to Catalog
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
