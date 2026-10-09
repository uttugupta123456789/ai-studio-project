import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  X,
  ExternalLink,
} from 'lucide-react';
import { Product, AvailabilityStatus } from '../types';
import { createProduct, updateProduct, deleteProduct } from '../lib/dataService';
import { ConfirmModal } from './ConfirmModal';

interface ProductsViewProps {
  products: Product[];
  onRefresh: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Laptops');
  const [price, setPrice] = useState<number | ''>(50000);
  const [availability, setAvailability] = useState<AvailabilityStatus>('Available');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [stockCount, setStockCount] = useState<number | ''>(10);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'All' || p.availability === availabilityFilter;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Laptops');
    setPrice(45000);
    setAvailability('Available');
    setDescription('');
    setBrand('');
    setSku('');
    setStockCount(10);
    setImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price);
    setAvailability(p.availability);
    setDescription(p.description);
    setBrand(p.brand || '');
    setSku(p.sku || '');
    setStockCount(p.stockCount ?? 0);
    setImageUrl(p.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || Number(price) <= 0) return;

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: name.trim(),
          category,
          price: Number(price),
          availability,
          description: description.trim(),
          brand: brand.trim() || undefined,
          sku: sku.trim() || undefined,
          stockCount: stockCount === '' ? 0 : Number(stockCount),
          imageUrl: imageUrl.trim() || undefined,
        });
      } else {
        await createProduct({
          name: name.trim(),
          category,
          price: Number(price),
          availability,
          description: description.trim(),
          brand: brand.trim() || undefined,
          sku: sku.trim() || undefined,
          stockCount: stockCount === '' ? 0 : Number(stockCount),
          imageUrl: imageUrl.trim() || undefined,
        });
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      if (selectedProduct?.id === productToDelete.id) {
        setSelectedProduct(null);
      }
      setProductToDelete(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getAvailabilityBadge = (st: AvailabilityStatus) => {
    switch (st) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Available
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertOctagon className="w-3 h-3" />
            Out of Stock
          </span>
        );
      case 'Discontinued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Discontinued
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Product Catalogue Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage electronic products, specifications, inventory pricing in INR, and stock statuses
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, brand, SKU, specs..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Availability:</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>
            Found <strong className="text-slate-200">{filteredProducts.length}</strong> products
          </span>
          <span className="text-indigo-400">
            Total Catalogue Value: ₹
            {filteredProducts
              .reduce((acc, p) => acc + p.price * (p.stockCount || 1), 0)
              .toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all group"
          >
            {/* Image / Thumbnail */}
            <div className="relative h-44 bg-slate-950 overflow-hidden">
              {prod.imageUrl ? (
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950">
                  <Package className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-2.5 right-2.5">
                {getAvailabilityBadge(prod.availability)}
              </div>
              <div className="absolute bottom-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-xs text-slate-300 border border-white/10">
                  {prod.category}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-slate-100 line-clamp-1">{prod.name}</h3>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  SKU: {prod.sku || prod.id} {prod.brand ? `· ${prod.brand}` : ''}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {prod.description}
                </p>
              </div>

              {/* Price and Stock */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Price (INR)
                  </span>
                  <span className="text-base font-bold text-indigo-400">
                    ₹{prod.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Stock
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {prod.stockCount ?? 0} units
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedProduct(prod)}
                className="text-slate-300 hover:text-white font-medium"
              >
                View Specs
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(prod)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Edit product"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setProductToDelete(prod)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No products match the selected filters.
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                {selectedProduct.name}
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-xl border border-slate-800 mb-3"
                />
              )}

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold text-[10px]">
                    Price (INR)
                  </span>
                  <span className="text-sm font-bold text-indigo-400">
                    ₹{selectedProduct.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold text-[10px]">
                    Availability
                  </span>
                  <span className="mt-0.5 block">{getAvailabilityBadge(selectedProduct.availability)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold text-[10px]">
                    Category
                  </span>
                  <span className="text-slate-200 font-medium">{selectedProduct.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold text-[10px]">
                    Stock Inventory
                  </span>
                  <span className="text-slate-200 font-medium">
                    {selectedProduct.stockCount ?? 0} available units
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1">
                  Description
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {selectedProduct.description}
                </p>
              </div>

              {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-2">
                    Key Technical Specifications
                  </span>
                  <div className="divide-y divide-slate-850 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                    {Object.entries(selectedProduct.specs).map(([specKey, specVal]) => (
                      <div key={specKey} className="flex justify-between p-2.5">
                        <span className="text-slate-400">{specKey}</span>
                        <span className="text-slate-200 font-medium">{specVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  openEditModal(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Product
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                {editingProduct ? 'Edit Product Item' : 'Add New Electronics Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asus Vivobook 15 (Core i5, 16GB, 512GB)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Laptops">Laptops</option>
                    <option value="Smartphones">Smartphones</option>
                    <option value="Audio">Audio</option>
                    <option value="Keyboards & Accessories">Keyboards & Accessories</option>
                    <option value="Monitors">Monitors</option>
                    <option value="Smartwatches">Smartwatches</option>
                    <option value="Cameras">Cameras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Price in INR (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 44990"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Asus, Apple, Dell"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. LAP-ASU-V15"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key features, warranty, specs..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Delete Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" from your catalog? This cannot be undone.`}
        confirmLabel="Delete Product"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
