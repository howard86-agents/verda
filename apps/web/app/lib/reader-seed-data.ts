import type {
  ArticleContributor,
  BehaviorLog,
  GrowthItem,
  Member,
  PointLedger,
} from "./db";

/**
 * Reader-section seed data (issue #97).
 *
 * The web seeder needs three things to make the public Readers section
 * and member-detail surfaces look populated on first boot:
 *
 *   1. A SOCIAL row (shipped from `@verda/data`) for each reader item.
 *   2. An attribution + body record per id so reposts/remixes carry
 *      the source URL, license, contributors, and authored body the
 *      reader detail (issue #75) renders directly off the article row.
 *   3. A pool of seeded members larger than the original three so each
 *      submission/repost/remix maps to a real `submittedBy` member,
 *      and so the member admin list (#31) shows >10 active members
 *      with starter ledger / growth / behavior the way the original
 *      three did.
 *
 * Keeping this content in its own module — rather than inlining it into
 * `seed.ts` — keeps the seeder readable, lets the issue-#97 invariants
 * be unit-tested without booting the seeder, and gives the CMS
 * approval queue (#102) a single source of truth when it later needs
 * to round-trip seeded reader items through the editorial flow.
 */

export interface ReaderAttribution {
  /** Multi-paragraph plain-text body. The seeder wraps each paragraph
   *  into a Tiptap `paragraph` node so the public reader (#75) renders
   *  the same shape it would for any CMS-authored article. */
  body: string[];
  contributors?: ArticleContributor[];
  license: string;
  sourceUrl: string;
}

export const READER_ATTRIBUTION: Record<string, ReaderAttribution> = {
  r01: {
    body: [
      "My mother boiled the turmeric for twenty-three minutes. She said she had stopped counting; the kitchen timer was broken. Twenty-three is now the number I keep.",
    ],
    sourceUrl: "https://instagram.com/maya.cooks",
    license: "Reader submission · used with permission",
    contributors: [
      { name: "@maya.cooks", role: "recipe + photograph", color: "#c87a3a" },
    ],
  },
  r02: {
    body: [
      "Behind the stationery shop on Aoyama-dori, a tiny garden lives in salvaged pots. The owner waters everything by hand on Sundays. We asked, she said yes, we reposted.",
    ],
    sourceUrl: "https://instagram.com/leaf",
    license: "Reposted with permission · CC BY-NC 4.0",
    contributors: [
      { name: "@leaf", role: "original photograph", color: "#4a6b48" },
    ],
  },
  r03: {
    body: [
      "Three readers sent us their May field notes. Studio H rearranged them into one continuous piece, with the originals lightly edited and clearly attributed.",
    ],
    sourceUrl: "https://studioh.tw/field-notes",
    license: "CC BY-NC 4.0",
    contributors: [
      { name: "@maya.cooks", role: "turmeric porridge note", color: "#c87a3a" },
      { name: "@a.field", role: "two morning walks", color: "#4a6b48" },
      { name: "@yu.papers", role: "three handwritten cards", color: "#9a4a68" },
    ],
  },
  r04: {
    body: [
      "I packed it the night before, on the kitchen counter, with whatever I had been meaning to use up. A small scoop of rice. A square of tamagoyaki. Two pickled radish slices. A walnut from the back of a cupboard.",
      "By morning I was on a six-hour train, the kind where the seats face each other and people pretend not to notice. I opened the box at the second tunnel. Three strangers looked up. Two of them, very politely, looked back down at their phones.",
      "The bento was not impressive. But it was small enough to be private. Most of my eating on long trains, before, had been from a paper bag — fast, embarrassed, finished too quickly. The wooden box made me eat slowly, deliberately, in pieces, the way I would at home. By the third tunnel I had been with the meal for thirty minutes.",
      "I will keep doing this. The bento does not need to be photogenic. It just needs to be small enough that you have to slow down to finish it.",
    ],
    sourceUrl: "https://instagram.com/sora.bento",
    license: "Reader submission · used with permission",
    contributors: [
      { name: "@sora.bento", role: "photograph + note", color: "#a07a3a" },
    ],
  },
  r05: {
    body: [
      "Three jars, before May. The cucumber and ginger went in last Tuesday. The daikon and lemon peel on Thursday. The third jar — the workhorse, holding the carrots that were getting bendy — went in on Saturday.",
      "By the time the new month started, all three were ready. We put them out at dinner with bowls of rice and a small piece of grilled fish. There was almost nothing else on the table. The pickles did the rest of the work.",
      "I had been told you needed to sterilise jars and follow temperatures. I had not been told you could pour cold rice vinegar over a vegetable on a Tuesday and eat it on a Wednesday. The jars are quietly changing how I cook.",
    ],
    sourceUrl: "https://daikondiary.substack.com",
    license: "Reader submission · used with permission",
    contributors: [
      { name: "@daikon.diary", role: "photograph + note", color: "#6c8048" },
    ],
  },
  r06: {
    body: [
      "On Sundays I have started turning the tap on slowly. Not to save water — the slow stream is barely less water than the fast one. I do it for the sound.",
      "If I open the tap fully, the kitchen sounds like a kitchen. If I open it slowly, until there is a small steady stream, the kitchen sounds like a stream. Two different rooms.",
      "I am only writing this down because the third Sunday in a row I caught myself standing there, holding a small ceramic bowl under the slow water, just listening. I had nowhere to be. The bowl filled in about a minute. I drank the water. It tasted like water. The morning was somehow longer.",
    ],
    sourceUrl: "https://instagram.com/paper.fold",
    license: "Reader submission · used with permission",
    contributors: [
      { name: "@paper.fold", role: "photograph + note", color: "#4a6068" },
    ],
  },
  r07: {
    body: [
      "My grandmother does not waste rice. There is always a small bowl of yesterday's rice in her fridge, covered with a cloth, kept for the next morning.",
      "Her method is simple. A teaspoon of oil, a hot pan, the rice in a single layer, a few minutes of patience until the bottom turns golden. Then a splash of water, a pinch of salt, a soft-boiled egg cracked in at the end, and a few rings of scallion. The whole thing takes ten minutes.",
      "I have been making it on weekday mornings for the last month. It is faster than buying breakfast on the way to work, and it has finally taught me that yesterday's rice is not a problem to solve. It is the start of today's first meal.",
    ],
    sourceUrl: "https://mochikitchen.tumblr.com",
    license: "Reader submission · used with permission",
    contributors: [
      { name: "@mochi.kitchen", role: "recipe + note", color: "#8a5a2a" },
    ],
  },
  r08: {
    body: [
      "Someone has pinned a small note to our apartment door. It says, in tidy handwriting, please water the plant on the second floor landing if you can. Yours in absentia. There is no name.",
      "It has been there for four days. We do not know whose plant it is. We have asked three neighbours. None of them know. The plant on the second-floor landing is, in fact, alive — somebody has been watering it. We do not know who.",
      "I am leaving the note where it is. It is the kind of small kindness the building seems to do without me. I would like to keep being a witness to it, even if I am not invited to participate.",
    ],
    sourceUrl: "https://instagram.com/still.life.tw",
    license: "Reader submission · used with permission",
    contributors: [
      { name: "@still.life.tw", role: "photograph + note", color: "#6a5a3a" },
    ],
  },
  r09: {
    body: [
      "We saw this photograph on @hana.tea's feed in early May and asked to repost it. A folded linen tea towel, drying in the late afternoon sun, on a wooden rack by an open window.",
      "The caption was short: handwashed, hung indoors, photographed in summer. We re-read it more times than the picture. There is a way of writing that simply tells you what is there, without trying to make it more, that we keep coming back to.",
      "The towel, hana wrote in a follow-up note we asked her to share, was a hand-me-down from her mother. It is twelve years old. It still works.",
    ],
    sourceUrl: "https://instagram.com/hana.tea",
    license: "Reposted with permission · CC BY-NC 4.0",
    contributors: [
      {
        name: "@hana.tea",
        role: "original photograph + caption",
        color: "#5a6a62",
      },
    ],
  },
  r10: {
    body: [
      "A reader sent us this photograph from a noodle stand near the chess corner of his neighbourhood. Two older men, deep in a game, untouched bowls of noodles between them. Late afternoon, the light starting to go.",
      "The owner of the stand, the reader wrote, never asks them to move. The chess game, the bowls of noodles, the lengthening shadows — all of it was clearly an arrangement that had been quietly negotiated over years.",
      "We asked permission to repost. Both readers and the chess players agreed. The men's faces are blurred at their request.",
    ],
    sourceUrl: "https://twitter.com/kenji.markets",
    license: "Reposted with permission · faces blurred",
    contributors: [
      {
        name: "@kenji.markets",
        role: "original photograph + note",
        color: "#6a4a2a",
      },
    ],
  },
  r11: {
    body: [
      "@small.balcony reposted, three years on. The pothos in the photograph is the same pothos that appeared in our 2023 reader submission about apartment plants — older, larger, and somewhat more confident.",
      "We wrote to ask how she had kept it alive this long. Her answer: I water it on Wednesdays. Sometimes I forget. It does not seem to mind.",
      "We are reposting both photographs side by side because the three-year continuity feels like the kind of thing readers might enjoy seeing. The pot is the same. The wicker chair is the same. The plant is roughly six times bigger.",
    ],
    sourceUrl: "https://instagram.com/small.balcony",
    license: "Reposted with permission · CC BY-NC 4.0",
    contributors: [
      {
        name: "@small.balcony",
        role: "two photographs three years apart",
        color: "#3a5a3a",
      },
    ],
  },
  r12: {
    body: [
      "The owner of a noodle shop in our neighbourhood has been quietly photographing his late-night customers' bowls for two years. Always the same composition: the bowl, the spoon, the broth, the egg, on the same wooden counter.",
      "He does not post most of them. The ones he does are the bowls he found especially calm — the bowls of customers who, he says, ate without a phone and with their full attention.",
      "We asked permission to repost three of those photographs. We are running the simplest of them here. A single bowl. A single egg. The light from the open kitchen, low and warm.",
    ],
    sourceUrl: "https://instagram.com/noodle.house",
    license: "Reposted with permission · CC BY-NC 4.0",
    contributors: [
      {
        name: "@noodle.house",
        role: "original photograph + permission",
        color: "#8a3a2a",
      },
    ],
  },
  r13: {
    body: [
      "Last Wednesday a thunderstorm passed through the city around 6pm. Four readers, in four different neighbourhoods, sent us notes about it within twelve hours. We asked if we could combine them.",
      "@yuki.walks wrote about taking shelter under a covered bus stop and sharing the bench with three strangers, none of whom said anything. @paper.fold wrote about the windowsill in their kitchen filling with a small puddle and the way the rain sounded against the metal awning.",
      "@hana.tea wrote, simply, that the storm was loud enough to make the apartment feel smaller. @still.life.tw photographed the rainwater pooling on the corner of their street, and the way a single streetlight reflected in it for the entire ninety seconds the photograph took.",
      "Studio H put the four pieces together with light editing. The four authors approved the final cut. We are running it as one continuous piece because the storm was, in fact, one storm, and the four readers were on the same Wednesday.",
    ],
    sourceUrl: "https://verda.example/remixes/four-readers-thunderstorm",
    license: "CC BY-NC 4.0",
    contributors: [
      { name: "@yuki.walks", role: "bus-stop note", color: "#2a3a52" },
      { name: "@paper.fold", role: "kitchen note", color: "#4a6068" },
      { name: "@hana.tea", role: "apartment note", color: "#5a6a62" },
      {
        name: "@still.life.tw",
        role: "rain photograph",
        color: "#6a5a3a",
      },
    ],
  },
  r14: {
    body: [
      "Six readers sent us their pickle recipes between February and April. @aiko.studio rearranged them into one piece, photographed each handwritten card, and let the cards stand in for the recipes. We ran the piece because the variety in the handwriting felt like the recipes themselves — every household's small dialect of brine.",
      "The recipes are, on the surface, very similar. Half a cup of vinegar. Half a cup of water. A pinch of salt and sugar. The differences are in the tiny notes in the margins — a yuzu peel here, a chili flake there, a small instruction to wait six hours, not two.",
      "We are running the photographs at full size so the handwriting is legible. The transcribed recipes live in the appendix. The original cards belong to the readers; we have permission to publish the photographs but not the cards themselves.",
    ],
    sourceUrl: "https://aikostudio.tw/six-pickles",
    license: "CC BY-NC 4.0",
    contributors: [
      { name: "@aiko.studio", role: "edit + photographs", color: "#6a4a2a" },
      { name: "@daikon.diary", role: "card · cucumber-ginger" },
      { name: "@mochi.kitchen", role: "card · daikon-yuzu" },
      { name: "@paper.fold", role: "card · carrot-cabbage" },
      { name: "@hana.tea", role: "card · turnip-chili" },
      { name: "@small.balcony", role: "card · wakame-cucumber" },
      { name: "@still.life.tw", role: "card · radish-soy" },
    ],
  },
  r15: {
    body: [
      "Five readers wrote in last month about kettles. @ren.notes asked if they could turn the five letters into a single piece. We said yes.",
      "Each writer described, in different words, the same small ritual: putting the kettle on for somebody else; the four minutes of useful waiting; the way the kettle is one of the few household objects that is never urgent. Two of them mentioned that the kettle was the first thing they had bought together with their partner. One of them mentioned that the kettle was the only thing she had kept from a kitchen she no longer cooks in.",
      "The remix preserves each voice as a small section. We have edited only for length and clarity. The order of the sections is the order in which the letters arrived. We are running the piece as a community remix because the kettles, taken together, told us something none of the five letters told us on its own.",
    ],
    sourceUrl: "https://verda.example/remixes/kettles-community",
    license: "CC BY-NC 4.0",
    contributors: [
      { name: "@ren.notes", role: "edit + framing", color: "#6c5a4a" },
      { name: "@hana.tea", role: "kettle letter · 1" },
      { name: "@paper.fold", role: "kettle letter · 2" },
      { name: "@mochi.kitchen", role: "kettle letter · 3" },
      { name: "@daikon.diary", role: "kettle letter · 4" },
      { name: "@still.life.tw", role: "kettle letter · 5" },
    ],
  },
};

/**
 * Members beyond the seeded MEMBER (issue #31 + #97).
 *
 * The original three (m_5102, m_6033, m_7188) ship starter ledger /
 * growth / behavior so the CMS member admin detail view shows live
 * data. The seven added here repeat that pattern at smaller scale and
 * are wired up as the `submittedBy` owners for r04–r15 so every reader
 * item attributes back to a real seeded member.
 */
export const SEEDED_READER_MEMBERS: Member[] = [
  {
    id: "m_5102",
    name: "Hana Watanabe",
    email: "hana.w@example.com",
    joined: "Joined April 2024",
  },
  {
    id: "m_6033",
    name: "Renji Park",
    email: "renji.p@example.com",
    joined: "Joined May 2024",
  },
  {
    id: "m_7188",
    name: "Aiko Sato",
    email: "aiko.s@example.com",
    joined: "Joined July 2024",
  },
  {
    id: "m_8201",
    name: "Saori Iwata",
    email: "saori.i@example.com",
    joined: "Joined August 2024",
  },
  {
    id: "m_8334",
    name: "Marcus Liu",
    email: "marcus.l@example.com",
    joined: "Joined September 2024",
  },
  {
    id: "m_8492",
    name: "Yumi Aoki",
    email: "yumi.a@example.com",
    joined: "Joined October 2024",
  },
  {
    id: "m_8651",
    name: "Daichi Mori",
    email: "daichi.m@example.com",
    joined: "Joined November 2024",
  },
  {
    id: "m_8728",
    name: "Lia Chen",
    email: "lia.c@example.com",
    joined: "Joined December 2024",
  },
  {
    id: "m_8849",
    name: "Theo Yamamoto",
    email: "theo.y@example.com",
    joined: "Joined January 2025",
  },
  {
    id: "m_8910",
    name: "Mira Park",
    email: "mira.p@example.com",
    joined: "Joined February 2025",
  },
];

/**
 * Per-member starter ledger entries. The seeder provides the
 * `createdAt` timestamp so all rows share a single seed-time `now`.
 */
export interface ReaderMemberLedger {
  amount: number;
  memberId: string;
  reason: string;
}

export const SEEDED_READER_LEDGER: ReaderMemberLedger[] = [
  { memberId: "m_5102", amount: 60, reason: "Onboarding bonus" },
  { memberId: "m_6033", amount: 25, reason: "Read · A walk after dinner" },
  { memberId: "m_7188", amount: 5, reason: "Daily check-in" },
  {
    memberId: "m_8201",
    amount: 40,
    reason: "Read · A spring bowl in 5 colors",
  },
  { memberId: "m_8334", amount: 15, reason: "Daily check-in · streak" },
  { memberId: "m_8492", amount: 30, reason: "Read · The quiet rituals" },
  { memberId: "m_8651", amount: 10, reason: "Saved · Reading the soil" },
  { memberId: "m_8728", amount: 5, reason: "Daily check-in" },
  {
    memberId: "m_8849",
    amount: 20,
    reason: "Read · Notes from a paper journal",
  },
  { memberId: "m_8910", amount: 35, reason: "Read · Six pantry items" },
];

/**
 * Per-member starter growth-item rows. The seeder fills `sequence`
 * (1 for the first plant) and `createdAt` itself.
 */
export interface ReaderMemberGrowth {
  level: number;
  memberId: string;
  nutrients: number;
}

export const SEEDED_READER_GROWTH: ReaderMemberGrowth[] = [
  { memberId: "m_5102", nutrients: 60, level: 2 },
  { memberId: "m_6033", nutrients: 25, level: 1 },
  { memberId: "m_7188", nutrients: 5, level: 1 },
  { memberId: "m_8201", nutrients: 40, level: 1 },
  { memberId: "m_8334", nutrients: 15, level: 1 },
  { memberId: "m_8492", nutrients: 30, level: 1 },
  { memberId: "m_8651", nutrients: 10, level: 1 },
  { memberId: "m_8728", nutrients: 5, level: 1 },
  { memberId: "m_8849", nutrients: 20, level: 1 },
  { memberId: "m_8910", nutrients: 35, level: 1 },
];

/** Per-member behavior log seed. Only `createdAt` is filled by the
 *  seeder; one entry per member is enough to exercise the audit
 *  surface without overwhelming the listing. */
export interface ReaderMemberBehavior {
  action: string;
  articleId?: string;
  memberId: string;
}

export const SEEDED_READER_BEHAVIOR: ReaderMemberBehavior[] = [
  { memberId: "m_5102", action: "login_91app" },
  { memberId: "m_6033", action: "read_complete", articleId: "s04" },
  { memberId: "m_7188", action: "check_in" },
  { memberId: "m_8201", action: "read_complete", articleId: "s02" },
  { memberId: "m_8334", action: "check_in" },
  { memberId: "m_8492", action: "read_complete", articleId: "s01" },
  { memberId: "m_8651", action: "saved", articleId: "s03" },
  { memberId: "m_8728", action: "check_in" },
  { memberId: "m_8849", action: "read_complete", articleId: "s05" },
  { memberId: "m_8910", action: "read_complete", articleId: "s06" },
];

/**
 * Helper used by the seeder + tests to derive the active growth-item
 * sequence (always 1 for these starter members) plus a deterministic
 * running balance for the ledger. Kept in this module so the seeder
 * and the regression test agree on the shape down to the field level.
 */
export function ledgerBalanceFor(memberId: string): number {
  const entry = SEEDED_READER_LEDGER.find((l) => l.memberId === memberId);
  return entry?.amount ?? 0;
}

/** Build the seeder-ready bulk arrays. The seeder calls this once with
 *  the seed-time `now` ISO timestamp; tests call it without arguments
 *  to verify the shape (timestamps left blank). */
export function buildReaderMemberSeed(now: string): {
  behaviorLogs: BehaviorLog[];
  growthItems: GrowthItem[];
  pointLedger: PointLedger[];
} {
  return {
    pointLedger: SEEDED_READER_LEDGER.map((l) => ({
      memberId: l.memberId,
      amount: l.amount,
      balanceAfter: l.amount,
      reason: l.reason,
      createdAt: now,
    })),
    growthItems: SEEDED_READER_GROWTH.map((g) => ({
      memberId: g.memberId,
      nutrients: g.nutrients,
      level: g.level,
      sequence: 1,
      createdAt: now,
    })),
    behaviorLogs: SEEDED_READER_BEHAVIOR.map((b) => ({
      memberId: b.memberId,
      action: b.action,
      articleId: b.articleId,
      createdAt: now,
    })),
  };
}
