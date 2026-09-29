import { EmailDelivery, EmailMessage } from '../../../domain/ports/EmailSender';
import { ResendEmailSender } from './ResendEmailSender';

interface RecordedRequest {
  url: string;
  method: string | undefined;
  headers: Record<string, string>;
  body: unknown;
}

export const createResendEmailSenderSUT = () => {
  const testConstants = {
    apiKeyForTest: 're_test_123',
    fromForTest: 'Bookparking <bonjour@bookparking.fr>',
    emailIdForTest: '3f2c9d1e-7a4b-4c2e-9f10-2b6d8e4a1c55',
    recipientForTest: 'marc.d@example.com',
  };

  const requests: RecordedRequest[] = [];
  let answer: () => Promise<Response> = async () =>
    new Response(JSON.stringify({ id: 'resend-email-id' }), { status: 200 });

  const recordingFetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    requests.push({
      url: String(input),
      method: init?.method,
      headers: { ...(init?.headers as Record<string, string>) },
      body: JSON.parse(String(init?.body)),
    });
    return answer();
  }) as typeof fetch;

  const sender = new ResendEmailSender(
    testConstants.apiKeyForTest,
    testConstants.fromForTest,
    recordingFetch,
  );

  const message: EmailMessage = {
    idempotencyKey: testConstants.emailIdForTest,
    to: testConstants.recipientForTest,
    subject: 'Bienvenue sur Bookparking',
    html: '<p>Bienvenue</p>',
    text: 'Bienvenue',
  };

  return {
    context: { testConstants, requests },

    givenResendAnswers(status: number, body: unknown) {
      answer = async () => new Response(JSON.stringify(body), { status });
    },

    givenTheNetworkFails() {
      answer = async () => {
        throw new TypeError('fetch failed');
      };
    },

    async whenSending(): Promise<EmailDelivery> {
      return sender.send(message);
    },

    thenRequestWentToResend() {
      expect(requests).toHaveLength(1);
      const [request] = requests;
      expect(request.url).toEqual('https://api.resend.com/emails');
      expect(request.method).toEqual('POST');
      expect(request.headers).toEqual({
        Authorization: `Bearer ${testConstants.apiKeyForTest}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': testConstants.emailIdForTest,
      });
      expect(request.body).toEqual({
        from: testConstants.fromForTest,
        to: [testConstants.recipientForTest],
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    },

    thenDeliveryIs(delivery: EmailDelivery, expected: EmailDelivery) {
      expect(delivery).toEqual(expected);
    },
  };
};
