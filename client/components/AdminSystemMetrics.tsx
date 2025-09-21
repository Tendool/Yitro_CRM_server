import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Users,
  Building2,
  Target,
  DollarSign,
  Activity,
  TrendingUp,
  Trophy,
  Clock,
  UserCheck,
  Briefcase,
  Shield,
} from "lucide-react";

interface AdminStatistics {
  summary: {
    totalUsers: number;
    totalContacts: number;
    totalAccounts: number;
    totalLeads: number;
    totalDeals: number;
    totalActivities: number;
    wonDeals: number;
    totalDealValue: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    summary: string;
    date: string;
    contact?: string;
    account?: string;
    outcome?: string;
  }>;
  userStats: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  }>;
}

export function AdminSystemMetrics() {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      console.log("🔍 ADMIN SYSTEM METRICS: Fetching statistics from API...");
      const response = await fetch("/api/admin/statistics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      console.log("🔍 ADMIN SYSTEM METRICS: API response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 ADMIN SYSTEM METRICS: API data received:", data);
        setStatistics(data.data);
      } else {
        console.log("🔍 ADMIN SYSTEM METRICS: API failed, trying fallback...");
        // Try fallback to local calculations
        await fetchFallbackStatistics();
      }
    } catch (error) {
      console.error("🔍 ADMIN SYSTEM METRICS: Network error:", error);
      console.log("🔍 ADMIN SYSTEM METRICS: Trying fallback after error...");
      // Try fallback to local calculations
      await fetchFallbackStatistics();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackStatistics = async () => {
    console.log("🔍 ADMIN SYSTEM METRICS: Using fallback statistics calculation...");
    // TODO: Add fallback logic here using CRM context data
    setError("Using fallback data - API not available");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-800">
            <Shield className="w-5 h-5" />
            <p>Error loading statistics: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, recentActivities, userStats } = statistics;

  return (
    <div className="space-y-6">
      {/* Main System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.filter(u => u.role === 'ADMIN').length} admins, {userStats.filter(u => u.role !== 'ADMIN').length} users
            </p>
          </CardContent>
        </Card>

        {/* Total Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contacts
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Across all user accounts
            </p>
          </CardContent>
        </Card>

        {/* Total Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Company accounts managed
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDealValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {summary.wonDeals} won deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Deals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDeals}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                <Trophy className="w-3 h-3 mr-1" />
                {summary.wonDeals} Won
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Lead opportunities tracked
            </p>
          </CardContent>
        </Card>

        {/* Total Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Total system interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent System Activities */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent System Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200"
                >
                  <div className="flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {activity.type}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.summary || `${activity.type} activity recorded`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                      {activity.contact && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          👥 {activity.contact}
                        </span>
                      )}
                      {activity.account && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          🏢 {activity.account}
                        </span>
                      )}
                      {activity.outcome && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          📋 {activity.outcome}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500 text-right">
                    <div>{formatDate(activity.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalUsers}
              </div>
              <div className="text-sm text-blue-700">Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalContacts}
              </div>
              <div className="text-sm text-blue-700">Contacts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalLeads}
              </div>
              <div className="text-sm text-blue-700">Leads</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalDealValue)}
              </div>
              <div className="text-sm text-blue-700">Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Overview ({userStats.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.map((user) => (
              <div
                key={user.id}
                className="p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{user.name}</span>
                  <Badge
                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {user.role}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-1">{user.email}</p>
                <p className="text-xs text-gray-500">
                  Joined {new Date(user.joinedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
