import { PushMessage, PushOutcome } from '../../../domain/ports/PushSender';
import { ExpoPushSender } from './ExpoPushSender';

interface RecordedRequest {
  url: string;
  headers: Record<string, string>;
  body: { to: string; sound: string }[];
}

export const createExpoPushSenderSUT = (
  options: { accessToken?: string } = {},
) => {
  const requests: RecordedRequest[] = [];
  let answer: (body: { to: string }[]) => Promise<Response> = async (body) =>
    new Response(
      JSON.stringify({
        data: body.map((_, index) => ({ status: 'ok', id: `ticket-${index}` })),
      }),
      { status: 200 },
    );

  const recordingFetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const body = JSON.parse(String(init?.body)) as RecordedRequest['body'];
    requests.push({
      url: String(input),
      headers: { ...(init?.headers as Record<string, string>) },
      body,
    });
    return answer(body);
  }) as typeof fetch;

  const sender = new ExpoPushSender(
    options.accessToken ?? null,
    recordingFetch,
  );

  const messageTo = (token: string): PushMessage => ({
    to: token,
    title: 'Nouvelle demande de réservation',
    body: 'Un conducteur souhaite louer votre place.',
    data: { notificationId: 'notification-1', destination: 'received' },
  });

  return {
    messageTo,

    givenExpoAnswers(status: number, body: unknown) {
      answer = async () => new Response(JSON.stringify(body), { status });
    },

    givenTheNetworkFails() {
      answer = async () => {
        throw new TypeError('fetch failed');
      };
    },

    async whenSending(messages: PushMessage[]) {
      return sender.send(messages);
    },

    thenRequestsCarried(counts: number[]) {
      expect(requests.map((request) => request.body.length)).toEqual(counts);
    },

    thenFirstRequestIs(expected: {
      headers: Record<string, string>;
      firstMessage: Record<string, unknown>;
    }) {
      expect(requests[0]?.url).toEqual('https://exp.host/--/api/v2/push/send');
      expect(requests[0]?.headers).toEqual(expected.headers);
      expect(requests[0]?.body[0]).toEqual(expected.firstMessage);
    },

    thenOutcomesAre(
      actual: PushOutcome[] | 'UNAVAILABLE',
      expected: PushOutcome[] | 'UNAVAILABLE',
    ) {
      expect(actual).toEqual(expected);
    },
  };
};
