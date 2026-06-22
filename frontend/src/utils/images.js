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

export function getLocalImage(subdomain, type) {
  return imageMap[subdomain]?.[type] || null;
}

export function resolveBusinessImage(business, type) {
  if (!business) return null;
  const url = business[type === 'logo' ? 'logo_url' : 'hero_image_url'];
  if (url && !url.includes('placehold.co')) return url;
  return getLocalImage(business.subdomain, type) || url;
}
