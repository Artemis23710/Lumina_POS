import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { dbService } from '../services/dbService';
import type { CartItem } from '../types';
import { ProductCard } from '../components/Checkout/ProductCard';
import { CartPanel } from '../components/Checkout/CartPanel';
import type { Customer } from './Customers';
import type { StoreConfig, DrawerSession } from './Settings';
import { ReceiptModal } from '../components/Checkout/ReceiptModal';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export function Checkout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // CRM, Discounts & Register Session State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  // Store configs & Cash drawer sessions
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    storeName: 'Lumina POS Store',
    taxRate: 8,
    currency: '$',
    address: '123 Business Rd, Suite 100',
    phone: '(555) 123-4567',
    receiptFooter: 'Thank you for shopping with us!'
  });
  const [activeDrawer, setActiveDrawer] = useState<DrawerSession | null>(null);

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<any>(null);

  // Load products, store settings, and active register session on mount
  useEffect(() => {
    const initCheckout = async () => {
      try {
        setIsLoadingProducts(true);

        // 1. Fetch products
        const list = await dbService.getProducts();
        const productsList: Product[] = list.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          stock: item.stock,
          image: item.image
        }));
        
        const categoriesSet = new Set<string>(['All']);
        productsList.forEach(p => categoriesSet.add(p.category));
        
        setProducts(productsList);
        setCategories(Array.from(categoriesSet));

        // 2. Fetch Store settings
        const config = await dbService.getStoreConfig();
        setStoreConfig(config);

        // 3. Check for open cash session
        const active = await dbService.getActiveDrawerSession();
        setActiveDrawer(active);

      } catch (error) {
        console.error('Error fetching products/settings:', error);
        toast.error('Failed to load checkout settings');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    initCheckout();
  }, [isReceiptOpen]); // Reload drawer status and inventory when closing/completing sale

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

  // Coupons Database mapping
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'SAVE10' || code === 'WELCOME10') {
      setAppliedCoupon(code);
      toast.success('Coupon Applied', { description: '10% discount has been applied to subtotal.' });
    } else if (code === 'WELCOME20') {
      setAppliedCoupon(code);
      toast.success('Coupon Applied', { description: 'Flat $20 discount has been applied.' });
    } else {
      toast.error('Invalid coupon code');
    }
  };

  // Checkout Totals Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const discount = useMemo(() => {
    let amt = 0;
    // 1. Check Coupon code discount
    if (appliedCoupon === 'SAVE10' || appliedCoupon === 'WELCOME10') {
      amt += subtotal * 0.10;
    } else if (appliedCoupon === 'WELCOME20') {
      amt += 20;
    }

    // 2. Check Customer loyalty points redemption (1 point = $0.10 discount)
    if (selectedCustomer && redeemPoints) {
      amt += selectedCustomer.loyaltyPoints * 0.10;
    }

    return Math.min(subtotal, amt); // Cap discount at subtotal
  }, [subtotal, appliedCoupon, selectedCustomer, redeemPoints]);

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (storeConfig.taxRate / 100);
  const total = taxableAmount + tax;

  const handleCheckout = async () => {
    if (!activeDrawer) {
      toast.error('Register Session Locked', {
        description: 'You cannot process transactions while the cash register is closed.'
      });
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Prepare order items
      const orderItems = cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }));

      // 2. Save order
      const orderId = await dbService.saveOrder({
        items: orderItems,
        subtotal: subtotal,
        discount: discount,
        appliedCoupon: appliedCoupon,
        tax: tax,
        total: total,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        status: 'completed',
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customerId: selectedCustomer ? selectedCustomer.id : null
      });

      // 3. Update stock levels
      for (const item of cartItems) {
        const list = await dbService.getProducts();
        const prod = list.find(p => p.id === item.product.id);
        if (prod) {
          const currentStock = prod.stock || 0;
          const updatedStock = Math.max(0, currentStock - item.quantity);
          await dbService.saveProduct({
            ...prod,
            stock: updatedStock
          }, prod.id);
        }
      }

      // 4. Update Customer Spending and loyalty points if customer linked
      let pointsEarned = 0;
      if (selectedCustomer) {
        pointsEarned = Math.floor(total / 10);
        const pointsRedeemed = redeemPoints ? selectedCustomer.loyaltyPoints : 0;
        
        await dbService.saveCustomer({
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email,
          totalSpent: selectedCustomer.totalSpent + total,
          ordersCount: selectedCustomer.ordersCount + 1,
          loyaltyPoints: Math.max(0, selectedCustomer.loyaltyPoints - pointsRedeemed + pointsEarned)
        }, selectedCustomer.id);
      }

      // 5. Audit log adjustment in Active Drawer Session
      if (activeDrawer && activeDrawer.id) {
        const updatedTransactions = [
          ...(activeDrawer.transactions || []),
          {
            type: 'sale' as const,
            amount: total,
            description: `Checkout transaction #${orderId.slice(0, 8).toUpperCase()}`,
            timestamp: new Date().toISOString()
          }
        ];
        await dbService.updateDrawerSession(activeDrawer.id, {
          transactions: updatedTransactions,
          expectedBalance: activeDrawer.expectedBalance + total
        });
      }

      // 6. Set receipt modal details
      setReceiptDetails({
        orderId: orderId,
        items: orderItems,
        subtotal,
        discount,
        couponCode: appliedCoupon || undefined,
        pointsRedeemed: redeemPoints ? selectedCustomer?.loyaltyPoints : undefined,
        tax,
        total,
        customer: selectedCustomer,
        pointsEarned
      });

      // 7. Clear cart & state triggers
      setCartItems([]);
      setSelectedCustomer(null);
      setRedeemPoints(false);
      setAppliedCoupon(null);
      setCouponCode('');
      
      // Open receipt layout
      setIsReceiptOpen(true);

      toast.success('Sale Completed Successfully!');
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error('Checkout failed', {
        description: 'An error occurred during payment processing. Please try again.'
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
          <p className="text-slate-600">Loading checkout catalogs...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row h-full w-full"
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header & Filters */}
        <div className="p-6 pb-4 bg-slate-50 z-10 sticky top-0 border-b border-slate-200/40">
          
          {/* Register locked warning indicator */}
          {!activeDrawer && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 px-4 text-xs text-amber-800 flex items-start gap-2 animate-pulse">
              <AlertTriangle className="flex-shrink-0 mt-0.5 text-amber-600" size={16} />
              <p>
                <strong>Cash register session locked:</strong> Transactions are running in simulator mode. Go to settings to start a register drawer session and unlock checkout functionality.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Checkout Terminal</h1>
              <p className="text-xs text-slate-400 font-medium">Quick order catalog & sales entry</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search catalog..."
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
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        redeemPoints={redeemPoints}
        onToggleRedeemPoints={setRedeemPoints}
        couponCode={couponCode}
        onCouponChange={setCouponCode}
        onApplyCoupon={handleApplyCoupon}
        appliedCoupon={appliedCoupon}
        discount={discount}
        tax={tax}
        total={total}
        subtotal={subtotal}
        config={{
          taxRate: storeConfig.taxRate,
          currency: storeConfig.currency
        }}
        isDrawerOpen={!!activeDrawer}
      />

      {/* Receipt Dialog Modal */}
      {receiptDetails && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setReceiptDetails(null);
          }}
          orderId={receiptDetails.orderId}
          items={receiptDetails.items}
          subtotal={receiptDetails.subtotal}
          discount={receiptDetails.discount}
          couponCode={receiptDetails.couponCode}
          pointsRedeemed={receiptDetails.pointsRedeemed}
          tax={receiptDetails.tax}
          total={receiptDetails.total}
          customer={receiptDetails.customer}
          pointsEarned={receiptDetails.pointsEarned}
          config={storeConfig}
        />
      )}
    </motion.div>
  );
}