/**
 * Prose for the Overview page. Not catalog data: episodes, cast, crew and "What's new" all come
 * from the generated catalog; this is the one place the show introduces itself.
 */
export const about = {
  logline:
    'Two unbothered neighbors keep a straight face while the world around them gets very loud, and the picture changes the moment the music drops.',
  synopsis: [
    'Rubella and Lillith are roommates in a very odd building. Rubella is tired and dry. Lillith is bright and fixes things with the wrong parts. Around them the world gets loud: a burning town, a midnight drive, a lawn full of laser serpents, a neighborhood committee that calls cosmic horror seasonal décor. They stay calm. A pizza guy shows up, also calm. They are also Lace Waterfall, the band.',
    'Almost nobody talks. The music does it. Every song is original, and when the beat drops, something on screen appears, falls, multiplies or changes into something else.',
  ],
  tone: {
    line: 'Calm faces, loud world: the joke is how little anyone reacts.',
    words: ['Deadpan', 'Silly, then stranger', 'Nearly silent'],
  },
  format: [
    { label: 'Clips', value: 'Short visual segments, 6, 10 or 15 seconds each' },
    { label: 'Music', value: 'Original songs made with MiniMax Music' },
    { label: 'Episodes', value: 'Four so far, running from about 1 to about 14 minutes' },
    {
      label: 'How it’s made',
      value: 'Visuals from Grok Imagine; music from MiniMax; both AI-generated',
    },
  ],
  disclosure:
    'Weeks on Fire is a comedy series. Lace Waterfall is a fictional band from the show. Music and visuals are AI-generated. The crew and characters are fictional.',
} as const;
