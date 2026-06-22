const imageMap = {
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

const serviceImageMap = {
  'savory-bites-restaurant': {
    'Dine-In Experience': '/images/savory-bites-restaurant/dine-in.jpg',
    'Private Events': '/images/savory-bites-restaurant/private-events.jpg',
    'Catering & Takeaway': '/images/savory-bites-restaurant/catering.jpg',
  },
  'refined-grooming-lounge': {
    'Barber Services': '/images/refined-grooming-lounge/barber.jpg',
    'Salon Services': '/images/refined-grooming-lounge/salon.jpg',
    'Nail Care': '/images/refined-grooming-lounge/nail.jpg',
    'Spa & Massage': '/images/refined-grooming-lounge/spa.jpg',
  },
  'brightcare-dental-clinic': {
    'General Dentistry': '/images/brightcare-dental-clinic/general-dentistry.jpg',
    'Cosmetic Dentistry': '/images/brightcare-dental-clinic/cosmetic.jpg',
    'Restorative & Surgical': '/images/brightcare-dental-clinic/restorative.jpg',
    'Pediatric Dentistry': '/images/brightcare-dental-clinic/pediatric.jpg',
  },
  'elevate-events-and-fitness': {
    'Event Spaces': '/images/elevate-events-and-fitness/event-spaces.jpg',
    'Fitness Memberships': '/images/elevate-events-and-fitness/fitness.jpg',
    'Training & Classes': '/images/elevate-events-and-fitness/training.jpg',
  },
  'linguabridge-tutoring': {
    'European Languages': '/images/linguabridge-tutoring/european-languages.jpg',
    'Asian Languages': '/images/linguabridge-tutoring/asian-languages.jpg',
    'Exam Preparation': '/images/linguabridge-tutoring/exam-prep.jpg',
    'Special Programs': '/images/linguabridge-tutoring/special-programs.jpg',
  },
  'lens-and-light-photography': {
    'Portrait Photography': '/images/lens-and-light-photography/portrait.jpg',
    'Event Photography': '/images/lens-and-light-photography/event.jpg',
    'Commercial': '/images/lens-and-light-photography/commercial.jpg',
    'Prints & Albums': '/images/lens-and-light-photography/prints.jpg',
  },
};

export function getLocalImage(subdomain, type) {
  return imageMap[subdomain]?.[type] || null;
}

export function resolveBusinessImage(business, type) {
  if (!business) return null;
  const url = business[type === 'logo' ? 'logo_url' : 'hero_image_url'];
  if (url && !url.includes('placehold.co') && !url.includes('picsum.photos')) return url;
  return getLocalImage(business.subdomain, type) || url;
}

export function getServiceFallbackImage(subdomain, categoryName) {
  if (!subdomain || !categoryName) return null;
  return serviceImageMap[subdomain]?.[categoryName] || null;
}
