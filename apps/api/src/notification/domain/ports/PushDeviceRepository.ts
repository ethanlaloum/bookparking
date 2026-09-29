// Les téléphones d'un compte. Enregistrer un jeton déjà connu le donne au
// compte qui l'enregistre : un téléphone passé d'un compte à l'autre ne reçoit
// plus les notifications du premier.
export interface PushDeviceRepository {
  register(token: string, accountId: string, registeredAt: Date): Promise<void>;
  forget(tokens: string[]): Promise<void>;
}
