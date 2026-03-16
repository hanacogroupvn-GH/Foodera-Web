
import { Product, NewsItem } from './types';

export const PRODUCTS: Product[] = [
  // ==========================================
  // RICE
  // ==========================================
  {
    id: 'rice-504-5',
    name: 'Long Grain White Rice 504 - 5% Broken',
    category: 'Rice',
    subCategory: 'Long Grain White Rice',
    shortDescription: 'High-yield utility rice with firm texture, ideal for industrial catering.',
    description: "The 504 variety is known for its high amylose content, resulting in a firm grain that doesn't stick when cooked. The 5% broken specification represents the premium grade of this high-yield variety, making it perfect for food service providers and state tenders.",
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max', 'Chalky': '6.0% Max', 'Admixture': '0.1% Max' },
    filters: { type: 'Long Grain', brokenRatio: '5%', grainLength: 'Long', processing: 'Standard' }
  },
  {
    id: 'rice-5451-5',
    name: 'Long Grain White Rice 5451 - 5% Broken',
    category: 'Rice',
    subCategory: 'Long Grain White Rice',
    shortDescription: 'Soft-textured long grain rice favored for retail and home consumption.',
    description: "OM 5451 is a high-quality variety developed for soft eating quality. It has a slender, milky white appearance and remains soft even after cooling. It is one of Vietnam's most exported long-grain varieties due to its balanced performance.",
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max', 'Yellow Kernels': '0.5% Max', 'Damaged': '0.5% Max' },
    filters: { type: 'Long Grain', brokenRatio: '5%', grainLength: 'Long', processing: 'Soft' }
  },
  {
    id: 'rice-jasmine',
    name: 'Premium Vietnamese Jasmine Rice',
    category: 'Rice',
    subCategory: 'Premium & Fragrant Rice',
    shortDescription: 'Aromatic, silky, and naturally fragrant top-tier export rice.',
    description: 'Cultivated in the fertile Mekong Delta, our Jasmine rice is prized for its floral aroma and moist, silky texture. It is a staple in premium retail markets throughout North America, Europe, and the Middle East.',
    image: 'https://images.unsplash.com/photo-1591814468924-caf78d1232e1?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max', 'Purity': '90% Min', 'Fragrance': 'Natural' },
    filters: { type: 'Fragrant', brokenRatio: '5%', grainLength: 'Long', processing: 'Premium' }
  },
  {
    id: 'rice-test',
    name: 'Premium Vietnamese Jasmine Rice',
    category: 'Rice',
    subCategory: 'Premium & Fragrant Rice',
    shortDescription: 'Aromatic, silky, and naturally fragrant top-tier export rice.',
    description: 'Cultivated in the fertile Mekong Delta, our Jasmine rice is prized for its floral aroma and moist, silky texture. It is a staple in premium retail markets throughout North America, Europe, and the Middle East.',
    image: 'https://images.unsplash.com/photo-1591814468924-caf78d1232e1?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max', 'Purity': '90% Min', 'Fragrance': 'Natural' },
    filters: { type: 'Fragrant', brokenRatio: '5%', grainLength: 'Long', processing: 'Premium' }
  },
  {
    id: 'rice-2',
    name: 'Premium Vietnamese Jasmine Rice',
    category: 'Rice',
    subCategory: 'Premium & Fragrant Rice',
    shortDescription: 'Aromatic, silky, and naturally fragrant top-tier export rice.',
    description: 'Cultivated in the fertile Mekong Delta, our Jasmine rice is prized for its floral aroma and moist, silky texture. It is a staple in premium retail markets throughout North America, Europe, and the Middle East.',
    image: 'https://images.unsplash.com/photo-1591814468924-caf78d1232e1?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max', 'Purity': '90% Min', 'Fragrance': 'Natural' },
    filters: { type: 'Fragrant', brokenRatio: '5%', grainLength: 'Long', processing: 'Premium' }
  },
  {
    id: 'rice-st25',
    name: 'Vietnamese ST25 Rice',
    category: 'Rice',
    subCategory: 'Premium & Fragrant Rice',
    shortDescription: 'Award-winning "World\'s Best Rice" with pineapple-pandan aroma.',
    description: 'ST25 is the pinnacle of Vietnamese rice engineering. Characterized by long, slender grains that remain intact after cooking, it features a distinct aroma of pandan and young pineapple. It is the luxury choice for gourmets worldwide.',
    image: 'https://images.unsplash.com/photo-1533241242392-12f51888065b?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Broken': '5.0% Max', 'Moisture': '14.0% Max', 'Grain Length': '7.2mm', 'Purity': '95% Min' },
    filters: { type: 'Fragrant', brokenRatio: '5%', grainLength: 'Long', processing: 'Luxury' }
  },

  // ==========================================
  // COFFEE
  // ==========================================
  {
    id: '1',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '2',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '3',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '4',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '5',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '6',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '7',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '8',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '9',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  {
    id: '10',
    name: 'Arabica Specialty S16',
    category: 'Coffee',
    subCategory: 'Specialty Coffee',
    shortDescription: 'Premium high-altitude Arabica with bright acidity and clean finish.',
    description: 'Sourced from the Da Lat highlands at 1,500m+, this Arabica is meticulously hand-picked and processed. Screen 16 ensures a uniform roast profile, delivering notes of citrus, dark chocolate, and a lingering floral aroma.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Altitude': '1500m+', 'Processing': 'Washed', 'Screen': '16 (6.3mm)', 'Defects': 'Under 5%' },
    filters: { type: 'Arabica', grade: 'Specialty', screenSize: 'S16', processing: 'Fully Washed' }
  },
  
  // ==========================================
  // CASHEW KERNELS
  // ==========================================
  {
    id: 'agri-cashew-ww180',
    name: 'Cashew Nut WW180 (King of Cashews)',
    category: 'Cashew',
    subCategory: 'Cashew Kernels',
    shortDescription: 'Largest available cashew kernels, premium white whole grade.',
    description: 'The WW180 is known as the "King of Cashews" due to its exceptional size and weight. These kernels are perfectly white and whole, sourced from the finest harvests in Binh Phuoc. They are the primary choice for luxury gift sets and premium retail brands.',
    image: 'https://images.unsplash.com/photo-1590004953392-5aba2e0859c7?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Grade': 'White Whole 180', 'Count': '170-180/lb', 'Moisture': '5% Max', 'Broken': '5% Max' },
    filters: { type: 'Cashew', grade: 'WW180', processing: 'Dried' }
  },
  {
    id: 'agri-cashew-ww240',
    name: 'Cashew Nut WW240 (Large)',
    category: 'Cashew',
    subCategory: 'Cashew Kernels',
    shortDescription: 'Large premium white whole cashew kernels for elite snacking.',
    description: 'WW240 kernels offer a superior balance of size and value. These large white wholes are a favorite for international roasters who require a high-impact visual presence for their retail packaging.',
    image: 'https://images.unsplash.com/photo-1606755962773-d32330513252?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Grade': 'White Whole 240', 'Count': '220-240/lb', 'Moisture': '5% Max', 'Broken': '5% Max' },
    filters: { type: 'Cashew', grade: 'WW240', processing: 'Dried' }
  },
  {
    id: 'agri-cashew-ww320',
    name: 'Cashew Nut WW320 (Standard)',
    category: 'Cashew',
    subCategory: 'Cashew Kernels',
    shortDescription: 'World-standard export grade cashew kernels.',
    description: 'WW320 is the most commonly traded cashew grade globally. It provides a consistent size and quality profile that is highly versatile, used in everything from snack packs to confectionery coatings.',
    image: 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Grade': 'White Whole 320', 'Count': '300-320/lb', 'Moisture': '5% Max', 'Broken': '5% Max' },
    filters: { type: 'Cashew', grade: 'WW320', processing: 'Dried' }
  },
  {
    id: 'agri-cashew-ws',
    name: 'Cashew Nut WS (White Splits)',
    category: 'Cashew',
    subCategory: 'Cashew Kernels',
    shortDescription: 'Clean white cashew halves, ideal for confectionery and baking.',
    description: 'White Splits (WS) are kernels that have naturally split lengthwise during processing. They retain the same crispness and buttery flavor as whole kernels, making them an economical choice for the food processing industry.',
    image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Grade': 'White Splits', 'Color': 'White/Pale Ivory', 'Moisture': '5% Max', 'Foreign Matter': 'Nil' },
    filters: { type: 'Cashew', grade: 'WS', processing: 'Dried' }
  },
  {
    id: 'agri-cashew-lbw',
    name: 'Cashew Nut LBW (Light Blemished Wholes)',
    category: 'Cashew',
    subCategory: 'Cashew Kernels',
    shortDescription: 'Economical whole kernels with minor surface discoloration.',
    description: 'Light Blemished Wholes (LBW) are whole kernels that may show slight surface discoloration or minor blemishes. Despite the aesthetic variation, they maintain the full nutritional value and flavor profile of the white grades.',
    image: 'https://images.unsplash.com/photo-1613204481498-384497e7436f?auto=format&fit=crop&q=80&w=1200',
    specifications: { 'Grade': 'LBW', 'Color': 'Light Brown/Deep Ivory', 'Moisture': '5% Max', 'Broken': '5% Max' },
    filters: { type: 'Cashew', grade: 'LBW', processing: 'Dried' }
  }
];

export const NEWS: NewsItem[] = [
  {
    id: 'coffee-cupping-technique-2024',
    slug: 'coffee-cupping-technique-2024',
    title: 'Coffee Cupping Technique: How Flavor, Quality and Consistency Are Evaluated',
    date: 'March 10, 2024',
    category: 'Company Updates',
    excerpt: 'An authoritative B2B guide on the standardized sensory evaluation process that defines global coffee trade value and quality assurance.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200',
    content: [
      'In the global coffee trade, where multi-million dollar contracts are finalized based on sensory perception, a standardized language is not just a preference - it is a necessity. This language is "Coffee Cupping." For the international buyer, cupping is the ultimate technical filter that translates a raw agricultural commodity into a quantifiable value proposition. At Foodmax, we view cupping as the cornerstone of our quality assurance architecture, ensuring that the Robusta or Arabica that arrives at your facility is identical to the profile agreed upon at the origin.',
      'Section 1: What is Coffee Cupping?',
      'Coffee cupping is a standardized method for evaluating the aroma and flavor profiles of coffee beans. Unlike a casual tasting, cupping is a scientific sensory protocol that removes variables such as brewing method and water filtration differences. By using a consistent infusion method, cupping allows evaluators to compare different samples on a level playing field.',
      'Foodmax Insight: Cupping is designed to highlight defects as much as it is to showcase excellence. For high-volume importers, the primary goal is often "cleanliness" - ensuring the absence of phenolic, moldy, or fermented notes.',
      'Section 2: Where Cupping Fits in the Supply Chain',
      'Cupping is not a one-time event; it is a repetitive gatekeeping process that occurs at several critical junctions of the Foodmax supply chain: Origin Selection, Quality Grading, Pre-Shipment Approval (PSS), and Arrival Alignment.',
      'Section 3: The Standard Cupping Process',
      'To maintain global alignment, Foodmax adheres strictly to the Specialty Coffee Association (SCA) cupping protocols. The process is meticulous: Sample Roasting, Grinding, Brewing Ratios, and the Tasting Protocol via a forceful "slurp" that aerates the coffee across the entire palate.',
      'Section 4: Key Sensory Evaluation Criteria',
      'During a Foodmax evaluation session, our Q-graders score the coffee across several weighted attributes: Fragrance, Aroma, Flavor, Acidity, Body, Balance, and Aftertaste.',
      'Section 5: Understanding Cupping Scores',
      'The SCA scoring system is the industry gold standard. Coffees are scored out of 100: 80-84 is Very Good, 85-89 is Excellent, and 90+ is Outstanding.',
      'Section 6: Aligning Cup Profiles with Market Needs',
      'For a B2B buyer, the highest score is not always the best choice. At Foodmax, we work with our clients to define a "Target Profile" that meets their specific commercial requirements.',
      'Section 7: Cupping vs. Laboratory Analysis',
      'While cupping is the primary tool for sensory evaluation, it is complemented by laboratory analysis of moisture content, water activity, and screen size distribution.',
      'Conclusion: The Foodmax Commitment',
      'Cupping is the final word in coffee quality. By maintaining a rigorous, standardized evaluation program, Foodmax eliminates the guesswork for international importers. We invite our partners to visit our cupping labs in Ho Chi Minh City and Da Lat to participate in calibration sessions.'
    ]
  },
  {
    id: 'vietnam-rice-growing-regions-2025',
    slug: 'vietnam-rice-growing-regions-2025',
    title: "Vietnam's Rice-Growing Regions: The Foundation of Reliable Global Supply",
    date: 'Feb 15, 2024',
    category: 'Market Insights',
    excerpt: "An authoritative analysis of Vietnam's agricultural landscape and why its unique geography ensures long-term food security for global importers.",
    content: [
      'In the complex landscape of global agricultural trade, "origin" is more than a geographical marker; it is the ultimate determinant of risk, quality, and supply continuity. As we look toward the 2025-2030 horizon, Vietnam is solidifying its position as the world\'s most strategic safe harbor for rice procurement.',
      'Foodmax Insight: Supply reliability in 2025 is no longer about finding the lowest price today; it is about securing a partner who understands the micro-climates and regional capacities that mitigate global volatility.',
      'Section 1: Mekong Delta - Vietnam\'s Rice Heartland',
      'The Mekong Delta is not merely a production zone; it is one of the most efficient agricultural ecosystems on the planet. Comprising 12 provinces, the Delta benefits from an intricate network of rivers and fertile alluvial soil.',
      'Section 2: Quality & Fragrant Rice Zones',
      'The geography of Vietnamese rice is specialized. Specific provinces have emerged as world-class centers for fragrant and specialty grains, such as Soc Trang and Bac Lieu for the award-winning ST varieties.',
      'Section 3: Seasonal Diversity & Supply Stability',
      'Vietnam\'s supply stability is anchored in its three-crop system. By diversifying production across these seasons, Vietnam minimizes the impact of localized weather events.',
      'Section 4: Traceability & Food Security at Origin',
      'Modern food security is built on transparency. Foodmax traceability begins at the farming zone level, where we work with cooperatives to implement strict variety control and post-harvest standards.',
      'Section 5: What This Means for Global Buyers',
      'For buyers in Africa and the Middle East, the Vietnamese origin represents a hedge against global uncertainty. Foodmax provides the bridge to this origin, managing the logistical and quality complexities.',
      'Conclusion',
      'The foundation of global food security is a reliable origin. Vietnam\'s combination of fertile geography and sophisticated infrastructure makes it the premier choice for the next decade of rice trade.'
    ],
    image: 'https://images.unsplash.com/photo-1592910129881-892bbe239cc0?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'market-update-q1-2024',
    slug: 'market-update-q1-2024',
    title: 'Southeast Asian Rice Market: Q1 2024 Export Trends',
    date: 'Jan 15, 2024',
    category: 'Market Insights',
    excerpt: 'An analysis of supply-side dynamics in Vietnam and Thailand amidst shifting global demand patterns and logistics challenges.',
    content: [
      'The first quarter of 2024 has shown a robust start for Vietnamese rice exports. Despite global economic shifts, the demand for high-quality fragrant varieties like Jasmine and ST25 remains high in the Middle East and African markets.',
      'Our internal data suggests a 12% increase in shipping volume compared to the same period last year. This trend is driven by a combination of competitive pricing and the increasing reputation of Vietnamese grain.',
      'Logistical challenges, however, remain a key variable. Port congestion in major hubs has necessitated earlier booking schedules and closer coordination with shipping lines to ensure timely delivery.'
    ],
    image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=1200'
  }
];
