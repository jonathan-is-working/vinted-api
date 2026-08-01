import React, { useState } from "react";
import { Icon } from "./Icon";

export function VintedUrlModal(props: {
  open: boolean;
  onClose: () => void;
  onImport: (url: string) => string | null;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!props.open) return null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = props.onImport(url);
    if (message) {
      setError(message);
      return;
    }
    setUrl("");
    setError(null);
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 w-full bg-slate-950/35 backdrop-blur-sm" onClick={props.onClose} aria-label="Fermer" />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full sm:bottom-auto sm:top-[18vh] sm:w-[min(560px,calc(100vw-32px))]">
        <form onSubmit={submit} className="rounded-t-3xl border border-white/50 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold tracking-[-0.03em] text-slate-900">Importer un lien Vinted</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Copie une recherche depuis Vinted : Friply récupère les mots-clés et les filtres.</p>
            </div>
            <button type="button" onClick={props.onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fermer"><Icon name="close" /></button>
          </div>

          <label className="mt-6 block text-xs font-medium text-slate-700" htmlFor="vinted-catalog-url">URL du catalogue Vinted</label>
          <input
            id="vinted-catalog-url"
            autoFocus
            value={url}
            onChange={(event) => { setUrl(event.target.value); setError(null); }}
            placeholder="https://www.vinted.fr/catalog?..."
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
          {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : <p className="mt-2 text-xs text-slate-400">Exemple : une URL qui commence par `vinted.fr/catalog`.</p>}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={props.onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Annuler</button>
            <button type="submit" disabled={!url.trim()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40">Importer les filtres</button>
          </div>
        </form>
      </div>
    </div>
  );
}
