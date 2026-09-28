import { createHash } from 'node:crypto';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const names = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['humanProof'];

const solve = async () => {
  const response = await fetch(`${baseUrl}/account/human-challenge`);
  if (!response.ok) throw new Error(`GET /account/human-challenge answered ${response.status}`);
  const challenge = await response.json();
  for (let number = 0; number <= challenge.maxNumber; number += 1)
    if (createHash('sha256').update(challenge.salt + String(number)).digest('hex') === challenge.challenge)
      return {
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        salt: challenge.salt,
        number,
        signature: challenge.signature,
      };
  throw new Error('No number solves the challenge');
};

for (const name of names) console.log(`@${name} = ${JSON.stringify(await solve())}`);
