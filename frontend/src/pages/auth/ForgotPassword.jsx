import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { AuthCard } from "./components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devResetToken, setDevResetToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await authService.forgotPassword(data.email);
      setSubmitted(true);
      if (result.dev_reset_token) {
        setDevResetToken(result.dev_reset_token);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: err.response?.data?.detail || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthCard title="Check your email" subtitle="">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <MailCheck className="h-12 w-12 text-green-500" />
          <p className="text-sm text-muted-foreground">
            If that email exists, a password reset link has been sent.
          </p>

          {devResetToken && (
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground">Dev mode — use this token:</p>
              <code className="block break-all rounded bg-muted px-3 py-2 text-xs">
                {devResetToken}
              </code>
              <Link
                to={`/reset-password?token=${devResetToken}`}
                className="block text-sm font-semibold text-foreground hover:underline"
              >
                Reset password now →
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="mt-2 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="Enter your email and we'll send a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="hover:underline">
          Back to login
        </Link>
      </div>
    </AuthCard>
  );
};

export default ForgotPassword;
