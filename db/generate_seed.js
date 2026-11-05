const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const ASSETS_DIR = path.join(FRONTEND_DIR, 'assets', 'products');

const CATEGORIES = [
  { id: 1, name: 'Electronics', slug: 'electronics', icon: 'tv', color: '#106EBE' },
  { id: 2, name: 'Computers & Laptops', slug: 'computers-laptops', icon: 'laptop', color: '#2B579A' },
  { id: 3, name: 'Mobiles & Accessories', slug: 'mobiles-accessories', icon: 'smartphone', color: '#008299' },
  { id: 4, name: 'Audio', slug: 'audio', icon: 'headphones', color: '#D83B01' },
  { id: 5, name: 'Cameras', slug: 'cameras', icon: 'camera', color: '#B4009E' },
  { id: 6, name: 'Fashion', slug: 'fashion', icon: 'shirt', color: '#E3008C' },
  { id: 7, name: 'Men\'s Fashion', slug: 'mens-fashion', icon: 'user', color: '#0078D4' },
  { id: 8, name: 'Women\'s Fashion', slug: 'womens-fashion', icon: 'heart', color: '#C239B3' },
  { id: 9, name: 'Shoes', slug: 'shoes', icon: 'footwear', color: '#D13438' },
  { id: 10, name: 'Bags & Accessories', slug: 'bags-accessories', icon: 'bag', color: '#004E8C' },
  { id: 11, name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'home', color: '#107C41' },
  { id: 12, name: 'Furniture', slug: 'furniture', icon: 'chair', color: '#7A7574' },
  { id: 13, name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: 'sparkles', color: '#E3008C' },
  { id: 14, name: 'Sports & Fitness', slug: 'sports-fitness', icon: 'activity', color: '#00B7C3' },
  { id: 15, name: 'Books', slug: 'books', icon: 'book', color: '#8E562E' },
  { id: 16, name: 'Gaming', slug: 'gaming', icon: 'gamepad', color: '#5C2D91' },
  { id: 17, name: 'Toys & Kids', slug: 'toys-kids', icon: 'smile', color: '#F2C811' },
  { id: 18, name: 'Automotive', slug: 'automotive', icon: 'car', color: '#498205' },
  { id: 19, name: 'Smart Home', slug: 'smart-home', icon: 'zap', color: '#00B294' },
  { id: 20, name: 'Office & Stationery', slug: 'office-stationery', icon: 'briefcase', color: '#0078D4' }
];

const PRODUCTS_DATA = [
  // 1: Electronics
  { catId: 1, sellerId: 4, title: 'Samsung 55-inch 4K Smart TV', brand: 'Samsung', price: 39999, cond: 'NEW', qty: 20, desc: 'Crystal 4K UHD Smart TV with PurColor, HDR10+, and Motion Xcelerator for ultra-smooth video.' },
  { catId: 1, sellerId: 4, title: 'Sony Bravia 43-inch 4K LED TV', brand: 'Sony', price: 44999, cond: 'NEW', qty: 15, desc: 'Google TV with X1 4K Processor, Dolby Audio, and Motionflow XR 100.' },
  { catId: 1, sellerId: 4, title: 'Xiaomi 43-inch 4K Smart TV', brand: 'Xiaomi', price: 24999, cond: 'NEW', qty: 30, desc: 'PatchWall with Android TV 11, Dolby Vision, and 30W stereo speakers.' },
  { catId: 1, sellerId: 4, title: 'OnePlus 55-inch Ultra HD Smart TV', brand: 'OnePlus', price: 38999, cond: 'NEW', qty: 18, desc: 'Gamma Engine, 1 Billion Colors, Dolby Atmos, and Bezel-less design.' },
  { catId: 1, sellerId: 8, title: 'Philips Home Theatre Speaker System', brand: 'Philips', price: 12999, cond: 'NEW', qty: 25, desc: '5.1 Channel Surround Sound system with Bluetooth and FM connectivity.' },
  { catId: 1, sellerId: 4, title: 'LG 32-inch HD Ready Smart LED TV', brand: 'LG', price: 15499, cond: 'NEW', qty: 40, desc: 'WebOS Smart TV with Active HDR, AI ThinQ, and Quad Core Processor.' },
  { catId: 1, sellerId: 8, title: 'Panasonic Lumix Digital Projector', brand: 'Panasonic', price: 29999, cond: 'LIKE_NEW', qty: 12, desc: 'Compact Full HD home projector with 3500 lumens brightness.' },
  { catId: 1, sellerId: 4, title: 'TCL 50-inch 4K QLED Smart TV', brand: 'TCL', price: 32999, cond: 'NEW', qty: 22, desc: 'Hands-free voice control, Quantum Dot display, and ONKYO audio.' },
  { catId: 1, sellerId: 8, title: 'BenQ Full HD Home Cinema Projector', brand: 'BenQ', price: 49999, cond: 'NEW', qty: 10, desc: 'Rec.709 cinematic color presentation with ultra-low input lag.' },
  { catId: 1, sellerId: 4, title: 'Vu 55-inch Masterpiece 4K TV', brand: 'Vu', price: 42999, cond: 'NEW', qty: 15, desc: 'QLED technology with built-in 50W soundbar and Armani Gold frame.' },

  // 2: Computers & Laptops
  { catId: 2, sellerId: 4, title: 'HP Pavilion 15 Laptop', brand: 'HP', price: 58999, cond: 'NEW', qty: 25, desc: '13th Gen Intel Core i5 processor, 16GB RAM, 512GB SSD, Windows 11.' },
  { catId: 2, sellerId: 4, title: 'Lenovo IdeaPad Slim 3', brand: 'Lenovo', price: 42999, cond: 'NEW', qty: 30, desc: 'AMD Ryzen 5, 8GB RAM, 512GB SSD, FHD Anti-Glare display.' },
  { catId: 2, sellerId: 4, title: 'ASUS Vivobook 15', brand: 'ASUS', price: 49999, cond: 'NEW', qty: 20, desc: 'Intel Core i5 12th Gen, 16GB RAM, Fingerprint reader, Iris Xe graphics.' },
  { catId: 2, sellerId: 4, title: 'Dell Inspiron 15', brand: 'Dell', price: 54999, cond: 'NEW', qty: 15, desc: 'Intel Core i5, 16GB RAM, ExpressCharge, ComfortView display.' },
  { catId: 2, sellerId: 4, title: 'Acer Aspire 5', brand: 'Acer', price: 39999, cond: 'NEW', qty: 35, desc: 'Intel Core i3 12th Gen, 8GB RAM, 512GB SSD, Thin aluminum chassis.' },
  { catId: 2, sellerId: 4, title: 'Apple MacBook Air M2', brand: 'Apple', price: 99900, cond: 'NEW', qty: 10, desc: 'M2 chip with 8-core CPU and 8-core GPU, 8GB Unified Memory, 256GB SSD.' },
  { catId: 2, sellerId: 8, title: 'Dell 24-inch Full HD Monitor', brand: 'Dell', price: 11499, cond: 'NEW', qty: 40, desc: 'IPS panel, 75Hz refresh rate, AMD FreeSync, ultra-thin bezels.' },
  { catId: 2, sellerId: 8, title: 'Logitech MX Keys Wireless Keyboard', brand: 'Logitech', price: 8995, cond: 'NEW', qty: 50, desc: 'Tactile responsive keys, smart illumination, multi-device Bluetooth pairing.' },
  { catId: 2, sellerId: 8, title: 'Logitech MX Master 3S Wireless Mouse', brand: 'Logitech', price: 9495, cond: 'NEW', qty: 45, desc: '8K DPI track-on-glass sensor, quiet click buttons, MagSpeed electromagnetic scroll.' },
  { catId: 2, sellerId: 8, title: 'HP Wireless Multi-Function Printer', brand: 'HP', price: 13999, cond: 'NEW', qty: 20, desc: 'Print, scan, copy with auto-duplexing and smart app wireless printing.' },

  // 3: Mobiles & Accessories
  { catId: 3, sellerId: 4, title: 'Samsung Galaxy S23 5G', brand: 'Samsung', price: 64999, cond: 'NEW', qty: 30, desc: 'Snapdragon 8 Gen 2, 50MP Pro-grade camera, Nightography, 120Hz AMOLED.' },
  { catId: 3, sellerId: 4, title: 'OnePlus 11R 5G', brand: 'OnePlus', price: 39999, cond: 'NEW', qty: 25, desc: 'Snapdragon 8+ Gen 1, 100W SUPERVOOC charging, 50MP Sony IMX890 sensor.' },
  { catId: 3, sellerId: 4, title: 'Xiaomi Redmi Note 13 Pro', brand: 'Xiaomi', price: 21999, cond: 'NEW', qty: 50, desc: '200MP OIS camera, 120Hz 1.5K AMOLED display, 67W fast turbo charging.' },
  { catId: 3, sellerId: 4, title: 'Motorola Edge 40 Neo', brand: 'Motorola', price: 22999, cond: 'NEW', qty: 35, desc: 'IP68 underwater protection, 144Hz curved pOLED display, Dimensity 7030.' },
  { catId: 3, sellerId: 4, title: 'Realme 12 Pro+ 5G', brand: 'Realme', price: 29999, cond: 'NEW', qty: 40, desc: 'Periscope portrait camera, Submarine Blue vegan leather back, 67W charge.' },
  { catId: 3, sellerId: 8, title: 'Anker 20000mAh Power Bank', brand: 'Anker', price: 2499, cond: 'NEW', qty: 75, desc: 'PowerIQ high-speed charging technology with twin USB-A and USB-C output.' },
  { catId: 3, sellerId: 8, title: 'boAt 65W Fast Charger', brand: 'boAt', price: 1299, cond: 'NEW', qty: 100, desc: 'GaN tech multi-port wall charger suitable for laptops and smartphones.' },
  { catId: 3, sellerId: 8, title: 'Spigen Tough Armor Phone Case', brand: 'Spigen', price: 1499, cond: 'NEW', qty: 80, desc: 'Dual-layer military grade drop protection with built-in kickstand.' },
  { catId: 3, sellerId: 8, title: 'Belkin Braided USB-C Cable', brand: 'Belkin', price: 799, cond: 'NEW', qty: 120, desc: 'Double-braided nylon charging cable, 2 meters long, USB-IF certified.' },
  { catId: 3, sellerId: 8, title: 'Wireless Fast Charging Pad 15W', brand: 'Samsung', price: 1999, cond: 'NEW', qty: 60, desc: 'Sleek Qi-certified wireless charging pad with LED indicator and cooling fan.' },

  // 4: Audio
  { catId: 4, sellerId: 8, title: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', price: 26990, cond: 'NEW', qty: 20, desc: 'Industry leading noise canceling with Auto NC Optimizer, 30-hour battery.' },
  { catId: 4, sellerId: 8, title: 'JBL Tune 760NC Noise Cancelling Headphones', brand: 'JBL', price: 5499, cond: 'NEW', qty: 35, desc: 'Active Noise Cancelling over-ear headphones with JBL Pure Bass Sound.' },
  { catId: 4, sellerId: 8, title: 'boAt Airdopes 141 True Wireless', brand: 'boAt', price: 1299, cond: 'NEW', qty: 100, desc: '42 hours total playback, ENx tech clear calling, IPX4 splash resistance.' },
  { catId: 4, sellerId: 8, title: 'Samsung Galaxy Buds2 Pro', brand: 'Samsung', price: 11999, cond: 'NEW', qty: 30, desc: '24-bit Hi-Fi audio, Intelligent ANC, 360 Audio with multi-channel direct.' },
  { catId: 4, sellerId: 8, title: 'OnePlus Buds Pro 2', brand: 'OnePlus', price: 8999, cond: 'NEW', qty: 40, desc: 'Co-created with Dynaudio, Smart Adaptive Noise Cancellation, dual drivers.' },
  { catId: 4, sellerId: 8, title: 'JBL Flip 6 Portable Bluetooth Speaker', brand: 'JBL', price: 9999, cond: 'NEW', qty: 45, desc: 'Bold JBL Original Pro Sound, IP67 waterproof and dustproof, 12H playtime.' },
  { catId: 4, sellerId: 8, title: 'Sony Extra Bass Bluetooth Speaker', brand: 'Sony', price: 4490, cond: 'NEW', qty: 50, desc: 'Compact wireless speaker with Sound Diffusion Processor and EXTRA BASS.' },
  { catId: 4, sellerId: 8, title: 'boAt Stone 1200 Bluetooth Speaker', brand: 'boAt', price: 3499, cond: 'NEW', qty: 60, desc: '14W RMS stereo sound, RGB LEDs, IPX7 water resistance, 9-hour battery.' },
  { catId: 4, sellerId: 8, title: 'RealMe Buds Air 5 Pro', brand: 'Realme', price: 4999, cond: 'NEW', qty: 50, desc: '50dB Active Noise Cancellation, 40 hours battery, LDAC HD audio codec.' },
  { catId: 4, sellerId: 8, title: 'Noise TWS Earbuds with ENC', brand: 'Noise', price: 1799, cond: 'NEW', qty: 80, desc: 'Quad mic Environmental Noise Cancellation, low latency gaming mode.' },

  // 5: Cameras
  { catId: 5, sellerId: 8, title: 'Canon EOS 1500D DSLR Camera', brand: 'Canon', price: 41990, cond: 'NEW', qty: 15, desc: '24.1 MP APS-C CMOS sensor, Digic 4+ image processor, 18-55mm lens kit.' },
  { catId: 5, sellerId: 8, title: 'Nikon D5600 DSLR Camera', brand: 'Nikon', price: 56499, cond: 'NEW', qty: 12, desc: '24.2 MP DX-format sensor, 3.2-inch touch vari-angle LCD, SnapBridge Bluetooth.' },
  { catId: 5, sellerId: 8, title: 'Sony Alpha ILCE-6400 Mirrorless Camera', brand: 'Sony', price: 74990, cond: 'NEW', qty: 10, desc: 'Real-time Eye AF, 4K HDR video recording, 24.2MP Exmor CMOS sensor.' },
  { catId: 5, sellerId: 8, title: 'GoPro HERO12 Black Action Camera', brand: 'GoPro', price: 37990, cond: 'NEW', qty: 25, desc: '5.3K60 video, HyperSmooth 6.0 stabilization, waterproof to 33ft.' },
  { catId: 5, sellerId: 8, title: 'DJI Osmo Action 4 Camera', brand: 'DJI', price: 31990, cond: 'NEW', qty: 20, desc: '1/1.3-inch sensor, low-light performance, 4K/120fps ultra-wide FOV.' },
  { catId: 5, sellerId: 8, title: 'Canon EF 50mm f/1.8 STM Lens', brand: 'Canon', price: 9995, cond: 'NEW', qty: 30, desc: 'Prime lens ideal for portraits, low-light shooting, background blur.' },
  { catId: 5, sellerId: 8, title: 'SanDisk Extreme Pro 128GB Memory Card', brand: 'SanDisk', price: 1899, cond: 'NEW', qty: 100, desc: 'Up to 200MB/s read speeds, UHS-I, U3, V30 specs for 4K UHD video.' },
  { catId: 5, sellerId: 8, title: 'Digitek Professional Camera Tripod', brand: 'Digitek', price: 1699, cond: 'NEW', qty: 60, desc: 'Aluminum alloy tripod with 360-degree ball head and quick release plate.' },
  { catId: 5, sellerId: 8, title: 'Vanguard DSLR Camera Backpack', brand: 'Vanguard', price: 3499, cond: 'NEW', qty: 40, desc: 'Waterproof camera bag with padded compartments and tripod harness.' },
  { catId: 5, sellerId: 8, title: 'Ring Light with Tripod Stand', brand: 'Osaka', price: 1299, cond: 'NEW', qty: 75, desc: '18-inch LED ring light with 3 color modes for vlogging and studio photo.' },

  // 6: Fashion
  { catId: 6, sellerId: 5, title: 'Premium Cotton Casual T-Shirt', brand: 'Roadster', price: 699, cond: 'NEW', qty: 100, desc: '100% combed cotton crew neck t-shirt with soft bio-wash finish.' },
  { catId: 6, sellerId: 5, title: 'Classic Denim Jacket', brand: 'Levis', price: 3499, cond: 'NEW', qty: 40, desc: 'Iconic trucker denim jacket with button flap chest pockets.' },
  { catId: 6, sellerId: 5, title: 'Slim Fit Chino Trousers', brand: 'Allen Solly', price: 1899, cond: 'NEW', qty: 60, desc: 'Stretch cotton chinos with flat front design for casual elegance.' },
  { catId: 6, sellerId: 5, title: 'Cotton Pullover Hoodie', brand: 'US Polo', price: 2199, cond: 'NEW', qty: 50, desc: 'Kangaroo pocket fleece hoodie with embroidered brand logo.' },
  { catId: 6, sellerId: 5, title: 'Linen Casual Button-Down Shirt', brand: 'Van Heusen', price: 1799, cond: 'NEW', qty: 55, desc: 'Breathable linen cotton blend shirt with curved hemline.' },
  { catId: 6, sellerId: 5, title: 'Unisex Oversized Streetwear Hoodie', brand: 'HRX', price: 1499, cond: 'NEW', qty: 70, desc: 'Relaxed fit drop-shoulder hoodie in heavyweight French terry.' },
  { catId: 6, sellerId: 5, title: 'Classic Leather Belt', brand: 'Louis Philippe', price: 1199, cond: 'NEW', qty: 80, desc: '100% genuine full-grain leather belt with brushed metallic buckle.' },
  { catId: 6, sellerId: 5, title: 'All-Weather Windbreaker Jacket', brand: 'Puma', price: 2899, cond: 'NEW', qty: 45, desc: 'Water-repellent zip-up jacket with windCELL technology.' },
  { catId: 6, sellerId: 5, title: 'Casual Sweatshirt', brand: 'Jack & Jones', price: 1699, cond: 'NEW', qty: 65, desc: 'Ribbed crew-neck sweatshirt in comfortable cotton blend.' },
  { catId: 6, sellerId: 5, title: 'Lightweight Summer Shorts', brand: 'Adidas', price: 1299, cond: 'NEW', qty: 90, desc: 'Breathable drawstring shorts with moisture-absorbing AEROREADY.' },

  // 7: Men's Fashion
  { catId: 7, sellerId: 5, title: 'Raymond Slim Fit Formal Shirt', brand: 'Raymond', price: 1999, cond: 'NEW', qty: 50, desc: 'Pure cotton formal dress shirt with single convertible cuffs.' },
  { catId: 7, sellerId: 5, title: 'Peter England Regular Fit Jeans', brand: 'Peter England', price: 1699, cond: 'NEW', qty: 60, desc: 'Medium shade Indigo wash denim with 5-pocket styling.' },
  { catId: 7, sellerId: 5, title: 'Park Avenue Formal Suit Blazer', brand: 'Park Avenue', price: 5999, cond: 'NEW', qty: 25, desc: 'Single-breasted 2-button formal blazer in fine poly-viscose.' },
  { catId: 7, sellerId: 5, title: 'Manyavar Cotton Printed Kurta', brand: 'Manyavar', price: 2499, cond: 'NEW', qty: 40, desc: 'Traditional ethnic kurta with mandarin collar and side slits.' },
  { catId: 7, sellerId: 5, title: 'Arrow Formal Trousers', brand: 'Arrow', price: 2199, cond: 'NEW', qty: 50, desc: 'Wrinkle-resistant formal trousers with autofit expandable waistband.' },
  { catId: 7, sellerId: 5, title: 'Blackberrys Casual Polo T-Shirt', brand: 'Blackberrys', price: 1499, cond: 'NEW', qty: 75, desc: 'Pique cotton solid polo t-shirt with ribbed collar and cuffs.' },
  { catId: 7, sellerId: 5, title: 'Flying Machine Slim Denim Jeans', brand: 'Flying Machine', price: 2299, cond: 'NEW', qty: 55, desc: 'Stretch denim jeans with subtle whiskering and fade details.' },
  { catId: 7, sellerId: 5, title: 'Louis Philippe Silk Tie Set', brand: 'Louis Philippe', price: 1299, cond: 'NEW', qty: 60, desc: '100% woven silk necktie with matching pocket square.' },
  { catId: 7, sellerId: 5, title: 'Monte Carlo Winter Woolen Sweater', brand: 'Monte Carlo', price: 2799, cond: 'NEW', qty: 35, desc: 'Soft lamb wool blend V-neck pullover sweater.' },
  { catId: 7, sellerId: 5, title: 'Mufti Casual Checkered Shirt', brand: 'Mufti', price: 1899, cond: 'NEW', qty: 65, desc: '100% cotton yarn-dyed checkered casual shirt with chest pocket.' },

  // 8: Women's Fashion
  { catId: 8, sellerId: 5, title: 'Biba Printed Cotton Anarkali Kurti', brand: 'Biba', price: 2299, cond: 'NEW', qty: 50, desc: 'Flared Anarkali kurta with traditional foil print accents.' },
  { catId: 8, sellerId: 5, title: 'W for Woman Casual Top', brand: 'W', price: 1299, cond: 'NEW', qty: 70, desc: 'Contemporary tunic-style top with keyhole neck design.' },
  { catId: 8, sellerId: 5, title: 'Aurelia Ethnic Salwar Suit Set', brand: 'Aurelia', price: 2899, cond: 'NEW', qty: 40, desc: '3-piece ethnic set with straight kurta, churidar and dupatta.' },
  { catId: 8, sellerId: 5, title: 'Vero Moda Casual Summer Dress', brand: 'Vero Moda', price: 2499, cond: 'NEW', qty: 45, desc: 'A-line floral midi dress with elasticated waist and tie-up.' },
  { catId: 8, sellerId: 5, title: 'Levis High-Rise Skinny Jeans', brand: 'Levis', price: 2799, cond: 'NEW', qty: 60, desc: '721 High-Rise skinny jeans in super-stretch denim.' },
  { catId: 8, sellerId: 5, title: 'FabIndia Silk Blend Saree', brand: 'FabIndia', price: 4999, cond: 'NEW', qty: 30, desc: 'Handcrafted Chanderi silk saree with zari border.' },
  { catId: 8, sellerId: 5, title: 'ONLY Casual Denim Jacket', brand: 'ONLY', price: 3199, cond: 'NEW', qty: 35, desc: 'Cropped light-wash denim jacket with raw hem.' },
  { catId: 8, sellerId: 5, title: 'Forever 21 Floral Print Maxi Dress', brand: 'Forever 21', price: 1999, cond: 'NEW', qty: 50, desc: 'Tiered maxi dress with adjustable cami shoulder straps.' },
  { catId: 8, sellerId: 5, title: 'Global Desi Printed Palazzo Pants', brand: 'Global Desi', price: 1499, cond: 'NEW', qty: 65, desc: 'Wide-leg printed trousers with comfortable elastic waistband.' },
  { catId: 8, sellerId: 5, title: 'Allen Solly Women Formal Blazer', brand: 'Allen Solly', price: 4499, cond: 'NEW', qty: 25, desc: 'Single-breasted tailored workwear blazer for women.' },

  // 9: Shoes
  { catId: 9, sellerId: 7, title: 'Nike Revolution 6 Running Shoes', brand: 'Nike', price: 3695, cond: 'NEW', qty: 40, desc: 'Plush mesh upper with foam midsole for responsive cushioning.' },
  { catId: 9, sellerId: 7, title: 'Adidas Ultraboost Light Shoes', brand: 'Adidas', price: 11999, cond: 'NEW', qty: 20, desc: 'Lightest Boost cushioning technology with Primeknit+ upper.' },
  { catId: 9, sellerId: 7, title: 'Puma Smash v2 Leather Sneakers', brand: 'Puma', price: 2999, cond: 'NEW', qty: 50, desc: 'Soft leather upper with classic rubber cupsole sneaker design.' },
  { catId: 9, sellerId: 7, title: 'Reebok Zig Dynamica Running Shoes', brand: 'Reebok', price: 4199, cond: 'NEW', qty: 35, desc: 'ZigTech energy-return outsole with breathable mesh construction.' },
  { catId: 9, sellerId: 7, title: 'Bata Leather Formal Shoes', brand: 'Bata', price: 2299, cond: 'NEW', qty: 60, desc: 'Genuine leather derby formal shoes with cushioned footbed.' },
  { catId: 9, sellerId: 7, title: 'Red Tape Casual Loafers', brand: 'Red Tape', price: 1799, cond: 'NEW', qty: 70, desc: 'Slip-on casual driving loafers in soft synthetic leather.' },
  { catId: 9, sellerId: 7, title: 'Woodland Outdoor Leather Boots', brand: 'Woodland', price: 4995, cond: 'NEW', qty: 30, desc: 'Heavy-duty nubuck leather boots with high-traction rubber lug sole.' },
  { catId: 9, sellerId: 7, title: 'Skechers Go Walk 6 Slip-Ons', brand: 'Skechers', price: 4799, cond: 'NEW', qty: 40, desc: 'ULTRA GO cushioning with High-rebound Hyper Pillar Technology.' },
  { catId: 9, sellerId: 7, title: 'Converse Chuck Taylor All Star', brand: 'Converse', price: 3999, cond: 'NEW', qty: 45, desc: 'High-top canvas sneakers with classic star ankle patch.' },
  { catId: 9, sellerId: 7, title: 'Campus Oxyfit Sports Shoes', brand: 'Campus', price: 1299, cond: 'NEW', qty: 90, desc: 'Phylon active sole with memory foam insole for maximum comfort.' },

  // 10: Bags & Accessories
  { catId: 10, sellerId: 5, title: 'Wildcraft 45L Travel Backpack', brand: 'Wildcraft', price: 2499, cond: 'NEW', qty: 50, desc: 'Ergonomic back support with rain cover and multi-compartment storage.' },
  { catId: 10, sellerId: 5, title: 'American Tourister 32L Laptop Backpack', brand: 'American Tourister', price: 1899, cond: 'NEW', qty: 60, desc: 'Padded laptop sleeve for 15.6" screens, water-resistant fabric.' },
  { catId: 10, sellerId: 5, title: 'Tommy Hilfiger Genuine Leather Wallet', brand: 'Tommy Hilfiger', price: 1799, cond: 'NEW', qty: 80, desc: 'Bifold leather wallet with RFID blocking technology and coin pocket.' },
  { catId: 10, sellerId: 5, title: 'Lavie Women Handbag Set', brand: 'Lavie', price: 2299, cond: 'NEW', qty: 45, desc: 'Tote handbag with detachable sling strap and matching zip pouch.' },
  { catId: 10, sellerId: 5, title: 'Caprese Sling Bag for Women', brand: 'Caprese', price: 1699, cond: 'NEW', qty: 55, desc: 'Faux leather crossbody sling bag with gold-toned metal logo.' },
  { catId: 10, sellerId: 5, title: 'Skybags 55cm Cabin Luggage Suitcase', brand: 'Skybags', price: 3999, cond: 'NEW', qty: 30, desc: 'Hard-cased polycarbonate spinner trolley bag with 360-degree wheels.' },
  { catId: 10, sellerId: 5, title: 'Fossil Men Leather Card Holder', brand: 'Fossil', price: 1495, cond: 'NEW', qty: 70, desc: 'Slim magnetic card case crafted in smooth genuine leather.' },
  { catId: 10, sellerId: 5, title: 'Safari Duffle Bag with Wheels', brand: 'Safari', price: 2199, cond: 'NEW', qty: 40, desc: 'Spacious travel duffle bag with retractable push-button trolley handle.' },
  { catId: 10, sellerId: 5, title: 'Ray-Ban Aviator Sunglasses', brand: 'Ray-Ban', price: 6590, cond: 'NEW', qty: 35, desc: 'Classic G-15 green polarized lenses with gold metal frame.' },
  { catId: 10, sellerId: 5, title: 'Fastrack UV Protected Wayfarer', brand: 'Fastrack', price: 1199, cond: 'NEW', qty: 90, desc: '100% UV400 protected glare-free fashion wayfarer sunglasses.' },

  // 11: Home & Kitchen
  { catId: 11, sellerId: 6, title: 'Philips Digital Air Fryer HD9252', brand: 'Philips', price: 8999, cond: 'NEW', qty: 25, desc: 'Rapid Air technology for 90% less oil frying, 7 preset touch menus.' },
  { catId: 11, sellerId: 6, title: 'Prestige 1.5L Electric Kettle', brand: 'Prestige', price: 899, cond: 'NEW', qty: 100, desc: 'Stainless steel electric kettle with auto shut-off and concealed element.' },
  { catId: 11, sellerId: 6, title: 'Bajaj Rex 500W Mixer Grinder', brand: 'Bajaj', price: 2299, cond: 'NEW', qty: 50, desc: '3 stainless steel jars with multifunctional blade system.' },
  { catId: 11, sellerId: 6, title: 'Wonderchef Nutri-Blend Mixer', brand: 'Wonderchef', price: 2799, cond: 'NEW', qty: 40, desc: 'Compact bullet blender with surgical steel blades for smoothie grinding.' },
  { catId: 11, sellerId: 6, title: 'Pigeon Non-Stick Cookware 3-Piece Set', brand: 'Pigeon', price: 1499, cond: 'NEW', qty: 70, desc: 'Fry pan, kadai with glass lid, and flat tawa with 5-layer coating.' },
  { catId: 11, sellerId: 6, title: 'Borosil Opalware 35-Piece Dinner Set', brand: 'Borosil', price: 3499, cond: 'NEW', qty: 30, desc: 'Chip-resistant, microwave safe toughened glass opalware set.' },
  { catId: 11, sellerId: 6, title: 'Milton Thermosteel 1L Water Bottle', brand: 'Milton', price: 849, cond: 'NEW', qty: 120, desc: 'Vacuum insulated double-wall stainless steel flask keeps hot/cold for 24h.' },
  { catId: 11, sellerId: 6, title: 'Kent Instant Egg Boiler', brand: 'Kent', price: 1199, cond: 'NEW', qty: 80, desc: 'Boils 7 eggs at a time with 3 boiling modes (hard, medium, soft).' },
  { catId: 11, sellerId: 6, title: 'Morphy Richards 20L Microwave Oven', brand: 'Morphy Richards', price: 6499, cond: 'NEW', qty: 20, desc: 'Solo microwave with 5 power levels and auto-defrost feature.' },
  { catId: 11, sellerId: 6, title: 'Panasonic Automatic Rice Cooker', brand: 'Panasonic', price: 2999, cond: 'NEW', qty: 35, desc: 'Anodized aluminum cooking pan with auto keep-warm technology.' },

  // 12: Furniture
  { catId: 12, sellerId: 6, title: 'Green Soul Ergonomic Office Chair', brand: 'Green Soul', price: 8999, cond: 'NEW', qty: 30, desc: 'High back mesh desk chair with adjustable lumbar support and headrest.' },
  { catId: 12, sellerId: 6, title: 'Sleepyhead Study & Computer Table', brand: 'Sleepyhead', price: 4499, cond: 'NEW', qty: 25, desc: 'Engineered wood study desk with cable management grommet.' },
  { catId: 12, sellerId: 6, title: 'Wakefit 4-Tier Wooden Bookshelf', brand: 'Wakefit', price: 2999, cond: 'NEW', qty: 40, desc: 'Sheesham finish open display rack for home library storage.' },
  { catId: 12, sellerId: 6, title: 'Nilkamal Plastic Dining Chair Set of 4', brand: 'Nilkamal', price: 3299, cond: 'NEW', qty: 35, desc: 'Sturdy molded polypropylene dining chairs for indoor/outdoor use.' },
  { catId: 12, sellerId: 6, title: 'Urban Ladder Wooden Coffee Table', brand: 'Urban Ladder', price: 5999, cond: 'NEW', qty: 20, desc: 'Solid wood living room center table with lower storage shelf.' },
  { catId: 12, sellerId: 6, title: 'Solimo Wooden Shoe Rack Cabinet', brand: 'Solimo', price: 3799, cond: 'NEW', qty: 30, desc: 'Double door wooden shoe organiser holding up to 12 pairs.' },
  { catId: 12, sellerId: 6, title: 'Durian Recliner Armchair', brand: 'Durian', price: 18999, cond: 'NEW', qty: 10, desc: 'Leatherette single seater manual recliner sofa with plush padding.' },
  { catId: 12, sellerId: 6, title: 'Pepperfry Bedside Nightstand Table', brand: 'Pepperfry', price: 2499, cond: 'NEW', qty: 45, desc: 'Compact side table with drawer and open storage cubby.' },
  { catId: 12, sellerId: 6, title: 'Hometown 3-Door Wardrobe', brand: 'Hometown', price: 14999, cond: 'NEW', qty: 15, desc: 'Spacious wardrobe with full-length mirror and lockable drawers.' },
  { catId: 12, sellerId: 6, title: 'Home Centre Foldable Laptop Desk', brand: 'Home Centre', price: 1299, cond: 'NEW', qty: 80, desc: 'Portable bed table tray with tablet groove and cup holder.' },

  // 13: Beauty & Personal Care
  { catId: 13, sellerId: 12, title: 'Nivea Soft Light Moisturizing Cream', brand: 'Nivea', price: 349, cond: 'NEW', qty: 150, desc: 'Non-greasy skin cream enriched with Vitamin E and Jojoba oil.' },
  { catId: 13, sellerId: 12, title: 'Neutrogena Ultra Sheer Sunscreen SPF 50+', brand: 'Neutrogena', price: 675, cond: 'NEW', qty: 100, desc: 'Dry-touch matte finish oil-free broad spectrum UVA/UVB protection.' },
  { catId: 13, sellerId: 12, title: 'L\'Oreal Paris Total Repair Shampoo 1L', brand: 'LOreal', price: 799, cond: 'NEW', qty: 80, desc: '5 problems 1 solution formula for damaged and dull hair.' },
  { catId: 13, sellerId: 12, title: 'Philips TouchSlim Hair Dryer', brand: 'Philips', price: 1299, cond: 'NEW', qty: 60, desc: '1000W gentle drying with ThermoProtect temperature setting.' },
  { catId: 13, sellerId: 12, title: 'Philips Beard Trimmer Series 3000', brand: 'Philips', price: 1499, cond: 'NEW', qty: 90, desc: 'Self-sharpening stainless steel blades with 20 lock-in length settings.' },
  { catId: 13, sellerId: 12, title: 'Cetaphil Gentle Skin Cleanser Face Wash', brand: 'Cetaphil', price: 599, cond: 'NEW', qty: 110, desc: 'Dermatologist recommended hydrating face wash for sensitive skin.' },
  { catId: 13, sellerId: 12, title: 'Vaseline Intensive Care Body Lotion 400ml', brand: 'Vaseline', price: 399, cond: 'NEW', qty: 130, desc: 'Deep restore lotion with micro-droplets of Vaseline jelly.' },
  { catId: 13, sellerId: 12, title: 'Havells Cordless Hair Straightener', brand: 'Havells', price: 2199, cond: 'NEW', qty: 40, desc: 'Ceramic coated floating plates with quick heat-up technology.' },
  { catId: 13, sellerId: 12, title: 'Titan Skinn Raw Eau De Parfum for Men', brand: 'Titan', price: 1895, cond: 'NEW', qty: 50, desc: 'Long-lasting French citrus and woody fragrance (100ml).' },
  { catId: 13, sellerId: 12, title: 'Bombay Shaving Company Grooming Kit', brand: 'Bombay Shaving Co', price: 1299, cond: 'NEW', qty: 70, desc: '6-in-1 shaving & skincare essentials gift set.' },

  // 14: Sports & Fitness
  { catId: 14, sellerId: 7, title: 'Boldfit Anti-Skid Yoga Mat 6mm', brand: 'Boldfit', price: 799, cond: 'NEW', qty: 120, desc: 'Extra thick high-density TPE yoga mat with carry strap.' },
  { catId: 14, sellerId: 7, title: 'Cockatoo Rubber Dumbbell Set 10kg', brand: 'Cockatoo', price: 1899, cond: 'NEW', qty: 50, desc: 'Hexagonal anti-roll rubber coated dumbbell pair.' },
  { catId: 14, sellerId: 7, title: 'Decathlon Resistance Band Set', brand: 'Decathlon', price: 699, cond: 'NEW', qty: 100, desc: '3 levels elastic pull-up workout bands for strength training.' },
  { catId: 14, sellerId: 7, title: 'SG Club Cricket Bat Short Handle', brand: 'SG', price: 3499, cond: 'NEW', qty: 30, desc: 'Kashmir Willow cricket bat with web tape face protection.' },
  { catId: 14, sellerId: 7, title: 'Nivia Storm Football Size 5', brand: 'Nivia', price: 799, cond: 'NEW', qty: 80, desc: 'Rubber synthetic outer surface for tough outdoor grass grounds.' },
  { catId: 14, sellerId: 7, title: 'Cosco Tournament Basketball Size 7', brand: 'Cosco', price: 999, cond: 'NEW', qty: 60, desc: 'Nylon wound official size basketball with pebble grip surface.' },
  { catId: 14, sellerId: 7, title: 'Yonex Muscle Power 29 Badminton Racket', brand: 'Yonex', price: 2199, cond: 'NEW', qty: 45, desc: 'Aluminum-steel frame with isometric head shape.' },
  { catId: 14, sellerId: 7, title: 'Vector X Speed Weighted Skipping Rope', brand: 'Vector X', price: 299, cond: 'NEW', qty: 150, desc: 'Adjustable PVC rope with ball bearing handles for rapid spin.' },
  { catId: 14, sellerId: 7, title: 'Kore 20kg Home Gym Dumbbell Set', brand: 'Kore', price: 2499, cond: 'NEW', qty: 40, desc: 'PVC weight plates, 14-inch dumbbell rods and star locks.' },
  { catId: 14, sellerId: 7, title: 'Cultsport Water-Resistant Gym Duffle Bag', brand: 'Cultsport', price: 1199, cond: 'NEW', qty: 75, desc: 'Separate ventilated shoe compartment and water bottle holder.' },

  // 15: Books
  { catId: 15, sellerId: 9, title: 'Data Structures & Algorithms Made Easy', brand: 'Narasimha Karumanchi', price: 699, cond: 'NEW', qty: 80, desc: 'Comprehensive guide to problem solving, sorting, trees, and graphs.' },
  { catId: 15, sellerId: 9, title: 'Clean Code: Handbook of Agile Software', brand: 'Robert C. Martin', price: 1299, cond: 'NEW', qty: 60, desc: 'Best practices for refactoring, software design principles, and code clarity.' },
  { catId: 15, sellerId: 9, title: 'Python Crash Course 3rd Edition', brand: 'Eric Matthes', price: 1499, cond: 'NEW', qty: 70, desc: 'Hands-on introduction to programming, web apps, data visualization, and games.' },
  { catId: 15, sellerId: 9, title: 'Designing Data-Intensive Applications', brand: 'Martin Kleppmann', price: 1799, cond: 'NEW', qty: 50, desc: 'Architecting scalable, reliable and maintainable distributed software systems.' },
  { catId: 15, sellerId: 9, title: 'The Pragmatic Programmer', brand: 'Andrew Hunt', price: 1599, cond: 'NEW', qty: 55, desc: '20th Anniversary edition on career journeys and software craft mastery.' },
  { catId: 15, sellerId: 9, title: 'Atomic Habits', brand: 'James Clear', price: 499, cond: 'NEW', qty: 200, desc: 'An easy & proven way to build good habits & break bad ones.' },
  { catId: 15, sellerId: 9, title: 'Rich Dad Poor Dad', brand: 'Robert Kiyosaki', price: 399, cond: 'NEW', qty: 180, desc: 'What the rich teach their kids about money that the poor and middle class do not.' },
  { catId: 15, sellerId: 9, title: 'Artificial Intelligence: A Modern Approach', brand: 'Stuart Russell', price: 2199, cond: 'NEW', qty: 40, desc: 'The authoritative textbook on modern AI concepts, machine learning & robotics.' },
  { catId: 15, sellerId: 9, title: 'Systems Performance: Enterprise and Cloud', brand: 'Brendan Gregg', price: 1899, cond: 'NEW', qty: 35, desc: 'Operating system & application optimization, tracing and kernel analysis.' },
  { catId: 15, sellerId: 9, title: 'Introduction to Algorithms CLRS 4th Ed', brand: 'Cormen et al.', price: 2499, cond: 'NEW', qty: 45, desc: 'Standard reference textbook covering classical algorithmic analysis.' },

  // 16: Gaming
  { catId: 16, sellerId: 4, title: 'Razer DeathAdder Essential Gaming Mouse', brand: 'Razer', price: 1499, cond: 'NEW', qty: 60, desc: '6,400 DPI optical sensor, 5 programmable Hyperesponse buttons.' },
  { catId: 16, sellerId: 4, title: 'Redragon K552 Mechanical Gaming Keyboard', brand: 'Redragon', price: 2799, cond: 'NEW', qty: 40, desc: 'Compact 87-key RGB LED backlit mechanical keyboard with tactile switches.' },
  { catId: 16, sellerId: 4, title: 'HyperX Cloud Stinger Gaming Headset', brand: 'HyperX', price: 3299, cond: 'NEW', qty: 45, desc: 'Lightweight memory foam earcups, 90-degree rotating ear cups, swivel mic.' },
  { catId: 16, sellerId: 4, title: 'Cosbyte Wireless RGB Gaming Controller', brand: 'Cosbyte', price: 1899, cond: 'NEW', qty: 55, desc: 'Dual vibration feedback motors, Turbo mode, PC & Android compatibility.' },
  { catId: 16, sellerId: 4, title: 'Cosmic Byte Extended RGB Mouse Pad', brand: 'Cosmic Byte', price: 799, cond: 'NEW', qty: 90, desc: '900x400mm anti-fray stitched desk mat with 12 lighting modes.' },
  { catId: 16, sellerId: 4, title: 'Green Soul Monster Gaming Chair', brand: 'Green Soul', price: 14999, cond: 'NEW', qty: 15, desc: 'Premium PU leather recliner chair with 4D adjustable armrests.' },
  { catId: 16, sellerId: 4, title: 'Fifine K669B USB Condenser Microphone', brand: 'Fifine', price: 2999, cond: 'NEW', qty: 40, desc: 'Cardioid studio condenser mic for streaming, gaming podcasts and voiceovers.' },
  { catId: 16, sellerId: 4, title: 'Logitech C922 Pro Stream HD Webcam', brand: 'Logitech', price: 8495, cond: 'NEW', qty: 25, desc: 'Full 1080p at 30fps streaming with hyper-fast 60fps at 720p.' },
  { catId: 16, sellerId: 4, title: 'Sony DualSense Wireless Controller', brand: 'Sony', price: 5790, cond: 'NEW', qty: 35, desc: 'Haptic feedback, dynamic adaptive triggers, built-in microphone.' },
  { catId: 16, sellerId: 4, title: 'Crucial X8 1TB Portable Gaming SSD', brand: 'Crucial', price: 7499, cond: 'NEW', qty: 30, desc: 'Speeds up to 1050MB/s, durable anodized aluminum unibody core.' },

  // 17: Toys & Kids
  { catId: 17, sellerId: 13, title: 'LEGO Classic Medium Creative Brick Box', brand: 'LEGO', price: 2499, cond: 'NEW', qty: 40, desc: '484 pieces in 35 different colors for open-ended creative construction.' },
  { catId: 17, sellerId: 13, title: 'Remote Control High-Speed Off-Road Car', brand: 'StuntToys', price: 1299, cond: 'NEW', qty: 60, desc: '1:18 scale 4WD monster truck with rechargeable batteries.' },
  { catId: 17, sellerId: 13, title: 'Skillmatics Educational Wooden Puzzle', brand: 'Skillmatics', price: 699, cond: 'NEW', qty: 80, desc: 'Brain teaser puzzle set promoting logic and spatial reasoning skills.' },
  { catId: 17, sellerId: 13, title: 'Hug \'n\' Feel Teddy Bear 3 Feet', brand: 'HugnFeel', price: 999, cond: 'NEW', qty: 70, desc: 'Plush soft plush bear made from non-toxic anti-allergic fabric.' },
  { catId: 17, sellerId: 13, title: 'Barbie Ultimate Kitchen Play Set', brand: 'Barbie', price: 2199, cond: 'NEW', qty: 35, desc: 'Interactive kitchen counter with lights, cooking sounds, and dough molds.' },
  { catId: 17, sellerId: 13, title: 'Camlin 48-Shade Master Art Drawing Kit', brand: 'Camlin', price: 599, cond: 'NEW', qty: 100, desc: 'Oil pastels, watercolor cakes, color pencils, and sketching tools set.' },
  { catId: 17, sellerId: 13, title: 'Smartivity STEM Educational Robot Kit', brand: 'Smartivity', price: 1499, cond: 'NEW', qty: 50, desc: 'DIY hydraulic walking robot toy for hands-on science learning.' },
  { catId: 17, sellerId: 13, title: 'Monopoly Board Game Deluxe Edition', brand: 'Hasbro', price: 1199, cond: 'NEW', qty: 65, desc: 'Classic fast-dealing property trading board game for family nights.' },
  { catId: 17, sellerId: 13, title: 'Hero Sprint 16T Kids Bicycle', brand: 'Hero', price: 4999, cond: 'NEW', qty: 20, desc: 'Single-speed bicycle with training wheels and front basket.' },
  { catId: 17, sellerId: 13, title: 'Hot Wheels 10-Car Gift Pack', brand: 'Hot Wheels', price: 1299, cond: 'NEW', qty: 75, desc: '1:64 scale die-cast vehicles collection pack with realistic details.' },

  // 18: Automotive
  { catId: 18, sellerId: 10, title: 'Portronics Auto 10 Car Phone Holder Mount', brand: 'Portronics', price: 499, cond: 'NEW', qty: 100, desc: '360-degree rotation dashboard and AC vent magnetic holder.' },
  { catId: 18, sellerId: 10, title: 'Wavex Microfiber Car Cleaning Wash Kit', brand: 'Wavex', price: 899, cond: 'NEW', qty: 80, desc: '5-in-1 car detailing set with foam wash shampoo and lint-free cloths.' },
  { catId: 18, sellerId: 10, title: 'Godrej Aer Twist Car Air Freshener Gel', brand: 'Godrej', price: 349, cond: 'NEW', qty: 150, desc: 'Spill-proof twist dashboard fragrance gel lasting up to 60 days.' },
  { catId: 18, sellerId: 10, title: 'Bergmann Typhoon Digital Tyre Inflator', brand: 'Bergmann', price: 2299, cond: 'NEW', qty: 40, desc: 'Heavy duty 150 PSI 12V inflator with auto cut-off digital display.' },
  { catId: 18, sellerId: 10, title: 'Qubo Smart Dash Cam Pro Full HD', brand: 'Qubo', price: 3990, cond: 'NEW', qty: 30, desc: '1080p recording, wide angle lens, night vision, G-sensor event locking.' },
  { catId: 18, sellerId: 10, title: 'Woscher High Power Car Vacuum Cleaner', brand: 'Woscher', price: 1299, cond: 'NEW', qty: 70, desc: '140W 12V handheld dry/wet vacuum with washable HEPA filter.' },
  { catId: 18, sellerId: 10, title: 'Solimo All-Weather Motorcycle Bike Cover', brand: 'Solimo', price: 699, cond: 'NEW', qty: 90, desc: 'Waterproof dustproof polyester bike cover with mirror pockets.' },
  { catId: 18, sellerId: 10, title: 'Philips Ultinon Essential LED Headlight', brand: 'Philips', price: 2799, cond: 'NEW', qty: 45, desc: '6000K crisp white light beam with compact all-in-one design.' },
  { catId: 18, sellerId: 10, title: 'Villsen Memory Foam Car Seat Cushion', brand: 'Villsen', price: 1199, cond: 'NEW', qty: 60, desc: 'Orthopedic tailbone coccyx support cushion for long drive comfort.' },
  { catId: 18, sellerId: 10, title: 'Michelin Emergency Car Jumper Cable Kit', brand: 'Michelin', price: 1899, cond: 'NEW', qty: 35, desc: 'Heavy duty 10-gauge 10-foot booster cables with insulated clamps.' },

  // 19: Smart Home
  { catId: 19, sellerId: 8, title: 'Wipro 12W Wi-Fi Smart LED Bulb B22', brand: 'Wipro', price: 599, cond: 'NEW', qty: 120, desc: '16 Million colors RGB bulb, Alexa and Google Assistant compatible.' },
  { catId: 19, sellerId: 8, title: 'TP-Link Tapo Smart Wi-Fi Plug 16A', brand: 'TP-Link', price: 999, cond: 'NEW', qty: 90, desc: 'High-power smart plug suitable for air conditioners and geysers.' },
  { catId: 19, sellerId: 8, title: 'Realme Smart Door Window Sensor', brand: 'Realme', price: 799, cond: 'NEW', qty: 80, desc: 'Instant push alerts upon door open/close state detection.' },
  { catId: 19, sellerId: 8, title: 'Qubo Smart Wi-Fi 5-Meter LED Strip Light', brand: 'Qubo', price: 1499, cond: 'NEW', qty: 60, desc: 'Music sync LED strip light with customizable ambient lighting scenes.' },
  { catId: 19, sellerId: 8, title: 'Xiaomi Smart Camera C300 2K 360°', brand: 'Xiaomi', price: 2999, cond: 'NEW', qty: 40, desc: '1296p ultra-clear 2K camera with AI human detection and 2-way audio.' },
  { catId: 19, sellerId: 8, title: 'Anchor Panasonic Smart Touch Switch', brand: 'Anchor', price: 1299, cond: 'NEW', qty: 70, desc: 'Tempered glass touch switch panel with app timer scheduling.' },
  { catId: 19, sellerId: 8, title: 'Amazon Echo Dot 5th Gen Smart Speaker', brand: 'Amazon', price: 4499, cond: 'NEW', qty: 50, desc: 'Deeper bass, clearer vocals, motion detection, and Alexa voice assistant.' },
  { catId: 19, sellerId: 8, title: 'Sonoff Smart Motion Sensor Zigbee', brand: 'Sonoff', price: 899, cond: 'NEW', qty: 85, desc: 'Wide-angle motion detection with smart scene automation integration.' },
  { catId: 19, sellerId: 8, title: 'Qubo Smart Video Doorbell with Chime', brand: 'Qubo', price: 5990, cond: 'NEW', qty: 25, desc: '1080p HD camera with visitor notification and intruder alarm.' },
  { catId: 19, sellerId: 8, title: 'Atomberg Renesa Smart BLDC Ceiling Fan', brand: 'Atomberg', price: 3699, cond: 'NEW', qty: 35, desc: 'Energy efficient 28W BLDC motor fan with smart voice control.' },

  // 20: Office & Stationery
  { catId: 20, sellerId: 11, title: 'Classmate Pulse A4 Spiral Notebook 300P', brand: 'Classmate', price: 249, cond: 'NEW', qty: 200, desc: 'Unruled high-grade paper with micro-perforated pages.' },
  { catId: 20, sellerId: 11, title: 'Parker Jotter Stainless Steel Ballpoint Pen', brand: 'Parker', price: 599, cond: 'NEW', qty: 100, desc: 'Signature click retractable pen with Quinkflow ink cartridge.' },
  { catId: 20, sellerId: 11, title: 'Luxor Executive Leatherette Notebook Diary', brand: 'Luxor', price: 399, cond: 'NEW', qty: 120, desc: 'Hardbound dated planner diary with ribbon bookmark.' },
  { catId: 20, sellerId: 11, title: 'Executive Expandable Office File Folder', brand: 'Solo', price: 449, cond: 'NEW', qty: 110, desc: '13-pocket accordion file organizer with tab labels.' },
  { catId: 20, sellerId: 11, title: 'Wooden Multi-Slot Office Desk Organizer', brand: 'Callas', price: 799, cond: 'NEW', qty: 80, desc: 'Desktop pen stand, letter holder, and drawer storage rack.' },
  { catId: 20, sellerId: 11, title: '3M Post-it Sticky Notes Pastel Pack', brand: '3M', price: 299, cond: 'NEW', qty: 150, desc: 'Self-adhesive note pads in pastel colors (3x3 inch, 500 sheets).' },
  { catId: 20, sellerId: 11, title: 'Pragati Systems Magnetic Whiteboard 2x3 Ft', brand: 'Pragati', price: 1299, cond: 'NEW', qty: 40, desc: 'Scratch-resistant dry erase board with lightweight aluminum frame.' },
  { catId: 20, sellerId: 11, title: 'Kangaroo Heavy Duty Metal Stapler Set', brand: 'Kangaroo', price: 349, cond: 'NEW', qty: 130, desc: 'Quick-load metal body stapler including 1000 staple pins.' },
  { catId: 20, sellerId: 11, title: 'Amazon Basics Document Tray Organizer', brand: 'Amazon Basics', price: 899, cond: 'NEW', qty: 65, desc: '3-tier mesh steel desk letter tray for paper storage.' },
  { catId: 20, sellerId: 11, title: 'Wipro Garnet 6W LED Office Desk Lamp', brand: 'Wipro', price: 1199, cond: 'NEW', qty: 70, desc: '3-grade dimmable touch control lamp with flexible gooseneck.' }
];

function generateSVG(productTitle, categoryName, categoryColor, iconType) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7F9FC" />
      <stop offset="100%" stop-color="#EAEFF7" />
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#102A43" flood-opacity="0.08"/>
    </filter>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" />
  <rect x="60" y="60" width="480" height="480" rx="24" fill="url(#cardBg)" stroke="#E2E8F0" stroke-width="2" filter="url(#shadow)" />
  
  <!-- Category Badge -->
  <rect x="90" y="90" width="160" height="32" rx="16" fill="${categoryColor}" fill-opacity="0.12" />
  <text x="170" y="111" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="${categoryColor}" text-anchor="middle">${categoryName.toUpperCase()}</text>
  
  <!-- Central Product Graphic Base -->
  <circle cx="300" cy="270" r="110" fill="${categoryColor}" fill-opacity="0.08" stroke="${categoryColor}" stroke-opacity="0.2" stroke-width="2" />
  
  <!-- Icon representation -->
  <g transform="translate(240, 210) scale(5)" stroke="${categoryColor}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
    ${getIconPath(iconType)}
  </g>
  
  <!-- Title / Product Info -->
  <text x="300" y="440" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#172033" text-anchor="middle">${escapeXml(productTitle.length > 34 ? productTitle.substring(0, 31) + '...' : productTitle)}</text>
  <text x="300" y="470" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#6B7280" text-anchor="middle">Official Verified Product · Hybrid Marketplace</text>
</svg>`;
}

function getIconPath(iconType) {
  switch (iconType) {
    case 'tv':
      return `<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/>`;
    case 'laptop':
      return `<path d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM2 18h20"/>`;
    case 'smartphone':
      return `<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>`;
    case 'headphones':
      return `<path d="M3 14h3v4H3zM18 14h3v4h-3z"/><path d="M3 14v-3a9 9 0 0118 0v3"/>`;
    case 'camera':
      return `<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>`;
    case 'shirt':
      return `<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>`;
    case 'user':
      return `<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>`;
    case 'heart':
      return `<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`;
    case 'footwear':
      return `<path d="M2 17l4-2 6 2 8-5v5H2zM6 15l2-8 5 3"/>`;
    case 'bag':
      return `<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>`;
    case 'home':
      return `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>`;
    case 'chair':
      return `<path d="M19 9V6a2 2 0 00-2-2H7a2 2 0 00-2 2v3M5 12h14M6 12v9M18 12v9"/>`;
    case 'sparkles':
      return `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`;
    case 'activity':
      return `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`;
    case 'book':
      return `<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>`;
    case 'gamepad':
      return `<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/>`;
    case 'smile':
      return `<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>`;
    case 'car':
      return `<path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z"/><path d="M5 15H3v-4l2-5h14l2 5v4h-2M5 15h14"/>`;
    case 'zap':
      return `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`;
    case 'briefcase':
      return `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>`;
    default:
      return `<circle cx="12" cy="12" r="8"/>`;
  }
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function run() {
  console.log('Generating SVG image assets and seed.sql...');

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Create Universal Placeholder
  const placeholderSvg = generateSVG('Product Image', 'SHOP ITEM', '#106EBE', 'tag');
  fs.writeFileSync(path.join(ASSETS_DIR, 'placeholder.svg'), placeholderSvg);

  // Generate category directories & images
  for (const cat of CATEGORIES) {
    const catDir = path.join(ASSETS_DIR, cat.slug);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }
  }

  let sql = `-- =====================================================================
-- HYBRID MARKETPLACE + ONLINE AUCTION SYSTEM
-- Seed data (Complete Demo Shop Catalog - 20 Categories, ~200 Products)
-- =====================================================================
-- Run with:
--   mysql -u root -p marketplace_db < db/seed.sql
-- =====================================================================

USE marketplace_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- USERS (Admin, Buyers, Sellers)
-- ---------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, phone, role, status) VALUES
(1, 'Admin User',    'admin@bidmart.test',   'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000001', 'ADMIN',  'ACTIVE'),
(2, 'Rahul Sharma',  'rahul@bidmart.test',   'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000002', 'BUYER',  'ACTIVE'),
(3, 'Priya Verma',   'priya@bidmart.test',   'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000003', 'BUYER',  'ACTIVE'),
(4, 'TechWorld Store','techworld@bidmart.test','scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000004', 'SELLER', 'ACTIVE'),
(5, 'Urban Fashion',  'urbanfashion@bidmart.test','scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000005', 'SELLER', 'ACTIVE'),
(6, 'HomeStyle Store','homestyle@bidmart.test', 'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000006', 'SELLER', 'ACTIVE'),
(7, 'SportsZone India','sportszone@bidmart.test','scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000007', 'SELLER', 'ACTIVE'),
(8, 'Gadget Planet',  'gadgetplanet@bidmart.test','scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000008', 'SELLER', 'ACTIVE'),
(9, 'BookNest',       'booknest@bidmart.test',  'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000009', 'SELLER', 'ACTIVE'),
(10,'AutoCare Store', 'autocare@bidmart.test',  'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000010', 'SELLER', 'ACTIVE'),
(11,'OfficeMart',     'officemart@bidmart.test','scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000011', 'SELLER', 'ACTIVE'),
(12,'BeautyCare Store','beautycare@bidmart.test','scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000012', 'SELLER', 'ACTIVE'),
(13,'KidZone Toys',   'kidzone@bidmart.test',   'scrypt$19923691ca5a0cf6394d83300b02e827$4e3c60657e9f67ef734bf057e708d85af67e80849cfc6d217a7a9978c6d52f1180c8572cd4cf56af611043bc77fb9f371597f77499ad3b9d88b73f0b68213ffe', '9800000013', 'SELLER', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role=VALUES(role);

-- ---------------------------------------------------------------------
-- ADDRESSES
-- ---------------------------------------------------------------------
INSERT INTO addresses (id, user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default) VALUES
(1, 2, 'Home', 'Rahul Sharma', '9800000002', '123 Green Park', 'Near Metro Station', 'New Delhi', 'Delhi', '110016', 'India', 1),
(2, 3, 'Home', 'Priya Verma',  '9800000003', '45 MG Road', NULL, 'Bengaluru', 'Karnataka', '560001', 'India', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- ---------------------------------------------------------------------
-- CATEGORIES (20 Shopping Categories)
-- ---------------------------------------------------------------------
INSERT INTO categories (id, parent_id, name, slug) VALUES
`;

  const catSqlLines = CATEGORIES.map(c => `(${c.id}, NULL, '${c.name.replace(/'/g, "''")}', '${c.slug}')`);
  sql += catSqlLines.join(',\n') + '\nON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug);\n\n';

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- PRODUCTS (Seeded Shop Catalog + Untouched Original Auctions)\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO products (id, seller_id, category_id, title, description, brand, \`condition\`, images, price, status, version) VALUES\n`;

  const productSqlLines = [];

  // Seed original 1-8 first
  const origProducts = [
    `(1, 4, 3, 'iPhone 15 Pro', 'Apple iPhone 15 Pro with A17 Pro chip, titanium design and a 48MP camera system.', 'Apple', 'NEW', JSON_ARRAY('/assets/products/mobiles-accessories/iphone-15-pro.svg'), 79999.00, 'ACTIVE_SHOP', 1)`,
    `(2, 4, 2, 'Ultrabook X1', 'Lightweight 14-inch ultrabook, 16GB RAM, 512GB SSD.', 'Dell', 'NEW', JSON_ARRAY('/assets/products/computers-laptops/ultrabook-x1.svg'), 59999.00, 'ACTIVE_SHOP', 1)`,
    `(3, 5, 4, 'Wireless Headphones', 'Over-ear wireless headphones with active noise cancellation.', 'Sony', 'NEW', JSON_ARRAY('/assets/products/audio/wireless-headphones.svg'), 8999.00, 'ACTIVE_SHOP', 1)`,
    `(4, 5, 10, 'Smart Watch', 'Fitness smartwatch with heart-rate and SpO2 tracking.', 'Samsung', 'NEW', JSON_ARRAY('/assets/products/bags-accessories/smart-watch.svg'), 14999.00, 'ACTIVE_SHOP', 1)`,
    `(5, 4, 16, 'PlayStation 5', 'Sony PlayStation 5 gaming console, disc edition.', 'Sony', 'NEW', JSON_ARRAY('/assets/products/gaming/playstation-5.svg'), 54999.00, 'ACTIVE_AUCTION', 2)`,
    `(6, 4, 3, 'iPhone 15 Pro (Auction Unit)', 'Second unit of the Apple iPhone 15 Pro, offered via live auction.', 'Apple', 'NEW', JSON_ARRAY('/assets/products/mobiles-accessories/iphone-15-pro-auction.svg'), 79999.00, 'ACTIVE_AUCTION', 2)`,
    `(7, 5, 10, 'Rolex Watch (Pre-owned)', 'Luxury pre-owned watch, authenticated and serviced.', 'Rolex', 'USED', JSON_ARRAY('/assets/products/bags-accessories/rolex-watch.svg'), 265000.00, 'ACTIVE_AUCTION', 2)`,
    `(8, 4, 5, 'DSLR Camera', 'Full-frame DSLR camera with 24-70mm lens kit.', 'Canon', 'LIKE_NEW', JSON_ARRAY('/assets/products/cameras/dslr-camera.svg'), 89999.00, 'ACTIVE_AUCTION', 2)`
  ];

  // Generate SVGs for original products 1-8
  fs.writeFileSync(path.join(ASSETS_DIR, 'mobiles-accessories', 'iphone-15-pro.svg'), generateSVG('iPhone 15 Pro', 'Mobiles & Accessories', '#008299', 'smartphone'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'computers-laptops', 'ultrabook-x1.svg'), generateSVG('Ultrabook X1', 'Computers & Laptops', '#2B579A', 'laptop'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'audio', 'wireless-headphones.svg'), generateSVG('Wireless Headphones', 'Audio', '#D83B01', 'headphones'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'bags-accessories', 'smart-watch.svg'), generateSVG('Smart Watch', 'Bags & Accessories', '#004E8C', 'bag'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'gaming', 'playstation-5.svg'), generateSVG('PlayStation 5', 'Gaming', '#5C2D91', 'gamepad'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'mobiles-accessories', 'iphone-15-pro-auction.svg'), generateSVG('iPhone 15 Pro (Auction)', 'Mobiles & Accessories', '#008299', 'smartphone'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'bags-accessories', 'rolex-watch.svg'), generateSVG('Rolex Watch', 'Bags & Accessories', '#004E8C', 'bag'));
  fs.writeFileSync(path.join(ASSETS_DIR, 'cameras', 'dslr-camera.svg'), generateSVG('DSLR Camera', 'Cameras', '#B4009E', 'camera'));

  productSqlLines.push(...origProducts);

  let currentId = 9;
  const stateHistoryLines = [
    `(1, 'DRAFT', 'ACTIVE_SHOP', 4, 'Initial listing')`,
    `(2, 'DRAFT', 'ACTIVE_SHOP', 4, 'Initial listing')`,
    `(3, 'DRAFT', 'ACTIVE_SHOP', 5, 'Initial listing')`,
    `(4, 'DRAFT', 'ACTIVE_SHOP', 5, 'Initial listing')`,
    `(5, 'DRAFT', 'ACTIVE_SHOP', 4, 'Initial listing')`,
    `(5, 'ACTIVE_SHOP', 'SHIFTING_TO_AUCTION', 4, 'Seller moved to auction')`,
    `(5, 'SHIFTING_TO_AUCTION', 'ACTIVE_AUCTION', 4, 'Auction opened')`,
    `(6, 'DRAFT', 'ACTIVE_SHOP', 4, 'Initial listing')`,
    `(6, 'ACTIVE_SHOP', 'SHIFTING_TO_AUCTION', 4, 'Seller moved to auction')`,
    `(6, 'SHIFTING_TO_AUCTION', 'ACTIVE_AUCTION', 4, 'Auction opened')`,
    `(7, 'DRAFT', 'ACTIVE_SHOP', 5, 'Initial listing')`,
    `(7, 'ACTIVE_SHOP', 'SHIFTING_TO_AUCTION', 5, 'Seller moved to auction')`,
    `(7, 'SHIFTING_TO_AUCTION', 'ACTIVE_AUCTION', 5, 'Auction opened')`,
    `(8, 'DRAFT', 'ACTIVE_SHOP', 4, 'Initial listing')`,
    `(8, 'ACTIVE_SHOP', 'SHIFTING_TO_AUCTION', 4, 'Seller moved to auction')`,
    `(8, 'SHIFTING_TO_AUCTION', 'ACTIVE_AUCTION', 4, 'Auction opened')`
  ];

  const inventoryLines = [
    `(1, 25, 0, 5)`,
    `(2, 12, 0, 2)`,
    `(3, 40, 0, 18)`,
    `(4, 30, 0, 9)`,
    `(5, 0, 1, 0)`,
    `(6, 0, 1, 0)`,
    `(7, 0, 1, 0)`,
    `(8, 0, 1, 0)`
  ];

  for (const item of PRODUCTS_DATA) {
    const cat = CATEGORIES.find(c => c.id === item.catId);
    const imgSlug = slugify(item.title);
    const imgRelPath = `/assets/products/${cat.slug}/${imgSlug}.svg`;
    const imgFullPath = path.join(ASSETS_DIR, cat.slug, `${imgSlug}.svg`);

    // Write individual SVG
    const svgContent = generateSVG(item.title, cat.name, cat.color, cat.icon);
    fs.writeFileSync(imgFullPath, svgContent);

    // Product SQL line
    const titleEsc = item.title.replace(/'/g, "''");
    const descEsc = item.desc.replace(/'/g, "''");
    const brandEsc = item.brand ? `'${item.brand.replace(/'/g, "''")}'` : 'NULL';
    
    productSqlLines.push(
      `(${currentId}, ${item.sellerId}, ${item.catId}, '${titleEsc}', '${descEsc}', ${brandEsc}, '${item.cond}', JSON_ARRAY('${imgRelPath}'), ${item.price.toFixed(2)}, 'ACTIVE_SHOP', 1)`
    );

    // State history SQL line
    stateHistoryLines.push(`(${currentId}, 'DRAFT', 'ACTIVE_SHOP', ${item.sellerId}, 'Initial listing')`);

    // Inventory SQL line
    inventoryLines.push(`(${currentId}, ${item.qty}, 0, 0)`);

    currentId++;
  }

  sql += productSqlLines.join(',\n') + '\nON DUPLICATE KEY UPDATE title=VALUES(title), price=VALUES(price), images=VALUES(images), status=VALUES(status);\n\n';

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- PRODUCT STATE HISTORY\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO product_state_history (product_id, from_status, to_status, changed_by, reason) VALUES\n`;
  sql += stateHistoryLines.join(',\n') + ';\n\n';

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- INVENTORY\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO inventory (product_id, available_qty, reserved_qty, sold_qty) VALUES\n`;
  sql += inventoryLines.join(',\n') + '\nON DUPLICATE KEY UPDATE available_qty=VALUES(available_qty), reserved_qty=VALUES(reserved_qty), sold_qty=VALUES(sold_qty);\n\n';

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- AUCTIONS (Original 4 Untouched Auctions)\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO auctions (id, product_id, starting_price, reserve_price, bid_increment, current_price, starts_at, ends_at, status) VALUES\n`;
  sql += `(1, 5, 25000.00, 45000.00, 500.00,  32000.00, '2026-09-10 10:00:00', '2026-09-14 12:00:00', 'OPEN'),\n`;
  sql += `(2, 6, 40000.00, 70000.00, 500.00,  48500.00, '2026-09-11 09:00:00', '2026-09-15 17:30:00', 'OPEN'),\n`;
  sql += `(3, 7, 200000.00, 250000.00, 1000.00, 265000.00, '2026-09-09 08:00:00', '2026-09-14 19:00:00', 'OPEN'),\n`;
  sql += `(4, 8, 30000.00, 60000.00, 500.00,  42000.00, '2026-09-08 08:00:00', '2026-09-14 19:00:00', 'OPEN')\n`;
  sql += `ON DUPLICATE KEY UPDATE current_price=VALUES(current_price), status=VALUES(status);\n\n`;

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- BIDS\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO bids (id, auction_id, bidder_id, amount, status) VALUES\n`;
  sql += `(1, 1, 2, 25000.00, 'OUTBID'),\n`;
  sql += `(2, 1, 3, 28000.00, 'OUTBID'),\n`;
  sql += `(3, 1, 2, 32000.00, 'WINNING'),\n`;
  sql += `(4, 2, 3, 40000.00, 'OUTBID'),\n`;
  sql += `(5, 2, 2, 44500.00, 'OUTBID'),\n`;
  sql += `(6, 2, 3, 48500.00, 'WINNING'),\n`;
  sql += `(7, 3, 2, 200000.00, 'OUTBID'),\n`;
  sql += `(8, 3, 3, 265000.00, 'WINNING'),\n`;
  sql += `(9, 4, 3, 30000.00, 'OUTBID'),\n`;
  sql += `(10, 4, 2, 42000.00, 'WINNING')\n`;
  sql += `ON DUPLICATE KEY UPDATE status=VALUES(status);\n\n`;

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- WISHLIST ITEMS\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO wishlist_items (user_id, product_id) VALUES\n`;
  sql += `(2, 3), (2, 4), (2, 7),\n`;
  sql += `(3, 1), (3, 2)\n`;
  sql += `ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);\n\n`;

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- CART ITEMS\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO cart_items (user_id, product_id, quantity) VALUES\n`;
  sql += `(2, 1, 1),\n`;
  sql += `(2, 3, 1),\n`;
  sql += `(2, 4, 1)\n`;
  sql += `ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);\n\n`;

  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `-- NOTIFICATIONS\n`;
  sql += `-- ---------------------------------------------------------------------\n`;
  sql += `INSERT INTO notifications (user_id, type, title, message, is_read) VALUES\n`;
  sql += `(2, 'OUTBID', 'You have been outbid', 'Someone placed a higher bid on PlayStation 5.', 0),\n`;
  sql += `(3, 'BID_PLACED', 'Bid placed successfully', 'Your bid of ₹48,500 on iPhone 15 Pro (Auction) was placed.', 1),\n`;
  sql += `(4, 'PRODUCT_SHIFTED', 'Product moved to auction', 'PlayStation 5 is now live in Auction Mode.', 1);\n\n`;

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  const seedPath = path.join(__dirname, 'seed.sql');
  fs.writeFileSync(seedPath, sql, 'utf8');

  console.log(`✔ Successfully generated ${currentId - 1} total products.`);
  console.log(`✔ Updated db/seed.sql.`);
  console.log(`✔ Generated SVG product images in frontend/assets/products/!`);
}

run().catch(console.error);
