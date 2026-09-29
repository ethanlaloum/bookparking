import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { stopLocalStack } from './startLocalStack';
import { STACK_FILE } from './target';

export default async function globalTeardown(): Promise<void> {
  await stopLocalStack();
  await rm(resolve(process.cwd(), STACK_FILE), { force: true });
}
