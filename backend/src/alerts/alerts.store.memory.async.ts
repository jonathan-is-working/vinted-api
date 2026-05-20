import { AlertsStore } from "./alerts.store.js";
import { type Alert, type AlertEvent } from "./alerts.types.js";
import { type AlertsStoreLike } from "./alerts.service.js";

export class AsyncMemoryAlertsStore implements AlertsStoreLike {
  constructor(private readonly inner: AlertsStore) {}

  async listAlerts(): Promise<Alert[]> {
    return this.inner.listAlerts();
  }
  async getAlert(id: string): Promise<Alert | null> {
    return this.inner.getAlert(id);
  }
  async putAlert(alert: Alert): Promise<void> {
    this.inner.putAlert(alert);
  }
  async deleteAlert(id: string): Promise<void> {
    this.inner.deleteAlert(id);
  }
  async listEvents(alertId: string, since?: number): Promise<AlertEvent[]> {
    return this.inner.listEvents(alertId, since);
  }
  async appendEvent(alertId: string, ev: AlertEvent): Promise<void> {
    this.inner.appendEvent(alertId, ev);
  }
  async isSeen(alertId: string, itemId: number): Promise<boolean> {
    return this.inner.isSeen(alertId, itemId);
  }
  async markSeen(alertId: string, itemIds: number[]): Promise<void> {
    this.inner.markSeen(alertId, itemIds);
  }
}

