import React from 'react';
import { Target, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

const BudgetVsActual = ({ budgetData = null }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'under_budget':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'over_budget':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'near_budget':
        return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status, percentage) => {
    if (status === 'over_budget' || percentage > 100) {
      return 'border-red-500/20 bg-red-500/5';
    } else if (status === 'near_budget' || percentage > 80) {
      return 'border-yellow-500/20 bg-yellow-500/5';
    } else {
      return 'border-green-500/20 bg-green-500/5';
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage > 100) {
      return 'from-red-500 to-red-600';
    } else if (percentage > 80) {
      return 'from-yellow-500 to-orange-500';
    } else {
      return 'from-green-500 to-emerald-500';
    }
  };

  if (!budgetData || !budgetData.budget_performance || budgetData.budget_performance.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Budget vs Actual</h3>
        </div>
        <div className="text-center py-8">
          <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No budget data available</p>
          <p className="text-gray-500 text-sm mt-1">Set up budgets to track performance</p>
        </div>
      </GlassCard>
    );
  }

  const totalBudgeted = budgetData.budget_performance.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = budgetData.budget_performance.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalBudgeted;
  const overallPercentage = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Target className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Budget vs Actual Performance</h3>
      </div>

      {/* Overall Summary */}
      <div className={`p-4 rounded-lg mb-6 border ${getStatusColor(overallPercentage > 100 ? 'over_budget' : 'under_budget', overallPercentage)}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Overall Budget Performance</h4>
          {getStatusIcon(overallPercentage > 100 ? 'over_budget' : overallPercentage > 80 ? 'near_budget' : 'under_budget')}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Budgeted</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Actual</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Variance</p>
            <p className={`text-sm font-semibold ${totalVariance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Usage</p>
            <p className={`text-sm font-semibold ${overallPercentage > 100 ? 'text-red-400' : overallPercentage > 80 ? 'text-yellow-400' : 'text-green-400'}`}>
              {overallPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${getProgressBarColor(overallPercentage)} transition-all duration-1000`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h4 className="text-white font-medium mb-4">Category Breakdown</h4>
        {budgetData.budget_performance.map((category, index) => {
          const percentage = category.budgeted > 0 ? (category.actual / category.budgeted) * 100 : 0;
          
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border transition-all duration-300 hover:bg-white/5 ${getStatusColor(category.status, percentage)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(category.status)}
                  <span className="text-white font-medium">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${percentage > 100 ? 'text-red-400' : percentage > 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <span className="text-gray-400">Budget: </span>
                  <span className="text-white font-medium">{formatCurrency(category.budgeted)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Actual: </span>
                  <span className="text-white font-medium">{formatCurrency(category.actual)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Variance: </span>
                  <span className={`font-medium ${category.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {category.variance > 0 ? '+' : ''}{formatCurrency(category.variance)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Remaining: </span>
                  <span className={`font-medium ${(category.budgeted - category.actual) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(category.budgeted - category.actual)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${getProgressBarColor(percentage)} transition-all duration-1000`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
                {percentage > 100 && (
                  <div className="mt-1 w-full bg-gray-600 rounded-full h-1">
                    <div 
                      className="h-1 rounded-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-1000"
                      style={{ width: `${Math.min(percentage - 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default BudgetVsActual;