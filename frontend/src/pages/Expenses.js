import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { API_BASE_URL } from '../constants/api';
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

const Expenses = () => {
  const { getAuthHeader } = useContext(AuthContext);
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
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses`, { headers: getAuthHeader() });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
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
    if (!newExpense.amount || !newExpense.category) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/expenses`, {
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        subcategory: newExpense.subcategory,
        description: newExpense.description,
        date: newExpense.date
      }, { headers: getAuthHeader() });

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

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!selectedExpense.amount || !selectedExpense.category) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/expenses/${selectedExpense.id}`, {
        amount: parseFloat(selectedExpense.amount),
        category: selectedExpense.category,
        subcategory: selectedExpense.subcategory,
        description: selectedExpense.description,
        date: selectedExpense.date
      }, { headers: getAuthHeader() });

      toast.success('Expense updated successfully');
      setIsEditDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    setSelectedExpense(expenses.find(exp => exp.id === expenseId));
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (selectedExpense?.id) {
      try {
        await axios.delete(`${API_BASE_URL}/expenses/${selectedExpense.id}`, { headers: getAuthHeader() });
        toast.success('Expense deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleViewDetails = async (expenseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/${expenseId}`, { headers: getAuthHeader() });
      setSelectedExpense(response.data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching expense details:', error);
      toast.error('Failed to load expense details');
    }
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense({ ...expense });
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Expense Tracker
          </h2>
          <p className="text-gray-300 text-lg">Track and manage your daily expenses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <Plus className="h-5 w-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Add Expense</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-300">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-300">Category *</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value, subcategory: '' })}
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

              {newExpense.category && categories[newExpense.category] && (
                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium text-gray-300">Subcategory</Label>
                  <Select
                    value={newExpense.subcategory}
                    onValueChange={(value) => setNewExpense({ ...newExpense, subcategory: value })}
                  >
                    <SelectTrigger className="bg-white/10 text-white border-white/20">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
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
                <Label htmlFor="description" className="text-sm font-medium text-gray-300">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-300">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Expense Summary</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-gray-500">Total Expenses</p>
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Recent Expenses</h3>
              </div>
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No expenses recorded yet</p>
                ) : (
                  expenses.slice(0, 10).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-gray-300 border-gray-500">{expense.category}</Badge>
                          {expense.subcategory && (
                            <Badge variant="secondary" className="text-gray-300 bg-gray-700">{expense.subcategory}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{expense.description}</p>
                        <p className="text-xs text-gray-500">{expense.date}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewDetails(expense.id)}
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditExpense(expense)}
                          className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <p className="text-lg font-semibold text-red-400">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white flex justify-between items-center">
                Edit Expense
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
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <Label htmlFor="edit-amount" className="text-sm font-medium text-gray-300">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={selectedExpense?.amount || ''}
                  onChange={(e) => setSelectedExpense({ ...selectedExpense, amount: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category" className="text-sm font-medium text-gray-300">Category *</Label>
                <Select
                  value={selectedExpense?.category || ''}
                  onValueChange={(value) => setSelectedExpense({ ...selectedExpense, category: value, subcategory: '' })}
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
              {selectedExpense?.category && categories[selectedExpense.category] && (
                <div>
                  <Label htmlFor="edit-subcategory" className="text-sm font-medium text-gray-300">Subcategory</Label>
                  <Select
                    value={selectedExpense?.subcategory || ''}
                    onValueChange={(value) => setSelectedExpense({ ...selectedExpense, subcategory: value })}
                  >
                    <SelectTrigger className="bg-white/10 text-white border-white/20">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                      {categories[selectedExpense.category].map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium text-gray-300">Description</Label>
                <Input
                  id="edit-description"
                  value={selectedExpense?.description || ''}
                  onChange={(e) => setSelectedExpense({ ...selectedExpense, description: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>
              <div>
                <Label htmlFor="edit-date" className="text-sm font-medium text-gray-300">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={selectedExpense?.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedExpense({ ...selectedExpense, date: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
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

        {/* Detail Expense Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white flex justify-between items-center">
                Expense Details
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
            {selectedExpense && (
              <div className="space-y-4 text-white">
                <p><strong>Amount:</strong> {formatCurrency(selectedExpense.amount)}</p>
                <p><strong>Category:</strong> {selectedExpense.category}</p>
                {selectedExpense.subcategory && <p><strong>Subcategory:</strong> {selectedExpense.subcategory}</p>}
                <p><strong>Description:</strong> {selectedExpense.description || 'N/A'}</p>
                <p><strong>Date:</strong> {new Date(selectedExpense.date).toLocaleDateString()}</p>
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
          onConfirm={confirmDeleteExpense}
          confirmText="Delete"
          isLoading={loading}
        >
          <p>Are you sure you want to delete this expense?</p>
          <p className="mt-2 text-gray-400">This action cannot be undone.</p>
        </CustomDialog>
      </div>
    </div>
  );
};

export default Expenses;