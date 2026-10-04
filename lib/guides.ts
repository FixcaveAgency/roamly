import type { Guide } from "./types";
export const guides: Record<string, Guide> = {
  JP: {
    tag: "Culture meets curiosity",
    intro:
      "Quiet temple gardens, neon streets, mountain trails. Japan rewards taking the slower route.",
    image: "/images/japan.jpg",
    cities: [
      {
        name: "Tokyo",
        region: "Tokyo",
        places: ["Sensō-ji", "Meiji Shrine", "Ueno Park"],
      },
      {
        name: "Kyoto",
        region: "Kyoto",
        places: ["Fushimi Inari Taisha", "Arashiyama", "Kiyomizu-dera"],
      },
      { name: "Osaka", region: "Osaka", places: ["Osaka Castle", "Dōtonbori"] },
    ],
  },
  NO: {
    tag: "Take the scenic route",
    intro:
      "Follow the fjords, find a quiet cabin, and leave a little room for the unexpected.",
    image: "/images/norway.jpg",
    cities: [
      {
        name: "Bergen",
        region: "Vestland",
        places: ["Bryggen", "Mount Fløyen"],
      },
      {
        name: "Oslo",
        region: "Oslo",
        places: ["Vigeland Park", "Oslo Opera House"],
      },
      {
        name: "Tromsø",
        region: "Troms",
        places: ["Fjellheisen", "Arctic Cathedral"],
      },
    ],
  },
  ID: {
    tag: "A little closer to paradise",
    intro:
      "Volcanic landscapes, lush rice terraces, and islands with stories all their own.",
    image: "/images/bali.jpg",
    cities: [
      {
        name: "Ubud",
        region: "Bali",
        places: ["Tegallalang Rice Terrace", "Sacred Monkey Forest"],
      },
      {
        name: "Yogyakarta",
        region: "Yogyakarta",
        places: ["Prambanan", "Kraton Yogyakarta"],
      },
      {
        name: "Jakarta",
        region: "Jakarta",
        places: ["Kota Tua", "National Monument"],
      },
    ],
  },
  CN: {
    tag: "A world within a country",
    intro:
      "Ancient courtyards and modern skylines, with countless journeys in between.",
    cities: [
      {
        name: "Beijing",
        region: "Beijing",
        places: [
          "Forbidden City",
          "Temple of Heaven",
          "Great Wall at Mutianyu",
        ],
      },
      {
        name: "Shanghai",
        region: "Shanghai",
        places: ["The Bund", "Yu Garden"],
      },
      {
        name: "Guangzhou",
        region: "Guangdong",
        places: ["Canton Tower", "Shamian Island"],
      },
      {
        name: "Wuhan",
        region: "Hubei",
        places: ["Yellow Crane Tower", "East Lake"],
      },
      {
        name: "Chengdu",
        region: "Sichuan",
        places: ["Chengdu Research Base of Giant Panda Breeding"],
      },
    ],
  },
  BD: {
    tag: "Green, warm, unforgettable",
    intro:
      "River journeys, tea country, and the places that make a trip feel personal.",
    cities: [
      {
        name: "Dhaka",
        region: "Dhaka",
        places: ["Lalbagh Fort", "Ahsan Manzil"],
      },
      {
        name: "Sylhet",
        region: "Sylhet",
        places: ["Ratargul Swamp Forest", "Jaflong"],
      },
      {
        name: "Cox’s Bazar",
        region: "Chattogram",
        places: ["Cox’s Bazar Beach", "Himchari"],
      },
    ],
  },
  TH: {
    tag: "Follow your appetite",
    intro: "Street food, ornate temples, and time to slow down by the sea.",
    cities: [
      {
        name: "Bangkok",
        region: "Bangkok",
        places: ["Wat Pho", "Grand Palace"],
      },
      {
        name: "Chiang Mai",
        region: "Chiang Mai",
        places: ["Wat Phra That Doi Suthep", "Old City"],
      },
      {
        name: "Phuket",
        region: "Phuket",
        places: ["Old Phuket Town", "Kata Beach"],
      },
    ],
  },
  MY: {
    tag: "Many cultures, one journey",
    intro:
      "Start with a city stroll, then make room for highland air and island days.",
    cities: [
      {
        name: "Kuala Lumpur",
        region: "Kuala Lumpur",
        places: ["Petronas Towers", "Batu Caves"],
      },
      {
        name: "George Town",
        region: "Penang",
        places: ["Armenian Street", "Kek Lok Si Temple"],
      },
    ],
  },
  SG: {
    tag: "Small island, big discoveries",
    intro:
      "Gardens, neighbourhoods, and hawker food worth crossing the city for.",
    cities: [
      {
        name: "Singapore",
        region: "Singapore",
        places: [
          "Gardens by the Bay",
          "Singapore Botanic Gardens",
          "Chinatown",
        ],
      },
    ],
  },
  FR: {
    tag: "Find your own France",
    intro:
      "Neighbourhood cafés, art-filled afternoons, and a different pace beyond the capital.",
    cities: [
      {
        name: "Paris",
        region: "Île-de-France",
        places: ["Eiffel Tower", "Louvre Museum", "Montmartre"],
      },
      {
        name: "Nice",
        region: "Provence-Alpes-Côte d’Azur",
        places: ["Promenade des Anglais", "Old Town"],
      },
    ],
  },
  IT: {
    tag: "Make room for the long lunch",
    intro: "Wander through history and let the next piazza set your pace.",
    cities: [
      {
        name: "Rome",
        region: "Lazio",
        places: ["Colosseum", "Roman Forum", "Trevi Fountain"],
      },
      {
        name: "Florence",
        region: "Tuscany",
        places: ["Uffizi Gallery", "Ponte Vecchio"],
      },
      {
        name: "Venice",
        region: "Veneto",
        places: ["Grand Canal", "Saint Mark’s Square"],
      },
    ],
  },
  US: {
    tag: "Choose your own adventure",
    intro: "City breaks, national parks, and the open road between them.",
    cities: [
      {
        name: "New York City",
        region: "New York",
        places: [
          "Central Park",
          "Brooklyn Bridge",
          "Metropolitan Museum of Art",
        ],
      },
      {
        name: "San Francisco",
        region: "California",
        places: ["Golden Gate Bridge", "Golden Gate Park"],
      },
    ],
  },
  GB: {
    tag: "Stories around every corner",
    intro: "Historic streets, museums, and green escapes beyond the city.",
    cities: [
      {
        name: "London",
        region: "England",
        places: ["British Museum", "Tower of London", "Hyde Park"],
      },
      {
        name: "Edinburgh",
        region: "Scotland",
        places: ["Edinburgh Castle", "Royal Mile"],
      },
    ],
  },
  AU: {
    tag: "A bigger kind of outdoors",
    intro: "Coastal walks, vibrant cities, and wide-open landscapes.",
    cities: [
      {
        name: "Sydney",
        region: "New South Wales",
        places: ["Sydney Opera House", "Bondi Beach"],
      },
      {
        name: "Melbourne",
        region: "Victoria",
        places: ["Royal Botanic Gardens", "Federation Square"],
      },
    ],
  },
  TR: {
    tag: "Where journeys cross",
    intro: "Bazaars, coastlines, and layers of history around every turn.",
    cities: [
      {
        name: "Istanbul",
        region: "Istanbul",
        places: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar"],
      },
      {
        name: "Göreme",
        region: "Nevşehir",
        places: ["Göreme Open Air Museum"],
      },
    ],
  },
  AE: {
    tag: "Beyond the skyline",
    intro: "Modern architecture, old trading quarters, and desert horizons.",
    cities: [
      {
        name: "Dubai",
        region: "Dubai",
        places: ["Burj Khalifa", "Al Fahidi", "Dubai Creek"],
      },
      {
        name: "Abu Dhabi",
        region: "Abu Dhabi",
        places: ["Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi"],
      },
    ],
  },
};
export const featureCodes = ["JP", "NO", "ID"];
