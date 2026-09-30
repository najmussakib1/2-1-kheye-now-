export const DELIVERY_LOCATIONS = [
  'Dhanmondi',
  'Mirpur',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mohakhali',
] as const;

export type DeliveryLocation = typeof DELIVERY_LOCATIONS[number];

/**
 * Standard delivery fee by location.
 * Rider earnings on delivery compilation equal this delivery fee with zero extra commission.
 */
export function getDeliveryFeeByLocation(location?: string): number {
  const loc = (location || '').trim().toLowerCase();
  if (loc === 'dhanmondi') return 40.00;
  if (loc === 'gulshan' || loc === 'banani') return 60.00;
  if (loc === 'uttara' || loc === 'mirpur') return 70.00;
  return 50.00;
}
