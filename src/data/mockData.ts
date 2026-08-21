import { Place, HeroSlide, NotificationItem, ShendamEvent } from '../types';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    tagline: 'Discover',
    title: 'SHENDAM',
    description: 'History. Nature. Culture.\nAll in one place.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    categoryTarget: 'tourist_spots'
  },
  {
    id: 'hero-2',
    tagline: 'Experience',
    title: 'KWOLLA FALLS',
    description: 'Breathtaking cascades and serene mountain trails.',
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
    categoryTarget: 'tourist_spots'
  },
  {
    id: 'hero-3',
    tagline: 'Taste',
    title: 'LOCAL DINING',
    description: 'Authentic Goemai delicacies & vibrant grills.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    categoryTarget: 'restaurants'
  },
  {
    id: 'hero-4',
    tagline: 'Stay',
    title: 'LUXURY SUITES',
    description: 'Comfortable & secure hospitality in Shendam.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    categoryTarget: 'hotels'
  }
];

export const POPULAR_PLACES: Place[] = [
  {
    id: 'place-dreams-hotel',
    name: 'Dreams Hotel',
    category: 'hotels',
    categoryLabel: 'Hotel',
    rating: 0,
    reviewsCount: 0,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Contact hotel for details',
    area: 'Shendam Town',
    description: 'Information coming soon',
    phone: '',
    whatsapp: '',
    priceRange: 'Contact hotel for details',
    priceDetails: 'Contact hotel for details',
    openingHours: 'Contact hotel for details',
    featured: true,
    popular: true,
    amenities: ['Information coming soon'],
    coordinates: { lat: 8.877, lng: 9.506 },
    mapPosition: { x: 45, y: 40 },
    reviews: []
  },
  {
    id: 'place-pedano-hotel',
    name: 'Pedano Hotel',
    category: 'hotels',
    categoryLabel: 'Hotel',
    rating: 0,
    reviewsCount: 0,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Contact hotel for details',
    area: 'Shendam Town',
    description: 'Information coming soon',
    phone: '',
    whatsapp: '',
    priceRange: 'Contact hotel for details',
    priceDetails: 'Contact hotel for details',
    openingHours: 'Contact hotel for details',
    featured: true,
    popular: true,
    amenities: ['Information coming soon'],
    coordinates: { lat: 8.873, lng: 9.502 },
    mapPosition: { x: 38, y: 48 },
    reviews: []
  },
  {
    id: 'place-marriott-hotel',
    name: 'Marriott Hotel',
    category: 'hotels',
    categoryLabel: 'Hotel',
    rating: 0,
    reviewsCount: 0,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Contact hotel for details',
    area: 'Shendam Town',
    description: 'Information coming soon',
    phone: '',
    whatsapp: '',
    priceRange: 'Contact hotel for details',
    priceDetails: 'Contact hotel for details',
    openingHours: 'Contact hotel for details',
    featured: true,
    popular: true,
    amenities: ['Information coming soon'],
    coordinates: { lat: 8.879, lng: 9.508 },
    mapPosition: { x: 55, y: 42 },
    reviews: []
  },
  {
    id: 'place-1',
    name: 'Shendam Suites',
    category: 'hotels',
    categoryLabel: 'Hotel',
    rating: 4.5,
    reviewsCount: 38,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Plot 14, GRA Extension, Shendam Town, Plateau State',
    area: 'Shendam GRA',
    description: 'Premium executive accommodation featuring soundproof suites, 24/7 standby power, an upscale rooftop lounge, and top-tier security.',
    phone: '+234 803 449 2011',
    whatsapp: '+234 803 449 2011',
    priceRange: '₦₦₦',
    priceDetails: 'From ₦25,000 / night',
    openingHours: 'Open 24/7',
    featured: true,
    popular: true,
    amenities: ['24/7 Power', 'Free High-speed WiFi', 'Air Conditioned', 'Swimming Pool', 'Secure Parking', 'Restaurant & Bar'],
    coordinates: { lat: 8.8752, lng: 9.5034 },
    mapPosition: { x: 42, y: 38 },
    reviews: [
      {
        id: 'r1',
        author: 'Emmanuel Longs',
        rating: 5,
        date: '2 days ago',
        comment: 'One of the best hotels in southern Plateau! Quiet atmosphere, very clean bed sheets, and fast room service.'
      },
      {
        id: 'r2',
        author: 'Blessing D.',
        rating: 4,
        date: '1 week ago',
        comment: 'Loved the hospitality and the restaurant pepper soup is fantastic.'
      }
    ]
  },
  {
    id: 'place-2',
    name: 'Royal Grill',
    category: 'restaurants',
    categoryLabel: 'Restaurant',
    rating: 4.3,
    reviewsCount: 52,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Commercial Avenue, Opposite Main Post Office, Shendam',
    area: 'Central Commercial',
    description: 'Renowned for tender goat meat suya, freshly grilled catfish, chilled beverages, and traditional Goemai tuwo and soups.',
    phone: '+234 814 882 1099',
    whatsapp: '+234 814 882 1099',
    priceRange: '₦₦',
    priceDetails: 'Meals from ₦2,500',
    openingHours: '10:00 AM - 11:30 PM Daily',
    featured: true,
    popular: true,
    amenities: ['Outdoor Seating', 'Live Sports TV', 'Takeaway Pack', 'POS Accepted', 'Chilled Drinks'],
    coordinates: { lat: 8.8789, lng: 9.5098 },
    mapPosition: { x: 58, y: 44 },
    reviews: [
      {
        id: 'r3',
        author: 'Kefas Shendam',
        rating: 5,
        date: 'Yesterday',
        comment: 'The grilled fish is unmatched! Great hangout spot in the evenings.'
      }
    ]
  },
  {
    id: 'place-3',
    name: 'Kwolla Waterfalls',
    category: 'tourist_spots',
    categoryLabel: 'Tourist Spot',
    rating: 4.7,
    reviewsCount: 89,
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Kwolla District Escarpment, Shendam LGA, Plateau State',
    area: 'Kwolla Escarpment',
    description: 'Spectacular natural waterfall cascading through volcanic rock formations. A favorite for hiking, picnics, nature photography, and cultural expeditions.',
    phone: '+234 802 331 4455',
    priceRange: 'Free',
    priceDetails: 'Free entrance / Tour guide optional',
    openingHours: '6:30 AM - 6:00 PM Daily',
    featured: true,
    popular: true,
    amenities: ['Scenic Hiking Trail', 'Picnic Grounds', 'Local Tour Guides', 'Photography Spot'],
    coordinates: { lat: 8.924, lng: 9.562 },
    mapPosition: { x: 74, y: 25 },
    reviews: [
      {
        id: 'r4',
        author: 'Dr. Sarah K.',
        rating: 5,
        date: '3 days ago',
        comment: 'Mesmerizing scenery! The air is fresh and the waterfalls make for the most stunning photographs.'
      }
    ]
  },
  {
    id: 'place-4',
    name: 'Shendam Plaza',
    category: 'shopping',
    categoryLabel: 'Shopping Center',
    rating: 4.2,
    reviewsCount: 29,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Jos-Shendam Expressway, Near Central Motor Park',
    area: 'Expressway Corridor',
    description: 'Modern commercial shopping complex featuring boutiques, electronics stores, pharmaceutical shops, salon services, and financial agents.',
    phone: '+234 703 118 4400',
    whatsapp: '+234 703 118 4400',
    priceRange: '₦₦',
    priceDetails: 'Retail & Wholesale Rates',
    openingHours: '8:00 AM - 9:00 PM (Mon - Sat)',
    featured: false,
    popular: true,
    amenities: ['Spacious Parking', 'ATM Gallery', 'Security Guards', 'Over 30 Retail Shops'],
    coordinates: { lat: 8.871, lng: 9.498 },
    mapPosition: { x: 30, y: 55 },
    reviews: [
      {
        id: 'r5',
        author: 'Moses Goyit',
        rating: 4,
        date: '5 days ago',
        comment: 'Convenient one-stop center for gadgets, clothing, and groceries in Shendam.'
      }
    ]
  },
  {
    id: 'place-5',
    name: 'Long Goemai Royal Palace',
    category: 'tourist_spots',
    categoryLabel: 'Tourist Spot',
    rating: 4.9,
    reviewsCount: 110,
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    address: 'Palace Way, Historic Quarter, Shendam',
    area: 'Historic Quarter',
    description: 'The ancient royal seat of the Long Goemai of Shendam. Houses centuries of royal regalia, bronze artifacts, cultural heirlooms, and traditional council chambers.',
    phone: '+234 803 000 1122',
    priceRange: 'Free',
    openingHours: '9:00 AM - 4:00 PM (By Appointment)',
    amenities: ['Cultural Tour', 'Royal Artifacts', 'Guided History', 'Photography with permission'],
    coordinates: { lat: 8.879, lng: 9.502 },
    mapPosition: { x: 50, y: 35 },
    reviews: []
  },
  {
    id: 'place-6',
    name: 'Plateau South General Hospital',
    category: 'health',
    categoryLabel: 'Health & Medical',
    rating: 4.4,
    reviewsCount: 45,
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    address: 'Hospital Road, Shendam Town',
    area: 'Hospital District',
    description: 'State government general hospital providing 24-hour emergency room care, maternity ward, surgery, laboratory diagnostics, and pharmacy.',
    phone: '+234 803 911 0000',
    priceRange: '₦',
    openingHours: 'Open 24/7',
    amenities: ['24/7 Emergency', 'Ambulance Services', 'Pharmacy', 'Surgical Ward', 'Maternity'],
    coordinates: { lat: 8.869, lng: 9.512 },
    mapPosition: { x: 62, y: 68 },
    reviews: []
  },
  {
    id: 'place-7',
    name: 'Shendam Central Mass Transit Hub',
    category: 'transport',
    categoryLabel: 'Transport',
    rating: 4.1,
    reviewsCount: 64,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    address: 'Major Park, Jos Road Junction, Shendam',
    area: 'Transport Junction',
    description: 'Connecting travelers daily to Jos, Lafia, Abuja, Makurdi, Langtang, and surrounding Plateau South communities.',
    phone: '+234 806 772 3311',
    priceRange: '₦',
    openingHours: '5:30 AM - 7:00 PM Daily',
    amenities: ['Express Buses', 'Inter-city Taxis', 'Luggage Handlers', 'Ticket Office'],
    coordinates: { lat: 8.865, lng: 9.492 },
    mapPosition: { x: 25, y: 62 },
    reviews: []
  },
  {
    id: 'place-8',
    name: 'Shendam Emergency & Fire Command',
    category: 'emergency',
    categoryLabel: 'Emergency Services',
    rating: 4.8,
    reviewsCount: 19,
    image: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?auto=format&fit=crop&w=800&q=80',
    address: 'Government Secretariat Road, Shendam',
    area: 'Secretariat Zone',
    description: 'Official Emergency Response center coordinating Fire Service, Police Divisional Headquarters, and Civil Defense patrols.',
    phone: '112 / +234 803 123 9999',
    priceRange: 'Free',
    openingHours: 'Open 24/7 (Emergency Hotline)',
    amenities: ['Rapid Response', 'Disaster Relief', 'Fire Trucks', 'Security Escort'],
    coordinates: { lat: 8.882, lng: 9.505 },
    mapPosition: { x: 48, y: 28 },
    reviews: []
  },
  {
    id: 'place-9',
    name: 'Shimankar Riverside Eco-Lodge',
    category: 'hotels',
    categoryLabel: 'Hotel & Resort',
    rating: 4.8,
    reviewsCount: 42,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'River Shimankar Waterfront, Shimankar District, Shendam',
    area: 'Shimankar Riverside',
    description: 'Tranquil water-facing chalets with boat rides, sport fishing, evening campfires, and serene river breeze retreat.',
    phone: '+234 803 551 8899',
    whatsapp: '+234 803 551 8899',
    priceRange: '₦₦₦',
    priceDetails: 'From ₦28,000 / night',
    openingHours: 'Open 24/7',
    featured: true,
    popular: false,
    amenities: ['River View Chalets', 'Boat Tours', 'Bush Bar & Grill', 'Campfire', 'Free Breakfast'],
    coordinates: { lat: 8.824, lng: 9.451 },
    mapPosition: { x: 20, y: 75 },
    reviews: [
      {
        id: 'r9-1',
        author: 'Danjuma P.',
        rating: 5,
        date: '4 days ago',
        comment: 'Peaceful getaway on the Shimankar river. The grilled fish and boat ride are magical.'
      }
    ]
  },
  {
    id: 'place-10',
    name: 'Goemai Heritage Kitchen',
    category: 'restaurants',
    categoryLabel: 'Restaurant',
    rating: 4.7,
    reviewsCount: 76,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Old Market Road, Central District, Shendam',
    area: 'Central District',
    description: 'Authentic home of traditional Goemai cuisine including steaming Tuwo Da Miyan Kuka, fresh bushmeat, and pepper soups.',
    phone: '+234 802 884 9900',
    whatsapp: '+234 802 884 9900',
    priceRange: '₦',
    priceDetails: 'Dishes from ₦1,500',
    openingHours: '8:00 AM - 9:00 PM Daily',
    featured: true,
    popular: false,
    amenities: ['Indoor Dining', 'Takeaway Pack', 'Catering Orders', 'Fresh Palm Juice'],
    coordinates: { lat: 8.876, lng: 9.504 },
    mapPosition: { x: 52, y: 48 },
    reviews: [
      {
        id: 'r10-1',
        author: 'Nanle R.',
        rating: 5,
        date: '1 week ago',
        comment: 'Best traditional Goemai tuwo and fresh fish in Shendam town!'
      }
    ]
  },
  {
    id: 'place-11',
    name: 'Moekwo Hills Scenic Outlook',
    category: 'tourist_spots',
    categoryLabel: 'Tourist Spot',
    rating: 4.9,
    reviewsCount: 57,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Moekwo Escarpment, Outskirts of Shendam LGA',
    area: 'Moekwo Hills',
    description: 'Breathtaking 360-degree panorama of lush green savannah plains, ancient rock shelters, and unforgettable sunsets.',
    phone: '+234 813 220 7711',
    priceRange: 'Free',
    priceDetails: 'Free access / Local guides available',
    openingHours: 'Sunrise to Sunset',
    featured: true,
    popular: false,
    amenities: ['Panoramic Viewpoint', 'Sunset Photography', 'Rock Climbing Trail', 'Eco Tours'],
    coordinates: { lat: 8.945, lng: 9.578 },
    mapPosition: { x: 80, y: 20 },
    reviews: [
      {
        id: 'r11-1',
        author: 'Lydia M.',
        rating: 5,
        date: '3 days ago',
        comment: 'The sunset view over the valley is breathtaking. A must-visit in Shendam.'
      }
    ]
  },
  {
    id: 'place-12',
    name: 'Shendam Agro-Tech Mart',
    category: 'businesses',
    categoryLabel: 'Business & Agro',
    rating: 4.6,
    reviewsCount: 33,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
    ],
    address: 'Shendam-Lafia Highway, Agro Commercial Hub',
    area: 'Commercial Hub',
    description: 'Premier supplier of improved seed varieties, farm machinery leasing, solar water pumps, and grain warehousing in Southern Plateau.',
    phone: '+234 803 779 1234',
    whatsapp: '+234 803 779 1234',
    priceRange: '₦₦',
    priceDetails: 'Retail & Bulk Pricing',
    openingHours: '7:30 AM - 6:30 PM (Mon - Sat)',
    featured: true,
    popular: false,
    amenities: ['Bulk Warehousing', 'Equipment Rental', 'Agronomy Advisory', 'Delivery Trucks'],
    coordinates: { lat: 8.868, lng: 9.489 },
    mapPosition: { x: 22, y: 58 },
    reviews: []
  }
];

export const SHENDAM_EVENTS: ShendamEvent[] = [
  {
    id: 'event-1',
    title: 'Bit Goemai Cultural Carnival 2026',
    category: 'Cultural Festival',
    date: 'OCT 24, 2026',
    time: '9:00 AM - 6:00 PM',
    location: 'Shendam Township Stadium',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
    attendeesCount: 1420,
    tag: 'Featured',
    description: 'The landmark annual celebration of Goemai heritage, royal procession, traditional warriors dance, musical troupes, and authentic cuisine.'
  },
  {
    id: 'event-2',
    title: 'Plateau South Farmers & Yam Expo',
    category: 'Trade & Agro',
    date: 'NOV 12, 2026',
    time: '8:00 AM - 5:00 PM',
    location: 'Shendam Agro Trade Pavilion',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
    attendeesCount: 850,
    tag: 'Agricultural',
    description: 'Showcasing the world-famous Shendam yam harvests, agricultural innovation, commodity trading, and awards for top local farming clusters.'
  },
  {
    id: 'event-3',
    title: 'Kwolla Waterfalls Eco-Hike & Camp',
    category: 'Eco-Tourism',
    date: 'THIS SATURDAY',
    time: '7:00 AM Meetup',
    location: 'Kwolla Escarpment Base',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    attendeesCount: 95,
    tag: 'Adventure',
    description: 'Guided wilderness trek through scenic granite canyons, natural rock pools, waterfall photography, and mountain birdwatching.'
  },
  {
    id: 'event-4',
    title: 'Shendam Unity Football Derby',
    category: 'Sports & Youth',
    date: 'NOV 28, 2026',
    time: '4:00 PM Kickoff',
    location: 'Government College Sports Ground',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    attendeesCount: 620,
    tag: 'Championship',
    description: 'High-energy local derby match uniting district football academies with live commentary, refreshments, and youth talent showcase.'
  }
];

export const EXPLORE_TOPICS = [
  {
    id: 'attractions',
    title: 'Tourist Attractions',
    subtitle: 'Waterfalls, hills & scenic trails',
    count: '8+ spots',
    targetCategory: 'tourist_spots' as const,
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'stay',
    title: 'Places to Stay',
    subtitle: 'Hotels, lodges & executive suites',
    count: '15+ hotels',
    targetCategory: 'hotels' as const,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'food',
    title: 'Local Food',
    subtitle: 'Goemai tuwo, suya & fresh grills',
    count: '24+ eateries',
    targetCategory: 'restaurants' as const,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'culture',
    title: 'Culture & Heritage',
    subtitle: 'Long Goemai palace & historic sites',
    count: '10+ heritage',
    targetCategory: 'tourist_spots' as const,
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
  }
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Annual Bit Goemai Festival 2026',
    category: 'Cultural Festival',
    time: '2 hours ago',
    content: 'Grand cultural celebration and traditional dances will take place at the Shendam Main Stadium this Saturday.',
    read: false
  },
  {
    id: 'notif-2',
    title: 'New Businesses Added to Shendam Connect',
    category: 'Directory Update',
    time: '5 hours ago',
    content: '12 new verified eateries and artisan services in Kwolla and Shimankar districts have been listed.',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Road Maintenance Notice',
    category: 'Advisory',
    time: 'Yesterday',
    content: 'Ongoing grading on the Shendam-Shimankar corridor. Commuters are advised to exercise safe speed.',
    read: true
  }
];
