import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingCart, CheckCircle } from 'lucide-react';
import type { CartItem } from '../../types';

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  isProcessing?: boolean;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isProcessing = false
}: CartPanelProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="w-full lg:w-80 lg:border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
        <ShoppingCart className="text-indigo-600" size={24} />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
          <p className="text-sm text-slate-600">{items.length} items</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.length > 0 ? (
            <motion.div className="p-4 space-y-3">
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                  <div className="flex gap-3">
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
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-900">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">
                        ${item.product.price.toFixed(2)} each
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            disabled={isProcessing}
                            className="p-1 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity">
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            disabled={isProcessing || item.quantity >= item.product.stock}
                            className="p-1 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Increase quantity">
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(item.product.id)}
                          disabled={isProcessing}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Remove ${item.product.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <p className="text-xs text-slate-600 mt-2 font-medium">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center p-6 text-center">
              <ShoppingCart className="text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 text-sm">Your cart is empty</p>
              <p className="text-slate-400 text-xs mt-1">
                Add items from the menu to get started
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary & Checkout */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
          {/* Summary Details */}
          <div className="space-y-2 py-3 border-b border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900 font-medium">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tax (8%)</span>
              <span className="text-slate-900 font-medium">
                ${tax.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Checkout Button */}
          <motion.button
            whileHover={!isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isProcessing ? { scale: 0.98 } : {}}
            onClick={onCheckout}
            disabled={isProcessing || items.length === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Complete Order
              </>
            )}
          </motion.button>

          {/* Stock Warning */}
          {items.some(
            (item) => item.quantity >= item.product.stock
          ) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
              ⚠️ Some items are at maximum available quantity
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}