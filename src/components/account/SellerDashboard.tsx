import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  CreditCard,
  Download,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { buildPolicyAcceptance } from '../../data/legalPolicies';
import {
  createSellerProductApi,
  fetchSellerDashboardApi,
  resolveSellerReturnApi,
  updateOrderStatusApi,
  updateSellerProductApi,
  updateSellerSettingsApi,
} from '../../services/api';
import {
  OrderStage,
  ProductSizeTier,
  SellerDashboardData,
  SellerStoreSettings,
} from '../../types/commerce';
import { formatCurrency, formatDirectCurrency } from '../../utils/format';
import { t } from '../../utils/i18n';
import { IMAGE_PRESET_OPTIONS, resolveImagePreset } from '../../utils/imagePresets';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { Modal, ResilientImage, SkeletonLoader } from '../ui/Primitives';

type SellerTab =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'returns'
  | 'customers'
  | 'reports'
  | 'store-settings'
  | 'shipping-settings'
  | 'payouts';

export const SellerDashboard: React.FC = () => {
  const {
    language,
    currency,
    categories,
    showToast,
    refreshStorefrontSync,
    refreshOrders,
    navigate,
    openPolicyPreview,
  } = useStore();

  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SellerStoreSettings | null>(null);

  // Add Product modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.slug || 'electronics-tech');
  const [newPrice, setNewPrice] = useState('185');
  const [newStock, setNewStock] = useState('14');
  const [newWeightKg, setNewWeightKg] = useState('1.4');
  const [newSizeTier, setNewSizeTier] = useState<ProductSizeTier>('small');
  const [newCodEligible, setNewCodEligible] = useState(true);
  const [newPreset, setNewPreset] = useState('headphones');
  const [newDesc, setNewDesc] = useState('');
  const [newHighlight1, setNewHighlight1] = useState('Studio Edition');
  const [newHighlight2, setNewHighlight2] = useState('2-Year Warranty');
  const [newAcceptedSellerTerms, setNewAcceptedSellerTerms] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSellerDashboardApi();
      setData(res);
      setSettingsDraft(res.storeSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Seller API endpoint.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredInventory = useMemo(() => {
    if (!data) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data.inventory;
    return data.inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
    );
  }, [data, searchTerm]);

  const handleSaveInline = async (id: string) => {
    const parsedPrice = Number(editPrice);
    const parsedStock = Number(editStock);
    if (
      Number.isNaN(parsedPrice) ||
      parsedPrice <= 0 ||
      Number.isNaN(parsedStock) ||
      parsedStock < 0
    ) {
      showToast('Invalid inventory values', 'Enter positive price and non-negative stock.', 'error');
      return;
    }
    setSavingId(id);
    try {
      await updateSellerProductApi(id, {
        price: parsedPrice,
        stockCount: parsedStock,
      });
      await Promise.all([loadDashboard(), refreshStorefrontSync()]);
      setEditingId(null);
      showToast('Inventory synced', 'Live price & stock updated across catalog.', 'success');
    } catch (err) {
      showToast('Update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleAdvanceOrder = async (orderId: string, nextStage: OrderStage) => {
    setSavingId(orderId);
    try {
      await updateOrderStatusApi(
        orderId,
        nextStage,
        `Updated by ${data?.studioName || 'Seller Studio'}`
      );
      await Promise.all([loadDashboard(), refreshOrders()]);
      showToast(`Order #${orderId} updated`, `Status moved to ${nextStage}.`, 'success');
    } catch (err) {
      showToast('Order update failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleResolveReturn = async (
    orderId: string,
    decision: 'approve_refund' | 'restore_delivered'
  ) => {
    setSavingId(orderId);
    try {
      await resolveSellerReturnApi(orderId, decision);
      await Promise.all([loadDashboard(), refreshOrders()]);
      showToast(
        decision === 'approve_refund' ? 'Return approved & refunded' : 'Return closed',
        `Order #${orderId} updated.`,
        'success'
      );
    } catch (err) {
      showToast('Return action failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    setSavingId('settings');
    try {
      const updated = await updateSellerSettingsApi(settingsDraft);
      setSettingsDraft(updated);
      await loadDashboard();
      showToast('Seller settings saved', 'Studio configuration updated.', 'success');
    } catch (err) {
      showToast('Save failed', err instanceof Error ? err.message : 'API error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcceptedSellerTerms) {
      showToast(
        'Seller Agreement Required',
        'Confirm the Seller Marketplace Agreement & Prohibited Items Policy before publishing.',
        'error'
      );
      return;
    }
    const catMeta = categories.find((c) => c.slug === newCategory);
    setCreatingProduct(true);
    try {
      const created = await createSellerProductApi({
        name: newName,
        brand: data?.studioName,
        category: newCategory,
        categoryLabel: catMeta?.name || 'Electronics & Technology',
        subcategory: catMeta?.subcategories[0]?.slug || 'featured',
        subcategoryLabel: catMeta?.subcategories[0]?.name || 'Studio Release',
        price: Number(newPrice),
        stockCount: Number(newStock),
        weightKg: Number(newWeightKg) > 0 ? Number(newWeightKg) : 1.2,
        sizeTier: newSizeTier,
        codEligible: newCodEligible,
        shortDescription: newDesc,
        imagePresetKey: newPreset,
        highlightOne: newHighlight1,
        highlightTwo: newHighlight2,
        acceptedPolicies: buildPolicyAcceptance([
          'seller-agreement',
          'prohibited-items',
          'product-safety',
        ]),
      });
      setAddModalOpen(false);
      setNewName('');
      setNewDesc('');
      setNewAcceptedSellerTerms(false);
      await Promise.all([loadDashboard(), refreshStorefrontSync()]);
      showToast(
        'Product published live',
        `${created.name} is now active in the storefront catalog.`,
        'success'
      );
    } catch (err) {
      showToast('Publish failed', err instanceof Error ? err.message : 'Check fields.', 'error');
    } finally {
      setCreatingProduct(false);
    }
  };

  const exportCsvReport = () => {
    if (!data) return;
    const rows = [
      ['Month', 'GMV (USD)', 'Orders'],
      ...data.revenueSeries.map((r) => [r.month, r.gmv.toFixed(2), String(r.orders)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kinto-seller-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Sales report exported', 'Downloaded kinto-seller-report.csv', 'success');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-24 w-full" />
          ))}
        </div>
        <SkeletonLoader className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3">
        <p className="text-sm font-medium text-[var(--ks-error)]">
          {error || 'Seller dashboard unavailable'}
        </p>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t(language, 'retryBtn')}</span>
        </Button>
      </div>
    );
  }

  const maxSeries = Math.max(...data.revenueSeries.map((r) => r.gmv), 1);

  const tabs: Array<{ id: SellerTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${data.inventory.length})` },
    { id: 'inventory', label: 'Inventory' },
    { id: 'orders', label: `Orders (${data.fulfillmentQueue.length})` },
    { id: 'returns', label: `Returns (${data.returnsQueue.length})` },
    { id: 'customers', label: `Customers (${data.authorizedCustomers.length})` },
    { id: 'reports', label: 'Sales Reports' },
    { id: 'store-settings', label: 'Store Settings' },
    { id: 'shipping-settings', label: 'Shipping' },
    { id: 'payouts', label: 'Payout Info' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--ks-border)]">
        <div>
          <p className="text-xs leading-snug uppercase tracking-wider text-[var(--ks-accent)] inline-flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 shrink-0" /> {t(language, 'sellerDashboardEyebrow')}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">{data.studioName}</h2>
          <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5">
            Operator: {data.ownerName} · Live Storefront &amp; Dispatch Sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t(language, 'refreshBtn')}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>{t(language, 'addProductBtn')}</span>
          </Button>
        </div>
      </div>

      {/* 10-Section Seller Navigation Strip (Mobile Select + Desktop Tabs) */}
      <div className="md:hidden">
        <Select
          label={t(language, 'workspaceSectionLabel')}
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as SellerTab)}
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
              onClick={(e) => {
                setActiveTab(tab.id);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
              }}
              className={`relative pb-3 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                active
                  ? 'text-[var(--ks-text-primary)]'
                  : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
              }`}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="seller-sub-tab"
                  transition={STUDIO_TRANSITION.springTab}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--ks-text-primary)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">30-Day Studio GMV</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {formatCurrency(data.kpis.monthlyGmv, currency)}
              </p>
              <p className="text-[11px] text-[var(--ks-success)] mt-1 font-mono-num">
                {data.kpis.avgRating.toFixed(2)} ★ Partner Score
              </p>
            </div>
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Active Listings</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {data.kpis.activeListings}
              </p>
              <p className="text-[11px] text-[var(--ks-text-secondary)] mt-1">
                Synced with live catalog
              </p>
            </div>
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Pending Fulfillment</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {data.kpis.pendingFulfillment}
              </p>
              <p className="text-[11px] text-[var(--ks-warning)] mt-1">
                Open Returns: {data.kpis.returnRequestsCount}
              </p>
            </div>
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <p className="text-xs text-[var(--ks-text-muted)]">Low Stock SKUs</p>
              <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
                {data.kpis.lowStockSkus}
              </p>
              <p className="text-[11px] text-[var(--ks-text-muted)] mt-1">Threshold ≤ 8 units</p>
            </div>
          </div>

          <div className="p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Trailing 6-Month Sales Volume ({currency})</h3>
              <span className="text-xs font-mono-num text-[var(--ks-text-muted)]">
                {data.revenueSeries[0]?.month} – {data.revenueSeries[data.revenueSeries.length - 1]?.month}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-28 pt-2">
              {data.revenueSeries.map((point) => {
                const pct = Math.max(18, Math.round((point.gmv / maxSeries) * 100));
                return (
                  <div key={point.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono-num text-[var(--ks-text-secondary)] hidden sm:inline">
                      {formatCurrency(point.gmv, currency)}
                    </span>
                    <div
                      className="w-full max-w-[40px] rounded-t-sm bg-[var(--ks-accent)] transition-all duration-300"
                      style={{ height: `${pct}%` }}
                      title={`${point.month}: ${formatCurrency(point.gmv, currency)}`}
                    />
                    <span className="text-[11px] font-mono-num text-[var(--ks-text-muted)]">
                      {point.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-2.5 text-xs">
            <p className="font-semibold text-sm">Partner Studio Governance &amp; Buyer Data Rules</p>
            <p className="text-[var(--ks-text-secondary)] leading-relaxed">
              Partner sellers must use buyer shipping information strictly for order dispatch, uphold intellectual property authenticity, and avoid prohibited goods.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
              {(
                [
                  { id: 'seller-agreement', label: 'Seller Marketplace Agreement' },
                  { id: 'marketplace-terms', label: 'Marketplace Model Terms' },
                  { id: 'prohibited-items', label: 'Prohibited Items' },
                  { id: 'intellectual-property', label: 'IP & Takedown Policy' },
                ] as const
              ).map((pol) => (
                <button
                  key={pol.id}
                  type="button"
                  onClick={() => openPolicyPreview(pol.id)}
                  className="underline font-medium text-[var(--ks-accent)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                >
                  {pol.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2 & 3. Products & Inventory */}
      {(activeTab === 'products' || activeTab === 'inventory') && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[var(--ks-text-muted)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SKU, product name, or department..."
                className="w-full min-h-[44px] sm:h-10 ps-9 pe-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)]"
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              <span>{t(language, 'addProductBtn')}</span>
            </Button>
          </div>

          {/* Mobile Stacked Inventory Cards */}
          <div className="md:hidden space-y-3">
            {filteredInventory.length === 0 ? (
              <div className="p-6 text-center rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs text-[var(--ks-text-muted)]">
                No inventory listings match your search filter.
              </div>
            ) : (
              filteredInventory.map((item) => {
                const isEditing = editingId === item.id;
                return (
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
                          <p className="text-sm font-medium text-[var(--ks-text-primary)] truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-[var(--ks-text-muted)] truncate">
                            {item.categoryLabel} · <span className="font-mono-num">{item.sku}</span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium shrink-0 ${
                          item.stockCount <= 0
                            ? 'text-[var(--ks-error)]'
                            : item.stockCount <= 8
                            ? 'text-[var(--ks-warning)]'
                            : 'text-[var(--ks-success)]'
                        }`}
                      >
                        {item.stockCount <= 0
                          ? t(language, 'outOfStock')
                          : item.stockCount <= 8
                          ? t(language, 'lowStockBadge')
                          : t(language, 'inStock')}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 pt-2 border-t border-[var(--ks-border)]">
                        <div className="grid grid-cols-2 gap-3">
                          <label className="space-y-1">
                            <span className="text-[11px] text-[var(--ks-text-muted)] block">
                              Price (USD)
                            </span>
                            <input
                              type="number"
                              aria-label={`Price for ${item.name}`}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full min-h-[44px] px-3 text-base text-end font-mono-num tabular-nums rounded-[var(--ks-radius-md)] border border-[var(--ks-action)] bg-[var(--ks-bg)]"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[11px] text-[var(--ks-text-muted)] block">
                              Stock Units
                            </span>
                            <input
                              type="number"
                              aria-label={`Stock for ${item.name}`}
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-full min-h-[44px] px-3 text-base text-end font-mono-num tabular-nums rounded-[var(--ks-radius-md)] border border-[var(--ks-action)] bg-[var(--ks-bg)]"
                            />
                          </label>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            {t(language, 'cancelLabel')}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={savingId === item.id}
                            onClick={() => handleSaveInline(item.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t(language, 'saveBtn')}</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-[var(--ks-border)] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-mono-num font-semibold">
                            {formatCurrency(item.price, currency)}
                          </span>
                          <span className="text-[var(--ks-text-secondary)] font-mono-num">
                            Qty: {item.stockCount}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditPrice(String(item.price));
                            setEditStock(String(item.stockCount));
                          }}
                          className="min-h-[44px] px-3 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-accent)] hover:bg-[var(--ks-bg)] cursor-pointer"
                        >
                          {t(language, 'editStockPriceBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">SKU</th>
                  <th className="py-2.5 px-3 font-medium text-end">Price</th>
                  <th className="py-2.5 px-3 font-medium text-end">Stock</th>
                  <th className="py-2.5 px-3 font-medium">State</th>
                  <th className="py-2.5 px-3 font-medium text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)] [&_td]:align-middle">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-3 text-center text-xs text-[var(--ks-text-muted)]">
                      No inventory listings match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-[var(--ks-bg)]/70">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <ResilientImage
                              src={resolveImagePreset(item.imagePresetKey, item.category)}
                              alt={item.name}
                              className="w-9 h-7 rounded-sm object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--ks-text-primary)] truncate max-w-[220px]">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[var(--ks-text-muted)]">
                                {item.categoryLabel}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-[var(--ks-text-secondary)] whitespace-nowrap">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num tabular-nums text-end whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              aria-label={`Price for ${item.name}`}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 min-h-[38px] px-2 text-sm sm:text-xs text-end tabular-nums rounded border border-[var(--ks-action)] bg-[var(--ks-surface)]"
                            />
                          ) : (
                            formatCurrency(item.price, currency)
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num tabular-nums text-end whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              aria-label={`Stock for ${item.name}`}
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-20 min-h-[38px] px-2 text-sm sm:text-xs text-end tabular-nums rounded border border-[var(--ks-action)] bg-[var(--ks-surface)]"
                            />
                          ) : (
                            item.stockCount
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              item.stockCount <= 0
                                ? 'text-[var(--ks-error)]'
                                : item.stockCount <= 8
                                ? 'text-[var(--ks-warning)]'
                                : 'text-[var(--ks-success)]'
                            }`}
                          >
                            {item.stockCount <= 0
                              ? t(language, 'outOfStock')
                              : item.stockCount <= 8
                              ? t(language, 'lowStockBadge')
                              : t(language, 'inStock')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-end whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="xs"
                                disabled={savingId === item.id}
                                onClick={() => handleSaveInline(item.id)}
                              >
                                <Check className="w-3 h-3" />
                                <span>{t(language, 'saveBtn')}</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="min-h-[44px] sm:min-h-[32px] text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] px-2 cursor-pointer"
                              >
                                {t(language, 'cancelLabel')}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditPrice(String(item.price));
                                setEditStock(String(item.stockCount));
                              }}
                              className="min-h-[44px] sm:min-h-[32px] text-xs font-medium text-[var(--ks-accent)] hover:underline cursor-pointer"
                            >
                              {t(language, 'editStockPriceBtn')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Orders */}
      {activeTab === 'orders' && (
        <>
          {/* Mobile Stacked Order Fulfillment Cards */}
          <div className="md:hidden space-y-3">
            {data.fulfillmentQueue.length === 0 ? (
              <div className="p-6 text-center rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs text-[var(--ks-text-muted)]">
                No active fulfillment orders right now.
              </div>
            ) : (
              data.fulfillmentQueue.map((ord) => {
                const nextAction: { stage: OrderStage; label: string } | null =
                  ord.currentStage === 'Confirmed'
                    ? { stage: 'Processing', label: 'Start Processing' }
                    : ord.currentStage === 'Processing'
                    ? { stage: 'Packed', label: 'Mark Packed' }
                    : ord.currentStage === 'Packed'
                    ? { stage: 'Shipped', label: 'Dispatch Parcel' }
                    : null;

                return (
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
                        <p className="text-xs font-medium text-[var(--ks-text-primary)] mt-0.5">
                          {ord.customerName}
                        </p>
                        <p className="text-[11px] text-[var(--ks-text-secondary)]">
                          {ord.shippingAddress.city}, {ord.shippingAddress.country}
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
                        <p className="text-[11px] font-medium text-[var(--ks-accent)] mt-0.5">
                          {ord.currentStage}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--ks-border)] flex justify-end">
                      {nextAction ? (
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          disabled={savingId === ord.id}
                          onClick={() => handleAdvanceOrder(ord.id, nextAction.stage)}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{nextAction.label}</span>
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ks-text-muted)] py-1">
                          <Package className="w-3.5 h-3.5" />
                          <span>{ord.currentStage}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Order</th>
                  <th className="py-2.5 px-3 font-medium">Customer</th>
                  <th className="py-2.5 px-3 font-medium">Destination</th>
                  <th className="py-2.5 px-3 font-medium text-end">Total</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">Current Stage</th>
                  <th className="py-2.5 px-3 font-medium text-end whitespace-nowrap">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)] [&_td]:align-middle">
                {data.fulfillmentQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-3 text-center text-xs text-[var(--ks-text-muted)]">
                      No active fulfillment orders right now.
                    </td>
                  </tr>
                ) : (
                  data.fulfillmentQueue.map((ord) => {
                    const nextAction: { stage: OrderStage; label: string } | null =
                      ord.currentStage === 'Confirmed'
                        ? { stage: 'Processing', label: 'Start Processing' }
                        : ord.currentStage === 'Processing'
                        ? { stage: 'Packed', label: 'Mark Packed' }
                        : ord.currentStage === 'Packed'
                        ? { stage: 'Shipped', label: 'Dispatch Parcel' }
                        : null;

                    return (
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
                        <td className="py-2.5 px-3 whitespace-nowrap">{ord.customerName}</td>
                        <td className="py-2.5 px-3 text-[var(--ks-text-secondary)] whitespace-nowrap">
                          {ord.shippingAddress.city}, {ord.shippingAddress.country}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-end whitespace-nowrap">
                          {ord.currencySnapshot
                            ? formatDirectCurrency(
                                ord.currencySnapshot.chargedTotal,
                                ord.currencySnapshot.transactionCurrency
                              )
                            : formatCurrency(ord.total, currency)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                          {ord.currentStage}
                        </td>
                        <td className="py-2.5 px-3 text-end whitespace-nowrap">
                          {nextAction ? (
                            <Button
                              variant="outline"
                              size="xs"
                              disabled={savingId === ord.id}
                              onClick={() => handleAdvanceOrder(ord.id, nextAction.stage)}
                            >
                              <Truck className="w-3 h-3" />
                              <span>{nextAction.label}</span>
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[var(--ks-text-muted)]">
                              <Package className="w-3 h-3" />
                              <span>{ord.currentStage}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 5. Returns */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-[var(--ks-text-secondary)]">
            <RotateCcw className="w-4 h-4 text-[var(--ks-accent)]" />
            <span>
              Review buyer return requests under Kinto Studio&apos;s Return &amp; Refund Policy.
            </span>
          </div>
          {data.returnsQueue.length === 0 ? (
            <div className="p-8 text-center rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-xs text-[var(--ks-text-muted)]">
              No pending return requests in your studio queue.
            </div>
          ) : (
            <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)]">
              {data.returnsQueue.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                    <p className="text-xs text-[var(--ks-text-secondary)]">
                      {ord.customerName} · {ord.shippingAddress.city} ·{' '}
                      {formatCurrency(ord.total, currency)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="xs"
                      disabled={savingId === ord.id}
                      onClick={() => handleResolveReturn(ord.id, 'approve_refund')}
                    >
                      Approve &amp; Refund
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={savingId === ord.id}
                      onClick={() => handleResolveReturn(ord.id, 'restore_delivered')}
                    >
                      Close Claim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Authorized Customer Summaries (Privacy-scoped) */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-[var(--ks-text-secondary)]">
            <Users className="w-4 h-4 text-[var(--ks-accent)]" />
            <span>
              Privacy-scoped fulfillment summary of buyers who ordered from your studio. Direct personal emails and passwords remain hidden.
            </span>
          </div>
          <div className="overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Buyer Reference</th>
                  <th className="py-2.5 px-3 font-medium">Delivery Area</th>
                  <th className="py-2.5 px-3 font-medium text-end">Orders</th>
                  <th className="py-2.5 px-3 font-medium text-end">Volume</th>
                  <th className="py-2.5 px-3 font-medium text-end">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)]">
                {data.authorizedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-3 text-center text-xs text-[var(--ks-text-muted)]">
                      No studio buyer records recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.authorizedCustomers.map((c) => (
                    <tr key={c.customerKey} className="hover:bg-[var(--ks-bg)]/70">
                      <td className="py-2.5 px-3 font-medium">{c.displayName}</td>
                      <td className="py-2.5 px-3 text-[var(--ks-text-secondary)]">{c.cityArea}</td>
                      <td className="py-2.5 px-3 font-mono-num tabular-nums text-end">
                        {c.orderCount}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num tabular-nums text-end">
                        {formatCurrency(c.totalSpentUsd, currency)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num tabular-nums text-end text-[var(--ks-text-muted)]">
                        {c.lastOrderDate.slice(0, 10)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Sales Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--ks-accent)]" />
              <h3 className="text-base font-medium">6-Month Studio Performance Report</h3>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsvReport}>
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
          <div className="overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Period</th>
                  <th className="py-2.5 px-3 font-medium text-end">Orders</th>
                  <th className="py-2.5 px-3 font-medium text-end">Studio GMV ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)]">
                {data.revenueSeries.map((pt) => (
                  <tr key={pt.month}>
                    <td className="py-2.5 px-3 font-mono-num font-medium">{pt.month}</td>
                    <td className="py-2.5 px-3 font-mono-num tabular-nums text-end">
                      {pt.orders}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num tabular-nums text-end font-semibold">
                      {formatCurrency(pt.gmv, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Store Settings */}
      {activeTab === 'store-settings' && settingsDraft && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-xl p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--ks-accent)]" />
            <h3 className="text-base font-medium">Store Identity &amp; Contact Settings</h3>
          </div>
          <Input
            label="Studio / Storefront Name"
            value={settingsDraft.studioName}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, studioName: e.target.value })
            }
          />
          <Input
            label="Merchant Dispatch Email"
            type="email"
            value={settingsDraft.contactEmail}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, contactEmail: e.target.value })
            }
          />
          <Input
            label="Standard Dispatch Lead Time"
            value={settingsDraft.dispatchLeadTime}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, dispatchLeadTime: e.target.value })
            }
          />
          <Button type="submit" variant="primary" size="md" disabled={savingId === 'settings'}>
            {savingId === 'settings' ? 'Saving...' : 'Save Store Settings'}
          </Button>

          <div className="pt-4 border-t border-[var(--ks-border)] space-y-2 text-xs">
            <p className="font-semibold">Seller Governance &amp; Commission Reference</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => navigate({ name: 'seller-agreement' })}
                className="underline text-[var(--ks-accent)] cursor-pointer"
              >
                Seller Marketplace Agreement
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'marketplace-terms' })}
                className="underline text-[var(--ks-accent)] cursor-pointer"
              >
                Marketplace Terms
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'prohibited-items' })}
                className="underline text-[var(--ks-accent)] cursor-pointer"
              >
                Prohibited Items
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'intellectual-property' })}
                className="underline text-[var(--ks-accent)] cursor-pointer"
              >
                IP Policy
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 9. Shipping Settings */}
      {activeTab === 'shipping-settings' && settingsDraft && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-xl p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[var(--ks-accent)]" />
            <h3 className="text-base font-medium">Seller Courier &amp; Pickup Preferences</h3>
          </div>
          <Select
            label="Primary Pickup Division"
            value={settingsDraft.pickupDivision}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, pickupDivision: e.target.value })
            }
            options={[
              { value: 'Dhaka', label: 'Dhaka Division' },
              { value: 'Chattogram', label: 'Chattogram Division' },
              { value: 'Sylhet', label: 'Sylhet Division' },
              { value: 'Rajshahi', label: 'Rajshahi Division' },
              { value: 'Khulna', label: 'Khulna Division' },
            ]}
          />
          <Input
            label="Preferred Courier Partners (CSV)"
            value={settingsDraft.preferredCouriers.join(', ')}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                preferredCouriers: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
          <label className="inline-flex items-start gap-2 text-xs leading-snug cursor-pointer">
            <input
              type="checkbox"
              checked={settingsDraft.codSupported}
              onChange={(e) =>
                setSettingsDraft({ ...settingsDraft, codSupported: e.target.checked })
              }
              className="mt-[2px] shrink-0"
            />
            <span>Enable Cash on Delivery (COD) for eligible Bangladesh orders</span>
          </label>
          <div>
            <Button type="submit" variant="primary" size="md" disabled={savingId === 'settings'}>
              Save Shipping Preferences
            </Button>
          </div>
        </form>
      )}

      {/* 10. Payout Information */}
      {activeTab === 'payouts' && settingsDraft && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-xl p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--ks-accent)]" />
            <h3 className="text-base font-medium">BDT Merchant Payout Settings</h3>
          </div>
          <Select
            label="Settlement Channel"
            value={settingsDraft.payoutChannel}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, payoutChannel: e.target.value })
            }
            options={[
              { value: 'Bangladesh Bank NPSB Transfer', label: 'Bangladesh Bank NPSB Transfer' },
              { value: 'bKash Merchant Wallet', label: 'bKash Merchant Wallet' },
              { value: 'Nagad Merchant Wallet', label: 'Nagad Merchant Wallet' },
            ]}
          />
          <Select
            label="Payout Schedule"
            value={settingsDraft.payoutSchedule}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, payoutSchedule: e.target.value })
            }
            options={[
              { value: 'Weekly (Sunday Settlement)', label: 'Weekly (Sunday Settlement)' },
              { value: 'Bi-Weekly (1st & 15th)', label: 'Bi-Weekly (1st & 15th)' },
            ]}
          />
          <Input
            label="Masked Destination Reference"
            value={settingsDraft.payoutAccountMasked}
            onChange={(e) =>
              setSettingsDraft({ ...settingsDraft, payoutAccountMasked: e.target.value })
            }
          />
          <Button type="submit" variant="primary" size="md" disabled={savingId === 'settings'}>
            Update Payout Preferences
          </Button>
        </form>
      )}

      {/* Add Seller Listing Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Publish New Seller Listing"
        maxWidthClass="max-w-xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Title"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Aeterna Reference Planar DAC"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium block">Department</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)]"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium block">Studio Photo Preset</span>
              <select
                value={newPreset}
                onChange={(e) => setNewPreset(e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)]"
              >
                {IMAGE_PRESET_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Unit Price (USD)"
              type="number"
              required
              min={1}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <Input
              label="Initial Stock"
              type="number"
              required
              min={1}
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              min="0.1"
              value={newWeightKg}
              onChange={(e) => setNewWeightKg(e.target.value)}
            />
            <Select
              label="Parcel Tier"
              value={newSizeTier}
              onChange={(e) => setNewSizeTier(e.target.value as ProductSizeTier)}
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'bulky', label: 'Bulky' },
                { value: 'freight', label: 'Freight' },
              ]}
            />
          </div>

          <label className="inline-flex items-start gap-2 text-xs leading-snug cursor-pointer">
            <input
              type="checkbox"
              checked={newCodEligible}
              onChange={(e) => setNewCodEligible(e.target.checked)}
              className="mt-[2px] shrink-0"
            />
            <span>Eligible for Bangladesh Cash on Delivery (COD)</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Card Spec Highlight 1"
              value={newHighlight1}
              onChange={(e) => setNewHighlight1(e.target.value)}
            />
            <Input
              label="Card Spec Highlight 2"
              value={newHighlight2}
              onChange={(e) => setNewHighlight2(e.target.value)}
            />
          </div>

          <Textarea
            label="Product Summary"
            required
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Concise summary describing materials, compatibility, and specifications..."
          />

          <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-[var(--ks-text-secondary)] select-none">
              <input
                type="checkbox"
                checked={newAcceptedSellerTerms}
                onChange={(e) => setNewAcceptedSellerTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--ks-action)] cursor-pointer"
              />
              <span>
                I certify this product is authentic, complies with{' '}
                <button
                  type="button"
                  onClick={() => openPolicyPreview('prohibited-items')}
                  className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                >
                  Prohibited Items
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => openPolicyPreview('product-safety')}
                  className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                >
                  Product Safety
                </button>{' '}
                rules, and binds my studio under the{' '}
                <button
                  type="button"
                  onClick={() => openPolicyPreview('seller-agreement')}
                  className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                >
                  Seller Marketplace Agreement
                </button>
                .
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="md" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={creatingProduct}>
              {creatingProduct ? 'Publishing...' : 'Publish to Storefront'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
