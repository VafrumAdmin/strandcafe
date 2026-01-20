const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

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
    {
      name: "Pommes Frites",
      price: "3,50 €",
      description: "Goldgelb & knusprig, rot/weiß",
      highlight: false
    },
    {
      name: "Currywurst Spezial",
      price: "4,50 €",
      description: "Mit unserer geheimen Currysauce & Bäckerbrötchen",
      highlight: true
    },
    {
      name: "Chicken Nuggets",
      price: "4,90 €",
      description: "6 Stück im Knuspermantel mit Dip",
      highlight: false
    },
    {
      name: "Thüringer Bratwurst",
      price: "3,50 €",
      description: "Frisch vom Grill im Brötchen",
      highlight: false
    },
    {
      name: "Eiskaffee",
      price: "4,50 €",
      description: "Große Kugel Vanilleeis mit Sahne",
      highlight: false
    }
  ]
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

// Öffnungszeiten Konfiguration
const openingHours = {
  monday: null, // Ruhetag
  tuesday: { open: "11:00", close: "17:00" },
  wednesday: { open: "11:00", close: "17:00" },
  thursday: { open: "11:00", close: "17:00" },
  friday: { open: "11:00", close: "17:00" },
  saturday: { open: "11:00", close: "17:00" },
  sunday: { open: "11:00", close: "17:00" }
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

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const todayHours = openingHours[dayName];

  let isOpen = false;
  let nextOpen = null;
  let closesAt = null;

  if (todayHours) {
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    isOpen = currentTime >= openTime && currentTime < closeTime;

    if (isOpen) {
      closesAt = todayHours.close;
    } else if (currentTime < openTime) {
      nextOpen = todayHours.open;
    }
  }

  // Nächster Öffnungstag finden wenn heute geschlossen
  if (!isOpen && !nextOpen) {
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (dayOfWeek + i) % 7;
      const nextDayName = dayNames[nextDayIndex];
      if (openingHours[nextDayName]) {
        nextOpen = `${nextDayName === 'sunday' ? 'Sonntag' : nextDayName === 'monday' ? 'Montag' : nextDayName === 'tuesday' ? 'Dienstag' : nextDayName === 'wednesday' ? 'Mittwoch' : nextDayName === 'thursday' ? 'Donnerstag' : nextDayName === 'friday' ? 'Freitag' : 'Samstag'} ${openingHours[nextDayName].open}`;
        break;
      }
    }
  }

  res.json({
    isOpen,
    currentDay: dayName,
    currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
    todayHours: todayHours ? `${todayHours.open} - ${todayHours.close}` : 'Ruhetag',
    closesAt,
    nextOpen,
    openingHours
  });
});

// GET /api/info - Kontakt/Adresse
app.get('/api/info', (req, res) => {
  res.json(infoData);
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
