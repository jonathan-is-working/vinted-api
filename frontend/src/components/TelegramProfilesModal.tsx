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
  const guideSteps = [
    ["Créer le bot", <>Dans Telegram, ouvre <code>@BotFather</code>, envoie <code>/newbot</code>, puis choisis un nom et un username qui finit par <code>bot</code>.</>],
    ["Copier le token", <>Copie le token fourni par BotFather. Ne le partage pas.</>],
    ["Démarrer le bot", <>Ouvre ton nouveau bot et envoie <code>/start</code>.</>],
    ["Récupérer le Chat ID", <>Remplace <code>TOKEN</code> dans cette URL, puis ouvre-la dans ton navigateur :</>]
  ] as const;

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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={props.onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:bottom-auto sm:top-8 sm:w-[min(900px,calc(100vw-24px))]">
        <div className="max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111827] p-4 text-white shadow-2xl sm:max-h-[calc(100vh-64px)] sm:rounded-3xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-medium text-white">
                <Icon name="notifications_active" className="text-blue-400" /> Profils Telegram
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">Un profil correspond à un bot et un chat Telegram.</p>
            </div>
            <button onClick={props.onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/10"><Icon name="close" /></button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr] sm:mt-6 sm:gap-6">
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 sm:p-5">
              <h3 className="font-medium text-white">Configuration</h3>
              <div className="mt-4 grid gap-2">
                {guideSteps.map(([title, description], index) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-black/15 p-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-500 text-[11px] font-medium text-white">{index + 1}</span>
                    <div className="min-w-0 text-xs leading-5 text-white/60"><p className="font-medium text-white">{title}</p><p className="mt-0.5">{description}</p></div>
                  </div>
                ))}
              </div>
              <code className="mt-3 block break-all rounded-xl border border-white/10 bg-[#080b12] p-3 text-[10px] text-blue-200">https://api.telegram.org/botTOKEN/getUpdates</code>
              <p className="mt-3 text-xs leading-relaxed text-white/60">Récupère <code>result[0].message.chat.id</code> et envoie uniquement le Chat ID.</p>
            </div>

            <div className="grid gap-3">
              <h3 className="font-medium text-white">Ajouter un profil</h3>
              <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400" placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400" placeholder="Bot token" value={botToken} onChange={(e) => setBotToken(e.target.value)} type="password" />
              <input className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400" placeholder="Chat ID" value={chatId} onChange={(e) => setChatId(e.target.value)} />
              <button disabled={saving || !name.trim() || !botToken.trim() || !chatId.trim()} onClick={() => void create()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                {saving ? "Enregistrement…" : "Ajouter et sélectionner"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            <h3 className="font-medium text-white">Profils configurés</h3>
            {!props.profiles.length ? <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/45">Aucun profil configuré.</p> : null}
            {props.profiles.map((profile) => (
              <div key={profile.id} className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 sm:flex-nowrap sm:gap-3 ${props.activeProfileId === profile.id ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                <button onClick={() => props.onSelect(profile.id)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium text-white">{profile.name}</div>
                  <div className="text-xs text-white/40">chat {profile.chatId} · token {profile.botTokenMasked}</div>
                </button>
                <button onClick={() => void props.onTest(profile.id)} className="rounded-lg border border-blue-400/30 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-500/10">Tester</button>
                <button onClick={() => void props.onDelete(profile.id)} className="rounded-lg p-2 text-white/35 hover:bg-rose-500/10 hover:text-rose-300"><Icon name="delete" className="text-[16px]" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
