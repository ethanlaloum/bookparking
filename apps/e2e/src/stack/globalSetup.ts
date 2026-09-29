import { startLocalStack } from './startLocalStack';

export default async function globalSetup(): Promise<void> {
  await startLocalStack();
}
