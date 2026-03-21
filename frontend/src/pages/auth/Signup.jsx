import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { AuthCard } from "./components/AuthCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, MailCheck, RefreshCw } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [devVerificationToken, setDevVerificationToken] = useState(null);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await signup({ name: data.name, email: data.email, password: data.password });
      setRegisteredEmail(data.email);
      setDevVerificationToken(result.dev_verification_token || null);
      setSubmitted(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.detail || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await authService.resendVerification(registeredEmail);
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

  // ── Post-signup: always show "check your email" screen ─────────────────────
  if (submitted) {
    return (
      <AuthCard title="Check your email" subtitle="One last step before you can log in.">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <MailCheck className="h-14 w-14 text-green-500" />

          <p className="text-sm text-muted-foreground">
            We sent a verification link to{" "}
            <span className="font-semibold text-foreground">{registeredEmail}</span>.
            Click the link in that email to verify your account, then come back to log in.
          </p>

          {/* Dev mode: show token + direct link when no SMTP */}
          {devVerificationToken && (
            <div className="w-full space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Dev mode — no SMTP configured. Use this token:
              </p>
              <code className="block break-all text-xs text-amber-900 dark:text-amber-300">
                {devVerificationToken}
              </code>
              <Button
                size="sm"
                className="w-full"
                onClick={() => navigate(`/verify-email?token=${devVerificationToken}`)}
              >
                Verify Now
              </Button>
            </div>
          )}

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              {resending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Resend verification email
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  // ── Signup form ─────────────────────────────────────────────────────────────
  return (
    <AuthCard title="Create an account" subtitle="Start your fitness journey today.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div className="space-y-2">
          <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            autoComplete="name"
            {...register("name")}
            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={errors.confirmPassword ? "text-destructive" : ""}>
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.confirmPassword && (
            <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-foreground hover:underline">
          Sign In
        </Link>
      </div>
    </AuthCard>
  );
};

export default Signup;
