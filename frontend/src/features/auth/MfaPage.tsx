import { Building2, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Field } from "../../components/form/Field";
import { Input } from "../../components/ui/input";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

/** MFA challenge (AUTH-04) — stub accepts any 6-digit code when MFA is enabled. */
export function MfaPage() {
  const { me, mfaPending, completeMfa, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me) return <Navigate to="/login" replace />;
  if (!mfaPending) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/mfa/verify/", { code });
      completeMfa();
      toast.success("Verified");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(apiError(err, "Invalid code"));
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
          <h1 className="text-2xl font-semibold">Two-factor authentication</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator. Demo: any 6 digits work.
          </p>
        </div>
        <Field label="Authentication code">
          <Input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoComplete="one-time-code"
            aria-label="Authentication code"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Verify
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Cancel and sign out
        </Button>
      </form>
    </div>
  );
}
