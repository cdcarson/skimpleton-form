export type ApplicationMessageData = {
  type: 'success' | 'error' | 'wait';
  message: string;
};

export type AppMessageService = {
  readonly current: ApplicationMessageData | undefined;
  readonly mostRecent: ApplicationMessageData[];
  error: (message: string) => void;
  success: (message: string) => void;
  wait: (message: string) => void;
  clear: () => void;
};

export const validateApplicationMessage = (
  data: unknown
): ApplicationMessageData | null => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const obj = data as Record<string, unknown>;

  if (
    typeof obj.type !== 'string' ||
    !['success', 'error', 'wait'].includes(obj.type)
  ) {
    return null;
  }

  if (typeof obj.message !== 'string') {
    return null;
  }

  return {
    type: obj.type as 'success' | 'error' | 'wait',
    message: obj.message
  };
};

export type ApplicationMessageConfig = {
  /**
   * Maximum number of messages to keep in the mostRecent history.
   * @default 20
   */
  maxRecentMessages?: number;
  /**
   * Time in milliseconds before success messages are automatically cleared.
   * @default 5000
   */
  successTimeout?: number;
  /**
   * Time in milliseconds before error messages are automatically cleared.
   * @default 8000
   */
  errorTimeout?: number;
};
