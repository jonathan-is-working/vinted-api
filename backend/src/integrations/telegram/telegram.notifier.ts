import axios from "axios";
import FormData from "form-data";
import https from "node:https";
import { type SearchItem } from "../../domain/search.types.js";
import {
  SIZE_IDS_14_TO_TITLE,
  SIZE_IDS_38_TO_TITLE,
  SIZE_IDS_4_TO_TITLE,
  SIZE_IDS_53_TO_TITLE,
  SIZE_IDS_64_TO_TITLE,
  SIZE_IDS_7_TO_TITLE,
  SIZE_IDS_52_TO_TITLE,
  SIZE_IDS_60_TO_TITLE,
  SIZE_IDS_61_TO_TITLE,
  SIZE_IDS_62_TO_TITLE,
  SIZE_IDS_63_TO_TITLE,
  SIZE_IDS_73_TO_TITLE,
  SIZE_IDS_74_TO_TITLE,
  SIZE_IDS_75_TO_TITLE,
  SIZE_IDS_77_TO_TITLE
} from "../../domain/size.presets.js";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export type TelegramNotifierConfig = {
  botToken: string;
  chatId: string;
  disableWebPreview?: boolean;
};

export class TelegramNotifier {
  constructor(private readonly cfg: TelegramNotifierConfig) {}

  private async downloadImage(url: string): Promise<Buffer | null> {
    const MAX_ATTEMPTS = 5;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await axios.get<ArrayBuffer>(url, {
          responseType: "arraybuffer",
          timeout: 15_000,
          httpsAgent: new https.Agent({ family: 4 }),
          validateStatus: (status) => status >= 200 && status < 300
        });
        const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
        const image = Buffer.from(response.data);
        if (!contentType.startsWith("image/") || image.length === 0) {
          throw new Error("InvalidImageResponse");
        }
        return image;
      } catch (err) {
        if (attempt === MAX_ATTEMPTS) {
          const code = (err as { code?: string } | null)?.code ?? "UNKNOWN";
          console.error("[telegram] image unavailable after retries; notification skipped", { url, code });
          return null;
        }
        // Exponential back-off: 500ms, 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
    }

    return null;
  }

  /** Fire-and-forget wrapper: attempts to send, never throws, never blocks the caller. */
  private sendAsync(fn: () => Promise<void>): void {
    fn().catch((err) => {
      const code = (err as { code?: string } | null)?.code ?? "UNKNOWN";
      console.error("[telegram] sendAsync unhandled error", { code });
    });
  }

  private formatSource(input: { sourceType: "alert" | "query"; sourceKey: string }): string {
    if (input.sourceType === "alert") {
      return `Alert <code>${escapeHtml(input.sourceKey.slice(0, 8))}</code>`;
    }

    try {
      const parsed = JSON.parse(input.sourceKey) as any;
      const q = typeof parsed?.q === "string" ? parsed.q.trim() : "";
      const currency = typeof parsed?.currency === "string" ? parsed.currency.trim() : "EUR";
      const perPage = typeof parsed?.perPage === "number" ? parsed.perPage : undefined;

      const parts: string[] = [];
      if (q) parts.push(`<b>${escapeHtml(q)}</b>`);

      const euro = (minor: number) =>
        `${(minor / 100).toFixed(2)} ${escapeHtml(currency)}`;
      if (typeof parsed?.priceMin === "number") parts.push(`min ${escapeHtml(euro(parsed.priceMin))}`);
      if (typeof parsed?.priceMax === "number") parts.push(`max ${escapeHtml(euro(parsed.priceMax))}`);
      if (typeof perPage === "number") parts.push(`pp ${String(perPage)}`);

      const mapIds = (ids: unknown, dict: Record<number, string>) => {
        if (!Array.isArray(ids)) return [];
        const out: string[] = [];
        for (const raw of ids) {
          const n = Number(raw);
          if (!Number.isFinite(n)) continue;
          const t = dict[n];
          if (t) out.push(t);
        }
        return out;
      };

      const sizes: string[] = [
        ...mapIds(parsed?.sizeIds4, SIZE_IDS_4_TO_TITLE),
        ...mapIds(parsed?.sizeIds7, SIZE_IDS_7_TO_TITLE),
        ...mapIds(parsed?.sizeIds53, SIZE_IDS_53_TO_TITLE),
        ...mapIds(parsed?.sizeIds64, SIZE_IDS_64_TO_TITLE),
        ...mapIds(parsed?.sizeIds14, SIZE_IDS_14_TO_TITLE),
        ...mapIds(parsed?.sizeIds38, SIZE_IDS_38_TO_TITLE),
        ...mapIds(parsed?.sizeIds52, SIZE_IDS_52_TO_TITLE),
        ...mapIds(parsed?.sizeIds60, SIZE_IDS_60_TO_TITLE),
        ...mapIds(parsed?.sizeIds61, SIZE_IDS_61_TO_TITLE),
        ...mapIds(parsed?.sizeIds62, SIZE_IDS_62_TO_TITLE),
        ...mapIds(parsed?.sizeIds63, SIZE_IDS_63_TO_TITLE),
        ...mapIds(parsed?.sizeIds73, SIZE_IDS_73_TO_TITLE),
        ...mapIds(parsed?.sizeIds74, SIZE_IDS_74_TO_TITLE),
        ...mapIds(parsed?.sizeIds75, SIZE_IDS_75_TO_TITLE),
        ...mapIds(parsed?.sizeIds77, SIZE_IDS_77_TO_TITLE)
      ];
      if (sizes.length) {
        const uniq = Array.from(new Set(sizes));
        const shown = uniq.slice(0, 8);
        const extra = uniq.length > shown.length ? ` +${uniq.length - shown.length}` : "";
        parts.push(`sizes ${escapeHtml(shown.join(", "))}${extra}`);
      }

      const summary = parts.join(" • ");
      return `Live ${summary || `<code>${escapeHtml(input.sourceKey.slice(0, 80))}</code>`}`;
    } catch {
      return `Live <code>${escapeHtml(input.sourceKey.slice(0, 80))}</code>`;
    }
  }

  private clampCaption(s: string): string {
    // Telegram captions are limited (sendPhoto is ~1024 chars).
    const max = 900;
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
  }

  notifyNewItem(input: {
    sourceType: "alert" | "query";
    sourceKey: string;
    item: SearchItem;
    sendPhoto?: boolean;
  }): void {
    // Every item notification must include a usable image. Never fall back to a text-only message.
    if (!input.item.imageUrl || input.sendPhoto === false) return;

    const title = input.item.title || `Item #${input.item.id}`;
    const price = `${(input.item.price.minor / 100).toFixed(2)} ${input.item.price.currency}`;
    const size = input.item.size ? ` • size ${input.item.size}` : "";
    const brand = input.item.brand ? ` • ${input.item.brand}` : "";

    const prefix = this.formatSource({ sourceType: input.sourceType, sourceKey: input.sourceKey });
    const caption =
      `${prefix}\n` +
      `<b>${escapeHtml(title)}</b>\n` +
      `<b>${escapeHtml(price)}</b>${escapeHtml(brand)}${escapeHtml(size)}\n` +
      `<a href="${escapeHtml(input.item.url)}">Open on Vinted</a>`;

    // Non-blocking: download + send run in the background; caller is never awaited.
    this.sendAsync(async () => {
      const http = axios.create({
        baseURL: `https://api.telegram.org/bot${this.cfg.botToken}`,
        timeout: 10_000,
        // Docker has no IPv6 route on this host; Telegram exposes AAAA records.
        httpsAgent: new https.Agent({ family: 4 })
      });

      const image = await this.downloadImage(input.item.imageUrl!);
      if (!image) return; // already logged inside downloadImage

      const form = new FormData();
      form.append("chat_id", this.cfg.chatId);
      form.append("photo", image, "vinted.jpg");
      form.append("caption", this.clampCaption(caption));
      form.append("parse_mode", "HTML");
      await http.post("/sendPhoto", form, { headers: form.getHeaders() });
    });
  }
}
