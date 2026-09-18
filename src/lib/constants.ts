export const DELIVERY_LOCATIONS = [
  'Dhanmondi',
  'Mirpur',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mohakhali',
] as const;

export type DeliveryLocation = typeof DELIVERY_LOCATIONS[number];
