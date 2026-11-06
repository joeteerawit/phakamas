# Game concept for every Lesson

Each Lesson (มาตรา) is its own game (ADR-0002). This page is the broad concept that every game follows. Everything not listed here is invented fresh for each Lesson.

## Shared by every Lesson

- **A journey with the Mascot.** The cover opens onto the Lesson's Map. The Map has one stop for each Step, from 2 to 9, and ends at the summary Step. The student can travel to any stop. The Map marks the recommended next stop, which stops are done, and the Stars won.
- **Ten learning stages, in this order.** Meet the words, listen and repeat, spot the final consonant, choose the words (Activity), fill the words (Activity), read along, match rhymes (Activity), read sentences, summary.
- **The same Stars.** The three Activities score the same way in every Lesson, so teachers can compare results. The Session, resume and restart work the same everywhere.
- **The same rules.** Every Lesson must:
  - play on a phone held landscape;
  - use tap targets of at least 44 px;
  - work with a screen reader and a keyboard;
  - stay playable under reduced motion, with things standing still instead of moving;
  - have no timer a child can lose to;
  - keep anything moving from crossing the words a child reads.

## Different in every Lesson

Each Lesson has its own:

- **Theme:** the setting, Scenes, Mascot and colour palette.
- **Map:** what the journey looks like and how the Mascot travels.
- **Game for each Step:** the mechanic, the objects being tapped or dragged, and what success looks like.
- **UI Kit:**
  - the shape and material of buttons;
  - the Home, Back and Next controls;
  - the speaker;
  - the cards;
  - the feedback bubble;
  - the Stars display;
  - the transition between Steps;
  - the tap sound and the burst.

Test: a child who has played one Lesson should not recognise any control in the next one, only the Mascot-led journey and the Stars.
