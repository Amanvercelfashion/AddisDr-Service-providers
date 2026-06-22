require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sectors = [
  {
    name: 'Savory Bites Restaurant',
    subdomain: 'savory-bites-restaurant',
    tagline: 'Fresh flavors, unforgettable dining',
    about: 'A contemporary fine-dining restaurant blending local ingredients with global techniques. Our chefs craft seasonal menus in a warm, inviting atmosphere perfect for any occasion.',
    phone: '+1-555-0101',
    address: '789 Elm Street, Midtown, City 12345',
    admin_password: 'rest123',
    color_primary: '#7f1d1d',
    color_secondary: '#f59e0b',
    color_tertiary: '#064e3b',
    hours: [
      { dow: 0, open: true,  ot: '10:00', ct: '21:00' },
      { dow: 1, open: false },
      { dow: 2, open: true,  ot: '11:00', ct: '21:00' },
      { dow: 3, open: true,  ot: '11:00', ct: '21:00' },
      { dow: 4, open: true,  ot: '11:00', ct: '22:00' },
      { dow: 5, open: true,  ot: '11:00', ct: '22:00' },
      { dow: 6, open: true,  ot: '10:00', ct: '22:00' },
    ],
    categories: [
      {
        name: 'Dine-In Experience',
        services: [
          { name: 'Tableside Brunch',       price: 35, dur: '60 min' },
          { name: 'Three-Course Dinner',    price: 55, dur: '90 min' },
          { name: "Chef's Tasting Menu",    price: 85, dur: '2 hr' },
          { name: 'Sunday Roast',           price: 40, dur: '75 min' },
          { name: 'Early Bird Special',     price: 25, dur: '45 min' },
        ],
      },
      {
        name: 'Private Events',
        services: [
          { name: 'Birthday Party (10 pax)',       price: 250, dur: '3 hr' },
          { name: 'Corporate Dinner (20 pax)',     price: 600, dur: '4 hr' },
          { name: 'Private Chef Experience',       price: 500, dur: '3 hr' },
          { name: 'Wine Tasting Evening',           price: 120, dur: '2 hr' },
        ],
      },
      {
        name: 'Catering & Takeaway',
        services: [
          { name: 'Office Lunch Box (per person)', price: 18, dur: '' },
          { name: 'Party Platter (serves 10)',     price: 120, dur: '' },
          { name: 'Full Event Catering',           price: 2000, dur: '' },
          { name: 'Weekend Family Meal (serves 4)', price: 65, dur: '' },
        ],
      },
    ],
    staff: [
      { name: 'Isabella Rossi',   role: 'Head Chef' },
      { name: 'James Chen',       role: 'Sous Chef' },
      { name: 'Sophia Martinez',  role: 'Restaurant Manager' },
      { name: 'Oliver Taylor',    role: 'Sommelier' },
      { name: 'Maya Patel',       role: 'Pastry Chef' },
    ],
  },
  {
    name: 'Refined Grooming Lounge',
    subdomain: 'refined-grooming-lounge',
    tagline: 'Barber, salon & spa — all in one',
    about: 'Your one-stop destination for premium grooming. From classic barber cuts and modern hairstyling to relaxing spa treatments and nail care, we offer a complete self-care experience under one roof.',
    phone: '+1-555-0202',
    address: '456 Oak Avenue, Downtown, City 12345',
    admin_password: 'groom123',
    color_primary: '#1e293b',
    color_secondary: '#b91c1c',
    color_tertiary: '#fbbf24',
    hours: [
      { dow: 0, open: true,  ot: '10:00', ct: '17:00' },
      { dow: 1, open: true,  ot: '09:00', ct: '20:00' },
      { dow: 2, open: true,  ot: '09:00', ct: '20:00' },
      { dow: 3, open: true,  ot: '09:00', ct: '20:00' },
      { dow: 4, open: true,  ot: '09:00', ct: '21:00' },
      { dow: 5, open: true,  ot: '09:00', ct: '21:00' },
      { dow: 6, open: true,  ot: '09:00', ct: '19:00' },
    ],
    categories: [
      {
        name: 'Barber Services',
        services: [
          { name: 'Classic Haircut',       price: 25, dur: '30 min' },
          { name: 'Skin Fade',             price: 30, dur: '40 min' },
          { name: 'Hot Towel Shave',       price: 28, dur: '30 min' },
          { name: 'Beard Trim & Shape',    price: 15, dur: '15 min' },
          { name: 'Hair & Beard Combo',    price: 40, dur: '50 min' },
          { name: 'Kids Haircut',          price: 18, dur: '20 min' },
        ],
      },
      {
        name: 'Salon Services',
        services: [
          { name: "Women's Haircut & Style", price: 45, dur: '45 min' },
          { name: 'Blow Dry & Curl',         price: 35, dur: '30 min' },
          { name: 'Balayage',                price: 120, dur: '2 hr' },
          { name: 'Hair Color (Full)',        price: 90, dur: '1.5 hr' },
          { name: 'Keratin Treatment',       price: 150, dur: '2.5 hr' },
        ],
      },
      {
        name: 'Nail Care',
        services: [
          { name: 'Classic Manicure',       price: 25, dur: '30 min' },
          { name: 'Gel Manicure',           price: 35, dur: '45 min' },
          { name: 'Pedicure',               price: 35, dur: '45 min' },
          { name: 'Acrylic Full Set',       price: 50, dur: '1 hr' },
          { name: 'Nail Art (per nail)',    price: 5,  dur: '10 min' },
        ],
      },
      {
        name: 'Spa & Massage',
        services: [
          { name: 'Swedish Massage (60 min)', price: 70, dur: '1 hr' },
          { name: 'Deep Tissue Massage',      price: 90, dur: '1 hr' },
          { name: 'Hot Stone Massage',        price: 100, dur: '75 min' },
          { name: 'Classic Facial',           price: 55, dur: '45 min' },
          { name: 'Anti-Aging Facial',        price: 80, dur: '1 hr' },
        ],
      },
    ],
    staff: [
      { name: 'Marcus Johnson',   role: 'Master Barber' },
      { name: 'Elena Rodriguez',  role: 'Senior Stylist' },
      { name: 'Mia Thompson',     role: 'Nail Technician' },
      { name: 'Amara Osei',       role: 'Massage Therapist' },
      { name: 'David Williams',   role: 'Barber' },
    ],
  },
  {
    name: 'BrightCare Dental Clinic',
    subdomain: 'brightcare-dental-clinic',
    tagline: 'Healthy smiles for the whole family',
    about: 'A modern dental clinic offering comprehensive oral care in a comfortable, anxiety-free environment. From routine checkups to advanced cosmetic dentistry, we treat every patient like family.',
    phone: '+1-555-0303',
    address: '123 Health Avenue, Medical District, City 12345',
    admin_password: 'dental123',
    color_primary: '#0c4a6e',
    color_secondary: '#0891b2',
    color_tertiary: '#22d3ee',
    hours: [
      { dow: 0, open: false },
      { dow: 1, open: true,  ot: '08:00', ct: '18:00' },
      { dow: 2, open: true,  ot: '08:00', ct: '18:00' },
      { dow: 3, open: true,  ot: '08:00', ct: '18:00' },
      { dow: 4, open: true,  ot: '08:00', ct: '19:00' },
      { dow: 5, open: true,  ot: '08:00', ct: '17:00' },
      { dow: 6, open: true,  ot: '09:00', ct: '14:00' },
    ],
    categories: [
      {
        name: 'General Dentistry',
        services: [
          { name: 'Dental Checkup & Cleaning',    price: 80,  dur: '30 min' },
          { name: 'Teeth Whitening',              price: 200, dur: '1 hr' },
          { name: 'Fillings (per tooth)',          price: 120, dur: '30 min' },
          { name: 'Sealants (per tooth)',          price: 40,  dur: '15 min' },
          { name: 'Fluoride Treatment',           price: 30,  dur: '10 min' },
        ],
      },
      {
        name: 'Cosmetic Dentistry',
        services: [
          { name: 'Veneers (per tooth)',          price: 500, dur: '1 hr' },
          { name: 'Invisalign Consultation',       price: 100, dur: '45 min' },
          { name: 'Dental Bonding',                price: 250, dur: '45 min' },
          { name: 'Smile Makeover Consultation',   price: 150, dur: '1 hr' },
        ],
      },
      {
        name: 'Restorative & Surgical',
        services: [
          { name: 'Root Canal Therapy',           price: 800, dur: '1.5 hr' },
          { name: 'Dental Crown',                 price: 900, dur: '1 hr' },
          { name: 'Tooth Extraction',             price: 150, dur: '30 min' },
          { name: 'Dental Implant',               price: 2500, dur: '2 hr' },
          { name: 'Wisdom Tooth Removal',          price: 400, dur: '1 hr' },
        ],
      },
      {
        name: 'Pediatric Dentistry',
        services: [
          { name: "Kids' First Visit",            price: 50,  dur: '20 min' },
          { name: 'Children\'s Checkup & Clean',  price: 60,  dur: '25 min' },
          { name: 'Frenectomy',                   price: 300, dur: '30 min' },
        ],
      },
    ],
    staff: [
      { name: 'Dr. Sarah Mitchell',   role: 'General Dentist' },
      { name: 'Dr. James Park',       role: 'Orthodontist' },
      { name: 'Dr. Rachel Green',     role: 'Pediatric Dentist' },
      { name: 'Linda Johnson',        role: 'Dental Hygienist' },
      { name: 'Mark Davis',           role: 'Clinic Manager' },
    ],
  },
  {
    name: 'Elevate Events & Fitness',
    subdomain: 'elevate-events-and-fitness',
    tagline: 'Celebrate, train, thrive',
    about: 'A premier event venue and fitness center under one roof. Host unforgettable celebrations in our elegant spaces, then crush your fitness goals in our state-of-the-art gym. Two passions, one destination.',
    phone: '+1-555-0404',
    address: '321 Park Boulevard, Westside, City 12345',
    admin_password: 'elevate123',
    color_primary: '#1e1b4b',
    color_secondary: '#d4af37',
    color_tertiary: '#475569',
    hours: [
      { dow: 0, open: true,  ot: '06:00', ct: '22:00' },
      { dow: 1, open: true,  ot: '05:00', ct: '22:00' },
      { dow: 2, open: true,  ot: '05:00', ct: '22:00' },
      { dow: 3, open: true,  ot: '05:00', ct: '22:00' },
      { dow: 4, open: true,  ot: '05:00', ct: '23:00' },
      { dow: 5, open: true,  ot: '06:00', ct: '23:00' },
      { dow: 6, open: true,  ot: '06:00', ct: '22:00' },
    ],
    categories: [
      {
        name: 'Event Spaces',
        services: [
          { name: 'Grand Hall Wedding (100 pax)',      price: 5000, dur: '12 hr' },
          { name: 'Intimate Party Room (30 pax)',      price: 800,  dur: '5 hr' },
          { name: 'Corporate Conference Room',         price: 1500, dur: '8 hr' },
          { name: 'Product Launch Package',            price: 3000, dur: '6 hr' },
          { name: 'Birthday Celebration Setup',        price: 600,  dur: '4 hr' },
        ],
      },
      {
        name: 'Fitness Memberships',
        services: [
          { name: 'Day Pass',                          price: 15,  dur: '' },
          { name: 'Monthly Unlimited',                 price: 80,  dur: '' },
          { name: 'Quarterly Membership',               price: 200, dur: '' },
          { name: 'Annual Membership',                  price: 600, dur: '' },
          { name: 'Student Monthly',                   price: 50,  dur: '' },
        ],
      },
      {
        name: 'Training & Classes',
        services: [
          { name: 'Personal Training Session',          price: 50,  dur: '1 hr' },
          { name: 'Yoga Class',                        price: 20,  dur: '1 hr' },
          { name: 'HIIT Group Class',                  price: 25,  dur: '45 min' },
          { name: 'Spin Class',                        price: 22,  dur: '45 min' },
          { name: 'Pilates Reformer',                  price: 35,  dur: '50 min' },
        ],
      },
    ],
    staff: [
      { name: 'Victoria Adams',    role: 'Events Director' },
      { name: 'Nathan Brooks',     role: 'Events Coordinator' },
      { name: 'Jake Morrison',     role: 'Head Fitness Coach' },
      { name: 'Lily Chen',         role: 'Yoga Instructor' },
      { name: 'Ryan Torres',       role: 'Personal Trainer' },
    ],
  },
  {
    name: 'LinguaBridge Tutoring',
    subdomain: 'linguabridge-tutoring',
    tagline: 'Speak the world, one lesson at a time',
    about: 'Expert language tutoring for all levels and ages. Whether you are preparing for exams, relocating abroad, or simply passionate about languages, our certified native-fluent instructors make learning effective and enjoyable.',
    phone: '+1-555-0505',
    address: '888 Learning Lane, Education District, City 12345',
    admin_password: 'lingua123',
    color_primary: '#064e3b',
    color_secondary: '#047857',
    color_tertiary: '#d97706',
    hours: [
      { dow: 0, open: true,  ot: '10:00', ct: '16:00' },
      { dow: 1, open: true,  ot: '08:00', ct: '20:00' },
      { dow: 2, open: true,  ot: '08:00', ct: '20:00' },
      { dow: 3, open: true,  ot: '08:00', ct: '20:00' },
      { dow: 4, open: true,  ot: '08:00', ct: '21:00' },
      { dow: 5, open: true,  ot: '08:00', ct: '19:00' },
      { dow: 6, open: true,  ot: '09:00', ct: '17:00' },
    ],
    categories: [
      {
        name: 'European Languages',
        services: [
          { name: 'English Tutoring',                price: 40, dur: '1 hr' },
          { name: 'Spanish Tutoring',                price: 40, dur: '1 hr' },
          { name: 'French Tutoring',                 price: 45, dur: '1 hr' },
          { name: 'German Tutoring',                 price: 45, dur: '1 hr' },
          { name: 'Italian Tutoring',                price: 45, dur: '1 hr' },
          { name: 'Portuguese Tutoring',             price: 40, dur: '1 hr' },
        ],
      },
      {
        name: 'Asian Languages',
        services: [
          { name: 'Mandarin Chinese',                price: 50, dur: '1 hr' },
          { name: 'Japanese Tutoring',               price: 50, dur: '1 hr' },
          { name: 'Korean Tutoring',                 price: 45, dur: '1 hr' },
          { name: 'Arabic Tutoring',                 price: 45, dur: '1 hr' },
        ],
      },
      {
        name: 'Exam Preparation',
        services: [
          { name: 'IELTS Preparation',               price: 55, dur: '1.5 hr' },
          { name: 'TOEFL Preparation',               price: 55, dur: '1.5 hr' },
          { name: 'DELE / DALF Exam Prep',           price: 60, dur: '1.5 hr' },
          { name: 'Business English Certification',  price: 50, dur: '1 hr' },
        ],
      },
      {
        name: 'Special Programs',
        services: [
          { name: 'Conversation Practice Pack (5)',   price: 150, dur: '' },
          { name: 'Intensive Bootcamp (10 sessions)', price: 350, dur: '' },
          { name: 'Kids Language Club (per month)',   price: 120, dur: '' },
          { name: 'Corporate Language Training',      price: 800, dur: '' },
        ],
      },
    ],
    staff: [
      { name: 'Dr. Maria Santos',     role: 'Academic Director' },
      { name: 'Pierre Dubois',        role: 'French Instructor' },
      { name: 'Yuki Tanaka',          role: 'Japanese Instructor' },
      { name: 'Carlos Mendez',        role: 'Spanish Instructor' },
      { name: 'Li Wei',               role: 'Mandarin Instructor' },
      { name: 'Sarah Thompson',       role: 'IELTS Specialist' },
    ],
  },
  {
    name: 'Lens & Light Photography',
    subdomain: 'lens-and-light-photography',
    tagline: 'Capturing moments that last forever',
    about: 'A full-service photography studio specializing in portraits, events, and commercial shoots. Our team of award-winning photographers brings creativity and professionalism to every project.',
    phone: '+1-555-0606',
    address: '555 Creative Studios, Arts District, City 12345',
    admin_password: 'photo123',
    color_primary: '#1c1917',
    color_secondary: '#78716c',
    color_tertiary: '#eab308',
    hours: [
      { dow: 0, open: true,  ot: '10:00', ct: '17:00' },
      { dow: 1, open: true,  ot: '09:00', ct: '19:00' },
      { dow: 2, open: true,  ot: '09:00', ct: '19:00' },
      { dow: 3, open: true,  ot: '09:00', ct: '19:00' },
      { dow: 4, open: true,  ot: '09:00', ct: '20:00' },
      { dow: 5, open: true,  ot: '09:00', ct: '20:00' },
      { dow: 6, open: true,  ot: '09:00', ct: '18:00' },
    ],
    categories: [
      {
        name: 'Portrait Photography',
        services: [
          { name: 'Individual Portrait Session',      price: 150, dur: '1 hr' },
          { name: 'Family Portrait Session',          price: 250, dur: '1.5 hr' },
          { name: 'Professional Headshots',           price: 120, dur: '30 min' },
          { name: 'Maternity Photoshoot',             price: 200, dur: '1 hr' },
          { name: 'Newborn Session',                  price: 180, dur: '1.5 hr' },
        ],
      },
      {
        name: 'Event Photography',
        services: [
          { name: 'Wedding Photography (full day)',   price: 2500, dur: '' },
          { name: 'Birthday Party Coverage',          price: 400,  dur: '3 hr' },
          { name: 'Corporate Event Coverage',         price: 800,  dur: '4 hr' },
          { name: 'Concert & Performance',            price: 600,  dur: '' },
        ],
      },
      {
        name: 'Commercial',
        services: [
          { name: 'Product Photography (per item)',   price: 30,  dur: '' },
          { name: 'Real Estate Photo Package',        price: 200, dur: '' },
          { name: 'Brand Photo Shoot',                price: 1000, dur: '' },
          { name: 'Menu & Food Photography',          price: 350, dur: '' },
        ],
      },
      {
        name: 'Prints & Albums',
        services: [
          { name: 'Fine Art Print (8x10)',            price: 40,  dur: '' },
          { name: 'Premium Photo Album (20 pages)',   price: 200, dur: '' },
          { name: 'Canvas Wrap (16x20)',              price: 80,  dur: '' },
          { name: 'Digital Photo Package',            price: 100, dur: '' },
        ],
      },
    ],
    staff: [
      { name: 'Alex Morgan',        role: 'Lead Photographer' },
      { name: 'Jessica Kim',        role: 'Portrait Specialist' },
      { name: 'Daniel Foster',      role: 'Event Photographer' },
      { name: 'Olivia Hart',        role: 'Photo Editor & Retoucher' },
    ],
  },
];

async function seedSector(sector) {
  console.log(`\n── ${sector.name} ──`);

  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('subdomain', sector.subdomain)
    .maybeSingle();

  if (existing) {
    // Delete and recreate to ensure fresh data
    await supabase.from('businesses').delete().eq('id', existing.id);
    console.log(`→ Deleted old version (was id=${existing.id}), recreating...`);
  }

  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .insert({
      name: sector.name,
      subdomain: sector.subdomain,
      tagline: sector.tagline,
      about: sector.about,
      phone: sector.phone,
      address: sector.address,
      status: 'active',
      color_primary: sector.color_primary,
      color_secondary: sector.color_secondary,
      color_tertiary: sector.color_tertiary,
      admin_password: sector.admin_password,
    })
    .select('id')
    .single();
  if (bizErr) throw bizErr;
  console.log(`✓ Created (id=${biz.id})`);

  const bid = biz.id;

  // Work hours
  const { error: hrsErr } = await supabase.from('work_hours').insert(
    sector.hours.map(d => ({
      business_id: bid,
      day_of_week: d.dow,
      is_open: d.open ? 1 : 0,
      open_time: d.ot || '09:00',
      close_time: d.ct || '18:00',
    }))
  );
  if (hrsErr) throw hrsErr;

  // Categories & Services
  for (let ci = 0; ci < sector.categories.length; ci++) {
    const cat = sector.categories[ci];
    const { data: catRow, error: catErr } = await supabase
      .from('service_categories')
      .insert({ business_id: bid, name: cat.name, sort_order: ci + 1 })
      .select('id')
      .single();
    if (catErr) throw catErr;

    const { error: svcErr } = await supabase.from('services').insert(
      cat.services.map(s => ({
        business_id: bid,
        name: s.name,
        description: `${s.name} — ${sector.name}`,
        price: s.price,
        duration: s.dur,
        category_id: catRow.id,
      }))
    );
    if (svcErr) throw svcErr;
  }

  // Staff
  const { error: staffErr } = await supabase.from('staff').insert(
    sector.staff.map((s, i) => ({
      business_id: bid,
      name: s.name,
      role: s.role,
      sort_order: i + 1,
    }))
  );
  if (staffErr) throw staffErr;

  const svcCount = sector.categories.reduce((a, c) => a + c.services.length, 0);
  console.log(`✓ ${sector.categories.length} categories, ${svcCount} services, ${sector.staff.length} staff`);
  return bid;
}

const imagePaths = {
  'savory-bites-restaurant': {
    logo: '/images/savory-bites-restaurant/logo.jpg',
    hero: '/images/savory-bites-restaurant/hero.jpg',
  },
  'refined-grooming-lounge': {
    logo: '/images/refined-grooming-lounge/logo.jpg',
    hero: '/images/refined-grooming-lounge/hero.jpg',
  },
  'brightcare-dental-clinic': {
    logo: '/images/brightcare-dental-clinic/logo.jpg',
    hero: '/images/brightcare-dental-clinic/hero.jpg',
  },
  'elevate-events-and-fitness': {
    logo: '/images/elevate-events-and-fitness/logo.jpg',
    hero: '/images/elevate-events-and-fitness/hero.jpg',
  },
  'linguabridge-tutoring': {
    logo: '/images/linguabridge-tutoring/logo.jpg',
    hero: '/images/linguabridge-tutoring/hero.jpg',
  },
  'lens-and-light-photography': {
    logo: '/images/lens-and-light-photography/logo.jpg',
    hero: '/images/lens-and-light-photography/hero.jpg',
  },
};

async function addImages() {
  console.log('\n── Adding real images ──');

  const { data: businesses, error: bErr } = await supabase
    .from('businesses')
    .select('id, name, subdomain, color_primary');
  if (bErr) throw bErr;

  for (const biz of businesses) {
    const paths = imagePaths[biz.subdomain];

    // Update logo + hero with local images
    const logoUrl = paths?.logo || `https://placehold.co/200x200/333/ffffff?text=${encodeURIComponent(biz.name[0])}`;
    const heroUrl = paths?.hero || `https://placehold.co/1200x400/333/ffffff?text=${encodeURIComponent(biz.name)}`;
    const { error: upErr } = await supabase
      .from('businesses')
      .update({ logo_url: logoUrl, hero_image_url: heroUrl })
      .eq('id', biz.id);
    if (upErr) throw upErr;

    // Clear old service images for this business, then insert fresh ones
    const { data: services, error: svcErr } = await supabase
      .from('services')
      .select('id, name')
      .eq('business_id', biz.id);
    if (svcErr) throw svcErr;

    const svcIds = services.map(s => s.id);
    if (svcIds.length) {
      const { error: delErr } = await supabase
        .from('service_images')
        .delete()
        .in('service_id', svcIds);
      if (delErr) throw delErr;
    }

    // Use picsum.photos for service images — each service gets a unique real photo via seed
    const { error: imgErr } = await supabase.from('service_images').insert(
      services.map((svc, i) => ({
        service_id: svc.id,
        image_url: `https://picsum.photos/seed/${encodeURIComponent(svc.name)}/600/400`,
        sort_order: i + 1,
      }))
    );
    if (imgErr) throw imgErr;

    console.log(`✓ ${biz.name} — logo, hero, ${services.length} service images`);
  }
}

async function run() {
  console.log('Seeding sample businesses...\n');

  const { data: existingAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('username', 'admin')
    .maybeSingle();
  if (!existingAdmin) {
    const { error } = await supabase
      .from('super_admins')
      .insert({ username: 'admin', password_hash: 'admin123' });
    if (error) throw error;
    console.log('✓ Super admin: admin / admin123');
  }

  // Remove old subdomains that don't match the new list
  const oldSubdomains = ['sample', 'barbershop', 'salon', 'venue', 'restaurant', 'refined', 'dental', 'elevate', 'tutoring', 'photography'];
  const newSubdomains = sectors.map(s => s.subdomain);
  for (const old of oldSubdomains) {
    if (!newSubdomains.includes(old)) {
      const { data: oldBiz } = await supabase
        .from('businesses')
        .select('id')
        .eq('subdomain', old)
        .maybeSingle();
      if (oldBiz) {
        await supabase.from('businesses').delete().eq('id', oldBiz.id);
        console.log(`🗑 Removed old "${old}" business`);
      }
    }
  }

  for (const sector of sectors) {
    await seedSector(sector);
  }

  await addImages();

  console.log('\n✔ Seeding complete. Images served from /images/{business}/ (local) + picsum.photos (services).\n');
  console.log('Sectors:');
  sectors.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name}  — subdomain: "${s.subdomain}"  — admin: "${s.admin_password}"`);
  });
  process.exit(0);
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
