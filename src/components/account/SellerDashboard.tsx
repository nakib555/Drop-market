import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Package, Plus, RefreshCw, Search, Store, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import {
  createSellerProductApi,
  fetchSellerDashboardApi,
  updateOrderStatusApi,
  updateSellerProductApi,
} from '../../services/api';
import { OrderStage, ProductSizeTier, SellerDashboardData } from '../../types/commerce';
import { formatCurrency } from '../../utils/format';
import { IMAGE_PRESET_OPTIONS, resolveImagePreset } from '../../utils/imagePresets';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { Modal, ResilientImage, SkeletonLoader } from '../ui/Primitives';

export const SellerDashboard: React.FC = () => {
  const { currency, categories, showToast, refreshStorefrontSync, refreshOrders, navigate } =
    useStore();

  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState<'inventory' | 'fulfillment'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

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
  const [creatingProduct, setCreatingProduct] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSellerDashboardApi();
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reach Seller API endpoint.'
      );
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
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0 || Number.isNaN(parsedStock) || parsedStock < 0) {
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
      showToast('Inventory synced to storefront', 'Live price & stock updated via API.', 'success');
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
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
      });
      setAddModalOpen(false);
      setNewName('');
      setNewDesc('');
      await Promise.all([loadDashboard(), refreshStorefrontSync()]);
      showToast(
        'Product published live',
        `${created.name} is now discoverable in the storefront catalog.`,
        'success'
      );
    } catch (err) {
      showToast('Publish failed', err instanceof Error ? err.message : 'Check fields.', 'error');
    } finally {
      setCreatingProduct(false);
    }
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
      <div className="p-6 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] space-y-3">
        <p className="text-sm font-medium text-[#B91C1C] dark:text-[#F87171]">
          {error || 'Seller dashboard unavailable'}
        </p>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  const maxSeries = Math.max(...data.revenueSeries.map((r) => r.gmv), 1);

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] inline-flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" /> Seller Studio Portal
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">{data.studioName}</h2>
          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
            Operator: {data.ownerName} · Live API Inventory &amp; Dispatch Sync
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Listing</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">30-Day Studio GMV</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {formatCurrency(data.kpis.monthlyGmv, currency)}
          </p>
          <p className="text-[11px] text-[#1F6E43] dark:text-[#4ADE80] mt-1 font-mono-num">
            {data.kpis.avgRating.toFixed(2)} ★ Partner Score
          </p>
        </div>
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Active Listings</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {data.kpis.activeListings}
          </p>
          <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] mt-1">
            Synced with live catalog
          </p>
        </div>
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Pending Fulfillment</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {data.kpis.pendingFulfillment}
          </p>
          <p className="text-[11px] text-[#B45309] dark:text-[#FBBF24] mt-1">
            Awaiting carrier dispatch
          </p>
        </div>
        <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs text-[#84827B]">Low Stock SKUs</p>
          <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-1">
            {data.kpis.lowStockSkus}
          </p>
          <p className="text-[11px] text-[#84827B] mt-1">Threshold ≤ 8 units</p>
        </div>
      </div>

      {/* 6-Month Revenue Strip */}
      <div className="p-5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Monthly Studio Volume ({currency})</h3>
          <span className="text-xs font-mono-num text-[#84827B]">Jun – Nov 2026</span>
        </div>
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-28 pt-2">
          {data.revenueSeries.map((point) => {
            const pct = Math.max(18, Math.round((point.gmv / maxSeries) * 100));
            return (
              <div key={point.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono-num text-[#5C5B57] dark:text-[#A3A19B] hidden sm:inline">
                  {formatCurrency(point.gmv, currency)}
                </span>
                <div
                  className="w-full max-w-[40px] rounded-t-sm bg-[#8F6438] dark:bg-[#C89B67] transition-all duration-300"
                  style={{ height: `${pct}%` }}
                  title={`${point.month}: ${formatCurrency(point.gmv, currency)}`}
                />
                <span className="text-[11px] font-mono-num text-[#84827B]">{point.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        {(
          [
            { id: 'inventory', label: `Inventory (${data.inventory.length})` },
            { id: 'fulfillment', label: `Fulfillment Queue (${data.fulfillmentQueue.length})` },
          ] as const
        ).map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`relative pb-3 text-sm font-medium cursor-pointer transition-colors ${
                active
                  ? 'text-[#171716] dark:text-[#F4F3EF]'
                  : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
              }`}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId="seller-sub-tab"
                  transition={STUDIO_TRANSITION.springTab}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#171716] dark:bg-[#F4F3EF]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Inventory Table */}
      {subTab === 'inventory' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-[#84827B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SKU, product name, or category..."
              className="w-full h-10 pl-9 pr-3 text-xs rounded-md bg-white dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">SKU</th>
                  <th className="py-2.5 px-3 font-medium text-right">Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">Stock</th>
                  <th className="py-2.5 px-3 font-medium">State</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-3 text-center text-xs text-[#84827B]">
                      No inventory listings match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-[#F9F8F6]/70 dark:hover:bg-[#1F1F1C]/60">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <ResilientImage
                              src={resolveImagePreset(item.imagePresetKey, item.category)}
                              alt={item.name}
                              className="w-9 h-7 rounded-sm object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-[#171716] dark:text-[#F4F3EF] truncate max-w-[220px]">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#84827B]">{item.categoryLabel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-[#5C5B57] dark:text-[#A3A19B] whitespace-nowrap">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-right whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              aria-label={`Price for ${item.name}`}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 h-7 px-2 text-right rounded border border-[#171716] dark:border-[#F4F3EF] bg-white dark:bg-[#141413]"
                            />
                          ) : (
                            formatCurrency(item.price, currency)
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num text-right whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              aria-label={`Stock for ${item.name}`}
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-16 h-7 px-2 text-right rounded border border-[#171716] dark:border-[#F4F3EF] bg-white dark:bg-[#141413]"
                            />
                          ) : (
                            item.stockCount
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              item.stockCount <= 0
                                ? 'text-[#B91C1C] dark:text-[#F87171]'
                                : item.stockCount <= 8
                                ? 'text-[#B45309] dark:text-[#FBBF24]'
                                : 'text-[#1F6E43] dark:text-[#4ADE80]'
                            }`}
                          >
                            {item.stockCount <= 0
                              ? 'Out of Stock'
                              : item.stockCount <= 8
                              ? 'Low Stock'
                              : 'In Stock'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                variant="primary"
                                size="xs"
                                disabled={savingId === item.id}
                                onClick={() => handleSaveInline(item.id)}
                              >
                                <Check className="w-3 h-3" />
                                <span>Save</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] px-1.5 cursor-pointer"
                              >
                                Cancel
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
                              className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] hover:underline cursor-pointer"
                            >
                              Edit Stock / Price
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

      {/* Fulfillment Queue */}
      {subTab === 'fulfillment' && (
        <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-medium">Order</th>
                <th className="py-2.5 px-3 font-medium">Customer</th>
                <th className="py-2.5 px-3 font-medium">Destination</th>
                <th className="py-2.5 px-3 font-medium text-right">Total</th>
                <th className="py-2.5 px-3 font-medium">Current Stage</th>
                <th className="py-2.5 px-3 font-medium text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
              {data.fulfillmentQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-3 text-center text-xs text-[#84827B]">
                    All orders in your fulfillment queue have been dispatched.
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
                      <td className="py-2.5 px-3 whitespace-nowrap">{ord.customerName}</td>
                      <td className="py-2.5 px-3 text-[#5C5B57] dark:text-[#A3A19B] whitespace-nowrap">
                        {ord.shippingAddress.city}, {ord.shippingAddress.country}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right whitespace-nowrap">
                        {formatCurrency(ord.total, currency)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">{ord.currentStage}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
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
                          <span className="inline-flex items-center gap-1 text-[#84827B]">
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
                className="w-full h-10 px-3 text-sm rounded-md bg-white dark:bg-[#141413] border border-[#DCD9D0] dark:border-[#2E2E2A]"
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
                className="w-full h-10 px-3 text-sm rounded-md bg-white dark:bg-[#141413] border border-[#DCD9D0] dark:border-[#2E2E2A]"
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

          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={newCodEligible}
              onChange={(e) => setNewCodEligible(e.target.checked)}
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
            placeholder="Concise summary describing materials, compatibility, and craftsmanship..."
          />

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
