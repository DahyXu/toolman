// Unit conversion data. `f` = factor to the category base unit.
// `d` = one-sentence definition used on generated pages.

export const CATS = {
  length: {
    name: 'Length', base: 'meter',
    units: [
      { id: 'meters', name: 'meter', sym: 'm', f: 1, d: 'The metre is the SI base unit of length, defined since 1983 as the distance light travels in a vacuum in 1/299,792,458 of a second.' },
      { id: 'kilometers', name: 'kilometer', sym: 'km', f: 1000, d: 'A kilometre is 1,000 metres and is the standard unit for road distances in most of the world.' },
      { id: 'centimeters', name: 'centimeter', sym: 'cm', f: 0.01, d: 'A centimetre is one hundredth of a metre, the everyday metric unit for body measurements and small objects.' },
      { id: 'millimeters', name: 'millimeter', sym: 'mm', f: 0.001, d: 'A millimetre is one thousandth of a metre and is the default unit on engineering drawings and rulers.' },
      { id: 'micrometers', name: 'micrometer', sym: 'µm', f: 1e-6, d: 'A micrometre, or micron, is one millionth of a metre — the scale of bacteria, fine dust and semiconductor features.' },
      { id: 'nanometers', name: 'nanometer', sym: 'nm', f: 1e-9, d: 'A nanometre is one billionth of a metre, used for wavelengths of light and chip manufacturing nodes.' },
      { id: 'miles', name: 'mile', sym: 'mi', f: 1609.344, d: 'The international mile is exactly 1,609.344 metres, or 5,280 feet, and is the road-distance unit of the United States and United Kingdom.' },
      { id: 'yards', name: 'yard', sym: 'yd', f: 0.9144, d: 'A yard is exactly 0.9144 metres, or 3 feet, and is best known as the unit of American football fields and fabric.' },
      { id: 'feet', name: 'foot', sym: 'ft', f: 0.3048, plural: 'feet', d: 'A foot is exactly 0.3048 metres, or 12 inches, and remains the standard unit for human height and aviation altitude.' },
      { id: 'inches', name: 'inch', plural: 'inches', sym: 'in', f: 0.0254, d: 'An inch is exactly 25.4 millimetres and is used for screen sizes, pipe diameters and paper dimensions.' },
      { id: 'nautical-miles', name: 'nautical mile', sym: 'nmi', f: 1852, d: 'A nautical mile is exactly 1,852 metres — one minute of latitude — and is the distance unit of sea and air navigation.' },
      { id: 'light-years', name: 'light year', sym: 'ly', f: 9.4607304725808e15, d: 'A light year is the distance light travels in one Julian year, about 9.46 trillion kilometres.' },
    ],
  },
  weight: {
    name: 'Weight', base: 'kilogram',
    units: [
      { id: 'kilograms', name: 'kilogram', sym: 'kg', f: 1, d: 'The kilogram is the SI base unit of mass, defined since 2019 in terms of the Planck constant.' },
      { id: 'grams', name: 'gram', sym: 'g', f: 0.001, d: 'A gram is one thousandth of a kilogram and is the everyday unit for food and small quantities.' },
      { id: 'milligrams', name: 'milligram', sym: 'mg', f: 1e-6, d: 'A milligram is one thousandth of a gram, the standard unit for medication doses and nutrient content.' },
      { id: 'metric-tons', name: 'metric ton', sym: 't', f: 1000, d: 'A metric ton, or tonne, is 1,000 kilograms and is used for freight, vehicles and industrial quantities.' },
      { id: 'pounds', name: 'pound', sym: 'lb', f: 0.45359237, d: 'The international avoirdupois pound is exactly 0.45359237 kilograms and is the primary weight unit in the United States.' },
      { id: 'ounces', name: 'ounce', sym: 'oz', f: 0.028349523125, d: 'An ounce is one sixteenth of a pound, about 28.35 grams, used for food portions and postal weights.' },
      { id: 'stones', name: 'stone', sym: 'st', f: 6.35029318, d: 'A stone is 14 pounds, about 6.35 kilograms, and is still how body weight is quoted in the United Kingdom and Ireland.' },
      { id: 'us-tons', name: 'US ton', sym: 'ton', f: 907.18474, d: 'A US short ton is 2,000 pounds, about 907 kilograms — noticeably lighter than a metric tonne.' },
      { id: 'carats', name: 'carat', sym: 'ct', f: 0.0002, d: 'A metric carat is exactly 200 milligrams and is the mass unit for gemstones and pearls.' },
    ],
  },
  data: {
    name: 'Digital Storage', base: 'byte',
    units: [
      { id: 'bytes', name: 'byte', sym: 'B', f: 1, d: 'A byte is eight bits, historically the space needed to store a single character of text.' },
      { id: 'kilobytes', name: 'kilobyte', sym: 'KB', f: 1e3, d: 'A kilobyte is 1,000 bytes under the SI definition used by storage manufacturers and network speeds.' },
      { id: 'megabytes', name: 'megabyte', sym: 'MB', f: 1e6, d: 'A megabyte is one million bytes — roughly a high-quality photograph or a minute of compressed audio.' },
      { id: 'gigabytes', name: 'gigabyte', sym: 'GB', f: 1e9, d: 'A gigabyte is one billion bytes, the unit in which phone storage and mobile data plans are sold.' },
      { id: 'terabytes', name: 'terabyte', sym: 'TB', f: 1e12, d: 'A terabyte is one trillion bytes, the typical capacity of a modern hard drive.' },
      { id: 'petabytes', name: 'petabyte', sym: 'PB', f: 1e15, d: 'A petabyte is a thousand terabytes, a scale reached only by data centres and large archives.' },
      { id: 'kibibytes', name: 'kibibyte', sym: 'KiB', f: 1024, d: 'A kibibyte is exactly 1,024 bytes — the binary unit operating systems actually use when they display "KB".' },
      { id: 'mebibytes', name: 'mebibyte', sym: 'MiB', f: 1048576, d: 'A mebibyte is 1,024 kibibytes, or 1,048,576 bytes, and is the binary counterpart of the megabyte.' },
      { id: 'gibibytes', name: 'gibibyte', sym: 'GiB', f: 1073741824, d: 'A gibibyte is 1,024 mebibytes — the reason a "1 TB" drive shows as roughly 931 GB in your file manager.' },
      { id: 'bits', name: 'bit', sym: 'b', f: 0.125, d: 'A bit is a single binary digit, the smallest unit of information; network speeds are quoted in bits per second.' },
      { id: 'megabits', name: 'megabit', sym: 'Mb', f: 125000, d: 'A megabit is one million bits. A 100 Mbps connection transfers at most about 12.5 megabytes per second.' },
      { id: 'gigabits', name: 'gigabit', sym: 'Gb', f: 125000000, d: 'A gigabit is one billion bits, the unit used for fibre broadband and datacentre networking.' },
    ],
  },
  area: {
    name: 'Area', base: 'square meter',
    units: [
      { id: 'square-meters', name: 'square meter', sym: 'm²', f: 1, d: 'A square metre is the SI unit of area — the area of a square one metre on each side.' },
      { id: 'square-kilometers', name: 'square kilometer', sym: 'km²', f: 1e6, d: 'A square kilometre is one million square metres and is used for the area of cities and regions.' },
      { id: 'square-centimeters', name: 'square centimeter', sym: 'cm²', f: 1e-4, d: 'A square centimetre is one ten-thousandth of a square metre, used for small surfaces and cross-sections.' },
      { id: 'square-miles', name: 'square mile', sym: 'mi²', f: 2589988.110336, d: 'A square mile is about 2.59 square kilometres and is used for US counties, states and land surveys.' },
      { id: 'square-yards', name: 'square yard', sym: 'yd²', f: 0.83612736, d: 'A square yard is nine square feet, commonly used for carpet and fabric in the United States.' },
      { id: 'square-feet', name: 'square foot', sym: 'ft²', f: 0.09290304, plural: 'square feet', d: 'A square foot is about 0.0929 square metres and is the standard unit for US real-estate floor area.' },
      { id: 'square-inches', name: 'square inch', plural: 'square inches', sym: 'in²', f: 0.00064516, d: 'A square inch is exactly 6.4516 square centimetres, used for small components and print areas.' },
      { id: 'acres', name: 'acre', sym: 'ac', f: 4046.8564224, d: 'An acre is 43,560 square feet, about 4,047 square metres — roughly a US football field without the end zones.' },
      { id: 'hectares', name: 'hectare', sym: 'ha', f: 10000, d: 'A hectare is 10,000 square metres, the metric unit for agricultural land, equal to about 2.47 acres.' },
    ],
  },
  volume: {
    name: 'Volume', base: 'liter',
    units: [
      { id: 'liters', name: 'liter', sym: 'L', f: 1, d: 'A litre is one cubic decimetre, the metric unit for beverages, fuel and everyday liquid volume.' },
      { id: 'milliliters', name: 'milliliter', sym: 'mL', f: 0.001, d: 'A millilitre is one thousandth of a litre and equals exactly one cubic centimetre.' },
      { id: 'cubic-meters', name: 'cubic meter', sym: 'm³', f: 1000, d: 'A cubic metre holds 1,000 litres and is the SI unit for shipping volume, concrete and gas metering.' },
      { id: 'cubic-centimeters', name: 'cubic centimeter', sym: 'cm³', f: 0.001, d: 'A cubic centimetre, also written cc, equals one millilitre and is used for engine displacement.' },
      { id: 'gallons', name: 'US gallon', sym: 'gal', f: 3.785411784, d: 'A US liquid gallon is exactly 3.785411784 litres, or 128 fluid ounces.' },
      { id: 'imperial-gallons', name: 'imperial gallon', sym: 'imp gal', f: 4.54609, d: 'An imperial gallon is exactly 4.54609 litres — about 20% larger than a US gallon.' },
      { id: 'quarts', name: 'US quart', sym: 'qt', f: 0.946352946, d: 'A US quart is a quarter of a gallon, about 946 millilitres.' },
      { id: 'pints', name: 'US pint', sym: 'pt', f: 0.473176473, d: 'A US liquid pint is 16 fluid ounces, about 473 millilitres; the imperial pint is 568 millilitres.' },
      { id: 'cups', name: 'US cup', sym: 'cup', f: 0.2365882365, d: 'A US customary cup is 8 fluid ounces, about 237 millilitres — the standard unit in American recipes.' },
      { id: 'fluid-ounces', name: 'US fluid ounce', sym: 'fl oz', f: 0.0295735295625, d: 'A US fluid ounce is about 29.57 millilitres; the imperial fluid ounce is slightly smaller at 28.41 millilitres.' },
      { id: 'tablespoons', name: 'tablespoon', sym: 'tbsp', f: 0.01478676478125, d: 'A US tablespoon is three teaspoons, about 14.79 millilitres.' },
      { id: 'teaspoons', name: 'teaspoon', sym: 'tsp', f: 0.00492892159375, d: 'A US teaspoon is about 4.93 millilitres and is the smallest common cooking measure.' },
      { id: 'cubic-inches', name: 'cubic inch', plural: 'cubic inches', sym: 'in³', f: 0.016387064, d: 'A cubic inch is about 16.39 millilitres, traditionally used for American engine displacement.' },
      { id: 'cubic-feet', name: 'cubic foot', sym: 'ft³', plural: 'cubic feet', f: 28.316846592, d: 'A cubic foot is about 28.32 litres and is used for shipping volume, refrigerators and natural gas.' },
      { id: 'barrels', name: 'oil barrel', sym: 'bbl', f: 158.987294928, d: 'A petroleum barrel is 42 US gallons, about 159 litres, and is the global unit of crude oil trade.' },
    ],
  },
  speed: {
    name: 'Speed', base: 'meter per second',
    units: [
      { id: 'meters-per-second', name: 'meter per second', plural: 'meters per second', sym: 'm/s', f: 1, d: 'Metres per second is the SI unit of speed and the one used in physics equations.' },
      { id: 'kilometers-per-hour', name: 'kilometer per hour', plural: 'kilometers per hour', sym: 'km/h', f: 0.2777777777777778, d: 'Kilometres per hour is the speed unit on road signs and speedometers in most countries.' },
      { id: 'miles-per-hour', name: 'mile per hour', plural: 'miles per hour', sym: 'mph', f: 0.44704, d: 'Miles per hour is the road speed unit of the United States and United Kingdom.' },
      { id: 'knots', name: 'knot', sym: 'kn', f: 0.5144444444444445, d: 'A knot is one nautical mile per hour and is the speed unit used at sea and in aviation.' },
      { id: 'feet-per-second', name: 'foot per second', sym: 'ft/s', plural: 'feet per second', f: 0.3048, d: 'Feet per second is used in ballistics, sports analytics and US engineering.' },
      { id: 'mach', name: 'Mach', plural: 'Mach', sym: 'M', f: 340.29, d: 'Mach 1 is the speed of sound, about 340.3 m/s at sea level in standard conditions.' },
    ],
  },
  time: {
    name: 'Time', base: 'second',
    units: [
      { id: 'seconds', name: 'second', sym: 's', f: 1, d: 'The second is the SI base unit of time, defined by the caesium-133 hyperfine transition frequency.' },
      { id: 'minutes', name: 'minute', sym: 'min', f: 60, d: 'A minute is 60 seconds, a division inherited from Babylonian base-60 arithmetic.' },
      { id: 'hours', name: 'hour', sym: 'h', f: 3600, d: 'An hour is 60 minutes, or 3,600 seconds — one twenty-fourth of a day.' },
      { id: 'days', name: 'day', sym: 'd', f: 86400, d: 'A day is exactly 86,400 seconds by convention, ignoring leap seconds and slight variations in Earth’s rotation.' },
      { id: 'weeks', name: 'week', sym: 'wk', f: 604800, d: 'A week is seven days, or 604,800 seconds.' },
      { id: 'months', name: 'month', sym: 'mo', f: 2629746, d: 'An average month here is one twelfth of a Gregorian year, about 30.44 days.' },
      { id: 'years', name: 'year', sym: 'yr', f: 31556952, d: 'A Gregorian year averages 365.2425 days, which accounts for the leap-year rules.' },
      { id: 'milliseconds', name: 'millisecond', sym: 'ms', f: 0.001, d: 'A millisecond is one thousandth of a second — the unit of web latency and animation timing.' },
      { id: 'microseconds', name: 'microsecond', sym: 'µs', f: 1e-6, d: 'A microsecond is one millionth of a second, the scale of memory access and high-frequency trading.' },
      { id: 'nanoseconds', name: 'nanosecond', sym: 'ns', f: 1e-9, d: 'A nanosecond is one billionth of a second; light travels about 30 centimetres in that time.' },
    ],
  },
  pressure: {
    name: 'Pressure', base: 'pascal',
    units: [
      { id: 'pascals', name: 'pascal', sym: 'Pa', f: 1, d: 'The pascal is the SI unit of pressure, equal to one newton per square metre.' },
      { id: 'kilopascals', name: 'kilopascal', sym: 'kPa', f: 1000, d: 'A kilopascal is 1,000 pascals and is the metric unit on tyre placards and weather charts.' },
      { id: 'bars', name: 'bar', sym: 'bar', f: 100000, d: 'A bar is 100,000 pascals, very close to average atmospheric pressure at sea level.' },
      { id: 'psi', name: 'pound per square inch', plural: 'pounds per square inch', sym: 'psi', f: 6894.757293168, d: 'Pounds per square inch is the pressure unit of US tyre gauges, compressors and hydraulics.' },
      { id: 'atmospheres', name: 'atmosphere', plural: 'atmospheres', sym: 'atm', f: 101325, d: 'A standard atmosphere is exactly 101,325 pascals, the reference sea-level pressure.' },
      { id: 'millimeters-of-mercury', name: 'millimeter of mercury', plural: 'millimeters of mercury', sym: 'mmHg', f: 133.322387415, d: 'A millimetre of mercury is the unit of blood pressure and vacuum measurement, about 133.3 pascals.' },
      { id: 'inches-of-mercury', name: 'inch of mercury', plural: 'inches of mercury', sym: 'inHg', f: 3386.389, d: 'Inches of mercury are used in US aviation altimeter settings and barometric reports.' },
    ],
  },
  energy: {
    name: 'Energy', base: 'joule',
    units: [
      { id: 'joules', name: 'joule', sym: 'J', f: 1, d: 'The joule is the SI unit of energy — the work done by one newton acting over one metre.' },
      { id: 'kilojoules', name: 'kilojoule', sym: 'kJ', f: 1000, d: 'A kilojoule is 1,000 joules and is how food energy is labelled in most of the world.' },
      { id: 'calories', name: 'calorie', sym: 'cal', f: 4.184, d: 'A thermochemical calorie is exactly 4.184 joules — the energy to heat one gram of water by one degree Celsius.' },
      { id: 'kilocalories', name: 'kilocalorie', sym: 'kcal', f: 4184, d: 'A kilocalorie is 1,000 calories and is the "Calorie" printed on nutrition labels.' },
      { id: 'watt-hours', name: 'watt hour', sym: 'Wh', f: 3600, d: 'A watt hour is the energy of one watt sustained for one hour, equal to 3,600 joules.' },
      { id: 'kilowatt-hours', name: 'kilowatt hour', sym: 'kWh', f: 3600000, d: 'A kilowatt hour is the unit on your electricity bill — 3.6 million joules.' },
      { id: 'btu', name: 'British thermal unit', sym: 'BTU', f: 1055.05585262, d: 'A BTU is the energy needed to raise one pound of water by one degree Fahrenheit, about 1,055 joules.' },
      { id: 'electronvolts', name: 'electronvolt', sym: 'eV', f: 1.602176634e-19, d: 'An electronvolt is the energy gained by one electron crossing a one-volt potential, the natural unit of particle physics.' },
      { id: 'foot-pounds', name: 'foot pound', sym: 'ft⋅lb', f: 1.3558179483314004, d: 'A foot pound is the work done lifting one pound through one foot, about 1.356 joules.' },
    ],
  },
  power: {
    name: 'Power', base: 'watt',
    units: [
      { id: 'watts', name: 'watt', sym: 'W', f: 1, d: 'The watt is the SI unit of power — one joule per second.' },
      { id: 'kilowatts', name: 'kilowatt', sym: 'kW', f: 1000, d: 'A kilowatt is 1,000 watts, the unit for appliance ratings and electric-vehicle motors.' },
      { id: 'megawatts', name: 'megawatt', sym: 'MW', f: 1e6, d: 'A megawatt is one million watts, the scale of power-plant and wind-farm output.' },
      { id: 'horsepower', name: 'horsepower', sym: 'hp', plural: 'horsepower', f: 745.6998715822702, d: 'Mechanical horsepower is about 745.7 watts, still the standard rating for car engines in several markets.' },
      { id: 'btu-per-hour', name: 'BTU per hour', plural: 'BTU per hour', sym: 'BTU/h', f: 0.29307107017222, d: 'BTU per hour rates the capacity of air conditioners and heating systems in the United States.' },
    ],
  },
  angle: {
    name: 'Angle', base: 'degree',
    units: [
      { id: 'degrees', name: 'degree', sym: '°', f: 1, d: 'A degree is one 360th of a full turn, the everyday unit for angles and geographic coordinates.' },
      { id: 'radians', name: 'radian', sym: 'rad', f: 57.29577951308232, d: 'A radian is the angle subtending an arc equal to the radius; a full turn is 2π radians.' },
      { id: 'gradians', name: 'gradian', sym: 'gon', f: 0.9, d: 'A gradian divides a right angle into 100 parts and is used in some surveying contexts.' },
      { id: 'arcminutes', name: 'arcminute', sym: '′', f: 0.016666666666666666, d: 'An arcminute is one sixtieth of a degree, used in astronomy and navigation.' },
      { id: 'arcseconds', name: 'arcsecond', sym: '″', f: 0.0002777777777777778, d: 'An arcsecond is one sixtieth of an arcminute, the precision scale of telescopes and GPS coordinates.' },
      { id: 'turns', name: 'turn', sym: 'turn', f: 360, d: 'A turn is one complete revolution, equal to 360 degrees or 2π radians.' },
    ],
  },
  frequency: {
    name: 'Frequency', base: 'hertz',
    units: [
      { id: 'hertz', name: 'hertz', sym: 'Hz', plural: 'hertz', f: 1, d: 'The hertz is the SI unit of frequency — one cycle per second.' },
      { id: 'kilohertz', name: 'kilohertz', sym: 'kHz', plural: 'kilohertz', f: 1000, d: 'A kilohertz is 1,000 hertz, the unit for audio sample rates and AM radio.' },
      { id: 'megahertz', name: 'megahertz', sym: 'MHz', plural: 'megahertz', f: 1e6, d: 'A megahertz is one million hertz, used for FM radio, memory speeds and older CPU clocks.' },
      { id: 'gigahertz', name: 'gigahertz', sym: 'GHz', plural: 'gigahertz', f: 1e9, d: 'A gigahertz is one billion hertz — the unit for CPU clock speeds and Wi-Fi bands.' },
      { id: 'rpm', name: 'revolution per minute', plural: 'revolutions per minute', sym: 'rpm', f: 0.016666666666666666, d: 'Revolutions per minute measures rotational speed of engines, drives and hard disks.' },
    ],
  },
};

// Temperature is affine, not linear, so it is handled separately.
export const TEMPS = [
  { id: 'celsius', name: 'Celsius', sym: '°C', d: 'The Celsius scale puts the freezing point of water at 0° and its boiling point at 100° at standard pressure.' },
  { id: 'fahrenheit', name: 'Fahrenheit', sym: '°F', d: 'The Fahrenheit scale puts water’s freezing point at 32° and its boiling point at 212°, and is used mainly in the United States.' },
  { id: 'kelvin', name: 'Kelvin', sym: 'K', d: 'The kelvin is the SI base unit of temperature, starting at absolute zero; it uses the same degree size as Celsius.' },
  { id: 'rankine', name: 'Rankine', sym: '°R', d: 'The Rankine scale starts at absolute zero but uses Fahrenheit-sized degrees, and appears in US thermodynamics.' },
];

export const toK = { celsius: (v) => v + 273.15, fahrenheit: (v) => (v + 459.67) * 5 / 9, kelvin: (v) => v, rankine: (v) => v * 5 / 9 };
export const fromK = { celsius: (v) => v - 273.15, fahrenheit: (v) => v * 9 / 5 - 459.67, kelvin: (v) => v, rankine: (v) => v * 9 / 5 };

export const plural = (u) => u.plural || u.name + 's';
