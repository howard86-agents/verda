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

export interface StoryBodyDoc {
  content: (TiptapParagraph | TiptapHeading)[];
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

function doc(...nodes: (TiptapParagraph | TiptapHeading)[]): StoryBodyDoc {
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
