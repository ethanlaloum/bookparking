import { describe, expect, it } from 'vitest';

import { isAccelerating, needsAttention } from './Overview';

describe('le bloc « à surveiller »', () => {
  it("ne s'allume que si au moins un des trois compteurs est non nul", () => {
    expect(
      needsAttention({
        requestsPendingOverADay: 0,
        listingsWithoutAnyPrice: 0,
        accountsWithoutAnyActivity: 0,
      }),
    ).toBe(false);

    expect(
      needsAttention({
        requestsPendingOverADay: 0,
        listingsWithoutAnyPrice: 1,
        accountsWithoutAnyActivity: 0,
      }),
    ).toBe(true);
  });
});

describe("la lecture d'une accélération", () => {
  it('compare la journée au septième de la semaine qui la contient', () => {
    // Sept jours à un par jour : c'est le rythme de croisière, pas une poussée.
    expect(isAccelerating(1, 7)).toBe(false);
    // Deux en un jour quand la semaine entière en compte sept : la journée
    // pèse plus que sa part.
    expect(isAccelerating(2, 7)).toBe(true);
  });

  it("ne crie pas à l'accélération sur une semaine vide", () => {
    expect(isAccelerating(0, 0)).toBe(false);
  });
});
