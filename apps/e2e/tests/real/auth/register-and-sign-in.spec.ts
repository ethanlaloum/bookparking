// Couvert ici : l'inscription depuis l'ecran, qui enchaine sur une connexion
// reelle et laisse l'utilisateur identifie — c'est le seul endroit ou
// l'enchainement `POST /account` puis `POST /session` est observable de bout en
// bout, puisque l'api ne rend aucun jeton a l'inscription.
//
// Sans equivalent ici, et pourquoi :
// - le refus d'une adresse deja prise : deja vert au rung `unit` du front
//   (registerAccountEpic.unit.spec.ts), et le rejouer ici ne prouverait rien de
//   plus que l'affichage d'un message.
// - le ralentissement des essais de connexion : l'api ne repond pas 429, elle
//   repond plus tard. Un test qui l'observerait mesurerait une duree, ce qui est
//   instable par construction. La regle est prouvee cote api.
// - la validation des champs : rung `unit`, sur le schema zod.
import { randomUUID } from 'node:crypto';

import { expect, test } from '../../../src/fixtures/test';
import { HeaderNav } from '../../../src/pages/HeaderNav';
import { RegisterPage } from '../../../src/pages/RegisterPage';
import { SignInPage } from '../../../src/pages/SignInPage';

const PASSWORD = 'motdepasse-e2e-123';

test.describe('Account', () => {
  test('registers an account and lands signed in', async ({ page, target }) => {
    const email = `e2e-register-${randomUUID().slice(0, 8)}@bookparking.test`;

    await page.goto(target.frontUrl);
    const register = new RegisterPage(page);
    await register.open();
    await register.register(email, PASSWORD);

    await new HeaderNav(page).expectSignedIn();
    await expect(page).toHaveURL(`${target.frontUrl}/`);
  });

  test('signs in an existing account and reaches the listings', async ({ page, seed, target }) => {
    const user = await seed.user('signin');

    await page.goto(target.frontUrl);
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.signIn(user.email, user.password);

    await new HeaderNav(page).expectSignedIn();
  });
});
