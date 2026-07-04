export interface Notification {
  userId: string;
  actorId?: string;
  type: string;
  createdAt: Date;
}

export function filterUnsent(
  notifications: Notification[],
  alreadySent: Set<string>,
): Notification[] {
  return notifications.filter((n) => !alreadySent.has(String(n.userId)));
}
