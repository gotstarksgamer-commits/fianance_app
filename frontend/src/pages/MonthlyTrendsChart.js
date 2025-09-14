import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Glass Card Component (same as in your dashboard)
const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

const MonthlyTrendsChart = ({ monthlyExpenses = {} }) => {
  // Convert monthly_expenses object to chart data
  const chartData = Object.entries(monthlyExpenses).map(([month, amount]) => ({
    month,
    amount,
    formattedAmount: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-blue-400 font-semibold">
            {payload[0].payload.formattedAmount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Monthly Spending Trends</h3>
      </div>
      
      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#1e40af' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">No monthly data available</p>
            <p className="text-gray-500 text-sm mt-1">Start tracking to see trends</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default MonthlyTrendsChart;