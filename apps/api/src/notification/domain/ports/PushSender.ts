export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

// Par message, dans l'ordre : SENT, pris par le service de push ; GONE, le
// téléphone ne connaît plus l'app (désinstallée, jeton périmé) ; REFUSED, le
// message lui-même est rejeté. UNAVAILABLE vaut pour tout le lot : le service
// n'a pas répondu, rien n'est parti.
export type PushOutcome = 'SENT' | 'GONE' | 'REFUSED';

export interface PushSender {
  send(messages: PushMessage[]): Promise<PushOutcome[] | 'UNAVAILABLE'>;
}
