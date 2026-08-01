import { type ItemNotifier } from "../../notifications/item.notifier.js";
import { type TelegramProfilesRepo } from "../../telegram/profiles.repo.js";
import { TelegramNotifier } from "./telegram.notifier.js";

export class ProfiledTelegramNotifier implements ItemNotifier {
  constructor(
    private readonly profiles: TelegramProfilesRepo,
    private readonly fallback?: ItemNotifier
  ) {}

  async notifyNewItem(input: Parameters<ItemNotifier["notifyNewItem"]>[0]): Promise<number | null> {
    if (!input.profileId) return this.fallback?.notifyNewItem(input) ?? null;
    const profile = await this.profiles.get(input.profileId);
    if (!profile) return null;
    return new TelegramNotifier({ botToken: profile.botToken, chatId: profile.chatId }).notifyNewItem(input);
  }
}
