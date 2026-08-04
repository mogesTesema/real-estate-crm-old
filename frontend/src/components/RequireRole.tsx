import { Navigate } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { type RoleKey } from "../lib/roles";

/** Permission wrapper (plan §5 Can / RequireRole). */
export function RequireRole({
  roles,
  children,
  fallback = <Navigate to="/403" replace />,
}: {
  roles: RoleKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { me } = useAuth();
  const role = (me?.role ?? "agent") as RoleKey;
  if (!roles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}

export function Can({
  roles,
  children,
}: {
  roles: RoleKey[];
  children: React.ReactNode;
}) {
  const { me } = useAuth();
  const role = (me?.role ?? "agent") as RoleKey;
  if (!roles.includes(role)) return null;
  return <>{children}</>;
}
