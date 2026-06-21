import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Lock, 
  Unlock, 
  Coins, 
  FileText,
  Save,
  AlertTriangle,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { toast } from 'sonner';

// Define local/default config keys
const LOCAL_STORAGE_SESSION_KEY = 'lumina_active_cash_session';

export interface StoreConfig {
  storeName: string;
  taxRate: number; // percentage, e.g. 8
  currency: string; // e.g. '$'
  address: string;
  phone: string;
  receiptFooter: string;
}

export interface DrawerSession {
  id?: string;
  status: 'open' | 'closed';
  openedAt: string;
  openedBy: string;
  openingBalance: number;
  transactions: {
    type: 'sale' | 'cash_in' | 'cash_out';
    amount: number;
    description: string;
    timestamp: string;
  }[];
  expectedBalance: number;
  actualBalance?: number;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Tab State
  const [activeTab, setActiveTab] = useState<'register' | 'store'>('register');

  // Store Configuration state
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    storeName: 'Lumina POS Store',
    taxRate: 8,
    currency: '$',
    address: '123 Business Rd, Suite 100',
    phone: '(555) 123-4567',
    receiptFooter: 'Thank you for shopping with us!'
  });
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  // Cash Register State
  const [activeSession, setActiveSession] = useState<DrawerSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<DrawerSession[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Form States
  const [openingFloat, setOpeningFloat] = useState('');
  const [cashAdjustmentType, setCashAdjustmentType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  
  // Closing Register States
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // Fetch settings & drawer status
  useEffect(() => {
    const initSettingsAndDrawer = async () => {
      try {
        setIsLoadingSession(true);
        
        // 1. Fetch Store settings
        const config = await dbService.getStoreConfig();
        setStoreConfig(config);

        // 2. Fetch Active Drawer Session
        const active = await dbService.getActiveDrawerSession();
        if (active) {
          setActiveSession(active);
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(active));
        } else {
          setActiveSession(null);
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        }

        // 3. Fetch past closed sessions
        const history = await dbService.getClosedDrawerSessions();
        setSessionHistory(history);

      } catch (err) {
        console.error('Error fetching settings/drawer:', err);
        const cached = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (cached) {
          setActiveSession(JSON.parse(cached));
        }
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSettingsAndDrawer();
  }, []);

  // Save Store Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Access Denied', { description: 'Only administrators can update store configuration.' });
      return;
    }
    setIsConfigSaving(true);
    try {
      await dbService.saveStoreConfig(storeConfig);
      localStorage.setItem('lumina_store_config', JSON.stringify(storeConfig));
      toast.success('Settings Saved', { description: 'Store configuration has been updated.' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setIsConfigSaving(false);
    }
  };

  // Open Cash Register Session
  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = parseFloat(openingFloat);
    if (isNaN(floatVal) || floatVal < 0) {
      toast.error('Invalid amount', { description: 'Please enter a valid starting float amount.' });
      return;
    }

    try {
      setIsLoadingSession(true);
      const newSession: DrawerSession = {
        status: 'open',
        openedAt: new Date().toISOString(),
        openedBy: user?.displayName || 'Unknown Cashier',
        openingBalance: floatVal,
        transactions: [],
        expectedBalance: floatVal
      };

      const sessionWithId = await dbService.openDrawerSession(newSession);
      
      setActiveSession(sessionWithId);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionWithId));
      setOpeningFloat('');
      toast.success('Register Opened', { description: `Cash session started with float: ${storeConfig.currency}${floatVal.toFixed(2)}` });
    } catch (err) {
      console.error(err);
      toast.error('Failed to open register');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Record Cash In/Out Adjustment
  const handleCashAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(adjustmentAmount);
    if (!activeSession || !activeSession.id) return;
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Invalid amount');
      return;
    }
    if (!adjustmentReason) {
      toast.error('Missing reason', { description: 'Please specify why cash is being added/removed.' });
      return;
    }

    try {
      const isOut = cashAdjustmentType === 'cash_out';
      if (isOut && amountVal > activeSession.expectedBalance) {
        toast.warning('Drawer shortage risk', { description: 'Drawer balance is less than withdrawal amount.' });
      }

      const transaction = {
        type: cashAdjustmentType,
        amount: amountVal,
        description: adjustmentReason,
        timestamp: new Date().toISOString()
      };

      const updatedTransactions = [...activeSession.transactions, transaction];
      const updatedExpectedBalance = activeSession.expectedBalance + (isOut ? -amountVal : amountVal);

      await dbService.updateDrawerSession(activeSession.id, {
        transactions: updatedTransactions,
        expectedBalance: updatedExpectedBalance
      });

      const updatedSession: DrawerSession = {
        ...activeSession,
        transactions: updatedTransactions,
        expectedBalance: updatedExpectedBalance
      };

      setActiveSession(updatedSession);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedSession));
      
      // Reset form
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setIsAdjustmentModalOpen(false);
      
      toast.success(isOut ? 'Cash Paid Out' : 'Cash Added', {
        description: `${isOut ? '-' : '+'}${storeConfig.currency}${amountVal.toFixed(2)}: ${adjustmentReason}`
      });

    } catch (err) {
      console.error(err);
      toast.error('Adjustment failed');
    }
  };

  // Close Register Session & Reconcile
  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !activeSession.id) return;
    const actualCash = parseFloat(actualCashCounted);
    if (isNaN(actualCash) || actualCash < 0) {
      toast.error('Invalid Amount', { description: 'Please input counted cash value.' });
      return;
    }

    try {
      setIsLoadingSession(true);
      const difference = actualCash - activeSession.expectedBalance;
      const closedSession: Partial<DrawerSession> = {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: user?.displayName || 'Unknown Manager',
        actualBalance: actualCash,
        notes: closingNotes + (difference !== 0 ? ` (Reconciliation difference: ${storeConfig.currency}${difference.toFixed(2)})` : '')
      };

      await dbService.updateDrawerSession(activeSession.id, closedSession);

      toast.success('Register Closed', {
        description: `drawer session finalized. Expected: ${storeConfig.currency}${activeSession.expectedBalance.toFixed(2)}, Counted: ${storeConfig.currency}${actualCash.toFixed(2)}`
      });

      // Reset Active session
      setActiveSession(null);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      setIsCloseModalOpen(false);
      setActualCashCounted('');
      setClosingNotes('');

      // Refresh Closed sessions history list
      const history = await dbService.getClosedDrawerSessions();
      setSessionHistory(history);

    } catch (err) {
      console.error(err);
      toast.error('Close drawer session failed');
    } finally {
      setIsLoadingSession(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="text-indigo-600 animate-spin-slow" size={28} />
            System Administration
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure POS defaults and manage register drawer cash counts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('register')}
          className={`pb-4 px-6 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'register'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet size={16} />
          Cash Register Session
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('store')}
            className={`pb-4 px-6 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'store'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <SettingsIcon size={16} />
            Store Info & Taxes
          </button>
        )}
      </div>

      {isLoadingSession ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-3">Loading records...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'register' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Register Action Card */}
              <div className="lg:col-span-2 space-y-6">
                {!activeSession ? (
                  /* REGISTER CLOSED VIEW */
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                      <Lock size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Register is Closed</h2>
                    <p className="text-slate-500 text-sm max-w-md mt-2">
                      Before checking out customers or creating invoices, you must open a register session by inputting the initial cash float.
                    </p>
                    
                    <form onSubmit={handleOpenRegister} className="mt-6 w-full max-w-sm space-y-4">
                      <div>
                        <label className="block text-left text-xs font-semibold text-slate-500 mb-2 uppercase">Opening Cash Float</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{storeConfig.currency}</span>
                          <input
                            type="number"
                            placeholder="150.00"
                            step="0.01"
                            min="0"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            required
                            className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <Unlock size={18} /> Open Drawer Session
                      </button>
                    </form>
                  </div>
                ) : (
                  /* REGISTER OPEN VIEW */
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Unlock size={20} />
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-900">Session ID: #{activeSession.id?.slice(0,8).toUpperCase()}</h2>
                          <p className="text-xs text-slate-500">Opened by {activeSession.openedBy} at {new Date(activeSession.openedAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>

                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-medium uppercase">Opening Float</p>
                        <p className="text-xl font-bold text-slate-900">{storeConfig.currency}{activeSession.openingBalance.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-medium uppercase">Expected Drawer Cash</p>
                        <p className="text-xl font-bold text-indigo-600">{storeConfig.currency}{activeSession.expectedBalance.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2 md:col-span-1 flex gap-2 pt-2 md:pt-0">
                        <button
                          onClick={() => setIsAdjustmentModalOpen(true)}
                          className="flex-1 px-3 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Coins size={14} /> Cash In / Out
                        </button>
                        <button
                          onClick={() => setIsCloseModalOpen(true)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Lock size={14} /> Close Session
                        </button>
                      </div>
                    </div>

                    {/* Active Session Activity List */}
                    <div className="border-t border-slate-100">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-900 font-semibold text-sm">
                        <FileText size={16} /> Drawer Ledger Logs
                      </div>
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {activeSession.transactions && activeSession.transactions.length > 0 ? (
                          activeSession.transactions.map((tx, idx) => (
                            <div key={idx} className="p-4 px-6 flex justify-between items-center text-sm">
                              <div className="flex items-center gap-3">
                                {tx.type === 'sale' && (
                                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Coins size={16} /></div>
                                )}
                                {tx.type === 'cash_in' && (
                                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><ArrowUpRight size={16} /></div>
                                )}
                                {tx.type === 'cash_out' && (
                                  <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><ArrowDownRight size={16} /></div>
                                )}
                                <div>
                                  <p className="font-medium text-slate-950">{tx.description}</p>
                                  <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              <span className={`font-semibold ${tx.type === 'cash_out' ? 'text-red-600' : 'text-slate-900'}`}>
                                {tx.type === 'cash_out' ? '-' : '+'}{storeConfig.currency}{tx.amount.toFixed(2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-sm">
                            No ledger adjustments recorded yet. Purchases automatically sync logs here.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* History / Sessions sidebar list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <History size={16} /> Register Closing History
                </h3>
                <div className="space-y-4 divide-y divide-slate-100 overflow-y-auto max-h-[480px] -mx-6 px-6">
                  {sessionHistory.length > 0 ? (
                    sessionHistory.map((sess) => {
                      const diff = sess.actualBalance !== undefined ? sess.actualBalance - sess.expectedBalance : 0;
                      return (
                        <div key={sess.id} className="pt-4 first:pt-0 space-y-2 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-900">Closed Session</p>
                              <p className="text-xs text-slate-400">{new Date(sess.closedAt || '').toLocaleDateString()} {new Date(sess.closedAt || '').toLocaleTimeString()}</p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              Closed
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div>Float Float:</div>
                            <div className="text-right font-medium">{storeConfig.currency}{sess.openingBalance.toFixed(2)}</div>
                            <div>Expected:</div>
                            <div className="text-right font-medium">{storeConfig.currency}{sess.expectedBalance.toFixed(2)}</div>
                            <div>Actual Counted:</div>
                            <div className="text-right font-medium">{storeConfig.currency}{(sess.actualBalance || 0).toFixed(2)}</div>
                            <div className="border-t border-slate-200 mt-1 pt-1">Variance:</div>
                            <div className={`text-right font-bold border-t border-slate-200 mt-1 pt-1 ${
                              diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {diff >= 0 ? '+' : ''}{storeConfig.currency}{diff.toFixed(2)}
                            </div>
                          </div>
                          
                          {sess.notes && (
                            <p className="text-xs text-slate-500 italic font-light bg-amber-50/50 p-2 rounded border border-amber-100/40">
                              Note: {sess.notes}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No session logs saved in history yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'store' && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-3xl"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <SettingsIcon size={20} /> Store General Configurations
              </h2>
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Store Profile Name</label>
                    <input
                      type="text"
                      value={storeConfig.storeName}
                      onChange={(e) => setStoreConfig({ ...storeConfig, storeName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={storeConfig.taxRate}
                      onChange={(e) => setStoreConfig({ ...storeConfig, taxRate: parseFloat(e.target.value) })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Currency Code Symbol</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={storeConfig.currency}
                      onChange={(e) => setStoreConfig({ ...storeConfig, currency: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Support Phone Contact</label>
                    <input
                      type="text"
                      value={storeConfig.phone}
                      onChange={(e) => setStoreConfig({ ...storeConfig, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Physical Store Address</label>
                  <input
                    type="text"
                    value={storeConfig.address}
                    onChange={(e) => setStoreConfig({ ...storeConfig, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Receipt Footer Note</label>
                  <textarea
                    rows={3}
                    value={storeConfig.receiptFooter}
                    onChange={(e) => setStoreConfig({ ...storeConfig, receiptFooter: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isConfigSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-indigo-100 flex items-center gap-2 text-sm"
                  >
                    {isConfigSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={16} />
                    )}
                    Save Configurations
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ADJUSTMENT MODAL */}
      <AnimatePresence>
        {isAdjustmentModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdjustmentModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setIsAdjustmentModalOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="text-indigo-600 animate-pulse" /> Drawer Balance adjustment
                </h3>
                
                <form onSubmit={handleCashAdjustment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCashAdjustmentType('cash_in')}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        cashAdjustmentType === 'cash_in'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Cash Addition (In)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashAdjustmentType('cash_out')}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        cashAdjustmentType === 'cash_out'
                          ? 'bg-white text-red-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Cash Withdrawal (Out)
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Adjustment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{storeConfig.currency}</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                        required
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Audit Description / Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Added change coins / Supplier payout"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdjustmentModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-indigo-100"
                    >
                      Submit Audit
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CLOSE REGISTER MODAL & RECONCILIATION WORKSHEET */}
      <AnimatePresence>
        {isCloseModalOpen && activeSession && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCloseModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setIsCloseModalOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="text-red-600" /> Close Register & Reconcile Cash
                </h3>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Starting Float:</span>
                    <span className="font-semibold">{storeConfig.currency}{activeSession.openingBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Register Sales + Adjustments:</span>
                    <span className="font-semibold">{storeConfig.currency}{(activeSession.expectedBalance - activeSession.openingBalance).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">Expected Drawer Balance:</span>
                    <span className="font-bold text-indigo-600">{storeConfig.currency}{activeSession.expectedBalance.toFixed(2)}</span>
                  </div>
                </div>
                
                <form onSubmit={handleCloseRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Counted Physical Cash *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{storeConfig.currency}</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={actualCashCounted}
                        onChange={(e) => setActualCashCounted(e.target.value)}
                        required
                        className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                      />
                    </div>
                    {actualCashCounted && (
                      <div className="mt-2 text-xs flex justify-between">
                        <span>Reconciliation Discrepancy:</span>
                        <span className={`font-bold ${
                          (parseFloat(actualCashCounted) - activeSession.expectedBalance) === 0
                            ? 'text-emerald-600'
                            : (parseFloat(actualCashCounted) - activeSession.expectedBalance) > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}>
                          {(parseFloat(actualCashCounted) - activeSession.expectedBalance) >= 0 ? '+' : ''}
                          {storeConfig.currency}{(parseFloat(actualCashCounted) - activeSession.expectedBalance).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Discrepancy Notes / Closing Comments</label>
                    <input
                      type="text"
                      placeholder="Specify reasons for cash count mismatch, if any."
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                    />
                  </div>

                  {actualCashCounted && parseFloat(actualCashCounted) !== activeSession.expectedBalance && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                      <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                      <p>
                        Counted cash does not match system expected balance. Discrepancy details will be logged in reports.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCloseModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-red-100"
                    >
                      Finalize & Lock Drawer
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
