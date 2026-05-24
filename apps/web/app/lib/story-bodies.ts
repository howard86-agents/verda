/**
 * Multi-paragraph story bodies for the section-fill stories (issue #96).
 *
 * The data package ships story metadata (title, slug, section, series,
 * imagePrompt/imageSeed, summary, etc.). Real ~400-700 word bodies live
 * here so the data package stays focused on lookup-friendly fields and
 * the seeder can pick them up without bundling content into runtime
 * dependencies. Keys are STORIES ids (`s07` … `s20`); each value is a
 * Tiptap `doc` JSON identical in shape to what the CMS editor emits via
 * `getJSON()`. Stories without an entry here fall back to a single
 * paragraph derived from `sum` (the s01–s06 behaviour).
 */

interface TiptapTextNode {
  text: string;
  type: "text";
}

interface TiptapParagraph {
  content: TiptapTextNode[];
  type: "paragraph";
}

interface TiptapHeading {
  attrs: { level: number };
  content: TiptapTextNode[];
  type: "heading";
}

interface TiptapImage {
  attrs: { alt: string; src: string; title: string };
  type: "image";
}

interface TiptapBlockquote {
  content: TiptapParagraph[];
  type: "blockquote";
}

type StoryBodyNode =
  | TiptapBlockquote
  | TiptapHeading
  | TiptapImage
  | TiptapParagraph;

export interface StoryBodyDoc {
  content: StoryBodyNode[];
  type: "doc";
}

function p(text: string): TiptapParagraph {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function h2(text: string): TiptapHeading {
  return {
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }],
  };
}

function pullQuote(text: string): TiptapBlockquote {
  return { type: "blockquote", content: [p(text)] };
}

function figure(id: string, n: number, title: string): TiptapImage {
  return {
    type: "image",
    attrs: {
      src: `/img/stories/${id}.webp`,
      alt: `Figure ${n} — ${title}`,
      title: `Figure ${n} — ${title}`,
    },
  };
}

function doc(...nodes: StoryBodyNode[]): StoryBodyDoc {
  return { type: "doc", content: nodes };
}

export const STORY_BODIES: Record<string, StoryBodyDoc> = {
  s07: doc(
    p(
      "There is a room in our apartment that I have not yet finished. The walls are off-white, the floor is the same pine that came with the lease, and there is exactly one chair in it. My partner thinks this is funny because every other surface in our home is layered — plants, postcards, a small painting from Kyoto, an open book on the kitchen counter that has been open since Tuesday."
    ),
    p(
      "I keep meaning to decorate the room. I have a drawer of plans for it: a slim shelf, a low table, a curtain in a particular shade of cream we saw in a fabric shop two summers ago. The plans are good plans. Most evenings I walk past the door and think next week."
    ),
    h2("The kindness of an unfinished room"),
    p(
      "Then somewhere in the second year of living here I stopped meaning it. The room as it stands is the most useful room in the apartment. I sit in the one chair when I need to think. Visitors love it; nobody knows what to do in there, so they stay quiet. My partner reads aloud from a magazine in there sometimes because the acoustics are a little soft."
    ),
    p(
      "Without anything in it, the room makes very few promises. It does not insist that you work, or rest, or eat, or photograph it. It does not have a vibe. It is just a corner of the building with the right amount of light coming in around 4pm."
    ),
    p(
      "I have started to think the room is a small lesson. Most of my life is layered: notebooks, lists, shelves of half-read paperbacks, a kettle that whistles in two different keys depending on how full it is. The layers are warm and I would not give them up. But they all suggest things — cups of tea, reading, writing, the slow project of growing a plant from a cutting on the windowsill. The undecorated room suggests nothing. Nothing is sometimes exactly what I need."
    ),
    p(
      "I have begun to copy the room, in tiny ways, into the rest of the apartment. One drawer that is allowed to be empty. One hour on Sunday that has no agenda. One morning every other week when nobody asks me what I am writing about. I am calling these the empty drawers of the week — a phrase I stole from a friend who is a chef, who keeps a deliberately empty shelf in every kitchen he has ever worked in."
    ),
    p(
      "It turns out that empty drawers are not lazy. They are a kind of architecture. They hold the shape of attention without filling it. And like the room, they make the rest of the apartment more beautiful by contrast — by not asking, themselves, to be looked at."
    ),
    p(
      "I still walk past the door most evenings and think next week. But I no longer mean it. The room and I have an agreement. It will stay empty as long as I keep needing it to be."
    )
  ),
  s08: doc(
    p(
      "The kettle is the cheapest one we own, and I would not part with it. It boils about five hundred millilitres at a time. It whistles in two keys, depending on how full it is. It takes precisely four minutes from a cold start, which is roughly the time it takes for me to wash three plates and one pan from the night before."
    ),
    p(
      "Most mornings I do not boil it for myself. I boil it for whoever comes downstairs first. Sometimes that is my partner, sometimes a friend who has stayed over, sometimes my sister, who lives close and lets herself in without knocking. I have started to think of this as a small ritual that is doing more work than I noticed."
    ),
    h2("A useful kind of waiting"),
    p(
      "When you put the kettle on for yourself, the four minutes are dead time. You scroll, you reread a yesterday email, you start a small thing you cannot finish. When you put it on for someone else, the four minutes are a small window of expecting them — which is not the same as waiting for them. You do not check the clock. You do not get impatient. You simply listen, and rinse a plate, and listen, and the kettle whistles and the person arrives or does not."
    ),
    p(
      "If they do not arrive in time, you turn off the kettle and reboil it later. Nothing is lost. The water will boil again. It is one of the few household tasks that is forgiving in this way."
    ),
    p(
      "I have a friend who calls this kind of small task wide-open work. The doing of the task is open at both ends — the person you are doing it for might want it, might not, might arrive at minute three or minute seven. The task accommodates them. You accommodate the task. Nobody is being asked anything difficult."
    ),
    p(
      "There are not many wide-open tasks in modern life. Most of mine arrive with deadlines, requirements, expected outcomes. The kettle has none of these. It is patient with me, and I am patient with the person who might or might not be drinking the tea."
    ),
    p(
      "The strangest side-effect, after a few years of this, is that I have started to enjoy boiling water for nobody in particular. If I am tired and not in the mood to make tea, I sometimes still put the kettle on. I leave it whistling for a moment longer than I need to, listen to it slow, and pour the water into the small jug we keep for plant-watering."
    ),
    p(
      "The kettle, the whistle, the careful pour into a jug, the thirty seconds of letting it cool — these things make the morning feel less like my morning and more like the morning. A morning that is being lived in, by anyone who happens to be here. Including me."
    )
  ),
  s09: doc(
    p(
      "There is a shelf in our pantry that I am calling the good intentions shelf. It is the shelf where bags of expensive wholegrain — quinoa, freekeh, kamut — go to live for many months before being quietly composted. The shelf is not large. It does not need to be."
    ),
    p(
      "I bought all of these grains, at one point or another, with very specific plans. The freekeh was for a dish a friend cooked once. The kamut was for a wholegrain pancake I never made. The quinoa was, I think, just a vague gesture toward eating better, which is rarely a plan and usually a mood."
    ),
    h2("The shorter list"),
    p(
      "After a year of clearing out the good intentions shelf, I have made a much shorter list of the wholegrains I actually finish. It is three. Brown rice. Rolled oats. A particular kind of small barley that I happen to like because it stays a little chewy in soup."
    ),
    p(
      "These three are the wholegrains I open the bag of without thinking. The rice goes in a rice cooker; the oats become breakfast; the barley goes in a pot with water and whatever vegetables are tired in the fridge. I finish the bag every time. The next bag arrives before I notice."
    ),
    p(
      "Everything else has become a kind of imagined shopping. I imagine a meal, I imagine a person who would cook the meal, I imagine the bag on the shelf, and then I do not buy the bag. I write the dish in a notebook. Sometimes I cook it once with a substitute from the short list and that is enough."
    ),
    p(
      "This sounds like restraint, but it is closer to honesty. I would rather eat what I will eat than pretend I will eat something else. There is a particular kind of cooking that exists only in the imagination — bright, ambitious, well-photographed — and another kind that happens in the kitchen, three nights a week, with what is on the short list. The two are not the same kitchen."
    ),
    p(
      "I am told this is the boring version of nutrition advice. The interesting version is to expand: try amaranth, try teff, try millet. I have tried all three. They are all on the good intentions shelf."
    ),
    p(
      "The boring version is the one I follow. Brown rice. Rolled oats. The small barley. They show up in three or four meals a week without effort. They are not glamorous and they are not nothing. They are the meals that actually feed me, and the bags that actually empty. If you want to know what wholegrains you finish, look in your kitchen at the end of a long week. The bags that are getting smaller are the ones you eat. Everything else is a story you are telling yourself."
    )
  ),
  s10: doc(
    p(
      "Last week was a quiet week, by which I mean nobody asked very much of me, the rain came on Wednesday and stayed, and I cooked breakfast three times instead of grabbing something on the way to the studio. Three is a number I want to write down, because it is more breakfasts than I have made at home in a month."
    ),
    p(
      "The three breakfasts are not impressive. I am setting them down here mostly to remember them, and partly because somebody in our reader letters asked what I actually eat in the morning, and the truth turns out to be small and repeatable."
    ),
    h2("Tuesday — rice, egg, sesame"),
    p(
      "A small bowl of leftover rice from the night before. One egg, fried until the white is set and the yolk is still soft. A teaspoon of toasted sesame, ground in a suribachi until it smells of itself. A drop of soy. Eaten standing at the counter, with hot tea, in about four minutes."
    ),
    p(
      "This is the breakfast I eat when there is rice in the rice cooker. It is the easiest. It is also the one I most often forget about, because it does not feel like cooking. The whole process is pour, crack, fry, sprinkle, eat. There is no recipe."
    ),
    h2("Thursday — oats with grated apple"),
    p(
      "Rolled oats, water, a pinch of salt, simmered for six minutes. A small apple, grated coarsely on the side of a box grater. Stirred in at the last minute, off the heat, so the apple stays slightly crisp. A spoon of yogurt and a few crushed walnuts on top."
    ),
    p(
      "I love this one most when it is raining. The grated apple is what makes it feel less like porridge and more like a quiet breakfast. The walnuts add the small percussion of crunch that the oats refuse to provide on their own."
    ),
    h2("Saturday — toast, butter, salt, fruit"),
    p(
      "This is the breakfast I make when somebody else is awake. Two thick slices of country bread, toasted dark, generous butter, a pinch of flaky salt, and whatever fruit is in the bowl on the counter — sliced thin, on a small plate, eaten with our hands."
    ),
    p(
      "I used to feel sheepish writing about toast. People will think you are not trying. But a slice of good bread, toasted dark, with butter and salt and a peach, is not a lazy breakfast. It is one of the most honest meals in the house. It cooks in three minutes. It is finished before the kettle is."
    ),
    p(
      "Three breakfasts. Maybe twenty minutes of cooking total, across the week. They are not balanced in a Pinterest way. They are not labeled with macros. They just got me to lunch. On Wednesday and Friday I had whatever I could grab on the way out. The lesson, if there is one, is that making breakfast and making a meal are different. The first is small and repeatable. The second I can save for the weekend. Both feed me in a way the rushed version does not."
    )
  ),
  s11: doc(
    p(
      "There is a post office about fifteen minutes from our apartment, and a different one about three minutes away. I send most of my letters from the further one. This is, on paper, an irrational decision. The closer one has the same stamps, the same forms, often the same staff member behind the counter on Wednesdays."
    ),
    p("The longer walk is the point. I keep finding excuses to take it."),
    h2("A walk shaped like an errand"),
    p(
      "I am not a runner. I have never managed a daily walk for its own sake — the for its own sake part is what undoes it. After a few weeks I find the loop boring, I forget to leave the apartment, I lose the habit by the second rainy week of the month."
    ),
    p(
      "But a walk shaped like an errand survives. The errand gives the walk a small reason to start, a clear ending, and a low-stakes purpose. I am going to post a letter. I am taking the long way because the long way passes the bakery, and the small park, and the row of plums that flowers in late March. The walk does not have to prove anything. It just has to deliver the letter."
    ),
    p(
      "I have started to plan errands like this on purpose. The library is forty minutes away on foot, and so is the small kitchen-supply shop where I buy salt. I sometimes walk to a bookshop two trains and one bus from us, just to get the bus and walk combination on the way home. None of these walks are exercise in any official sense. They are how I moved my body through twelve thousand steps last Sunday without thinking about it."
    ),
    p(
      "This is the part of the day I am quietly defending. The errand walk is not optimised. The closer post office is closer. The faster bakery is faster. The shorter route home is shorter. I am declining all of these efficiencies, on purpose, in exchange for a walk I will actually take."
    ),
    p(
      "What I notice on the long walks is mostly small. The way the cherry trees are arguing with the wind. The man on the corner who waits for the same bus every morning, holding the same paper bag. The shop that closed and the new shop that has not yet opened in its place. None of this would arrive on a treadmill."
    ),
    p(
      "The letter, by the way, gets posted either way. The error-tolerant part of an errand walk is that the actual errand is fine. It just rides along, in the bag, while my body and my eyes do the more important thing."
    )
  ),
  s12: doc(
    p(
      "This is the first of two pieces about a small rule I made for myself last winter, and have been quietly grateful for ever since. The rule is: always get off two stops early."
    ),
    p(
      "It applies to buses and trains. It does not apply to taxis, which do not have stops, or to bicycles, which have already chosen their own route. It is a rule I made one Tuesday in February, when the train I was on stopped at a station I had not visited in a long time, and I realised the next two stops were both close enough to my house that I could walk."
    ),
    h2("The rule, in practice"),
    p(
      "You take whatever transit you take. You set the stop you would normally get off at. Then, before you arrive, you get off two stops earlier. You walk the rest of the way."
    ),
    p(
      "That is the rule. There are no other rules. It is not about exercise — although you will get more of that. It is not about being fancy or unhurried or anti-modern. The buses are still there. You can still take the bus tomorrow."
    ),
    p(
      "The first thing you notice is that you arrive home a little later than expected. Sometimes ten minutes, sometimes twenty. This is the cost of the rule. I do not pretend the cost is zero. There are days when I do not follow the rule because I am genuinely in a hurry. The rule allows this. The rule is not a discipline. It is a default."
    ),
    p(
      "The second thing you notice is that the city, between two stops, is a city you have never seen. Buses go through neighborhoods at a height and speed that flattens them. On foot they have hills. They have cafes that face the wrong direction for the bus window. They have alleys that turn left in a way you would never see from the street."
    ),
    p(
      "The rule has changed the shape of my month in a small but measurable way. I now know the names of two streets and one small park I had passed on the bus for years. I know which corner has the tofu shop that closes at six. I know which crosswalk takes nineteen seconds and which takes thirty-five."
    ),
    p(
      "I am not collecting these facts for any reason. They are just the leftover edge of the rule. The rule's official output is I walked thirteen extra minutes today. The unofficial outputs are everything else."
    ),
    p(
      "Next week, in part two, I want to write about the harder version of this rule — the version where the weather is bad, or the day has been too long, or the body has the right to decline. The rule survives those days too, and how it survives them is more interesting than how it succeeds."
    )
  ),
  s13: doc(
    p(
      "In part one I wrote about a small rule I keep — get off two stops early, walk the rest of the way. Today I want to talk about the days the rule does not survive, and the days it surprisingly does."
    ),
    p(
      "There are two kinds of arguments the weather makes with a walk. The first is the obvious one: cold rain, real heat, ice. The body's no is a clear no. I do not pretend to override these days. The rule defers, the bus carries me through, and I am home in time."
    ),
    h2("The other kind of argument"),
    p(
      "The more interesting argument is the soft one. The grey sky that is not raining yet but might. The wind that is loud at the bus stop but, the moment you start walking, settles. The drizzle that turns out to be light enough to ignore. These arguments lose, more often than I would have guessed, when I just begin."
    ),
    p(
      "The trick is not to negotiate. If I stand at the bus stop weighing the weather — looking at my coat, checking the radar — I will almost always take the bus. The thinking part of me is excellent at finding reasons. The rule survives only when I am already walking before I think."
    ),
    p(
      "So I have a small protocol. Get off two stops early without consulting the weather. Begin walking before deciding. Allow myself, after three minutes, to bail — to walk back to the previous station and take the bus the rest of the way. I have the bail option in writing, in my head. I almost never use it."
    ),
    p(
      "The three minutes are the entire game. After three minutes my body has accepted the walk. The drizzle, if it is drizzle, has stopped being a debate and started being weather. I am in it. The walk happens."
    ),
    p(
      "There is a quieter version of this for evenings. I am tired, the day has gone long, the last thing I want is more steps. But again — get off two stops early without thinking. The first two minutes are slow and grumpy. By minute four the day's edge has loosened. By minute eight I am walking at a pace that has nothing to prove."
    ),
    p(
      "I do not always arrive home in a better mood. Sometimes the walk does nothing for me. But it almost never makes the day worse, and most evenings it makes me less raw than I would have been getting off the bus directly. That is enough. The rule does not promise transformation. It promises a thirteen-minute window between the day and the apartment, and on the worst days, that window is what I needed."
    ),
    p(
      "The weather will argue with you. The body will argue with you. Both have good points. Begin walking before either gets a chance to make them."
    )
  ),
  s14: doc(
    p(
      "We have a small balcony. It gets afternoon light from about two until five, depending on the season. For two summers I tried to grow basil, mint, and rosemary on it, and I failed all three of them in different ways. This year, after a quiet conversation with a friend who has been gardening longer than I have been alive, I am finally growing the right herbs in the right pots, and most of them are alive."
    ),
    p(
      "What I learned, painfully, is that balcony herbs is a category that does not exist. There are individual herbs that have individual needs. Most of them do not get along with each other, and almost none of them want to live in the pot the garden centre will sell you."
    ),
    h2("Sun, water, root"),
    p(
      "The friend put it like this: every herb is a question of three things. How much sun does it want? How much water does it want? How deep does it want its roots? If I could keep these three numbers in mind, I would stop killing things."
    ),
    p(
      "Basil wants a lot of sun. Like, a lot. Six hours minimum, and they should be the bright hours, not the early-morning ones. My balcony only ever delivered two or three good hours. So my basil was always pale, leggy, and sad. This year I gave the basil to a friend with a south-facing rooftop, and she has more basil than she can use."
    ),
    p(
      "Mint wants the opposite. It wants some sun, but it really wants water and a wide pot. My mistake was growing it in a small pot crammed next to the basil. The mint kept trying to escape sideways. This year mint has its own wide, shallow pot in the dappled corner of the balcony. It is enormous. I cut it twice a week and it does not notice."
    ),
    p(
      "Rosemary wants very little. It wants almost no water. It wants drainage, sun, and to be left alone. I used to water it every other day, like a houseplant. I was, in effect, drowning a small Mediterranean shrub. This year the rosemary lives in a clay pot with very fast soil, and I water it once every two weeks if it does not rain. It is finally happy."
    ),
    p(
      "The deeper lesson, which has nothing to do with balconies, is that the words we use for groups — herbs, houseplants, vegetables — are categories of convenience. They make the garden centre easy. They do not describe how anything actually wants to live."
    ),
    p(
      "I think about this with people too, sometimes. We talk about teenagers or introverts or editors as if the word told us how to treat them. The word almost never does. The thing about a person, like a basil plant, is that they have three or four real needs and the rest is store-shelf grouping. This year my balcony is mostly happy. So is the basil — on someone else's roof."
    )
  ),
  s15: doc(
    p(
      "The rain came hard on Monday night. By Tuesday morning, the small garden in front of our building was a different garden."
    ),
    p(
      "It was not damaged. Nothing was knocked over, nothing was uprooted. But everything had been rearranged. The mint, which had been crowding into the basil's corner, had laid down. The strawberry runners, which always look orderly when the watering is mine, were sprawled in three directions. The volunteer parsley I had been ignoring for a month had quietly grown two inches and was now visible from the window."
    ),
    h2("The work the rain does"),
    p(
      "I have started to understand the rain as the most thorough gardener I know. It is gentler than I am, more even, and far more persistent. It does not care which plant I have chosen to favour this season. It waters everything equally — the things I am cultivating and the things I have been pulling up. It pays attention to the soil in every corner, including the corners I have been pretending are not part of the garden."
    ),
    p(
      "After a long rain, the garden's politics are clearer. The plants that look best are the ones that wanted the conditions of the week. The ones that look pinched were never well-suited to begin with. I had been propping them up with extra attention, careful watering, fertiliser pellets, advice. The rain had ignored all of that and shown me the actual shape of the garden."
    ),
    p(
      "This is not a romantic observation. It is closer to a deflation. The garden I had thought I was building was somewhat my idea. The garden I have, after a long rain, is what the soil and the light and the seeds had been quietly negotiating."
    ),
    p(
      "I am learning to ask the rain's question, gently, when I plan. Will this plant want what comes naturally to this corner? If it will, I plant it and step back. If it will not, I either change the conditions — more drainage, less sun — or I admit, kindly, that this is not the corner for that plant."
    ),
    p(
      "This is also, I am realising, how I would like to make decisions about other things. Less willing the result, more asking what the conditions naturally produce. The rain is not interested in my willing. It just falls, and the garden tells me, the next morning, who was thriving and who was being held up."
    ),
    p(
      "The volunteer parsley, by the way, is now living its best life. I have given it the corner. It has rearranged itself in there with the casual confidence of something that knows it belongs."
    )
  ),
  s16: doc(
    p(
      "I have killed more plants by loving them than by ignoring them. This is not a metaphor. The plants in our apartment that have survived the longest are the plants I forget about for two weeks at a time. The ones I have lost have, almost universally, been the ones I doted on."
    ),
    p(
      "My pattern is simple and embarrassing. I bring a new plant home. I look at it admiringly for several days. I water it on Monday. I check the soil on Tuesday and it feels just slightly less wet. I water it again, just a little. By Friday the leaves are pale and drooping. I water it more, because clearly something is wrong. Two weeks later the plant is dead."
    ),
    h2("What overwatering actually does"),
    p(
      "The technical version of this is: roots in waterlogged soil cannot get enough oxygen. They begin to rot. The plant, paradoxically, looks dehydrated — pale, droopy, leaves yellowing — because the rotting roots can no longer take up water. The signal looks like this plant needs more water. Adding more water finishes the job."
    ),
    p(
      "I am writing this down because I keep needing to remind myself. The desire to help a plant is one of the strongest signals in our home, and it is almost always wrong. A healthy houseplant, in normal conditions, wants to be left alone for most of the week. The water it really needs comes in a thorough soak about every five to ten days, depending on the species, the season, and the heat in the room."
    ),
    p(
      "I have started to apologise out loud to the plants I have lost. This is dorky and I am aware. But the act of saying I am sorry, I drowned you, I will not do this to your replacement, has, weirdly, made me a more careful gardener. The apology is a small honesty I am offering the next plant. The next plant gets a real schedule, an honest finger-test in the soil, a willingness to wait through a Tuesday I would normally water on."
    ),
    p(
      "The pattern repeats outside of plants, of course. There are friendships I have over-watered. There are projects I have over-watered. The desire to help is not always the friend it pretends to be. Sometimes the kindest thing I can do for someone — or for a draft, or for a plant on the windowsill — is leave them alone for a week and trust the air."
    ),
    p(
      "The pothos by my desk is two years old this month. I water it about every nine days. It is enormous. I have not killed it yet. We seem to have an understanding."
    )
  ),
  s17: doc(
    p(
      "This is less a recipe and more a habit. I am writing it down because three readers have asked, and because the version in my head has now stabilised after about a year of dinners."
    ),
    p(
      "The habit is: when there is leftover rice in the fridge, and very little else, you can build a plausible dinner around it in fifteen minutes by toasting it."
    ),
    h2("The method"),
    p(
      "Take one or two cups of cold cooked rice. It does not need to be Japanese rice — leftover brown rice works, leftover jasmine works. Day-old rice is best because it has dried out a little; freshly cooked rice steams instead of toasting. Heat a wide pan dry, then add a generous spoon of oil — sesame, neutral, or olive, in that order of preference. When the oil shimmers, scatter the rice into the pan in a single layer. Press down gently with a spatula. Then leave it alone for four minutes."
    ),
    p(
      "This is the part that requires patience. The rice will not do anything visible for three of those four minutes. In the fourth minute, the bottom layer turns golden, releases from the pan, and starts to smell like roasted nuts. Loosen it with the spatula, flip whatever rough chunks you can flip, and toast another three or four minutes."
    ),
    p(
      "While it toasts, you have time to do exactly one of three things. One: crack two eggs into a bowl, beat them with a pinch of salt, and pour them over the rice in the last minute, stirring gently until set. Two: throw any tired vegetables — half a carrot, a handful of spinach, a shrivelled mushroom — into the rice, with a splash of water, and cover for two minutes. Three: add a spoon of soy sauce and a clove of crushed garlic, fry briefly, and call it done."
    ),
    p(
      "You may pick exactly one. Do not try to combine all three. The dinner gets cluttered."
    ),
    p(
      "Toppings are where this dish becomes itself. You almost certainly have most of these in the kitchen: a soft-boiled egg cut in half, a few rings of scallion, a pinch of sesame seeds, a small spoon of furikake, a drizzle of chili oil, a piece of dried seaweed torn over the top. Sliced avocado, if it is in the kitchen, is excellent. So is a leaf of pickled mustard greens."
    ),
    p(
      "The point of the dish is that it does not require a shopping trip. Toasted rice with one vegetable, one protein, and one topping is dinner. The toasting is what carries the meal. Everything else is decoration."
    ),
    p(
      "I keep meaning to come up with a more impressive recipe to write down here. I have not yet found one I would rather make on a Wednesday after work. The rice is in the fridge. The pan is dry. The four minutes of patience is the entire skill."
    )
  ),
  s18: doc(
    p(
      "I do not have one miso soup. I have the soup that the day gave me. This is, I think, how miso soup is supposed to work, but it took me a while to relax into it."
    ),
    p(
      "The version in my head used to be precise. A specific dashi, a specific miso, a specific tofu, a specific seaweed. I would not make miso soup unless I had all of these things. So I would not make miso soup, most weeks."
    ),
    h2("The shape, not the recipe"),
    p(
      "What changed was a friend's mother, in Kyoto, talking me through her week's miso soup. There was no recipe. There was a shape. The shape went: something to enrich the water, something tender, something firm, miso added at the end. Within that shape, anything in the kitchen worked."
    ),
    p(
      "The water enrichment is dashi if you have it, or a piece of kombu and a few katsuobushi flakes if you have those, or — quietly — a small handful of dried mushrooms soaked from the morning, or — even more quietly — nothing, in a pinch, with a little soy. The base is a flavour direction, not a strict recipe."
    ),
    p(
      "The tender thing is whatever is soft and quick — silken tofu in cubes, leftover boiled spinach, a handful of small clams if you happen to be near a fishmonger. The firm thing is whatever holds its shape — sliced daikon, a small carrot in matchsticks, a few cubes of squash, even a thin slice of wheel-of-cheese-style firm tofu. The firm thing goes in first; the tender thing goes in last."
    ),
    p(
      "The miso comes off the heat. This is the only step that I will not bend. Miso boiled is miso ruined. Take the pot off the burner. Whisk a heaped spoon of miso through a small ladle of broth in a separate bowl until smooth. Pour it back into the pot. Stir gently. Taste. Add more miso if needed."
    ),
    p(
      "What I have stopped being precious about: the miso itself. I keep two pastes in the fridge — a darker, redder one and a lighter, sweeter one — and use whichever has the lid open. They are different soups. Both of them are dinner."
    ),
    p(
      "The other thing I have stopped being precious about: ratios. The traditional ratio is a heaped spoon of miso to a cup of broth. My ratios drift. Some weeks I want a thinner soup, some weeks a saltier one. The pot tells me which day this is."
    ),
    p(
      "If you are stuck thinking I cannot make miso soup, I do not have the right ingredients, the shape is the way out. The day will give you most of the soup. The miso, off the heat, will give you the rest."
    )
  ),
  s19: doc(
    p(
      "I keep three small glass jars in the door of the fridge. They are all pickles, all easy, all made with whatever vegetable was about to go soft on the counter. None of them require canning or sterilisation or any kind of laboratory technique. They are quick pickles, sometimes called asazuke or refrigerator pickles, and they have rescued more dinners than I can count."
    ),
    h2("The base"),
    p(
      "The base is the same for all three jars. Half a cup of rice vinegar, half a cup of water, two teaspoons of sugar, a teaspoon of salt. Stir until the sugar and salt dissolve. That is the entire brine. You do not need to heat it. If you have it, you can replace half the water with mirin or sake, but it is not required."
    ),
    p(
      "Pack the vegetables into a clean jar. Pour the brine over them until they are covered. Press them down with a spoon if they float. Lid on, jar in the fridge. They are ready to eat in two hours and excellent the next day. They will keep, perfectly, for about a week."
    ),
    p(
      "That is the whole technique. What changes between the three jars is what is in them."
    ),
    h2("Jar one — cucumber and ginger"),
    p(
      "Sliced cucumber rounds, a thumb of ginger cut into matchsticks, a pinch of red pepper flakes. The cleanest of the three. I eat this with rice when the meal is too brown — toasted rice, tofu, miso. The pickle adds the green."
    ),
    h2("Jar two — daikon and a little citrus peel"),
    p(
      "Slim half-moons of daikon, two strips of yuzu peel, or, more often, lemon peel. Sweeter, less aggressive. Goes well with anything fatty — grilled fish, fried chicken, a pork chop. Keeps the meal honest."
    ),
    h2("Jar three — whatever is about to die"),
    p(
      "This is the workhorse. Carrots that are getting bendy. The bottom of a head of cabbage. Half a daikon, the inside of a sweet pepper, the stems of a bunch of bok choy I am cooking the leaves of. Cut everything into bite-sized pieces, brine, refrigerate. By the next day they are crisp again, mildly tangy, sliced cleanly into the meal."
    ),
    p(
      "The third jar is the one that has changed how I shop. I no longer feel the small panic I used to feel when a vegetable was on its second week. The pickle jar is the soft landing. The vegetables get a second life, the meal gets a third dimension, and the fridge — for once — does not produce that quiet, regretful smell of wilted greens. Three jars. One brine. Whatever is about to go soft becomes whatever is about to be eaten."
    )
  ),
  s21: doc(
    h2("Air first, decisions later"),
    p(
      "For years I thought spring cleaning meant shelves, bags, donation boxes, a dramatic before-and-after photograph. Then one April morning I opened every window in the apartment before I had made tea, and the room changed before I touched a single object. The air moved first. Dust lifted from the floorboards. The curtain breathed in and out like something sleeping lightly. I stood there with the kettle unfilled and felt the house begin without me."
    ),
    p(
      "This is the first practice in the house with seasons: open the windows before you improve anything. Not because fresh air solves the drawer, or the inbox, or the chair covered in sweaters, but because the body needs proof that change can arrive gently. A room that has been closed all winter does not need a performance. It needs circulation. It needs ten minutes of being reminded that outside exists."
    ),
    figure("s21", 1, "windows opened before the room is sorted"),
    p(
      "Figure 1 — The practice begins before the broom: light, air, and the ordinary mess allowed to breathe."
    ),
    pullQuote(
      "A room that has been closed all winter does not need a performance. It needs circulation."
    ),
    p(
      "I learned this from my grandmother, who never announced cleaning days. She opened windows. She tied the curtains back with whatever was near. She set two cups of tea on the sill, one for herself and one for whoever wandered through. Only after the air had moved did she sweep. Only after sweeping did she decide whether anything truly had to leave the house."
    ),
    h2("The softer audit"),
    p(
      "The order matters. If I start with deciding, I get severe. I decide the stack of magazines is evidence against me. I decide the sweater chair is a moral failure. I decide the pantry is a record of past selves I no longer respect. But if I start with air, I become less interested in judgment. The room is not a defendant. It is a habitat that has held me through a colder season."
    ),
    p(
      "After the windows, I make what I call the softer audit. I walk the room once with no bag in my hand. I do not pick anything up. I name what is working: the chair catches the morning sun; the shelf by the door holds keys reliably; the basket of scarves is chaotic but useful. Only after naming the room's loyalties do I notice what no longer belongs."
    ),
    p(
      "This changes the editing. The stack of magazines becomes three recipes to clip and the rest to recycle. The sweater chair becomes a hook by the door, not proof that I am lazy. The pantry becomes a set of ingredients asking to be cooked this week, not an archive of failed intentions. The house answers better questions when I ask better questions."
    ),
    h2("A bilingual note on enough"),
    p(
      "My grandmother called this yutori — not exactly spaciousness, not exactly ease, but the margin around a thing that lets it be itself. In English I say enough, which is blunter and useful. Enough space for the air to move. Enough patience to sweep after tea. Enough humility to know that a room can be improved without being transformed."
    ),
    figure("s21", 2, "the softer audit on a low table"),
    p(
      "Figure 2 — Tea, notebook, and three small decisions: keep, repair, release."
    ),
    p(
      "The bilingual voice of the house matters here because each language catches a different excess. In Japanese I can say komakai tokoro — the tiny places — and immediately see the dust in the track of the window, the receipt folded behind the bowl, the pen cap under the table. In English I can say overall and remember not to spend the whole morning with a cotton swab. Between the two, the cleaning becomes both precise and merciful. The window track gets wiped; the entire personality does not get renovated."
    ),
    p(
      "I also make a small after-list, which is different from the before-list that used to exhaust me. The after-list records what the room asked for once it could breathe: oil the chair, mend the curtain loop, cook the barley before it ages another month. These are not accusations. They are invitations with dates attached. By evening, the list is short enough to trust, and the room is open enough to keep teaching."
    ),

    p(
      "What surprises me, each spring, is how much of the work is permission. Permission to keep the old wooden bowl because it still makes oranges look generous. Permission to move the lamp three inches and call that design. Permission to let one shelf remain half empty without filling it with proof that I have taste. The open windows make these permissions audible. They remind me that a home is not a portfolio. It is a climate we make for ordinary days, and climates change through repeated small conditions, not heroic declarations."
    ),

    p(
      "Before closing the windows at night, I take one last walk through the room and touch the surfaces that changed: the sill, the drawer pull, the chair back, the clean corner where the magazines were. This is not ceremony so much as calibration. My hand remembers what enough feels like before the week begins filling the room again."
    ),

    p(
      "If the house with seasons has a thesis, it is this: begin with the condition, not the correction. Air before sorting. Light before judgment. Tea before the bag marked donate."
    ),

    p(
      "I keep the practice intentionally small because smallness is what lets it return. The windows can be opened on a busy morning. The softer audit can happen while the rice cooks. Even the decision to leave one shelf half empty can be made in passing, without converting the day into a project. This is the part I used to miss: a seasonal house is not maintained by rare heroic weekends, but by repeatable forms of attention that fit inside ordinary weather."
    ),

    p(
      "By noon the room is usually only modestly better. The windows have been open for hours. Two bags have left. One drawer closes. Nothing dramatic has happened, which is the point. Spring, in a house, is not a makeover. It is a change in circulation. It is the season teaching the room how to inhale again, and teaching me to begin there."
    )
  ),
  s22: doc(
    h2("A counter arranged for heat"),
    p(
      "By July the kitchen stops being a place where ambition is rewarded. The stove heats the room. The oven becomes a threat. Even boiling pasta feels like making the weather worse. This is when I rearrange the counter, not for beauty, but for survival: water where a hand reaches first, fruit visible before the snack drawer, a knife already on the small board, a towel that can become a potholder or a fan."
    ),
    p(
      "The summer counter is a small argument against the idea that good eating must be planned in full sentences. In heat, the meal often begins as a gesture: cut the tomato, salt the melon, rinse the herbs, pour water into the clay pitcher so it sweats coolly for an hour. The counter makes these gestures easy enough to do before I talk myself out of them."
    ),
    figure("s22", 1, "the summer counter before dinner"),
    p(
      "Figure 1 — Water, fruit, salt, and a clear board: the mise en place of not overheating."
    ),
    pullQuote(
      "In heat, a meal often begins as a gesture: cut the tomato, salt the melon, rinse the herbs."
    ),
    p(
      "I used to think seasonal eating meant farmers market abundance and glossy piles of produce. It can mean that. More often, in our apartment, it means knowing which foods can wait politely at room temperature and which need rescuing by six. Tomatoes stay on the counter. Stone fruit ripens in a shallow bowl. Cucumbers go straight to the refrigerator and return in coins, salted with sesame, when dinner needs something cold and clean."
    ),
    h2("The five quiet requirements"),
    p(
      "The counter becomes a map of needs: salt, water, acid, crunch, something soft. When all five are present, dinner can be almost embarrassingly simple and still feel cared for. Rice from yesterday, tofu from the fridge, a tomato cut with too much salt, a peach eaten over the sink. The meal does not perform effort. It restores it."
    ),
    p(
      "I keep a small bowl of salt beside the cutting board because in summer salt is a tool for attention. Salt a tomato and it becomes dinner-adjacent. Salt cucumber and ten minutes later it has made its own dressing. Salt watermelon lightly and the sweetness moves forward, like someone stepping into better light. None of this is cooking in the formal sense. It is more like listening."
    ),
    p(
      "Water matters just as much. The pitcher is clay, slightly porous, and it cools by evaporation if I fill it early enough. This is a tiny luxury, and also a practical one: everyone drinks more when water looks like it is waiting for them. I add shiso when we have it, mint when the mint has forgiven me, lemon peel when a lemon has already been cut for something else."
    ),
    h2("Dinner without a thesis"),
    p(
      "The best hot-weather dinners in our house do not have a thesis. They have parts: cold tofu with grated ginger, rice from yesterday, tomatoes, pickles, fruit, a handful of herbs, maybe an egg. If someone is hungry later, there is toast. I no longer apologize for this. Summer has its own appetite, and it often asks for less structure than I was trained to provide."
    ),
    figure("s22", 2, "a no-cook dinner assembled from the counter"),
    p(
      "Figure 2 — Tomato, tofu, herbs, and yesterday rice: enough dinner for a room that is already warm."
    ),
    p(
      "There is also the matter of hunger in heat, which arrives strangely. Nobody wants dinner at seven, then everyone wants something at nine. The summer counter accepts this. It keeps components ready without making the cook stand guard. A bowl of salted cucumbers can wait. Rice can wait under a cloth. Tofu can be opened when the first person admits they are hungry. The meal assembles around the household instead of summoning everyone to a fixed hour."
    ),
    p(
      "This is not anti-cooking. It is cooking in a different key. The labor moves earlier and smaller: washing greens before the room gets hot, making tea to chill while breakfast dishes dry, cutting fruit before it collapses into sweetness. By dinner the kitchen feels less like a stage and more like a shaded bench. You sit down, you take what is cool, and the day loosens its grip."
    ),

    p(
      "There are evenings when this arrangement feels almost too simple to call care. Then someone comes in from the heat, drinks two glasses of cool water without speaking, and eats a salted tomato with their fingers. That is when I remember the counter is doing hospitality at the speed of weather. It has anticipated thirst, low appetite, impatience, and the odd loneliness of a hot room. It cannot make July gentle, but it can make the first five minutes after coming home feel received."
    ),

    p(
      "The counter will become cluttered again by breakfast. A peach pit, a spoon, a glass left half full. I no longer mind. A working summer counter is not pristine. It is responsive. It shows that people came in hot, found water, made something cold, and kept moving gently through the day."
    ),

    p(
      "If the house with seasons has a summer rule, it is this: reduce the heat of the room and the heat of the decision at the same time. Let the meal be clear before it is impressive."
    ),

    p(
      "A summer counter also teaches restraint in shopping. I buy what can become a meal without becoming a task: tomatoes, cucumbers, tofu, eggs, rice, fruit, herbs if they look sturdy rather than decorative. The question is not what would make the most beautiful table, but what the household will actually reach for when the room is too warm and everyone is slightly wordless. Beauty still arrives, but sideways — in a sweating pitcher, a peach cut over a bowl, basil torn because scissors are too much."
    ),

    p(
      "By August the counter looks almost bare because the system has become obvious. The bowl gets refilled. The towel dries on the hook. The knife is washed and returned. The kitchen is not cooler, exactly, but it is kinder. It has stopped asking me to prove care through heat. It lets dinner be a sequence of cool, useful gestures, and that is how we keep eating well until the weather changes."
    )
  ),
  s23: doc(
    h2("The table that gathers"),
    p(
      "Winter makes the table smaller. Not physically — it is the same wooden table with the same pale ring from a hot teapot — but by dusk everyone sits closer. The lamp is lower. The bowls are deeper. Conversation arrives in shorter sentences because steam is rising between us and because the day has already taken enough explanation. This is the final room in the house with seasons: the table that gathers without insisting."
    ),
    p(
      "The winter table begins earlier than dinner. It begins when I put a pot on the stove at four, not because the soup needs three hours, but because the apartment needs the promise of dinner before dark. Leek, carrot, a little barley, the end of a cabbage, water, salt, time. The sound is not much. A wooden spoon against the pot. The smallest simmer. Someone coming through the room and lifting the lid just to look."
    ),
    figure("s23", 1, "soup beginning before dark"),
    p(
      "Figure 1 — A pot started at four o’clock so the room can believe in dinner before evening arrives."
    ),
    pullQuote("Warmth is not the same as spectacle. Warmth is repeatable."),
    p(
      "There is a kind of hosting that tries to defeat winter with abundance: too many plates, too much wine, a table crowded to prove we are not cold. I understand the impulse. I have done it. But the winter table that saves me is plainer. It has soup, bread, pickles, perhaps an orange cut into wedges. It leaves enough space for elbows, notebooks, a small bowl of repair buttons, the unsorted mail no one has the energy to move."
    ),
    h2("Plain food, deep bowls"),
    p(
      "Warmth is not the same as spectacle. Warmth is repeatable. Warmth is the person who knows where the ladle is. Warmth is a second bowl offered before anyone asks. Warmth is the permission to be quiet while eating, and then to talk again when the body has come back from wherever the cold sent it."
    ),
    p(
      "I keep a winter table list taped inside a cabinet door. It is not a menu; it is a reassurance. Soup with grain. Something sharp. Something green if there is green. Bread or rice. Citrus. Tea. The list is short enough to remember and forgiving enough to survive a day when the market was closed or everyone came home late."
    ),
    p(
      "The sharp thing is important. Pickled daikon, a spoon of kimchi, the cucumber jar from last week, a little mustard stirred into oil and vinegar. Winter food can become all softness and no edge. The pickle is not decoration. It wakes the mouth up. It reminds the soup that it is not alone."
    ),
    h2("Repair as a course"),
    p(
      "After dinner, if nobody leaves the table immediately, I bring out the repair bowl. Buttons, thread, a sweater with one loose cuff, the cloth napkin whose hem has begun to fail. This sounds quaint until you try it. Repair after soup is less a chore than a continuation of eating: hands warmed, shoulders lower, everyone willing to mend one small thing because the room has already made stillness available."
    ),
    figure("s23", 2, "the repair bowl after dinner"),
    p(
      "Figure 2 — Buttons, thread, and a quiet table: the domestic second course winter understands."
    ),
    p(
      "I have learned to leave one seat at the winter table unofficially open. Not for a guest, exactly, though guests are welcome. The open seat is for whatever the day brought in: a wet umbrella, a difficult email, a child’s drawing, the newspaper folded to a bad headline, the silence someone needs before they can speak. In summer we scatter these things across rooms. In winter they come to the table and sit with us until soup makes them smaller."
    ),
    p(
      "The table also changes how I measure enough. In brighter months I confuse enough with variety: three salads, two sauces, a dessert no one needs. In winter enough is weight and return. The pot can be ladled again. The bread can be torn. The kettle can be filled without asking who wants tea because everyone does, eventually. Repetition is not dull here. It is what lets the body believe the house will hold."
    ),

    p(
      "The series ends here because winter reveals the house most clearly. Spring teaches air; summer teaches restraint; winter teaches return. Every object has to earn its place when the windows are closed and the coats are heavy. The chipped bowl stays because hands reach for it. The extra platter goes because it never leaves the shelf. The table keeps the evidence. Night after night it shows us which practices actually warm the room and which ones only looked beautiful in better light."
    ),

    p(
      "When the dishes are finally stacked, the table still holds warmth for a few minutes. I leave the lamp on while the room empties. The glow over crumbs and thread is evidence that the gathering happened, small and sufficient, and that tomorrow the same plain invitation can be made again."
    ),

    p(
      "If the house with seasons has a winter rule, it is this: make one place where returning is easier than leaving. The table does not need to be grand; it needs to be ready."
    ),

    p(
      "Readiness is mostly unglamorous. The matches are where they should be. The tea tin is not empty. There is broth in the freezer, or at least a jar of beans that can become something honest with garlic and time. I have come to love this inventory of almost-nothing because it lowers the threshold for gathering. A table cannot be generous if every meal begins with panic. It becomes generous when the ordinary supplies of warmth are easy to find."
    ),

    p(
      "I think this is why I forgive winter more at the table than anywhere else. The season narrows the day, then hands back closeness as compensation. We accept it one bowl at a time."
    ),

    p(
      "The winter table does not make the season easy. It does not remove darkness or deadlines or the way cold finds the gap under the door. It does something smaller and more reliable. It gathers the household around a pot, a lamp, a few repaired things, and says: here is enough heat for tonight. Come closer. Take another bowl."
    )
  ),
  s24: doc(
    h2("A balcony system, not a miracle"),
    p(
      "The balcony compost began as an apology. I was tired of throwing away the clean ends of things: carrot peels, tea leaves, the outer leaves of cabbage, stems from herbs that had done their work. They were not dinner anymore, but they did not feel like trash. In a house with no garden and no municipal compost bin nearby, the apology had nowhere to go. So I bought a small lidded tub, drilled more holes than the instructions suggested, and placed it beside the mint."
    ),
    p(
      "Apartment compost is not romantic at first. It is a lesson in scale and humility. You cannot put everything in. You cannot forget it for a month. You cannot expect soil by next Tuesday. The balcony will tell the truth quickly if you become grand. Too many citrus peels and it smells sharp. Too much wet rice and it turns sour. No dry leaves and the whole thing becomes a sulking, airless paste."
    ),
    figure("s24", 1, "a small balcony compost station"),
    p(
      "Figure 1 — A drilled tub, dry leaves, and a bowl for scraps: compost sized for an apartment balcony."
    ),
    pullQuote(
      "Good compost smells like forest floor after rain, even when it is only a shoebox of scraps on the fourth floor."
    ),
    p(
      "The good news is that a small system teaches quickly because there is nowhere for mistakes to hide. I learned the ratio by hand: two handfuls of dry brown material for every handful of kitchen scraps. Torn paper bags, dried leaves from the street tree, the brittle stems of herbs, a little used potting soil. I keep them in a crate under the bench. The crate is less pretty than a ceramic planter and more important."
    ),
    h2("The smell is information"),
    p(
      "Every few days I open the tub and listen with my nose. Good compost smells like forest floor after rain, even when it is only a shoebox of scraps on the fourth floor. Bad compost smells like something asking for help. Usually the help is dry leaves and air. I add both, turn the pile with a small trowel, and leave it alone."
    ),
    p(
      "The first month I kept a notebook because I did not trust myself to learn by smell alone. Tuesday: tea leaves, apple peel, dry paper. Friday: too wet, added leaves. Sunday: turned, better. The notes were boring and therefore useful. They made the compost less mysterious. They also made my kitchen less theatrical about waste. A carrot peel was no longer evidence of failure. It was Tuesday's nitrogen."
    ),
    p(
      "There are rules I now keep without drama. No meat, no fish, no dairy. Citrus in small amounts. Rice only if it is mixed well with dry material. Chop large scraps because a balcony bin is not a forest and does not have forest patience. Cover each addition with browns. Turn when the smell asks. Stop adding for a week if the tub seems overwhelmed."
    ),
    h2("What the finished handful does"),
    p(
      "The first finished compost was not much: two dark handfuls sifted from the bottom after three months, more symbolic than agricultural. I mixed it into the mint pot anyway. The mint did not applaud. It simply kept growing. That was enough. The point was not to feed the whole balcony from scraps. The point was to keep a small loop visible: peel, leaf, air, time, soil, mint, tea."
    ),
    figure("s24", 2, "finished compost folded into mint"),
    p(
      "Figure 2 — The loop becomes visible only by the handful: dark compost, mint roots, patient soil."
    ),
    p(
      "I began to notice how compost changed my shopping before it changed my soil. I bought fewer herbs in plastic boxes because watching half a box become nitrogen is still watching half a box become a failure of attention. I bought carrots with tops only when I knew what the tops would do. I saved onion skins for broth instead of the bin. The compost did not make me virtuous. It made the consequences legible at a scale small enough to correct."
    ),
    p(
      "Neighbors have opinions about balcony compost, and they are right to. Smell travels. Flies are not a private matter. I keep the tub shaded, sealed, and balanced because the practice has to be courteous to become sustainable. Mindful living is sometimes presented as an interior mood, but the balcony corrects that. My scraps meet someone else's laundry line. My patience, or lack of it, enters the shared air. A good bin is a neighborly object."
    ),

    p(
      "When friends ask whether they should start, I tell them to begin with a month of observation before buying anything fancy. Put a bowl near the sink and notice what would go in it. Notice how wet your scraps are, how often you cook, whether you have leaves or shredded paper, whether your balcony gets punishing sun. Compost is often described as transformation, but before transformation comes attention. The bin should match the life you already have, not the virtuous life you imagine on a Sunday afternoon."
    ),

    p(
      "The balcony now has a rhythm I trust: scraps on Wednesday, leaves on Friday, turning on Sunday if the air is dry. It is not self-sufficient and not effortless. It is simply alive enough to require relationship, which may be the most honest thing a small domestic system can ask."
    ),

    p(
      "If balcony compost has a rule, it is this: keep the loop small enough that you can stay honest with it. The small loop, repeated, is the practice."
    ),

    p(
      "A small balcony cannot fix a city's waste problem. I do not need it to. The tub is not a solution; it is a practice. It changes the pace at which I throw things away. It asks me to notice moisture, carbon, smell, and time. It makes usefulness feel less like a purchase and more like a return. On mornings when I open the lid and smell rain-dark soil, I believe in small loops again."
    )
  ),
  s20: doc(
    p(
      "There is a specific kind of bad day that does not respond to dinner. You have been on calls since nine. You have been on your feet since lunch. You came home and stared at the fridge for a long time without choosing anything. The thought of cooking — really cooking — is impossible. The thought of takeout is, somehow, worse."
    ),
    p(
      "This is the day for okayu. Or jook, or congee, or any of the close cousins it has across Asia. Rice cooked very long, very slow, with much more water than you would normally use, until it dissolves into something between soup and porridge."
    ),
    h2("The proportions"),
    p(
      "For one bowl, take a small handful of rice — about half a cup of dry rice — rinse it, and put it in a small pot with about five cups of water. Yes, ten times the water. That is the point. A pinch of salt. Bring to a boil, then turn down to a slow simmer. Stir occasionally, mostly to keep the rice from sticking to the bottom of the pot."
    ),
    p(
      "Then walk away. The porridge takes about forty-five minutes to an hour. You do not need to watch it. Set a timer for thirty minutes, return, stir, set another timer. The rice will gradually disappear into the water, becoming a soft, white, almost milky base that smells very faintly of itself."
    ),
    p("That is the entire dish. What you put on top is the rest."),
    h2("What goes on top"),
    p(
      "A soft-boiled egg, broken in. A spoon of soy sauce. A pinch of white pepper. A few rings of scallion. A drizzle of sesame oil. If you have leftover roast chicken, shredded over the top. If you have a piece of pickled mustard greens from the third jar in the fridge, finely chopped. If there is a tiny piece of ginger left, grated."
    ),
    p(
      "Pick three toppings. No more. The point of the dish is its softness; too many toppings turn it into a salad."
    ),
    p(
      "I eat this porridge most often after a hard day. But I have started to keep the makings — rice, soy, scallions, an egg, some kind of greens — on a small shelf I am calling the bad-day shelf. The shelf is a quiet promise to the version of me who comes home tired. It says: dinner is forty-five minutes of patience and a stir every ten minutes. The rest of the time, you can lie on the couch."
    ),
    p(
      "Most evenings I do not need the bad-day shelf. But the nights I do, the porridge is what saves me. Slow rice. Plenty of water. A few small toppings. A little kindness from the day before, finally cashed in."
    )
  ),
};
