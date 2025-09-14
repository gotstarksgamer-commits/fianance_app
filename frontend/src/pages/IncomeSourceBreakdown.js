import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

const IncomeSourceBreakdown = ({ incomeData = null }) => {
  const [activeSegment, setActiveSegment] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{data.source}</p>
          <p className="text-sm text-gray-300">Amount: {formatCurrency(data.amount)}</p>
          <p className="text-sm text-gray-300">Share: {data.percentage.toFixed(1)}%</p>
          {data.growth !== undefined && (
            <p className={`text-sm font-medium ${data.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Growth: {formatPercentage(data.growth)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!incomeData || !incomeData.income_sources || incomeData.income_sources.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Income Source Breakdown</h3>
        </div>
        <div className="text-center py-8">
          <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No income data available</p>
          <p className="text-gray-500 text-sm mt-1">Add income sources to see breakdown</p>
        </div>
      </GlassCard>
    );
  }

  const totalIncome = incomeData.income_sources.reduce((sum, source) => sum + source.amount, 0);
  const primarySource = incomeData.income_sources.reduce((prev, current) => 
    prev.amount > current.amount ? prev : current
  );

  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Income Source Breakdown</h3>
          <p className="text-sm text-gray-400">Total Monthly Income: {formatCurrency(totalIncome)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="relative">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData.income_sources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                  onMouseEnter={(_, index) => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  {incomeData.income_sources.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke={activeSegment === index ? "#ffffff" : "none"}
                      strokeWidth={activeSegment === index ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center Info */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-white text-lg font-bold">
                {incomeData.income_sources.length}
              </p>
              <p className="text-gray-400 text-xs">Sources</p>
            </div>
          </div>
        </div>

        {/* Source Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Income Sources</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Growing</span>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>Declining</span>
            </div>
          </div>

          {incomeData.income_sources.map((source, index) => {
            const isLargest = source.source === primarySource.source;
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                  isLargest 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{source.source}</span>
                        {isLargest && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">
                        {source.percentage.toFixed(1)}% of total income
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {formatCurrency(source.amount)}
                    </p>
                    {source.growth !== undefined && (
                      <div className={`flex items-center space-x-1 text-xs ${
                        source.growth >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {source.growth >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{Math.abs(source.growth).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${source.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
          <ArrowRight className="w-4 h-4 text-blue-400" />
          <span>Income Insights</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Primary Source:</span>
              <span className="text-white font-medium">{primarySource.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dependence:</span>
              <span className={`font-medium ${
                primarySource.percentage > 80 ? 'text-red-400' : 
                primarySource.percentage > 60 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {primarySource.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Diversification:</span>
              <span className={`font-medium ${
                incomeData.income_sources.length >= 3 ? 'text-green-400' : 
                incomeData.income_sources.length === 2 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {incomeData.income_sources.length === 1 ? 'Low' : 
                 incomeData.income_sources.length === 2 ? 'Medium' : 'Good'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Growing Sources:</span>
              <span className="text-green-400 font-medium">
                {incomeData.income_sources.filter(s => s.growth > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default IncomeSourceBreakdown;