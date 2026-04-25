/* Playful, "singing" benefit lines spoken in each food's voice.
   Used by VegetableAvatar to render the tap-to-reveal speech bubble. */

export type FoodBenefit = {
  benefit: string;
  note: string;
};

const BENEFITS: Array<{ match: RegExp; benefit: string; note: string }> = [
  { match: /carrot/i, benefit: "I'm Vitamin-A Carrot! I help your eyes see in the dark!", note: "🎵" },
  { match: /broccoli/i, benefit: "I'm Mighty Broccoli! I make your bones strong as trees!", note: "🌱" },
  { match: /spinach/i, benefit: "I'm Iron Spinach! I give you super-strong muscles!", note: "💪" },
  { match: /pumpkin/i, benefit: "I'm Iron-Man Pumpkin! I make you strong!", note: "🎵" },
  { match: /lettuce/i, benefit: "I'm Crunchy Lettuce! I sprinkle green energy!", note: "🌿" },
  { match: /apple/i, benefit: "I'm Crunchy Apple! I keep doctors away!", note: "🎶" },
  { match: /banana/i, benefit: "I'm Banana Boost! I give you happy energy!", note: "🎵" },
  { match: /strawberry|raspberry|blueberry|berry/i, benefit: "I'm Sweet Berry! I sparkle with vitamin C!", note: "✨" },
  { match: /chicken|turkey/i, benefit: "I'm Power Chicken! I build superhero muscles!", note: "🎵" },
  { match: /egg/i, benefit: "I'm Smart Egg! I help your brain grow big ideas!", note: "💡" },
  { match: /sweet potato/i, benefit: "I'm Sweet Potato Sunshine! I keep your tummy happy!", note: "☀️" },
  { match: /potato/i, benefit: "I'm Spuddy Potato! I'm cozy and strong!", note: "🥔" },
  { match: /rice/i, benefit: "I'm Rice Rocket! I fuel your adventures!", note: "🚀" },
  { match: /couscous|quinoa|bulgur/i, benefit: "I'm Couscous Cloud! I keep you bouncing!", note: "☁️" },
  { match: /pasta|spaghetti|noodle|penne/i, benefit: "I'm Pasta Power! I give you running fuel!", note: "🎵" },
  { match: /cheese/i, benefit: "I'm Cheesy Cheese! I make your bones happy!", note: "🎶" },
  { match: /tomato/i, benefit: "I'm Bouncy Tomato! I sparkle from the inside!", note: "🎵" },
  { match: /cucumber/i, benefit: "I'm Cool Cucumber! I'm crunchy refreshment!", note: "💧" },
  { match: /bean|lentil|chickpea/i, benefit: "I'm Mighty Bean! I'm tiny but tough!", note: "🎵" },
  { match: /salmon|tuna|fish/i, benefit: "I'm Splashy Fish! I make your brain swim fast!", note: "🐟" },
  { match: /yogurt/i, benefit: "I'm Yummy Yogurt! I tickle your tummy with friends!", note: "🎶" },
  { match: /bread|toast|roll|bagel/i, benefit: "I'm Toasty Bread! I'm warm hugs in your tummy!", note: "🎵" },
  { match: /corn/i, benefit: "I'm Sunny Corn! I pop with happy energy!", note: "🌽" },
  { match: /pea\b|peas/i, benefit: "I'm Pep Pea! I'm tiny rolling vitamins!", note: "🎵" },
  { match: /grape/i, benefit: "I'm Glee Grape! I burst with sweet sparkle!", note: "✨" },
  { match: /orange|clementine|mandarin/i, benefit: "I'm Sunny Orange! I shine vitamin C on you!", note: "☀️" },
  { match: /avocado/i, benefit: "I'm Smooth Avocado! I make your skin glow!", note: "🥑" },
  { match: /milk/i, benefit: "I'm Cozy Milk! I help you grow up tall!", note: "🎵" },
  { match: /melon|watermelon/i, benefit: "I'm Splashy Melon! I'm a juicy hug!", note: "🍉" },
  { match: /onion/i, benefit: "I'm Zippy Onion! I add sparkle to every bite!", note: "🎵" },
  { match: /pepper|capsicum/i, benefit: "I'm Crunchy Pepper! I'm a rainbow of vitamins!", note: "🌈" },
  { match: /mushroom/i, benefit: "I'm Earthy Mushroom! I'm tiny but mighty!", note: "🍄" },
  { match: /pear/i, benefit: "I'm Pearfect Pear! I'm sweet and juicy!", note: "🎵" },
  { match: /peach/i, benefit: "I'm Fuzzy Peach! I'm summer in a bite!", note: "🍑" },
];

const FALLBACK: FoodBenefit = {
  benefit: "I'm yummy and growing-strong! Take a bite and feel the magic!",
  note: "🎵",
};

export function benefitFor(name: string): FoodBenefit {
  for (const entry of BENEFITS) {
    if (entry.match.test(name)) {
      return { benefit: entry.benefit, note: entry.note };
    }
  }
  return FALLBACK;
}
