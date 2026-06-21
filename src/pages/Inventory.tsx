import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import { dbService } from '../services/dbService';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

interface SuccessAlert {
  type: 'add' | 'update' | 'delete';
  productName: string;
}

const CATEGORIES = ['Food', 'Drinks', 'Snacks', 'Desserts'];

export function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ id: string; name: string } | null>(null);
  const [successAlert, setSuccessAlert] = useState<SuccessAlert | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    price: '',
    stock: '',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  // Auto-hide success alert after 3 seconds
  useEffect(() => {
    if (successAlert) {
      const timer = setTimeout(() => {
        setSuccessAlert(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successAlert]);

  const fetchProducts = async () => {
    try {
      setIsFetchingProducts(true);
      const list = await dbService.getProducts();
      setProducts(list);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    }
    if (stock < 10) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        In Stock
      </span>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          image: result
        }));
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: CATEGORIES[0],
      price: '',
      stock: '',
      image: ''
    });
    setImagePreview('');
    setEditingProductId(null);
  };

  const handleAddClick = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image
    });
    setImagePreview(product.image);
    setEditingProductId(product.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock || !formData.image) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image: formData.image
      };

      await dbService.saveProduct(productData, editingProductId);
      
      setSuccessAlert({
        type: editingProductId ? 'update' : 'add',
        productName: formData.name
      });

      resetForm();
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setDeleteConfirmData({ id: productId, name: productName });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmData) return;

    try {
      const productName = deleteConfirmData.name;
      await dbService.deleteProduct(deleteConfirmData.id);
      
      setIsDeleteConfirmOpen(false);
      
      setSuccessAlert({
        type: 'delete',
        productName: productName
      });
      
      setDeleteConfirmData(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  };

  return (
    <>
      <motion.div
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your products, pricing, and stock levels.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
                aria-hidden="true"
              />

              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-sm"
              />
            </div>
            <button
              onClick={handleAddClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center transition-colors shadow-sm shadow-indigo-200 whitespace-nowrap text-sm"
              aria-label="Add new product">
              <Plus size={18} className="mr-2" aria-hidden="true" />
              Add Product
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            {isFetchingProducts ? (
              <div className="p-12 text-center text-slate-500">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <p className="mt-3">Loading products...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Stock Level</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3C/svg%3E';
                            }}
                          />

                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              ID: {product.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 w-8">
                            {product.stock}
                          </span>
                          {getStockBadge(product.stock)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            aria-label={`Edit ${product.name}`}>
                            <Edit2 size={16} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product.id, product.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={`Delete ${product.name}`}>
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!isFetchingProducts && filteredProducts.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                {products.length === 0 ? 'No products yet. Add one to get started!' : 'No products found matching your search.'}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Success Alert */}
      <AnimatePresence>
        {successAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-4 right-4 z-50 max-w-sm">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-4 border-b border-emerald-200 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {successAlert.type === 'add' && 'Product Added Successfully'}
                    {successAlert.type === 'update' && 'Product Updated Successfully'}
                    {successAlert.type === 'delete' && 'Product Deleted Successfully'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {successAlert.type === 'add' && `"${successAlert.productName}" has been added to your inventory.`}
                    {successAlert.type === 'update' && `"${successAlert.productName}" has been updated successfully.`}
                    {successAlert.type === 'delete' && `"${successAlert.productName}" has been removed from your inventory.`}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: 'linear' }}
                className="h-1 bg-emerald-500 origin-left"
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}>
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingProductId ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={() => {
                      resetForm();
                      setIsFormOpen(false);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    aria-label="Close form">
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Product Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Avocado Toast"
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white disabled:bg-slate-50 disabled:cursor-not-allowed">
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-2">
                      Price (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={isLoading}
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-slate-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="e.g., 45"
                      min="0"
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-slate-700 mb-3">
                      Product Image * {editingProductId && <span className="text-xs text-slate-500">(Upload new image to change)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isLoading}
                        className="hidden"
                        aria-label="Upload product image"
                      />
                      <label
                        htmlFor="image"
                        className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl transition-all cursor-pointer group ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50/30'
                        }`}>
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-slate-700">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-4 flex flex-col items-center gap-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-lg object-cover border-2 border-indigo-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, image: '' }));
                            setImagePreview('');
                          }}
                          disabled={isLoading}
                          className="text-xs text-slate-500 hover:text-slate-700 underline disabled:cursor-not-allowed disabled:opacity-50">
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsFormOpen(false);
                      }}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm shadow-indigo-200 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {editingProductId ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        editingProductId ? 'Update Product' : 'Add Product'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && deleteConfirmData && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeleteConfirmData(null);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              aria-hidden="true"
            />

            {/* Confirmation Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setDeleteConfirmData(null);
              }}>
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                      <Trash2 className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Delete Product?</h3>
                      <p className="text-sm text-slate-600">This action cannot be undone.</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <p className="text-slate-700">
                    Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteConfirmData.name}"</span>? This product will be permanently removed from your inventory.
                  </p>
                </div>

                {/* Actions */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3">
                  <button
                    onClick={() => {
                      setIsDeleteConfirmOpen(false);
                      setDeleteConfirmData(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-medium text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm shadow-red-200">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}