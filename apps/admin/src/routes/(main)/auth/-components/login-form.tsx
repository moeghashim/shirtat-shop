import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";

import { AuthFeedback, useAuthFlow } from "./auth-flow";

const formSchema = (real: boolean) =>
  z.object({
    email: z.email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(real ? 1 : 6, { message: real ? "Enter your password." : "Password must be at least 6 characters." }),
    remember: z.boolean().optional(),
  });

export function LoginForm() {
  const { auth, pending, submit } = useAuthFlow();
  const real = auth.mode === "auth";
  const onSubmit = async (data: z.infer<ReturnType<typeof formSchema>>) => {
    if (!real) {
      toast.add({ title: "Demo only", description: "This demonstration creates no account or session." });
      return;
    }
    await submit(() =>
      authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.remember ?? false,
      }),
    );
  };
  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(real)),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="login-email"
                aria-describedby={fieldState.invalid ? "login-email-error" : undefined}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError id="login-email-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input
                {...field}
                id="login-password"
                aria-describedby={fieldState.invalid ? "login-password-error" : undefined}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError id="login-password-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={fieldState.invalid}
              />
              <FieldContent>
                <FieldLabel htmlFor="login-remember" className="font-normal">
                  {real ? "Remember me" : "Remember me for 30 days"}
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <AuthFeedback />
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Login"}
      </Button>
    </form>
  );
}
