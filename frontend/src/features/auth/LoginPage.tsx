import { Building2, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "../../components/ui/button";
import { Field } from "../../components/form/Field";
import { Input } from "../../components/ui/input";
import { apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@demo.test");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiError(err, "Invalid email or password"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="flex size-8 items-center justify-center rounded-md bg-white/15">
            <Building2 className="size-5" />
          </div>
          EstateCRM
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            Every lead captured.
            <br />
            Every deal visible.
          </h1>
          <p className="mt-4 max-w-sm text-primary-foreground/80">
            The real estate CRM that keeps leads, listings, and deals in one place — so
            nothing slips through the cracks.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} EstateCRM
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="size-5" />
              </div>
              EstateCRM
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your workspace.
            </p>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
          <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            Demo · admin@demo.test / demo12345
          </p>
        </form>
      </div>
    </div>
  );
}
