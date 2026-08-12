import { Building2, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Field } from "../../components/form/Field";
import { Input } from "../../components/ui/input";
import { apiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { DEMO_LOGINS } from "../../lib/roles";

const DEMO_PASSWORD = "demo12345";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("agent1@demo.test");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { mfaRequired } = await login(email, password);
      if (mfaRequired) navigate("/mfa", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err, "Invalid email or password"));
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
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
              Sign in to your workspace. Each role opens its own dashboard.
            </p>
          </div>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-label="Email"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-label="Password"
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full min-h-[44px]" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
          <Button type="button" variant="outline" className="w-full min-h-[44px]" asChild>
            <Link to="/sso/callback">Continue with SSO</Link>
          </Button>

          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mentor demo — password {DEMO_PASSWORD}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_LOGINS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fillDemo(d.email)}
                  className="min-h-[44px] rounded-md border border-border bg-card px-2 py-1.5 text-left text-xs hover:bg-primary-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block font-medium">{d.label}</span>
                  <span className="block truncate text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
