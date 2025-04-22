import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  TrendingUp,
  RefreshCw,
  Download,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Brain,
  Zap,
  AlertCircle
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface EnhancedAnalyticsWidgetProps {
  timeRange?: 'week' | 'month' | 'quarter';
}

interface PredictionData {
  date: string;
  actual: number;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
}

interface SentimentData {
  name: string;
  value: number;
  color: string;
}

interface InsightData {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  type: 'positive' | 'negative' | 'neutral';
}

export function EnhancedAnalyticsWidget({
  timeRange = 'week'
}: EnhancedAnalyticsWidgetProps) {
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'calls' | 'meetings' | 'conversions'>('calls');
  const [activeTab, setActiveTab] = useState<string>('predictions');

  // Generate sample prediction data
  const generatePredictionData = useCallback(() => {
    const today = new Date();
    const pastData: PredictionData[] = [];
    const futureData: PredictionData[] = [];

    // Generate past data (actual)
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // Create some realistic patterns with weekend dips
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Base value with some randomness
      let value = isWeekend ?
        Math.floor(Math.random() * 10) + 5 :
        Math.floor(Math.random() * 20) + 15;

      // Add a trend
      value += Math.floor(i / 3);

      pastData.push({
        date: date.toISOString().split('T')[0],
        actual: value,
        predicted: 0
      });
    }

    // Generate future data (predictions)
    const lastActualValue = pastData[pastData.length - 1].actual;
    const trend = (pastData[pastData.length - 1].actual - pastData[0].actual) / pastData.length;

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      // Create predictions based on trend and day of week patterns
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Base prediction with trend
      let prediction = lastActualValue + (trend * i);

      // Adjust for weekends
      if (isWeekend) {
        prediction *= 0.6;
      }

      // Add some randomness to the prediction
      prediction = Math.max(0, Math.floor(prediction + (Math.random() * 6 - 3)));

      // Add confidence interval
      const uncertainty = 2 + (i * 0.5); // Uncertainty increases with time

      futureData.push({
        date: date.toISOString().split('T')[0],
        actual: 0,
        predicted: prediction,
        lowerBound: Math.max(0, prediction - uncertainty),
        upperBound: prediction + uncertainty
      });
    }

    return [...pastData, ...futureData];
  }, []);

  // Generate sample sentiment data
  const generateSentimentData = useCallback(() => {
    return [
      { name: 'Positive', value: 65, color: '#4ade80' },
      { name: 'Neutral', value: 25, color: '#93c5fd' },
      { name: 'Negative', value: 10, color: '#f87171' }
    ];
  }, []);

  // Generate sample insights
  const generateInsights = useCallback(() => {
    return [
      {
        id: '1',
        title: 'Call Volume Increasing',
        description: 'Call volume has increased by 15% compared to last week, suggesting growing interest.',
        impact: 'high',
        type: 'positive'
      },
      {
        id: '2',
        title: 'Conversion Rate Declining',
        description: 'Conversion rate has dropped by 5% in the last 3 days. Consider reviewing call scripts.',
        impact: 'medium',
        type: 'negative'
      },
      {
        id: '3',
        title: 'Peak Call Hours Identified',
        description: 'Most calls occur between 10am-2pm. Consider optimizing agent scheduling.',
        impact: 'high',
        type: 'neutral'
      },
      {
        id: '4',
        title: 'Sentiment Improving',
        description: 'Positive sentiment has increased by 8% over the past week.',
        impact: 'medium',
        type: 'positive'
      }
    ];
  }, []);

  useEffect(() => {
    // In a real implementation, we would fetch data from an API
    // For now, we'll use sample data
    // Only load data if we don't already have it
    if (predictionData.length === 0) {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        try {
          const predictionData = generatePredictionData();
          const sentimentData = generateSentimentData();
          const insightsData = generateInsights();

          setPredictionData(predictionData);
          setSentimentData(sentimentData);
          setInsights(insightsData);
          setError(null);
        } catch (err) {
          setError('Failed to load analytics data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }, 800);
    }
  }, [generatePredictionData, generateSentimentData, generateInsights, predictionData.length]);

  const handleRefresh = () => {
    setLoading(true);
    // In a real implementation, we would fetch fresh data from the API
    setTimeout(() => {
      const predictionData = generatePredictionData();
      const sentimentData = generateSentimentData();
      const insightsData = generateInsights();

      setPredictionData(predictionData);
      setSentimentData(sentimentData);
      setInsights(insightsData);
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'predictions') {
      const headers = ['Date', 'Actual', 'Predicted', 'Lower Bound', 'Upper Bound'];
      csvContent = [
        headers.join(','),
        ...predictionData.map(row =>
          [
            row.date,
            row.actual,
            row.predicted,
            row.lowerBound || '',
            row.upperBound || ''
          ].join(',')
        )
      ].join('\n');
      filename = `${metric}_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'sentiment') {
      const headers = ['Sentiment', 'Percentage'];
      csvContent = [
        headers.join(','),
        ...sentimentData.map(row =>
          [
            row.name,
            row.value
          ].join(',')
        )
      ].join('\n');
      filename = `sentiment_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Insight', 'Description', 'Impact', 'Type'];
      csvContent = [
        headers.join(','),
        ...insights.map(row =>
          [
            `"${row.title}"`,
            `"${row.description}"`,
            row.impact,
            row.type
          ].join(',')
        )
      ].join('\n');
      filename = `ai_insights_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate prediction summary
  const calculatePredictionSummary = () => {
    if (predictionData.length === 0) return { trend: 0, nextWeek: 0 };

    const futureData = predictionData.filter(d => d.predicted > 0);
    if (futureData.length === 0) return { trend: 0, nextWeek: 0 };

    const totalPredicted = futureData.reduce((sum, item) => sum + item.predicted, 0);

    // Calculate trend (positive or negative)
    const pastWeekData = predictionData.filter(d => d.actual > 0).slice(-7);
    const pastWeekTotal = pastWeekData.reduce((sum, item) => sum + item.actual, 0);

    const trend = pastWeekTotal > 0 ?
      ((totalPredicted - pastWeekTotal) / pastWeekTotal) * 100 : 0;

    return {
      trend,
      nextWeek: totalPredicted
    };
  };

  // Calculate sentiment summary
  const calculateSentimentSummary = () => {
    if (sentimentData.length === 0) return { positive: 0, negative: 0 };

    const positive = sentimentData.find(d => d.name === 'Positive')?.value || 0;
    const negative = sentimentData.find(d => d.name === 'Negative')?.value || 0;

    return { positive, negative };
  };

  const predictionSummary = calculatePredictionSummary();
  const sentimentSummary = calculateSentimentSummary();

  const metricLabels = {
    calls: 'Call Volume',
    meetings: 'Meeting Bookings',
    conversions: 'Lead Conversions'
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-500">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Impact</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Low Impact</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'positive':
        return <Badge className="bg-green-500">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-red-500">Negative</Badge>;
      case 'neutral':
        return <Badge className="bg-blue-500">Neutral</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">AI Analytics</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleExport}
              disabled={loading || predictionData.length === 0}
            >
              <Download className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            </Button>
            <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="predictions" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="predictions" className="flex-1">
              <LineChart className="h-3.5 w-3.5 mr-1" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex-1">
              <PieChartIcon className="h-3.5 w-3.5 mr-1" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">
              <Zap className="h-3.5 w-3.5 mr-1" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
            <div className="flex justify-between items-center mb-2">
              <div className="flex space-x-2">
                <Button
                  variant={metric === 'calls' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetric('calls')}
                  className="text-xs"
                >
                  Calls
                </Button>
                <Button
                  variant={metric === 'meetings' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetric('meetings')}
                  className="text-xs"
                >
                  Meetings
                </Button>
                <Button
                  variant={metric === 'conversions' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMetric('conversions')}
                  className="text-xs"
                >
                  Conversions
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{predictionSummary.nextWeek.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">
                  Predicted {metricLabels[metric]} (Next 7 days)
                </div>
              </div>
              <div className={`flex items-center ${predictionSummary.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">{predictionSummary.trend.toFixed(1)}%</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-28">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">
                {error}
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={predictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{fontSize: 10}}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip
                      formatter={(value) => [Number(value).toFixed(0), '']}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 2 }}
                      name="Predicted"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sentiment">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{sentimentSummary.positive.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">
                  Positive Sentiment
                </div>
              </div>
              <div className="flex items-center text-red-500">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="font-medium">{sentimentSummary.negative.toFixed(0)}% Negative</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-28">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">
                {error}
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights">
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {loading ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">
                  {error}
                </div>
              ) : (
                insights.map(insight => (
                  <div key={insight.id} className="border-b border-gray-100 dark:border-gray-800 pb-1 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-medium">{insight.title}</div>
                      <div className="flex space-x-1">
                        {getImpactBadge(insight.impact)}
                        {getTypeBadge(insight.type)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
