/**
 * Intentional hand-authored TypeScript exception.
 *
 * Dialog audition pages live in `notes/scenes/versions/` as prose (competing
 * registers, fragments, juxtaposition notes). That format is not a stable JSON
 * schema, so codegen does not ingest it. This module only exports the Riley
 * Rosencrantz exchanges surfaced in the Suggestions workspace.
 *
 * New catalog arrays belong in `content/` — do not add more hand-maintained
 * data tables here.
 */
export interface DialogLine {
  speaker: string;
  text: string;
}

export interface DialogExchange {
  id: string;
  title: string;
  beat: string;
  register: string;
  status: 'draft' | 'alt' | 'active' | 'fragment';
  characters: string[];
  lines: DialogLine[];
}

export interface SceneDialogVersionSet {
  sceneId: string;
  sourceFile: string;
  description: string;
  exchanges: DialogExchange[];
}

export const sceneDialogVersions: SceneDialogVersionSet[] = [
  {
    sceneId: 'the-long-way-up',
    sourceFile: 'notes/scenes/versions/riley-rosencrantz-dialog.md',
    description:
      'Rosencrantz register — Stoppard loops, probability games, meta channel-change. Not procedural cop banter. Riley stays flat and correct; the spiral is the joke.',
    exchanges: [
      {
        id: 'rr-a',
        title: 'The Probability of a Truck',
        beat: 'Beat A — center line',
        register: 'Rosencrantz coin-flip / vehicle math',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith', 'Lillith Vale'],
        lines: [
          {
            speaker: 'RUBELLA',
            text: 'If a truck comes around the bend — and I am not saying it will, I am saying if — what are the odds it is the same truck twice.',
          },
          {
            speaker: 'RILEY',
            text: "One hundred percent, twice, if you mean Darren's hauler. He does the north pistachio run and comes back empty. That's two passes. The third vehicle is usually a county maintenance unit that hasn't been dispatched since April.",
          },
          { speaker: 'RUBELLA', text: 'So three vehicles.' },
          {
            speaker: 'RILEY',
            text: 'Three vehicles a day. Safest road in the county on a per-capita basis, which is a joke that only works if you count the lions.',
          },
          { speaker: 'RUBELLA', text: 'Six-fifteen.' },
          {
            speaker: 'RILEY',
            text: "Six-forty. Seasonal. They're not on the clock. They're on the ridge because the ridge is there and so are they.",
          },
          {
            speaker: 'RUBELLA',
            text: "What if we flipped a coin for each vehicle. Heads it passes. Tails it doesn't.",
          },
          {
            speaker: 'RILEY',
            text: "Then you'd be wrong about how roads work. Vehicles don't consult coins. They consult schedules, or Darren consults his wife about whether June needs to be at preschool, and then the truck exists.",
          },
          { speaker: 'RUBELLA', text: "You're saying the truck is inevitable." },
          {
            speaker: 'RILEY',
            text: "I'm saying the truck is Tuesday. Inevitable is a word people use when they didn't check the logbook.",
          },
          { speaker: 'RUBELLA', text: 'And us. Are we inevitable.' },
          {
            speaker: 'RILEY',
            text: "You decelerated. That was a choice. I'm walking. That was a cheaper choice. The sedan is a third thing that happened because you got curious, and curiosity is not on any schedule I was given.",
          },
          { speaker: 'RUBELLA', text: "(loud, to the car) She says we're curiosity!" },
          {
            speaker: 'LILLITH (O.S.)',
            text: 'We prefer "anomaly." Get in before the anomaly walks out of frame.',
          },
        ],
      },
      {
        id: 'rr-b',
        title: 'Whether We Are Climbing',
        beat: 'Beat D–E — sedan climb',
        register: 'Existential grade / ducting lecture',
        status: 'draft',
        characters: ['Lillith Vale', 'Riley Smith'],
        lines: [
          {
            speaker: 'LILLITH',
            text: 'Explain tropospheric ducting again. Slower. Like I am a jury that hates science but respects confidence.',
          },
          {
            speaker: 'RILEY',
            text: "Warm air over cool air. The atmosphere lies about distance. Radio waves skip farther than they should. A dead repeater can look alive on a scanner. A living one can look dead. The tower doesn't care. It's a piece of metal with a funding vote attached.",
          },
          { speaker: 'LILLITH', text: "And we're driving toward it because." },
          {
            speaker: 'RILEY',
            text: "Because the ducting window is this week. Next week the lie changes. You wanted the lecture. That's the lecture.",
          },
          {
            speaker: 'LILLITH',
            text: 'No — why are we driving toward it. Us. Three women and a hill.',
          },
          {
            speaker: 'RILEY',
            text: "You asked where I was headed. I answered. You kept going the same direction. That's not destiny. That's not following me. That's coincidence with upholstery.",
          },
          { speaker: 'LILLITH', text: "Rubella thinks it's fate." },
          { speaker: 'RILEY', text: 'Rubella thinks in lace. Lace is not a navigational system.' },
          { speaker: 'LILLITH', text: 'Are we climbing, or is the road falling away beneath us.' },
          {
            speaker: 'RILEY',
            text: 'Eleven percent grade. The road is fixed. The sedan is losing. Those are measurements. If you want philosophy, the engine is converting gasoline into heat and regret at a ratio you can hear.',
          },
          { speaker: 'LILLITH', text: "That's poetry." },
          {
            speaker: 'RILEY',
            text: "That's a coolant leak. Poetry would be if it fixed itself because you believed in it.",
          },
          { speaker: 'LILLITH', text: 'Do you believe in it.' },
          {
            speaker: 'RILEY',
            text: 'I believe in hose clamps. I have one left. Belief is what you do when the part is in Fresno until Wednesday.',
          },
          {
            speaker: 'LILLITH',
            text: 'When we get to the top — if we get to the top — will something have been waiting for us.',
          },
          {
            speaker: 'RILEY',
            text: "Yes. A decommissioned lattice structure and a view. They've been waiting since ninety-eight. Nobody takes anything down. Waiting is the default state of hardware in this country.",
          },
          { speaker: 'LILLITH', text: "That's bleak." },
          { speaker: 'RILEY', text: "It's accurate. You don't have to like it." },
        ],
      },
      {
        id: 'rr-d',
        title: 'The Padlock Is a Mood',
        beat: 'Beat C — gate',
        register: 'Ordinance as performance / three-handed',
        status: 'draft',
        characters: ['Lillith Vale', 'Rubella Vale', 'Riley Smith'],
        lines: [
          { speaker: 'LILLITH', text: '(reading) "Violators subject to citation."' },
          { speaker: 'RUBELLA', text: 'Subject to. Not "will receive." Language hedges.' },
          {
            speaker: 'RILEY',
            text: "Paren b. Enforcement discretion. There's always enforcement discretion. It's how a cut lock gets re-hung so a moving vehicle feels legal.",
          },
          { speaker: 'LILLITH', text: 'You said citation. Not felony.' },
          {
            speaker: 'RILEY',
            text: 'Correct. Felony is what people say when they want the lock to mean more than a lock means.',
          },
          { speaker: 'LILLITH', text: 'Does the lock know it was cut.' },
          {
            speaker: 'RILEY',
            text: "The lock is brass. It knows tension and release. It doesn't know March. I know March. Somebody cut it in March and hung it back because guilt is easier to carry if the gate looks official.",
          },
          { speaker: 'RUBELLA', text: 'Who.' },
          {
            speaker: 'RILEY',
            text: "Somebody who wanted to drive up without waiting for November. Somebody who understood paren b better than paren a. I didn't ask their name. I wrote down the hardware.",
          },
          { speaker: 'LILLITH', text: "And we're going through." },
          {
            speaker: 'RUBELLA',
            text: '(already opening the gate) We were always going through. The sign is a mood.',
          },
          {
            speaker: 'RILEY',
            text: 'The sign is ordinance twelve dash one fourteen. The mood is yours.',
          },
          { speaker: 'LILLITH', text: "If we don't close it behind us, did we ever open it." },
          {
            speaker: 'RILEY',
            text: "The gate doesn't care. Close it if you want. Nobody in this episode will. That's not a rule I was told. That's a pattern I've noticed.",
          },
          { speaker: 'RUBELLA', text: '(getting in) Patterns are the only religion I trust.' },
          {
            speaker: 'RILEY',
            text: "Patterns are how you predict Darren's truck. Get in before Lillith starts charging for implications.",
          },
        ],
      },
      {
        id: 'rr-e',
        title: 'Head Gasket vs Timing Chain',
        beat: 'Beat E — hood up',
        register: 'Drama vs accuracy / metaphysics of repair',
        status: 'draft',
        characters: ['Lillith Vale', 'Riley Smith', 'Rubella Vale'],
        lines: [
          { speaker: 'LILLITH', text: 'Is it the head gasket.' },
          { speaker: 'RILEY', text: 'No.' },
          {
            speaker: 'LILLITH',
            text: 'It sounds like the head gasket. In movies, the head gasket is when the marriage ends.',
          },
          {
            speaker: 'RILEY',
            text: "It's a lower radiator hose. Split at the clamp. The engine is fine. The marriage is fine. The hose is not fine. Hoses are where this story lives now.",
          },
          { speaker: 'LILLITH', text: 'Why does everyone want it to be the head gasket.' },
          {
            speaker: 'RILEY',
            text: "Because a head gasket is a narrative. Timing chain is maintenance. People prefer narratives. They can cry at narratives. You cry at a clamp and the clamp doesn't notice.",
          },
          { speaker: 'LILLITH', text: 'Will it get us up.' },
          {
            speaker: 'RILEY',
            text: 'No. It will get us down. Down is also a direction. Down is how the sedan retires with dignity.',
          },
          { speaker: 'LILLITH', text: 'So we walk.' },
          {
            speaker: 'RILEY',
            text: 'So you walk. I already planned on walking. The pack was always the plan. The sedan was a variable.',
          },
          { speaker: 'LILLITH', text: 'Variables make me nervous.' },
          {
            speaker: 'RILEY',
            text: "Variables are how you know you're not in a script. In a script the hose holds until the third act.",
          },
          { speaker: 'RUBELLA', text: '(holding one boot) Is this the third act.' },
          {
            speaker: 'RILEY',
            text: "It's five-twenty. Acts are a fiction. Grades are real. Put the boot on. Leave the heel. The image will last longer than the act break.",
          },
        ],
      },
      {
        id: 'rr-g',
        title: 'One Boot, One Stiletto, One Will',
        beat: 'Beat E — turnout',
        register: 'Footwear as free will',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith', 'Lillith Vale'],
        lines: [
          { speaker: 'RUBELLA', text: "(holding a trail boot like it's evidence) Explain this." },
          {
            speaker: 'RILEY',
            text: "It's a size seven. Salomon. Resoled once. I keep one spare pair because lace is not a tread pattern.",
          },
          { speaker: 'LILLITH', text: 'Why one boot each.' },
          {
            speaker: 'RILEY',
            text: "Because you each brought one failure of footwear and I brought the correction. Division of labor. You didn't pack for eleven percent. That's not my ordinance.",
          },
          { speaker: 'RUBELLA', text: 'I had a choice.' },
          {
            speaker: 'RILEY',
            text: 'You had a stiletto. Choice came later, when the heel met gravel and gravel won.',
          },
          { speaker: 'LILLITH', text: 'I choose the left boot.' },
          { speaker: 'RUBELLA', text: 'I choose the right.' },
          {
            speaker: 'RILEY',
            text: "You don't choose. You put on what fits the foot you have. Free will is overstated on fire roads. Gravity is not.",
          },
          { speaker: 'LILLITH', text: '(two experimental steps uphill) This is humiliating.' },
          {
            speaker: 'RILEY',
            text: "This is traction. Humiliation is when you slide backward in front of a repeater you can't reach.",
          },
          { speaker: 'RUBELLA', text: '(one boot, one heel, walking) We look absurd.' },
          {
            speaker: 'RILEY',
            text: "You look like a woman who refused to let a mountain win a footwear argument. That's not absurd. That's committed. Absurd is driving up in lace without a backup plan.",
          },
          { speaker: 'LILLITH', text: 'We had a plan.' },
          { speaker: 'RILEY', text: 'You had a sedan. Plans have hose clamps.' },
          {
            speaker: 'RUBELLA',
            text: 'If we make it to the top like this — one boot one heel — does it mean something.',
          },
          {
            speaker: 'RILEY',
            text: 'It means you walked. Meaning is what people add when the grade was enough by itself.',
          },
        ],
      },
      {
        id: 'rr-j',
        title: 'The Fire We Have Not Lit',
        beat: 'Beat G — saddle / blue hour',
        register: 'Meta-waiting for the beat',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith', 'Lillith Vale'],
        lines: [
          { speaker: 'RUBELLA', text: "Shouldn't something happen now." },
          {
            speaker: 'RILEY',
            text: "We're standing on a saddle. That's something. The grade ended. Your calves know. That's data.",
          },
          { speaker: 'LILLITH', text: 'She means narratively.' },
          {
            speaker: 'RILEY',
            text: "I don't know what that means. The sun is leaving. The tower is black against the sky. You wanted the top. You're at the top. If you need a bell to ring, I don't have one.",
          },
          { speaker: 'RUBELLA', text: 'In other episodes something explodes.' },
          {
            speaker: 'RILEY',
            text: "This episode talked. Talking episodes get silence at the end. That's the trade. You spent the budget.",
          },
          { speaker: 'LILLITH', text: 'How long do we wait.' },
          {
            speaker: 'RILEY',
            text: 'Fourteen seconds is traditional. Not my tradition. Yours. I only learned it by riding in your car.',
          },
          { speaker: 'RUBELLA', text: '(whisper) Is this the silence.' },
          { speaker: 'RILEY', text: 'Yes.' },
          { speaker: 'LILLITH', text: "It's working." },
          {
            speaker: 'RILEY',
            text: "It's not working. It's happening. Don't congratulate the weather.",
          },
          { speaker: 'RUBELLA', text: 'Now what.' },
          {
            speaker: 'RILEY',
            text: "Now you listen. Or you sing. Or you light a fire you'll regret. Those are the options. They're not in order. They're in August.",
          },
          { speaker: 'LILLITH', text: 'If we light it.' },
          {
            speaker: 'RILEY',
            text: "Then the tower gets a neighbor for the night. And a red lamp might pulse. And nobody will look up. That's the episode. You were in it.",
          },
        ],
      },
      {
        id: 'rr-k',
        title: 'Who Decelerated First',
        beat: 'Teaser alt',
        register: 'Pure tennis — fragment',
        status: 'fragment',
        characters: ['Lillith Vale', 'Riley Smith'],
        lines: [
          { speaker: 'LILLITH', text: 'Who moved first.' },
          {
            speaker: 'RILEY',
            text: "The road moved. The road is eleven miles of moving. I was already moving. You were moving faster until you weren't. Deceleration is a confession.",
          },
          { speaker: 'LILLITH', text: 'Confession of what.' },
          {
            speaker: 'RILEY',
            text: "Interest. You slowed because I looked like a question you hadn't finished asking.",
          },
          { speaker: 'LILLITH', text: "And if we hadn't slowed." },
          {
            speaker: 'RILEY',
            text: "Then I'd be at mile marker four by now and you'd be a sedan in a story I wasn't in. Deceleration is how you entered the story. Don't litigate entry. You're already in.",
          },
        ],
      },
    ],
  },
  {
    sceneId: 'no-other-human-sounds',
    sourceFile: 'notes/scenes/versions/riley-rosencrantz-dialog.md',
    description:
      'Rosencrantz register for the quiet mile — silence as wager, rally as tennis, names as coin flips. Talk is expensive in the woods.',
    exchanges: [
      {
        id: 'rr-c',
        title: 'Waiting for the Repeater',
        beat: 'Mid-woods — before rally',
        register: 'Hamlet never arrives',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith'],
        lines: [
          { speaker: 'RUBELLA', text: 'What is a repeater waiting for.' },
          {
            speaker: 'RILEY',
            text: "Nothing. It's not waiting. It's standing. Waiting implies hope. Steel doesn't hope. It rusts at a known rate.",
          },
          { speaker: 'RUBELLA', text: 'Then why walk to it.' },
          {
            speaker: 'RILEY',
            text: "Because I said I would in 2019 and the ducting window is this week and my car is in Tulare and walking is how I keep appointments with myself when the county doesn't pay me anymore.",
          },
          { speaker: 'RUBELLA', text: "That's sad." },
          {
            speaker: 'RILEY',
            text: "Sad is not a filing system. Date, wind direction, elevation. That's a filing system. The tower is filed under: still there.",
          },
          { speaker: 'RUBELLA', text: 'We could turn around.' },
          {
            speaker: 'RILEY',
            text: "We could. The road behind us is also a road. Turning around is a plot choice. I'm not the writer.",
          },
          { speaker: 'RUBELLA', text: "You think there's a writer." },
          {
            speaker: 'RILEY',
            text: "I think there's a grade. Grades don't care who wrote them. They care about your calves.",
          },
          { speaker: 'RUBELLA', text: 'The tower — when we get there — will it speak.' },
          {
            speaker: 'RILEY',
            text: 'It will creak. If the wind comes back. Wind is not speech. People keep confusing the two.',
          },
          { speaker: 'RUBELLA', text: "And if it doesn't creak." },
          {
            speaker: 'RILEY',
            text: "Then you'll have climbed a hill to stand next to a thing that doesn't perform on cue. That's most relationships. You're in lace. You probably know.",
          },
          { speaker: 'RUBELLA', text: "That's mean." },
          {
            speaker: 'RILEY',
            text: "It's adjacent. You asked about the tower. I'm answering the adjacent question.",
          },
          { speaker: 'RUBELLA', text: "What's the adjacent question." },
          {
            speaker: 'RILEY',
            text: 'Whether you came up here to see metal or to see if the day would change if you walked long enough.',
          },
          { speaker: 'RUBELLA', text: '(long beat) Both.' },
          { speaker: 'RILEY', text: "Good. Then we're walking correctly." },
        ],
      },
      {
        id: 'rr-f',
        title: 'The Silence Wager',
        beat: 'Beat B/C — woods',
        register: 'Silent show remembers dialogue',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith'],
        lines: [
          { speaker: 'RUBELLA', text: '(whispering) Are we allowed to talk.' },
          { speaker: 'RILEY', text: "(normal voice) You're talking." },
          {
            speaker: 'RUBELLA',
            text: "I mean — is this the part where we're supposed to be a silent show. I felt the channel change. I felt it go procedural and then I felt it remember.",
          },
          {
            speaker: 'RILEY',
            text: "The woods don't have a channel. The woods have absorption. Closed canopy. No wind. Sound hits the needles and dies. That's physics. Not programming.",
          },
          { speaker: 'RUBELLA', text: 'So we can talk.' },
          {
            speaker: 'RILEY',
            text: "We can. It costs more here. Every word uses up air the trees aren't giving back. That's why the rally starts short. Not because someone wrote a rule. Because the room charges rent.",
          },
          { speaker: 'RUBELLA', text: "What's a rally." },
          {
            speaker: 'RILEY',
            text: "You say something. I say something. We don't overlap. We don't confess. We pass the ball because passing is cheaper than holding.",
          },
          { speaker: 'RUBELLA', text: 'Who serves.' },
          {
            speaker: 'RILEY',
            text: "You asked about the tower. You served. I'll get a turn later. I always get one turn. That's not arrogance. That's structure.",
          },
          { speaker: 'RUBELLA', text: "What if I don't want structure. What if I want —" },
          {
            speaker: 'RILEY',
            text: "Then you're in the wrong mile. The graded fork is west. Lillith took the sedan. Structure took the sedan. You took the trees.",
          },
          { speaker: 'RUBELLA', text: 'Your turn.' },
          { speaker: 'RILEY', text: 'Why did you get out of the car.' },
          { speaker: 'RUBELLA', text: 'It had expressed itself.' },
          { speaker: 'RILEY', text: "That's a mechanical opinion, not a reason." },
          { speaker: 'RUBELLA', text: "I don't like being the one who waits." },
          {
            speaker: 'RILEY',
            text: "You waited in lace on a grade. Waiting is a skill. I don't have it. I walk. Different filing systems.",
          },
          {
            speaker: 'RUBELLA',
            text: 'If we stop talking right now — completely — for eight seconds, will the episode punish us.',
          },
          {
            speaker: 'RILEY',
            text: "I don't know what an episode is. I know if we stop for eight seconds, you'll hear your own blood. The woods will not help. That's not punishment. That's a room with the door shut.",
          },
          { speaker: 'RUBELLA', text: '(quiet) It heard us.' },
          {
            speaker: 'RILEY',
            text: "No. You heard you. That's the wager. You lost. Keep walking.",
          },
        ],
      },
      {
        id: 'rr-h',
        title: 'Whether Smith Is Adequate',
        beat: 'Beat C/D — last name once',
        register: 'Name as coin flip',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith'],
        lines: [
          { speaker: 'RUBELLA', text: "I don't know your name." },
          { speaker: 'RILEY', text: "You didn't ask." },
          { speaker: 'RUBELLA', text: "I'm asking." },
          { speaker: 'RILEY', text: 'Riley.' },
          {
            speaker: 'RUBELLA',
            text: "That's a first name. I have a first name. Everyone has a first name. It's not a gift. It's a label on a mug.",
          },
          {
            speaker: 'RILEY',
            text: "Elaine if you're filling out a form. I don't use Elaine. Forms are not this conversation.",
          },
          { speaker: 'RUBELLA', text: 'Last name.' },
          { speaker: 'RILEY', text: 'Smith.' },
          { speaker: 'RUBELLA', text: 'Smith.' },
          { speaker: 'RILEY', text: 'Yes.' },
          { speaker: 'RUBELLA', text: "That's —" },
          {
            speaker: 'RILEY',
            text: "Adequate. I know. It's exactly as adequate as it sounds. My mother kept hers. My father kept his. Darren kept his. June will keep hers. It's a family tradition of adequate.",
          },
          { speaker: 'RUBELLA', text: 'You say it like you lost a coin flip.' },
          {
            speaker: 'RILEY',
            text: "I didn't flip. I was born into a county full of Smiths and one wind chime missing a note since 2007. Adequate is fine. Adequate gets the mail. Adequate is on the site list I'm not supposed to have.",
          },
          { speaker: 'RUBELLA', text: 'Would you have preferred something that meant something.' },
          {
            speaker: 'RILEY',
            text: "Names don't mean. They point. Smith points at me the way 4N22 points at a road that stopped being graded in 2011. Still permitted. Still there.",
          },
          { speaker: 'RUBELLA', text: 'Riley Smith.' },
          { speaker: 'RILEY', text: 'Once per episode. You spent it. Keep walking.' },
        ],
      },
      {
        id: 'rr-i',
        title: 'What the Tower Is Waiting For',
        beat: 'Pulpit Overlook — tower offscreen',
        register: 'Absent Hamlet / the finding',
        status: 'draft',
        characters: ['Rubella Vale', 'Riley Smith', 'Lillith Vale'],
        lines: [
          { speaker: 'RUBELLA', text: 'Is it watching us.' },
          {
            speaker: 'RILEY',
            text: "It's not watching. It doesn't have eyes. It has a red lamp that may or may not pulse. That's not watching. That's aviation law.",
          },
          { speaker: 'LILLITH', text: 'Could it be transmitting.' },
          {
            speaker: 'RILEY',
            text: 'Could is a big word for a decommissioned weather repeater on a ducting weekend. Could is how people turn metal into plot.',
          },
          { speaker: 'RUBELLA', text: "What if it's the EyeWash Station." },
          {
            speaker: 'RILEY',
            text: "Then you're in a different show. I'm logging a tower. You're welcome to log a feeling.",
          },
          { speaker: 'LILLITH', text: "Don't be smug." },
          {
            speaker: 'RILEY',
            text: "I'm not smug. I'm accurate. Smug is when you're right and you linger. I don't linger. I write it down and move.",
          },
          { speaker: 'RUBELLA', text: "What's the finding." },
          {
            speaker: 'RILEY',
            text: 'Still there. Same finding as 2019. Same finding as ninety-eight. The finding is always still there until someone pays to take it down, and nobody pays.',
          },
          { speaker: 'LILLITH', text: "So we're walking toward a thing that will not change." },
          {
            speaker: 'RILEY',
            text: "You're walking toward a thing that will not change on your schedule. The sun will change. The ducting will change. The fire will change, if you stay long enough and you're careless with a stove. The tower will creak. That's the whole repertoire.",
          },
          { speaker: 'RUBELLA', text: 'Fire.' },
          {
            speaker: 'RILEY',
            text: "You brought a lace dress to a ridge. Fire is always on the table. I'm not threatening you. I'm describing August.",
          },
          { speaker: 'LILLITH', text: "(long beat) Let's walk." },
        ],
      },
      {
        id: 'rr-l',
        title: 'Ordinance as Scripture',
        beat: 'Gate — fragment',
        register: 'Paren theology',
        status: 'fragment',
        characters: ['Rubella Vale', 'Riley Smith', 'Lillith Vale'],
        lines: [
          { speaker: 'RUBELLA', text: 'Read paren c.' },
          { speaker: 'RILEY', text: 'Enforcement discretion.' },
          { speaker: 'RUBELLA', text: 'Read it like you believe it.' },
          {
            speaker: 'RILEY',
            text: '(reading flat) "Enforcement discretion may be exercised by authorized personnel in cases of hazard, emergency, or—"',
          },
          { speaker: 'RUBELLA', text: 'Go on.' },
          {
            speaker: 'RILEY',
            text: "There's no go on. It's discretion. The point is they can choose. Choice is why the lock is lying. The lock is a performance of law. The cut behind it is the truth. Both can exist. That's paren b's gift.",
          },
          { speaker: 'LILLITH', text: "You're preaching." },
          { speaker: 'RILEY', text: "I'm citing. Preaching is when you don't have the number." },
        ],
      },
    ],
  },
];

const dialogBySceneId = new Map(sceneDialogVersions.map((set) => [set.sceneId, set]));

export function getDialogVersionsForScene(sceneId: string): SceneDialogVersionSet | undefined {
  return dialogBySceneId.get(sceneId);
}

export function formatExchangeAsScreenplay(exchange: DialogExchange): string {
  return exchange.lines.map((line) => `${line.speaker}\n${line.text}`).join('\n\n');
}
