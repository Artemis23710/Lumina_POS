import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingCart, CheckCircle, Tag, AlertCircle } from 'lucide-react';
import type { CartItem } from '../../types';
import type { Customer } from '../../pages/Customers';
import { CustomerSelect } from './CustomerSelect';

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  isProcessing?: boolean;
  
  // Custom configurations & state
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  redeemPoints: boolean;
  onToggleRedeemPoints: (redeem: boolean) => void;
  couponCode: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
  appliedCoupon: string | null;
  discount: number;
  tax: number;
  total: number;
  subtotal: number;
  config: {
    taxRate: number;
    currency: string;
  };
  isDrawerOpen: boolean;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isProcessing = false,
  selectedCustomer,
  onSelectCustomer,
  redeemPoints,
  onToggleRedeemPoints,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  appliedCoupon,
  discount,
  tax,
  total,
  subtotal,
  config,
  isDrawerOpen
}: CartPanelProps) {
  return (
    <div className="w-full lg:w-96 lg:border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-indigo-100/50">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <ShoppingCart size={20} />
        </div>
        <div>
          <h2 className="text-md font-bold text-slate-900">Current Sale</h2>
          <p className="text-xs text-slate-500 font-medium">{items.length} unique items</p>
        </div>
      </div>

      {/* Register Lock Warning */}
      {!isDrawerOpen && (
        <div className="bg-red-50 border-b border-red-200 p-3 px-5 flex items-start gap-2.5 text-xs text-red-800">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-red-600" size={16} />
          <div>
            <p className="font-semibold">Register Locked</p>
            <p className="text-[10px] text-red-700/80">Go to settings to start a register session and unlock checkouts.</p>
          </div>
        </div>
      )}

      {/* Scrollable Cart Content */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        
        {/* CRM Customer Linking widget */}
        <CustomerSelect
          selectedCustomer={selectedCustomer}
          onSelectCustomer={onSelectCustomer}
          redeemPoints={redeemPoints}
          onToggleRedeemPoints={onToggleRedeemPoints}
          currencySymbol={config.currency}
        />

        {/* Cart Items List */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Line Items</label>
          <AnimatePresence mode="popLayout">
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-all flex gap-3"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        {config.currency}{item.product.price.toFixed(2)} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            disabled={isProcessing}
                            className="p-1 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-xs font-semibold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            disabled={isProcessing || item.quantity >= item.product.stock}
                            className="p-1 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(item.product.id)}
                          disabled={isProcessing}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200"
              >
                <ShoppingCart className="text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-xs font-medium">Cart is currently empty</p>
                <p className="text-slate-400 text-[10px] mt-1 max-w-[200px] mx-auto">
                  Click on catalog items on the left to start billing order lines.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Promo Coupons and Discounts Widget */}
        {items.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Tag size={12} className="text-indigo-500" /> Apply Discount Coupon
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WELCOME10, SAVE10"
                value={couponCode}
                onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs transition-all uppercase placeholder-slate-400"
              />
              <button
                type="button"
                onClick={onApplyCoupon}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                ✓ Coupon "{appliedCoupon}" Applied
              </p>
            )}
          </div>
        )}
      </div>

      {/* Summary & Checkout Footer */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-200 p-4 space-y-4 bg-slate-50"
        >
          {/* Summary Details */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-900 font-semibold">
                {config.currency}{subtotal.toFixed(2)}
              </span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Discount</span>
                <span>
                  -{config.currency}{discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-500">Tax ({config.taxRate}%)</span>
              <span className="text-slate-900 font-semibold">
                {config.currency}{tax.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-3 flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Amount</span>
            <span className="text-2xl font-extrabold text-indigo-600">
              {config.currency}{total.toFixed(2)}
            </span>
          </div>

          {/* Checkout Trigger */}
          <motion.button
            whileHover={!isProcessing && isDrawerOpen ? { scale: 1.02 } : {}}
            whileTap={!isProcessing && isDrawerOpen ? { scale: 0.98 } : {}}
            onClick={onCheckout}
            disabled={isProcessing || !isDrawerOpen || items.length === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing checkout...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Complete Transaction
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}