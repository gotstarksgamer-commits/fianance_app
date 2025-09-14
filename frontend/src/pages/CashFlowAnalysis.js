import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

const CashFlowAnalysis = ({ cashflowData = null }) => {
  const [period, setPeriod] = useState('6months');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-4 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry) => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!cashflowData || !cashflowData.cashflow_data || cashflowData.cashflow_data.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Cash Flow Analysis</h3>
        </div>
        <div className="text-center py-8">
          <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No cash flow data available</p>
          <p className="text-gray-500 text-sm mt-1">Start tracking to see cash flow trends</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Cash Flow Analysis</h3>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-2">
          {['3months', '6months', '1year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                period === p 
                  ? 'bg-green-500/30 text-green-300' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {p === '3months' ? '3M' : p === '6months' ? '6M' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white/5 border border-green-500/20">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xs text-gray-400">Avg Income</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(cashflowData.summary?.avg_monthly_income || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-red-500/20">
          <div className="flex items-center space-x-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-xs text-gray-400">Avg Expenses</p>
              <p className="text-lg font-bold text-red-400">
                {formatCurrency(cashflowData.summary?.avg_monthly_expenses || 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-blue-500/20">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Avg Net Flow</p>
              <p className="text-lg font-bold text-blue-400">
                {formatCurrency(cashflowData.summary?.avg_net_flow || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cashflowData.cashflow_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="url(#incomeGradient)" name="Income" />
            <Bar dataKey="expenses" fill="url(#expenseGradient)" name="Expenses" />
            <Line 
              type="monotone" 
              dataKey="net_flow" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              name="Net Flow"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default CashFlowAnalysis;