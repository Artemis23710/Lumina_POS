import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { collection, getDocs, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CartItem } from '../types';
import { ProductCard } from '../components/Checkout/ProductCard';
import { CartPanel } from '../components/Checkout/CartPanel';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export function Checkout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const productsList: Product[] = [];
        const categoriesSet = new Set<string>(['All']);
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          productsList.push({
            id: doc.id,
            name: data.name,
            category: data.category,
            price: data.price,
            stock: data.stock,
            image: data.image
          });
          categoriesSet.add(data.category);
        });
        
        setProducts(productsList);
        setCategories(Array.from(categoriesSet));
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, products]);

  const handleAddToCart = (product: Product) => {
    // Check stock availability
    const cartQuantity = cartItems
      .filter(item => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (cartQuantity >= product.stock) {
      toast.error('Not enough stock', {
        description: `Only ${product.stock} items available`
      });
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1
        }
      ];
    });
    
    toast.success('Added to cart', {
      description: `${product.name} added to your cart`
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === id) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return {
              ...item,
              quantity: newQuantity
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    const product = cartItems.find(item => item.product.id === id)?.product;
    setCartItems((prev) => prev.filter((item) => item.product.id !== id));
    if (product) {
      toast.success('Removed from cart', {
        description: `${product.name} removed from your cart`
      });
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty', {
        description: 'Add items to your cart before checking out'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate totals
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const tax = subtotal * 0.08;
      const total = subtotal + tax;

      // Prepare order items
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }));

      // Save order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        status: 'completed',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Success
      toast.success('Payment successful!', {
        description: `Order #${orderRef.id.slice(0, 8).toUpperCase()} completed for $${total.toFixed(2)}`
      });

      // Clear cart
      setCartItems([]);
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error('Checkout failed', {
        description: 'Please try again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingProducts) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600">Loading products...</p>
        </div>
      </motion.div>
    );
  }

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
                size={20}
              />

              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}>
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {filteredProducts.length > 0 ? (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAddToCart}
                />
              ))}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>
                {products.length === 0
                  ? 'No products available. Please add products in inventory.'
                  : 'No products found matching your search.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <CartPanel
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveItem}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />
    </motion.div>
  );
}