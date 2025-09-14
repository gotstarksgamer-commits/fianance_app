import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { Home, Car, CreditCard } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { API_BASE_URL } from '../constants/api';

const LoanCalculator = () => {
  const [loanType, setLoanType] = useState('home');
  const [principal, setPrincipal] = useState([2000000]); // Default 20 lakh
  const [interestRate, setInterestRate] = useState([9]); // Default 9%
  const [tenure, setTenure] = useState([240]); // Default 20 years in months
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAuthHeader } = useContext(AuthContext);

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
      color: 'purple'
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
      color: 'indigo'
    }
  };

  const currentConfig = loanConfigs[loanType];

  useEffect(() => {
    calculateLoan();
  }, [principal, interestRate, tenure, loanType]);

  const calculateLoan = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/loans/calculate`, {
        loan_type: loanType,
        principal_amount: principal[0],
        interest_rate: interestRate[0],
        tenure_months: tenure[0]
      }, { headers: getAuthHeader() });
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
      purple: 'from-purple-500 to-indigo-600',
      blue: 'from-blue-500 to-cyan-600',
      indigo: 'from-indigo-500 to-purple-600'
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Loan Calculator
          </h2>
          <p className="text-gray-300 text-lg">Calculate EMI for Home, Car, and Personal loans</p>
        </div>

        {/* Loan Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Object.entries(loanConfigs).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={type}
                className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-2xl hover:scale-105 ${loanType === type
                    ? 'ring-2 ring-offset-2 ring-' + config.color + '-500'
                    : ''
                  }`}
                onClick={() => setLoanType(type)}
              >
                <div className="text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${loanType === type ? `text-${config.color}-400` : 'text-gray-400'}`} />
                  <h3 className={`font-semibold ${loanType === type ? `text-${config.color}-200` : 'text-gray-300'}`}>
                    {config.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Input */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center space-x-2 mb-6">
              <currentConfig.icon className={`h-5 w-5 text-${currentConfig.color}-400`} />
              <h3 className="text-xl font-bold text-white">{currentConfig.title}</h3>
            </div>
            <div className="space-y-8">
              {/* Loan Amount */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-gray-300">Loan Amount</Label>
                  <Input
                    type="number"
                    value={principal[0]}
                    onChange={(e) => setPrincipal([parseInt(e.target.value) || 0])}
                    className="w-32 text-right bg-white/10 text-white border-white/20"
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
                  <Label className="text-sm font-medium text-gray-300">Rate of Interest</Label>
                  <div className="flex items-center space-x-1">
                    <Input
                      type="number"
                      value={interestRate[0]}
                      onChange={(e) => setInterestRate([parseFloat(e.target.value) || 0])}
                      className="w-20 text-right bg-white/10 text-white border-white/20"
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
                  <Label className="text-sm font-medium text-gray-300">Loan Tenure</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={tenure[0]}
                      onChange={(e) => setTenure([parseInt(e.target.value) || 0])}
                      className="w-20 text-right bg-white/10 text-white border-white/20"
                    />
                    <Select
                      value="months"
                      onValueChange={(value) => {
                        if (value === 'years') {
                          setTenure([Math.round(tenure[0] / 12)]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-20 bg-white/10 text-white border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/10 text-white border-white/20">
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
            </div>
          </div>

          {/* Calculator Results */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-6">Loan Summary</h3>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : calculation ? (
              <div className="space-y-6">
                {/* EMI Display */}
                <div className="text-center p-6 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl">
                  <p className="text-sm text-gray-300 mb-2">Your monthly EMI is</p>
                  <p className={`text-4xl font-bold bg-gradient-to-r ${getColorClasses(currentConfig.color)} bg-clip-text text-transparent`}>
                    {formatCurrency(calculation.emi_amount)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {interestRate[0]}% interest rate per annum
                  </p>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl">
                    <p className="text-sm text-gray-300 font-medium">Principal Amount</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(calculation.principal_amount)}
                    </p>
                  </div>
                  <div className="text-center p-4 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl">
                    <p className="text-sm text-gray-300 font-medium">Total Interest</p>
                    <p className="text-xl font-bold text-red-400">
                      {formatCurrency(calculation.total_interest)}
                    </p>
                  </div>
                </div>

                <div className="text-center p-4 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl">
                  <p className="text-sm text-gray-300 font-medium">Total Amount Payable</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatCurrency(calculation.total_amount)}
                  </p>
                </div>

                {/* Visual Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-300">Payment Breakdown</h4>
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
                  <div className="flex justify-between text-sm text-gray-300">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;