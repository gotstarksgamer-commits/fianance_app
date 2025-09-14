import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart3, AlertTriangle, Edit, Trash2, Eye, X } from 'lucide-react';
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

const Budgets = () => {
  const { getAuthHeader } = useContext(AuthContext); // Access getAuthHeader
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState({
    category: '',
    monthly_limit: '',
    alert_threshold: 80
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState({});
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/budgets`, { headers: getAuthHeader() });
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, { headers: getAuthHeader() });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBudget.category || !newBudget.monthly_limit) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/budgets`, {
        category: newBudget.category,
        monthly_limit: parseFloat(newBudget.monthly_limit),
        alert_threshold: newBudget.alert_threshold
      }, { headers: getAuthHeader() });

      toast.success('Budget created successfully');
      setNewBudget({
        category: '',
        monthly_limit: '',
        alert_threshold: 80
      });
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error('Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (!selectedBudget.category || !selectedBudget.monthly_limit) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/budgets/${selectedBudget.id}`, {
        category: selectedBudget.category,
        monthly_limit: parseFloat(selectedBudget.monthly_limit),
        alert_threshold: selectedBudget.alert_threshold
      }, { headers: getAuthHeader() });

      toast.success('Budget updated successfully');
      setIsEditDialogOpen(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = (budgetId) => {
    setSelectedBudget(budgets.find(b => b.id === budgetId));
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBudget = async () => {
    if (selectedBudget?.id) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/budgets/${selectedBudget.id}`, { headers: getAuthHeader() });
        toast.success('Budget deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
        toast.error('Failed to delete budget');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (budget) => {
    setSelectedBudget(budget);
    setIsDetailDialogOpen(true);
  };

  const handleEditBudget = (budget) => {
    setSelectedBudget({ ...budget });
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

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.monthly_limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.current_spent, 0);
  const budgetAlerts = budgets.filter(budget => budget.percentage_used >= budget.alert_threshold);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Budget Management
          </h2>
          <p className="text-gray-300 text-lg">Set and monitor spending limits by category</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Budget Form */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Set Budget</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-300">Category *</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                >
                  <SelectTrigger className="bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                    {Object.keys(categories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="monthly_limit" className="text-sm font-medium text-gray-300">Monthly Limit *</Label>
                <Input
                  id="monthly_limit"
                  type="number"
                  placeholder="Enter monthly limit"
                  value={newBudget.monthly_limit}
                  onChange={(e) => setNewBudget({ ...newBudget, monthly_limit: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="alert_threshold" className="text-sm font-medium text-gray-300">Alert Threshold (%)</Label>
                <Input
                  id="alert_threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={newBudget.alert_threshold}
                  onChange={(e) => setNewBudget({ ...newBudget, alert_threshold: parseInt(e.target.value) })}
                  className="bg-white/10 text-white border-white/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get alerts when spending reaches this percentage
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? 'Setting...' : 'Set Budget'}
              </Button>
            </form>
          </div>

          {/* Budget Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Budget Overview</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-blue-300 font-medium">Total Budget</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-red-300 font-medium">Total Spent</p>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-green-300 font-medium">Remaining</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(totalBudget - totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Alerts */}
            {budgetAlerts.length > 0 && (
              <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  <h3 className="text-xl font-bold text-white">Budget Alerts</h3>
                </div>
                <div className="space-y-3">
                  {budgetAlerts.map((budget) => (
                    <div key={budget.id} className="flex items-center justify-between p-3 bg-white/10 border border-orange-500 rounded-lg">
                      <div>
                        <p className="font-medium text-orange-300">{budget.category}</p>
                        <p className="text-sm text-orange-400">
                          {budget.percentage_used.toFixed(1)}% of budget used
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-300">
                          {formatCurrency(budget.current_spent)} / {formatCurrency(budget.monthly_limit)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Details */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Budget Details</h3>
              </div>
              <div className="space-y-6">
                {budgets.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No budgets set yet. Create your first budget!</p>
                ) : (
                  budgets.map((budget) => (
                    <div key={budget.id} className="p-4 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-200">{budget.category}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {budget.is_over_budget ? (
                              <Badge variant="destructive" className="bg-red-500 text-white">Over Budget</Badge>
                            ) : budget.percentage_used >= budget.alert_threshold ? (
                              <Badge variant="outline" className="border-orange-500 text-orange-300">
                                Alert Zone
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-500 text-green-300">
                                On Track
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewDetails(budget)}
                            className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditBudget(budget)}
                            className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <p className="text-lg font-semibold text-gray-200">
                            {formatCurrency(budget.current_spent)} / {formatCurrency(budget.monthly_limit)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${budget.is_over_budget
                              ? 'bg-red-500'
                              : budget.percentage_used >= budget.alert_threshold
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-400 mt-2">
                        <span>Remaining: {formatCurrency(budget.remaining)}</span>
                        <span>Alert at: {budget.alert_threshold}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Edit Budget
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
          <form onSubmit={handleUpdateBudget} className="space-y-4">
            <div>
              <Label htmlFor="edit-category" className="text-sm font-medium text-gray-300">Category *</Label>
              <Select
                value={selectedBudget?.category || ''}
                onValueChange={(value) => setSelectedBudget({ ...selectedBudget, category: value })}
              >
                <SelectTrigger className="bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                  {Object.keys(categories).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-monthly_limit" className="text-sm font-medium text-gray-300">Monthly Limit *</Label>
              <Input
                id="edit-monthly_limit"
                type="number"
                value={selectedBudget?.monthly_limit || ''}
                onChange={(e) => setSelectedBudget({ ...selectedBudget, monthly_limit: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-alert_threshold" className="text-sm font-medium text-gray-300">Alert Threshold (%)</Label>
              <Input
                id="edit-alert_threshold"
                type="number"
                min="1"
                max="100"
                value={selectedBudget?.alert_threshold || 80}
                onChange={(e) => setSelectedBudget({ ...selectedBudget, alert_threshold: parseInt(e.target.value) })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
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

      {/* Detail Budget Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Budget Details
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
          {selectedBudget && (
            <div className="space-y-4 text-white">
              <p><strong>Category:</strong> {selectedBudget.category}</p>
              <p><strong>Monthly Limit:</strong> {formatCurrency(selectedBudget.monthly_limit)}</p>
              <p><strong>Current Spent:</strong> {formatCurrency(selectedBudget.current_spent)}</p>
              <p><strong>Remaining:</strong> {formatCurrency(selectedBudget.remaining)}</p>
              <p><strong>Percentage Used:</strong> {selectedBudget.percentage_used?.toFixed(1) || 0}%</p>
              <p><strong>Alert Threshold:</strong> {selectedBudget.alert_threshold}%</p>
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
        onConfirm={confirmDeleteBudget}
        confirmText="Delete"
        isLoading={loading}
      >
        <p>Are you sure you want to delete this budget?</p>
        <p className="mt-2 text-gray-400">This action cannot be undone.</p>
      </CustomDialog>
    </div>
  );
};

export default Budgets;