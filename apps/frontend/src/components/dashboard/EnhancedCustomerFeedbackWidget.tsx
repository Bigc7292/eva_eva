'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  RefreshCw,
  Download,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Feedback {
  id: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  text: string;
  date: string;
  category?: string;
}

interface EnhancedCustomerFeedbackWidgetProps {
  feedbacks?: Feedback[];
}

export function EnhancedCustomerFeedbackWidget({
  feedbacks = []
}: EnhancedCustomerFeedbackWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('sentiment');
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([]);
  const [categoryData, setCategoryData] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  const [sentimentTrend, setSentimentTrend] = useState<Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }>>([]);

  // Generate sample feedback data
  const generateFeedbackData = useCallback(() => {
    if (feedbacks && feedbacks.length > 0) {
      return feedbacks;
    }

    const categories = ['Product', 'Service', 'Price', 'Support', 'Usability'];
    const sentiments = ['positive', 'neutral', 'negative'];
    const sampleTexts = [
      'Great experience with the team!',
      'The product works as expected.',
      'Could use some improvements.',
      'Very helpful customer service.',
      'Not satisfied with the response time.',
      'Excellent value for money.',
      'The interface is intuitive and easy to use.',
      'Had some issues with the setup process.',
      'Would recommend to others.',
      'Need more features for the price.'
    ];

    const data = [];
    const today = new Date();

    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(today.getDate() - Math.floor(Math.random() * 30));

      const sentimentIndex = Math.floor(Math.random() * 100);
      let sentiment;
      let score;

      if (sentimentIndex < 60) {
        sentiment = 'positive';
        score = Math.floor(Math.random() * 30) + 70;
      } else if (sentimentIndex < 85) {
        sentiment = 'neutral';
        score = Math.floor(Math.random() * 20) + 40;
      } else {
        sentiment = 'negative';
        score = Math.floor(Math.random() * 30) + 10;
      }

      data.push({
        id: `feedback-${i}`,
        sentiment: sentiment as 'positive' | 'neutral' | 'negative',
        score,
        text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
        date: date.toISOString().split('T')[0],
        category: categories[Math.floor(Math.random() * categories.length)]
      });
    }

    return data;
  }, [feedbacks]);

  // Generate category data from feedback
  const generateCategoryData = useCallback((feedbacks: Feedback[]) => {
    const categories = new Map<string, { count: number, color: string }>();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    feedbacks.forEach(feedback => {
      if (feedback.category) {
        if (categories.has(feedback.category)) {
          categories.get(feedback.category)!.count++;
        } else {
          categories.set(feedback.category, {
            count: 1,
            color: colors[categories.size % colors.length]
          });
        }
      }
    });

    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      value: data.count,
      color: data.color
    }));
  }, []);

  // Generate sentiment trend data
  const generateSentimentTrend = useCallback((feedbacks: Feedback[]) => {
    const dateMap = new Map<string, { positive: number, neutral: number, negative: number }>();

    // Sort feedbacks by date
    const sortedFeedbacks = [...feedbacks].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by week
    sortedFeedbacks.forEach(feedback => {
      const date = new Date(feedback.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!dateMap.has(weekKey)) {
        dateMap.set(weekKey, { positive: 0, neutral: 0, negative: 0 });
      }

      const counts = dateMap.get(weekKey)!;
      counts[feedback.sentiment]++;
    });

    // Convert to array and format dates
    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date: `Week of ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        ...counts
      }))
      .slice(-6); // Last 6 weeks
  }, []);

  useEffect(() => {
    // Generate data on component mount only if not already generated
    if (feedbackData.length === 0) {
      const generatedFeedbacks = generateFeedbackData();
      setFeedbackData(generatedFeedbacks);
      setCategoryData(generateCategoryData(generatedFeedbacks));
      setSentimentTrend(generateSentimentTrend(generatedFeedbacks));
    }
  }, [generateFeedbackData, generateCategoryData, generateSentimentTrend, feedbackData.length]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const generatedFeedbacks = generateFeedbackData();
      setFeedbackData(generatedFeedbacks);
      setCategoryData(generateCategoryData(generatedFeedbacks));
      setSentimentTrend(generateSentimentTrend(generatedFeedbacks));
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'sentiment') {
      const sentimentCounts = {
        positive: feedbackData.filter(f => f.sentiment === 'positive').length,
        neutral: feedbackData.filter(f => f.sentiment === 'neutral').length,
        negative: feedbackData.filter(f => f.sentiment === 'negative').length
      };

      const headers = ['Sentiment', 'Count', 'Percentage'];
      const total = feedbackData.length;

      csvContent = [
        headers.join(','),
        ['Positive', sentimentCounts.positive, `${((sentimentCounts.positive / total) * 100).toFixed(1)}%`].join(','),
        ['Neutral', sentimentCounts.neutral, `${((sentimentCounts.neutral / total) * 100).toFixed(1)}%`].join(','),
        ['Negative', sentimentCounts.negative, `${((sentimentCounts.negative / total) * 100).toFixed(1)}%`].join(',')
      ].join('\n');

      filename = `sentiment_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'categories') {
      const headers = ['Category', 'Count', 'Percentage'];
      const total = feedbackData.length;

      csvContent = [
        headers.join(','),
        ...categoryData.map(category =>
          [
            category.name,
            category.value,
            `${((category.value / total) * 100).toFixed(1)}%`
          ].join(',')
        )
      ].join('\n');

      filename = `feedback_categories_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Week', 'Positive', 'Neutral', 'Negative', 'Total'];

      csvContent = [
        headers.join(','),
        ...sentimentTrend.map(week => {
          const total = week.positive + week.neutral + week.negative;
          return [
            week.date,
            week.positive,
            week.neutral,
            week.negative,
            total
          ].join(',');
        })
      ].join('\n');

      filename = `sentiment_trends_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Calculate sentiment percentages
  const sentimentCounts = {
    positive: feedbackData.filter(f => f.sentiment === 'positive').length,
    neutral: feedbackData.filter(f => f.sentiment === 'neutral').length,
    negative: feedbackData.filter(f => f.sentiment === 'negative').length
  };

  const total = feedbackData.length;
  const positivePercentage = total > 0 ? (sentimentCounts.positive / total) * 100 : 0;
  const neutralPercentage = total > 0 ? (sentimentCounts.neutral / total) * 100 : 0;
  const negativePercentage = total > 0 ? (sentimentCounts.negative / total) * 100 : 0;

  // Data for sentiment pie chart
  const sentimentData = [
    { name: 'Positive', value: sentimentCounts.positive, color: '#10b981' },
    { name: 'Neutral', value: sentimentCounts.neutral, color: '#3b82f6' },
    { name: 'Negative', value: sentimentCounts.negative, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Calculate average sentiment score
  const avgSentimentScore = feedbackData.length > 0
    ? feedbackData.reduce((sum, feedback) => sum + feedback.score, 0) / feedbackData.length
    : 0;

  // Prepare radar chart data for categories
  const categoryScores = new Map<string, { count: number, totalScore: number }>();

  feedbackData.forEach(feedback => {
    if (feedback.category) {
      if (!categoryScores.has(feedback.category)) {
        categoryScores.set(feedback.category, { count: 0, totalScore: 0 });
      }

      const data = categoryScores.get(feedback.category)!;
      data.count++;
      data.totalScore += feedback.score;
    }
  });

  const radarData = Array.from(categoryScores.entries()).map(([category, data]) => ({
    subject: category,
    score: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    fullMark: 100
  }));

  return (
    <Card className="bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-950 dark:to-teal-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Customer Feedback</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-green-600 dark:text-green-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
            </Button>
            <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sentiment" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="sentiment" className="flex-1">
              <PieChartIcon className="h-3.5 w-3.5 mr-1" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">
              <Star className="h-3.5 w-3.5 mr-1" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex-1">
              <BarChartIcon className="h-3.5 w-3.5 mr-1" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sentiment">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{Math.round(avgSentimentScore)}</div>
                <div className="text-xs text-muted-foreground">
                  Average sentiment score
                </div>
              </div>
              <div className="flex items-center text-green-500">
                <ThumbsUp className="h-4 w-4 mr-1" />
                <span className="font-medium">{positivePercentage.toFixed(1)}% positive</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : total === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No feedback data available</p>
                <p className="text-xs text-muted-foreground">Collect customer feedback to see analysis</p>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="40%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={false}
                    >
                      {sentimentData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} feedbacks (${((value / total) * 100).toFixed(1)}%)`, '']} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ paddingLeft: '20px' }}
                      iconSize={10}
                      fontSize={12}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{categoryData.length}</div>
                <div className="text-xs text-muted-foreground">
                  Feedback categories
                </div>
              </div>
              <div className="flex items-center text-blue-500">
                <Star className="h-4 w-4 mr-1" />
                <span className="font-medium">Category analysis</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : radarData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No category data available</p>
                <p className="text-xs text-muted-foreground">Categorize feedback to see analysis</p>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={70} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Sentiment Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}/100`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {sentimentTrend.length > 0 ?
                    sentimentTrend[sentimentTrend.length - 1].positive +
                    sentimentTrend[sentimentTrend.length - 1].neutral +
                    sentimentTrend[sentimentTrend.length - 1].negative : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Recent weekly feedback
                </div>
              </div>
              <div className="flex items-center text-teal-500">
                <BarChartIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">Weekly trends</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : sentimentTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <p className="text-muted-foreground mb-2">No trend data available</p>
                <p className="text-xs text-muted-foreground">Collect more feedback to see trends</p>
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                    <Bar dataKey="positive" name="Positive" stackId="a" fill="#10b981" />
                    <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="negative" name="Negative" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
