import { type ItemNotifier } from "../../notifications/item.notifier.js";
import { type TelegramProfilesRepo } from "../../telegram/profiles.repo.js";
import { TelegramNotifier } from "./telegram.notifier.js";

export class ProfiledTelegramNotifier implements ItemNotifier {
  constructor(
    private readonly profiles: TelegramProfilesRepo,
    private readonly fallback?: ItemNotifier
  ) {}

  async notifyNewItem(input: Parameters<ItemNotifier["notifyNewItem"]>[0]): Promise<void> {
    if (!input.profileId) {
      this.fallback?.notifyNewItem(input);
      return;
    }
    const profile = await this.profiles.get(input.profileId);
    if (!profile) return;
    new TelegramNotifier({ botToken: profile.botToken, chatId: profile.chatId }).notifyNewItem(input);
  }
}
