// Grams per US cup for common ingredients.
//
// These are the values the baking world has largely standardised on (King
// Arthur Baking, Serious Eats and the USDA agree within a few grams on most
// of them). They are genuinely approximate: how tightly flour is packed can
// swing a cup by 20%, which is exactly why serious recipes give weights.

export const INGREDIENTS = [
  { id: 'all-purpose-flour', name: 'all-purpose flour', alt: 'plain flour', g: 125, cat: 'Flour',
    note: 'The single most variable ingredient in any recipe. Scooping straight from the bag compacts the flour and can yield 150 g or more; spooning it into the cup and levelling gives about 125 g. A 20% error in flour is the difference between a tender crumb and a brick — this is the ingredient most worth weighing.' },
  { id: 'bread-flour', name: 'bread flour', alt: 'strong flour', g: 127, cat: 'Flour',
    note: 'Slightly denser than all-purpose because of its higher protein content. The extra gluten is what gives bread its chew.' },
  { id: 'cake-flour', name: 'cake flour', g: 114, cat: 'Flour',
    note: 'Finer and lower in protein, so it settles less. If you substitute all-purpose, remove two tablespoons per cup and replace with cornstarch.' },
  { id: 'whole-wheat-flour', name: 'whole wheat flour', alt: 'wholemeal flour', g: 120, cat: 'Flour',
    note: 'Contains the bran and germ, so it absorbs more liquid than white flour. Recipes usually need a little extra water when substituting.' },
  { id: 'almond-flour', name: 'almond flour', g: 96, cat: 'Flour',
    note: 'Much lighter per cup than wheat flour, and it has no gluten — it cannot be substituted one-for-one in bread.' },
  { id: 'cornstarch', name: 'cornstarch', alt: 'cornflour', g: 120, cat: 'Flour',
    note: 'Note the naming trap: "cornflour" means cornstarch in the UK and finely ground cornmeal in the US.' },
  { id: 'granulated-sugar', name: 'granulated sugar', alt: 'white sugar', g: 200, cat: 'Sugar',
    note: 'Consistent and easy to measure — the crystals do not compact much, so a cup is reliably close to 200 g.' },
  { id: 'brown-sugar', name: 'brown sugar', g: 213, cat: 'Sugar',
    note: 'Assumes firmly packed, which is what recipes mean unless they say otherwise. Loosely spooned it is closer to 145 g, so this is the second most common source of measurement error after flour.' },
  { id: 'powdered-sugar', name: 'powdered sugar', alt: 'icing or confectioners sugar', g: 120, cat: 'Sugar',
    note: 'Very light and prone to lumps. Sift before measuring if the recipe depends on a smooth result.' },
  { id: 'honey', name: 'honey', g: 340, cat: 'Liquid',
    note: 'Much heavier than water per unit volume. Oil the measuring cup first and it will slide out cleanly.' },
  { id: 'maple-syrup', name: 'maple syrup', g: 322, cat: 'Liquid',
    note: 'Slightly lighter than honey but handled the same way.' },
  { id: 'butter', name: 'butter', g: 227, cat: 'Dairy',
    note: 'One US cup is two sticks, or 8 ounces. US butter wrappers are marked in tablespoons, which makes weighing unnecessary if you have a full stick.' },
  { id: 'milk', name: 'milk', g: 240, cat: 'Dairy',
    note: 'Close enough to water that the difference rarely matters — milk is about 3% denser.' },
  { id: 'water', name: 'water', g: 237, cat: 'Liquid',
    note: 'One US cup is 236.6 ml, and water is almost exactly 1 g per ml, so cups and grams are interchangeable here.' },
  { id: 'heavy-cream', name: 'heavy cream', alt: 'double cream', g: 238, cat: 'Dairy',
    note: 'Denser than milk in the cup despite being higher in fat, because it holds less air than whipped cream.' },
  { id: 'yogurt', name: 'yogurt', g: 245, cat: 'Dairy',
    note: 'Greek yogurt is thicker and runs slightly heavier, around 255 g per cup.' },
  { id: 'sour-cream', name: 'sour cream', g: 230, cat: 'Dairy',
    note: 'Scoop and level rather than pour — it holds air pockets that throw the measurement off.' },
  { id: 'cream-cheese', name: 'cream cheese', g: 232, cat: 'Dairy',
    note: 'A standard US block is 8 ounces, or 226 g, which is close enough to one cup for most recipes.' },
  { id: 'shredded-cheese', name: 'shredded cheese', g: 113, cat: 'Dairy',
    note: 'Extremely variable — coarse shreds trap far more air than fine ones. This is a case where weight really is better.' },
  { id: 'grated-parmesan', name: 'grated parmesan', g: 100, cat: 'Dairy',
    note: 'Finely grated packs tighter than coarsely grated; the difference can be 30% in a cup.' },
  { id: 'vegetable-oil', name: 'vegetable oil', g: 218, cat: 'Liquid',
    note: 'Lighter than water — oil floats for exactly this reason.' },
  { id: 'olive-oil', name: 'olive oil', g: 216, cat: 'Liquid',
    note: 'Essentially the same density as other cooking oils; the difference is flavour, not weight.' },
  { id: 'white-rice', name: 'uncooked white rice', g: 185, cat: 'Grain',
    note: 'Uncooked. Rice roughly triples in weight when cooked, so a cup of dry rice yields about three cups cooked.' },
  { id: 'rolled-oats', name: 'rolled oats', g: 90, cat: 'Grain',
    note: 'Very light and airy. Steel-cut oats are much denser at around 180 g per cup — the two are not interchangeable by volume.' },
  { id: 'breadcrumbs', name: 'breadcrumbs', g: 108, cat: 'Grain',
    note: 'Dry breadcrumbs. Fresh ones are lighter and much more variable.' },
  { id: 'cocoa-powder', name: 'cocoa powder', g: 85, cat: 'Baking',
    note: 'Light, lumpy and compresses easily. Sift it, and weigh it if the recipe is a delicate one.' },
  { id: 'chocolate-chips', name: 'chocolate chips', g: 170, cat: 'Baking',
    note: 'A standard US bag is 12 ounces, or about two cups.' },
  { id: 'peanut-butter', name: 'peanut butter', g: 258, cat: 'Baking',
    note: 'Dense and sticky. Line the cup with plastic wrap or oil it first.' },
  { id: 'table-salt', name: 'table salt', g: 273, cat: 'Baking',
    note: 'Crucially, kosher salt is far lighter — Diamond Crystal is about 145 g per cup. Substituting by volume between salts is a common way to ruin a dish.' },
  { id: 'chopped-nuts', name: 'chopped nuts', g: 120, cat: 'Baking',
    note: 'Depends heavily on how coarse the chop is. Whole nuts run heavier per cup than chopped.' },
];

// Volume units, expressed in US cups.
export const VOL = [
  { id: 'cups', name: 'cup', plural: 'cups', c: 1 },
  { id: 'tablespoons', name: 'tablespoon', plural: 'tablespoons', c: 1 / 16 },
  { id: 'teaspoons', name: 'teaspoon', plural: 'teaspoons', c: 1 / 48 },
  { id: 'milliliters', name: 'milliliter', plural: 'milliliters', c: 1 / 236.588 },
];

// Weight units, in grams.
export const WT = [
  { id: 'grams', name: 'gram', plural: 'grams', g: 1, sym: 'g' },
  { id: 'ounces', name: 'ounce', plural: 'ounces', g: 28.3495, sym: 'oz' },
  { id: 'pounds', name: 'pound', plural: 'pounds', g: 453.592, sym: 'lb' },
];

// Amounts people actually type into a search box.
export const AMOUNTS = [
  { v: 0.25, label: '1/4' }, { v: 1 / 3, label: '1/3' }, { v: 0.5, label: '1/2' },
  { v: 2 / 3, label: '2/3' }, { v: 0.75, label: '3/4' }, { v: 1, label: '1' },
  { v: 1.5, label: '1 1/2' }, { v: 2, label: '2' }, { v: 2.5, label: '2 1/2' },
  { v: 3, label: '3' }, { v: 4, label: '4' },
];
