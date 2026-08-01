import { z } from "zod";

export const TelegramProfileIdSchema = z.string().min(8);

export const CreateTelegramProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  botToken: z.string().trim().min(20).max(300),
  chatId: z.string().trim().min(1).max(80)
});

export type CreateTelegramProfile = z.infer<typeof CreateTelegramProfileSchema>;

export type TelegramProfile = {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  createdAt: number;
  updatedAt: number;
};

export type PublicTelegramProfile = Omit<TelegramProfile, "botToken"> & {
  botTokenMasked: string;
};

export function toPublicTelegramProfile(profile: TelegramProfile): PublicTelegramProfile {
  const visible = profile.botToken.slice(-6);
  return {
    id: profile.id,
    name: profile.name,
    chatId: profile.chatId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    botTokenMasked: visible ? `••••••${visible}` : "••••••"
  };
}
