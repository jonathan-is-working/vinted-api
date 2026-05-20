import * as cheerio from "cheerio";
import { type VintedClient } from "../upstream/vinted.client.js";
import { type ItemDetails } from "./item.types.js";

function normalizeText(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export class ItemService {
  constructor(private readonly vinted: VintedClient) {}

  async getItemDetailsByHtml(id: number): Promise<ItemDetails> {
    const { html, finalUrl } = await this.vinted.getItemHtml(id);
    const $ = cheerio.load(html);

    const title =
      normalizeText($("h1").first().text()) ||
      normalizeText($("title").first().text()) ||
      null;

    // Best-effort: Vinted uses itemprop="description" on the page.
    const descNode = $("[itemprop='description']").first();
    const description = descNode.length ? normalizeText(descNode.text()) : null;

    return {
      id,
      title,
      description,
      url: finalUrl ?? null,
      source: "html_scrape"
    };
  }
}

