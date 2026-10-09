"use client";

import { useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { fecha } from "@/lib/format";
import { DOCUMENT_KINDS, type ContractDocument } from "@/lib/types";
import { useToast } from "./toast";
import { Button, cx, Empty, Field, FormError, Input, Panel, Select } from "./ui";

function size(bytes: number) {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Documentos del contrato: privados, con vencimiento opcional (garantías, seguros). */
export function ContractDocuments({ contractId, documents, onChanged }: { contractId: number; documents: ContractDocument[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState("garantia");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError(null);
    const body = new FormData();
    body.append("kind", kind);
    body.append("file", file);
    if (expires) body.append("expires_on", expires);
    try {
      await api(`contracts/${contractId}/documents`, { method: "POST", body });
      toast("Documento guardado");
      setAdding(false);
      setFile(null);
      setExpires("");
      onChanged();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  async function remove(d: ContractDocument) {
    if (!window.confirm(`¿Borrar “${d.name}”?`)) return;
    await api(`documents/${d.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <Panel>
      {documents.length === 0 && !adding && <Empty title="Sin documentos">Subí el contrato firmado, el DNI y la garantía. Si la garantía vence, te avisamos en la agenda.</Empty>}
      <ul className="divide-y divide-rule">
        {documents.map((d) => {
          const soon = d.days_to_expire !== null && d.days_to_expire <= 45;
          return (
            <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
              <FileText className="size-5 shrink-0 text-ink-3" strokeWidth={1.6} aria-hidden />
              <div className="min-w-0 flex-1">
                <a href={d.file_url} target="_blank" rel="noreferrer" className="line-clamp-2 font-semibold break-words hover:underline">
                  {d.name}
                </a>
                <p className="text-[12.5px] text-ink-3">
                  {size(d.size)}
                  {d.expires_on && (
                    <span className={cx(soon && "font-semibold text-debt")}>
                      {" "}
                      · {d.days_to_expire !== null && d.days_to_expire < 0 ? `venció el ${fecha(d.expires_on)}` : `vence el ${fecha(d.expires_on)}`}
                    </span>
                  )}
                </p>
              </div>
              <a href={d.file_url} download className="inline-flex size-8 items-center justify-center rounded-sm text-ink-2 hover:bg-sheet-2 hover:text-ink" aria-label={`Descargar ${d.name}`}>
                <Download className="size-4" />
              </a>
              <Button size="sm" variant="ghost" className="w-8 px-0" onClick={() => remove(d)} aria-label={`Borrar ${d.name}`}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
      {adding ? (
        <form onSubmit={submit} className="flex flex-col gap-3 border-t border-rule bg-paper p-4">
          <FormError message={error ? (error.field("file") ?? error.message) : null} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              {(id) => (
                <Select id={id} value={kind} onChange={(e) => setKind(e.target.value)}>
                  {DOCUMENT_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Vence" hint="Opcional">
              {(id, d) => <Input id={id} aria-describedby={d} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />}
            </Field>
          </div>
          <Field label="Archivo" hint="PDF, foto o Word, hasta 15 MB.">
            {(id, d) => <input id={id} aria-describedby={d} type="file" accept=".pdf,image/*,.doc,.docx" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm file:mr-3 file:h-9 file:rounded-sm file:border file:border-rule-strong file:bg-sheet file:px-3 file:text-sm file:font-semibold hover:file:border-ink" />}
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!file}>
              Guardar documento
            </Button>
          </div>
        </form>
      ) : (
        <div className="border-t border-rule px-4 py-2.5">
          <Button size="sm" onClick={() => setAdding(true)}>
            <Upload className="size-4" /> Subir documento
          </Button>
        </div>
      )}
    </Panel>
  );
}
