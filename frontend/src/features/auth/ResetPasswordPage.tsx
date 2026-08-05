import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Field } from "../../components/form/Field";
import { Input } from "../../components/ui/input";
import { api, apiError } from "../../lib/api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const uid = params.get("uid") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!uid || !token) {
      toast.error("Reset link is missing uid or token");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/reset-password/", { uid, token, password });
      setDone(true);
      toast.success("Password updated");
    } catch (err) {
      toast.error(apiError(err, "Invalid or expired reset link"));
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
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {uid && token
              ? "Enter a new password for your account."
              : "Open the link from your reset email to continue."}
          </p>
        </div>
        {done ? (
          <div className="rounded-md bg-success-subtle px-3 py-3 text-sm text-success">
            Password updated. You can sign in with the new credentials.
          </div>
        ) : (
          <>
            <Field label="New password">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy || !uid || !token}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Update password
            </Button>
          </>
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
