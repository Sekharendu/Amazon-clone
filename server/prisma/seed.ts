import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const maxConnectionAttempts = 5;
const initialRetryDelayMs = 1000;

function isTransientConnectionError(error: unknown) {
  return error instanceof Error && /P1001|Can't reach database server|Timed out fetching a new connection/i.test(error.message);
}

async function connectWithRetry() {
  for (let attempt = 1; attempt <= maxConnectionAttempts; attempt += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      if (!isTransientConnectionError(error) || attempt === maxConnectionAttempts) {
        throw error;
      }

      const delayMs = initialRetryDelayMs * 2 ** (attempt - 1);
      console.warn(`Database connection attempt ${attempt} failed; retrying in ${delayMs}ms.`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

const categories = [
  {
    name: 'Clothing',
    slug: 'clothing',
    facets: [
      { name: 'Gender', type: 'checkbox', options: ['Men', 'Women', 'Unisex'] },
      { name: 'Size', type: 'size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Color', type: 'color', options: ['Black', 'Blue', 'White', 'Green', 'Red'] },
      { name: 'Price', type: 'range', options: [{ label: 'Under INR 1,000', max: 1000 }, { label: 'INR 1,000 - 2,500', min: 1000, max: 2500 }, { label: 'Over INR 2,500', min: 2500 }] },
    ],
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    facets: [
      { name: 'Brand', type: 'checkbox', options: ['Aurora', 'Soundcore', 'Logitech', 'Kindle'] },
      { name: 'Connectivity', type: 'checkbox', options: ['Bluetooth', 'USB-C', 'Wi-Fi', 'Wireless'] },
      { name: 'Price', type: 'range', options: [{ label: 'Under INR 2,000', max: 2000 }, { label: 'INR 2,000 - 10,000', min: 2000, max: 10000 }, { label: 'Over INR 10,000', min: 10000 }] },
    ],
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    facets: [
      { name: 'Material', type: 'checkbox', options: ['Stainless steel', 'Cotton', 'Bamboo', 'Glass'] },
      { name: 'Color', type: 'color', options: ['Black', 'Silver', 'Natural', 'White'] },
      { name: 'Price', type: 'range', options: [{ label: 'Under INR 1,000', max: 1000 }, { label: 'INR 1,000 - 5,000', min: 1000, max: 5000 }, { label: 'Over INR 5,000', min: 5000 }] },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    facets: [
      { name: 'Skin Type', type: 'checkbox', options: ['All skin types', 'Dry', 'Oily', 'Sensitive'] },
      { name: 'Form', type: 'checkbox', options: ['Cream', 'Serum', 'Liquid', 'Powder'] },
      { name: 'Price', type: 'range', options: [{ label: 'Under INR 750', max: 750 }, { label: 'INR 750 - 2,000', min: 750, max: 2000 }, { label: 'Over INR 2,000', min: 2000 }] },
    ],
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    facets: [
      { name: 'Activity', type: 'checkbox', options: ['Running', 'Yoga', 'Cycling', 'Fitness', 'Camping'] },
      { name: 'Size', type: 'size', options: ['Small', 'Medium', 'Large', 'One size'] },
      { name: 'Price', type: 'range', options: [{ label: 'Under INR 1,000', max: 1000 }, { label: 'INR 1,000 - 3,000', min: 1000, max: 3000 }, { label: 'Over INR 3,000', min: 3000 }] },
    ],
  },
] as const;

type ProductSeed = {
  asin: string;
  slug: string;
  category: string;
  title: string;
  brand: string;
  department: string;
  description: string;
  manufacturer: string;
  modelNumber: string;
  origin: string;
  badges?: string[];
  variants: Array<{
    sku: string;
    color?: string;
    size?: string;
    style?: string;
    packDescription?: string;
    price: number;
    listPrice: number;
    quantityAvailable: number;
    isPrimeEligible?: boolean;
  }>;
  specifications: Array<{ group: string; label: string; value: string }>;
};

const products: ProductSeed[] = [
  {
    asin: 'B0CLOTH001', slug: 'northline-cotton-crew-tshirt', category: 'clothing', title: 'Northline Men\'s Classic Cotton Crew-Neck T-Shirt', brand: 'Northline', department: 'Men\'s Clothing', description: 'A breathable everyday tee with a soft cotton hand and dependable shape retention.', manufacturer: 'Northline Apparel', modelNumber: 'NL-TEE-101', origin: 'Imported', badges: ['Best Seller'],
    variants: [{ sku: 'NL-TEE-101-NAVY-M', color: 'Navy', size: 'M', price: 799, listPrice: 1199, quantityAvailable: 42 }, { sku: 'NL-TEE-101-NAVY-L', color: 'Navy', size: 'L', price: 799, listPrice: 1199, quantityAvailable: 35 }],
    specifications: [{ group: 'highlights', label: 'Fabric type', value: '100% combed cotton' }, { group: 'details', label: 'Care instructions', value: 'Machine wash cold' }, { group: 'details', label: 'Fit', value: 'Regular fit' }],
  },
  {
    asin: 'B0CLOTH002', slug: 'harborline-linen-shirt', category: 'clothing', title: 'Harborline Men\'s Linen Blend Resort Shirt', brand: 'Harborline', department: 'Men\'s Clothing', description: 'A relaxed button-front shirt designed for warm days and easy layering.', manufacturer: 'Harborline Clothing Co.', modelNumber: 'HB-LIN-220', origin: 'India',
    variants: [{ sku: 'HB-LIN-220-SAGE-M', color: 'Sage', size: 'M', price: 1499, listPrice: 2199, quantityAvailable: 18 }, { sku: 'HB-LIN-220-SAGE-L', color: 'Sage', size: 'L', price: 1499, listPrice: 2199, quantityAvailable: 24 }],
    specifications: [{ group: 'highlights', label: 'Fabric type', value: '55% linen, 45% cotton' }, { group: 'details', label: 'Closure type', value: 'Button' }, { group: 'details', label: 'Fit', value: 'Relaxed fit' }],
  },
  {
    asin: 'B0CLOTH003', slug: 'everyday-fleece-hoodie', category: 'clothing', title: 'Everyday Fleece Pullover Hoodie with Kangaroo Pocket', brand: 'Common Thread', department: 'Unisex Clothing', description: 'Midweight fleece with a brushed interior for cool mornings and casual weekends.', manufacturer: 'Common Thread Works', modelNumber: 'CT-HOOD-410', origin: 'Imported',
    variants: [{ sku: 'CT-HOOD-410-BLACK-L', color: 'Black', size: 'L', price: 1899, listPrice: 2799, quantityAvailable: 27 }, { sku: 'CT-HOOD-410-GREY-XL', color: 'Heather Grey', size: 'XL', price: 1899, listPrice: 2799, quantityAvailable: 16 }],
    specifications: [{ group: 'highlights', label: 'Material', value: 'Cotton-polyester fleece' }, { group: 'details', label: 'Pocket style', value: 'Front kangaroo pocket' }, { group: 'details', label: 'Hood', value: 'Drawstring hood' }],
  },
  {
    asin: 'B0CLOTH004', slug: 'motionflex-running-joggers', category: 'clothing', title: 'MotionFlex Men\'s Tapered Performance Joggers', brand: 'MotionFlex', department: 'Men\'s Clothing', description: 'Stretch running joggers with zip pockets and a tapered ankle.', manufacturer: 'MotionFlex Athletics', modelNumber: 'MF-JOG-510', origin: 'Imported',
    variants: [{ sku: 'MF-JOG-510-CHARCOAL-M', color: 'Charcoal', size: 'M', price: 1699, listPrice: 2499, quantityAvailable: 31 }, { sku: 'MF-JOG-510-CHARCOAL-L', color: 'Charcoal', size: 'L', price: 1699, listPrice: 2499, quantityAvailable: 22 }],
    specifications: [{ group: 'highlights', label: 'Fabric type', value: '88% polyester, 12% elastane' }, { group: 'details', label: 'Pockets', value: 'Two zip side pockets' }, { group: 'details', label: 'Activity', value: 'Running and training' }],
  },
  {
    asin: 'B0CLOTH005', slug: 'willow-knit-cardigan', category: 'clothing', title: 'Willow & Pine Women\'s Soft Knit Button Cardigan', brand: 'Willow & Pine', department: 'Women\'s Clothing', description: 'A versatile fine-knit layer with a softly structured drape.', manufacturer: 'Willow & Pine Textiles', modelNumber: 'WP-CARD-118', origin: 'Imported',
    variants: [{ sku: 'WP-CARD-118-CREAM-S', color: 'Cream', size: 'S', price: 2199, listPrice: 3299, quantityAvailable: 14 }, { sku: 'WP-CARD-118-CREAM-M', color: 'Cream', size: 'M', price: 2199, listPrice: 3299, quantityAvailable: 20 }],
    specifications: [{ group: 'highlights', label: 'Knit type', value: 'Fine-gauge rib knit' }, { group: 'details', label: 'Closure type', value: 'Front buttons' }, { group: 'details', label: 'Sleeve length', value: 'Long sleeve' }],
  },
  {
    asin: 'B0ELEC001', slug: 'aurora-14-inch-laptop', category: 'electronics', title: 'Aurora 14-inch Full HD Everyday Laptop', brand: 'Aurora', department: 'Computers', description: 'A slim everyday laptop for study, work, streaming, and video calls.', manufacturer: 'Aurora Digital', modelNumber: 'AUR-14-I5', origin: 'Imported', badges: ['Amazon\'s Choice'],
    variants: [{ sku: 'AUR-14-I5-SILVER', color: 'Silver', style: '16GB RAM / 512GB SSD', price: 54999, listPrice: 64999, quantityAvailable: 9, isPrimeEligible: true }],
    specifications: [{ group: 'highlights', label: 'Display', value: '14-inch Full HD IPS' }, { group: 'details', label: 'Processor', value: 'Intel Core i5' }, { group: 'dimensions', label: 'Weight', value: '1.42 kg' }],
  },
  {
    asin: 'B0ELEC002', slug: 'soundcore-noise-cancelling-headphones', category: 'electronics', title: 'Soundcore QuietBeat Wireless Noise Cancelling Headphones', brand: 'Soundcore', department: 'Headphones', description: 'Over-ear wireless headphones with adaptive noise cancellation and long battery life.', manufacturer: 'Soundcore Audio', modelNumber: 'QB-700', origin: 'Imported', badges: ['Best Seller'],
    variants: [{ sku: 'QB-700-BLACK', color: 'Black', price: 6999, listPrice: 9999, quantityAvailable: 28, isPrimeEligible: true }],
    specifications: [{ group: 'highlights', label: 'Noise control', value: 'Adaptive active noise cancellation' }, { group: 'details', label: 'Connectivity', value: 'Bluetooth 5.3' }, { group: 'dimensions', label: 'Battery life', value: 'Up to 40 hours' }],
  },
  {
    asin: 'B0ELEC003', slug: 'logitech-compact-wireless-keyboard', category: 'electronics', title: 'Logitech K380 Compact Multi-Device Wireless Keyboard', brand: 'Logitech', department: 'Computer Accessories', description: 'A quiet compact keyboard that switches between three connected devices.', manufacturer: 'Logitech', modelNumber: 'K380', origin: 'Imported',
    variants: [{ sku: 'K380-GRAPHITE', color: 'Graphite', price: 2499, listPrice: 3295, quantityAvailable: 44, isPrimeEligible: true }],
    specifications: [{ group: 'highlights', label: 'Device support', value: 'Windows, macOS, iPadOS, Android' }, { group: 'details', label: 'Connectivity', value: 'Bluetooth wireless' }, { group: 'dimensions', label: 'Battery', value: '2 AAA batteries' }],
  },
  {
    asin: 'B0ELEC004', slug: 'kindle-paperwhite', category: 'electronics', title: 'Kindle Paperwhite 6.8-inch E-Reader', brand: 'Kindle', department: 'E-Readers', description: 'A glare-free e-reader with a warm light and weeks of battery life.', manufacturer: 'Amazon', modelNumber: 'M2L3EK', origin: 'Imported', badges: ['Top Rated'],
    variants: [{ sku: 'KPW-16GB-BLACK', color: 'Black', style: '16GB', price: 14999, listPrice: 16999, quantityAvailable: 12, isPrimeEligible: true }],
    specifications: [{ group: 'highlights', label: 'Display', value: '6.8-inch glare-free display' }, { group: 'details', label: 'Storage', value: '16GB' }, { group: 'dimensions', label: 'Waterproof rating', value: 'IPX8' }],
  },
  {
    asin: 'B0ELEC005', slug: 'voltix-usb-c-charger', category: 'electronics', title: 'Voltix 65W GaN USB-C Wall Charger', brand: 'Voltix', department: 'Chargers & Adapters', description: 'A compact dual-port GaN charger for laptops, phones, tablets, and accessories.', manufacturer: 'Voltix Power', modelNumber: 'VX-GAN-65', origin: 'Imported',
    variants: [{ sku: 'VX-GAN-65-WHITE', color: 'White', price: 2299, listPrice: 3499, quantityAvailable: 53, isPrimeEligible: true }],
    specifications: [{ group: 'highlights', label: 'Output', value: '65W maximum USB-C output' }, { group: 'details', label: 'Ports', value: 'Two USB-C ports' }, { group: 'dimensions', label: 'Technology', value: 'Gallium nitride (GaN)' }],
  },
  {
    asin: 'B0HOME001', slug: 'chefcraft-stainless-cookware-set', category: 'home-kitchen', title: 'ChefCraft 10-Piece Stainless Steel Cookware Set', brand: 'ChefCraft', department: 'Kitchen', description: 'A polished stainless steel cookware set for everyday stovetop cooking.', manufacturer: 'ChefCraft Home', modelNumber: 'CC-SET-10', origin: 'India', badges: ['Best Seller'],
    variants: [{ sku: 'CC-SET-10-SILVER', color: 'Silver', style: '10-piece set', price: 8999, listPrice: 12999, quantityAvailable: 11, isPrimeEligible: true }],
    specifications: [{ group: 'highlights', label: 'Material', value: 'Food-grade stainless steel' }, { group: 'details', label: 'Cooktop compatibility', value: 'Gas, electric, and induction' }, { group: 'dimensions', label: 'Set contents', value: 'Pots, pans, lids, and steamer' }],
  },
  {
    asin: 'B0HOME002', slug: 'bamboo-breeze-cutting-board', category: 'home-kitchen', title: 'Bamboo Breeze Reversible Kitchen Cutting Board', brand: 'Bamboo Breeze', department: 'Kitchen', description: 'A durable reversible bamboo board with a juice groove and easy-grip edges.', manufacturer: 'Bamboo Breeze Living', modelNumber: 'BB-CB-18', origin: 'India',
    variants: [{ sku: 'BB-CB-18-NATURAL', color: 'Natural', style: 'Large', price: 899, listPrice: 1399, quantityAvailable: 38 }],
    specifications: [{ group: 'highlights', label: 'Material', value: 'Moso bamboo' }, { group: 'details', label: 'Features', value: 'Reversible with juice groove' }, { group: 'dimensions', label: 'Dimensions', value: '18 x 12 x 0.75 inches' }],
  },
  {
    asin: 'B0HOME003', slug: 'nestwell-cotton-bath-towel-set', category: 'home-kitchen', title: 'Nestwell 6-Piece Zero-Twist Cotton Bath Towel Set', brand: 'Nestwell', department: 'Bath', description: 'Soft, absorbent cotton towels with a plush feel for everyday use.', manufacturer: 'Nestwell Textiles', modelNumber: 'NW-TWL-6', origin: 'India',
    variants: [{ sku: 'NW-TWL-6-WHITE', color: 'White', style: '6-piece set', price: 1799, listPrice: 2699, quantityAvailable: 26 }],
    specifications: [{ group: 'highlights', label: 'Material', value: '100% cotton' }, { group: 'details', label: 'Care instructions', value: 'Machine wash and tumble dry' }, { group: 'dimensions', label: 'Set contents', value: '2 bath, 2 hand, and 2 face towels' }],
  },
  {
    asin: 'B0HOME004', slug: 'purepour-glass-water-bottle', category: 'home-kitchen', title: 'PurePour Borosilicate Glass Water Bottle with Sleeve', brand: 'PurePour', department: 'Drinkware', description: 'A leak-resistant glass bottle with a protective silicone sleeve.', manufacturer: 'PurePour Housewares', modelNumber: 'PP-GLASS-750', origin: 'Imported',
    variants: [{ sku: 'PP-GLASS-750-BLUE', color: 'Ocean Blue', style: '750 ml', price: 749, listPrice: 1199, quantityAvailable: 64 }],
    specifications: [{ group: 'highlights', label: 'Material', value: 'Borosilicate glass' }, { group: 'details', label: 'Lid type', value: 'Leak-resistant screw lid' }, { group: 'dimensions', label: 'Capacity', value: '750 ml' }],
  },
  {
    asin: 'B0HOME005', slug: 'luma-ceramic-table-lamp', category: 'home-kitchen', title: 'Luma Ceramic Table Lamp with Linen Shade', brand: 'Luma Home', department: 'Home Decor', description: 'A warm, minimal table lamp for bedrooms, reading corners, and desks.', manufacturer: 'Luma Home Studio', modelNumber: 'LM-LAMP-20', origin: 'India',
    variants: [{ sku: 'LM-LAMP-20-SAND', color: 'Sand', price: 2399, listPrice: 3499, quantityAvailable: 17 }],
    specifications: [{ group: 'highlights', label: 'Shade material', value: 'Natural linen' }, { group: 'details', label: 'Bulb type', value: 'E27 LED compatible' }, { group: 'dimensions', label: 'Height', value: '20 inches' }],
  },
  {
    asin: 'B0BEAUTY001', slug: 'dermabelle-hydrating-face-cleanser', category: 'beauty-personal-care', title: 'DermaBelle Gentle Hydrating Face Cleanser', brand: 'DermaBelle', department: 'Skin Care', description: 'A fragrance-free daily cleanser that removes makeup without stripping moisture.', manufacturer: 'DermaBelle Labs', modelNumber: 'DB-CLEAN-150', origin: 'India', badges: ['Top Rated'],
    variants: [{ sku: 'DB-CLEAN-150-CLEAR', style: '150 ml', price: 599, listPrice: 799, quantityAvailable: 46 }],
    specifications: [{ group: 'highlights', label: 'Skin type', value: 'Normal to dry skin' }, { group: 'details', label: 'Form', value: 'Gel cleanser' }, { group: 'details', label: 'Free from', value: 'Fragrance and parabens' }],
  },
  {
    asin: 'B0BEAUTY002', slug: 'verdant-glow-vitamin-c-serum', category: 'beauty-personal-care', title: 'Verdant Glow 10% Vitamin C Brightening Serum', brand: 'Verdant Glow', department: 'Skin Care', description: 'A lightweight serum formulated to brighten the look of tired, uneven skin.', manufacturer: 'Verdant Glow Beauty', modelNumber: 'VG-SERUM-30', origin: 'India',
    variants: [{ sku: 'VG-SERUM-30-AMBER', style: '30 ml', price: 1299, listPrice: 1799, quantityAvailable: 32 }],
    specifications: [{ group: 'highlights', label: 'Key ingredient', value: '10% vitamin C' }, { group: 'details', label: 'Skin type', value: 'All skin types' }, { group: 'details', label: 'Application', value: 'Use 2-3 drops after cleansing' }],
  },
  {
    asin: 'B0BEAUTY003', slug: 'silkroot-daily-shampoo', category: 'beauty-personal-care', title: 'SilkRoot Botanical Daily Moisture Shampoo', brand: 'SilkRoot', department: 'Hair Care', description: 'A gentle botanical shampoo for soft, clean hair without heavy buildup.', manufacturer: 'SilkRoot Naturals', modelNumber: 'SR-SHAM-300', origin: 'India',
    variants: [{ sku: 'SR-SHAM-300-GREEN', style: '300 ml', price: 449, listPrice: 699, quantityAvailable: 58 }],
    specifications: [{ group: 'highlights', label: 'Hair type', value: 'Normal to dry hair' }, { group: 'details', label: 'Scent', value: 'Aloe and green tea' }, { group: 'details', label: 'Formula', value: 'Sulfate-free' }],
  },
  {
    asin: 'B0BEAUTY004', slug: 'coastline-mineral-sunscreen', category: 'beauty-personal-care', title: 'Coastline Mineral Sunscreen SPF 50 Face Lotion', brand: 'Coastline', department: 'Sun Care', description: 'A lightweight mineral sunscreen with broad-spectrum protection and a sheer finish.', manufacturer: 'Coastline Wellness', modelNumber: 'CL-SPF-50', origin: 'Imported', badges: ['New Arrival'],
    variants: [{ sku: 'CL-SPF-50-50ML', style: '50 ml', price: 999, listPrice: 1399, quantityAvailable: 41 }],
    specifications: [{ group: 'highlights', label: 'Sun protection', value: 'Broad spectrum SPF 50' }, { group: 'details', label: 'Skin type', value: 'Sensitive skin' }, { group: 'details', label: 'Finish', value: 'Lightweight sheer finish' }],
  },
  {
    asin: 'B0SPORT001', slug: 'trailmark-yoga-mat', category: 'sports-outdoors', title: 'Trailmark Non-Slip Exercise and Yoga Mat', brand: 'Trailmark', department: 'Yoga', description: 'A cushioned, textured mat for yoga, stretching, and home workouts.', manufacturer: 'Trailmark Active', modelNumber: 'TM-MAT-6', origin: 'Imported', badges: ['Best Seller'],
    variants: [{ sku: 'TM-MAT-6-PURPLE', color: 'Purple', style: '6 mm', price: 1299, listPrice: 1899, quantityAvailable: 37 }],
    specifications: [{ group: 'highlights', label: 'Surface', value: 'Textured non-slip surface' }, { group: 'details', label: 'Activity', value: 'Yoga and fitness' }, { group: 'dimensions', label: 'Dimensions', value: '72 x 24 x 0.24 inches' }],
  },
  {
    asin: 'B0SPORT002', slug: 'pacerun-running-shoes', category: 'sports-outdoors', title: 'PaceRun Lightweight Road Running Shoes', brand: 'PaceRun', department: 'Running', description: 'Responsive daily trainers with breathable mesh and a cushioned heel.', manufacturer: 'PaceRun Athletics', modelNumber: 'PR-RUN-220', origin: 'Imported',
    variants: [{ sku: 'PR-RUN-220-BLUE-9', color: 'Blue', size: 'US 9', price: 2999, listPrice: 4499, quantityAvailable: 15 }, { sku: 'PR-RUN-220-BLUE-10', color: 'Blue', size: 'US 10', price: 2999, listPrice: 4499, quantityAvailable: 21 }],
    specifications: [{ group: 'highlights', label: 'Upper', value: 'Breathable engineered mesh' }, { group: 'details', label: 'Activity', value: 'Road running' }, { group: 'dimensions', label: 'Closure', value: 'Lace-up' }],
  },
  {
    asin: 'B0SPORT003', slug: 'summit-hydration-backpack', category: 'sports-outdoors', title: 'SummitTrail 12L Hydration Running Backpack', brand: 'SummitTrail', department: 'Outdoor Recreation', description: 'A lightweight hydration pack with reflective trim and room for essentials.', manufacturer: 'SummitTrail Gear', modelNumber: 'ST-PACK-12', origin: 'Imported',
    variants: [{ sku: 'ST-PACK-12-BLACK', color: 'Black', style: '12 liter', price: 2199, listPrice: 3299, quantityAvailable: 25 }],
    specifications: [{ group: 'highlights', label: 'Capacity', value: '12 liters' }, { group: 'details', label: 'Included', value: '2-liter hydration bladder' }, { group: 'dimensions', label: 'Features', value: 'Reflective trim and chest strap' }],
  },
  {
    asin: 'B0SPORT004', slug: 'coreforge-adjustable-dumbbells', category: 'sports-outdoors', title: 'CoreForge Adjustable Dumbbell Pair', brand: 'CoreForge', department: 'Strength Training', description: 'Space-saving adjustable dumbbells for progressive strength workouts at home.', manufacturer: 'CoreForge Fitness', modelNumber: 'CF-DB-24', origin: 'Imported',
    variants: [{ sku: 'CF-DB-24-BLACK', color: 'Black', style: 'Up to 24 kg pair', price: 7499, listPrice: 9999, quantityAvailable: 8 }],
    specifications: [{ group: 'highlights', label: 'Weight range', value: '2 to 24 kg per pair' }, { group: 'details', label: 'Activity', value: 'Strength training' }, { group: 'dimensions', label: 'Adjustment', value: 'Selector dial' }],
  },
  {
    asin: 'B0SPORT005', slug: 'campcraft-led-lantern', category: 'sports-outdoors', title: 'CampCraft Rechargeable LED Camping Lantern', brand: 'CampCraft', department: 'Camping', description: 'A rechargeable lantern with adjustable brightness for campsites and emergencies.', manufacturer: 'CampCraft Outdoor', modelNumber: 'CC-LANT-500', origin: 'Imported',
    variants: [{ sku: 'CC-LANT-500-OLIVE', color: 'Olive', price: 1599, listPrice: 2299, quantityAvailable: 29 }],
    specifications: [{ group: 'highlights', label: 'Brightness', value: '500 lumens maximum' }, { group: 'details', label: 'Battery', value: 'Rechargeable USB-C battery' }, { group: 'dimensions', label: 'Runtime', value: 'Up to 48 hours on low' }],
  },
];

async function seedCategories() {
  const categoryIds = new Map<string, string>();

  for (const [displayOrder, category] of categories.entries()) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, displayOrder },
      create: { name: category.name, slug: category.slug, displayOrder },
    });

    categoryIds.set(category.slug, record.id);
    await prisma.facet.deleteMany({ where: { categoryId: record.id } });
    await prisma.facet.createMany({
      data: category.facets.map((facet, facetIndex) => ({
        categoryId: record.id,
        name: facet.name,
        type: facet.type,
        options: facet.options,
        displayOrder: facetIndex,
      })),
    });
  }

  return categoryIds;
}

async function seedProducts(categoryIds: Map<string, string>) {
  for (const productSeed of products) {
    const product = await prisma.product.upsert({
      where: { asin: productSeed.asin },
      update: {
        title: productSeed.title,
        brand: productSeed.brand,
        description: productSeed.description,
        department: productSeed.department,
        manufacturer: productSeed.manufacturer,
        modelNumber: productSeed.modelNumber,
        origin: productSeed.origin,
        categoryId: categoryIds.get(productSeed.category),
        badges: productSeed.badges ?? [],
      },
      create: {
        asin: productSeed.asin,
        title: productSeed.title,
        brand: productSeed.brand,
        description: productSeed.description,
        department: productSeed.department,
        manufacturer: productSeed.manufacturer,
        modelNumber: productSeed.modelNumber,
        origin: productSeed.origin,
        categoryId: categoryIds.get(productSeed.category),
        badges: productSeed.badges ?? [],
      },
    });

    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productSpecification.deleteMany({ where: { productId: product.id } });

    let variantCount = 0;
    for (const variant of productSeed.variants) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          style: variant.style,
          packDescription: variant.packDescription,
          price: variant.price,
          listPrice: variant.listPrice,
          quantityAvailable: variant.quantityAvailable,
          isPrimeEligible: variant.isPrimeEligible ?? false,
        },
      });
      variantCount += 1;
    }

    await prisma.productMedia.createMany({
      data: [1, 2].map((imageNumber) => {
        const url = `https://picsum.photos/seed/${productSeed.slug}-${imageNumber}/800/800`;
        return {
          productId: product.id,
          type: 'image',
          url,
          thumbnailUrl: `https://picsum.photos/seed/${productSeed.slug}-${imageNumber}/240/240`,
          altText: `${productSeed.title} image ${imageNumber}`,
          sortOrder: imageNumber - 1,
        };
      }),
    });

    await prisma.productSpecification.createMany({
      data: productSeed.specifications.map((specification, sortOrder) => ({
        productId: product.id,
        group: specification.group,
        label: specification.label,
        value: specification.value,
        sortOrder,
      })),
    });

    console.log(`Seeded ${productSeed.title} (${variantCount} variant${variantCount === 1 ? '' : 's'})`);
  }
}

async function main() {
  await connectWithRetry();
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
