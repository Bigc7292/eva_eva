'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart as BarChartIcon,
  RefreshCw,
  Download,
  Users,
  Award,
  Star,
  Phone
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface TeamMemberStats {
  id: string;
  name: string;
  avatar: string;
  calls: number;
  conversions: number;
  avgDuration: number;
}

interface EnhancedTeamPerformanceWidgetProps {
  members: TeamMemberStats[];
}

export function EnhancedTeamPerformanceWidget({ members }: EnhancedTeamPerformanceWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [teamData, setTeamData] = useState<TeamMemberStats[]>([]);
  const [skillsData, setSkillsData] = useState<any[]>([]);

  // Generate skills data for team members
  const generateSkillsData = useCallback((teamMembers: TeamMemberStats[]) => {
    return teamMembers.map(member => {
      // Generate random skills based on conversion rate
      const conversionRate = member.calls > 0 ? (member.conversions / member.calls) : 0;
      const baseSkill = 50 + (conversionRate * 100);

      return {
        name: member.name,
        communication: Math.min(100, baseSkill + Math.random() * 20 - 10),
        problemSolving: Math.min(100, baseSkill + Math.random() * 20 - 10),
        productKnowledge: Math.min(100, baseSkill + Math.random() * 20 - 10),
        closingAbility: Math.min(100, baseSkill + Math.random() * 20 - 10),
        customerService: Math.min(100, baseSkill + Math.random() * 20 - 10)
      };
    });
  }, []);

  useEffect(() => {
    // Initialize with provided members or generate sample data only if not already initialized
    if (teamData.length === 0) {
      if (members && members.length > 0) {
        setTeamData(members);
        setSkillsData(generateSkillsData(members));
      } else {
        // Generate sample data if none provided
        const sampleMembers = [
          {
            id: '1',
            name: 'Alex Johnson',
            avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson',
            calls: 45,
            conversions: 18,
            avgDuration: 320
          },
          {
            id: '2',
            name: 'Sam Taylor',
            avatar: 'https://ui-avatars.com/api/?name=Sam+Taylor',
            calls: 38,
            conversions: 12,
            avgDuration: 280
          },
          {
            id: '3',
            name: 'Jordan Lee',
            avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee',
            calls: 52,
            conversions: 24,
            avgDuration: 350
          }
        ];

        setTeamData(sampleMembers);
        setSkillsData(generateSkillsData(sampleMembers));
      }
    }
  }, [members, generateSkillsData, teamData.length]);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Refresh with slightly modified data
      const refreshedData = teamData.map(member => ({
        ...member,
        calls: member.calls + Math.floor(Math.random() * 5),
        conversions: member.conversions + Math.floor(Math.random() * 2)
      }));

      setTeamData(refreshedData);
      setSkillsData(generateSkillsData(refreshedData));
      setLoading(false);
    }, 800);
  };

  const handleExport = () => {
    // Create CSV content based on active tab
    let csvContent = '';
    let filename = '';

    if (activeTab === 'overview') {
      const headers = ['Name', 'Calls', 'Conversions', 'Conversion Rate', 'Avg Duration'];
      csvContent = [
        headers.join(','),
        ...teamData.map(member => {
          const conversionRate = member.calls > 0 ? (member.conversions / member.calls) * 100 : 0;
          return [
            member.name,
            member.calls,
            member.conversions,
            `${conversionRate.toFixed(1)}%`,
            `${member.avgDuration}s`
          ].join(',');
        })
      ].join('\n');
      filename = `team_performance_overview_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'skills') {
      const headers = ['Name', 'Communication', 'Problem Solving', 'Product Knowledge', 'Closing Ability', 'Customer Service'];
      csvContent = [
        headers.join(','),
        ...skillsData.map(member => [
          member.name,
          Math.round(member.communication),
          Math.round(member.problemSolving),
          Math.round(member.productKnowledge),
          Math.round(member.closingAbility),
          Math.round(member.customerService)
        ].join(','))
      ].join('\n');
      filename = `team_skills_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = ['Name', 'Calls', 'Conversions', 'Conversion Rate'];
      csvContent = [
        headers.join(','),
        ...teamData.map(member => {
          const conversionRate = member.calls > 0 ? (member.conversions / member.calls) * 100 : 0;
          return [
            member.name,
            member.calls,
            member.conversions,
            `${conversionRate.toFixed(1)}%`
          ].join(',');
        })
      ].join('\n');
      filename = `team_rankings_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Prepare data for charts
  const barChartData = teamData.map(member => ({
    name: member.name,
    calls: member.calls,
    conversions: member.conversions
  }));

  // Calculate team metrics
  const calculateTeamMetrics = () => {
    if (teamData.length === 0) return { totalCalls: 0, totalConversions: 0, avgRate: 0 };

    const totalCalls = teamData.reduce((sum, member) => sum + member.calls, 0);
    const totalConversions = teamData.reduce((sum, member) => sum + member.conversions, 0);
    const avgRate = totalCalls > 0 ? (totalConversions / totalCalls) * 100 : 0;

    return {
      totalCalls,
      totalConversions,
      avgRate
    };
  };

  const metrics = calculateTeamMetrics();

  // Sort team members by conversion rate for rankings
  const sortedTeam = [...teamData].sort((a, b) => {
    const rateA = a.calls > 0 ? (a.conversions / a.calls) : 0;
    const rateB = b.calls > 0 ? (b.conversions / b.calls) : 0;
    return rateB - rateA;
  });

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-900">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-amber-600 dark:text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </Button>
            <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="overview" className="flex-1">
              <BarChartIcon className="h-3.5 w-3.5 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex-1">
              <Award className="h-3.5 w-3.5 mr-1" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex-1">
              <Star className="h-3.5 w-3.5 mr-1" />
              Skills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{metrics.totalCalls}</div>
                <div className="text-xs text-muted-foreground">
                  Total team calls
                </div>
              </div>
              <div className="flex items-center text-green-500">
                <Phone className="h-4 w-4 mr-1" />
                <span className="font-medium">{metrics.avgRate.toFixed(1)}% conversion</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                    <Bar dataKey="calls" name="Calls" fill="#f59e0b" />
                    <Bar dataKey="conversions" name="Conversions" fill="#84cc16" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rankings">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{metrics.totalConversions}</div>
                <div className="text-xs text-muted-foreground">
                  Total conversions
                </div>
              </div>
              <div className="flex items-center text-amber-500">
                <Award className="h-4 w-4 mr-1" />
                <span className="font-medium">Team rankings</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {sortedTeam.map((member, index) => {
                  const conversionRate = member.calls > 0 ? (member.conversions / member.calls) * 100 : 0;
                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 text-center font-bold text-amber-600">
                        #{index + 1}
                      </div>
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{member.calls} calls</span>
                          <span className="mx-1">•</span>
                          <span>{member.conversions} conversions</span>
                        </div>
                        <Progress
                          value={conversionRate}
                          className="h-1.5 mt-1"
                          indicatorClassName={index === 0 ? "bg-amber-500" : "bg-amber-400"}
                        />
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-sm">{conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{teamData.length}</div>
                <div className="text-xs text-muted-foreground">
                  Team members
                </div>
              </div>
              <div className="flex items-center text-blue-500">
                <Star className="h-4 w-4 mr-1" />
                <span className="font-medium">Skills analysis</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={70} data={[
                    {
                      subject: 'Communication',
                      A: skillsData.reduce((sum, member) => sum + member.communication, 0) / skillsData.length,
                      fullMark: 100
                    },
                    {
                      subject: 'Problem Solving',
                      A: skillsData.reduce((sum, member) => sum + member.problemSolving, 0) / skillsData.length,
                      fullMark: 100
                    },
                    {
                      subject: 'Product Knowledge',
                      A: skillsData.reduce((sum, member) => sum + member.productKnowledge, 0) / skillsData.length,
                      fullMark: 100
                    },
                    {
                      subject: 'Closing Ability',
                      A: skillsData.reduce((sum, member) => sum + member.closingAbility, 0) / skillsData.length,
                      fullMark: 100
                    },
                    {
                      subject: 'Customer Service',
                      A: skillsData.reduce((sum, member) => sum + member.customerService, 0) / skillsData.length,
                      fullMark: 100
                    }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Team Average" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
