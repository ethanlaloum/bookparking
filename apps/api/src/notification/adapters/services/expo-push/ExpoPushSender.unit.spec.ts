import { createExpoPushSenderSUT } from './ExpoPushSender.sut';

const PHONE = 'ExponentPushToken[marc-iphone]';

describe('ExpoPushSender', () => {
  it('posts the messages to Expo, with a sound, and reads one ticket per message', async () => {
    const sut = createExpoPushSenderSUT();

    const outcomes = await sut.whenSending([sut.messageTo(PHONE)]);

    sut.thenFirstRequestIs({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      firstMessage: {
        to: PHONE,
        title: 'Nouvelle demande de réservation',
        body: 'Un conducteur souhaite louer votre place.',
        data: { notificationId: 'notification-1', destination: 'received' },
        sound: 'default',
      },
    });
    sut.thenOutcomesAre(outcomes, ['SENT']);
  });

  it('carries the access token when Expo requires one', async () => {
    const sut = createExpoPushSenderSUT({ accessToken: 'expo-access-token' });

    await sut.whenSending([sut.messageTo(PHONE)]);

    sut.thenFirstRequestIs({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer expo-access-token',
      },
      firstMessage: expect.objectContaining({ to: PHONE }) as Record<
        string,
        unknown
      >,
    });
  });

  it('sends at most a hundred messages per request', async () => {
    const sut = createExpoPushSenderSUT();
    const messages = Array.from({ length: 250 }, (_, index) =>
      sut.messageTo(`ExponentPushToken[phone-${index}]`),
    );

    const outcomes = await sut.whenSending(messages);

    sut.thenRequestsCarried([100, 100, 50]);
    expect(outcomes).toHaveLength(250);
  });

  it('reads an uninstalled app as a phone gone, and any other error as refused', async () => {
    const sut = createExpoPushSenderSUT();
    sut.givenExpoAnswers(200, {
      data: [
        { status: 'ok', id: 'a' },
        { status: 'error', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', details: { error: 'MessageTooBig' } },
      ],
    });

    const outcomes = await sut.whenSending([
      sut.messageTo('ExponentPushToken[a]'),
      sut.messageTo('ExponentPushToken[b]'),
      sut.messageTo('ExponentPushToken[c]'),
    ]);

    sut.thenOutcomesAre(outcomes, ['SENT', 'GONE', 'REFUSED']);
  });

  it('keeps the whole batch for later when the Apple credentials are refused', async () => {
    const sut = createExpoPushSenderSUT();
    sut.givenExpoAnswers(200, {
      data: [{ status: 'error', details: { error: 'InvalidCredentials' } }],
    });

    sut.thenOutcomesAre(
      await sut.whenSending([sut.messageTo(PHONE)]),
      'UNAVAILABLE',
    );
  });

  it('reads a server error, a network failure or an unreadable answer as unavailable', async () => {
    const serverError = createExpoPushSenderSUT();
    serverError.givenExpoAnswers(503, { errors: [] });
    const network = createExpoPushSenderSUT();
    network.givenTheNetworkFails();
    const unreadable = createExpoPushSenderSUT();
    unreadable.givenExpoAnswers(200, { data: [] });

    for (const sut of [serverError, network, unreadable])
      sut.thenOutcomesAre(
        await sut.whenSending([sut.messageTo(PHONE)]),
        'UNAVAILABLE',
      );
  });
});
