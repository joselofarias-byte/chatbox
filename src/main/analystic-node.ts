import type { AnalyticsEventParams } from '../shared/analytics'

/**
 * The fork does not report application analytics to the upstream vendor.
 *
 * Preserve the existing call surface so feature code does not need telemetry
 * conditionals and no event can accidentally leave the device through GA4.
 */
export async function event(_name: string, _params: AnalyticsEventParams = {}): Promise<null> {
  return null
}
