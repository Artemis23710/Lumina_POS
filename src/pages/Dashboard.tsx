import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Activity,
  Receipt
} from 'lucide-react';
import { mockStats, mockTransactions } from '../data/mockData';
import type { Stat } from '../types';

export function Dashboard() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Completed
          </span>
        );

      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Pending
          </span>
        );

      case 'Refunded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Refunded
          </span>
        );

      default:
        return null;
    }
  };

  const icons = [DollarSign, ShoppingBag, CreditCard, Activity];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of your store's performance today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {mockStats.map((stat: Stat, index: number) => {
          const Icon = icons[index];
          const isPositive = stat.trend === 'up';
          return (
            <motion.div
              key={stat.label}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: index * 0.1
              }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                  {isPositive ? (
                    <TrendingUp size={16} className="mr-1" aria-hidden="true" />
                  ) : (
                    <TrendingDown size={16} className="mr-1" aria-hidden="true" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-slate-500 text-sm font-medium">
                  {stat.label}
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Transactions
          </h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Total Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {tx.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {tx.items} {tx.items === 1 ? 'item' : 'items'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    ${tx.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Receipt size={14} className="mr-2" aria-hidden="true" />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}