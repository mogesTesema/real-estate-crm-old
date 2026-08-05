import { AlertTriangle, ArrowLeft, CheckCircle2, Upload, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/form/SelectField";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { parseCsv } from "../../lib/csv";
import { useList } from "../../lib/hooks";

/**
 * CSV import wizard (SRS §3.2.6): upload → map columns → preview → import.
 * Rows are created through the standard contacts API so dedupe-normalization
 * (email/phone) is applied consistently.
 */
const FIELDS = [
  { value: "", label: "— Skip —" },
  { value: "full_name", label: "Full name" },
  { value: "company_name", label: "Company" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "location_preference", label: "Location" },
  { value: "source", label: "Source" },
];

type Step = "upload" | "map" | "review" | "done";

interface RowResult {
  ok: boolean;
  message?: string;
}

export function ImportContactsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [skipDupes, setSkipDupes] = useState(true);

  const existing = useList<{ id: string; email: string; phone: string }>("contacts", {
    page_size: 500,
  });

  const header = rows[0] ?? [];
  const body = useMemo(() => rows.slice(1, 501), [rows]);

  function guessMapping(headers: string[]) {
    const map: Record<number, string> = {};
    headers.forEach((h, i) => {
      const n = h.toLowerCase().trim();
      if (/^(full.?name|name)$/.test(n)) map[i] = "full_name";
      else if (/company/.test(n)) map[i] = "company_name";
      else if (/e-?mail/.test(n)) map[i] = "email";
      else if (/phone|mobile|tel/.test(n)) map[i] = "phone";
      else if (/location|city|area/.test(n)) map[i] = "location_preference";
      else if (/source/.test(n)) map[i] = "source";
      else map[i] = "";
    });
    setMapping(map);
  }

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast.error("The CSV needs a header row and at least one data row.");
      return;
    }
    setRows(parsed);
    guessMapping(parsed[0]);
    setStep("map");
  }

  function payloadFor(row: string[]) {
    const out: Record<string, string> = {};
    for (const [idx, field] of Object.entries(mapping)) {
      if (field) out[field] = row[Number(idx)]?.trim() ?? "";
    }
    return out;
  }

  const previewRows = body.slice(0, 8);
  const canImport = Object.values(mapping).includes("full_name") ||
    Object.values(mapping).includes("email") ||
    Object.values(mapping).includes("phone");

  const existingEmails = useMemo(() => {
    const set = new Set<string>();
    for (const c of existing.data?.results ?? []) {
      if (c.email) set.add(c.email.trim().toLowerCase());
    }
    return set;
  }, [existing.data]);

  const existingPhones = useMemo(() => {
    const set = new Set<string>();
    for (const c of existing.data?.results ?? []) {
      if (c.phone) set.add(c.phone.replace(/\D/g, ""));
    }
    return set;
  }, [existing.data]);

  /** Dedupe preview vs CRM + within the CSV itself (CON-05). */
  const dedupe = useMemo(() => {
    const mapPayload = (row: string[]) => {
      const out: Record<string, string> = {};
      for (const [idx, field] of Object.entries(mapping)) {
        if (field) out[field] = row[Number(idx)]?.trim() ?? "";
      }
      return out;
    };
    const seenEmail = new Set<string>();
    const seenPhone = new Set<string>();
    let vsCrm = 0;
    let vsFile = 0;
    const flags: ("ok" | "crm" | "file")[] = [];
    for (const row of body) {
      const p = mapPayload(row);
      const email = (p.email ?? "").trim().toLowerCase();
      const phone = (p.phone ?? "").replace(/\D/g, "");
      let flag: "ok" | "crm" | "file" = "ok";
      if (
        (email && existingEmails.has(email)) ||
        (phone && existingPhones.has(phone))
      ) {
        flag = "crm";
        vsCrm += 1;
      } else if (
        (email && seenEmail.has(email)) ||
        (phone && seenPhone.has(phone))
      ) {
        flag = "file";
        vsFile += 1;
      }
      if (email) seenEmail.add(email);
      if (phone) seenPhone.add(phone);
      flags.push(flag);
    }
    return { vsCrm, vsFile, flags };
  }, [body, mapping, existingEmails, existingPhones]);

  async function runImport() {
    setImporting(true);
    setStep("done");
    setResults([]);
    let done = 0;
    const out: RowResult[] = [];
    for (let i = 0; i < body.length; i++) {
      const row = body[i];
      const payload = payloadFor(row);
      if (!payload.full_name && !payload.email && !payload.phone) {
        out.push({ ok: false, message: "Empty row skipped" });
      } else if (skipDupes && dedupe.flags[i] !== "ok") {
        out.push({
          ok: false,
          message: dedupe.flags[i] === "crm" ? "Duplicate in CRM (skipped)" : "Duplicate in file (skipped)",
        });
      } else {
        try {
          await api.post("/contacts/", {
            full_name: payload.full_name || payload.email || payload.phone,
            company_name: payload.company_name ?? "",
            email: payload.email ?? "",
            phone: payload.phone ?? "",
            location_preference: payload.location_preference ?? "",
            source: payload.source ?? "import",
          });
          out.push({ ok: true });
        } catch {
          out.push({ ok: false, message: "Rejected by server" });
        }
      }
      done += 1;
      setProgress(done);
      setResults([...out]);
    }
    qc.invalidateQueries({ queryKey: ["contacts"] });
    toast.success(`Import finished: ${out.filter((r) => r.ok).length} of ${body.length} created`);
    setImporting(false);
  }

  const okCount = results.filter((r) => r.ok).length;

  return (
    <div>
      <PageHeader
        title="Import contacts"
        description="Upload a CSV, map its columns, review, and import."
        actions={
          <Button variant="outline" asChild>
            <Link to="/contacts">
              <ArrowLeft className="size-4" /> Back to contacts
            </Link>
          </Button>
        }
      />

      {step === "upload" && (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>1 · Upload CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-12 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Upload className="size-8" />
              Click to choose a .csv file (max 500 rows)
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Expected columns: full name, email, phone, company, location, source. A header
              row is required.
            </p>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle>2 · Map columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {header.map((h, i) => (
                <div key={i} className="space-y-1">
                  <p className="truncate text-sm font-medium" title={h}>
                    {h}
                  </p>
                  <SelectField
                    value={mapping[i] ?? ""}
                    onChange={(v) => setMapping((m) => ({ ...m, [i]: v }))}
                    options={FIELDS}
                    placeholder="Skip column"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={() => setStep("review")} disabled={!canImport}>
                Review {body.length} rows
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle>3 · Review &amp; import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(dedupe.vsCrm > 0 || dedupe.vsFile > 0) && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-subtle px-3 py-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Dedupe preview</p>
                  <p>
                    {dedupe.vsCrm} match existing CRM contacts
                    {dedupe.vsFile > 0 ? `, ${dedupe.vsFile} repeat within this file` : ""}.
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-foreground">
                    <input
                      type="checkbox"
                      checked={skipDupes}
                      onChange={(e) => setSkipDupes(e.target.checked)}
                    />
                    Skip duplicates on import
                  </label>
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Match</th>
                    {Object.entries(mapping)
                      .filter(([, f]) => f)
                      .map(([i, f]) => (
                        <th key={i} className="px-3 py-2 font-medium">
                          {FIELDS.find((x) => x.value === f)?.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => {
                    const p = payloadFor(row);
                    const active = Object.entries(mapping).filter(([, f]) => f);
                    const flag = dedupe.flags[ri];
                    return (
                      <tr key={ri} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          {flag === "ok" ? (
                            <span className="text-xs text-muted-foreground">New</span>
                          ) : (
                            <span className="text-xs font-medium text-warning">
                              {flag === "crm" ? "In CRM" : "In file"}
                            </span>
                          )}
                        </td>
                        {active.map(([i]) => (
                          <td key={i} className="px-3 py-2 text-muted-foreground">
                            {p[mapping[Number(i)]!] || "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing first {previewRows.length} of {body.length} rows.
              {skipDupes
                ? ` Will import ~${dedupe.flags.filter((f) => f === "ok").length} unique rows.`
                : ""}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("map")}>
                Back
              </Button>
              <Button onClick={runImport}>
                Import {skipDupes ? dedupe.flags.filter((f) => f === "ok").length : body.length}{" "}
                contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>{importing ? "Importing…" : "Import complete"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${body.length ? (progress / body.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress} / {body.length} processed
            </p>
            {!importing && (
              <>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-4" /> {okCount} created
                  </span>
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="size-4" /> {results.length - okCount} failed
                  </span>
                </div>
                <Button asChild className="w-full">
                  <Link to="/contacts">View contacts</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
