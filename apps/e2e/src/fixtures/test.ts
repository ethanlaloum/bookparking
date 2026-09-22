import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { test as base, type Page } from '@playwright/test';

import { ApiClient, type SeededUser } from '../seed/ApiClient';
import { Seeder } from '../seed/Seeder';
import { STACK_FILE, type StackHandle, type Target } from '../stack/target';

interface WorkerFixtures {
  stack: StackHandle;
  target: Target;
}

interface TestFixtures {
  api: ApiClient;
  seed: Seeder;
  app: AppFixture;
}

export interface AppFixture {
  openAs(user: SeededUser): Promise<Page>;
  openAnonymous(): Promise<Page>;
}

const SESSION_STORAGE_KEY = 'bookparking.session';

export const test = base.extend<TestFixtures, WorkerFixtures>({
  stack: [
    // Playwright lit la signature de la fonction pour resoudre les fixtures
    // dont elle depend : le motif de destructuration est obligatoire, meme
    // vide. Un parametre nomme fait echouer le chargement de la suite avec
    // « First argument must use the object destructuring pattern ».
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const raw = await readFile(resolve(process.cwd(), STACK_FILE), 'utf-8');
      await use(JSON.parse(raw) as StackHandle);
    },
    { scope: 'worker' },
  ],

  target: [
    async ({ stack }, use) => {
      await use(stack.target);
    },
    { scope: 'worker' },
  ],

  api: async ({ target }, use) => {
    await use(new ApiClient(target.apiUrl));
  },

  seed: async ({ api }, use) => {
    const seeder = new Seeder(api);
    await use(seeder);
    await seeder.cleanup();
  },

  app: async ({ page, target }, use) => {
    const openAnonymous = async (): Promise<Page> => {
      await page.goto(target.frontUrl);
      return page;
    };

    // Le jeton vient d'un vrai `POST /session` fait par le Seeder, jamais d'une
    // fabrication locale. On l'injecte dans le contexte *du test* plutot que
    // d'ouvrir un `browser.newContext({ storageState })`, qui sortirait de la
    // machinerie par test et ne produirait ni trace, ni video, ni capture
    // d'echec — les seuls diagnostics dont dispose le rapport.
    const openAs = async (user: SeededUser): Promise<Page> => {
      await page.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value);
        },
        [
          SESSION_STORAGE_KEY,
          JSON.stringify({ token: user.token, validUntil: user.validUntil }),
        ] as const,
      );
      await page.goto(target.frontUrl);
      return page;
    };

    await use({ openAs, openAnonymous });
  },
});

export { expect } from '@playwright/test';
