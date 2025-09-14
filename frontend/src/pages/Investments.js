import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { TrendingUp, Edit, Trash2, Eye, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import CustomDialog from '../components/ui/CustomDialog';
import { API_BASE_URL } from '../constants/api';

const Investments = () => {
  const { getAuthHeader } = useContext(AuthContext);
  const [investments, setInvestments] = useState([]);
  const [newInvestment, setNewInvestment] = useState({
    investment_type: '',
    name: '',
    amount: '',
    current_value: '', // ADD THIS
    date: new Date().toISOString().split('T')[0],
    maturity_date: '',
    interest_rate: '',
    is_recurring: false,
    frequency: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/investments`, { headers: getAuthHeader() });
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast.error('Failed to load investments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newInvestment.investment_type || !newInvestment.name || !newInvestment.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/investments`, {
        investment_type: newInvestment.investment_type,
        name: newInvestment.name,
        amount: parseFloat(newInvestment.amount),
        current_value: newInvestment.current_value ? parseFloat(newInvestment.current_value) : null, // ADD THIS
        date: newInvestment.date,
        maturity_date: newInvestment.maturity_date || null,
        interest_rate: newInvestment.interest_rate ? parseFloat(newInvestment.interest_rate) : null,
        is_recurring: newInvestment.is_recurring,
        frequency: newInvestment.is_recurring ? newInvestment.frequency : null
      }, { headers: getAuthHeader() });

      toast.success('Investment added successfully');
      setNewInvestment({
        investment_type: '',
        name: '',
        amount: '',
        current_value: '', // ADD THIS
        date: new Date().toISOString().split('T')[0],
        maturity_date: '',
        interest_rate: '',
        is_recurring: false,
        frequency: ''
      });
      fetchInvestments();
    } catch (error) {
      console.error('Error adding investment:', error);
      toast.error('Failed to add investment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvestment = async (e) => {
    e.preventDefault();
    if (!selectedInvestment.investment_type || !selectedInvestment.name || !selectedInvestment.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/investments/${selectedInvestment.id}`, {
        investment_type: selectedInvestment.investment_type,
        name: selectedInvestment.name,
        amount: parseFloat(selectedInvestment.amount),
        current_value: selectedInvestment.current_value ? parseFloat(selectedInvestment.current_value) : null, // ADD THIS
        date: selectedInvestment.date,
        maturity_date: selectedInvestment.maturity_date || null,
        interest_rate: selectedInvestment.interest_rate ? parseFloat(selectedInvestment.interest_rate) : null,
        is_recurring: selectedInvestment.is_recurring,
        frequency: selectedInvestment.is_recurring ? selectedInvestment.frequency : null
      }, { headers: getAuthHeader() });

      toast.success('Investment updated successfully');
      setIsEditDialogOpen(false);
      fetchInvestments();
    } catch (error) {
      console.error('Error updating investment:', error);
      toast.error('Failed to update investment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvestment = (investmentId) => {
    setSelectedInvestment(investments.find(inv => inv.id === investmentId));
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteInvestment = async () => {
    if (selectedInvestment?.id) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/investments/${selectedInvestment.id}`, { headers: getAuthHeader() });
        toast.success('Investment deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchInvestments();
      } catch (error) {
        console.error('Error deleting investment:', error);
        toast.error('Failed to delete investment');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (investment) => {
    setSelectedInvestment(investment);
    setIsDetailDialogOpen(true);
  };

  const handleEditInvestment = (investment) => {
    setSelectedInvestment({ ...investment });
    setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ADD THESE HELPER FUNCTIONS
  const calculateReturns = (investment) => {
    const invested = investment.amount;
    const current = investment.current_value || investment.amount;
    return current - invested;
  };

  const calculateReturnPercentage = (investment) => {
    const invested = investment.amount;
    const current = investment.current_value || investment.amount;
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
  };

  const getReturnColor = (returnValue) => {
    if (returnValue > 0) return 'text-green-400';
    if (returnValue < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0); // ADD THIS
  const totalReturns = totalCurrentValue - totalInvestments; // ADD THIS

  const investmentTypes = [
    'SIP', 'Mutual Fund', 'Fixed Deposit', 'Stock', 'Bond', 'Gold', 'PPF', 'ELSS', 'NPS', 'Other'
  ];

  const investmentsByType = investments.reduce((acc, inv) => {
    acc[inv.investment_type] = (acc[inv.investment_type] || 0) + inv.amount;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Investment Portfolio
          </h2>
          <p className="text-gray-300 text-lg">Track and manage your investments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Investment Form */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Add Investment</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="investment_type" className="text-sm font-medium text-gray-300">Type *</Label>
                <Select
                  value={newInvestment.investment_type}
                  onValueChange={(value) => setNewInvestment({ ...newInvestment, investment_type: value })}
                >
                  <SelectTrigger className="bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                    {investmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., HDFC Top 100 Fund"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-300">Invested Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter invested amount"
                  value={newInvestment.amount}
                  onChange={(e) => setNewInvestment({ ...newInvestment, amount: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              {/* ADD THIS FIELD */}
              <div>
                <Label htmlFor="current_value" className="text-sm font-medium text-gray-300">
                  Current Value
                  <span className="text-xs text-gray-400 ml-1">(optional - defaults to invested amount)</span>
                </Label>
                <Input
                  id="current_value"
                  type="number"
                  placeholder="Enter current market value"
                  value={newInvestment.current_value}
                  onChange={(e) => setNewInvestment({ ...newInvestment, current_value: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-300">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newInvestment.date}
                  onChange={(e) => setNewInvestment({ ...newInvestment, date: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="maturity_date" className="text-sm font-medium text-gray-300">Maturity Date</Label>
                <Input
                  id="maturity_date"
                  type="date"
                  value={newInvestment.maturity_date}
                  onChange={(e) => setNewInvestment({ ...newInvestment, maturity_date: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="interest_rate" className="text-sm font-medium text-gray-300">Expected Return (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 12.5"
                  value={newInvestment.interest_rate}
                  onChange={(e) => setNewInvestment({ ...newInvestment, interest_rate: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newInvestment.is_recurring}
                  onChange={(e) => setNewInvestment({ ...newInvestment, is_recurring: e.target.checked })}
                  className="rounded text-blue-400"
                />
                <Label htmlFor="recurring" className="text-sm font-medium text-gray-300">Recurring Investment</Label>
              </div>

              {newInvestment.is_recurring && (
                <div>
                  <Label htmlFor="frequency" className="text-sm font-medium text-gray-300">Frequency</Label>
                  <Select
                    value={newInvestment.frequency}
                    onValueChange={(value) => setNewInvestment({ ...newInvestment, frequency: value })}
                  >
                    <SelectTrigger className="bg-white/10 text-white border-white/20">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/10 text-white border-white/20">
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Investment'}
              </Button>
            </form>
          </div>

          {/* Investments Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Summary - UPDATED */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Portfolio Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-blue-300 font-medium">Invested</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(totalInvestments)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-purple-300 font-medium">Current Value</p>
                  <p className="text-xl font-bold text-purple-400">
                    {formatCurrency(totalCurrentValue)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-gray-300 font-medium">Returns</p>
                  <div className="flex items-center justify-center space-x-1">
                    {totalReturns > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : totalReturns < 0 ? (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    ) : null}
                    <p className={`text-xl font-bold ${getReturnColor(totalReturns)}`}>
                      {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
                    </p>
                  </div>
                  {totalInvestments > 0 && (
                    <p className={`text-xs ${getReturnColor(totalReturns)}`}>
                      {((totalReturns / totalInvestments) * 100).toFixed(2)}%
                    </p>
                  )}
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-green-300 font-medium">Investment Types</p>
                  <p className="text-xl font-bold text-green-400">
                    {Object.keys(investmentsByType).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Investment Breakdown */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Investment Breakdown</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(investmentsByType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">{type}</span>
                    <Badge variant="outline" className="text-gray-300 border-gray-500">{formatCurrency(amount)}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Investments - UPDATED */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Recent Investments</h3>
              </div>
              <div className="space-y-4">
                {investments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No investments recorded yet</p>
                ) : (
                  investments.slice(0, 10).map((investment) => {
                    const returns = calculateReturns(investment);
                    const returnPercentage = calculateReturnPercentage(investment);
                    
                    return (
                      <div key={investment.id} className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-gray-300 border-gray-500">{investment.investment_type}</Badge>
                            {investment.is_recurring && (
                              <Badge variant="secondary" className="text-gray-300 bg-gray-700">Recurring</Badge>
                            )}
                          </div>
                          <p className="font-medium mt-1 text-gray-200">{investment.name}</p>
                          <p className="text-xs text-gray-500">{investment.date}</p>
                          {investment.interest_rate && (
                            <p className="text-xs text-green-400">Expected: {investment.interest_rate}%</p>
                          )}
                          {/* ADD RETURN INFO */}
                          {returns !== 0 && (
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1">
                                {returns > 0 ? (
                                  <ArrowUp className="w-3 h-3 text-green-400" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 text-red-400" />
                                )}
                                <span className={`text-xs font-medium ${getReturnColor(returns)}`}>
                                  {returns >= 0 ? '+' : ''}{formatCurrency(returns)}
                                </span>
                              </div>
                              <span className={`text-xs ${getReturnColor(returns)}`}>
                                ({returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right mr-2">
                            <p className="text-sm font-semibold text-blue-400">
                              {formatCurrency(investment.amount)}
                            </p>
                            {investment.current_value && investment.current_value !== investment.amount && (
                              <p className="text-xs text-purple-400">
                                → {formatCurrency(investment.current_value)}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewDetails(investment)}
                            className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditInvestment(investment)}
                            className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteInvestment(investment.id)}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Investment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Edit Investment
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5 transition-colors duration-200 hover:text-white" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateInvestment} className="space-y-4">
            <div>
              <Label htmlFor="edit-type" className="text-sm font-medium text-gray-300">Type *</Label>
              <Select
                value={selectedInvestment?.investment_type || ''}
                onValueChange={(value) => setSelectedInvestment({ ...selectedInvestment, investment_type: value })}
              >
                <SelectTrigger className="bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Select investment type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                  {investmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-300">Name *</Label>
              <Input
                id="edit-name"
                value={selectedInvestment?.name || ''}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, name: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-amount" className="text-sm font-medium text-gray-300">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                value={selectedInvestment?.amount || ''}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, amount: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-current_value" className="text-sm font-medium text-gray-300">Current Value</Label>
              <Input
                id="edit-current_value"
                type="number"
                value={selectedInvestment?.current_value || ''}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, current_value: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div>
              <Label htmlFor="edit-date" className="text-sm font-medium text-gray-300">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={selectedInvestment?.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, date: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-maturity_date" className="text-sm font-medium text-gray-300">Maturity Date</Label>
              <Input
                id="edit-maturity_date"
                type="date"
                value={selectedInvestment?.maturity_date || ''}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, maturity_date: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div>
              <Label htmlFor="edit-interest_rate" className="text-sm font-medium text-gray-300">Expected Return (%)</Label>
              <Input
                id="edit-interest_rate"
                type="number"
                step="0.1"
                value={selectedInvestment?.interest_rate || ''}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, interest_rate: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-recurring"
                checked={selectedInvestment?.is_recurring || false}
                onChange={(e) => setSelectedInvestment({ ...selectedInvestment, is_recurring: e.target.checked })}
                className="rounded text-blue-400"
              />
              <Label htmlFor="edit-recurring" className="text-sm font-medium text-gray-300">Recurring Investment</Label>
            </div>
            {selectedInvestment?.is_recurring && (
              <div>
                <Label htmlFor="edit-frequency" className="text-sm font-medium text-gray-300">Frequency</Label>
                <Select
                  value={selectedInvestment?.frequency || ''}
                  onValueChange={(value) => setSelectedInvestment({ ...selectedInvestment, frequency: value })}
                >
                  <SelectTrigger className="bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Investment Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Investment Details
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailDialogOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5 transition-colors duration-200 hover:text-white" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4 text-white">
              <p><strong>Name:</strong> {selectedInvestment.name}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedInvestment.amount)}</p>
              <p><strong>Current Value:</strong> {formatCurrency(selectedInvestment.current_value)}</p>
              <p><strong>Type:</strong> {selectedInvestment.investment_type}</p>
              <p><strong>Date:</strong> {new Date(selectedInvestment.date).toLocaleDateString()}</p>
              {selectedInvestment.maturity_date && <p><strong>Maturity Date:</strong> {new Date(selectedInvestment.maturity_date).toLocaleDateString()}</p>}
              {selectedInvestment.interest_rate && <p><strong>Expected Return:</strong> {selectedInvestment.interest_rate}%</p>}
              <p><strong>Recurring:</strong> {selectedInvestment.is_recurring ? 'Yes' : 'No'}</p>
              {selectedInvestment.is_recurring && <p><strong>Frequency:</strong> {selectedInvestment.frequency}</p>}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
              className="text-gray-300 border-gray-500 hover:bg-gray-700/50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirm Deletion"
        onConfirm={confirmDeleteInvestment}
        confirmText="Delete"
        isLoading={loading}
      >
        <p>Are you sure you want to delete this investment?</p>
        <p className="mt-2 text-gray-400">This action cannot be undone.</p>
      </CustomDialog>
    </div>
  );
};

export default Investments;