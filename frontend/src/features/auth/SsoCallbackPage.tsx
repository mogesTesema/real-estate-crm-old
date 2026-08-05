import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/** OAuth/SAML return stub (AUTH-05) — IdP not configured in Phase 1. */
export function SsoCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.message("SSO is not configured for this workspace");
    const t = window.setTimeout(() => navigate("/login", { replace: true }), 800);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Completing SSO sign-in…</p>
    </div>
  );
}
