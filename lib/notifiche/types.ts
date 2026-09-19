export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushDevice = PushSubscriptionJSON & {
  createdAt: string;
  userAgent: string | null;
};

export type NotificaMattinaPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};
