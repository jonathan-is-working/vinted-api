import { type Alert, type AlertEvent } from "./alerts.types.js";

export class AlertsStore {
  private readonly alerts = new Map<string, Alert>();
  private readonly eventsByAlert = new Map<string, AlertEvent[]>();
  private readonly seenItemIdsByAlert = new Map<string, Set<number>>();

  listAlerts(): Alert[] {
    return [...this.alerts.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  getAlert(id: string): Alert | null {
    return this.alerts.get(id) ?? null;
  }

  putAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
  }

  deleteAlert(id: string): void {
    this.alerts.delete(id);
    this.eventsByAlert.delete(id);
    this.seenItemIdsByAlert.delete(id);
  }

  markSeen(alertId: string, itemIds: number[]): void {
    let set = this.seenItemIdsByAlert.get(alertId);
    if (!set) {
      set = new Set<number>();
      this.seenItemIdsByAlert.set(alertId, set);
    }
    for (const id of itemIds) set.add(id);
  }

  isSeen(alertId: string, itemId: number): boolean {
    return this.seenItemIdsByAlert.get(alertId)?.has(itemId) ?? false;
  }

  appendEvent(alertId: string, ev: AlertEvent): void {
    const list = this.eventsByAlert.get(alertId) ?? [];
    list.push(ev);
    // keep memory bounded (PoC)
    const capped = list.slice(-500);
    this.eventsByAlert.set(alertId, capped);
  }

  listEvents(alertId: string, since?: number): AlertEvent[] {
    const list = this.eventsByAlert.get(alertId) ?? [];
    if (!since) return list;
    return list.filter((e) => e.createdAt > since);
  }
}

