import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { mockProducts, categories } from '../data/mockData';
import { Product, CartItem } from '../types';
import { ProductCard } from '../components/Checkout/ProductCard';
import { CartPanel } from '../components/Checkout/CartPanel';
export function Checkout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = product.name.
      toLowerCase().
      includes(searchQuery.toLowerCase());
      const matchesCategory =
      activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
        item.product.id === product.id ?
        {
          ...item,
          quantity: item.quantity + 1
        } :
        item
        );
      }
      return [
      ...prev,
      {
        product,
        quantity: 1
      }];

    });
  };
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
    prev.
    map((item) => {
      if (item.product.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity
        };
      }
      return item;
    }).
    filter((item) => item.quantity > 0)
    );
  };
  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== id));
  };
  const handleCheckout = () => {
    toast.success('Payment successful!', {
      description: `Order completed for $${(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 1.08).toFixed(2)}`
    });
    setCartItems([]);
  };
  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      className="flex flex-col lg:flex-row h-full w-full">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header & Filters */}
        <div className="p-6 pb-4 bg-slate-50 z-10 sticky top-0">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20} />
              
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" />
              
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            {categories.map((category) =>
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}>
              
                {category}
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            
            {filteredProducts.map((product) =>
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAddToCart} />

            )}
          </motion.div>
          {filteredProducts.length === 0 &&
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>No products found matching your search.</p>
            </div>
          }
        </div>
      </div>

      {/* Cart Panel */}
      <CartPanel
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        onCheckout={handleCheckout} />
      
    </motion.div>);

}