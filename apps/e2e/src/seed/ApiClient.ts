import { createHash, randomUUID } from 'node:crypto';

export interface SeededUser {
  email: string;
  password: string;
  token: string;
  validUntil: string;
}

export interface PublishListingInput {
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  acceptedVehicles?: string[];
  pricing: { dayInCents?: number; weekInCents?: number; monthInCents?: number };
  availability: { from: string; to: string };
}

export interface SeededListing {
  id: string;
  address: string;
  box: string;
  ownerToken: string;
}

const PASSWORD = 'motdepasse-e2e-123';

interface HumanChallenge {
  algorithm: string;
  challenge: string;
  salt: string;
  maxNumber: number;
  signature: string;
}

/**
 * Cette api n'expose aucun endpoint d'administration : l'amorcage passe donc
 * par les memes routes publiques que celles qu'un utilisateur emprunte. La loi
 * du handbook — par l'api, jamais par la base — est respectee, et la suite
 * reste executable contre un environnement deploye ou aucun acces direct a la
 * base n'existe.
 */
export class ApiClient {
  constructor(private readonly apiUrl: string) {}

  async registerUser(label: string): Promise<SeededUser> {
    const email = `e2e-${label}-${randomUUID().slice(0, 8)}@bookparking.test`;
    const humanProof = await this.solveHumanChallenge();
    await this.expectOk('POST', '/account', {
      email,
      password: PASSWORD,
      humanProof,
      acceptsTerms: true,
      avatar: 'SIGNAL',
    });
    const session = await this.signIn(email, PASSWORD);
    return { email, password: PASSWORD, ...session };
  }

  // SPEC-007 : l'inscription exige la preuve anti-robot. Le client la calcule
  // comme le navigateur, en essayant chaque nombre.
  private async solveHumanChallenge(): Promise<Record<string, unknown>> {
    const challenge = (await this.expectOk('GET', '/account/human-challenge')) as HumanChallenge;
    for (let number = 0; number <= challenge.maxNumber; number += 1)
      if (createHash('sha256').update(challenge.salt + String(number)).digest('hex') === challenge.challenge)
        return {
          algorithm: challenge.algorithm,
          challenge: challenge.challenge,
          salt: challenge.salt,
          number,
          signature: challenge.signature,
        };
    throw new Error('Défi anti-robot insoluble');
  }

  async signIn(email: string, password: string): Promise<{ token: string; validUntil: string }> {
    const body = await this.expectOk('POST', '/session', { email, password });
    return body as { token: string; validUntil: string };
  }

  async publishListing(token: string, input: PublishListingInput): Promise<SeededListing> {
    await this.expectOk('POST', '/listing', input, token);
    const listings = (await this.expectOk('GET', '/listing')) as {
      id: string;
      address: string;
      box: string;
    }[];
    const created = listings.find(
      (listing) => listing.address === input.address && listing.box === input.box,
    );
    if (created === undefined)
      throw new Error(
        `L'annonce ${input.address} / ${input.box} est absente de GET /listing juste apres sa publication.`,
      );
    return { ...created, ownerToken: token };
  }

  async requestRental(
    token: string,
    input: { address: string; box: string; fromDay: string; toDay: string },
  ): Promise<{ id: string; checkoutUrl: string }> {
    return (await this.expectOk('POST', '/rental-request', input, token, {
      'Idempotency-Key': randomUUID(),
    })) as {
      id: string;
      checkoutUrl: string;
    };
  }

  async confirmRequest(token: string, requestId: string): Promise<void> {
    await this.expectOk('POST', `/rental-request/${requestId}/confirmation`, undefined, token);
  }

  async myRequests(token: string): Promise<{ id: string; status: string; money: string }[]> {
    return (await this.expectOk('GET', '/rental-request', undefined, token)) as {
      id: string;
      status: string;
      money: string;
    }[];
  }

  // Seule route qui rende l'identifiant d'une demande a un client : sans elle,
  // aucun test ne pourrait nommer la demande qu'il vient de creer.
  async receivedRequests(token: string): Promise<{ id: string; status: string }[]> {
    return (await this.expectOk('GET', '/rental-request/received', undefined, token)) as {
      id: string;
      status: string;
    }[];
  }

  async unpublishListing(token: string, id: string): Promise<void> {
    await this.expectOk('DELETE', `/listing/${id}`, undefined, token);
  }

  private async expectOk(
    method: string,
    path: string,
    body?: unknown,
    token?: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<unknown> {
    const headers: Record<string, string> = { ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token !== undefined) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    if (!response.ok)
      throw new Error(`${method} ${path} a repondu ${String(response.status)} : ${text}`);
    return text === '' ? undefined : JSON.parse(text);
  }
}
