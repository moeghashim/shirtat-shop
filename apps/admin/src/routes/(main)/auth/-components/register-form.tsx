import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";

import { AuthFeedback, useAuthFlow } from "./auth-flow";

const formSchema = (real: boolean) =>
  z
    .object({
      name: real ? z.string().trim().min(1, "Enter your name.").max(100, "Use at most 100 characters.") : z.string(),
      email: z.email({ message: "Please enter a valid email address." }),
      password: z
        .string()
        .min(real ? 8 : 6, {
          message: real ? "Password must be at least 8 characters." : "Password must be at least 6 characters.",
        })
        .max(128, "Password must be at most 128 characters."),
      confirmPassword: z.string().min(6, { message: "Confirm Password must be at least 6 characters." }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    });

export function RegisterForm() {
  const { auth, pending, submit } = useAuthFlow();
  const real = auth.mode === "auth";
  const onSubmit = async (data: z.infer<ReturnType<typeof formSchema>>) => {
    if (!real) {
      toast.add({ title: "Demo only", description: "This demonstration creates no account or session." });
      return;
    }
    await submit(() =>
      authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      }),
    );
  };
  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(real)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        {real && (
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="register-name"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? "register-name-error" : undefined}
                />
                <FieldError id="register-name-error" errors={[fieldState.error]} />
              </Field>
            )}
          />
        )}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">Email Address</FieldLabel>
              <Input
                {...field}
                id="register-email"
                aria-describedby={fieldState.invalid ? "register-email-error" : undefined}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError id="register-email-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-password">Password</FieldLabel>
              <Input
                {...field}
                id="register-password"
                aria-describedby={fieldState.invalid ? "register-password-error" : undefined}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError id="register-password-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-confirm-password">Confirm Password</FieldLabel>
              <Input
                {...field}
                id="register-confirm-password"
                aria-describedby={fieldState.invalid ? "register-confirm-password-error" : undefined}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError id="register-confirm-password-error" errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <AuthFeedback />
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Register"}
      </Button>
    </form>
  );
}
