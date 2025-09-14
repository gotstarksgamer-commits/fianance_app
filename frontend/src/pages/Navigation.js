import { useLocation, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from "../context/AuthContext";
import { 
  Wallet, 
  PieChart, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calculator, 
  Brain 
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: PieChart },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/income', label: 'Income', icon: DollarSign },
    { path: '/investments', label: 'Investments', icon: TrendingUp },
    { path: '/budgets', label: 'Budgets', icon: Target },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/loans', label: 'Loan Calculator', icon: Calculator },
    { path: '/ai-chat', label: 'AI Assistant', icon: Brain }
  ];

  const handleLogout = async () => {
    await logout();   
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white shadow-lg backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-purple-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">Finance Tracker</h1>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-lg bg-white/5 border border-white/10 hover:bg-white/10 ${isActive
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'text-white/80 hover:text-white'
                    }`}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            {/* 🚀 Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-lg bg-white/5 border border-white/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            >
              <Brain size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;