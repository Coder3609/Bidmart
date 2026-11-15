import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Zap, Search } from 'lucide-react';
import './index.css';

/* =========================================================================
   TOP NAVBAR
   ========================================================================= */
function Navbar() {
  const location = useLocation();

  return (
    <header className="react-nav">
      <Link to="/" className="react-brand">
        <span className="react-brand-title">BIDMART</span>
        <span className="react-brand-badge">HYBRID</span>
      </Link>

      <nav className="react-nav-links">
        <Link to="/" className={`react-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          HOME
        </Link>
        <Link to="/market" className={`react-nav-link ${location.pathname === '/market' ? 'active' : ''}`}>
          MARKET
        </Link>
        <Link to="/catalog" className={`react-nav-link ${location.pathname === '/catalog' ? 'active' : ''}`}>
          CATALOG
        </Link>
        <a href="http://localhost:5000/auction/auctions.html" className="react-nav-link">
          <span style={{ color: '#d8ff00' }}>⚡</span> AUCTIONS
        </a>
      </nav>

      <div className="react-nav-actions">
        <Link to="/market" className="react-btn-market">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#080808' }}></span>
          <span>ENTER MARKET →</span>
        </Link>
        <a
          href="http://localhost:5000/auth/login.html"
          style={{
            background: 'transparent',
            border: '1px solid #33425A',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.8rem',
            padding: '7px 16px',
            borderRadius: '6px',
            textDecoration: 'none'
          }}
        >
          SIGN IN
        </a>
      </div>
    </header>
  );
}

/* =========================================================================
   PAGE 1: LANDING PAGE (BRUTALIST HOME HERO)
   ========================================================================= */
function LandingPage() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="term-viewport" style={{ minHeight: 'calc(100vh - 70px)' }}>
      <section className="term-master-section" style={{ padding: '40px 24px 60px' }}>
        <div className="term-grid">
          
          {/* Left: Statement & Action Buttons */}
          <div>
            <div className="term-pill-label">
              <span>● SHOP OR BID</span>
              <span>//</span>
              <span>THE BUYER'S CHOICE</span>
            </div>

            <h1 className="term-headline">
              EVERY PRICE<br />
              <span className="term-acid-word">IS NEGOTIABLE.</span>
            </h1>

            <p className="term-body-lead">
              Buy instantly at the standard store price &mdash; or wait for the <strong>Live Auction to open</strong>. Score it for less if you're fast, or bid to outplay other buyers for exclusive items.
            </p>

            <div className="term-actions-row">
              <Link to="/market" className="btn-term-primary">
                <span>EXPLORE THE MARKET &rarr;</span>
              </Link>
              <button
                type="button"
                className="btn-term-guest"
                onClick={() => setShowHowItWorks(true)}
              >
                <span>HOW THIS WORKS</span>
              </button>
            </div>

            {/* Real-time Ticker */}
            <div className="term-live-feed">
              <span className="feed-indicator">
                <span className="blink-dot" style={{ background: '#d8ff00' }}></span>
                LIVE_PIT:
              </span>
              <div className="feed-stream-text">
                <span className="feed-hl">IPHONE 15 PRO TITANIUM</span> &bull; AUCTION OPENS IN 12m &bull; STARTING BID: <strong>₹54,999</strong> (Save up to 30%)
              </div>
            </div>

            {/* Metrics */}
            <div className="term-metrics-strip">
              <div className="term-metric-block">
                <span className="term-metric-val">BUY INSTANTLY</span>
                <span className="term-metric-label">FIXED_MARKET_PRICE</span>
              </div>
              <div className="term-metric-block">
                <span className="term-metric-val green">&darr; UP TO 40% OFF</span>
                <span className="term-metric-label">EARLY_AUCTION_BIDS</span>
              </div>
              <div className="term-metric-block">
                <span className="term-metric-val">100% SECURE</span>
                <span className="term-metric-label">WALLET_ESCROW_PROTECTION</span>
              </div>
            </div>
          </div>

          {/* Right: Graphic Card Container */}
          <div className="term-card-container">
            <div style={{ width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#111', border: '1px solid #282828', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>
                <img 
                  src="/assets/buyer-choice-concept.png" 
                  alt="Buyer Choice" 
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              
              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: '#AAA' }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <div>
                  <strong style={{ color: '#FFF' }}>The Shopper's Move:</strong> Buy instantly at retail price, or wait for the <span style={{ color: '#D8FF00', fontWeight: 700 }}>Live Auction</span> to grab it for <strong style={{ color: '#D8FF00' }}>lower than market price</strong> before competing bids heat up.
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How it works modal */}
      {showHowItWorks && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0E0E0E',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            padding: '32px 36px',
            position: 'relative',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>How BidMart Works</h2>
              <button
                onClick={() => setShowHowItWorks(false)}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.8rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <p style={{ color: '#aaa', lineHeight: '1.6', marginBottom: '20px' }}>
              Every item has two purchase lifecycles: <strong>1. Fixed Retail Drop</strong> (Buy it now like Amazon or Flipkart) or <strong>2. Timed Live Auction</strong> (Place bids to outbid competitors and score up to 40% off).
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowHowItWorks(false); navigate('/market'); }}
                className="btn-term-primary"
              >
                GO TO MARKETPLACE →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   PAGE 2: MARKET HUB (EXACT AMAZON/EDITORIAL SQUARE BOX ARCHITECTURE)
   ========================================================================= */
function MarketHub() {
  const navigate = useNavigate();

  const row1Boxes = [
    {
      title: 'Flagship Tech & Computing',
      badge: 'PRO SERIES',
      cta: 'Explore Computing Catalog →',
      slug: 'computers-laptops',
      tiles: [
        { name: 'Ultrabook X1 Carbon', price: '₹59,999', img: '/assets/real/ultrabook.jpg' },
        { name: '4K Creator Display', price: '₹24,499', img: '/assets/real/monitor4k.jpg' },
        { name: 'Thunderbolt 4 Dock', price: '₹4,299', img: '/assets/real/usb_dock.jpg' },
        { name: 'GaN 100W Fast Charger', price: '₹2,499', img: '/assets/real/gan_charger.jpg' }
      ]
    },
    {
      title: 'Studio & Audiophile Sound',
      badge: 'HI-RES AUDIO',
      cta: 'Shop All Audio Gear →',
      slug: 'audio',
      tiles: [
        { name: 'Sony WH-1000XM5', price: '₹29,990', img: '/assets/real/sony_headphones.jpg' },
        { name: 'Studio Soundbar Pro', price: '₹14,999', img: '/assets/real/soundbar.jpg' },
        { name: 'ANC Wireless Buds', price: '₹3,499', img: '/assets/real/earbuds.jpg' },
        { name: 'Party Bluetooth Speaker', price: '₹4,999', img: '/assets/real/speaker.jpg' }
      ]
    },
    {
      title: 'Luxury Vault & Watches',
      badge: 'VAULT DROP',
      cta: 'Enter The Luxury Vault →',
      slug: 'bags-accessories',
      tiles: [
        { name: 'Submariner Heritage', price: '₹2,49,999', img: '/assets/real/submariner.jpg' },
        { name: 'Gold Precision Chrono', price: '₹1,89,000', img: '/assets/real/rolex_watch.jpg' },
        { name: 'Sapphire Edition Watch', price: '₹95,000', img: '/assets/real/smartwatch.jpg' },
        { name: 'Designer Leather Tote', price: '₹42,500', img: '/assets/real/handbag.jpg' }
      ]
    },
    {
      title: 'Next-Gen Gaming & Battle Stations',
      badge: 'ESPORTS READY',
      cta: 'Browse All Gaming Gear →',
      slug: 'gaming',
      tiles: [
        { name: 'PlayStation 5 Console', price: '₹54,999', img: '/assets/real/ps5.jpg' },
        { name: 'DualSense Wireless Pad', price: '₹5,790', img: '/assets/real/controller.jpg' },
        { name: 'HyperX Cloud Headset', price: '₹3,299', img: '/assets/real/headset.jpg' },
        { name: 'Top RPG Title (Disc)', price: '₹3,999', img: '/assets/real/gaming_game.jpg' }
      ]
    }
  ];

  const row2Boxes = [
    {
      title: 'Smart 4K Televisions & Displays',
      badge: 'CINEMA 4K',
      cta: 'See All Televisions →',
      slug: 'electronics',
      tiles: [
        { name: 'Samsung Crystal 55" 4K', price: '₹44,990', img: '/assets/real/samsung_tv.jpg' },
        { name: 'Sony Bravia 50" OLED', price: '₹62,990', img: '/assets/real/sony_tv.jpg' },
        { name: 'OnePlus 55" Smart TV', price: '₹38,999', img: '/assets/real/oneplus_tv.jpg' },
        { name: 'Dolby Atmos Sound System', price: '₹19,999', img: '/assets/real/soundbar.jpg' }
      ]
    },
    {
      title: 'Everyday Essentials & Smart Tech',
      badge: 'DAILY DEALS',
      cta: 'Shop Everyday Deals →',
      slug: 'mobiles-accessories',
      tiles: [
        { name: 'iPhone 15 Pro Titanium', price: '₹79,999', img: '/assets/real/iphone15pro.jpg' },
        { name: 'Magnetic Power Bank', price: '₹1,999', img: '/assets/real/powerbank.jpg' },
        { name: 'boAt ANC Earbuds', price: '₹1,499', img: '/assets/real/boat_earbuds.jpg' },
        { name: 'Protective Pro Sleeves', price: '₹799', img: '/assets/real/laptop_sleeve.jpg' }
      ]
    },
    {
      title: "Men's Wardrobe & Footwear",
      badge: 'TRENDING',
      cta: "Explore Men's Store →",
      slug: 'mens-fashion',
      tiles: [
        { name: 'Leather Biker Jacket', price: '₹4,999', img: '/assets/real/mens_jacket.jpg' },
        { name: 'Air Runners Sport', price: '₹6,499', img: '/assets/real/mens_sneakers.jpg' },
        { name: 'Linen Over-Shirts', price: '₹1,899', img: '/assets/real/mens_shirt.jpg' },
        { name: 'Full Grain Wallet', price: '₹1,299', img: '/assets/real/leather_wallet.jpg' }
      ]
    },
    {
      title: "Women's Fashion & Accessories",
      badge: 'NEW ARRIVALS',
      cta: "Discover Women's Edit →",
      slug: 'womens-fashion',
      tiles: [
        { name: 'Silk Cocktail Gown', price: '₹3,499', img: '/assets/real/womens_dress.jpg' },
        { name: 'Designer Stilettos', price: '₹4,299', img: '/assets/real/heels.jpg' },
        { name: 'Leather Shoulder Bag', price: '₹3,899', img: '/assets/real/handbag.jpg' },
        { name: 'Fine Gold Jewelry Set', price: '₹12,499', img: '/assets/real/jewelry.jpg' }
      ]
    }
  ];

  return (
    <div className="bm-market-container">
      
      {/* Hero Welcome Banner */}
      <section className="bm-hero-banner" style={{ marginBottom: '28px' }}>
        <div className="bm-hero-content">
          <span className="bm-hero-badge">THE DUAL-LIFECYCLE MARKET</span>
          <h1 className="bm-hero-headline">Shop Today. Or Name Your Price.</h1>
          <p className="bm-hero-desc">
            Buy verified retail drops immediately, or enter timed live auctions to score up to 40% below store value.
          </p>
          <div className="bm-hero-actions">
            <button
              onClick={() => navigate('/catalog')}
              className="bm-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Explore Catalog &rarr;
            </button>
            <a
              href="http://localhost:5000/auction/auctions.html"
              className="bm-btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ color: '#d8ff00' }}>⚡</span> Live Auctions
            </a>
          </div>
        </div>
        <div className="bm-hero-art">
          <img
            src="/assets/real/clean_white_tech_gadget.jpg"
            alt="Verified Tech Drop"
            style={{ width: '380px', height: '240px', objectFit: 'contain' }}
          />
        </div>
      </section>

      {/* Row 1 Square Department Boxes */}
      <div className="bm-square-row">
        {row1Boxes.map((box, bIdx) => (
          <div key={bIdx} className="bm-square-box">
            <div className="bm-box-header">
              <h2 className="bm-box-title">{box.title}</h2>
              <span className="bm-box-tag">{box.badge}</span>
            </div>
            <div className="bm-quad-tiles">
              {box.tiles.map((t, tIdx) => (
                <div
                  key={tIdx}
                  className="bm-quad-tile"
                  onClick={() => navigate(`/catalog?category=${box.slug}`)}
                >
                  <div className="bm-quad-img-wrap">
                    <img src={t.img} alt={t.name} />
                  </div>
                  <span className="bm-quad-title">{t.name}</span>
                  <span className="bm-quad-price">{t.price}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(`/catalog?category=${box.slug}`)}
              className="bm-box-cta-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              <span>{box.cta}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Wide Travel Sale Banner Between Rows */}
      <section className="bm-wide-banner-wrap" style={{ margin: '32px 0' }}>
        <img
          src="/assets/real/big_travel_sale_wide.jpg"
          alt="The Big Travel Sale"
          className="bm-wide-banner-img"
        />
      </section>

      {/* Row 2 Square Department Boxes */}
      <div className="bm-square-row">
        {row2Boxes.map((box, bIdx) => (
          <div key={bIdx} className="bm-square-box">
            <div className="bm-box-header">
              <h2 className="bm-box-title">{box.title}</h2>
              <span className="bm-box-tag">{box.badge}</span>
            </div>
            <div className="bm-quad-tiles">
              {box.tiles.map((t, tIdx) => (
                <div
                  key={tIdx}
                  className="bm-quad-tile"
                  onClick={() => navigate(`/catalog?category=${box.slug}`)}
                >
                  <div className="bm-quad-img-wrap">
                    <img src={t.img} alt={t.name} />
                  </div>
                  <span className="bm-quad-title">{t.name}</span>
                  <span className="bm-quad-price">{t.price}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(`/catalog?category=${box.slug}`)}
              className="bm-box-cta-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              <span>{box.cta}</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

/* =========================================================================
   PAGE 3: CATALOG VIEW (DEDICATED CATEGORY PRODUCTS)
   ========================================================================= */
function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.data) setCategories(data.data.filter(c => c.parent_id === null));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '50');
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('search', search);

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setProducts(data.data.items || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeCategory, search]);

  const filteredProducts = products.filter(p => {
    if (filterMode === 'STORE') return p.status !== 'ACTIVE_AUCTION';
    if (filterMode === 'AUCTION') return p.status === 'ACTIVE_AUCTION';
    return true;
  });

  return (
    <div className="bm-market-container" style={{ padding: '24px 0' }}>
      
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
          {activeCategory ? activeCategory.replace('-', ' ') : 'All Products Catalog'}
        </h1>
        <p style={{ color: 'var(--bm-text-muted)', fontSize: '0.9rem' }}>
          Explore 100% verified authentic goods &bull; Fixed retail or timed live auctions
        </p>
      </div>

      {/* Mode Filters & Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'STORE', 'AUCTION'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                background: filterMode === mode ? '#d8ff00' : 'rgba(255, 255, 255, 0.05)',
                color: filterMode === mode ? '#000000' : '#C5D0E0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {mode === 'ALL' ? 'ALL ITEMS' : mode === 'STORE' ? 'BUY NOW' : '⚡ LIVE AUCTIONS'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bm-card)',
            border: '1px solid var(--bm-border)',
            borderRadius: '8px',
            padding: '6px 14px'
          }}>
            <Search size={16} color="#7E8DA4" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                outline: 'none',
                fontSize: '0.88rem'
              }}
            />
          </div>
          <span style={{ fontSize: '0.82rem', color: '#d8ff00', fontWeight: 700 }}>
            {filteredProducts.length} PRODUCTS
          </span>
        </div>
      </div>

      {/* Grid: Left Sidebar + Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '28px' }}>
        
        {/* Categories Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => setSearchParams({})}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: !activeCategory ? '#d8ff00' : 'transparent',
              color: !activeCategory ? '#000' : '#C5D0E0',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.slug })}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: activeCategory === cat.slug ? '#d8ff00' : 'transparent',
                color: activeCategory === cat.slug ? '#000' : '#C5D0E0',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        {/* Product Cards */}
        <main>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#7E8DA4' }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bm-square-box" style={{ padding: '60px', textAlign: 'center' }}>
              <h3>No products found for this category</h3>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '20px'
            }}>
              {filteredProducts.map(p => {
                const isAuction = p.status === 'ACTIVE_AUCTION';
                let imgSrc = '/assets/products/placeholder.svg';
                if (Array.isArray(p.images) && p.images[0]) imgSrc = p.images[0];
                else if (typeof p.images === 'string') {
                  try {
                    const parsed = JSON.parse(p.images);
                    if (parsed[0]) imgSrc = parsed[0];
                  } catch {}
                }

                return (
                  <div
                    key={p.id}
                    className="bm-square-box"
                    style={{
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '12px'
                    }}
                  >
                    <div>
                      <div style={{ position: 'relative', height: '170px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#05070a' }}>
                        <img
                          src={imgSrc}
                          alt={p.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: isAuction ? '#d8ff00' : 'rgba(0,0,0,0.7)',
                          color: isAuction ? '#000000' : '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          {isAuction ? '⚡ AUCTION PIT' : 'FIXED RETAIL'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#7E8DA4', fontWeight: 700, marginBottom: '4px' }}>
                        {p.brand || 'BIDMART'} &bull; {p.condition || 'NEW'}
                      </div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px', lineHeight: '1.3' }}>
                        {p.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#7E8DA4' }}>
                          {isAuction ? 'CURRENT BID' : 'BUY NOW'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isAuction ? '#d8ff00' : '#FFFFFF' }}>
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        style={{
                          background: isAuction ? '#d8ff00' : 'rgba(255, 255, 255, 0.08)',
                          color: isAuction ? '#000' : '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isAuction ? 'BID ⚡' : '+ CART'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

      </div>

    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/market" element={<MarketHub />} />
        <Route path="/catalog" element={<CatalogPage />} />
      </Routes>
    </Router>
  );
}
