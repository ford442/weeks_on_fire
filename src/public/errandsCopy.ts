/** Copy for the Errands game (src/public/ErrandsGame.tsx). Written by the wof-writer pass; engine is in errands.ts. */
export type ErrandStore = {
  id: string;
  /** Full name, shown in the list panel. ≤ 32 chars. */
  name: string;
  /** Painted on the canvas roof sign. ≤ 9 chars, will be uppercased. */
  sign: string;
  /** One line under the name in the panel. ≤ 80 chars. */
  blurb: string;
};
export type ErrandItem = {
  id: string;
  storeId: string;
  /** Shopping-list label. ≤ 28 chars. */
  label: string;
  /** Toast when it goes in the car. ≤ 70 chars. */
  pickup: string;
};

export const home: { name: string; sign: string; blurb: string } = {
  name: 'The Laundry-Room Door',
  sign: 'Home',
  blurb: 'The building’s laundry room. The elevator next door has opinions.',
};

export const stores: ErrandStore[] = [
  {
    id: 'all-night-market',
    name: 'The All-Night Market',
    sign: 'Market',
    blurb: 'Open all night. Every cart pulls to the left, all at once.',
  },
  {
    id: 'wing-nut-hardware',
    name: 'Wing Nut Hardware',
    sign: 'Hardware',
    blurb: 'Parts that don’t go together. They work for exactly one night.',
  },
  {
    id: 'corner-vending-machine',
    name: 'The Corner Vending Machine',
    sign: 'Vending',
    blurb: 'A store that is one machine. The usual customer is a cat.',
  },
];

export const items: ErrandItem[] = [
  {
    id: 'dozen-eggs',
    storeId: 'all-night-market',
    label: 'A dozen eggs',
    pickup: 'A dozen eggs. Vivienne takes every corner very slowly now.',
  },
  {
    id: 'blackberries',
    storeId: 'all-night-market',
    label: 'Blackberries (one clamshell)',
    pickup: 'Blackberries. Vivienne moves them three inches. Nothing was falling.',
  },
  {
    id: 'vacuum-tube',
    storeId: 'wing-nut-hardware',
    label: 'A vacuum tube (1962)',
    pickup: 'A vacuum tube, wrapped in a dish towel like an egg.',
  },
  {
    id: 'neon-t',
    storeId: 'wing-nut-hardware',
    label: 'A neon T for the EXI sign',
    pickup: 'One neon T, taller than the car. It rides on the roof, lit.',
  },
  {
    id: 'old-detergent',
    storeId: 'corner-vending-machine',
    label: 'Detergent (the old kind)',
    pickup: 'The old detergent. Liliane holds it up like a trophy.',
  },
  {
    id: 'extra-ding',
    storeId: 'corner-vending-machine',
    label: 'One extra ding',
    pickup: 'One extra ding, in a little box. It dings when the lid shuts.',
  },
];

export const lines = {
  /** Page h1 eyebrow, ≤ 40 chars */
  eyebrow: 'Silver car, short list, long night',
  /** Page intro paragraph, 1–2 sentences, ≤ 220 chars */
  intro:
    'Vivienne drives. Liliane reads the list somebody left under the wiper: a few things from three stores, all of it back to the laundry-room door.',
  /** Toast: parked at home with nothing in the car */
  homeEmpty: 'Nothing to drop off. Liliane reads the list to the door anyway.',
  /** Toast: parked at a store that has nothing on the list */
  storeNothing: '“Not this one,” says Liliane. Nothing here is on the list.',
  /** Toasts when items are dropped at home (one picked at random) — 3 */
  delivered: [
    'Left by the door. A dryer inside hums one note, like a thank-you.',
    'Delivered. Inside, forty folding chairs creak. They do not clap.',
    'Delivered. The elevator says “Twelve.” Nobody is in it.',
  ],
  /** Final line when the list is complete — 1 */
  complete: 'Everything on the list is home. Liliane remembers one more thing.',
  /** Toast when the barricade closes a road */
  checkpoint: 'Road closed. Vivienne takes the long way like she meant to.',
  /** Toast when the car waits for the Pizza Guy */
  pizzaGuy: 'The Pizza Guy crosses with their pizza. They wait. They say nothing.',
  /** Toast when a laser snake stalls the car */
  snake: 'A laser snake crosses. Vivienne waits like it’s a red light.',
  /** Shown instead of the controls hint under reduced motion */
  stillMode: 'The snakes are resting tonight. Vivienne drives anyway.',
} as const;
