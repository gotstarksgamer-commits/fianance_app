import { useState, useEffect, useContext } from 'react';
import AuthContext from "../context/AuthContext";
import axios from 'axios';
import { toast } from 'sonner';
import { BarChart3, Brain, Lightbulb, MessageCircle, Send } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [analysisType, setAnalysisType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const { getAuthHeader } = useContext(AuthContext); // Access getAuthHeader

  useEffect(() => {
    checkModelStatus();
    // Add welcome message with current date and time
    const now = new Date();
    setMessages([{
      id: '1',
      type: 'ai',
      content: `Hello! I'm your AI Financial Assistant. It's ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} IST on ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. I can help you with budgeting, investment advice, loan analysis, and general financial planning. What would you like to discuss today?`,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai/models`, { headers: getAuthHeader() });
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
      const response = await axios.post(`${API_BASE_URL}/ai/analyze`, {
        query: inputMessage,
        analysis_type: analysisType,
        context: 'User is asking for financial advice through the AI chat interface'
      }, { headers: getAuthHeader() });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            AI Financial Assistant
          </h2>
          <p className="text-gray-300 text-lg">Get personalized financial advice powered by local AI</p>

          {/* Model Status */}
          <div className="mt-4">
            {modelStatus?.status === 'operational' ? (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">AI Assistant Online ({modelStatus.total_models} models available)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">AI Assistant Offline - Please install Ollama and download a model</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    <span className="text-white">Chat</span>
                  </CardTitle>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="w-40 bg-white/10 text-white border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/10 text-white border-white/20">
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
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 bg-white/5 rounded-lg">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${message.type === 'user'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 border border-gray-700 text-gray-200'
                        }`}>
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                        {/* Recommendations */}
                        {message.recommendations && message.recommendations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex items-center space-x-1 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-400" />
                              <span className="text-xs font-medium text-gray-400">Key Recommendations:</span>
                            </div>
                            <ul className="space-y-1">
                              {message.recommendations.map((rec, index) => (
                                <li key={index} className="text-xs text-gray-300 flex items-start space-x-1">
                                  <span className="text-emerald-400">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-xs opacity-70 mt-2 text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 border border-gray-700 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                          <span className="text-sm text-gray-400">AI is thinking...</span>
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
                    className="flex-1 bg-white/10 text-white border-white/20 placeholder-gray-400"
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
            <Card className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg text-white">Quick Questions</CardTitle>
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
                    className="w-full text-left justify-start h-auto p-3 text-sm text-gray-100 border-gray-700 hover:bg-gray-800 hover:text-white"
                    onClick={() => {
                      setAnalysisType(item.type);
                      setInputMessage(item.question);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span className="text-wrap">{item.question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Status */}
            <Card className="mt-6 backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg text-white">AI Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <Badge variant={modelStatus?.status === 'operational' ? 'default' : 'destructive'} className={modelStatus?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}>
                      {modelStatus?.status === 'operational' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Models</span>
                    <span className="text-sm font-medium text-gray-300">{modelStatus?.total_models || 0}</span>
                  </div>
                  {modelStatus?.status === 'error' && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
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
    </div>
  );
};

export default AIChat;