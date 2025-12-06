import { Tier, CuratedList, ListCategory, Film } from './types';

// --- HELPER FUNCTIONS ---
export const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
};

const calculateRuntime = (title: string) => 85 + (getHash(title) % 95);
const calculateVES = (title: string, year: number) => 70 + (getHash(title + year.toString()) % 30);

export const INITIATE_SYNONYMS = ["INITIATE", "NOVICE", "APPRENTICE", "ROOKIE", "BEGINNER", "STUDENT"];
export const ADEPT_SYNONYMS = ["ADEPT", "SCHOLAR", "DISCIPLE", "JOURNEYMAN", "DEVOTEE", "VETERAN"];

const STREAMING_OPTIONS = ["Netflix", "Mubi", "Prime Video", "Apple TV+", "Criterion", "HBO Max", "Disney+"];

const BRIEFING_TEMPLATES = [
  "Observe how the camera refuses to cut during the tension.",
  "Listen closely when the music stops; that is the real dialogue.",
  "Pay attention to the color red in the background.",
  "This film changed how editing was understood in its decade.",
  "The protagonist is lying to you from the first scene.",
  "Notice the artificial lighting creating a sense of unease."
];

export const createFilm = (
  title: string, 
  year: number, 
  director: string = "Unknown", 
  posterPath?: string
): Film => {
  const cleanTitle = title.replace(/\s\(?S\d\)?/, "").replace(" (Series)", "").trim();
  let posterUrl = `https://placehold.co/600x900/F5C71A/000000?text=${encodeURIComponent(cleanTitle.toUpperCase())}&font=oswald`;
  if (posterPath && posterPath.startsWith('http')) posterUrl = posterPath;

  const briefIndex = getHash(cleanTitle) % BRIEFING_TEMPLATES.length;
  const streamCount = 1 + (getHash(cleanTitle) % 3);
  const streams = [];
  for(let i=0; i<streamCount; i++) {
      streams.push(STREAMING_OPTIONS[(getHash(cleanTitle) + i) % STREAMING_OPTIONS.length]);
  }

  return {
    id: cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    title: cleanTitle, 
    year,
    imdb: `https://www.imdb.com/find?q=${encodeURIComponent(cleanTitle)}`,
    letterboxd: `https://letterboxd.com/search/${encodeURIComponent(cleanTitle)}/`,
    posterUrl, director, screenplay: ["Unknown"], music: ["Unknown"], cast: ["Unknown"],
    ves: calculateVES(cleanTitle, year), runtime: calculateRuntime(cleanTitle),
    briefing: BRIEFING_TEMPLATES[briefIndex], streamingServices: streams
  };
};

const createTier = (level: number, name: string, films: Film[]): Tier => ({ level, name, films });

// ==========================================
// 1. THE GRANDMASTERS
// ==========================================

const KUBRICK: CuratedList = {
  id: 'kubrick', title: "STANLEY KUBRICK", subtitle: "The Perfectionist", description: "Mastering cinematic symmetry.", tiers: [
    createTier(1, "LEVEL 1: THE HOOK", [createFilm("The Shining", 1980, "Kubrick"), createFilm("Full Metal Jacket", 1987, "Kubrick")]),
    createTier(2, "LEVEL 2: SATIRE", [createFilm("Dr. Strangelove", 1964, "Kubrick"), createFilm("Lolita", 1962, "Kubrick")]),
    createTier(3, "LEVEL 3: FUTURE SHOCK", [createFilm("A Clockwork Orange", 1971, "Kubrick"), createFilm("2001: A Space Odyssey", 1968, "Kubrick")]),
    createTier(4, "LEVEL 4: THE HEIST", [createFilm("The Killing", 1956, "Kubrick"), createFilm("Killer's Kiss", 1955, "Kubrick")]),
    createTier(5, "LEVEL 5: WAR & GLORY", [createFilm("Paths of Glory", 1957, "Kubrick"), createFilm("Spartacus", 1960, "Kubrick")]),
    createTier(6, "LEVEL 6: PERIOD PIECES", [createFilm("Barry Lyndon", 1975, "Kubrick")]),
    createTier(7, "FINAL BOSS: THE DREAM", [createFilm("Eyes Wide Shut", 1999, "Kubrick"), createFilm("Fear and Desire", 1953, "Kubrick")])
  ]
};

const TARANTINO: CuratedList = {
  id: 'tarantino', title: "QUENTIN TARANTINO", subtitle: "The Remix King", tiers: [
    createTier(1, "LEVEL 1: POP HITS", [createFilm("Django Unchained", 2012, "Tarantino"), createFilm("Inglourious Basterds", 2009, "Tarantino")]),
    createTier(2, "LEVEL 2: THE ESSENCE", [createFilm("Pulp Fiction", 1994, "Tarantino"), createFilm("Reservoir Dogs", 1992, "Tarantino")]),
    createTier(3, "LEVEL 3: VENGEANCE", [createFilm("Kill Bill: Vol. 1", 2003, "Tarantino"), createFilm("Kill Bill: Vol. 2", 2004, "Tarantino")]),
    createTier(4, "LEVEL 4: CHARACTER STUDY", [createFilm("Jackie Brown", 1997, "Tarantino"), createFilm("Once Upon a Time in Hollywood", 2019, "Tarantino")]),
    createTier(5, "LEVEL 5: DIALOGUE", [createFilm("The Hateful Eight", 2015, "Tarantino"), createFilm("Death Proof", 2007, "Tarantino")]),
    createTier(6, "SIDE QUESTS", [createFilm("Four Rooms", 1995, "Tarantino"), createFilm("My Best Friend's Birthday", 1987, "Tarantino")])
  ]
};

const HITCHCOCK: CuratedList = {
    id: 'hitchcock', title: "ALFRED HITCHCOCK", subtitle: "Master of Suspense", tiers: [
        createTier(1, "LEVEL 1: THE BIG THREE", [createFilm("Psycho", 1960, "Hitchcock"), createFilm("Vertigo", 1958, "Hitchcock"), createFilm("Rear Window", 1954, "Hitchcock")]),
        createTier(2, "LEVEL 2: THE CHASE", [createFilm("North by Northwest", 1959, "Hitchcock"), createFilm("The 39 Steps", 1935, "Hitchcock"), createFilm("To Catch a Thief", 1955, "Hitchcock")]),
        createTier(3, "LEVEL 3: MURDER", [createFilm("Strangers on a Train", 1951, "Hitchcock"), createFilm("Dial M for Murder", 1954, "Hitchcock"), createFilm("Rope", 1948, "Hitchcock")]),
        createTier(4, "LEVEL 4: GASLIGHT", [createFilm("Rebecca", 1940, "Hitchcock"), createFilm("Notorious", 1946, "Hitchcock"), createFilm("Suspicion", 1941, "Hitchcock")]),
        createTier(5, "LEVEL 5: UNSETTLING", [createFilm("The Birds", 1963, "Hitchcock"), createFilm("Shadow of a Doubt", 1943, "Hitchcock"), createFilm("Frenzy", 1972, "Hitchcock")]),
        createTier(6, "LEVEL 6: BRITISH ROOTS", [createFilm("The Lady Vanishes", 1938, "Hitchcock"), createFilm("Sabotage", 1936, "Hitchcock"), createFilm("The Lodger", 1927, "Hitchcock")]),
        createTier(7, "LEVEL 7: DEEP DIVE", [createFilm("Marnie", 1964, "Hitchcock"), createFilm("Topaz", 1969, "Hitchcock"), createFilm("Family Plot", 1976, "Hitchcock"), createFilm("Lifeboat", 1944, "Hitchcock")])
    ]
};

const SCORSESE: CuratedList = {
    id: 'scorsese', title: "MARTIN SCORSESE", subtitle: "Cinema Itself", tiers: [
        createTier(1, "LEVEL 1: MODERN HITS", [createFilm("The Wolf of Wall Street", 2013, "Scorsese"), createFilm("The Departed", 2006, "Scorsese")]),
        createTier(2, "LEVEL 2: STREET CRIME", [createFilm("Taxi Driver", 1976, "Scorsese"), createFilm("Mean Streets", 1973, "Scorsese"), createFilm("Gangs of New York", 2002, "Scorsese")]),
        createTier(3, "LEVEL 3: MOB EPICS", [createFilm("Goodfellas", 1990, "Scorsese"), createFilm("Casino", 1995, "Scorsese"), createFilm("The Irishman", 2019, "Scorsese")]),
        createTier(4, "LEVEL 4: THE SOUL", [createFilm("Raging Bull", 1980, "Scorsese"), createFilm("The King of Comedy", 1982, "Scorsese"), createFilm("The Aviator", 2004, "Scorsese")]),
        createTier(5, "LEVEL 5: FAITH", [createFilm("Silence", 2016, "Scorsese"), createFilm("The Last Temptation of Christ", 1988, "Scorsese"), createFilm("Kundun", 1997, "Scorsese")]),
        createTier(6, "LEVEL 6: DEEP DIVE", [createFilm("After Hours", 1985, "Scorsese"), createFilm("The Age of Innocence", 1993, "Scorsese"), createFilm("Hugo", 2011, "Scorsese"), createFilm("Shutter Island", 2010, "Scorsese")])
    ]
};

const SPIELBERG: CuratedList = {
    id: 'spielberg', title: "STEVEN SPIELBERG", subtitle: "The Blockbuster", tiers: [
        createTier(1, "LEVEL 1: WONDER", [createFilm("Jurassic Park", 1993, "Spielberg"), createFilm("E.T.", 1982, "Spielberg"), createFilm("Hook", 1991, "Spielberg")]),
        createTier(2, "LEVEL 2: ADVENTURE", [createFilm("Raiders of the Lost Ark", 1981, "Spielberg"), createFilm("Last Crusade", 1989, "Spielberg"), createFilm("Temple of Doom", 1984, "Spielberg")]),
        createTier(3, "LEVEL 3: HISTORY", [createFilm("Schindler's List", 1993, "Spielberg"), createFilm("Saving Private Ryan", 1998, "Spielberg"), createFilm("Lincoln", 2012, "Spielberg")]),
        createTier(4, "LEVEL 4: THE SHARK", [createFilm("Jaws", 1975, "Spielberg"), createFilm("Duel", 1971, "Spielberg")]),
        createTier(5, "LEVEL 5: NEAR FUTURE", [createFilm("Minority Report", 2002, "Spielberg"), createFilm("A.I.", 2001, "Spielberg"), createFilm("Ready Player One", 2018, "Spielberg")]),
        createTier(6, "LEVEL 6: CONTACT", [createFilm("Close Encounters", 1977, "Spielberg"), createFilm("War of the Worlds", 2005, "Spielberg")]),
        createTier(7, "LEVEL 7: DRAMA", [createFilm("The Color Purple", 1985, "Spielberg"), createFilm("Empire of the Sun", 1987, "Spielberg"), createFilm("The Fabelmans", 2022, "Spielberg")]),
        createTier(8, "LEVEL 8: POLITICS", [createFilm("Munich", 2005, "Spielberg"), createFilm("Bridge of Spies", 2015, "Spielberg"), createFilm("The Post", 2017, "Spielberg")])
    ]
};

const KUROSAWA: CuratedList = {
    id: 'kurosawa', title: "AKIRA KUROSAWA", subtitle: "The Sensei", tiers: [
        createTier(1, "LEVEL 1: RONIN", [createFilm("Yojimbo", 1961, "Kurosawa"), createFilm("Sanjuro", 1962, "Kurosawa")]),
        createTier(2, "LEVEL 2: THE LEGEND", [createFilm("Seven Samurai", 1954, "Kurosawa"), createFilm("The Hidden Fortress", 1958, "Kurosawa")]),
        createTier(3, "LEVEL 3: TRUTH", [createFilm("Rashomon", 1950, "Kurosawa"), createFilm("High and Low", 1963, "Kurosawa")]),
        createTier(4, "LEVEL 4: SHAKESPEARE", [createFilm("Ran", 1985, "Kurosawa"), createFilm("Throne of Blood", 1957, "Kurosawa"), createFilm("The Bad Sleep Well", 1960, "Kurosawa")]),
        createTier(5, "LEVEL 5: HUMANISM", [createFilm("Ikiru", 1952, "Kurosawa"), createFilm("Red Beard", 1965, "Kurosawa")]),
        createTier(6, "LEVEL 6: NOIR", [createFilm("Stray Dog", 1949, "Kurosawa"), createFilm("Drunken Angel", 1948, "Kurosawa")]),
        createTier(7, "LEVEL 7: COLOR", [createFilm("Kagemusha", 1980, "Kurosawa"), createFilm("Dreams", 1990, "Kurosawa")]),
        createTier(8, "LEVEL 8: DEEP DIVE", [createFilm("Dersu Uzala", 1975, "Kurosawa"), createFilm("Madadayo", 1993, "Kurosawa")])
    ]
};

const BERGMAN: CuratedList = {
  id: 'bergman', title: "INGMAR BERGMAN", subtitle: "The Existentialist", tiers: [
    createTier(1, "LEVEL 1: THE ENTRY", [createFilm("The Seventh Seal", 1957, "Bergman"), createFilm("Wild Strawberries", 1957, "Bergman")]),
    createTier(2, "LEVEL 2: THE FACE", [createFilm("Persona", 1966, "Bergman"), createFilm("Cries and Whispers", 1972, "Bergman")]),
    createTier(3, "LEVEL 3: SILENCE OF GOD", [createFilm("Through a Glass Darkly", 1961, "Bergman"), createFilm("Winter Light", 1963, "Bergman"), createFilm("The Silence", 1963, "Bergman")]),
    createTier(4, "LEVEL 4: MARRIAGE", [createFilm("Scenes from a Marriage", 1973, "Bergman"), createFilm("Fanny and Alexander", 1982, "Bergman")]),
    createTier(5, "LEVEL 5: SUMMER", [createFilm("Summer with Monika", 1953, "Bergman"), createFilm("Smiles of a Summer Night", 1955, "Bergman")]),
    createTier(6, "LEVEL 6: FOLKLORE", [createFilm("The Virgin Spring", 1960, "Bergman"), createFilm("The Magician", 1958, "Bergman")]),
    createTier(7, "LEVEL 7: ISLAND", [createFilm("Hour of the Wolf", 1968, "Bergman"), createFilm("Shame", 1968, "Bergman"), createFilm("The Passion of Anna", 1969, "Bergman")]),
    createTier(8, "LEVEL 8: FINAL BOW", [createFilm("Saraband", 2003, "Bergman"), createFilm("Autumn Sonata", 1978, "Bergman")])
  ]
};

const LYNCH: CuratedList = {
  id: 'lynch', title: "DAVID LYNCH", subtitle: "The Dreamer", tiers: [
    createTier(1, "LEVEL 1: THE HOOK", [createFilm("Mulholland Drive", 2001, "Lynch"), createFilm("Blue Velvet", 1986, "Lynch")]),
    createTier(2, "LEVEL 2: THE CORE", [createFilm("Eraserhead", 1977, "Lynch"), createFilm("The Elephant Man", 1980, "Lynch"), createFilm("Wild at Heart", 1990, "Lynch")]),
    createTier(3, "LEVEL 3: TWIN PEAKS", [createFilm("Twin Peaks: Fire Walk with Me", 1992, "Lynch"), createFilm("Twin Peaks: The Return", 2017, "Series")]),
    createTier(4, "LEVEL 4: IDENTITY", [createFilm("Lost Highway", 1997, "Lynch"), createFilm("Inland Empire", 2006, "Lynch")]),
    createTier(5, "LEVEL 5: STRAIGHT", [createFilm("The Straight Story", 1999, "Lynch"), createFilm("Dune", 1984, "Lynch")])
  ]
};

const PT_ANDERSON: CuratedList = {
  id: 'pta', title: "PAUL THOMAS ANDERSON", subtitle: "The Virtuoso", tiers: [
    createTier(1, "LEVEL 1: ENSEMBLES", [createFilm("Boogie Nights", 1997, "P.T. Anderson"), createFilm("Magnolia", 1999, "P.T. Anderson")]),
    createTier(2, "LEVEL 2: MASTERPIECES", [createFilm("There Will Be Blood", 2007, "P.T. Anderson"), createFilm("The Master", 2012, "P.T. Anderson"), createFilm("Phantom Thread", 2017, "P.T. Anderson")]),
    createTier(3, "LEVEL 3: ROMANCE", [createFilm("Punch-Drunk Love", 2002, "P.T. Anderson"), createFilm("Licorice Pizza", 2021, "P.T. Anderson")]),
    createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Inherent Vice", 2014, "P.T. Anderson"), createFilm("Hard Eight", 1996, "P.T. Anderson")])
  ]
};

const FINCHER: CuratedList = {
  id: 'fincher', title: "DAVID FINCHER", subtitle: "The Obsessive", tiers: [
    createTier(1, "LEVEL 1: CULT HITS", [createFilm("Fight Club", 1999, "Fincher"), createFilm("Se7en", 1995, "Fincher")]),
    createTier(2, "LEVEL 2: PROCEDURAL", [createFilm("Zodiac", 2007, "Fincher"), createFilm("The Social Network", 2010, "Fincher")]),
    createTier(3, "LEVEL 3: THRILLERS", [createFilm("Gone Girl", 2014, "Fincher"), createFilm("The Girl with the Dragon Tattoo", 2011, "Fincher"), createFilm("The Game", 1997, "Fincher")]),
    createTier(4, "LEVEL 4: TECH", [createFilm("The Curious Case of Benjamin Button", 2008, "Fincher"), createFilm("Panic Room", 2002, "Fincher"), createFilm("The Killer", 2023, "Fincher")]),
    createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("Mank", 2020, "Fincher"), createFilm("Alien 3", 1992, "Fincher")])
  ]
};

const WES_ANDERSON: CuratedList = {
  id: 'wes', title: "WES ANDERSON", subtitle: "The Architect", tiers: [
    createTier(1, "LEVEL 1: PEAK STYLE", [createFilm("The Grand Budapest Hotel", 2014, "Wes Anderson"), createFilm("Moonrise Kingdom", 2012, "Wes Anderson"), createFilm("The Royal Tenenbaums", 2001, "Wes Anderson")]),
    createTier(2, "LEVEL 2: ANIMATION", [createFilm("Fantastic Mr. Fox", 2009, "Wes Anderson"), createFilm("Isle of Dogs", 2018, "Wes Anderson")]),
    createTier(3, "LEVEL 3: ORIGINS", [createFilm("Rushmore", 1998, "Wes Anderson"), createFilm("Bottle Rocket", 1996, "Wes Anderson")]),
    createTier(4, "LEVEL 4: ENSEMBLES", [createFilm("The Life Aquatic", 2004, "Wes Anderson"), createFilm("The Darjeeling Limited", 2007, "Wes Anderson")]),
    createTier(5, "LEVEL 5: META", [createFilm("The French Dispatch", 2021, "Wes Anderson"), createFilm("Asteroid City", 2023, "Wes Anderson")])
  ]
};

const NOLAN: CuratedList = {
  id: 'nolan', title: "CHRISTOPHER NOLAN", subtitle: "The Timekeeper", tiers: [
    createTier(1, "LEVEL 1: BLOCKBUSTERS", [createFilm("Inception", 2010, "Nolan"), createFilm("The Dark Knight", 2008, "Nolan"), createFilm("Interstellar", 2014, "Nolan")]),
    createTier(2, "LEVEL 2: PUZZLES", [createFilm("The Prestige", 2006, "Nolan"), createFilm("Memento", 2000, "Nolan"), createFilm("Tenet", 2020, "Nolan")]),
    createTier(3, "LEVEL 3: HISTORY", [createFilm("Oppenheimer", 2023, "Nolan"), createFilm("Dunkirk", 2017, "Nolan")]),
    createTier(4, "LEVEL 4: ORIGINS", [createFilm("Batman Begins", 2005, "Nolan"), createFilm("Insomnia", 2002, "Nolan"), createFilm("Following", 1998, "Nolan")])
  ]
};

const RIDLEY_SCOTT: CuratedList = {
  id: 'ridley', title: "RIDLEY SCOTT", subtitle: "The World Builder", tiers: [
    createTier(1, "LEVEL 1: SCI-FI ICONS", [createFilm("Alien", 1979, "Scott"), createFilm("Blade Runner", 1982, "Scott"), createFilm("The Martian", 2015, "Scott")]),
    createTier(2, "LEVEL 2: EPICS", [createFilm("Gladiator", 2000, "Scott"), createFilm("Kingdom of Heaven", 2005, "Scott"), createFilm("Black Hawk Down", 2001, "Scott")]),
    createTier(3, "LEVEL 3: CLASSICS", [createFilm("Thelma & Louise", 1991, "Scott"), createFilm("American Gangster", 2007, "Scott"), createFilm("The Duellists", 1977, "Scott")]),
    createTier(4, "LEVEL 4: POLARIZING", [createFilm("Prometheus", 2012, "Scott"), createFilm("Hannibal", 2001, "Scott"), createFilm("The Last Duel", 2021, "Scott")]),
    createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("Legend", 1985, "Scott"), createFilm("Matchstick Men", 2003, "Scott"), createFilm("House of Gucci", 2021, "Scott")])
  ]
};

const FELLINI: CuratedList = {
  id: 'fellini', title: "FEDERICO FELLINI", subtitle: "The Ringmaster", tiers: [
    createTier(1, "LEVEL 1: THE ICONS", [createFilm("La Dolce Vita", 1960, "Fellini"), createFilm("8 1/2", 1963, "Fellini")]),
    createTier(2, "LEVEL 2: ROOTS", [createFilm("La Strada", 1954, "Fellini"), createFilm("Nights of Cabiria", 1957, "Fellini"), createFilm("I Vitelloni", 1953, "Fellini")]),
    createTier(3, "LEVEL 3: MEMORY", [createFilm("Amarcord", 1973, "Fellini"), createFilm("Roma", 1972, "Fellini"), createFilm("Juliet of the Spirits", 1965, "Fellini")]),
    createTier(4, "LEVEL 4: EXCESS", [createFilm("Satyricon", 1969, "Fellini"), createFilm("Casanova", 1976, "Fellini"), createFilm("City of Women", 1980, "Fellini")]),
    createTier(5, "LEVEL 5: FINAL", [createFilm("And the Ship Sails On", 1983, "Fellini"), createFilm("Ginger and Fred", 1986, "Fellini"), createFilm("Il Bidone", 1955, "Fellini")])
  ]
};

const HANEKE: CuratedList = {
  id: 'haneke', title: "MICHAEL HANEKE", subtitle: "The Surgeon", tiers: [
    createTier(1, "LEVEL 1: THRILLERS", [createFilm("Funny Games", 1997, "Haneke"), createFilm("Cache", 2005, "Haneke")]),
    createTier(2, "LEVEL 2: MASTERPIECES", [createFilm("Amour", 2012, "Haneke"), createFilm("The White Ribbon", 2009, "Haneke"), createFilm("The Piano Teacher", 2001, "Haneke")]),
    createTier(3, "LEVEL 3: GLACIATION", [createFilm("The Seventh Continent", 1989, "Haneke"), createFilm("Benny's Video", 1992, "Haneke"), createFilm("71 Fragments", 1994, "Haneke")]),
    createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Code Unknown", 2000, "Haneke"), createFilm("Time of the Wolf", 2003, "Haneke"), createFilm("Happy End", 2017, "Haneke")])
  ]
};

const ALMODOVAR: CuratedList = {
  id: 'almodovar', title: "PEDRO ALMODOVAR", subtitle: "The Matador", tiers: [
    createTier(1, "LEVEL 1: ENTRY", [createFilm("Volver", 2006, "Almodovar"), createFilm("All About My Mother", 1999, "Almodovar"), createFilm("Women on the Verge", 1988, "Almodovar")]),
    createTier(2, "LEVEL 2: MASTERPIECES", [createFilm("Talk to Her", 2002, "Almodovar"), createFilm("Pain and Glory", 2019, "Almodovar"), createFilm("The Skin I Live In", 2011, "Almodovar")]),
    createTier(3, "LEVEL 3: PASSION", [createFilm("Bad Education", 2004, "Almodovar"), createFilm("Broken Embraces", 2009, "Almodovar"), createFilm("Live Flesh", 1997, "Almodovar"), createFilm("Tie Me Up!", 1989, "Almodovar")]),
    createTier(4, "LEVEL 4: EARLY", [createFilm("Law of Desire", 1987, "Almodovar"), createFilm("Matador", 1986, "Almodovar"), createFilm("What Have I Done?", 1984, "Almodovar")]),
    createTier(5, "LEVEL 5: LATE", [createFilm("Parallel Mothers", 2021, "Almodovar"), createFilm("Julieta", 2016, "Almodovar"), createFilm("Strange Way of Life", 2023, "Almodovar")])
  ]
};

const VON_TRIER: CuratedList = {
  id: 'vontrier', title: "LARS VON TRIER", subtitle: "The Provocateur", tiers: [
    createTier(1, "LEVEL 1: MASTERPIECES", [createFilm("Dogville", 2003, "Von Trier"), createFilm("Melancholia", 2011, "Von Trier"), createFilm("Breaking the Waves", 1996, "Von Trier")]),
    createTier(2, "LEVEL 2: DEPRESSION", [createFilm("Antichrist", 2009, "Von Trier"), createFilm("Nymphomaniac I", 2013, "Von Trier"), createFilm("Nymphomaniac II", 2013, "Von Trier")]),
    createTier(3, "LEVEL 3: DOGME", [createFilm("The Idiots", 1998, "Von Trier"), createFilm("The Five Obstructions", 2003, "Von Trier"), createFilm("The Boss of It All", 2006, "Von Trier")]),
    createTier(4, "LEVEL 4: EUROPA", [createFilm("The Element of Crime", 1984, "Von Trier"), createFilm("Epidemic", 1987, "Von Trier"), createFilm("Europa", 1991, "Von Trier")]),
    createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("The House That Jack Built", 2018, "Von Trier"), createFilm("Manderlay", 2005, "Von Trier")])
  ]
};

// --- RESTORED GRANDMASTERS (Satisfying Balance) ---

const FRITZ_LANG: CuratedList = {
  id: 'lang', title: "FRITZ LANG", subtitle: "The Mastermind", tiers: [
    createTier(1, "LEVEL 1: ICONS", [createFilm("Metropolis", 1927, "Lang"), createFilm("M", 1931, "Lang")]),
    createTier(2, "LEVEL 2: NOIR", [createFilm("The Big Heat", 1953, "Lang"), createFilm("Fury", 1936, "Lang"), createFilm("Scarlet Street", 1945, "Lang")]),
    createTier(3, "LEVEL 3: MABUSE", [createFilm("Dr. Mabuse the Gambler", 1922, "Lang"), createFilm("The Testament of Dr. Mabuse", 1933, "Lang"), createFilm("The Thousand Eyes of Dr. Mabuse", 1960, "Lang")]),
    createTier(4, "LEVEL 4: EPICS", [createFilm("Die Nibelungen: Siegfried", 1924, "Lang"), createFilm("Destiny", 1921, "Lang"), createFilm("Woman in the Moon", 1929, "Lang")])
  ]
};

const VARDA: CuratedList = {
  id: 'varda', title: "AGNES VARDA", subtitle: "The Gleaner", tiers: [
    createTier(1, "LEVEL 1: ESSENTIAL", [createFilm("Cleo from 5 to 7", 1962, "Varda"), createFilm("Vagabond", 1985, "Varda")]),
    createTier(2, "LEVEL 2: DOCU-POETRY", [createFilm("The Gleaners and I", 2000, "Varda"), createFilm("Faces Places", 2017, "Varda"), createFilm("The Beaches of Agnes", 2008, "Varda")]),
    createTier(3, "LEVEL 3: COLOR", [createFilm("Le Bonheur", 1965, "Varda"), createFilm("One Sings, the Other Doesn't", 1977, "Varda")]),
    createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("La Pointe Courte", 1955, "Varda"), createFilm("Kung-Fu Master!", 1988, "Varda")])
  ]
};

const OZU: CuratedList = {
  id: 'ozu', title: "YASUJIRO OZU", subtitle: "The Minimalist", tiers: [
    createTier(1, "LEVEL 1: ICONS", [createFilm("Tokyo Story", 1953, "Ozu"), createFilm("Late Spring", 1949, "Ozu")]),
    createTier(2, "LEVEL 2: COLOR", [createFilm("Good Morning", 1959, "Ozu"), createFilm("Floating Weeds", 1959, "Ozu"), createFilm("An Autumn Afternoon", 1962, "Ozu")]),
    createTier(3, "LEVEL 3: SEASONS", [createFilm("Early Summer", 1951, "Ozu"), createFilm("Late Autumn", 1960, "Ozu"), createFilm("Tokyo Twilight", 1957, "Ozu")]),
    createTier(4, "LEVEL 4: SILENT", [createFilm("I Was Born, But...", 1932, "Ozu"), createFilm("A Story of Floating Weeds", 1934, "Ozu")])
  ]
};

const BONG: CuratedList = {
  id: 'bong', title: "BONG JOON-HO", subtitle: "The Genre Bender", tiers: [
    createTier(1, "LEVEL 1: PHENOM", [createFilm("Parasite", 2019, "Bong"), createFilm("The Host", 2006, "Bong")]),
    createTier(2, "LEVEL 2: CRIME", [createFilm("Memories of Murder", 2003, "Bong"), createFilm("Mother", 2009, "Bong")]),
    createTier(3, "LEVEL 3: SCI-FI", [createFilm("Snowpiercer", 2013, "Bong"), createFilm("Okja", 2017, "Bong")]),
    createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Barking Dogs Never Bite", 2000, "Bong"), createFilm("Mickey 17", 2025, "Bong")])
  ]
};

const VILLENEUVE: CuratedList = {
  id: 'villeneuve', title: "DENIS VILLENEUVE", subtitle: "The Visionary", tiers: [
    createTier(1, "LEVEL 1: SCI-FI", [createFilm("Arrival", 2016, "Villeneuve"), createFilm("Dune: Part One", 2021, "Villeneuve"), createFilm("Blade Runner 2049", 2017, "Villeneuve")]),
    createTier(2, "LEVEL 2: THRILLER", [createFilm("Sicario", 2015, "Villeneuve"), createFilm("Prisoners", 2013, "Villeneuve")]),
    createTier(3, "LEVEL 3: MYSTERY", [createFilm("Incendies", 2010, "Villeneuve"), createFilm("Enemy", 2013, "Villeneuve")]),
    createTier(4, "LEVEL 4: EARLY", [createFilm("Polytechnique", 2009, "Villeneuve"), createFilm("Maelstrom", 2000, "Villeneuve")])
  ]
};

const CARPENTER: CuratedList = {
  id: 'carpenter', title: "JOHN CARPENTER", subtitle: "The Horror Master", tiers: [
    createTier(1, "LEVEL 1: ICONS", [createFilm("Halloween", 1978, "Carpenter"), createFilm("The Thing", 1982, "Carpenter"), createFilm("Escape from New York", 1981, "Carpenter")]),
    createTier(2, "LEVEL 2: CULT", [createFilm("Big Trouble in Little China", 1986, "Carpenter"), createFilm("They Live", 1988, "Carpenter"), createFilm("Assault on Precinct 13", 1976, "Carpenter")]),
    createTier(3, "LEVEL 3: ATMOSPHERE", [createFilm("The Fog", 1980, "Carpenter"), createFilm("Christine", 1983, "Carpenter"), createFilm("Prince of Darkness", 1987, "Carpenter")]),
    createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("In the Mouth of Madness", 1994, "Carpenter"), createFilm("Starman", 1984, "Carpenter"), createFilm("Dark Star", 1974, "Carpenter")])
  ]
};

const LEONE: CuratedList = {
  id: 'leone', title: "SERGIO LEONE", subtitle: "The Gunslinger", tiers: [
    createTier(1, "LEVEL 1: SPAGHETTI", [createFilm("The Good, the Bad and the Ugly", 1966, "Leone"), createFilm("For a Few Dollars More", 1965, "Leone"), createFilm("A Fistful of Dollars", 1964, "Leone")]),
    createTier(2, "LEVEL 2: MASTERPIECES", [createFilm("Once Upon a Time in the West", 1968, "Leone"), createFilm("Once Upon a Time in America", 1984, "Leone")]),
    createTier(3, "LEVEL 3: REVOLUTION", [createFilm("Duck, You Sucker!", 1971, "Leone")]),
    createTier(4, "LEVEL 4: PEPLUM", [createFilm("The Colossus of Rhodes", 1961, "Leone")])
  ]
};

const WILDER: CuratedList = {
  id: 'wilder', title: "BILLY WILDER", subtitle: "The Writer", tiers: [
    createTier(1, "LEVEL 1: COMEDY", [createFilm("Some Like It Hot", 1959, "Wilder"), createFilm("The Apartment", 1960, "Wilder"), createFilm("Sunset Boulevard", 1950, "Wilder")]),
    createTier(2, "LEVEL 2: SUSPENSE", [createFilm("Double Indemnity", 1944, "Wilder"), createFilm("Witness for the Prosecution", 1957, "Wilder"), createFilm("Ace in the Hole", 1951, "Wilder")]),
    createTier(3, "LEVEL 3: ROMANCE", [createFilm("Sabrina", 1954, "Wilder"), createFilm("The Seven Year Itch", 1955, "Wilder"), createFilm("The Lost Weekend", 1945, "Wilder"), createFilm("Stalag 17", 1953, "Wilder")]),
    createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Irma la Douce", 1963, "Wilder"), createFilm("One, Two, Three", 1961, "Wilder"), createFilm("Avanti!", 1972, "Wilder")])
  ]
};

const CUARON: CuratedList = {
  id: 'cuaron', title: "ALFONSO CUARON", subtitle: "The Alchemist", tiers: [
    createTier(1, "LEVEL 1: GLOBAL", [createFilm("Children of Men", 2006, "Cuaron"), createFilm("Gravity", 2013, "Cuaron"), createFilm("Harry Potter and the Prisoner of Azkaban", 2004, "Cuaron")]),
    createTier(2, "LEVEL 2: PERSONAL", [createFilm("Roma", 2018, "Cuaron"), createFilm("Y Tu Mama Tambien", 2001, "Cuaron")]),
    createTier(3, "LEVEL 3: EARLY", [createFilm("A Little Princess", 1995, "Cuaron"), createFilm("Great Expectations", 1998, "Cuaron"), createFilm("Solo con tu pareja", 1991, "Cuaron")])
  ]
};

const MIYAZAKI: CuratedList = {
    id: 'miyazaki', title: "HAYAO MIYAZAKI", subtitle: "The Dreamer", tiers: [
        createTier(1, "LEVEL 1: WHIMSY", [createFilm("My Neighbor Totoro", 1988, "Miyazaki"), createFilm("Kiki's Delivery Service", 1989, "Miyazaki"), createFilm("Ponyo", 2008, "Miyazaki")]),
        createTier(2, "LEVEL 2: EPICS", [createFilm("Spirited Away", 2001, "Miyazaki"), createFilm("Princess Mononoke", 1997, "Miyazaki"), createFilm("Howl's Moving Castle", 2004, "Miyazaki")]),
        createTier(3, "LEVEL 3: FLIGHT", [createFilm("Porco Rosso", 1992, "Miyazaki"), createFilm("Castle in the Sky", 1986, "Miyazaki"), createFilm("The Wind Rises", 2013, "Miyazaki")]),
        createTier(4, "LEVEL 4: ORIGINS", [createFilm("Nausicaa", 1984, "Miyazaki"), createFilm("Castle of Cagliostro", 1979, "Miyazaki"), createFilm("The Boy and the Heron", 2023, "Miyazaki")])
    ]
};

const WONG_KAR_WAI: CuratedList = {
    id: 'wkw', title: "WONG KAR-WAI", subtitle: "Neon & Melancholy", tiers: [
        createTier(1, "LEVEL 1: NEON", [createFilm("Chungking Express", 1994, "Wong Kar-wai"), createFilm("Fallen Angels", 1995, "Wong Kar-wai")]),
        createTier(2, "LEVEL 2: LOVE", [createFilm("In the Mood for Love", 2000, "Wong Kar-wai"), createFilm("Happy Together", 1997, "Wong Kar-wai")]),
        createTier(3, "LEVEL 3: TIME", [createFilm("2046", 2004, "Wong Kar-wai"), createFilm("Days of Being Wild", 1990, "Wong Kar-wai"), createFilm("As Tears Go By", 1988, "Wong Kar-wai")]),
        createTier(4, "LEVEL 4: STYLE", [createFilm("The Grandmaster", 2013, "Wong Kar-wai"), createFilm("Ashes of Time Redux", 2008, "Wong Kar-wai"), createFilm("My Blueberry Nights", 2007, "Wong Kar-wai")])
    ]
};

const TARKOVSKY: CuratedList = {
    id: 'tarkovsky', title: "ANDREI TARKOVSKY", subtitle: "Sculpting in Time", tiers: [
        createTier(1, "LEVEL 1: ENTRY", [createFilm("Ivan's Childhood", 1962, "Tarkovsky")]),
        createTier(2, "LEVEL 2: POETRY", [createFilm("Solaris", 1972, "Tarkovsky"), createFilm("Stalker", 1979, "Tarkovsky"), createFilm("Andrei Rublev", 1966, "Tarkovsky")]),
        createTier(3, "LEVEL 3: SPIRIT", [createFilm("Mirror", 1975, "Tarkovsky"), createFilm("Nostalghia", 1983, "Tarkovsky")]),
        createTier(4, "LEVEL 4: FAREWELL", [createFilm("The Sacrifice", 1986, "Tarkovsky"), createFilm("Steamroller and Violin", 1961, "Tarkovsky")])
    ]
};

const SATOSHI_KON: CuratedList = {
    id: 'kon', title: "SATOSHI KON", subtitle: "Dream Weaver", tiers: [
        createTier(1, "LEVEL 1: HOOK", [createFilm("Perfect Blue", 1997, "Satoshi Kon"), createFilm("Tokyo Godfathers", 2003, "Satoshi Kon")]),
        createTier(2, "LEVEL 2: MASTERPIECE", [createFilm("Paprika", 2006, "Satoshi Kon"), createFilm("Millennium Actress", 2001, "Satoshi Kon")]),
        createTier(3, "LEVEL 3: SERIES", [createFilm("Paranoia Agent", 2004, "Satoshi Kon")])
    ]
};

const COEN_BROTHERS: CuratedList = {
    id: 'coen', title: "COEN BROTHERS", subtitle: "Crime & Comedy", tiers: [
        createTier(1, "LEVEL 1: FUN", [createFilm("O Brother, Where Art Thou?", 2000, "Coen Brothers"), createFilm("Burn After Reading", 2008, "Coen Brothers"), createFilm("Raising Arizona", 1987, "Coen Brothers")]),
        createTier(2, "LEVEL 2: GRIT", [createFilm("Fargo", 1996, "Coen Brothers"), createFilm("No Country for Old Men", 2007, "Coen Brothers"), createFilm("The Big Lebowski", 1998, "Coen Brothers"), createFilm("True Grit", 2010, "Coen Brothers")]),
        createTier(3, "LEVEL 3: CRAFT", [createFilm("Barton Fink", 1991, "Coen Brothers"), createFilm("Inside Llewyn Davis", 2013, "Coen Brothers"), createFilm("A Serious Man", 2009, "Coen Brothers"), createFilm("The Man Who Wasn't There", 2001, "Coen Brothers")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Blood Simple", 1984, "Coen Brothers"), createFilm("Miller's Crossing", 1990, "Coen Brothers"), createFilm("Ballad of Buster Scruggs", 2018, "Coen Brothers"), createFilm("Hail, Caesar!", 2016, "Coen Brothers")])
    ]
};

// --- 2. MOVEMENTS & WORLD ---

const FRENCH_WAVE: CuratedList = {
    id: 'french', title: "FRENCH NEW WAVE", subtitle: "Nouvelle Vague", tiers: [
      createTier(1, "LEVEL 1: ICONS", [createFilm("The 400 Blows", 1959, "Truffaut"), createFilm("Breathless", 1960, "Godard"), createFilm("Cleo from 5 to 7", 1962, "Varda"), createFilm("Jules and Jim", 1962, "Truffaut")]),
      createTier(2, "LEVEL 2: REVOLUTION", [createFilm("Hiroshima Mon Amour", 1959, "Resnais"), createFilm("Band of Outsiders", 1964, "Godard"), createFilm("Contempt", 1963, "Godard"), createFilm("Elevator to the Gallows", 1958, "Malle")]),
      createTier(3, "LEVEL 3: INTELLECT", [createFilm("My Night at Maud's", 1969, "Rohmer"), createFilm("Last Year at Marienbad", 1961, "Resnais"), createFilm("Pierrot le Fou", 1965, "Godard"), createFilm("Lola", 1961, "Demy")]),
      createTier(4, "LEVEL 4: RADICAL", [createFilm("Weekend", 1967, "Godard"), createFilm("La Chinoise", 1967, "Godard"), createFilm("Vivre Sa Vie", 1962, "Godard")]),
      createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("Shoot the Piano Player", 1960, "Truffaut"), createFilm("Paris Belongs to Us", 1961, "Rivette"), createFilm("Le Bonheur", 1965, "Varda"), createFilm("Celine and Julie Go Boating", 1974, "Rivette"), createFilm("The Mother and the Whore", 1973, "Eustache")])
    ]
};

const KOREAN_WAVE: CuratedList = { 
  id: 'korean', title: "KOREAN WAVE", subtitle: "Hallyu", tiers: [
    createTier(1, "LEVEL 1: GLOBAL HITS", [createFilm("Parasite", 2019, "Bong"), createFilm("Train to Busan", 2016, "Yeon"), createFilm("The Host", 2006, "Bong"), createFilm("Squid Game", 2021, "Series")]), 
    createTier(2, "LEVEL 2: VENGEANCE", [createFilm("Oldboy", 2003, "Park"), createFilm("I Saw the Devil", 2010, "Kim"), createFilm("The Handmaiden", 2016, "Park"), createFilm("The Chaser", 2008, "Na")]),
    createTier(3, "LEVEL 3: CRIME & DRAMA", [createFilm("Memories of Murder", 2003, "Bong"), createFilm("The Wailing", 2016, "Na"), createFilm("Mother", 2009, "Bong"), createFilm("New World", 2013, "Park"), createFilm("A Bittersweet Life", 2005, "Kim")]),
    createTier(4, "LEVEL 4: ARTHOUSE", [createFilm("Burning", 2018, "Lee"), createFilm("Spring, Summer...", 2003, "Kim"), createFilm("Thirst", 2009, "Park"), createFilm("Right Now, Wrong Then", 2015, "Hong")]),
    createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("Oasis", 2002, "Lee"), createFilm("Sympathy for Mr. Vengeance", 2002, "Park"), createFilm("Lady Vengeance", 2005, "Park"), createFilm("The Good, the Bad, the Weird", 2008, "Kim"), createFilm("3-Iron", 2004, "Kim")])
  ] 
};

const ITALIAN_NEO: CuratedList = {
    id: 'italian', title: "ITALIAN NEOREALISM", subtitle: "Spirit of the Streets", tiers: [
        createTier(1, "LEVEL 1: ESSENTIALS", [createFilm("Bicycle Thieves", 1948, "De Sica"), createFilm("Rome, Open City", 1945, "Rossellini"), createFilm("Life is Beautiful", 1997, "Benigni")]),
        createTier(2, "LEVEL 2: THE CORE", [createFilm("Umberto D.", 1952, "De Sica"), createFilm("La Strada", 1954, "Fellini"), createFilm("Rocco and His Brothers", 1960, "Visconti"), createFilm("Paisan", 1946, "Rossellini")]),
        createTier(3, "LEVEL 3: EVOLUTION", [createFilm("La Terra Trema", 1948, "Visconti"), createFilm("Germany Year Zero", 1948, "Rossellini"), createFilm("Bitter Rice", 1949, "De Santis"), createFilm("Miracle in Milan", 1951, "De Sica")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Nights of Cabiria", 1957, "Fellini"), createFilm("Mamma Roma", 1962, "Pasolini"), createFilm("Shoeshine", 1946, "De Sica"), createFilm("Ossessione", 1943, "Visconti"), createFilm("Rome 11:00", 1952, "De Santis")])
    ]
};

const IRANIAN: CuratedList = {
    id: 'iranian', title: "IRANIAN CINEMA", subtitle: "Poetry & Censorship", tiers: [
        createTier(1, "LEVEL 1: HUMANISM", [createFilm("Children of Heaven", 1997, "Majidi"), createFilm("A Separation", 2011, "Farhadi"), createFilm("The Salesman", 2016, "Farhadi")]),
        createTier(2, "LEVEL 2: LIFE & DEATH", [createFilm("Taste of Cherry", 1997, "Kiarostami"), createFilm("Where is the Friend's House?", 1987, "Kiarostami"), createFilm("About Elly", 2009, "Farhadi"), createFilm("The Color of Paradise", 1999, "Majidi")]),
        createTier(3, "LEVEL 3: META-CINEMA", [createFilm("Close-Up", 1990, "Kiarostami"), createFilm("Through the Olive Trees", 1994, "Kiarostami"), createFilm("A Moment of Innocence", 1996, "Makhmalbaf"), createFilm("This Is Not a Film", 2011, "Panahi")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("The House is Black", 1962, "Farrokhzad"), createFilm("Ten", 2002, "Kiarostami"), createFilm("A Girl Walks Home Alone at Night", 2014, "Amirpour"), createFilm("The Apple", 1998, "Makhmalbaf")])
    ]
};

const NORDIC: CuratedList = {
    id: 'nordic', title: "NORDIC CINEMA", subtitle: "Ice & Fire", tiers: [
        createTier(1, "LEVEL 1: COLD HITS", [createFilm("Another Round", 2020, "Vinterberg"), createFilm("Let the Right One In", 2008, "Alfredson"), createFilm("The Girl with the Dragon Tattoo", 2009, "Oplev")]),
        createTier(2, "LEVEL 2: SOCIETY", [createFilm("The Hunt", 2012, "Vinterberg"), createFilm("The Square", 2017, "Ostlund"), createFilm("Force Majeure", 2014, "Ostlund"), createFilm("Festen", 1998, "Vinterberg")]),
        createTier(3, "LEVEL 3: MASTERS", [createFilm("Persona", 1966, "Bergman"), createFilm("The Seventh Seal", 1957, "Bergman"), createFilm("The Worst Person in the World", 2021, "Trier")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Songs from the Second Floor", 2000, "Andersson"), createFilm("Dogville", 2003, "Von Trier"), createFilm("Lamb", 2021, "Johannsson"), createFilm("Headhunters", 2011, "Tyldum"), createFilm("Pusher", 1996, "Refn")])
    ]
};

const USSR: CuratedList = {
    id: 'ussr', title: "USSR CINEMA", subtitle: "The Red Lens", tiers: [
        createTier(1, "LEVEL 1: THE EPIC", [createFilm("Moscow Does Not Believe in Tears", 1980, "Menshov"), createFilm("War and Peace", 1966, "Bondarchuk"), createFilm("Solaris", 1972, "Tarkovsky")]),
        createTier(2, "LEVEL 2: THE EDIT", [createFilm("Battleship Potemkin", 1925, "Eisenstein"), createFilm("Come and See", 1985, "Klimov"), createFilm("The Cranes Are Flying", 1957, "Kalatozov")]),
        createTier(3, "LEVEL 3: THE ART", [createFilm("Stalker", 1979, "Tarkovsky"), createFilm("The Color of Pomegranates", 1969, "Parajanov"), createFilm("Man with a Movie Camera", 1929, "Vertov")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Viy", 1967, "Yershov"), createFilm("Ivan the Terrible", 1944, "Eisenstein"), createFilm("Hard to Be a God", 2013, "German"), createFilm("Ballad of a Soldier", 1959, "Chukhray")])
    ]
};

const TURKISH: CuratedList = {
    id: 'turkish', title: "TURKISH CINEMA", subtitle: "90s to Present", tiers: [
        createTier(1, "LEVEL 1: THE BRIDGE", [createFilm("Eskiya", 1996, "Turgul"), createFilm("Her Sey Cok Guzel Olacak", 1998, "Vargi"), createFilm("Pardon", 2005, "Ilhan"), createFilm("Vizontele", 2001, "Erdogan")]),
        createTier(2, "LEVEL 2: NEW REALISM", [createFilm("Masumiyet", 1997, "Demirkubuz"), createFilm("Gemide", 1998, "Akar"), createFilm("Bir Zamanlar Anadolu'da", 2011, "Ceylan"), createFilm("Tabutta Rovasata", 1996, "Akin")]),
        createTier(3, "LEVEL 3: THE AUTEUR", [createFilm("Uzak", 2002, "Ceylan"), createFilm("Kis Uykusu", 2014, "Ceylan"), createFilm("Kader", 2006, "Demirkubuz"), createFilm("Vavien", 2009, "Taylan"), createFilm("Ahlat Agaci", 2018, "Ceylan")]),
        createTier(4, "LEVEL 4: NEW VOICES", [createFilm("Sarmasik", 2015, "Karacelik"), createFilm("Kurak Gunler", 2022, "Alper"), createFilm("Kelebekler", 2018, "Karacelik"), createFilm("Kiz Kardesler", 2019, "Alper")]),
        createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("Yazgi", 2001, "Demirkubuz"), createFilm("Kosmos", 2010, "Erdem"), createFilm("Sivas", 2014, "Mujdeci"), createFilm("Anayurt Oteli", 1987, "Kavur"), createFilm("Sevmek Zamani", 1965, "Erksan")])
    ]
};

// --- 3. GENRES & UNIVERSES ---

const STAR_TREK: CuratedList = {
    id: 'startrek', title: "STAR TREK", subtitle: "The Complete Saga", tiers: [
        createTier(1, "LEVEL 1: START HERE", [createFilm("Star Trek (2009)", 2009, "Abrams"), createFilm("Star Trek: First Contact", 1996, "Frakes"), createFilm("Strange New Worlds", 2022, "Series")]),
        createTier(2, "LEVEL 2: THE KHAN ARC", [createFilm("Space Seed (TOS)", 1967, "Series"), createFilm("The Wrath of Khan", 1982, "Meyer"), createFilm("The Search for Spock", 1984, "Nimoy"), createFilm("The Voyage Home", 1986, "Nimoy")]),
        createTier(3, "LEVEL 3: THE GOLDEN ERA", [createFilm("The Next Generation", 1987, "Series"), createFilm("Deep Space Nine", 1993, "Series"), createFilm("The Undiscovered Country", 1991, "Meyer")]),
        createTier(4, "LEVEL 4: VOYAGER & BEYOND", [createFilm("Voyager", 1995, "Series"), createFilm("Star Trek Beyond", 2016, "Lin"), createFilm("Lower Decks", 2020, "Series")]),
        createTier(5, "LEVEL 5: ORIGINS", [createFilm("The Original Series", 1966, "Series"), createFilm("Enterprise", 2001, "Series"), createFilm("The Motion Picture", 1979, "Wise")]),
        createTier(6, "LEVEL 6: COMPLETIONIST", [createFilm("Picard", 2020, "Series"), createFilm("Discovery", 2017, "Series"), createFilm("Insurrection", 1998, "Frakes"), createFilm("Nemesis", 2002, "Baird"), createFilm("Star Trek V", 1989, "Shatner"), createFilm("Generations", 1994, "Carson")])
    ]
};

const STAR_WARS: CuratedList = {
    id: 'starwars', title: "STAR WARS", subtitle: "Skywalker & Beyond", tiers: [
        createTier(1, "LEVEL 1: THE HOLY TRILOGY", [createFilm("Episode IV: A New Hope", 1977, "Lucas"), createFilm("Episode V: Empire Strikes Back", 1980, "Kershner"), createFilm("Episode VI: Return of the Jedi", 1983, "Marquand")]),
        createTier(2, "LEVEL 2: MODERN ESSENTIALS", [createFilm("The Mandalorian", 2019, "Series"), createFilm("Rogue One", 2016, "Edwards"), createFilm("Andor", 2022, "Series"), createFilm("The Force Awakens", 2015, "Abrams")]),
        createTier(3, "LEVEL 3: THE PREQUELS", [createFilm("Episode I: Phantom Menace", 1999, "Lucas"), createFilm("Episode II: Attack of the Clones", 2002, "Lucas"), createFilm("Episode III: Revenge of the Sith", 2005, "Lucas")]),
        createTier(4, "LEVEL 4: THE REBELLION", [createFilm("The Clone Wars", 2008, "Series"), createFilm("Rebels", 2014, "Series"), createFilm("The Bad Batch", 2021, "Series")]),
        createTier(5, "LEVEL 5: THE SEQUELS", [createFilm("The Last Jedi", 2017, "Johnson"), createFilm("Rise of Skywalker", 2019, "Abrams"), createFilm("Ahsoka", 2023, "Series")]),
        createTier(6, "LEVEL 6: DEEP DIVE", [createFilm("Solo", 2018, "Howard"), createFilm("Obi-Wan Kenobi", 2022, "Series"), createFilm("Visions", 2021, "Series"), createFilm("Tales of the Jedi", 2022, "Series"), createFilm("Book of Boba Fett", 2021, "Series"), createFilm("The Acolyte", 2024, "Series")])
    ]
};

const CYBERPUNK: CuratedList = {
    id: 'cyberpunk', title: "CYBERPUNK & NEO-NOIR", subtitle: "Rain & Neon", tiers: [
        createTier(1, "LEVEL 1: THE SYSTEM", [createFilm("The Matrix", 1999, "Wachowskis"), createFilm("Blade Runner", 1982, "Scott"), createFilm("Minority Report", 2002, "Spielberg")]),
        createTier(2, "LEVEL 2: THE RAIN", [createFilm("Blade Runner 2049", 2017, "Villeneuve"), createFilm("Ghost in the Shell", 1995, "Oshii"), createFilm("Akira", 1988, "Otomo"), createFilm("Gattaca", 1997, "Niccol")]),
        createTier(3, "LEVEL 3: THE GRIT", [createFilm("Dark City", 1998, "Proyas"), createFilm("RoboCop", 1987, "Verhoeven"), createFilm("Strange Days", 1995, "Bigelow"), createFilm("Total Recall", 1990, "Verhoeven")]),
        createTier(4, "LEVEL 4: MODERN TECH", [createFilm("Her", 2013, "Jonze"), createFilm("Ex Machina", 2014, "Garland"), createFilm("Upgrade", 2018, "Whannell"), createFilm("Alita: Battle Angel", 2019, "Rodriguez"), createFilm("Source Code", 2011, "Jones")]),
        createTier(5, "LEVEL 5: DEEP DIVE", [createFilm("Johnny Mnemonic", 1995, "Longo"), createFilm("Existenz", 1999, "Cronenberg"), createFilm("Renaissance", 2006, "Volckman"), createFilm("Alphaville", 1965, "Godard"), createFilm("Videodrome", 1983, "Cronenberg"), createFilm("Mute", 2018, "Jones")])
    ]
};

const BODY_HORROR: CuratedList = { 
  id: 'body', title: "BODY HORROR", subtitle: "Flesh & Metal", tiers: [
    createTier(1, "LEVEL 1: TRANSFORMATION", [createFilm("The Fly", 1986, "Cronenberg"), createFilm("District 9", 2009, "Blomkamp"), createFilm("The Thing", 1982, "Carpenter"), createFilm("Alien", 1979, "Scott")]), 
    createTier(2, "LEVEL 2: CRONENBERG CORE", [createFilm("Videodrome", 1983, "Cronenberg"), createFilm("Scanners", 1981, "Cronenberg"), createFilm("The Brood", 1979, "Cronenberg"), createFilm("Crash", 1996, "Cronenberg")]),
    createTier(3, "LEVEL 3: MODERN EXTREMES", [createFilm("Titane", 2021, "Ducournau"), createFilm("Raw", 2016, "Ducournau"), createFilm("The Substance", 2024, "Fargeat"), createFilm("Possessor", 2020, "Cronenberg"), createFilm("Infinity Pool", 2023, "Cronenberg")]),
    createTier(4, "LEVEL 4: JAPAN & CULT", [createFilm("Tetsuo", 1989, "Tsukamoto"), createFilm("Eraserhead", 1977, "Lynch"), createFilm("Society", 1989, "Yuzna"), createFilm("Tokyo Gore Police", 2008, "Nishimura"), createFilm("Slither", 2006, "Gunn"), createFilm("Tusk", 2014, "Smith")])
  ] 
};

const SPACE_OPERA: CuratedList = {
    id: 'space_opera', title: "SPACE OPERAS", subtitle: "Beyond Franchises", tiers: [
        createTier(1, "LEVEL 1: ADVENTURE", [createFilm("Guardians of Galaxy", 2014, "Gunn"), createFilm("The Fifth Element", 1997, "Besson"), createFilm("Avatar", 2009, "Cameron")]),
        createTier(2, "LEVEL 2: WORLD BUILDING", [createFilm("Dune: Part One", 2021, "Villeneuve"), createFilm("Dune: Part Two", 2024, "Villeneuve"), createFilm("Serenity", 2005, "Whedon")]),
        createTier(3, "LEVEL 3: CULT CLASSICS", [createFilm("District 9", 2009, "Blomkamp"), createFilm("Valerian", 2017, "Besson"), createFilm("Jupiter Ascending", 2015, "Wachowskis"), createFilm("Starship Troopers", 1997, "Verhoeven")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Legend of Galactic Heroes", 1988, "Series"), createFilm("Prospect", 2018, "Caldwell"), createFilm("High Life", 2018, "Denis"), createFilm("Flash Gordon", 1980, "Hodges")])
    ]
};

const MIND_BENDERS: CuratedList = {
    id: 'mind', title: "MIND BENDERS", subtitle: "Puzzle Movies", tiers: [
        createTier(1, "LEVEL 1: THE QUESTION", [createFilm("Inception", 2010, "Nolan"), createFilm("The Truman Show", 1998, "Weir"), createFilm("The Sixth Sense", 1999, "Shyamalan"), createFilm("Fight Club", 1999, "Fincher")]),
        createTier(2, "LEVEL 2: THE LOOP", [createFilm("Eternal Sunshine", 2004, "Gondry"), createFilm("Arrival", 2016, "Villeneuve"), createFilm("Memento", 2000, "Nolan"), createFilm("Donnie Darko", 2001, "Kelly"), createFilm("12 Monkeys", 1995, "Gilliam")]),
        createTier(3, "LEVEL 3: THE MAZE", [createFilm("Mulholland Drive", 2001, "Lynch"), createFilm("Synecdoche, New York", 2008, "Kaufman"), createFilm("Enemy", 2013, "Villeneuve"), createFilm("Being John Malkovich", 1999, "Jonze"), createFilm("Mother!", 2017, "Aronofsky")]),
        createTier(4, "LEVEL 4: THE IMPOSSIBLE", [createFilm("Primer", 2004, "Carruth"), createFilm("Coherence", 2013, "Byrkit"), createFilm("Upstream Color", 2013, "Carruth"), createFilm("Predestination", 2014, "Spierig"), createFilm("Pi", 1998, "Aronofsky"), createFilm("Tenet", 2020, "Nolan")])
    ]
};

const FOLK_HORROR: CuratedList = {
    id: 'folk', title: "FOLK HORROR", subtitle: "Daylight Nightmares", tiers: [
        createTier(1, "LEVEL 1: DAYLIGHT", [createFilm("Midsommar", 2019, "Eggers"), createFilm("The Village", 2004, "Shyamalan"), createFilm("The Wicker Man", 1973, "Hardy"), createFilm("Signs", 2002, "Shyamalan")]),
        createTier(2, "LEVEL 2: GLOBAL", [createFilm("The Wailing", 2016, "Na"), createFilm("Onibaba", 1964, "Shindo"), createFilm("The Witch", 2015, "Eggers"), createFilm("Lamb", 2021, "Johannsson"), createFilm("The Ritual", 2017, "Bruckner")]),
        createTier(3, "LEVEL 3: CLASSICS", [createFilm("Rosemary's Baby", 1968, "Polanski"), createFilm("Blood on Satan's Claw", 1971, "Haggard"), createFilm("Witchfinder General", 1968, "Reeves"), createFilm("Kuroneko", 1968, "Shindo"), createFilm("Viy", 1967, "Yershov")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Kill List", 2011, "Wheatley"), createFilm("A Field in England", 2013, "Wheatley"), createFilm("Hagazussa", 2017, "Feigelfeld"), createFilm("November", 2017, "Sarnet"), createFilm("You Won't Be Alone", 2022, "Stolevski")])
    ]
};

const TIME_LOOPS: CuratedList = {
    id: 'timeloop', title: "TIME LOOPS", subtitle: "Deja Vu", tiers: [
        createTier(1, "LEVEL 1: FUN & ACTION", [createFilm("Groundhog Day", 1993, "Ramis"), createFilm("Edge of Tomorrow", 2014, "Liman"), createFilm("Palm Springs", 2020, "Barbakow"), createFilm("Happy Death Day", 2017, "Landon")]),
        createTier(2, "LEVEL 2: THRILLER", [createFilm("Source Code", 2011, "Jones"), createFilm("Run Lola Run", 1998, "Tykwer"), createFilm("Looper", 2012, "Johnson"), createFilm("Deja Vu", 2006, "Scott"), createFilm("The Butterfly Effect", 2004, "Bress")]),
        createTier(3, "LEVEL 3: PARADOX", [createFilm("Predestination", 2014, "Spierig"), createFilm("Triangle", 2009, "Smith"), createFilm("Coherence", 2013, "Byrkit"), createFilm("Tenet", 2020, "Nolan")]),
        createTier(4, "LEVEL 4: ART & INDIE", [createFilm("La Jetee", 1962, "Marker"), createFilm("Primer", 2004, "Carruth"), createFilm("The Endless", 2017, "Benson"), createFilm("Resolution", 2012, "Benson"), createFilm("ARQ", 2016, "Elliott"), createFilm("Mirage", 2018, "Paulo"), createFilm("About Time", 2013, "Curtis")])
    ]
};

// --- THEMATIC ---

const TRACKS: CuratedList = {
  id: 'tracks', title: "TRACKS & TENSION", subtitle: "Trains", tiers: [
     createTier(1, "LEVEL 1: SPEED", [createFilm("Snowpiercer", 2013, "Bong"), createFilm("Train to Busan", 2016, "Yeon"), createFilm("Bullet Train", 2022, "Leitch"), createFilm("Unstoppable", 2010, "Scott"), createFilm("Source Code", 2011, "Jones")]),
     createTier(2, "LEVEL 2: MYSTERY", [createFilm("Murder on Orient Express", 1974, "Lumet"), createFilm("The Lady Vanishes", 1938, "Hitchcock"), createFilm("Strangers on a Train", 1951, "Hitchcock"), createFilm("Girl on the Train", 2016, "Taylor"), createFilm("Transsiberian", 2008, "Anderson")]),
     createTier(3, "LEVEL 3: JOURNEY", [createFilm("The Darjeeling Limited", 2007, "Anderson"), createFilm("Runaway Train", 1985, "Konchalovsky"), createFilm("Europa", 1991, "Von Trier"), createFilm("The General", 1926, "Keaton"), createFilm("North by Northwest", 1959, "Hitchcock")]),
     createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Taking of Pelham 123", 1974, "Sargent"), createFilm("Von Ryan's Express", 1965, "Robson"), createFilm("Emperor of the North", 1973, "Aldrich"), createFilm("Compartment No. 6", 2021, "Kuosmanen"), createFilm("Titan A.E.", 2000, "Bluth")])
  ]
};

const DINNER: CuratedList = {
  id: 'dinner', title: "DINNER IS SERVED", subtitle: "Bon Appetit", tiers: [
     createTier(1, "LEVEL 1: APPETITE", [createFilm("The Menu", 2022, "Mylod"), createFilm("Ratatouille", 2007, "Bird"), createFilm("Chef", 2014, "Favreau"), createFilm("Julie & Julia", 2009, "Ephron"), createFilm("Chocolat", 2000, "Hallstrom")]),
     createTier(2, "LEVEL 2: STRESS", [createFilm("The Bear", 2022, "Series"), createFilm("Boiling Point", 2021, "Barantini"), createFilm("Babette's Feast", 1987, "Axel"), createFilm("Big Night", 1996, "Tucci"), createFilm("Burnt", 2015, "Wells")]),
     createTier(3, "LEVEL 3: GROTESQUE", [createFilm("The Cook, the Thief...", 1989, "Greenaway"), createFilm("The Platform", 2019, "Gaztelu-Urrutia"), createFilm("Delicatessen", 1991, "Jeunet"), createFilm("Hannibal", 2013, "Series"), createFilm("Raw", 2016, "Ducournau")]),
     createTier(4, "LEVEL 4: CULTURE", [createFilm("Eat Drink Man Woman", 1994, "Lee"), createFilm("Tampopo", 1985, "Itami"), createFilm("Jiro Dreams of Sushi", 2011, "Gelb"), createFilm("Like Water for Chocolate", 1992, "Arau"), createFilm("The Lunchbox", 2013, "Batra")])
  ]
};

const ISOLATION: CuratedList = {
  id: 'isolation', title: "THE ISOLATION TANK", subtitle: "No Way Out", tiers: [
    createTier(1, "LEVEL 1: SURVIVAL", [createFilm("Cast Away", 2000, "Zemeckis"), createFilm("The Martian", 2015, "Scott"), createFilm("127 Hours", 2010, "Boyle"), createFilm("Gravity", 2013, "Cuaron"), createFilm("Life of Pi", 2012, "Lee")]),
    createTier(2, "LEVEL 2: CABIN FEVER", [createFilm("The Lighthouse", 2019, "Eggers"), createFilm("The Shining", 1980, "Kubrick"), createFilm("Misery", 1990, "Reiner"), createFilm("10 Cloverfield Lane", 2016, "Trachtenberg"), createFilm("Room", 2015, "Abrahamson")]),
    createTier(3, "LEVEL 3: EXISTENTIAL", [createFilm("Moon", 2009, "Jones"), createFilm("Woman in the Dunes", 1964, "Teshigahara"), createFilm("Exterminating Angel", 1962, "Bunuel"), createFilm("High Life", 2018, "Denis"), createFilm("Silent Running", 1972, "Trumbull")]),
    createTier(4, "LEVEL 4: CONFINED", [createFilm("Buried", 2010, "Cortes"), createFilm("Locke", 2013, "Knight"), createFilm("Cube", 1997, "Natali"), createFilm("Safe", 1995, "Haynes"), createFilm("Rear Window", 1954, "Hitchcock"), createFilm("The Terminal", 2004, "Spielberg")])
  ]
};

const HEIST: CuratedList = {
    id: 'heist', title: "ART HEIST", subtitle: "Stealing Beauty", tiers: [
        createTier(1, "LEVEL 1: STYLE", [createFilm("Ocean's Eleven", 2001, "Soderbergh"), createFilm("The Thomas Crown Affair", 1999, "McTiernan"), createFilm("Lupin", 2021, "Series"), createFilm("The Italian Job", 2003, "Gray"), createFilm("Now You See Me", 2013, "Leterrier")]),
        createTier(2, "LEVEL 2: TECHNIQUE", [createFilm("Rififi", 1955, "Dassin"), createFilm("Inside Man", 2006, "Lee"), createFilm("Entrapment", 1999, "Amiel"), createFilm("Snatch", 2000, "Ritchie"), createFilm("Logan Lucky", 2017, "Soderbergh")]),
        createTier(3, "LEVEL 3: SATIRE", [createFilm("The Square", 2017, "Ostlund"), createFilm("Exit Through Gift Shop", 2010, "Banksy"), createFilm("F for Fake", 1973, "Welles"), createFilm("The Best Offer", 2013, "Tornatore"), createFilm("Velvet Buzzsaw", 2019, "Gilroy")]),
        createTier(4, "LEVEL 4: REALITY", [createFilm("American Animals", 2018, "Layton"), createFilm("Trance", 2013, "Boyle"), createFilm("The Duke", 2020, "Michell"), createFilm("Gambit", 1966, "Neame"), createFilm("Museum Hours", 2012, "Cohen")])
    ]
};

const SUBURBAN: CuratedList = {
    id: 'suburban', title: "SUBURBAN NIGHTMARES", subtitle: "Picket Fences", tiers: [
        createTier(1, "LEVEL 1: FACADE", [createFilm("The Truman Show", 1998, "Weir"), createFilm("Edward Scissorhands", 1990, "Burton"), createFilm("Don't Worry Darling", 2022, "Wilde"), createFilm("Desperate Housewives", 2004, "Series"), createFilm("Stepford Wives", 1975, "Forbes")]),
        createTier(2, "LEVEL 2: ROT", [createFilm("Blue Velvet", 1986, "Lynch"), createFilm("American Beauty", 1999, "Mendes"), createFilm("Virgin Suicides", 1999, "Coppola"), createFilm("Revolutionary Road", 2008, "Mendes"), createFilm("Little Children", 2006, "Field")]),
        createTier(3, "LEVEL 3: WEIRD", [createFilm("Dogtooth", 2009, "Lanthimos"), createFilm("Vivarium", 2019, "Finnegan"), createFilm("Pleasantville", 1998, "Ross"), createFilm("The Burbs", 1989, "Dante"), createFilm("Poltergeist", 1982, "Hooper")]),
        createTier(4, "LEVEL 4: DARK", [createFilm("Serial Mom", 1994, "Waters"), createFilm("Happiness", 1998, "Solondz"), createFilm("Parasite", 2019, "Bong"), createFilm("Us", 2019, "Peele"), createFilm("Fright Night", 1985, "Holland")])
    ]
};

const FOURTH_WALL: CuratedList = {
    id: 'fourth', title: "BREAKING 4TH WALL", subtitle: "Meta Narratives", tiers: [
        createTier(1, "LEVEL 1: FUN", [createFilm("Ferris Bueller", 1986, "Hughes"), createFilm("Deadpool", 2016, "Miller"), createFilm("The Big Short", 2015, "McKay"), createFilm("Wayne's World", 1992, "Spheeris")]),
        createTier(2, "LEVEL 2: SMART", [createFilm("Annie Hall", 1977, "Allen"), createFilm("Fleabag", 2016, "Series"), createFilm("High Fidelity", 2000, "Frears"), createFilm("Amelie", 2001, "Jeunet")]),
        createTier(3, "LEVEL 3: DARK", [createFilm("Funny Games", 1997, "Haneke"), createFilm("Man Bites Dog", 1992, "Belvaux"), createFilm("Fight Club", 1999, "Fincher"), createFilm("Lord of War", 2005, "Niccol")]),
        createTier(4, "LEVEL 4: ART", [createFilm("Holy Motors", 2012, "Carax"), createFilm("Adaptation", 2002, "Jonze"), createFilm("8 1/2", 1963, "Fellini"), createFilm("Rubber", 2010, "Dupieux"), createFilm("Symbiopsychotaxiplasm", 1968, "Greaves")])
    ]
};

const MACHINE: CuratedList = {
    id: 'machine', title: "MAN VS MACHINE", subtitle: "Singularity", tiers: [
        createTier(1, "LEVEL 1: ACTION", [createFilm("The Terminator", 1984, "Cameron"), createFilm("I, Robot", 2004, "Proyas"), createFilm("The Matrix", 1999, "Wachowskis"), createFilm("Avengers: Age of Ultron", 2015, "Whedon"), createFilm("M3GAN", 2022, "Johnstone")]),
        createTier(2, "LEVEL 2: SENTIENCE", [createFilm("Ex Machina", 2014, "Garland"), createFilm("Her", 2013, "Jonze"), createFilm("Blade Runner", 1982, "Scott"), createFilm("Big Hero 6", 2014, "Hall"), createFilm("Robot & Frank", 2012, "Schreier")]),
        createTier(3, "LEVEL 3: PHILOSOPHY", [createFilm("2001: A Space Odyssey", 1968, "Kubrick"), createFilm("Ghost in the Shell", 1995, "Oshii"), createFilm("A.I.", 2001, "Spielberg"), createFilm("Westworld", 2016, "Series"), createFilm("Bicentennial Man", 1999, "Columbus")]),
        createTier(4, "LEVEL 4: ORIGIN", [createFilm("Metropolis", 1927, "Lang"), createFilm("Colossus", 1970, "Sargent"), createFilm("World on a Wire", 1973, "Fassbinder"), createFilm("After Yang", 2021, "Kogonada"), createFilm("Brian and Charles", 2022, "Archer")])
    ]
};

const WILD_NIGHT: CuratedList = {
    id: 'wild', title: "ONE WILD NIGHT", subtitle: "Before Sunrise", tiers: [
        createTier(1, "LEVEL 1: CHAOS", [createFilm("The Hangover", 2009, "Phillips"), createFilm("Superbad", 2007, "Mottola"), createFilm("Die Hard", 1988, "McTiernan"), createFilm("Project X", 2012, "Nourizadeh")]),
        createTier(2, "LEVEL 2: FLOW", [createFilm("After Hours", 1985, "Scorsese"), createFilm("Victoria", 2015, "Schipper"), createFilm("Before Sunrise", 1995, "Linklater"), createFilm("Dazed and Confused", 1993, "Linklater")]),
        createTier(3, "LEVEL 3: DRAMA", [createFilm("La Notte", 1961, "Antonioni"), createFilm("Cleo from 5 to 7", 1962, "Varda"), createFilm("Locke", 2013, "Knight"), createFilm("Oslo, August 31st", 2011, "Trier")]),
        createTier(4, "LEVEL 4: INDIE", [createFilm("Tangerine", 2015, "Baker"), createFilm("Good Time", 2017, "Safdie"), createFilm("Mikey and Nicky", 1976, "May"), createFilm("Who's Afraid of Virginia Woolf?", 1966, "Nichols")])
    ]
};

const SWASHBUCKLING: CuratedList = {
    id: 'adventure', title: "SWASHBUCKLING", subtitle: "Sword & Adventure", tiers: [
        createTier(1, "LEVEL 1: FUN", [createFilm("Pirates of the Caribbean", 2003, "Verbinski"), createFilm("The Mask of Zorro", 1998, "Campbell"), createFilm("The Mummy", 1999, "Sommers")]),
        createTier(2, "LEVEL 2: CLASSIC", [createFilm("The Princess Bride", 1987, "Reiner"), createFilm("Crouching Tiger, Hidden Dragon", 2000, "Lee"), createFilm("The Three Musketeers", 1973, "Lester")]),
        createTier(3, "LEVEL 3: GOLDEN AGE", [createFilm("Adventures of Robin Hood", 1938, "Curtiz"), createFilm("Captain Blood", 1935, "Curtiz"), createFilm("The Duellists", 1977, "Scott"), createFilm("The Mark of Zorro", 1940, "Mamoulian")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("Master and Commander", 2003, "Weir"), createFilm("Cutthroat Island", 1995, "Harlin"), createFilm("Scaramouche", 1952, "Sidney"), createFilm("Black Sails", 2014, "Series")])
    ]
};

const MAFIA: CuratedList = {
    id: 'mafia', title: "MAFIA & MOB", subtitle: "The Family Business", tiers: [
        createTier(1, "LEVEL 1: RISE", [createFilm("The Untouchables", 1987, "De Palma"), createFilm("Scarface", 1983, "De Palma"), createFilm("Donnie Brasco", 1997, "Newell"), createFilm("The Departed", 2006, "Scorsese")]),
        createTier(2, "LEVEL 2: FAMILY", [createFilm("The Godfather", 1972, "Coppola"), createFilm("The Godfather II", 1974, "Coppola"), createFilm("Goodfellas", 1990, "Scorsese"), createFilm("Casino", 1995, "Scorsese")]),
        createTier(3, "LEVEL 3: SAGA", [createFilm("Once Upon a Time in America", 1984, "Leone"), createFilm("The Irishman", 2019, "Scorsese"), createFilm("Heat", 1995, "Mann"), createFilm("Carlito's Way", 1993, "De Palma")]),
        createTier(4, "LEVEL 4: DEEP", [createFilm("Gomorrah", 2008, "Garrone"), createFilm("City of God", 2002, "Meirelles"), createFilm("Eastern Promises", 2007, "Cronenberg"), createFilm("Miller's Crossing", 1990, "Coens"), createFilm("Road to Perdition", 2002, "Mendes"), createFilm("The Sopranos", 1999, "Series")])
    ]
};

const STOP_MOTION: CuratedList = {
    id: 'stopmotion', title: "STOP MOTION", subtitle: "Handmade Magic", tiers: [
        createTier(1, "LEVEL 1: POPULAR", [createFilm("The Nightmare Before Christmas", 1993, "Selick"), createFilm("Chicken Run", 2000, "Park"), createFilm("Corpse Bride", 2005, "Burton"), createFilm("Wallace & Gromit", 2005, "Park")]),
        createTier(2, "LEVEL 2: ARTISTRY", [createFilm("Coraline", 2009, "Selick"), createFilm("Fantastic Mr. Fox", 2009, "Anderson"), createFilm("Kubo and the Two Strings", 2016, "Knight"), createFilm("ParaNorman", 2012, "Fell")]),
        createTier(3, "LEVEL 3: MATURE", [createFilm("Mary and Max", 2009, "Elliot"), createFilm("Isle of Dogs", 2018, "Anderson"), createFilm("Anomalisa", 2015, "Kaufman")]),
        createTier(4, "LEVEL 4: SURREAL", [createFilm("Alice", 1988, "Svankmajer"), createFilm("Mad God", 2021, "Tippett"), createFilm("The House", 2022, "Series"), createFilm("The Wolf House", 2018, "Cociña")])
    ]
};

const ROMCOMS: CuratedList = {
    id: 'romcoms', title: "90s ROM-COMS", subtitle: "The Golden Era", tiers: [
        createTier(1, "LEVEL 1: ICONIC", [createFilm("Pretty Woman", 1990, "Marshall"), createFilm("10 Things I Hate About You", 1999, "Junger"), createFilm("Clueless", 1995, "Heckerling"), createFilm("There's Something About Mary", 1998, "Farrelly")]),
        createTier(2, "LEVEL 2: STANDARD", [createFilm("Notting Hill", 1999, "Michell"), createFilm("When Harry Met Sally", 1989, "Reiner"), createFilm("Sleepless in Seattle", 1993, "Ephron"), createFilm("You've Got Mail", 1998, "Ephron")]),
        createTier(3, "LEVEL 3: TWIST", [createFilm("My Best Friend's Wedding", 1997, "Hogan"), createFilm("Four Weddings and a Funeral", 1994, "Newell"), createFilm("Jerry Maguire", 1996, "Crowe"), createFilm("As Good as It Gets", 1997, "Brooks")]),
        createTier(4, "LEVEL 4: DEEP DIVE", [createFilm("While You Were Sleeping", 1995, "Turteltaub"), createFilm("Reality Bites", 1994, "Stiller"), createFilm("Chasing Amy", 1997, "Smith"), createFilm("Singles", 1992, "Crowe")])
    ]
};

const SLOW_CINEMA: CuratedList = {
    id: 'slow', title: "SLOW CINEMA", subtitle: "The Art of Time", tiers: [
        createTier(1, "LEVEL 1: PAUSE", [createFilm("Nomadland", 2020, "Zhao"), createFilm("Paterson", 2016, "Jarmusch"), createFilm("Gerry", 2002, "Van Sant"), createFilm("Perfect Days", 2023, "Wenders")]),
        createTier(2, "LEVEL 2: SILENCE", [createFilm("Columbus", 2017, "Kogonada"), createFilm("Taste of Cherry", 1997, "Kiarostami"), createFilm("Yi Yi", 2000, "Yang"), createFilm("Once Upon a Time in Anatolia", 2011, "Ceylan")]),
        createTier(3, "LEVEL 3: DURATION", [createFilm("Jeanne Dielman", 1975, "Akerman"), createFilm("Elephant", 2003, "Van Sant"), createFilm("Tropical Malady", 2004, "Weerasethakul"), createFilm("Uncle Boonmee", 2010, "Weerasethakul")]),
        createTier(4, "LEVEL 4: ETERNITY", [createFilm("Satantango", 1994, "Tarr"), createFilm("Stalker", 1979, "Tarkovsky"), createFilm("Goodbye, Dragon Inn", 2003, "Tsai"), createFilm("A Ghost Story", 2017, "Lowery"), createFilm("Sleep Has Her House", 2017, "Barley")])
    ]
};

const FEMALE_GAZE: CuratedList = {
    id: 'female', title: "THE FEMALE GAZE", subtitle: "A Different Perspective", tiers: [
        createTier(1, "LEVEL 1: CONNECTION", [createFilm("Lost in Translation", 2003, "Coppola"), createFilm("Lady Bird", 2017, "Gerwig"), createFilm("Little Women", 2019, "Gerwig"), createFilm("Booksmart", 2019, "Wilde")]),
        createTier(2, "LEVEL 2: DESIRE", [createFilm("The Piano", 1993, "Campion"), createFilm("Portrait of a Lady on Fire", 2019, "Sciamma"), createFilm("Cleo from 5 to 7", 1962, "Varda"), createFilm("Fish Tank", 2009, "Arnold")]),
        createTier(3, "LEVEL 3: BODY & FORM", [createFilm("Beau Travail", 1999, "Denis"), createFilm("Titane", 2021, "Ducournau"), createFilm("The Power of the Dog", 2021, "Campion"), createFilm("Raw", 2016, "Ducournau")]),
        createTier(4, "LEVEL 4: EXPERIMENTAL", [createFilm("Daisies", 1966, "Chytilova"), createFilm("The Souvenir", 2019, "Hogg"), createFilm("Meshes of the Afternoon", 1943, "Deren"), createFilm("Jeanne Dielman", 1975, "Akerman"), createFilm("Wanda", 1970, "Loden")])
    ]
};

const GATEWAY_ANIME: CuratedList = {
  id: 'anime_gateway', title: "GATEWAY ANIME", subtitle: "Start Here", tiers: [
    createTier(1, "LEVEL 1: SHONEN", [createFilm("My Hero Academia", 2016, "Series"), createFilm("One Punch Man", 2015, "Series"), createFilm("Mob Psycho 100", 2016, "Series"), createFilm("Demon Slayer", 2019, "Series")]),
    createTier(2, "LEVEL 2: THRILLER", [createFilm("Death Note", 2006, "Series"), createFilm("Ergo Proxy", 2006, "Series"), createFilm("Psycho-Pass", 2012, "Series"), createFilm("Steins;Gate", 2011, "Series")]),
    createTier(3, "LEVEL 3: THE ABYSS", [createFilm("Made in Abyss", 2017, "Series"), createFilm("Serial Experiments Lain", 1998, "Series"), createFilm("Neon Genesis Evangelion", 1995, "Series"), createFilm("Attack on Titan", 2013, "Series")]),
    createTier(4, "LEVEL 4: CLASSICS", [createFilm("Cowboy Bebop", 1998, "Series"), createFilm("Fullmetal Alchemist: Brotherhood", 2009, "Series"), createFilm("Samurai Champloo", 2004, "Series"), createFilm("Trigun", 1998, "Series")])
  ]
};

// --- EXPORTS ---

export const getListsContainingFilm = (filmId: string): {id: string, title: string}[] => {
  const hits: {id: string, title: string}[] = [];
  ARCHIVE_CATEGORIES.forEach(cat => {
    cat.lists.forEach(list => {
      let found = false;
      list.tiers.forEach(t => { if(t.films.some(f => f.id === filmId)) found = true; });
      if(found) hits.push({id: list.id, title: list.title});
    });
  });
  return hits;
};

export const BADGE_TITLES: Record<string, string> = {
  kubrick: "THE MONOLITH", tarantino: "THE BRIDE", kurosawa: "THE SEVEN", hitchcock: "THE VOYEUR", scorsese: "THE WISEGUY",
  spielberg: "THE E.T.", startrek: "FLEET ADMIRAL", starwars: "JEDI MASTER", bergman: "KNIGHT", lynch: "DREAMER",
  fincher: "ARCHITECT", nolan: "TIME LORD", ridley: "REPLICANT", french: "OUTSIDER", korean: "AVENGER", cyberpunk: "BLADE RUNNER", body: "NEW FLESH",
  pta: "MAGNOLIA", wes: "DOLLHOUSE", fellini: "8 1/2", haneke: "FUNNY MAN", almodovar: "MATADOR", vontrier: "ANTICHRIST", lang: "M",
  varda: "CLEO", ozu: "TOKYO", bong: "HOST", villeneuve: "DUNE", carpenter: "SHAPE", leone: "BLONDIE", wilder: "HOT", cuaron: "GRAVITY",
  miyazaki: "SPIRITED", wkw: "ROMANTIC", tarkovsky: "POET", kon: "DREAMER", coen: "DUDE",
  tracks: "CONDUCTOR", dinner: "CHEF", isolation: "SURVIVOR", heist: "MASTERMIND", suburban: "NEIGHBOR", fourth: "NARRATOR", machine: "CYBORG", wild: "PARTY ANIMAL",
  anime_gateway: "OTAKU", female: "THE GAZE", slow: "OBSERVER", romcoms: "HEARTTHROB", stopmotion: "PUPPET MASTER", mafia: "DON", adventure: "PIRATE", timeloop: "TIME LORD", folk: "MAY QUEEN", mind: "ARCHITECT"
};

export const ARCHIVE_CATEGORIES: ListCategory[] = [
  { 
    title: "THE GRANDMASTERS", 
    lists: [
      KUBRICK, TARANTINO, HITCHCOCK, SCORSESE, SPIELBERG, KUROSAWA, 
      LYNCH, PT_ANDERSON, FINCHER, WES_ANDERSON, NOLAN, RIDLEY_SCOTT, 
      BERGMAN, FELLINI, HANEKE, ALMODOVAR, VON_TRIER, FRITZ_LANG, 
      VARDA, OZU, BONG, VILLENEUVE, CARPENTER, LEONE, WILDER, CUARON,
      MIYAZAKI, WONG_KAR_WAI, TARKOVSKY, SATOSHI_KON, COEN_BROTHERS
    ] 
  },
  { title: "GENRES & UNIVERSES", lists: [STAR_TREK, STAR_WARS, SPACE_OPERA, CYBERPUNK, BODY_HORROR, MIND_BENDERS, FOLK_HORROR, TIME_LOOPS, SWASHBUCKLING, MAFIA, STOP_MOTION, ROMCOMS, SLOW_CINEMA, FEMALE_GAZE, GATEWAY_ANIME] },
  { title: "MOVEMENTS & WORLD", lists: [FRENCH_WAVE, KOREAN_WAVE, ITALIAN_NEO, IRANIAN, NORDIC, USSR, TURKISH] },
  { title: "THEMATIC", lists: [TRACKS, DINNER, ISOLATION, HEIST, SUBURBAN, FOURTH_WALL, MACHINE, WILD_NIGHT] }
];

export const getAllFilms = (): Film[] => {
  const allFilms: Record<string, Film> = {};
  ARCHIVE_CATEGORIES.forEach(cat => {
    cat.lists.forEach(list => {
      list.tiers.forEach(tier => {
        tier.films.forEach(film => {
          if (!allFilms[film.id]) allFilms[film.id] = film;
        });
      });
      if (list.seriesTiers) {
        list.seriesTiers.forEach(tier => {
           tier.films.forEach(film => {
              if (!allFilms[film.id]) allFilms[film.id] = film;
           });
        });
      }
    });
  });
  return Object.values(allFilms);
};