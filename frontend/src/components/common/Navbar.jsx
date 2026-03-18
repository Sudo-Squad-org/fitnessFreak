import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { LogOut, Shield, Sun, Moon, Menu, X, Dumbbell, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive(path)
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground transition-transform group-hover:scale-105">
            <div className="h-4 w-4 rounded-full bg-background" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">FitnessFreak</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={navLinkClass("/")}>Home</Link>
          <Link to="/classes" className={navLinkClass("/classes")}>Classes</Link>
          {currentUser && <Link to="/dashboard" className={navLinkClass("/dashboard")}>Dashboard</Link>}
          {currentUser && (
            <Link to="/nutrition" className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ${isActive("/nutrition") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Salad className="h-3.5 w-3.5" />
              Nutrition
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ${
                isActive("/admin")
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {currentUser ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {isAdmin && <Shield className="h-3.5 w-3.5 text-indigo-500" />}
                <span className="font-medium text-foreground">{currentUser?.user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-9 gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col gap-1 px-4 py-4">
            {[
              { to: "/", label: "Home" },
              { to: "/classes", label: "Classes" },
              ...(currentUser ? [{ to: "/dashboard", label: "Dashboard" }] : []),
              ...(currentUser ? [{ to: "/nutrition", label: "Nutrition", icon: Salad }] : []),
              ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(to)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
              </Link>
            ))}

            <div className="mt-2 pt-2 border-t border-border">
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full rounded-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
