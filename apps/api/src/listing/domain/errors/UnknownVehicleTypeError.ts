export class UnknownVehicleTypeError extends Error {
  protected readonly _tag = 'UnknownVehicleTypeError';
  constructor() {
    super("Ce type de véhicule n'existe pas");
  }
}
