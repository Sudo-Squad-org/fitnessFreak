import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard } from "./components/AuthCard";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setEmailVerified } = useAuth();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    authService
      .verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message || "Your email has been verified.");
        setEmailVerified(true);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.detail ||
            "This verification link is invalid or has expired."
        );
      });
  }, [token, setEmailVerified]);

  return (
    <AuthCard title="Email Verification" subtitle="">
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-foreground">{message}</p>
            <Button className="w-full mt-2" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-destructive">{message}</p>
            <Button variant="outline" className="w-full mt-2" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
};

export default VerifyEmail;
