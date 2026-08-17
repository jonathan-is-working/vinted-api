import { type SearchItem } from "../domain/search.types.js";

export type ItemNotifier = {
  notifyNewItem(input: {
    sourceType: "alert" | "query";
    sourceKey: string;
    item: SearchItem;
    sendPhoto?: boolean;
    profileId?: string | null;
  }): void | Promise<void>;
};
