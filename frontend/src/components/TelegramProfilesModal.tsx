import React, { useState } from "react";
import { TelegramProfile } from "../types";
import { Icon } from "./Icon";

export function TelegramProfilesModal(props: {
  open: boolean;
  profiles: TelegramProfile[];
  activeProfileId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (input: { name: string; botToken: string; chatId: string }) => Promise<void>;
  onTest: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);

  if (!props.open) return null;

  async function create() {
    if (!name.trim() || !botToken.trim() || !chatId.trim()) return;
    setSaving(true);
    try {
      await props.onCreate({ name: name.trim(), botToken: botToken.trim(), chatId: chatId.trim() });
      setName("");
      setBotToken("");
      setChatId("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={props.onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:bottom-auto sm:top-8 sm:w-[min(900px,calc(100vw-24px))]">
        <div className="max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-white/30 bg-white/95 p-4 shadow-2xl sm:max-h-[calc(100vh-64px)] sm:rounded-3xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Icon name="notifications_active" className="text-blue-600" /> Telegram profiles
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                Chaque profil correspond au bot Telegram d’une personne. Les alertes associées à ce profil seront envoyées uniquement dans son chat.
              </p>
            </div>
            <button onClick={props.onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Icon name="close" /></button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr] sm:mt-6 sm:gap-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900">Guide à envoyer à ton ami</h3>
              <ol className="mt-3 grid gap-2 text-xs leading-relaxed text-slate-600">
                <li>1. Ouvre Telegram et cherche <code>@BotFather</code>.</li>
                <li>2. Envoie <code>/newbot</code>, choisis un nom puis un username finissant par <code>bot</code>.</li>
                <li>3. Copie le token reçu. Il ressemble à <code>123456789:AA...</code>.</li>
                <li>4. Ouvre ton nouveau bot et envoie-lui <code>/start</code>.</li>
                <li>5. Remplace exactement le mot <code>TOKEN</code> dans l’URL ci-dessous par ton token, sans ajouter <code>&lt;</code> ou <code>&gt;</code>.</li>
              </ol>
              <code className="mt-3 block break-all rounded-xl bg-slate-900 p-3 text-[10px] text-blue-100">https://api.telegram.org/botTOKEN/getUpdates</code>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">Exemple : avec le token <code>123456789:AAxyz</code>, l’URL devient <code>https://api.telegram.org/bot123456789:AAxyz/getUpdates</code>. Dans la réponse JSON, récupère <code>result[0].message.chat.id</code> et envoie-moi uniquement ce Chat ID. Ne partage jamais le token.</p>
            </div>

            <div className="grid gap-3">
              <h3 className="font-bold text-slate-900">Ajouter un profil</h3>
              <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Nom (ex. Paul)" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Bot token" value={botToken} onChange={(e) => setBotToken(e.target.value)} type="password" />
              <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Chat ID" value={chatId} onChange={(e) => setChatId(e.target.value)} />
              <button disabled={saving || !name.trim() || !botToken.trim() || !chatId.trim()} onClick={() => void create()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Enregistrement…" : "Ajouter et sélectionner"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            <h3 className="font-bold text-slate-900">Profils configurés</h3>
            {!props.profiles.length ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aucun profil configuré.</p> : null}
            {props.profiles.map((profile) => (
              <div key={profile.id} className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 sm:flex-nowrap sm:gap-3 ${props.activeProfileId === profile.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <button onClick={() => props.onSelect(profile.id)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-bold text-slate-900">{profile.name}</div>
                  <div className="text-xs text-slate-500">chat {profile.chatId} · token {profile.botTokenMasked}</div>
                </button>
                <button onClick={() => void props.onTest(profile.id)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">Tester</button>
                <button onClick={() => void props.onDelete(profile.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Icon name="delete" className="text-[16px]" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
