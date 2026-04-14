import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient, useSession } from "@/lib/auth-client";
import { fetchAdminStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminQuestions from "./Questions";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    totalQuestions: number;
    totalSubmissions: number;
  } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAdminStats();
        setStats(data);
      } catch {
        // Ignore errors
      }
    };
    loadStats();
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your platform
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {session?.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{session?.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user.email}
                </p>
              </div>
              <Badge className="ml-auto">Admin</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats?.totalQuestions ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats?.totalSubmissions ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                Online
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="questions">
          <TabsList>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          <TabsContent value="questions" className="mt-6">
            <AdminQuestions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
