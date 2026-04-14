import { Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import Navbar from "@/components/Navbar";
import SignIn from "@/pages/SignIn";
import AdminDashboard from "@/pages/admin/Dashboard";
import UserDashboard from "@/pages/user/Dashboard";
import ProblemsPage from "@/pages/Problems";
import ProblemDetail from "@/pages/ProblemDetail";

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!session) return <Navigate to="/signin" replace />;

  if (requiredRole && session.user.role !== requiredRole) {
    return (
      <Navigate
        to={session.user.role === "admin" ? "/admin" : "/dashboard"}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Routes>
        <Route path="/signin" element={<SignIn />} />

        {/* Public routes */}
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            session ? (
              <Navigate
                to={session.user.role === "admin" ? "/admin" : "/dashboard"}
                replace
              />
            ) : (
              <Navigate to="/problems" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}
