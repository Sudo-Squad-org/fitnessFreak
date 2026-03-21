import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { healthService } from "@/services/healthService";
import { useToast } from "@/hooks/use-toast";
import { AuthCard } from "./components/AuthCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, MailWarning, RefreshCw } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [devVerificationToken, setDevVerificationToken] = useState(null);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setUnverifiedEmail(null);
    setDevVerificationToken(null);
    try {
      const result = await login({ email: data.email, password: data.password });
      if (result?.onboarding_completed === false) {
        navigate("/onboarding", { replace: true });
        return;
      }
      // Check if today's wellness check-in is done
      try {
        await healthService.getReadinessToday();
        navigate("/dashboard", { replace: true });
      } catch (rdErr) {
        if (rdErr?.response?.status === 404) {
          navigate("/wellness", { replace: true, state: { returnTo: "/dashboard" } });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // Email not verified — show inline banner instead of a toast
        setUnverifiedEmail(data.email);
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.response?.data?.detail || "Invalid email or password.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await authService.resendVerification(unverifiedEmail);
      if (result.dev_verification_token) {
        setDevVerificationToken(result.dev_verification_token);
      }
      toast({ title: "Email resent!", description: "Check your inbox for a new verification link." });
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not resend. Please try again." });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your account.">

      {/* Unverified email banner */}
      {unverifiedEmail && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Email not verified
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Please verify <span className="font-semibold">{unverifiedEmail}</span> before logging in. Check your inbox or resend below.
              </p>

              {devVerificationToken && (
                <div className="space-y-1">
                  <p className="text-xs text-amber-600 dark:text-amber-500">Dev token:</p>
                  <code className="block break-all text-xs">{devVerificationToken}</code>
                  <Link
                    to={`/verify-email?token=${devVerificationToken}`}
                    className="text-xs font-semibold text-amber-800 hover:underline dark:text-amber-300"
                  >
                    Verify now →
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:underline disabled:opacity-50 dark:text-amber-300"
              >
                {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Resend verification email
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              className={errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full h-11 mt-6" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline transition-colors">
          Forgot your password?
        </Link>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="font-semibold text-foreground hover:underline">
          Create an account
        </Link>
      </div>
    </AuthCard>
  );
};

export default Login;
