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
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onBlur",
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: values.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update password");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        // eslint-disable-next-line react-compiler/react-compiler
        window.location.href = "/login";
      }, 2000);
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-sm mx-auto" data-test-id="update-password-success-card">
        <CardHeader>
          <CardTitle className="text-2xl">Password Updated</CardTitle>
          <CardDescription>Your password has been successfully updated. Redirecting to login...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto" data-test-id="update-password-card">
      <CardHeader>
        <CardTitle className="text-2xl" data-test-id="update-password-title">
          Update Password
        </CardTitle>
        <CardDescription data-test-id="update-password-description">Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="grid gap-4"
          data-test-id="update-password-form"
        >
          {error && (
            <div
              className="text-sm text-destructive font-medium p-3 rounded-md bg-destructive/15"
              data-test-id="update-password-error"
            >
              {error}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              data-test-id="update-password-password-input"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive" data-test-id="update-password-password-error">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              data-test-id="update-password-confirm-password-input"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive" data-test-id="update-password-confirm-password-error">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading} data-test-id="update-password-submit-button">
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-test-id="update-password-loading-spinner" />
            )}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
