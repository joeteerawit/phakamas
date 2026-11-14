/**
 * The boots' order on the mat (แม่กบ Step 8): no rhyming pair stands side by side, so with two pairs the first pair's
 * words stand first and third and the second pair's second and fourth.
 */
export function bootOrder(pairs: readonly { left: string; right: string }[]): string[] {
  const [one, two] = pairs
  if (!one || !two || pairs.length !== 2) return pairs.flatMap(({ left, right }) => [left, right])
  return [one.left, two.left, one.right, two.right]
}
