import { Bike, Car, Motorbike, PlugZap, Truck, type LucideIcon } from 'lucide-react';

import type { VehicleType } from '../app/listing/domain/entities/SearchCriteria';

// Une icône par type, et une seule source : l'écran de publication, la fiche et
// la carte de résultat lisent la même table, donc un vélo est le même dessin
// partout.
export const VEHICLE_ICON: Record<VehicleType, LucideIcon> = {
  velo: Bike,
  moto: Motorbike,
  voiture: Car,
  electrique: PlugZap,
  utilitaire: Truck,
};
