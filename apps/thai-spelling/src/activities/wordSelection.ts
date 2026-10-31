import type { WordChoice } from '../lessons'

/** One point per Decision: a แม่กง word selected, or a distractor left alone. `wrong` lists the rest in choice order. */
export function checkWordSelection(choices: readonly WordChoice[], selected: ReadonlySet<string>) {
  const wrong = choices.filter(({ word, correct }) => selected.has(word) !== correct).map(({ word }) => word)
  return { score: choices.length - wrong.length, wrong }
}
