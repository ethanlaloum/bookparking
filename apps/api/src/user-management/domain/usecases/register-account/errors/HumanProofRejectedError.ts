// Le message ne dit pas pourquoi la preuve est refusée (expirée, déjà servie,
// fausse) : cela n'aiderait qu'un robot.
export class HumanProofRejectedError extends Error {
  protected readonly _tag = 'HumanProofRejectedError';
  constructor() {
    super(
      'La vérification anti-robot a échoué. Rechargez la page et réessayez.',
    );
  }
}
