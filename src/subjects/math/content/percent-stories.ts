import type { PercentStory } from '../types'

// Percent stories (G6 p.11–12): benchmark percents only, no fractional percents, no chained discounts. Read by the browser
// voice (D23): {p} the percent, {x} the price or the part. Written by the planner; full nikud.

export const PERCENT_STORIES: readonly PercentStory[] = [
  { id: 'shirt', kind: 'discount', text: 'חֻלְצָה עוֹלָה {x} שְׁקָלִים, וְיֵשׁ עָלֶיהָ הֲנָחָה שֶׁל {p} אֲחוּזִים. כַּמָּה תַּעֲלֶה אַחֲרֵי הַהֲנָחָה?' },
  { id: 'ball', kind: 'discount', text: 'כַּדּוּר עוֹלֶה {x} שְׁקָלִים, וּבַמִּבְצָע יֵשׁ {p} אֲחוּזִים הֲנָחָה. כַּמָּה יַעֲלֶה הַכַּדּוּר?' },
  { id: 'book', kind: 'rise', text: 'סֵפֶר עָלָה {x} שְׁקָלִים, וְהַמְּחִיר עָלָה בְּ־{p} אֲחוּזִים. כַּמָּה הוּא עוֹלֶה עַכְשָׁו?' },
  { id: 'ticket', kind: 'rise', text: 'כַּרְטִיס לְסֶרֶט עָלָה {x} שְׁקָלִים, וְהִתְיַקֵּר בְּ־{p} אֲחוּזִים. מָה הַמְּחִיר הֶחָדָשׁ?' },
  { id: 'class', kind: 'whole', text: '{x} יְלָדִים הֵם {p} אֲחוּזִים מֵהַכִּתָּה. כַּמָּה יְלָדִים יֵשׁ בַּכִּתָּה?' },
  { id: 'savings', kind: 'whole', text: 'חָסַכְנוּ {x} שְׁקָלִים, וְזֶה {p} אֲחוּזִים מִמְּחִיר הָאוֹפַנַּיִם. כַּמָּה עוֹלִים הָאוֹפַנַּיִם?' },
]
