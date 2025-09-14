import React, { useState } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Target, DollarSign } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

const InvestmentPerformance = ({ investmentData = null }) => {
  const [activeView, setActiveView] = useState('overview');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('%') ? `${entry.value.toFixed(2)}%` : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.asset_type}</p>
          <p className="text-sm text-gray-300">Amount: {formatCurrency(data.amount)}</p>
          <p className="text-sm text-gray-300">Allocation: {data.percentage.toFixed(1)}%</p>
          <p className={`text-sm font-medium ${data.return_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Returns: {formatPercentage(data.return_rate)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!investmentData || !investmentData.portfolio) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Investment Performance</h3>
        </div>
        <div className="text-center py-8">
          <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No investment data available</p>
          <p className="text-gray-500 text-sm mt-1">Start investing to track performance</p>
        </div>
      </GlassCard>
    );
  }

  const portfolio = investmentData.portfolio;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Investment Performance</h3>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-2">
          {['overview', 'allocation', 'performance'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                activeView === view 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white/5 border border-blue-500/20">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Total Value</p>
              <p className="text-lg font-bold text-blue-400">
                {formatCurrency(portfolio.total_value)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Invested</p>
              <p className="text-lg font-bold text-purple-400">
                {formatCurrency(portfolio.total_invested)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-green-500/20">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xs text-gray-400">Total Returns</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(portfolio.total_returns)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-white/5 border border-yellow-500/20">
          <div className="flex items-center space-x-3">
            {portfolio.return_percentage >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className="text-xs text-gray-400">Return %</p>
              <p className={`text-lg font-bold ${portfolio.return_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(portfolio.return_percentage)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content Based on Active View */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Allocation Pie Chart */}
          <div>
            <h4 className="text-white font-medium mb-4">Portfolio Allocation</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolio.allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {portfolio.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset Performance List */}
          <div>
            <h4 className="text-white font-medium mb-4">Asset Performance</h4>
            <div className="space-y-3">
              {portfolio.allocation.map((asset, index) => (
                <div key={index} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-white font-medium">{asset.asset_type}</span>
                    </div>
                    <span className={`text-sm font-semibold ${asset.return_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(asset.return_rate)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Amount: </span>
                      <span className="text-white font-medium">{formatCurrency(asset.amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Returns: </span>
                      <span className={`font-medium ${asset.returns >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(asset.returns)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'allocation' && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolio.allocation}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={5}
                dataKey="percentage"
                label={({ asset_type, percentage }) => `${asset_type}: ${percentage.toFixed(1)}%`}
                labelLine={false}
              >
                {portfolio.allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'performance' && portfolio.performance_history && (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolio.performance_history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="portfolio_value" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Portfolio Value"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                fill="url(#portfolioGradient)"
              />
              <Line 
                type="monotone" 
                dataKey="invested_amount" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Invested Amount"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
};

export default InvestmentPerformance;