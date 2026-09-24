import { OutgoingEmail } from '../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { composeEmail } from './composeEmail';

const SITE_URL = 'https://bookparking.fr';
const QUEUED_AT = new Date('2026-10-01T07:00:00.000Z');

const welcomeFor = (recipient: string) =>
  composeEmail(
    OutgoingEmail.welcome({ recipient, queuedAt: QUEUED_AT }),
    SITE_URL,
  );

describe('composeEmail @SPEC-006', () => {
  it('writes the welcome email in French with a link to the site @EX-006-19', () => {
    const email = welcomeFor('marc.d@example.com');

    expect(email.subject).toEqual('Bienvenue sur Bookparking');
    expect(email.text).toContain('marc.d@example.com');
    expect(email.text).toContain(SITE_URL);
    expect(email.html).toContain(`href="${SITE_URL}"`);
  });

  it('escapes markup carried by the address in the HTML version @EX-006-20', () => {
    const email = welcomeFor('a<b>&c@exemple.fr');

    expect(email.html).toContain('a&lt;b&gt;&amp;c@exemple.fr');
    expect(email.html).not.toContain('<b>');
  });
});
