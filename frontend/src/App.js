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
  Lightbulb
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

// Placeholder components for other routes
const Income = () => (
  <div className="container mx-auto px-4 py-8">
    <Card>
      <CardHeader>
        <CardTitle>Income Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Income tracking features coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

const Goals = () => (
  <div className="container mx-auto px-4 py-8">
    <Card>
      <CardHeader>
        <CardTitle>Savings Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Savings goals features coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

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
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;