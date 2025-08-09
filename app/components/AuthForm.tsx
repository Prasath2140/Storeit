"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/app/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/components/ui/input";
import { createAccount } from "@/lib/actions/user.actions";

type FormType = "sign-in" | "sign-up";

// ✅ single schema that works for both cases
const authFormSchema = (formType: FormType) =>
  z.object({
    email: z.string().email("Please enter a valid email"),
    fullName:
      formType === "sign-up"
        ? z.string().min(2, "Name too short").max(50, "Name too long")
        : z.string().optional(),
  });

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", fullName: "" }, // ✅ always include fullName
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const user = await createAccount({
        fullName: values.fullName || "", // safe: optional in sign-in
        email: values.email,
      });
      setAccountId(user.accountId);
      
      // Check if this is an existing user or if we have a temp password
      if (typeof user === 'object' && user.tempPassword) {
        setSuccessMessage(`Account created! Your temporary password is: ${user.tempPassword}. Please check your email for verification link.`);
      } else if (user.accountId.startsWith("existing_user_")) {
        setSuccessMessage("Account already exists! Please check your email for verification link or try signing in.");
      } else {
        setSuccessMessage("Account created! Please check your email for verification link. You'll need to set a password after verification.");
      }
    } catch (error) {
      setErrorMessage("Failed to create account. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <h1 className="form-title">
          {type === "sign-in" ? "Sign In" : "Sign Up"}
        </h1>

        {type === "sign-up" && (
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    className="shad-input"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="form-submit-button"
          disabled={isLoading}
        >
          {type === "sign-in" ? "Sign In" : "Sign Up"}
          {isLoading && (
            <Image
              src="/assets/icons/loader.svg"
              alt="Loader"
              width={24}
              height={24}
              className="ml-2 animate-spin"
            />
          )}
        </Button>

        {errorMessage && <p className="error-message">*{errorMessage}</p>}
        {successMessage && <p className="success-message">*{successMessage}</p>}

        <div className="body-2 flex justify-center">
          <p className="text-light-100">
            {type === "sign-in"
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <Link
            href={type === "sign-in" ? "/sign-up" : "/sign-in"}
            className="ml-1 font-medium text-brand"
          >
            {type === "sign-in" ? "Sign Up" : "Sign In"}
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default AuthForm;
