import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../../types';

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout
}: CartPanelProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className="w-full lg:w-[30%] min-w-[320px] bg-white border-l border-slate-200 flex flex-col h-full shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center">
          Current Order
          <span className="ml-3 bg-indigo-100 text-indigo-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {items.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium">Your cart is empty</p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.95
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: {
                    duration: 0.2
                  }
                }}
                className="flex items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-50"
                />

                <div className="ml-3 flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-sm text-indigo-600 font-semibold">
                    ${item.product.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col items-end ml-2 space-y-2">
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    aria-label="Remove item">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                      aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium text-slate-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
                      aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Subtotal</span>
            <span className="font-medium text-slate-700">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Tax (8%)</span>
            <span className="font-medium text-slate-700">
              ${tax.toFixed(2)}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-slate-900 font-medium">Total</span>
            <span className="text-2xl font-bold text-slate-900">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-sm shadow-indigo-200 flex items-center justify-center">
          Pay Now
        </button>
      </div>
    </div>
  );
}