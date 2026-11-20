/**
 * Lillith's recipes — real, cookable, written in her voice. Static content for the public shell.
 * `songId` links to /listen/:id (must be a real song id); `nod` is a quiet in-text reference
 * to something that has no public page yet.
 */
export type Recipe = {
  id: string;
  title: string;
  serves: string;
  time: string;
  ingredients: string[];
  steps: string[];
  /** The last line. Deadpan, never explained. */
  note: string;
  songId?: string;
  nod?: string;
};

export const recipes: Recipe[] = [
  {
    id: 'soft-boiled-egg',
    title: 'Soft-Boiled Egg, Landing Version',
    serves: '1',
    time: '7 minutes',
    ingredients: ['1 egg, straight from the fridge', 'Water', 'Salt', 'Toast, cut into strips'],
    steps: [
      'Bring a small pot of water to a full boil. Not a polite simmer. A boil you would hear through a wall.',
      'Lower the egg in on a spoon. Do not drop it. It has had a long day in the door of the fridge.',
      'Set a timer for 6 minutes 30 seconds. Make the toast while you wait.',
      'When the timer goes, move the egg to cold running water for 30 seconds so it stops cooking.',
      'Tap the top, lift the cap, salt it, and go in with the toast.',
    ],
    note: 'Leave it one second past the switch — the palier is still deciding.',
    nod: 'Elle Danse / Le Palier',
  },
  {
    id: 'laundry-room-toast',
    title: 'Toast for the Dryer Cycle',
    serves: '1',
    time: '48 minutes, mostly waiting',
    ingredients: [
      '2 slices of bread',
      'Butter, soft',
      'Honey',
      'Flaky salt',
      'A dryer on high heat, someone else’s',
    ],
    steps: [
      'Start the dryer. Write down which one is yours. It will matter later and you will not remember.',
      'Toast the bread until it is one shade darker than you think is right.',
      'Butter it to the edges. The edges count.',
      'Honey in a thin line, then a pinch of salt.',
      'Eat it sitting on the folding table. Fold nothing.',
    ],
    note: 'The dryer hums one note. The toast is in the same key. I checked.',
    songId: 'after-is-a-floor',
  },
  {
    id: 'elevator-rice',
    title: 'Rice That Waits for the Elevator',
    serves: '2',
    time: '25 minutes',
    ingredients: ['1 cup jasmine rice', '1½ cups water', 'A pinch of salt', 'A pat of butter'],
    steps: [
      'Rinse the rice until the water runs clear. Three rinses. Four if the building is listening.',
      'Put rice, water and salt in a pot with a lid. Bring to a boil.',
      'Lid on, heat to the lowest it goes, 15 minutes. Do not lift the lid. Do not negotiate.',
      'Off the heat. Leave it covered another 10 minutes.',
      'Butter, fork, fluff.',
    ],
    note: 'Four. Six. Four. Three. It gets there. It always gets there.',
  },
  {
    id: 'tape-echo-tomato-soup',
    title: 'Tomato Soup, Second Take',
    serves: '4',
    time: '40 minutes',
    ingredients: [
      '2 tbsp olive oil',
      '1 onion, chopped',
      '3 cloves garlic, sliced',
      '1 can (28 oz / 800 g) whole tomatoes',
      '2 cups stock',
      'Salt, pepper, a splash of cream',
    ],
    steps: [
      'Soften the onion in the oil over medium heat, 8 minutes. Add the garlic for one more.',
      'Add the tomatoes and crush them with the spoon. Add the stock.',
      'Simmer 20 minutes, uncovered.',
      'Blend until smooth. Season. Cream in last.',
      'Taste it. Then taste it again a minute later. It will be different. That is the one.',
    ],
    note: 'Everything good happens off the tape — the first pass is just the room learning the song.',
    nod: 'Off the Tape',
  },
  {
    id: 'lace-waterfall-pancakes',
    title: 'Crêpes for a Matinee',
    serves: '2 (8 crêpes)',
    time: '30 minutes',
    ingredients: [
      '1 cup flour',
      '2 eggs',
      '1¼ cups milk',
      '2 tbsp melted butter, plus more for the pan',
      'A pinch of salt',
      'Lemon and sugar',
    ],
    steps: [
      'Whisk everything but the lemon and sugar until smooth. Rest it 15 minutes.',
      'Heat a nonstick pan over medium. Butter it, barely.',
      'Pour in a scant ¼ cup and tilt the pan until the batter goes thin and lacy at the edges.',
      'About a minute, flip, 20 seconds more.',
      'Lemon, sugar, fold in quarters.',
    ],
    note: 'The edges should look like the dress. Never the other way around.',
    songId: 'lace-waterfall',
  },
  {
    id: 'daisy-bell-shortbread',
    title: 'Two-Seat Shortbread',
    serves: 'A tin',
    time: '1 hour',
    ingredients: ['1 cup butter, soft', '½ cup sugar', '2 cups flour', '¼ tsp salt'],
    steps: [
      'Oven to 325°F / 160°C.',
      'Beat butter and sugar until pale. Work in flour and salt until it just holds.',
      'Press into an 8-inch pan. Prick all over with a fork. Score into fingers.',
      'Bake 40–45 minutes, until golden only at the edges.',
      'Cut along the scores while warm. Cool in the pan.',
    ],
    note: 'Makes enough for two. Bring it on a bicycle built for exactly that.',
    songId: 'daisy-bell',
  },
  {
    id: 'pizza-guy-napkins',
    title: 'Leftover Pizza, Reheated Properly',
    serves: 'Whoever is still up',
    time: '6 minutes',
    ingredients: ['Cold pizza', 'A dry skillet with a lid', 'A few drops of water'],
    steps: [
      'Put the slices in the cold skillet, then turn the heat to medium.',
      'Two minutes, until the bottom crisps.',
      'Flick a few drops of water into the pan, away from the slices, and lid it.',
      'One minute more. The cheese comes back. Everything comes back.',
    ],
    note: 'Extra napkins are in the bag.',
  },
];
