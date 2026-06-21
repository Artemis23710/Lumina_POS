import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { Users, Search, X, Award } from 'lucide-react';
import type { Customer } from '../../pages/Customers';
import { toast } from 'sonner';

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  redeemPoints: boolean;
  onToggleRedeemPoints: (redeem: boolean) => void;
  currencySymbol: string;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  selectedCustomer,
  onSelectCustomer,
  redeemPoints,
  onToggleRedeemPoints,
  currencySymbol
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchCustomers = async () => {
        try {
          setIsLoading(true);
          const list = await dbService.getCustomers();
          setCustomers(list);
        } catch (err) {
          console.error(err);
          toast.error('Failed to load customers');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCustomers();
    }
  }, [isOpen]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchQuery('');
    setIsOpen(false);
    toast.success('Customer Linked', {
      description: `${customer.name} linked to this sale.`
    });
  };

  const handleClear = () => {
    onSelectCustomer(null);
    onToggleRedeemPoints(false);
    toast.info('Customer unlinked');
  };

  // Convert points to dollar discount (1 point = $0.10 discount)
  const loyaltyDiscount = selectedCustomer ? selectedCustomer.loyaltyPoints * 0.10 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={14} className="text-indigo-600" /> Customer Lookup
        </label>
        {selectedCustomer && (
          <button
            onClick={handleClear}
            className="text-[10px] font-semibold text-red-500 hover:underline flex items-center gap-0.5"
          >
            <X size={10} /> Unlink
          </button>
        )}
      </div>

      {!selectedCustomer ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-500 text-left transition-all"
          >
            <span>Attach Customer to Sale...</span>
            <Search size={16} className="text-slate-400" />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto p-2 space-y-2">
              <input
                type="text"
                placeholder="Search phone or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Loading...</p>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 rounded-lg text-xs transition-colors flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.phone}</p>
                      </div>
                      <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                        {c.loyaltyPoints} pts
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 p-3 text-center">No customers found</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm text-slate-900 flex items-center gap-1">
                {selectedCustomer.name}
              </p>
              <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Award size={12} className="text-amber-600 animate-bounce" /> {selectedCustomer.loyaltyPoints} points
              </span>
            </div>
          </div>

          {loyaltyDiscount > 0 && (
            <div className="flex items-center justify-between border-t border-indigo-100/60 pt-2.5 mt-2">
              <label htmlFor="redeem-points-cb" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <input
                  id="redeem-points-cb"
                  type="checkbox"
                  checked={redeemPoints}
                  onChange={(e) => onToggleRedeemPoints(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Redeem rewards discount ({currencySymbol}{loyaltyDiscount.toFixed(2)})
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
