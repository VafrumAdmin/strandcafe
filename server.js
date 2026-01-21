const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// JSON Body Parser für POST Requests
app.use(express.json());

// Secret Key für API-Updates (sollte in .env sein, hier als Beispiel)
const API_SECRET = process.env.API_SECRET || 'strandstuebchen-geheim-2024';

// Pfad zur daily.json Datei
const DAILY_DATA_PATH = path.join(__dirname, 'data', 'daily.json');

// Helper: Daily Data lesen
const readDailyData = () => {
  try {
    const data = fs.readFileSync(DAILY_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Fallback wenn Datei nicht existiert
    return {
      tagesgericht: { gericht1: "Wurstgulasch", gericht2: "Jägerschnitzel", updatedAt: null },
      sonderhinweis: { aktiv: false, text: "", typ: "info", updatedAt: null },
      oeffnungszeiten_override: { aktiv: false, datum: null, von: null, bis: null, geschlossen: false, updatedAt: null }
    };
  }
};

// Helper: Daily Data schreiben
const writeDailyData = (data) => {
  // Stelle sicher, dass der data Ordner existiert
  const dataDir = path.dirname(DAILY_DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(DAILY_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// CORS aktivieren
app.use(cors());

// Compression für alle Responses
app.use(compression());

// Helmet mit angepasster CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:"
        ],
        connectSrc: [
          "'self'",
          "https://api.open-meteo.com"
        ],
        frameSrc: [
          "'self'",
          "https://maps.google.com",
          "https://www.google.com"
        ]
      }
    }
  })
);

// Statische Dateien aus /public servieren
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// API ROUTES
// ============================================

// Menü-Daten
const menuData = {
  winter: [
    {
      name: "Soljanka 'Original'",
      price: "6,50 €",
      description: "Nach Originalrezept mit saurer Sahne, Zitrone & Toast",
      highlight: true,
      ddrOriginal: true
    },
    {
      name: "Wurstgulasch",
      price: "6,50 €",
      description: "Der Schulküchen-Klassiker: Jagdwurst, Tomatensauce, Spirelli",
      highlight: false,
      ddrOriginal: true
    },
    {
      name: "Panierte Jägerschnitzel",
      price: "7,00 €",
      description: "Mit Nudeln und Tomatensauce – wie früher",
      highlight: true,
      ddrOriginal: true
    },
    {
      name: "Tote Oma",
      price: "9,50 €",
      description: "Grützwurst auf Sauerkraut mit Salzkartoffeln",
      highlight: false,
      ddrOriginal: true
    },
    {
      name: "Kesselgulasch",
      price: "9,50 €",
      description: "Deftiges Gulasch aus dem Kessel",
      highlight: false,
      ddrOriginal: true
    },
    {
      name: "Senfeier",
      price: "6,00 €",
      description: "Klassisch mit Salzkartoffeln in feiner Senfsauce",
      highlight: false,
      ddrOriginal: true
    },
    {
      name: "Glühwein (0,2l)",
      price: "3,50 €",
      description: "Ohne Schuss. Mit Amaretto oder Rum: 4,50 €",
      highlight: false,
      ddrOriginal: false
    }
  ],
  summer: [
    { name: "Hamburger / Chickenburger", price: "6,50 €", description: "Mit Käse: 7,00 €", highlight: false },
    { name: "Hamburger XXL", price: "8,00 €", description: "Mit Käse: 8,50 €", highlight: true },
    { name: "Pommes Frites", price: "3,50 €", description: "Goldgelb & knusprig", highlight: false },
    { name: "Chili-Cheese-Pommes", price: "5,50 €", description: "Pommes mit Chili und Käsesauce", highlight: false },
    { name: "Ofenkartoffel", price: "6,50 €", description: "Mit Kräuterquark", highlight: false },
    { name: "Chickennuggets", price: "5,00 €", description: "6 Stück im Knuspermantel", highlight: false },
    { name: "Hot Dog klassisch", price: "4,00 €", description: "Im weichen Brötchen", highlight: false },
    { name: "Currywurst", price: "3,50 €", description: "Mit hausgemachter Currysauce", highlight: true },
    { name: "Bratwurst mit Brot", price: "3,50 €", description: "Frisch vom Grill", highlight: false },
    { name: "Bockwurst mit Brot", price: "3,00 €", description: "Klassiker", highlight: false },
    { name: "Paar Wiener mit Brot", price: "3,00 €", description: "Zwei Wiener Würstchen", highlight: false }
  ],
  menus: [
    { name: "Cheeseburger Menü", price: "12,00 €", description: "Burger + Pommes + 0,3L Getränk", highlight: true },
    { name: "Currywurst Menü", price: "8,50 €", description: "Curry + Pommes + 0,3L Getränk", highlight: false },
    { name: "Hot Dog Klassik Menü", price: "8,50 €", description: "Hot Dog + Pommes + 0,3L Getränk", highlight: false },
    { name: "Kids Menü", price: "7,50 €", description: "4 Nuggets + Pommes + Capri Sonne", highlight: false }
  ],
  drinks: {
    alkoholfrei: [
      { name: "Wasser", price: "2,00 €", description: "Still/Kohlensäure 0,3L | 0,5L: 3,00 €" },
      { name: "Cola, Cola Zero, Fanta, Sprite", price: "3,00 €", description: "0,3L | 0,5L: 3,50 €" },
      { name: "Saftschorle", price: "3,00 €", description: "Apfel, Orange, Zitrone 0,3L | 0,5L: 3,50 €" },
      { name: "Säfte", price: "3,50 €", description: "Apfel, Orange, Kiba, Zitrone 0,3L | 0,5L: 4,00 €" },
      { name: "Capri Sonne", price: "1,50 €", description: "Multi/Orange 0,2L" },
      { name: "Durstlöscher", price: "1,50 €", description: "Versch. Sorten 0,5L" }
    ],
    kaffee: [
      { name: "Filterkaffee (Pott)", price: "2,50 €", description: "" },
      { name: "Espresso", price: "2,50 €", description: "" },
      { name: "Caffe Crema", price: "3,00 €", description: "" },
      { name: "Cappuccino", price: "3,50 €", description: "" },
      { name: "Milchkaffee", price: "4,00 €", description: "" },
      { name: "Latte Macchiato", price: "4,50 €", description: "" },
      { name: "Kakao", price: "3,50 €", description: "" },
      { name: "Tee", price: "2,50 €", description: "Versch. Sorten" }
    ],
    alkohol: [
      { name: "Berliner Weisse", price: "4,50 €", description: "0,33L" },
      { name: "Bier", price: "3,50 €", description: "Versch. Sorten / Alkoholfrei 0,5L" },
      { name: "Schwarzbier (Porter)", price: "4,50 €", description: "0,5L" },
      { name: "Weizenbier", price: "4,50 €", description: "0,5L" },
      { name: "Sekt", price: "6,50 €", description: "Versch. Sorten 0,2L" },
      { name: "Weißwein", price: "5,50 €", description: "Versch. Sorten 0,2L" },
      { name: "Weißweinschorle", price: "5,00 €", description: "0,2L" }
    ],
    longdrinks: [
      { name: "Lillet", price: "7,00 €", description: "" },
      { name: "Aperol Spritz", price: "7,00 €", description: "" },
      { name: "Captain Morgan Cola", price: "7,00 €", description: "" },
      { name: "Havanna Club Cola", price: "7,00 €", description: "" },
      { name: "Weinbrand Cola (Futschi)", price: "7,00 €", description: "" },
      { name: "Wodka Cola", price: "7,00 €", description: "" }
    ],
    schnaps: [
      { name: "Pfefferminzlikör", price: "2,50 €", description: "2cl" },
      { name: "Obstler", price: "3,00 €", description: "2cl" },
      { name: "Ramazzotti", price: "4,50 €", description: "2cl" }
    ]
  }
};

// Kontakt- und Adressdaten
const infoData = {
  name: "Strandstübchen Neue Mühle",
  address: {
    street: "Küchenmeisterallee 33b",
    postalCode: "15711",
    city: "Königs Wusterhausen",
    country: "Deutschland"
  },
  coordinates: {
    latitude: 52.297,
    longitude: 13.645
  },
  contact: {
    phone: "+49 123 456789",
    email: "info@strandstuebchen-neuemuehle.de"
  },
  features: ["Parkplätze", "Barrierefrei"],
  website: "https://strandstuebchen-neuemuehle.de"
};

// Öffnungszeiten Default-Konfiguration (Fallback)
const defaultOpeningHours = {
  montag: { offen: false, von: null, bis: null },
  dienstag: { offen: true, von: "11:00", bis: "17:00" },
  mittwoch: { offen: true, von: "11:00", bis: "17:00" },
  donnerstag: { offen: true, von: "11:00", bis: "17:00" },
  freitag: { offen: true, von: "11:00", bis: "17:00" },
  samstag: { offen: true, von: "11:00", bis: "17:00" },
  sonntag: { offen: true, von: "11:00", bis: "17:00" }
};

// Helper: Hole aktuelle Öffnungszeiten (aus daily.json oder Default)
const getOpeningHours = () => {
  const dailyData = readDailyData();
  return dailyData.oeffnungszeiten || defaultOpeningHours;
};

// GET /api/menu - Menü-Daten
app.get('/api/menu', (req, res) => {
  const { season } = req.query;

  if (season && menuData[season]) {
    return res.json({
      season,
      items: menuData[season]
    });
  }

  res.json({
    winter: menuData.winter,
    summer: menuData.summer
  });
});

// GET /api/status - Öffnungsstatus
app.get('/api/status', (req, res) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const tagNamen = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
  const tagName = tagNamen[dayOfWeek];

  // Hole dynamische Öffnungszeiten aus daily.json
  const oeffnungszeiten = getOpeningHours();
  const todayHours = oeffnungszeiten[tagName];

  let isOpen = false;
  let nextOpen = null;
  let closesAt = null;

  if (todayHours && todayHours.offen && todayHours.von && todayHours.bis) {
    const [openHour, openMin] = todayHours.von.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.bis.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    isOpen = currentTime >= openTime && currentTime < closeTime;

    if (isOpen) {
      closesAt = todayHours.bis;
    } else if (currentTime < openTime) {
      nextOpen = todayHours.von;
    }
  }

  // Nächster Öffnungstag finden wenn heute geschlossen
  if (!isOpen && !nextOpen) {
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (dayOfWeek + i) % 7;
      const nextTagName = tagNamen[nextDayIndex];
      const nextDayHours = oeffnungszeiten[nextTagName];
      if (nextDayHours && nextDayHours.offen) {
        const tagDisplay = nextTagName.charAt(0).toUpperCase() + nextTagName.slice(1);
        nextOpen = `${tagDisplay} ${nextDayHours.von}`;
        break;
      }
    }
  }

  // Konvertiere für API-Response (kompatibel mit altem Format)
  const openingHoursForApi = {};
  Object.keys(oeffnungszeiten).forEach(tag => {
    if (tag !== 'updatedAt') {
      const dayData = oeffnungszeiten[tag];
      openingHoursForApi[tag] = dayData.offen ? { open: dayData.von, close: dayData.bis } : null;
    }
  });

  res.json({
    isOpen,
    currentDay: tagName,
    currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
    todayHours: todayHours && todayHours.offen ? `${todayHours.von} - ${todayHours.bis}` : 'Ruhetag',
    closesAt,
    nextOpen,
    openingHours: openingHoursForApi,
    oeffnungszeiten // Neues Format mit allen Details
  });
});

// GET /api/info - Kontakt/Adresse
app.get('/api/info', (req, res) => {
  res.json(infoData);
});

// ============================================
// DAILY DATA API (für Telegram Bot / n8n)
// ============================================

// GET /api/daily - Tägliche Daten (Tagesgericht, Hinweise, Öffnungszeiten-Override)
app.get('/api/daily', (req, res) => {
  const dailyData = readDailyData();

  // Prüfe ob Öffnungszeiten-Override für heute gilt
  if (dailyData.oeffnungszeiten_override.aktiv) {
    const today = new Date().toISOString().split('T')[0];
    if (dailyData.oeffnungszeiten_override.datum !== today) {
      // Override ist abgelaufen, deaktivieren
      dailyData.oeffnungszeiten_override.aktiv = false;
      writeDailyData(dailyData);
    }
  }

  res.json(dailyData);
});

// POST /api/daily/tagesgericht - Tagesgericht aktualisieren
app.post('/api/daily/tagesgericht', (req, res) => {
  const { secret, gericht1, gericht2 } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();
  dailyData.tagesgericht = {
    gericht1: gericht1 || dailyData.tagesgericht.gericht1,
    gericht2: gericht2 || '',
    updatedAt: new Date().toISOString()
  };

  writeDailyData(dailyData);
  res.json({ success: true, tagesgericht: dailyData.tagesgericht });
});

// POST /api/daily/hinweis - Sonderhinweis setzen/deaktivieren
app.post('/api/daily/hinweis', (req, res) => {
  const { secret, aktiv, text, typ } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();
  dailyData.sonderhinweis = {
    aktiv: aktiv !== undefined ? aktiv : true,
    text: text || '',
    typ: typ || 'info', // 'info', 'warnung', 'geschlossen'
    updatedAt: new Date().toISOString()
  };

  writeDailyData(dailyData);
  res.json({ success: true, sonderhinweis: dailyData.sonderhinweis });
});

// POST /api/daily/oeffnungszeiten - Öffnungszeiten für einen Tag überschreiben
app.post('/api/daily/oeffnungszeiten', (req, res) => {
  const { secret, datum, von, bis, geschlossen } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();

  // Wenn kein Datum angegeben, nutze heute
  const targetDatum = datum || new Date().toISOString().split('T')[0];

  dailyData.oeffnungszeiten_override = {
    aktiv: true,
    datum: targetDatum,
    von: geschlossen ? null : (von || '11:00'),
    bis: geschlossen ? null : (bis || '17:00'),
    geschlossen: geschlossen || false,
    updatedAt: new Date().toISOString()
  };

  writeDailyData(dailyData);
  res.json({ success: true, oeffnungszeiten_override: dailyData.oeffnungszeiten_override });
});

// ============================================
// ÖFFNUNGSZEITEN API (dauerhaft)
// ============================================

// GET /api/daily/zeiten - Alle Öffnungszeiten abrufen
app.get('/api/daily/zeiten', (req, res) => {
  const dailyData = readDailyData();
  const defaultZeiten = {
    montag: { offen: false, von: null, bis: null },
    dienstag: { offen: true, von: "11:00", bis: "17:00" },
    mittwoch: { offen: true, von: "11:00", bis: "17:00" },
    donnerstag: { offen: true, von: "11:00", bis: "17:00" },
    freitag: { offen: true, von: "11:00", bis: "17:00" },
    samstag: { offen: true, von: "11:00", bis: "17:00" },
    sonntag: { offen: true, von: "11:00", bis: "17:00" }
  };
  res.json({
    oeffnungszeiten: dailyData.oeffnungszeiten || defaultZeiten
  });
});

// POST /api/daily/zeiten - Öffnungszeiten für einen Tag dauerhaft ändern
app.post('/api/daily/zeiten', (req, res) => {
  const { secret, tag, offen, von, bis, grund } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const validTage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
  const tagLower = tag?.toLowerCase();

  if (!tagLower || !validTage.includes(tagLower)) {
    return res.status(400).json({ error: 'Ungültiger Tag. Erlaubt: montag, dienstag, mittwoch, donnerstag, freitag, samstag, sonntag' });
  }

  const dailyData = readDailyData();

  // Initialisiere oeffnungszeiten falls nicht vorhanden
  if (!dailyData.oeffnungszeiten) {
    dailyData.oeffnungszeiten = {
      montag: { offen: false, von: null, bis: null },
      dienstag: { offen: true, von: "11:00", bis: "17:00" },
      mittwoch: { offen: true, von: "11:00", bis: "17:00" },
      donnerstag: { offen: true, von: "11:00", bis: "17:00" },
      freitag: { offen: true, von: "11:00", bis: "17:00" },
      samstag: { offen: true, von: "11:00", bis: "17:00" },
      sonntag: { offen: true, von: "11:00", bis: "17:00" },
      updatedAt: null
    };
  }

  // Aktualisiere den Tag
  dailyData.oeffnungszeiten[tagLower] = {
    offen: offen !== undefined ? offen : true,
    von: offen === false ? null : (von || "11:00"),
    bis: offen === false ? null : (bis || "17:00"),
    grund: offen === false ? (grund || null) : null
  };
  dailyData.oeffnungszeiten.updatedAt = new Date().toISOString();

  writeDailyData(dailyData);
  res.json({
    success: true,
    tag: tagLower,
    zeiten: dailyData.oeffnungszeiten[tagLower],
    oeffnungszeiten: dailyData.oeffnungszeiten
  });
});

// POST /api/daily/zeiten/bereich - Öffnungszeiten für mehrere Tage ändern
app.post('/api/daily/zeiten/bereich', (req, res) => {
  const { secret, vonTag, bisTag, offen, von, bis, grund } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const validTage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
  const vonTagLower = vonTag?.toLowerCase();
  const bisTagLower = bisTag?.toLowerCase();

  if (!vonTagLower || !validTage.includes(vonTagLower)) {
    return res.status(400).json({ error: 'Ungültiger Start-Tag' });
  }
  if (!bisTagLower || !validTage.includes(bisTagLower)) {
    return res.status(400).json({ error: 'Ungültiger End-Tag' });
  }

  const dailyData = readDailyData();

  // Initialisiere oeffnungszeiten falls nicht vorhanden
  if (!dailyData.oeffnungszeiten) {
    dailyData.oeffnungszeiten = {
      montag: { offen: false, von: null, bis: null },
      dienstag: { offen: true, von: "11:00", bis: "17:00" },
      mittwoch: { offen: true, von: "11:00", bis: "17:00" },
      donnerstag: { offen: true, von: "11:00", bis: "17:00" },
      freitag: { offen: true, von: "11:00", bis: "17:00" },
      samstag: { offen: true, von: "11:00", bis: "17:00" },
      sonntag: { offen: true, von: "11:00", bis: "17:00" },
      updatedAt: null
    };
  }

  // Finde Start- und End-Index
  const startIdx = validTage.indexOf(vonTagLower);
  const endIdx = validTage.indexOf(bisTagLower);

  // Aktualisiere alle Tage im Bereich (auch über Wochenende hinweg)
  const geaenderteTage = [];
  let i = startIdx;
  while (true) {
    const tag = validTage[i];
    dailyData.oeffnungszeiten[tag] = {
      offen: offen !== undefined ? offen : true,
      von: offen === false ? null : (von || "11:00"),
      bis: offen === false ? null : (bis || "17:00"),
      grund: offen === false ? (grund || null) : null
    };
    geaenderteTage.push(tag);

    if (i === endIdx) break;
    i = (i + 1) % 7;
  }

  dailyData.oeffnungszeiten.updatedAt = new Date().toISOString();

  writeDailyData(dailyData);
  res.json({
    success: true,
    geaenderteTage,
    oeffnungszeiten: dailyData.oeffnungszeiten
  });
});

// POST /api/daily/zeiten/pending - Ausstehende Zeiten-Eingabe speichern
app.post('/api/daily/zeiten/pending', (req, res) => {
  const { secret, chatId, typ, tag, vonTag, bisTag } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();
  dailyData.pendingZeiten = {
    chatId: chatId || null,
    typ: typ || null,
    tag: tag || null,
    vonTag: vonTag || null,
    bisTag: bisTag || null
  };

  writeDailyData(dailyData);
  res.json({ success: true, pendingZeiten: dailyData.pendingZeiten });
});

// GET /api/daily/zeiten/pending - Ausstehende Zeiten-Eingabe abrufen
app.get('/api/daily/zeiten/pending', (req, res) => {
  const { chatId } = req.query;
  const dailyData = readDailyData();

  if (dailyData.pendingZeiten && dailyData.pendingZeiten.chatId == chatId) {
    res.json({ hasPending: true, pendingZeiten: dailyData.pendingZeiten });
  } else {
    res.json({ hasPending: false });
  }
});

// POST /api/daily/zeiten/apply - Ausstehende Zeiten-Eingabe anwenden
app.post('/api/daily/zeiten/apply', (req, res) => {
  const { secret, chatId, zeiten } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();

  if (!dailyData.pendingZeiten || dailyData.pendingZeiten.chatId != chatId) {
    return res.status(400).json({ error: 'Keine ausstehende Eingabe gefunden' });
  }

  const pending = dailyData.pendingZeiten;
  const zeitenMatch = zeiten.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);

  if (!zeitenMatch) {
    return res.status(400).json({ error: 'Ungültiges Format. Bitte nutze: 11:00-17:00' });
  }

  const von = zeitenMatch[1];
  const bis = zeitenMatch[2];

  // Initialisiere oeffnungszeiten falls nicht vorhanden
  if (!dailyData.oeffnungszeiten) {
    dailyData.oeffnungszeiten = {
      montag: { offen: false, von: null, bis: null },
      dienstag: { offen: true, von: "11:00", bis: "17:00" },
      mittwoch: { offen: true, von: "11:00", bis: "17:00" },
      donnerstag: { offen: true, von: "11:00", bis: "17:00" },
      freitag: { offen: true, von: "11:00", bis: "17:00" },
      samstag: { offen: true, von: "11:00", bis: "17:00" },
      sonntag: { offen: true, von: "11:00", bis: "17:00" },
      updatedAt: null
    };
  }

  const geaenderteTage = [];
  const validTage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];

  if (pending.typ === 'einzel' && pending.tag) {
    // Einzelner Tag
    dailyData.oeffnungszeiten[pending.tag] = { offen: true, von, bis, grund: null };
    geaenderteTage.push(pending.tag);
  } else if (pending.typ === 'bereich' && pending.vonTag && pending.bisTag) {
    // Mehrere Tage
    const startIdx = validTage.indexOf(pending.vonTag);
    const endIdx = validTage.indexOf(pending.bisTag);

    let i = startIdx;
    while (true) {
      const tag = validTage[i];
      dailyData.oeffnungszeiten[tag] = { offen: true, von, bis, grund: null };
      geaenderteTage.push(tag);

      if (i === endIdx) break;
      i = (i + 1) % 7;
    }
  }

  dailyData.oeffnungszeiten.updatedAt = new Date().toISOString();

  // Pending löschen
  dailyData.pendingZeiten = { chatId: null, typ: null, tag: null, vonTag: null, bisTag: null };

  writeDailyData(dailyData);
  res.json({
    success: true,
    geaenderteTage,
    von,
    bis,
    oeffnungszeiten: dailyData.oeffnungszeiten
  });
});

// POST /api/daily/reset - Alle täglichen Daten zurücksetzen
app.post('/api/daily/reset', (req, res) => {
  const { secret, was } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();

  if (was === 'hinweis' || was === 'alles') {
    dailyData.sonderhinweis = { aktiv: false, text: '', typ: 'info', updatedAt: new Date().toISOString() };
  }
  if (was === 'oeffnungszeiten' || was === 'alles') {
    dailyData.oeffnungszeiten_override = { aktiv: false, datum: null, von: null, bis: null, geschlossen: false, updatedAt: new Date().toISOString() };
  }

  writeDailyData(dailyData);
  res.json({ success: true, dailyData });
});

// ============================================
// WOCHENPLAN API
// ============================================

// GET /api/daily/gerichte - Liste der verfügbaren Gerichte
app.get('/api/daily/gerichte', (req, res) => {
  const dailyData = readDailyData();
  res.json({
    gerichte: dailyData.gerichteAuswahl || [
      "Soljanka", "Wurstgulasch", "Jägerschnitzel",
      "Tote Oma", "Kesselgulasch", "Senfeier"
    ]
  });
});

// GET /api/daily/wochenplan - Aktuellen Wochenplan abrufen
app.get('/api/daily/wochenplan', (req, res) => {
  const dailyData = readDailyData();
  res.json({
    wochenplan: dailyData.wochenplan || { aktiv: false, tage: {} }
  });
});

// POST /api/daily/wochenplan - Wochenplan setzen oder generieren
app.post('/api/daily/wochenplan', (req, res) => {
  const { secret, tage, generieren } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();
  const gerichte = dailyData.gerichteAuswahl || [
    "Soljanka", "Wurstgulasch", "Jägerschnitzel",
    "Tote Oma", "Kesselgulasch", "Senfeier"
  ];

  if (generieren) {
    // Automatisch einen Wochenplan generieren
    const wochentage = ['dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const shuffled = [...gerichte].sort(() => Math.random() - 0.5);
    const plan = {};

    wochentage.forEach((tag, index) => {
      // Zwei verschiedene Gerichte pro Tag
      const idx1 = index % gerichte.length;
      const idx2 = (index + 1) % gerichte.length;
      plan[tag] = {
        gericht1: shuffled[idx1],
        gericht2: shuffled[idx2] !== shuffled[idx1] ? shuffled[idx2] : shuffled[(idx2 + 1) % gerichte.length]
      };
    });

    dailyData.wochenplan = {
      aktiv: true,
      tage: plan,
      updatedAt: new Date().toISOString()
    };
  } else if (tage) {
    // Manuell gesetzten Plan übernehmen
    dailyData.wochenplan = {
      aktiv: true,
      tage: tage,
      updatedAt: new Date().toISOString()
    };
  }

  writeDailyData(dailyData);
  res.json({ success: true, wochenplan: dailyData.wochenplan });
});

// POST /api/daily/wochenplan/tag - Einen einzelnen Tag im Wochenplan ändern
app.post('/api/daily/wochenplan/tag', (req, res) => {
  const { secret, tag, gericht1, gericht2 } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();

  if (!dailyData.wochenplan) {
    dailyData.wochenplan = { aktiv: true, tage: {}, updatedAt: null };
  }

  if (!dailyData.wochenplan.tage) {
    dailyData.wochenplan.tage = {};
  }

  dailyData.wochenplan.tage[tag.toLowerCase()] = {
    gericht1: gericht1 || '',
    gericht2: gericht2 || ''
  };
  dailyData.wochenplan.updatedAt = new Date().toISOString();

  writeDailyData(dailyData);
  res.json({ success: true, tag, gerichte: dailyData.wochenplan.tage[tag.toLowerCase()] });
});

// POST /api/daily/wochenplan/deaktivieren - Wochenplan deaktivieren
app.post('/api/daily/wochenplan/deaktivieren', (req, res) => {
  const { secret } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();
  if (dailyData.wochenplan) {
    dailyData.wochenplan.aktiv = false;
    dailyData.wochenplan.updatedAt = new Date().toISOString();
  }

  writeDailyData(dailyData);
  res.json({ success: true, message: 'Wochenplan deaktiviert' });
});

// POST /api/daily/selection - Speichert den aktuellen Auswahlzustand für Telegram-Buttons
app.post('/api/daily/selection', (req, res) => {
  const { secret, chatId, gericht1, step } = req.body;

  if (secret !== API_SECRET) {
    return res.status(401).json({ error: 'Nicht autorisiert' });
  }

  const dailyData = readDailyData();
  dailyData.pendingSelection = {
    chatId: chatId || null,
    gericht1: gericht1 || null,
    step: step || null
  };

  writeDailyData(dailyData);
  res.json({ success: true, pendingSelection: dailyData.pendingSelection });
});

// GET /api/daily/selection - Holt den aktuellen Auswahlzustand
app.get('/api/daily/selection', (req, res) => {
  const dailyData = readDailyData();
  res.json({
    pendingSelection: dailyData.pendingSelection || { chatId: null, gericht1: null, step: null }
  });
});

// GET /api/daily/heute - Lädt automatisch das Tagesgericht aus dem Wochenplan (falls aktiv)
app.get('/api/daily/heute', (req, res) => {
  const dailyData = readDailyData();

  // Prüfe ob Wochenplan aktiv ist
  if (dailyData.wochenplan && dailyData.wochenplan.aktiv) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const tagNamen = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
    const heute = tagNamen[dayOfWeek];

    // Montag ist Ruhetag
    if (heute === 'montag') {
      return res.json({
        ruhetag: true,
        message: 'Montag ist Ruhetag'
      });
    }

    const heuteGerichte = dailyData.wochenplan.tage[heute];
    if (heuteGerichte && heuteGerichte.gericht1) {
      // Automatisch das Tagesgericht aus dem Wochenplan laden
      return res.json({
        ruhetag: false,
        tag: heute,
        tagesgericht: heuteGerichte,
        quelle: 'wochenplan'
      });
    }
  }

  // Fallback: Manuell gesetztes Tagesgericht
  res.json({
    ruhetag: false,
    tagesgericht: dailyData.tagesgericht,
    quelle: 'manuell'
  });
});

// Statische HTML-Seiten (Impressum, Datenschutz, Kontakt)
app.get('/impressum.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'impressum.html'));
});
app.get('/datenschutz.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'datenschutz.html'));
});
app.get('/kontakt.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kontakt.html'));
});

// Fallback: SPA-Routing (alle anderen Routes -> index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`🍽️  Strandstübchen Server läuft auf http://localhost:${PORT}`);
  console.log(`📡 API-Endpunkte:`);
  console.log(`   GET /api/menu   - Menü-Daten (Winter + Sommer)`);
  console.log(`   GET /api/status - Öffnungsstatus`);
  console.log(`   GET /api/info   - Kontakt & Adresse`);
});
