import { Product, Customer, Enquiry, Communication } from '../types';

export const INITIAL_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'MacBook Air M3 (13.6-inch, 16GB RAM, 512GB SSD)',
    description: 'Apple M3 chip with 8-core CPU and 10-core GPU, Liquid Retina display with True Tone, 18 hours battery life, Midnight finish.',
    category: 'Laptops',
    price: 114900,
    availability: 'Available',
    brand: 'Apple',
    sku: 'LAP-APL-M3-13',
    stockCount: 14,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Processor': 'Apple M3 chip (8-core)',
      'RAM': '16GB Unified Memory',
      'Storage': '512GB SSD',
      'Display': '13.6-inch Liquid Retina',
      'Battery': 'Up to 18 hours'
    }
  },
  {
    name: 'Asus Vivobook 15 (Intel Core i5 12th Gen, 16GB, 512GB SSD)',
    description: 'Slim and lightweight everyday laptop with FHD Anti-Glare display, backlit keyboard, fingerprint sensor, Quiet Blue.',
    category: 'Laptops',
    price: 44990,
    availability: 'Available',
    brand: 'Asus',
    sku: 'LAP-ASU-V15-I5',
    stockCount: 22,
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Processor': 'Intel Core i5-1235U',
      'RAM': '16GB DDR4',
      'Storage': '512GB NVMe SSD',
      'Display': '15.6-inch FHD (1920x1080)',
      'Weight': '1.7 kg'
    }
  },
  {
    name: 'Lenovo IdeaPad Slim 3 (AMD Ryzen 5 7520U, 8GB, 512GB SSD)',
    description: 'Budget-friendly work and study laptop with Dolby Audio speakers, privacy shutter webcam, and rapid charging.',
    category: 'Laptops',
    price: 38990,
    availability: 'Available',
    brand: 'Lenovo',
    sku: 'LAP-LEN-S3-R5',
    stockCount: 18,
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Processor': 'AMD Ryzen 5 7520U',
      'RAM': '8GB LPDDR5',
      'Storage': '512GB SSD',
      'Display': '15.6-inch FHD',
      'OS': 'Windows 11 Home'
    }
  },
  {
    name: 'Dell XPS 14 (Intel Core Ultra 7, 32GB, 1TB SSD, RTX 4050)',
    description: 'Premium creator laptop with 3.2K OLED Touch display, CNC machined aluminum body, and NVIDIA GeForce RTX 4050 graphics.',
    category: 'Laptops',
    price: 189990,
    availability: 'Available',
    brand: 'Dell',
    sku: 'LAP-DEL-XPS14',
    stockCount: 6,
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Processor': 'Intel Core Ultra 7 155H',
      'Graphics': 'NVIDIA RTX 4050 6GB',
      'RAM': '32GB LPDDR5X',
      'Storage': '1TB PCIe 4.0 SSD'
    }
  },
  {
    name: 'iPhone 16 (128GB, Teal)',
    description: 'Latest Apple iPhone with Camera Control, 48MP Fusion camera, A18 Bionic chip, Ceramic Shield front, and action button.',
    category: 'Smartphones',
    price: 79900,
    availability: 'Available',
    brand: 'Apple',
    sku: 'PHO-APL-IP16-128',
    stockCount: 19,
    imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Display': '6.1-inch Super Retina XDR',
      'Chip': 'A18 chip',
      'Camera': '48MP + 12MP Ultra Wide',
      'Connectivity': '5G, USB-C'
    }
  },
  {
    name: 'OnePlus 12R (16GB RAM, 256GB Storage, Cool Blue)',
    description: 'Flagship killer with Snapdragon 8 Gen 2, 120Hz 1.5K ProXDR Display, and 100W SUPERVOOC fast charging.',
    category: 'Smartphones',
    price: 39999,
    availability: 'Available',
    brand: 'OnePlus',
    sku: 'PHO-1P-12R-256',
    stockCount: 15,
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Processor': 'Snapdragon 8 Gen 2',
      'Battery': '5500 mAh with 100W Charger',
      'Display': '6.78-inch 120Hz AMOLED',
      'Camera': '50MP Sony IMX890'
    }
  },
  {
    name: 'Samsung Galaxy S24 Ultra (12GB RAM, 256GB, Titanium Gray)',
    description: 'Galaxy AI powered smartphone with Titanium frame, built-in S Pen, 200MP Quad Telephoto camera, and Snapdragon 8 Gen 3.',
    category: 'Smartphones',
    price: 129999,
    availability: 'Out of Stock',
    brand: 'Samsung',
    sku: 'PHO-SAM-S24U-256',
    stockCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Processor': 'Snapdragon 8 Gen 3 for Galaxy',
      'S-Pen': 'Included',
      'Camera': '200MP Main + 50MP 5x Periscope',
      'Display': '6.8-inch Dynamic AMOLED 2X 120Hz'
    }
  },
  {
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation with two processors and 8 microphones, LDAC Hi-Res audio, and 30-hour battery life.',
    category: 'Audio',
    price: 29990,
    availability: 'Available',
    brand: 'Sony',
    sku: 'AUD-SNY-XM5-BLK',
    stockCount: 25,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Driver': '30mm carbon fiber composite',
      'Battery': '30 hours with ANC on',
      'Microphones': '8 microphones for crystal clear calls',
      'Weight': '250 grams'
    }
  },
  {
    name: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
    description: '76% layout QMK/VIA programmable full aluminum mechanical keyboard with hot-swappable Keychron K Pro Banana tactile switches.',
    category: 'Keyboards & Accessories',
    price: 17499,
    availability: 'Available',
    brand: 'Keychron',
    sku: 'ACC-KEY-Q1PRO',
    stockCount: 11,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Connectivity': 'Bluetooth 5.1 & Type-C Wired',
      'Body': 'CNC Full Anodized Aluminum',
      'Switches': 'K Pro Tactile Banana (Hot-swappable)',
      'Keycaps': 'Double-shot KSA PBT'
    }
  },
  {
    name: 'Logitech MX Master 3S Wireless Performance Mouse',
    description: 'Quiet click precision ergonomic mouse with 8K DPI sensor for any surface, MagSpeed electromagnetic scrolling, and Flow cross-computer control.',
    category: 'Keyboards & Accessories',
    price: 9495,
    availability: 'Available',
    brand: 'Logitech',
    sku: 'ACC-LOG-MXM3S',
    stockCount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Sensor': '8,000 DPI Darkfield laser',
      'Battery': '70 days on full charge',
      'Scroll Wheel': 'MagSpeed 1,000 lines/sec',
      'Buttons': '7 programmable buttons'
    }
  },
  {
    name: 'Dell UltraSharp 27 4K USB-C Hub Monitor (U2723QE)',
    description: 'Brilliant 4K UHD resolution with IPS Black technology, 2000:1 contrast ratio, 98% DCI-P3, and 90W USB-C power delivery hub.',
    category: 'Monitors',
    price: 49990,
    availability: 'Available',
    brand: 'Dell',
    sku: 'MON-DEL-U2723QE',
    stockCount: 8,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Panel': '27-inch IPS Black 4K (3840x2160)',
      'Contrast Ratio': '2,000:1',
      'Connectivity': 'USB-C (90W PD), DisplayPort 1.4, HDMI 2.0, RJ45 LAN',
      'Color Gamut': '100% sRGB, 98% DCI-P3'
    }
  },
  {
    name: 'LG UltraGear 27-inch QHD Nano IPS Gaming Monitor (27GP850)',
    description: '180Hz (O/C) refresh rate, 1ms GtG response time, NVIDIA G-SYNC Compatible, HDR400, and pivot adjustable stand.',
    category: 'Monitors',
    price: 24999,
    availability: 'Available',
    brand: 'LG',
    sku: 'MON-LG-27GP850',
    stockCount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80',
    specs: {
      'Resolution': 'QHD 2560 x 1440',
      'Refresh Rate': '165Hz (Overclockable to 180Hz)',
      'Response Time': '1ms (GtG at Faster)',
      'Sync': 'NVIDIA G-SYNC & AMD FreeSync Premium'
    }
  }
];

export const INITIAL_CUSTOMERS: Omit<Customer, 'id' | 'createdAt'>[] = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma88@gmail.com',
    phone: '+91 98201 45678',
    address: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
    notes: 'Interested in programming laptops with 16GB RAM under ₹50,000.'
  },
  {
    name: 'Priya Patel',
    email: 'priyapatel.design@gmail.com',
    phone: '+91 98795 23410',
    address: 'Navrangpura, Ahmedabad, Gujarat 380009',
    notes: 'Graphic designer looking for high color accuracy 4K monitors and MacBook accessories.'
  },
  {
    name: 'Amit Verma',
    email: 'amit.verma92@outlook.com',
    phone: '+91 94150 99881',
    address: 'Sector 62, Noida, Uttar Pradesh 201309',
    notes: 'Looking for a reliable smartphone with good battery life below ₹45,000.'
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@techventures.in',
    phone: '+91 99890 12345',
    address: 'Hitec City, Madhapur, Hyderabad 500081',
    notes: 'Corporate procurement for mechanical keyboards and noise cancelling headsets.'
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.m@zenithcorp.com',
    phone: '+91 98111 67890',
    address: 'Bandra West, Mumbai, Maharashtra 400050',
    notes: 'Inquired about bulk corporate discount on MacBook Air M3 units.'
  }
];
