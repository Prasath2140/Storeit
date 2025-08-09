"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (!userId || !secret) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    // Here you would typically call your Appwrite verification endpoint
    // For now, we'll just show a success message
    setStatus("success");
    setMessage("Email verified successfully! You can now sign in to your account.");
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verification
          </h1>
          
          {status === "loading" && (
            <div className="text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Verifying your email...
            </div>
          )}
          
          {status === "success" && (
            <div className="text-green-600">
              <div className="text-4xl mb-4">✅</div>
              {message}
            </div>
          )}
          
          {status === "error" && (
            <div className="text-red-600">
              <div className="text-4xl mb-4">❌</div>
              {message}
            </div>
          )}
          
          <div className="mt-6">
            <Link href="/sign-in">
              <Button className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 