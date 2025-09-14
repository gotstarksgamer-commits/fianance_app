import React from 'react';
import { Heart, Shield, TrendingUp, Target, CheckCircle, AlertCircle } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10 ${className}`}>
    {children}
  </div>
);

const CircularProgress = ({ score, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

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
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-2000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white text-2xl font-bold">{score}</span>
        <span className="text-gray-400 text-xs">Score</span>
      </div>
    </div>
  );
};

const ComponentScore = ({ name, score, icon: Icon }) => {
  const getColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBgColor = (score) => {
    if (score >= 80) return 'border-green-500/20 bg-green-500/5';
    if (score >= 60) return 'border-yellow-500/20 bg-yellow-500/5';
    return 'border-red-500/20 bg-red-500/5';
  };

  return (
    <div className={`p-4 rounded-lg border ${getBgColor(score)} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${getColor(score)}`} />
          <span className="text-white text-sm font-medium">{name}</span>
        </div>
        <span className={`text-sm font-bold ${getColor(score)}`}>{score}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            score >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
            score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
            'bg-gradient-to-r from-red-500 to-red-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const FinancialHealthScore = ({ healthData = null }) => {
  if (!healthData || !healthData.health_score) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-pink-500/20 rounded-lg">
            <Heart className="w-5 h-5 text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Financial Health Score</h3>
        </div>
        <div className="text-center py-8">
          <div className="p-4 bg-gray-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No health data available</p>
          <p className="text-gray-500 text-sm mt-1">Complete your profile to get health score</p>
        </div>
      </GlassCard>
    );
  }

  const healthScore = healthData.health_score;
  
  const getScoreMessage = (score) => {
    if (score >= 80) return { text: "Excellent Financial Health!", color: "text-green-400" };
    if (score >= 60) return { text: "Good Financial Health", color: "text-yellow-400" };
    if (score >= 40) return { text: "Fair Financial Health", color: "text-orange-400" };
    return { text: "Needs Improvement", color: "text-red-400" };
  };

  const scoreMessage = getScoreMessage(healthScore.overall_score);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-pink-500/20 rounded-lg">
          <Heart className="w-5 h-5 text-pink-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Financial Health Score</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Score Circle */}
        <div className="flex flex-col items-center justify-center">
          <CircularProgress score={healthScore.overall_score} size={140} strokeWidth={12} />
          <div className="text-center mt-4">
            <p className={`text-lg font-bold ${scoreMessage.color}`}>
              {scoreMessage.text}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Based on {Object.keys(healthScore.components).length} financial factors
            </p>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="space-y-4">
          <h4 className="text-white font-medium mb-4">Score Breakdown</h4>
          
          <ComponentScore 
            name="Emergency Fund" 
            score={healthScore.components.emergency_fund} 
            icon={Shield}
          />
          <ComponentScore 
            name="Debt Management" 
            score={healthScore.components.debt_management} 
            icon={Target}
          />
          <ComponentScore 
            name="Savings Rate" 
            score={healthScore.components.savings_rate} 
            icon={TrendingUp}
          />
          <ComponentScore 
            name="Investment Diversity" 
            score={healthScore.components.investment_diversity} 
            icon={CheckCircle}
          />
          <ComponentScore 
            name="Budget Adherence" 
            score={healthScore.components.budget_adherence} 
            icon={Target}
          />
        </div>
      </div>

      {/* Recommendations */}
      {healthData.health_score.recommendations && healthData.health_score.recommendations.length > 0 && (
        <div className="mt-8">
          <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>Recommendations to Improve</span>
          </h4>
          <div className="space-y-3">
            {healthData.health_score.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-white font-medium capitalize">
                      {rec.area.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{rec.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score History Indicator */}
      <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Last Updated</span>
          <span className="text-white text-sm">
            {new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400 text-sm">Trend</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-sm">+2.5 this month</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default FinancialHealthScore;