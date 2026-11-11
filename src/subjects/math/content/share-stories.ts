import type { ShareStory } from '../types'

// A fraction as a division (G5 p.8): {n} things shared equally by {d} children, so each gets n/d. Read by the browser voice
// (D23). Written by the planner; full nikud.

export const SHARE_STORIES: readonly ShareStory[] = [
  { id: 'pizza', text: '{n} פִּיצוֹת מְחֻלָּקוֹת שָׁוֶה בְּשָׁוֶה בֵּין {d} יְלָדִים. כַּמָּה פִּיצָה מְקַבֵּל כָּל יֶלֶד?' },
  { id: 'cake', text: '{n} עוּגוֹת מְחֻלָּקוֹת שָׁוֶה בְּשָׁוֶה בֵּין {d} חֲבֵרִים. כַּמָּה עוּגָה מְקַבֵּל כָּל אֶחָד?' },
  { id: 'chocolate', text: '{n} חֲפִיסוֹת שׁוֹקוֹלָד מְחֻלָּקוֹת שָׁוֶה בְּשָׁוֶה בֵּין {d} יְלָדִים. כַּמָּה חֲפִיסָה מְקַבֵּל כָּל יֶלֶד?' },
]
