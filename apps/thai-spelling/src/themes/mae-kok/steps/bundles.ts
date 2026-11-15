/**
 * The bundles' order along the terrace edge (แม่กก Step 8), as the four words lay in the closed ticket: ผัก บอก ดอก
 * ตัก, the first pair's words at the ends and the second pair's in the middle.
 */
export function bundleOrder(pairs: readonly { left: string; right: string }[]): string[] {
  const [one, two] = pairs
  if (!one || !two || pairs.length !== 2) return pairs.flatMap(({ left, right }) => [left, right])
  return [one.left, two.right, two.left, one.right]
}
