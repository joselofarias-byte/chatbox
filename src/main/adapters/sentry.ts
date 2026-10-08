import type { SentryAdapter, SentryScope } from '../../shared/utils/sentry_adapter'

const noopScope: SentryScope = {
  setTag(_key: string, _value: string): void {},
  setExtra(_key: string, _value: unknown): void {},
}

/**
 * No-op Sentry adapter for the fork.
 *
 * Error-reporting call sites remain compatible, but no exception, tag or extra
 * data is sent to the upstream Chatbox Sentry project.
 */
export class MainSentryAdapter implements SentryAdapter {
  captureException(_error: unknown): void {}

  withScope(callback: (scope: SentryScope) => void): void {
    callback(noopScope)
  }
}

export const sentry = new MainSentryAdapter()

export function flushSentry(_timeout: number): Promise<boolean> {
  return Promise.resolve(true)
}
