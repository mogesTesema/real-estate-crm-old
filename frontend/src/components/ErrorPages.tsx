import { ArrowLeft, Ban, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "./ui/button";
import { EmptyState } from "./EmptyState";

/** Forbidden page (plan ERR-01). */
export function ForbiddenPage() {
  return (
    <EmptyState
      icon={Ban}
      title="403 — Forbidden"
      description="Your role doesn't have access to this page."
      action={
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </Button>
      }
    />
  );
}

/** Not found page (plan ERR-02). */
export function NotFoundPage() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="404 — Page not found"
      description="That route doesn't exist or was moved."
      action={
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </Button>
      }
    />
  );
}
