import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, X, CheckCircle } from 'lucide-react';
import type { Customer } from '../../pages/Customers';
import type { StoreConfig } from '../../pages/Settings';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  items: any[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  pointsRedeemed?: number;
  tax: number;
  total: number;
  customer: Customer | null;
  pointsEarned: number;
  config: StoreConfig;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  orderId,
  items,
  subtotal,
  discount,
  couponCode,
  pointsRedeemed,
  tax,
  total,
  customer,
  pointsEarned,
  config
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // We print the receipt using custom window print
    window.print();
  };

  const handleDownloadTxt = () => {
    if (!receiptRef.current) return;
    
    // Generate text receipt
    let text = `==================================\n`;
    text += `       ${config.storeName.toUpperCase()}\n`;
    text += `   ${config.address}\n`;
    text += `   Phone: ${config.phone}\n`;
    text += `==================================\n`;
    text += `Receipt ID: #${orderId.toUpperCase()}\n`;
    text += `Date: ${new Date().toLocaleString()}\n`;
    if (customer) {
      text += `Customer: ${customer.name}\n`;
    }
    text += `----------------------------------\n`;
    items.forEach((item) => {
      const name = item.productName || item.product.name;
      text += `${name.padEnd(20)} x${item.quantity}\n`;
      text += `  @ ${config.currency}${item.price.toFixed(2)}    ${config.currency}${item.subtotal.toFixed(2)}\n`;
    });
    text += `----------------------------------\n`;
    text += `Subtotal:      ${config.currency}${subtotal.toFixed(2)}\n`;
    if (discount > 0) {
      text += `Discount:     -${config.currency}${discount.toFixed(2)}\n`;
    }
    text += `Tax (${config.taxRate}%):   ${config.currency}${tax.toFixed(2)}\n`;
    text += `==================================\n`;
    text += `TOTAL:         ${config.currency}${total.toFixed(2)}\n`;
    text += `==================================\n`;
    if (customer) {
      text += `Points Earned: +${pointsEarned}\n`;
    }
    text += `\n   ${config.receiptFooter}\n`;
    text += `==================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `receipt_${orderId.slice(0, 8)}.txt`;
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] print:hidden"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto print:absolute print:inset-0 print:p-0 print:bg-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:rounded-none print:max-h-none print:w-auto print:h-auto"
            >
              
              {/* Checkout Status Header (Hidden during printing) */}
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="text-emerald-600" size={24} />
                  <div>
                    <h3 className="font-bold text-slate-900">Sale Complete</h3>
                    <p className="text-xs text-slate-500">Order ID: #{orderId.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Thermal Receipt Layout */}
              <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
                <div 
                  ref={receiptRef}
                  className="receipt-print-area max-w-[80mm] mx-auto bg-white text-black p-4 font-mono text-xs border border-dashed border-slate-200 shadow-inner rounded-xl print:border-none print:shadow-none print:rounded-none print:p-2"
                >
                  {/* Store Info */}
                  <div className="text-center space-y-1 mb-4">
                    <h2 className="text-sm font-bold tracking-wider uppercase">{config.storeName}</h2>
                    <p className="text-[10px] leading-tight text-slate-600 print:text-black">{config.address}</p>
                    <p className="text-[10px] text-slate-600 print:text-black">Tel: {config.phone}</p>
                  </div>

                  {/* Divider */}
                  <div className="border-b border-dashed border-black/30 my-3" />

                  {/* Transaction Metadata */}
                  <div className="space-y-1 text-[10px] text-slate-700 print:text-black">
                    <div className="flex justify-between">
                      <span>Receipt ID:</span>
                      <span className="font-semibold text-black">#{orderId.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date / Time:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    {customer && (
                      <div className="flex justify-between border-t border-slate-100/50 mt-1 pt-1">
                        <span>Linked Customer:</span>
                        <span className="font-semibold text-black">{customer.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-b border-dashed border-black/30 my-3" />

                  {/* Itemized List */}
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200 font-bold text-black">
                        <th className="pb-1">Item Desc</th>
                        <th className="pb-1 text-center">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                        <th className="pb-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/30">
                      {items.map((item, idx) => {
                        const name = item.productName || item.product.name;
                        return (
                          <tr key={idx} className="align-top">
                            <td className="py-2 pr-1">{name}</td>
                            <td className="py-2 text-center">x{item.quantity}</td>
                            <td className="py-2 text-right">{config.currency}{item.price.toFixed(2)}</td>
                            <td className="py-2 text-right font-medium text-black">{config.currency}{item.subtotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Divider */}
                  <div className="border-b border-dashed border-black/30 my-3" />

                  {/* Totals */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{config.currency}{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600 print:text-black">
                        <span>
                          Discount {couponCode ? `(${couponCode})` : ''} 
                          {pointsRedeemed ? ' (Loyalty Redeem)' : ''}:
                        </span>
                        <span>-{config.currency}{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Sales Tax ({config.taxRate}%):</span>
                      <span>{config.currency}{tax.toFixed(2)}</span>
                    </div>

                    <div className="border-b border-dashed border-black/20 my-2" />

                    <div className="flex justify-between text-sm font-bold text-black border-t border-double border-black pt-1.5">
                      <span>GRAND TOTAL:</span>
                      <span>{config.currency}{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-b border-dashed border-black/30 my-3" />

                  {/* Footer Loyalty */}
                  {customer && (
                    <div className="bg-slate-50 print:bg-white border border-slate-100 print:border-none p-2 rounded-lg text-center text-[10px] space-y-0.5 mb-3">
                      <p className="font-semibold text-black">Loyalty Points Balance</p>
                      <p className="text-indigo-600 font-bold print:text-black">
                        Earned: +{pointsEarned} | Current Total: {customer.loyaltyPoints + pointsEarned - (pointsRedeemed || 0)}
                      </p>
                    </div>
                  )}

                  {/* Receipt Footer Message */}
                  <div className="text-center text-[9px] text-slate-500 print:text-black mt-3 leading-tight">
                    <p>{config.receiptFooter}</p>
                    <p className="mt-1 font-bold text-[7px] text-slate-400 print:text-black tracking-widest">LUMINA POS PLATFORM</p>
                  </div>

                </div>
              </div>

              {/* Action Buttons (Hidden during printing) */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3 print:hidden">
                <button
                  onClick={handleDownloadTxt}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors"
                >
                  <Download size={14} /> Save Text
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-indigo-100"
                >
                  <Printer size={14} /> Print Receipt
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
