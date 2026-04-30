import { Link, useNavigate, useLocation } from "react-router-dom";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/signin");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                AJ
              </span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">
              AlgoJudge
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link to="/problems">
              <Button
                variant={isActive("/problems") ? "secondary" : "ghost"}
                size="sm"
              >
                Problems
              </Button>
            </Link>

            {session && (
              <Link to="/dashboard">
                <Button
                  variant={isActive("/dashboard") ? "secondary" : "ghost"}
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
            )}

            {session?.user.role === "admin" && (
              <Link to="/admin">
                <Button
                  variant={isActive("/admin") ? "secondary" : "ghost"}
                  size="sm"
                >
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-7 h-7 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium">
                    {session.user.name}
                  </span>
                  {session.user.role === "admin" && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Admin
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/signin">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
