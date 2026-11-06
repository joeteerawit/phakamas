# Each Theme owns its Step layouts; Step logic is shared

Each Lesson's Theme can lay out a Step differently: on แม่กม the Step 5 cards are umbrellas in a crowd, while on แม่กง they are a grid. So each Theme gets its own layout component for each Step. Scoring, audio and the Session (`activities/`, `audio/`, `session/`) stay shared. We rejected a single configurable component per Step because every new Theme would have added more options to it, and two very different layouts behind one set of flags are harder to read than two components.

**Consequences**: a new Theme means one layout component for each of the 10 Steps, plus the e2e checks that buttons sit in the corners and nothing that moves crosses the words.
