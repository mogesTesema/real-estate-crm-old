import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Field } from "../../components/form/Field";
import { Input } from "../../components/ui/input";
import { api, apiError } from "../../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post("/auth/forgot-password/", { email: email.trim() });
      setSent(true);
      toast.success("If that account exists, a reset link was sent");
    } catch (err) {
      toast.error(apiError(err, "Could not send reset email"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          EstateCRM
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your work email and we&apos;ll send a reset link.
          </p>
        </div>
        {sent ? (
          <div className="rounded-md bg-success-subtle px-3 py-3 text-sm text-success">
            Check <b>{email}</b> for a reset link (also logged by the console email
            provider in development).
          </div>
        ) : (
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
        )}
        {!sent && (
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </Button>
        )}
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/login">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </form>
    </div>
  );
}
