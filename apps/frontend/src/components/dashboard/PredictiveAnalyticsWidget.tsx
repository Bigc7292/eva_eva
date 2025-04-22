import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, TrendingUp, RefreshCw, Download } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PredictiveAnalyticsWidgetProps {
  timeRange?: 'week' | 'month' | 'quarter';
}

interface PredictionData {
  date: string;
  actual: number;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
}

export function PredictiveAnalyticsWidget({ 
  timeRange = 'week'
}: PredictiveAnalyticsWidgetProps) {
  const [data, setData] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'calls' | 'meetings' | 'conversions'>('calls');

  // Generate sample data for demonstration
  const generateSampleData = () => {
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
  };

  useEffect(() => {
    // In a real implementation, we would fetch prediction data from an API
    // For now, we'll use sample data
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        const sampleData = generateSampleData();
        setData(sampleData);
        setError(null);
      } catch (err) {
        setError('Failed to load prediction data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 800);
  }, [timeRange, metric]);

  const handleRefresh = () => {
    setLoading(true);
    // In a real implementation, we would fetch fresh data from the API
    setTimeout(() => {
      const sampleData = generateSampleData();
      setData(sampleData);
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Actual', 'Predicted', 'Lower Bound', 'Upper Bound'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        [
          row.date, 
          row.actual, 
          row.predicted, 
          row.lowerBound || '', 
          row.upperBound || ''
        ].join(',')
      )
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${metric}_predictions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate prediction summary
  const calculateSummary = () => {
    if (data.length === 0) return { trend: 0, nextWeek: 0 };
    
    const futureData = data.filter(d => d.predicted > 0);
    if (futureData.length === 0) return { trend: 0, nextWeek: 0 };
    
    const totalPredicted = futureData.reduce((sum, item) => sum + item.predicted, 0);
    
    // Calculate trend (positive or negative)
    const pastWeekData = data.filter(d => d.actual > 0).slice(-7);
    const pastWeekTotal = pastWeekData.reduce((sum, item) => sum + item.actual, 0);
    
    const trend = pastWeekTotal > 0 ? 
      ((totalPredicted - pastWeekTotal) / pastWeekTotal) * 100 : 0;
    
    return {
      trend,
      nextWeek: totalPredicted
    };
  };

  const summary = calculateSummary();
  const metricLabels = {
    calls: 'Call Volume',
    meetings: 'Meeting Bookings',
    conversions: 'Lead Conversions'
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950 dark:to-indigo-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Predictive Analytics</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExport}
              disabled={loading || data.length === 0}
            >
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </Button>
            <LineChart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <div className="text-2xl font-bold">{summary.nextWeek.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">
              Predicted {metricLabels[metric]} (Next 7 days)
            </div>
          </div>
          <div className={`flex items-center ${summary.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="font-medium">{summary.trend.toFixed(1)}%</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={data}>
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
        
        <div className="mt-2 text-xs text-muted-foreground">
          <p>AI-powered forecast based on historical patterns</p>
        </div>
      </CardContent>
    </Card>
  );
}
