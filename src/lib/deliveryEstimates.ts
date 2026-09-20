export interface DeliveryEstimate {
  label: string;
  detail: string;
  badgeClass: string;
  textClass: string;
  iconType: 'zap' | 'clock' | 'calendar';
}

/**
 * Returns dynamic delivery estimation details based on product category and preorder status.
 * Improves customer trust by clearly communicating turnaround time before checkout.
 */
export function getDeliveryEstimate(category: string, isPreorder?: boolean): DeliveryEstimate {
  if (isPreorder) {
    return {
      label: 'Delivered On Release Day',
      detail: 'Delivered On Official Launch Day (Pre-Order)',
      badgeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      textClass: 'text-amber-400',
      iconType: 'calendar',
    };
  }

  switch (category) {
    case 'vbucks':
      return {
        label: 'Instant Delivery',
        detail: 'Instant Delivery (5–15 Mins)',
        badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
        textClass: 'text-emerald-400',
        iconType: 'zap',
      };
    case 'rocket':
      return {
        label: 'Instant Delivery',
        detail: 'Instant Delivery (10–20 Mins)',
        badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
        textClass: 'text-emerald-400',
        iconType: 'zap',
      };
    case 'psplus':
      return {
        label: 'Instant Delivery',
        detail: 'Instant Delivery (15–30 Mins)',
        badgeClass: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
        textClass: 'text-emerald-400',
        iconType: 'zap',
      };
    case 'hezo':
      return {
        label: '1–4 Hours',
        detail: '1–4 Hours (Scheduled Queue)',
        badgeClass: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
        textClass: 'text-blue-400',
        iconType: 'clock',
      };
    case 'game':
    default:
      return {
        label: '1–2 Hours',
        detail: '1–2 Hours (Account Handover)',
        badgeClass: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
        textClass: 'text-purple-400',
        iconType: 'clock',
      };
  }
}
