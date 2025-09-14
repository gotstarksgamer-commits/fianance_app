import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { Target, Eye, Edit, Trash2, X, Home, Car, GraduationCap, Heart, Plane, ShieldCheck } from 'lucide-react';
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

const Goals = () => {
  const { getAuthHeader } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    description: '',
    goal_type: 'general' // ADD THIS
  });
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ADD GOAL TYPES CONFIGURATION
  const goalTypes = [
    { value: 'emergency', label: 'Emergency Fund', icon: ShieldCheck, color: 'text-red-400', bgColor: 'bg-red-500/20' },
    { value: 'retirement', label: 'Retirement', icon: Target, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { value: 'education', label: 'Education', icon: GraduationCap, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { value: 'home', label: 'Home Purchase', icon: Home, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { value: 'vacation', label: 'Vacation', icon: Plane, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    { value: 'car', label: 'Vehicle', icon: Car, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { value: 'wedding', label: 'Wedding', icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    { value: 'medical', label: 'Medical', icon: Heart, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { value: 'general', label: 'General', icon: Target, color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
  ];

  // ADD HELPER FUNCTION TO GET GOAL TYPE INFO
  const getGoalTypeInfo = (goalType) => {
    return goalTypes.find(type => type.value === goalType) || goalTypes.find(type => type.value === 'general');
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/savings-goals`, { headers: getAuthHeader() });
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
      await axios.post(`${API_BASE_URL}/savings-goals`, {
        goal_name: newGoal.goal_name,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount) || 0,
        target_date: newGoal.target_date || null,
        description: newGoal.description,
        goal_type: newGoal.goal_type // ADD THIS
      }, { headers: getAuthHeader() });

      toast.success('Savings goal created successfully');
      setNewGoal({
        goal_name: '',
        target_amount: '',
        current_amount: '',
        target_date: '',
        description: '',
        goal_type: 'general' // ADD THIS
      });
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create savings goal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    if (!selectedGoal.goal_name || !selectedGoal.target_amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/savings-goals/${selectedGoal.id}`, {
        goal_name: selectedGoal.goal_name,
        target_amount: parseFloat(selectedGoal.target_amount),
        current_amount: parseFloat(selectedGoal.current_amount) || 0,
        target_date: selectedGoal.target_date || null,
        description: selectedGoal.description,
        goal_type: selectedGoal.goal_type || 'general' // ADD THIS
      }, { headers: getAuthHeader() });

      toast.success('Goal updated successfully');
      setIsEditDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goalId) => {
    setSelectedGoal(goals.find(g => g.id === goalId));
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (selectedGoal?.id) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/savings-goals/${selectedGoal.id}`, { headers: getAuthHeader() });
        toast.success('Goal deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Failed to delete goal');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (goal) => {
    setSelectedGoal(goal);
    setIsDetailDialogOpen(true);
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal({ ...goal });
    setIsEditDialogOpen(true);
  };

  const updateProgress = async (goalId, amount) => {
    try {
      await axios.put(`${API_BASE_URL}/savings-goals/${goalId}/progress?amount=${amount}`, null, { headers: getAuthHeader() });
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

  // ADD FUNCTION TO GROUP GOALS BY TYPE
  const groupGoalsByType = () => {
    return goals.reduce((acc, goal) => {
      const goalType = goal.goal_type || 'general';
      if (!acc[goalType]) {
        acc[goalType] = [];
      }
      acc[goalType].push(goal);
      return acc;
    }, {});
  };

  const groupedGoals = groupGoalsByType();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            Savings Goals
          </h2>
          <p className="text-gray-300 text-lg">Set and track your financial goals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Goal Form */}
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-5 w-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">New Goal</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="goal_name" className="text-sm font-medium text-gray-300">Goal Name *</Label>
                <Input
                  id="goal_name"
                  placeholder="e.g., Emergency Fund"
                  value={newGoal.goal_name}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              {/* ADD GOAL TYPE FIELD */}
              <div>
                <Label htmlFor="goal_type" className="text-sm font-medium text-gray-300">Goal Type *</Label>
                <Select
                  value={newGoal.goal_type}
                  onValueChange={(value) => setNewGoal({ ...newGoal, goal_type: value })}
                >
                  <SelectTrigger className="bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className={`w-4 h-4 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_amount" className="text-sm font-medium text-gray-300">Target Amount *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  placeholder="Enter target amount"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                  required
                />
              </div>

              <div>
                <Label htmlFor="current_amount" className="text-sm font-medium text-gray-300">Current Amount</Label>
                <Input
                  id="current_amount"
                  type="number"
                  placeholder="Enter current amount"
                  value={newGoal.current_amount}
                  onChange={(e) => setNewGoal({ ...newGoal, current_amount: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="target_date" className="text-sm font-medium text-gray-300">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-300">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="bg-white/10 text-white border-white/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Goal'}
              </Button>
            </form>
          </div>

          {/* Goals List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview - UPDATED */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Goals Overview</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-blue-300 font-medium">Total Goals</p>
                  <p className="text-xl font-bold text-blue-400">
                    {goals.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-green-300 font-medium">Total Target</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(totalTargetAmount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-purple-300 font-medium">Total Saved</p>
                  <p className="text-xl font-bold text-purple-400">
                    {formatCurrency(totalCurrentAmount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <p className="text-sm text-cyan-300 font-medium">Overall Progress</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {overallProgress.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* ADD GOALS BY TYPE SUMMARY */}
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Goals by Type</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(groupedGoals).map(([type, typeGoals]) => {
                    const typeInfo = getGoalTypeInfo(type);
                    return (
                      <div key={type} className={`px-3 py-2 rounded-lg ${typeInfo.bgColor} border border-white/10`}>
                        <div className="flex items-center space-x-2">
                          <typeInfo.icon className={`w-4 h-4 ${typeInfo.color}`} />
                          <span className={`text-sm font-medium ${typeInfo.color}`}>
                            {typeInfo.label} ({typeGoals.length})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Goals List - UPDATED */}
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold text-white">Your Goals</h3>
              </div>
              <div className="space-y-6">
                {goals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No savings goals yet. Create your first goal!</p>
                ) : (
                  goals.map((goal) => {
                    const typeInfo = getGoalTypeInfo(goal.goal_type);
                    return (
                      <div key={goal.id} className="p-6 bg-white/10 rounded-lg border border-white/20">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                                <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-200">{goal.goal_name}</h3>
                                <Badge variant="outline" className={`${typeInfo.color} border-current`}>
                                  {typeInfo.label}
                                </Badge>
                              </div>
                            </div>
                            {goal.description && (
                              <p className="text-sm text-gray-400 ml-14">{goal.description}</p>
                            )}
                            {goal.target_date && (
                              <p className="text-xs text-gray-500 ml-14 mt-1">
                                Target: {new Date(goal.target_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">
                              {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                            </p>
                            <Badge
                              variant={goal.progress_percentage >= 100 ? "default" : "outline"}
                              className={goal.progress_percentage >= 100 ? "bg-green-500 text-white" : "text-gray-300 border-gray-500"}
                            >
                              {goal.progress_percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-4 ml-14">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                          ></div>
                        </div>

                        {/* Remaining Amount */}
                        <div className="flex justify-between items-center text-sm ml-14">
                          <span className="text-gray-400">
                            Remaining: {formatCurrency(goal.target_amount - goal.current_amount)}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleViewDetails(goal)}
                              className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEditGoal(goal)}
                              className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-500 text-gray-300 hover:bg-gray-700"
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
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Goal Dialog - UPDATED */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Edit Goal
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
          <form onSubmit={handleUpdateGoal} className="space-y-4">
            <div>
              <Label htmlFor="edit-goal_name" className="text-sm font-medium text-gray-300">Goal Name *</Label>
              <Input
                id="edit-goal_name"
                value={selectedGoal?.goal_name || ''}
                onChange={(e) => setSelectedGoal({ ...selectedGoal, goal_name: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            
            {/* ADD GOAL TYPE FIELD */}
            <div>
              <Label htmlFor="edit-goal_type" className="text-sm font-medium text-gray-300">Goal Type *</Label>
              <Select
                value={selectedGoal?.goal_type || 'general'}
                onValueChange={(value) => setSelectedGoal({ ...selectedGoal, goal_type: value })}
              >
                <SelectTrigger className="bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-200 border-gray-700">
                  {goalTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-target_amount" className="text-sm font-medium text-gray-300">Target Amount *</Label>
              <Input
                id="edit-target_amount"
                type="number"
                value={selectedGoal?.target_amount || ''}
                onChange={(e) => setSelectedGoal({ ...selectedGoal, target_amount: e.target.value })}
                className="bg-white/10 text-white border-white/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-current_amount" className="text-sm font-medium text-gray-300">Current Amount</Label>
              <Input
                id="edit-current_amount"
                type="number"
                value={selectedGoal?.current_amount || ''}
                onChange={(e) => setSelectedGoal({ ...selectedGoal, current_amount: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div>
              <Label htmlFor="edit-target_date" className="text-sm font-medium text-gray-300">Target Date</Label>
              <Input
                id="edit-target_date"
                type="date"
                value={selectedGoal?.target_date || ''}
                onChange={(e) => setSelectedGoal({ ...selectedGoal, target_date: e.target.value })}
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-sm font-medium text-gray-300">Description</Label>
              <Input
                id="edit-description"
                value={selectedGoal?.description || ''}
                onChange={(e) => setSelectedGoal({ ...selectedGoal, description: e.target.value })}
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

      {/* Detail Goal Dialog - UPDATED */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="bg-white/5 backdrop-blur-lg border border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex justify-between items-center">
              Goal Details
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
          {selectedGoal && (
            <div className="space-y-4 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const typeInfo = getGoalTypeInfo(selectedGoal.goal_type);
                      return (
                        <>
                          <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                            <typeInfo.icon className={`w-6 h-6 ${typeInfo.color}`} />
                          </div>
                          <div>
                            <p className="text-lg font-bold">{selectedGoal.goal_name}</p>
                            <Badge variant="outline" className={`${typeInfo.color} border-current`}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <p><strong>Target Date:</strong> {selectedGoal.target_date ? new Date(selectedGoal.target_date).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Description:</strong> {selectedGoal.description || 'N/A'}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-sm text-blue-300 mb-1">Target Amount</p>
                    <p className="text-xl font-bold text-blue-400">
                      {formatCurrency(selectedGoal.target_amount)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-sm text-green-300 mb-1">Current Amount</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(selectedGoal.current_amount)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-sm text-purple-300 mb-1">Progress</p>
                    <p className="text-xl font-bold text-purple-400">
                      {selectedGoal.progress_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-sm text-orange-300 mb-1">Remaining</p>
                    <p className="text-xl font-bold text-orange-400">
                      {formatCurrency(selectedGoal.target_amount - selectedGoal.current_amount)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(selectedGoal.progress_percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
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
        onConfirm={confirmDeleteGoal}
        confirmText="Delete"
        isLoading={loading}
      >
        <p>Are you sure you want to delete this goal?</p>
        <p className="mt-2 text-gray-400">This action cannot be undone.</p>
      </CustomDialog>
    </div>
  );
};

export default Goals;