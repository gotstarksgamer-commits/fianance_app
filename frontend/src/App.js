import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import Shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { Slider } from './components/ui/slider';

// Icons
import { 
  Calculator, 
  PieChart, 
  TrendingUp, 
  Home, 
  Car, 
  CreditCard, 
  Receipt, 
  Plus,
  DollarSign,
  Target,
  Wallet,
  MessageCircle,
  Send,
  Brain,
  Lightbulb,
  Upload,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: PieChart },
    { path: '/loans', label: 'Loan Calculator', icon: Calculator },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/income', label: 'Income', icon: DollarSign },
    { path: '/investments', label: 'Investments', icon: TrendingUp },
    { path: '/budgets', label: 'Budgets', icon: Target },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/ai-chat', label: 'AI Assistant', icon: Brain }
  ];
  
  return (
    <nav className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8" />
            <h1 className="text-xl font-bold">Finance Tracker</h1>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Financial Dashboard</h2>
        <p className="text-gray-600">Your complete financial overview</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">
              {formatCurrency(dashboardData?.total_income || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {formatCurrency(dashboardData?.total_expenses || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {formatCurrency((dashboardData?.total_income || 0) - (dashboardData?.total_expenses || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(dashboardData?.category_breakdown || {}).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <Badge variant="outline">{formatCurrency(amount)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent_transactions?.slice(0, 8).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{transaction.category}</p>
                    <p className="text-xs text-gray-500">{transaction.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      -{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Loan Calculator Component
const LoanCalculator = () => {
  const [loanType, setLoanType] = useState('home');
  const [principal, setPrincipal] = useState([2000000]); // Default 20 lakh
  const [interestRate, setInterestRate] = useState([9]); // Default 9%
  const [tenure, setTenure] = useState([240]); // Default 20 years in months
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Loan type configurations
  const loanConfigs = {
    home: {
      title: 'Home Loan Calculator',
      icon: Home,
      minAmount: 100000,
      maxAmount: 100000000,
      minRate: 6,
      maxRate: 15,
      minTenure: 12,
      maxTenure: 360,
      color: 'emerald'
    },
    car: {
      title: 'Car Loan Calculator', 
      icon: Car,
      minAmount: 50000,
      maxAmount: 5000000,
      minRate: 8,
      maxRate: 20,
      minTenure: 12,
      maxTenure: 84,
      color: 'blue'
    },
    personal: {
      title: 'Personal Loan Calculator',
      icon: CreditCard,
      minAmount: 10000,
      maxAmount: 2000000,
      minRate: 10,
      maxRate: 36,
      minTenure: 6,
      maxTenure: 84,
      color: 'purple'
    }
  };

  const currentConfig = loanConfigs[loanType];

  useEffect(() => {
    calculateLoan();
  }, [principal, interestRate, tenure, loanType]);

  const calculateLoan = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/loans/calculate`, {
        loan_type: loanType,
        principal_amount: principal[0],
        interest_rate: interestRate[0],
        tenure_months: tenure[0]
      });
      setCalculation(response.data);
    } catch (error) {
      console.error('Error calculating loan:', error);
      toast.error('Failed to calculate loan');
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

  const formatTenure = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${months} months`;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years}Y ${remainingMonths}M`;
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'from-emerald-600 to-teal-600',
      blue: 'from-blue-600 to-cyan-600',
      purple: 'from-purple-600 to-indigo-600'
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Loan Calculator</h2>
        <p className="text-gray-600">Calculate EMI for Home, Car, and Personal loans</p>
      </div>

      {/* Loan Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(loanConfigs).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <Card
              key={type}
              className={`cursor-pointer transition-all duration-200 ${
                loanType === type 
                  ? `ring-2 ring-offset-2 ring-${config.color}-500 bg-gradient-to-br from-${config.color}-50 to-${config.color}-100`
                  : 'hover:shadow-lg hover:scale-105'
              }`}
              onClick={() => setLoanType(type)}
            >
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${loanType === type ? `text-${config.color}-600` : 'text-gray-600'}`} />
                  <h3 className={`font-semibold ${loanType === type ? `text-${config.color}-800` : 'text-gray-800'}`}>
                    {config.title}
                  </h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <currentConfig.icon className={`h-5 w-5 text-${currentConfig.color}-600`} />
              <span>{currentConfig.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Loan Amount */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Loan Amount</Label>
                <Input
                  type="number"
                  value={principal[0]}
                  onChange={(e) => setPrincipal([parseInt(e.target.value) || 0])}
                  className="w-32 text-right"
                />
              </div>
              <Slider
                value={principal}
                onValueChange={setPrincipal}
                max={currentConfig.maxAmount}
                min={currentConfig.minAmount}
                step={10000}
                className={`w-full slider-${currentConfig.color}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Min {formatCurrency(currentConfig.minAmount)}</span>
                <span>Max {formatCurrency(currentConfig.maxAmount)}</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Rate of Interest</Label>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={interestRate[0]}
                    onChange={(e) => setInterestRate([parseFloat(e.target.value) || 0])}
                    className="w-20 text-right"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <Slider
                value={interestRate}
                onValueChange={setInterestRate}
                max={currentConfig.maxRate}
                min={currentConfig.minRate}
                step={0.1}
                className={`w-full slider-${currentConfig.color}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Min {currentConfig.minRate}%</span>
                <span>Max {currentConfig.maxRate}%</span>
              </div>
            </div>

            {/* Loan Tenure */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Loan Tenure</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={tenure[0]}
                    onChange={(e) => setTenure([parseInt(e.target.value) || 0])}
                    className="w-20 text-right"
                  />
                  <Select 
                    value="months"
                    onValueChange={(value) => {
                      if (value === 'years') {
                        setTenure([Math.round(tenure[0] / 12)]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Slider
                value={tenure}
                onValueChange={setTenure}
                max={currentConfig.maxTenure}
                min={currentConfig.minTenure}
                step={1}
                className={`w-full slider-${currentConfig.color}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Min {formatTenure(currentConfig.minTenure)}</span>
                <span>Max {formatTenure(currentConfig.maxTenure)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculator Results */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : calculation ? (
              <div className="space-y-6">
                {/* EMI Display */}
                <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Your monthly EMI is</p>
                  <p className={`text-4xl font-bold bg-gradient-to-r ${getColorClasses(currentConfig.color)} bg-clip-text text-transparent`}>
                    {formatCurrency(calculation.emi_amount)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {interestRate[0]}% interest rate per annum
                  </p>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium">Principal Amount</p>
                    <p className="text-xl font-bold text-emerald-800">
                      {formatCurrency(calculation.principal_amount)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">Total Interest</p>
                    <p className="text-xl font-bold text-red-800">
                      {formatCurrency(calculation.total_interest)}
                    </p>
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Total Amount Payable</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatCurrency(calculation.total_amount)}
                  </p>
                </div>

                {/* Visual Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Payment Breakdown</h4>
                  <div className="relative">
                    <div className="flex h-8 rounded-lg overflow-hidden">
                      <div 
                        className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ 
                          width: `${(calculation.principal_amount / calculation.total_amount) * 100}%` 
                        }}
                      >
                        Principal
                      </div>
                      <div 
                        className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ 
                          width: `${(calculation.total_interest / calculation.total_amount) * 100}%` 
                        }}
                      >
                        Interest
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                      <span>Principal: {formatCurrency(calculation.principal_amount)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Interest: {formatCurrency(calculation.total_interest)}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <Button 
                  className={`w-full bg-gradient-to-r ${getColorClasses(currentConfig.color)} text-white py-3 text-lg font-semibold hover:opacity-90 transition-all duration-200`}
                >
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Adjust the loan parameters to see calculations
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Expenses Component
const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.category) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/expenses`, {
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        subcategory: newExpense.subcategory,
        description: newExpense.description,
        date: newExpense.date
      });
      
      toast.success('Expense added successfully');
      setNewExpense({
        amount: '',
        category: '',
        subcategory: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Expense Tracker</h2>
        <p className="text-gray-600">Track and manage your daily expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              <span>Add Expense</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({...newExpense, category: value, subcategory: ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newExpense.category && categories[newExpense.category] && (
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select
                    value={newExpense.subcategory}
                    onValueChange={(value) => setNewExpense({...newExpense, subcategory: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories[newExpense.category].map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-gray-600">Total Expenses</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No expenses recorded yet</p>
                ) : (
                  expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{expense.category}</Badge>
                          {expense.subcategory && (
                            <Badge variant="secondary">{expense.subcategory}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                        <p className="text-xs text-gray-500">{expense.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// AI Chat Component
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    checkModelStatus();
    // Add welcome message
    setMessages([{
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI Financial Assistant. I can help you with budgeting, investment advice, loan analysis, and general financial planning. What would you like to discuss today?',
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await axios.get(`${API}/ai/models`);
      setModelStatus(response.data);
    } catch (error) {
      console.error('Error checking model status:', error);
      setModelStatus({ status: 'error', message: 'AI service unavailable' });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/ai/analyze`, {
        query: inputMessage,
        analysis_type: analysisType,
        context: 'User is asking for financial advice through the AI chat interface'
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.data.analysis,
        recommendations: response.data.recommendations,
        confidence: response.data.confidence,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I\'m having trouble processing your request right now. This could be because Ollama is not installed or running. Please make sure you have Ollama installed and a model downloaded (like llama3.1) to use the AI features.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Financial Assistant</h2>
        <p className="text-gray-600">Get personalized financial advice powered by local AI</p>
        
        {/* Model Status */}
        <div className="mt-4">
          {modelStatus?.status === 'operational' ? (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">AI Assistant Online ({modelStatus.total_models} models available)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm">AI Assistant Offline - Please install Ollama and download a model</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span>Chat</span>
                </CardTitle>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Advice</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="budget">Budget Planning</SelectItem>
                    <SelectItem value="debt">Debt Management</SelectItem>
                    <SelectItem value="savings">Savings Goals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 bg-gray-50 rounded-lg">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      
                      {/* Recommendations */}
                      {message.recommendations && message.recommendations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-1 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs font-medium text-gray-600">Key Recommendations:</span>
                          </div>
                          <ul className="space-y-1">
                            {message.recommendations.map((rec, index) => (
                              <li key={index} className="text-xs text-gray-700 flex items-start space-x-1">
                                <span className="text-emerald-500">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me about your finances, investments, budgeting..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  question: "How much should I save for emergency fund?",
                  type: "savings"
                },
                {
                  question: "Should I prepay my home loan or invest?",
                  type: "debt"
                },
                {
                  question: "Best investment options for tax saving?",
                  type: "investment"
                },
                {
                  question: "How to create a monthly budget?",
                  type: "budget"
                },
                {
                  question: "Analyze my current spending pattern",
                  type: "general"
                }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-3 text-sm"
                  onClick={() => {
                    setAnalysisType(item.type);
                    setInputMessage(item.question);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-wrap">{item.question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">AI Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={modelStatus?.status === 'operational' ? 'default' : 'destructive'}>
                    {modelStatus?.status === 'operational' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Models</span>
                  <span className="text-sm font-medium">{modelStatus?.total_models || 0}</span>
                </div>
                {modelStatus?.status === 'error' && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    To enable AI features:
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Install Ollama</li>
                      <li>Run: ollama pull llama3.1</li>
                      <li>Restart the application</li>
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Income Component
const Income = () => {
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [newIncome, setNewIncome] = useState({
    amount: '',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    frequency: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const response = await axios.get(`${API}/income`);
      setIncomeRecords(response.data);
    } catch (error) {
      console.error('Error fetching income:', error);
      toast.error('Failed to load income records');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newIncome.amount || !newIncome.source) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/income`, {
        amount: parseFloat(newIncome.amount),
        source: newIncome.source,
        description: newIncome.description,
        date: newIncome.date,
        is_recurring: newIncome.is_recurring,
        frequency: newIncome.is_recurring ? newIncome.frequency : null
      });
      
      toast.success('Income added successfully');
      setNewIncome({
        amount: '',
        source: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        frequency: ''
      });
      fetchIncome();
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error('Failed to add income');
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

  const totalIncome = incomeRecords.reduce((sum, income) => sum + income.amount, 0);

  const incomeSources = [
    'Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Interest', 
    'Dividends', 'Bonus', 'Commission', 'Other'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Income Tracker</h2>
        <p className="text-gray-600">Track and manage your income sources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Income Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              <span>Add Income</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="source">Source *</Label>
                <Select
                  value={newIncome.source}
                  onValueChange={(value) => setNewIncome({...newIncome, source: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newIncome.date}
                  onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newIncome.is_recurring}
                  onChange={(e) => setNewIncome({...newIncome, is_recurring: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="recurring">Recurring Income</Label>
              </div>

              {newIncome.is_recurring && (
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newIncome.frequency}
                    onValueChange={(value) => setNewIncome({...newIncome, frequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Income'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Income List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Income Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-gray-600">Total Income</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Income */}
          <Card>
            <CardHeader>
              <CardTitle>Income Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomeRecords.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No income records yet</p>
                ) : (
                  incomeRecords.slice(0, 10).map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{income.source}</Badge>
                          {income.is_recurring && (
                            <Badge variant="secondary">Recurring</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{income.description}</p>
                        <p className="text-xs text-gray-500">{income.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">
                          +{formatCurrency(income.amount)}
                        </p>
                        {income.frequency && (
                          <p className="text-xs text-gray-500 capitalize">{income.frequency}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Savings Goals Component
const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API}/savings-goals`);
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load savings goals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newGoal.goal_name || !newGoal.target_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/savings-goals`, {
        goal_name: newGoal.goal_name,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount) || 0,
        target_date: newGoal.target_date || null,
        description: newGoal.description
      });
      
      toast.success('Savings goal created successfully');
      setNewGoal({
        goal_name: '',
        target_amount: '',
        current_amount: '',
        target_date: '',
        description: ''
      });
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create savings goal');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (goalId, amount) => {
    try {
      await axios.put(`${API}/savings-goals/${goalId}/progress?amount=${amount}`);
      toast.success('Progress updated successfully');
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
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

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Savings Goals</h2>
        <p className="text-gray-600">Set and track your financial goals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Goal Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>New Goal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="goal_name">Goal Name *</Label>
                <Input
                  id="goal_name"
                  placeholder="e.g., Emergency Fund"
                  value={newGoal.goal_name}
                  onChange={(e) => setNewGoal({...newGoal, goal_name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="target_amount">Target Amount *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  placeholder="Enter target amount"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({...newGoal, target_amount: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="current_amount">Current Amount</Label>
                <Input
                  id="current_amount"
                  type="number"
                  placeholder="Enter current amount"
                  value={newGoal.current_amount}
                  onChange={(e) => setNewGoal({...newGoal, current_amount: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Goal'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Goals List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Goals Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Total Target</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatCurrency(totalTargetAmount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Total Saved</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(totalCurrentAmount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium">Overall Progress</p>
                  <p className="text-xl font-bold text-purple-800">
                    {overallProgress.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No savings goals yet. Create your first goal!</p>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-6 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{goal.goal_name}</h3>
                          {goal.description && (
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          )}
                          {goal.target_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Target: {new Date(goal.target_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </p>
                          <Badge 
                            variant={goal.progress_percentage >= 100 ? "default" : "outline"}
                            className={goal.progress_percentage >= 100 ? "bg-green-500" : ""}
                          >
                            {goal.progress_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      {/* Remaining Amount */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Remaining: {formatCurrency(goal.target_amount - goal.current_amount)}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const amount = prompt('Enter amount to add:');
                              if (amount && !isNaN(amount)) {
                                updateProgress(goal.id, parseFloat(amount));
                              }
                            }}
                          >
                            Add Progress
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<LoanCalculator />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/income" element={<Income />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/ai-chat" element={<AIChat />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;