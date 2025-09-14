import React, { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { 
  TrendingUp, 
  Receipt, 
  Wallet, 
  AlertTriangle, 
  Target,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import MonthlyTrendsChart from './MonthlyTrendsChart';
import { API_BASE_URL } from '../constants/api';
import CashFlowAnalysis from './CashFlowAnalysis';
import BudgetVsActual from './BudgetVsActual';
import FinancialHealthScore from './FinancialHealthScore';
import IncomeSourceBreakdown from './IncomeSourceBreakdown';
import InvestmentPerformance from './InvestmentPerformance';

// Glass Card Component
const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
  <GlassCard className="p-6 group hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {trend === 'up' ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          <span className="text-xs font-medium">{trendValue}</span>
        </div>
      )}
    </div>
    <div className="space-y-2">
      <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  </GlassCard>
);

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-lg font-bold">{progress.toFixed(1)}%</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { getAuthHeader } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [completeDashboard, setCompleteDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cashflowData, setCashflowData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [investmentData, setInvestmentData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [incomeData, setIncomeData] = useState(null);
  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        basicResponse, 
        completeResponse,
        cashflowResponse,
        budgetResponse,
        investmentResponse,
        healthResponse,
        incomeResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/dashboard/complete`, { headers: getAuthHeader() }),
        axios.get(`${API_BASE_URL}/dashboard/cashflow/6months`, { headers: getAuthHeader() }).catch(() => null),
        axios.get(`${API_BASE_URL}/dashboard/budget/performance`, { headers: getAuthHeader() }).catch(() => null),
        axios.get(`${API_BASE_URL}/dashboard/investments/performance`, { headers: getAuthHeader() }).catch(() => null),
        axios.get(`${API_BASE_URL}/dashboard/health-score`, { headers: getAuthHeader() }).catch(() => null),
        axios.get(`${API_BASE_URL}/dashboard/income/sources`, { headers: getAuthHeader() }).catch(() => null)
      ]);
      
      setDashboardData(basicResponse.data);
      setCompleteDashboard(completeResponse.data);
      if (cashflowResponse) setCashflowData(cashflowResponse.data);
      if (budgetResponse) setBudgetData(budgetResponse.data);
      if (investmentResponse) setInvestmentData(investmentResponse.data);
      if (healthResponse) setHealthData(healthResponse.data);
      if (incomeResponse) setIncomeData(incomeResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin animation-delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
              Financial Dashboard
            </h1>
            <p className="text-gray-300 text-lg">Your complete financial overview at a glance</p>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <MetricCard
              title="Total Income"
              value={formatCurrency(completeDashboard?.total_income || 0)}
              icon={TrendingUp}
              trend="up"
              trendValue="+12.5%"
              color="from-green-500 to-emerald-600"
            />
            <MetricCard
              title="Total Expenses"
              value={formatCurrency(completeDashboard?.total_expenses || 0)}
              icon={Receipt}
              trend="down"
              trendValue="-5.2%"
              color="from-red-500 to-pink-600"
            />
            <MetricCard
              title="Investments"
              value={formatCurrency(completeDashboard?.total_investments || 0)}
              icon={TrendingUp}
              trend="up"
              trendValue="+8.7%"
              color="from-blue-500 to-cyan-600"
            />
            <MetricCard
              title="Net Worth"
              value={formatCurrency(completeDashboard?.net_worth || 0)}
              icon={Wallet}
              trend="up"
              trendValue="+15.3%"
              color="from-purple-500 to-indigo-600"
            />
          </div>

          {/* ADD THIS SECTION - Monthly Trends Chart */}
          <div className="mb-12">
            <MonthlyTrendsChart monthlyExpenses={dashboardData?.monthly_expenses} />
          </div>

          {/* Financial Health Score - Full width prominent position */}
          <div className="mb-12">
            <FinancialHealthScore healthData={healthData} />
          </div>

          {/* Cash Flow Analysis - Full width */}
          <div className="mb-12">
            <CashFlowAnalysis cashflowData={cashflowData} />
          </div>

          {/* Two Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <BudgetVsActual budgetData={budgetData} />
            <IncomeSourceBreakdown incomeData={incomeData} />
          </div>

          {/* Investment Performance - Full width */}
          <div className="mb-12">
            <InvestmentPerformance investmentData={investmentData} />
          </div>

          {/* Budget Alerts */}
          {completeDashboard?.budget_alerts && completeDashboard.budget_alerts.length > 0 && (
            <GlassCard className="p-6 mb-8 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Budget Alerts</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completeDashboard.budget_alerts.map((alert, index) => (
                  <GlassCard key={index} className="p-4 border-orange-400/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-white">{alert.category}</span>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm font-medium">
                        {alert.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-300">
                        {formatCurrency(alert.spent)} / {formatCurrency(alert.limit)}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Savings Goals */}
          {completeDashboard?.savings_goals && completeDashboard.savings_goals.count > 0 && (
            <GlassCard className="p-8 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Savings Goals Progress</h2>
              </div>
              <div className="flex items-center justify-center space-x-12">
                <ProgressRing progress={completeDashboard.savings_goals.progress} />
                <div className="grid grid-cols-1 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {completeDashboard.savings_goals.count}
                    </div>
                    <div className="text-gray-300 text-sm">Active Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {formatCurrency(completeDashboard.savings_goals.saved)}
                    </div>
                    <div className="text-gray-300 text-sm">Total Saved</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spending by Category */}
            <GlassCard className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(dashboardData?.category_breakdown || {}).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-gray-300 font-medium">{category}</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Investment Portfolio */}
            <GlassCard className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Investment Portfolio</h3>
              </div>
              <div className="space-y-4">
                {completeDashboard?.investment_breakdown && Object.keys(completeDashboard.investment_breakdown).length > 0 ? (
                  Object.entries(completeDashboard.investment_breakdown).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-gray-300 font-medium">{type}</span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No investments yet</p>
                    <p className="text-gray-500 text-sm mt-1">Start investing to see your portfolio here</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Recent Transactions */}
            <GlassCard className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
              </div>
              <div className="space-y-4">
                {dashboardData?.recent_transactions?.slice(0, 6).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <div>
                        <p className="text-white font-medium text-sm">{transaction.category}</p>
                        <p className="text-gray-400 text-xs">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-semibold text-sm">
                        -{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-gray-500 text-xs">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
      
      {/* Sonner Toaster */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        expand={false}
        visibleToasts={4}
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          },
        }}
      />
    </>
  );
};

export default Dashboard;