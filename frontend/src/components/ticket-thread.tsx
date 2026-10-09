"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { hace } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { useToast } from "./toast";
import { Button, cx, Textarea } from "./ui";

type Comment = NonNullable<Ticket["comments"]>[number];

/** Conversación del reclamo entre administración e inquilino. */
export function TicketThread({ ticketId, comments, onAdded, viewerIsAdmin }: { ticketId: number; comments: Comment[]; onAdded: (c: Comment) => void; viewerIsAdmin: boolean }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const c = await api<Comment>(`tickets/${ticketId}/comments`, { method: "POST", body: { body } });
      onAdded(c);
      setBody("");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <ol className="flex flex-col gap-3 px-4 py-4">
        {comments.length === 0 && <li className="text-sm text-ink-3">Todavía no hay mensajes.</li>}
        {comments.map((c) => {
          const mine = c.is_admin === viewerIsAdmin;
          return (
            <li key={c.id} className={cx("max-w-[85%] rounded-sm border px-3 py-2 text-sm", mine ? "self-end border-stamp/25 bg-stamp-soft" : "self-start border-rule bg-paper")}>
              <p className="whitespace-pre-line">{c.body}</p>
              <p className="mt-1 text-[11.5px] text-ink-3">
                {c.author} · {hace(c.created_at)}
              </p>
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="flex flex-col gap-2 border-t border-rule p-3">
        <label htmlFor={`msg-${ticketId}`} className="sr-only">
          Mensaje
        </label>
        <Textarea id={`msg-${ticketId}`} value={body} onChange={(e) => setBody(e.target.value)} rows={2} className="min-h-16" placeholder={viewerIsAdmin ? "Escribile al inquilino…" : "Escribile a la administración…"} />
        <Button type="submit" size="sm" variant="primary" loading={sending} disabled={!body.trim()} className="self-end">
          Enviar
        </Button>
      </form>
    </div>
  );
}
