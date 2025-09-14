import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import CustomDialog from '../components/ui/CustomDialog';
import { API_BASE_URL } from '../constants/api';

const Income = () => {
  const { getAuthHeader } = useContext(AuthContext);
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
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/incomes`, { headers: getAuthHeader() });
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
      await axios.post(`${API_BASE_URL}/incomes`, {
        amount: parseFloat(newIncome.amount),
        source: newIncome.source,
        description: newIncome.description,
        date: newIncome.date,
        is_recurring: newIncome.is_recurring,
        frequency: newIncome.is_recurring ? newIncome.frequency : null
      }, { headers: getAuthHeader() });

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

  const handleUpdateIncome = async (e) => {
    e.preventDefault();
    if (!selectedIncome.amount || !selectedIncome.source) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/incomes/${selectedIncome.id}`, {
        amount: parseFloat(selectedIncome.amount),
        source: selectedIncome.source,
        description: selectedIncome.description,
        date: selectedIncome.date,
        is_recurring: selectedIncome.is_recurring,
        frequency: selectedIncome.is_recurring ? selectedIncome.frequency : null
      }, { headers: getAuthHeader() });

      toast.success('Income updated successfully');
      setIsEditDialogOpen(false);
      fetchIncome();
    } catch (error) {
      console.error('Error updating income:', error);
      toast.error('Failed to update income');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = (incomeId) => {
    setSelectedIncome(incomeRecords.find(inc => inc.id === incomeId));
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteIncome = async () => {
    if (selectedIncome?.id) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/incomes/${selectedIncome.id}`, { headers: getAuthHeader() });
        toast.success('Income deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchIncome();
      } catch (error) {
        console.error('Error deleting income:', error);
        toast.error('Failed to delete income');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (income) => {
    setSelectedIncome(income);
    setIsDetailDialogOpen(true);
  };

  const handleEditIncome = (income) => {
    setSelectedIncome({ ...income });
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

  const totalIncome = incomeRecords.reduce((sum, income) => sum + income.amount, 0);

  const incomeSources = [
    'Salary', 'Freelance', 'Business', 'Investments', 'Rental', 'Interest',
    'Dividends', 'Bonus', 'Commission', 'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Income Tracker
          </h2>
          <p className="text-gray-300 text-lg">Track and manage your income sources</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Income Form */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <Plus className="h-5 w-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Add Income</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-300">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="source" className="text-sm font-medium text-gray-300">Source *</Label>
                <Select
                  value={newIncome.source}
                  onValueChange={(value) => setNewIncome({ ...newIncome, source: value })}
                >
                  <SelectTrigger className="bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                    {incomeSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-300">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-300">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newIncome.date}
                  onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newIncome.is_recurring}
                  onChange={(e) => setNewIncome({ ...newIncome, is_recurring: e.target.checked })}
                  className="rounded text-emerald-400"
                />
                <Label htmlFor="recurring" className="text-sm font-medium text-gray-300">Recurring Income</Label>
              </div>

              {newIncome.is_recurring && (
                <div>
                  <Label htmlFor="frequency" className="text-sm font-medium text-gray-300">Frequency</Label>
                  <Select
                    value={newIncome.frequency}
                    onValueChange={(value) => setNewIncome({ ...newIncome, frequency: value })}
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Income'}
              </Button>
            </form>
          </div>

          {/* Income List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Income Summary</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-gray-500">Total Income</p>
              </div>
            </div>

            {/* Recent Income */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Income Records</h3>
              </div>
              <div className="space-y-4">
                {incomeRecords.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No income records yet</p>
                ) : (
                  incomeRecords.slice(0, 10).map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500">{income.source}</Badge>
                          {income.is_recurring && (
                            <Badge variant="secondary" className="text-gray-300 bg-gray-700">Recurring</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{income.description}</p>
                        <p className="text-xs text-gray-500">{income.date}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(income)}
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditIncome(income)}
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteIncome(income.id)}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <p className="text-lg font-semibold text-emerald-400">
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
            </div>
          </div>
        </div>
      </div>

      {/* Edit Income Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Edit Income
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
          <form onSubmit={handleUpdateIncome} className="space-y-4">
            <div>
              <Label htmlFor="edit-amount" className="text-sm font-medium text-gray-300">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                value={selectedIncome?.amount || ''}
                onChange={(e) => setSelectedIncome({ ...selectedIncome, amount: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-source" className="text-sm font-medium text-gray-300">Source *</Label>
              <Select
                value={selectedIncome?.source || ''}
                onValueChange={(value) => setSelectedIncome({ ...selectedIncome, source: value })}
              >
                <SelectTrigger className="bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Select income source" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                  {incomeSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium text-gray-300">Description</Label>
              <Input
                id="edit-description"
                value={selectedIncome?.description || ''}
                onChange={(e) => setSelectedIncome({ ...selectedIncome, description: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div>
              <Label htmlFor="edit-date" className="text-sm font-medium text-gray-300">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={selectedIncome?.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedIncome({ ...selectedIncome, date: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-recurring"
                checked={selectedIncome?.is_recurring || false}
                onChange={(e) => setSelectedIncome({ ...selectedIncome, is_recurring: e.target.checked })}
                className="rounded text-emerald-400"
              />
              <Label htmlFor="edit-recurring" className="text-sm font-medium text-gray-300">Recurring Income</Label>
            </div>
            {selectedIncome?.is_recurring && (
              <div>
                <Label htmlFor="edit-frequency" className="text-sm font-medium text-gray-300">Frequency</Label>
                <Select
                  value={selectedIncome?.frequency || ''}
                  onValueChange={(value) => setSelectedIncome({ ...selectedIncome, frequency: value })}
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

      {/* Detail Income Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Income Details
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
          {selectedIncome && (
            <div className="space-y-4 text-white">
              <p><strong>Amount:</strong> {formatCurrency(selectedIncome.amount)}</p>
              <p><strong>Source:</strong> {selectedIncome.source}</p>
              <p><strong>Description:</strong> {selectedIncome.description || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(selectedIncome.date).toLocaleDateString()}</p>
              <p><strong>Recurring:</strong> {selectedIncome.is_recurring ? 'Yes' : 'No'}</p>
              {selectedIncome.is_recurring && (
                <p><strong>Frequency:</strong> {selectedIncome.frequency}</p>
              )}
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
        onConfirm={confirmDeleteIncome}
        confirmText="Delete"
        isLoading={loading}
      >
        <p>Are you sure you want to delete this income record?</p>
        <p className="mt-2 text-gray-400">This action cannot be undone.</p>
      </CustomDialog>
    </div>
  );
};

export default Income;