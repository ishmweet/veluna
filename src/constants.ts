export interface GenreInfo {
  id: string;
  label: string;
  tagline: string;
  artists: string[];
  genreTerms: string[];
  exclusions?: string[];
  keywords: string[];
  compiledExclusions?: RegExp | null;
  compiledArtists?: RegExp | null;
  compiledTerms?: RegExp | null;
}

export const GENRES: GenreInfo[] = [
  {
    id: 'hiphop',
    label: 'Hip-Hop / Rap',
    tagline: 'Beats, bars & street rhythms',
    artists: [
      'kendrick lamar', 'drake', 'kanye west', 'eminem', '21 savage', 'travis scott',
      'j. cole', 'j cole', 'future', 'metro boomin', 'playboi carti', 'lil uzi vert',
      'juice wrld', 'polo g', 'gunna', 'offset', 'quavo', 'dababy', 'roddy ricch',
      'pooh shiesty', 'moneybagg yo', 'don toliver', 'asap rocky', 'cardi b',
      'nicki minaj', 'lil baby', 'lil durk', 'young thug', 'jack harlow',
      'central cee', 'dave', 'stormzy', 'ice spice', 'pop smoke', 'tyler the creator',
      'mac miller', 'trippie redd', 'xxxtentacion', 'kodak black', 'denzel curry',
      'nle choppa', 'youngboy never broke again', 'nba youngboy', 'lil wayne',
      'snoop dogg', '50 cent', 'tupac', '2pac', 'notorious b.i.g.', 'biggie smalls',
      'jay-z', 'nas', 'dr. dre', 'ice cube', 'outkast', 'lupe fiasco', 'chance the rapper',
      'logic', 'joyner lucas', 'jid', 'earthgang', 'ski mask the slump god',
      'vince staples', 'pusha t', 'denzel curry', 'asap ferg', 'amine', 'sheck wes'
    ],
    genreTerms: [
      'hip-hop', 'hip hop', 'freestyle cypher', 'drill rap', 'trap beat', 'rap music',
      'boom bap', 'boombap', 'rap freestyle', 'hiphop mix', 'rap cypher'
    ],
    exclusions: ['pop punk', 'k-pop', 'kpop', 'piano sonata', 'smooth jazz', 'phonk drift'],
    keywords: []
  },
  {
    id: 'kpop',
    label: 'K-Pop',
    tagline: 'Seoul rhythms & idol anthems',
    artists: [
      'bts', 'bangtan', 'blackpink', 'twice', 'exo', 'stray kids', 'seventeen',
      'nct', 'nct 127', 'nct dream', 'nct u', 'wayv', 'red velvet', 'aespa', 'ive',
      'newjeans', 'new jeans', 'itzy', 'le sserafim', 'lesserafim', 'illit',
      'babymonster', 'enhypen', 'tomorrow x together', 'txt', 'ateez', 'the boyz',
      'monsta x', 'treasure', 'got7', 'shinee', 'bigbang', 'big bang', '2ne1',
      'super junior', 'superm', 'girls generation', 'snsd', 'iu', 'taeyeon',
      'baekhyun', 'jungkook', 'jimin', 'agust d', 'suga', 'j-hope', 'jhope',
      'g-dragon', 'gdragon', 'jennie', 'jisoo', 'lisa', 'rosé', 'mamamoo',
      'hwasa', 'stayc', 'nmixx', 'kep1er', 'everglow', 'dreamcatcher', 'loona',
      'artms', 'loossemble', 'chuu', 'clc', '(g)i-dle', 'gidle', 'iz*one', 'izone',
      'sf9', 'pentagon', 'victon', 'cravity', 'oneus', 'p1harmony', 'riize',
      'tws', 'boynextdoor', 'zerobaseone', 'zb1', 'xikers', 'kiss of life',
      'triple s', 'triples', 'katseye', 'vcha', 'day6', 'xdinary heroes', 'the rose',
      'akmu', 'bol4', 'chungha', 'sunmi', 'hyuna', 'taemin', 'wonho', 'kang daniel',
      'woodz', 'jeon somi', 'somi', 'psy', 'boa', 'tvxq', 'highlight', 'btob',
      'wanna one', 'astro', 'wjsn', 'cosmic girls', 'fromis_9', 'fromis 9',
      'woo!ah!', 'cignature', 'purple kiss', 'billlie', 'h1-key',
      'kwon eun bi', 'jo yuri', 'yena', 'choi yena', 'heize'
    ],
    genreTerms: [
      'kpop', 'k-pop', 'k pop', 'korean pop', 'hallyu', 'kpop dance', 'kpop comeback'
    ],
    exclusions: ['conan gray', 'don toliver', 'the five stairsteps', 'five stairsteps', 'the midnight', 'kordhell'],
    keywords: []
  },
  {
    id: 'pop',
    label: 'Pop',
    tagline: 'Chart toppers & infectious melodies',
    artists: [
      'taylor swift', 'ariana grande', 'billie eilish', 'the weeknd', 'olivia rodrigo',
      'dua lipa', 'harry styles', 'justin bieber', 'ed sheeran', 'selena gomez',
      'shawn mendes', 'camila cabello', 'the chainsmokers', 'imagine dragons',
      'maroon 5', 'conan gray', 'chappell roan', 'sabrina carpenter', 'katy perry',
      'lady gaga', 'bruno mars', 'tate mcrae', 'miley cyrus', 'charlie puth',
      'halsey', 'lorde', 'sia', 'sam smith', 'adele', 'rihanna', 'beyonce',
      'britney spears', 'madonna', 'kesha', 'bebe rexha', 'alessia cara',
      'meghan trainor', 'ava max', 'rita ora', 'troye sivan', 'shakira',
      'kelly clarkson', 'pink', 'p!nk', 'carly rae jepsen',
      'ellie goulding', 'jason derulo', 'pitbull', 'keshi', 'lauv', 'lizzo'
    ],
    genreTerms: [
      'pop music', 'pop hit', 'pop anthem', 'dance pop', 'electropop',
      'teen pop', 'pop song', 'mainstream pop', 'synth pop anthem'
    ],
    exclusions: ['k-pop', 'kpop', 'heavy metal', 'death metal', 'drift phonk'],
    keywords: []
  },
  {
    id: 'synthwave',
    label: 'Synthwave',
    tagline: 'Retro-futuristic neon dreams',
    artists: [
      'kavinsky', 'carpenter brut', 'the midnight', 'gunship', 'timecop1983',
      'fm-84', 'fm 84', 'perturbator', 'dynatron', 'dance with the dead',
      'scandroid', 'mitch murder', 'com truse', 'lazerhawk', 'trevor something',
      'mega drive', 'dan terminus', 'robert parker', 'waveshaper', 'miami nights 1984',
      'droid bishop', 'le matos', 'power glove', 'volkor x', 'futurecop!'
    ],
    genreTerms: [
      'synthwave', 'retrowave', 'outrun', 'darksynth', 'dreamwave', 'retro wave',
      '80s synth', 'cyberpunk synth', 'synthwave mix', 'retrowave mix', 'spacewave'
    ],
    exclusions: ['hip-hop', 'trap beat', 'k-pop'],
    keywords: []
  },
  {
    id: 'lofi',
    label: 'Lo-Fi',
    tagline: 'Warm tape hiss & chill study beats',
    artists: [
      'nujabes', 'chilledcow', 'lofi girl', 'potsu', 'kupla', 'jinsang', 'saib',
      'idealism', 'bsd.u', 'wun two', 'elijah who', 'tomppabeats', 'swum',
      'birocratic', 'in love with a ghost', 'sarcastic sounds', 'eevee', 'sopico',
      'flovry', 'tender spring', 'mell-ø', 'casiio', 'mondoloops', 'kreaem'
    ],
    genreTerms: [
      'lofi', 'lo-fi', 'lo fi', 'chillhop', 'chill beats', 'study beats',
      'lofi beats', 'lofi hip hop', 'relaxing beats', 'sleep beats', 'coffee beats',
      'cozy beats', 'mellow beats', 'lofi study', 'chill study music'
    ],
    exclusions: ['heavy metal', 'deathcore', 'hardstyle', 'drift phonk'],
    keywords: []
  },
  {
    id: 'rock',
    label: 'Rock & Metal',
    tagline: 'Overdriven guitars & heavy anthems',
    artists: [
      'linkin park', 'nirvana', 'green day', 'foo fighters', 'system of a down',
      'metallica', 'ac/dc', 'acdc', 'guns n roses', 'guns n\' roses', 'queen',
      'led zeppelin', 'arctic monkeys', 'radiohead', 'muse', 'twenty one pilots',
      'bring me the horizon', 'bmth', 'slipknot', 'fall out boy', 'my chemical romance',
      'paramore', 'blink-182', 'blink 182', 'deftones', 'red hot chili peppers',
      'rhcp', 'iron maiden', 'black sabbath', 'pink floyd', 'the beatles',
      'the rolling stones', 'aerosmith', 'bon jovi', 'pearl jam', 'soundgarden',
      'alice in chains', 'korn', 'limp bizkit', 'rage against the machine',
      'ratm', 'avenged sevenfold', 'a7x', 'three days grace', 'skillet',
      'shinedown', 'disturbed', 'papa roach', 'sum 41', 'the offspring',
      'weezer', 'the killers', 'the strokes', 'oasis', 'coldplay', 'u2',
      'audioslave', 'evanescence', 'breaking benjamin', 'rise against', 'seether'
    ],
    genreTerms: [
      'alternative rock', 'hard rock', 'heavy metal', 'punk rock', 'indie rock',
      'grunge rock', 'rock band', 'rock anthem', 'death metal', 'metalcore',
      'deathcore', 'nu metal', 'pop punk', 'post-hardcore', 'post-grunge',
      'progressive metal', 'thrash metal'
    ],
    exclusions: ['k-pop', 'kpop', 'amapiano', 'reggaeton'],
    keywords: []
  },
  {
    id: 'rnb',
    label: 'R&B / Soul',
    tagline: 'Smooth grooves & heartfelt soul',
    artists: [
      'frank ocean', 'sza', 'daniel caesar', 'jorja smith', 'h.e.r.', 'bryson tiller',
      'partynextdoor', 'brent faiyaz', 'khalid', 'usher', 'alicia keys', 'john legend',
      'maxwell', 'erykah badu', 'd\'angelo', 'summer walker', 'kehlani', 'snoh aalegra',
      'giveon', 'chris brown', 'miguel', 'tory lanez', 'trey songz', 'ne-yo', 'neyo',
      'musiq soulchild', 'anthony hamilton', 'lauryn hill', 'mariah carey',
      'toni braxton', 'boyz ii men', 'jhene aiko', 'chlöe', 'victoria monet',
      'masego', 'lucky daye', 'sir', 'ravyn lenae', 'cleo sol', 'arizona zervas',
      'the five stairsteps', 'five stairsteps', 'stevie wonder', 'marvin gaye', 'sam cooke', 'aretha franklin'
    ],
    genreTerms: [
      'r&b', 'rnb', 'contemporary r&b', 'neo soul', 'neo-soul', 'soul music',
      'rhythm and blues', 'motown classics', 'slow jams', 'r&b soul'
    ],
    exclusions: ['k-pop', 'kpop', 'heavy metal', 'drift phonk'],
    keywords: []
  },
  {
    id: 'edm',
    label: 'EDM / Dance',
    tagline: 'Club bangers & festival drops',
    artists: [
      'martin garrix', 'david guetta', 'tiesto', 'avicii', 'marshmello', 'skrillex',
      'deadmau5', 'flume', 'diplo', 'zedd', 'alan walker', 'kygo', 'calvin harris',
      'illenium', 'hardwell', 'subtronics', 'fred again', 'swedish house mafia',
      'axwell', 'ingrosso', 'alesso', 'afrojack', 'dj snake', 'steve aoki',
      'kaskade', 'porter robinson', 'madeon', 'galantis', 'major lazer', 'rezz',
      'excision', 'san holo', 'gryffin', 'said the sky', 'rl grime', 'knock2',
      'isoknock', 'sub focus', 'dimension', 'pendulum', 'chase & status', 'disclosure'
    ],
    genreTerms: [
      'electronic dance music', 'edm festival', 'future bass', 'dubstep drop',
      'drum and bass', 'drum & bass', 'dnb track', 'tech house', 'deep house mix',
      'progressive house', 'big room house', 'trance music', 'hardstyle mix',
      'melodic bass', 'festival mix', 'club banger'
    ],
    exclusions: ['lofi hip hop', 'acoustic piano', 'orchestra'],
    keywords: []
  },
  {
    id: 'jazz',
    label: 'Jazz & Blues',
    tagline: 'Improvisations, brass & acoustic swing',
    artists: [
      'miles davis', 'john coltrane', 'bill evans', 'thelonious monk', 'duke ellington',
      'charlie parker', 'herbie hancock', 'wynton marsalis', 'louis armstrong',
      'nina simone', 'chet baker', 'dave brubeck', 'stan getz', 'art blakey',
      'charles mingus', 'sonny rollins', 'ella fitzgerald', 'billie holiday',
      'sarah vaughan', 'oscar peterson', 'wes montgomery', 'chick corea',
      'kamasi washington', 'robert glasper', 'norah jones', 'diana krall',
      'al jarreau', 'george benson', 'ahmad jamal', 'cannonball adderley'
    ],
    genreTerms: [
      'smooth jazz', 'bebop', 'hard bop', 'jazz fusion', 'cool jazz', 'jazz trio',
      'jazz quartet', 'big band jazz', 'acoustic jazz', 'jazz standard', 'jazz ballad',
      'jazz improvisation', 'jazz club'
    ],
    exclusions: ['heavy metal', 'drift phonk', 'drill rap'],
    keywords: []
  },
  {
    id: 'classical',
    label: 'Classical',
    tagline: 'Symphonies, concertos & piano sonatas',
    artists: [
      'ludwig van beethoven', 'beethoven', 'wolfgang amadeus mozart', 'mozart',
      'johann sebastian bach', 'j.s. bach', 'frederic chopin', 'chopin',
      'claude debussy', 'debussy', 'johannes brahms', 'brahms', 'franz schubert',
      'schubert', 'antonio vivaldi', 'vivaldi', 'george frideric handel', 'handel',
      'franz liszt', 'liszt', 'pyotr ilyich tchaikovsky', 'tchaikovsky',
      'sergei rachmaninoff', 'rachmaninoff', 'gustav mahler', 'mahler',
      'richard wagner', 'wagner', 'felix mendelssohn', 'mendelssohn',
      'giuseppe verdi', 'verdi', 'giacomo puccini', 'puccini', 'antonin dvorak',
      'dvorak', 'maurice ravel', 'ravel', 'igor stravinsky', 'stravinsky',
      'johann strauss', 'strauss', 'camille saint-saens', 'edvard grieg', 'grieg',
      'ludovico einaudi', 'einaudi', 'max richter', 'yiruma', 'yo-yo ma', 'lang lang'
    ],
    genreTerms: [
      'symphony orchestra', 'piano sonata', 'violin concerto', 'piano concerto',
      'cello suite', 'string quartet', 'philharmonic orchestra', 'nocturne op',
      'prelude op', 'valse op', 'classical piano', 'classical orchestra',
      'classical composition', 'concerto in', 'sonata in', 'nocturne in'
    ],
    exclusions: ['rap', 'hip-hop', 'phonk', 'edm', 'k-pop'],
    keywords: []
  },
  {
    id: 'afrobeats',
    label: 'Afrobeats',
    tagline: 'West African rhythms & Amapiano basslines',
    artists: [
      'burna boy', 'wizkid', 'davido', 'rema', 'omah lay', 'ckay', 'tems',
      'ayra starr', 'fireboy dml', 'asake', 'asaké', 'kizz daniel', 'oxlade',
      'ruger', 'victony', 'adekunle gold', 'joeboy', 'shallipopi', 'tiwa savage',
      'buju', 'bnxn', 'fela kuti', 'yemi alade', 'diamond platnumz', 'flavour',
      'master kg', 'musa keys', 'focalistic', 'kabza de small', 'dj maphorisa', 'tyla'
    ],
    genreTerms: [
      'afrobeats', 'afrobeat', 'amapiano', 'afro-fusion', 'afropop',
      'naija music', 'afro pop mix', 'amapiano mix', 'afrobeats mix'
    ],
    exclusions: ['heavy metal', 'death metal', 'synthwave'],
    keywords: []
  },
  {
    id: 'latin',
    label: 'Latin',
    tagline: 'Reggaeton heat & tropical percussion',
    artists: [
      'bad bunny', 'j balvin', 'maluma', 'ozuna', 'daddy yankee', 'nicky jam',
      'jhayco', 'jhay cortez', 'anuel aa', 'karol g', 'rosalia', 'rosalía',
      'shakira', 'romeo santos', 'rauw alejandro', 'peso pluma', 'feid',
      'myke towers', 'sech', 'becky g', 'natti natasha', 'enrique iglesias',
      'ricky martin', 'luis fonsi', 'marc anthony', 'prince royce', 'calle 13',
      'residente', 'bizarrap', 'quevedo', 'morat', 'camilo', 'sebastian yatra',
      'fuerza regida', 'grupo frontera', 'junior h', 'natanael cano'
    ],
    genreTerms: [
      'reggaeton', 'bachata', 'salsa music', 'cumbia', 'corridos tumbados',
      'musica latina', 'latin pop', 'latin urban', 'urbano latino', 'dembow'
    ],
    exclusions: ['k-pop', 'kpop', 'heavy metal', 'death metal'],
    keywords: []
  },
  {
    id: 'slowed',
    label: 'Slowed + Reverb',
    tagline: 'Atmospheric pitched-down night drives',
    artists: [],
    genreTerms: [
      'slowed and reverb', 'slowed + reverb', 'slowed reverb', 'slowed & reverb',
      'slowed + reverberated', 'slowed down + reverb', 'slowed down reverb',
      'slowed to perfection', 'nightcore slowed', 'reverb slowed', 'slowed reverbed'
    ],
    exclusions: [],
    keywords: []
  },
  {
    id: 'phonk',
    label: 'Phonk',
    tagline: 'Memphis cowbells & drift basslines',
    artists: [
      'kordhell', 'ghostemane', 'night lovell', 'playaphonk', 'hxvrmxn', 'gpx',
      'lxst cxntury', 'dxrk', 'interworld', 'hensonn', 'pharmacist', 'shadxwbxrn',
      'plxntydxrk', 'scarlxrd', 'yatashigang', 'mitch murder', 'freddie dredd',
      'haartx', 'cowbell cult', 'sxmpra', 'cursed', 'prxjek'
    ],
    genreTerms: [
      'drift phonk', 'aggressive phonk', 'gym phonk', 'dark phonk',
      'brazilian phonk', 'memphis phonk', 'phonk music', 'phonk drift',
      'phonk mix', 'cowbell phonk'
    ],
    exclusions: ['imagine dragons', 'conan gray', 'taylor swift'],
    keywords: []
  },
];

function buildRegex(items?: string[]): RegExp | null {
  if (!items || items.length === 0) return null;
  const sorted = [...items].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(^|[^\\p{L}\\p{N}])(?:${escaped})($|[^\\p{L}\\p{N}])`, 'ui');
}

GENRES.forEach(g => {
  g.keywords = Array.from(new Set([...g.artists, ...g.genreTerms]));
  g.compiledExclusions = buildRegex(g.exclusions);
  g.compiledArtists = buildRegex(g.artists);
  g.compiledTerms = buildRegex(g.genreTerms);
});

function testBoundaryMatch(source: string, target: string): boolean {
  if (!source || !target) return false;
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'ui');
  return regex.test(source);
}

export function matchGenreTrack(
  track: { title?: string; artist?: string },
  genre: GenreInfo
): boolean {
  if (!track) return false;
  const title = (track.title || '').trim().toLowerCase();
  const artist = (track.artist || '').trim().toLowerCase();
  if (!title && !artist) return false;
  const fullText = `${title} ${artist}`.trim();

  if (genre.compiledExclusions && genre.compiledExclusions.test(fullText)) {
    return false;
  }

  if (artist && genre.compiledArtists && genre.compiledArtists.test(artist)) {
    return true;
  }

  if (
    title &&
    genre.compiledArtists &&
    (title.includes('-') || title.includes('feat') || title.includes('ft.') || title.includes('prod')) &&
    genre.compiledArtists.test(title)
  ) {
    return true;
  }

  if (title && genre.compiledTerms && genre.compiledTerms.test(title)) {
    return true;
  }

  return false;
}

export function matchGenreKeywords(text: string, keywords: string[]): boolean {
  if (!text || !keywords || keywords.length === 0) return false;
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (testBoundaryMatch(lower, kw)) {
      return true;
    }
  }
  return false;
}
