import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function RegisterForm() {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onBlur",
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      // Success - redirect to dashboard
      // eslint-disable-next-line react-compiler/react-compiler
      window.location.href = "/";
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto" data-test-id="register-card">
      <CardHeader>
        <CardTitle className="text-2xl" data-test-id="register-title">
          Create an account
        </CardTitle>
        <CardDescription data-test-id="register-description">
          Enter your email below to create your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4" data-test-id="register-form">
          {error && (
            <div
              className="text-sm text-destructive font-medium p-3 rounded-md bg-destructive/15"
              data-test-id="register-error"
            >
              {error}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...form.register("email")}
              data-test-id="register-email-input"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive" data-test-id="register-email-error">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              data-test-id="register-password-input"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive" data-test-id="register-password-error">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              data-test-id="register-confirm-password-input"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive" data-test-id="register-confirm-password-error">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading} data-test-id="register-submit-button">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" data-test-id="register-loading-spinner" />}
            Create account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="underline" data-test-id="register-login-link">
            Login
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
