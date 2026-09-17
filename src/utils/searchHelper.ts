import { Place, ShendamEvent, Opportunity, CategoryId } from '../types';

/**
 * Normalizes string by trimming, removing excessive whitespace, and lowercasing.
 */
export function normalizeSearchTerm(term: string): string {
  return term ? term.toLowerCase().trim().replace(/\s+/g, ' ') : '';
}

/**
 * Performs case-insensitive, multi-token, and field-aware matching for a Place listing.
 */
export function matchPlaceSearch(place: Place, query: string): boolean {
  const q = normalizeSearchTerm(query);
  if (!q) return true;

  const tokens = q.split(' ').filter(Boolean);

  // Collect all searchable textual content from the place
  const parts: (string | undefined)[] = [
    place.name,
    place.category,
    place.categoryLabel,
    place.area,
    place.address,
    place.description,
    place.owner,
    place.phone,
    place.whatsapp,
    place.priceRange,
    place.priceDetails,
    place.culturalSignificance,
    place.organizer,
    ...(place.amenities || []),
    ...(place.services || []),
    ...(place.products || []),
    ...(place.additionalServices || []),
    ...(place.supportedBrands || []),
    ...(place.accessories || []),
    ...(place.rooms?.map((r) => `${r.name} ${r.description || ''}`) || []),
    ...(place.menuItems?.map((m) => `${m.name} ${m.description || ''}`) || [])
  ];

  const fullSearchableText = parts
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toLowerCase())
    .join(' ');

  // Direct substring match
  if (fullSearchableText.includes(q)) {
    return true;
  }

  // All individual token words match somewhere in the place's data
  if (tokens.length > 1 && tokens.every((token) => fullSearchableText.includes(token))) {
    return true;
  }

  return false;
}

/**
 * Checks if a Place matches a category filter.
 */
export function matchPlaceCategory(place: Place, selectedCategory: CategoryId | 'all' | 'jobs'): boolean {
  if (selectedCategory === 'all') return true;
  if (selectedCategory === 'jobs' || selectedCategory === 'events') return false;

  // Exact category match
  if (place.category === selectedCategory) return true;

  // If filter is 'businesses', match commercial categories like services, shopping, businesses
  if (selectedCategory === 'businesses') {
    return place.category === 'businesses' || place.category === 'services' || place.category === 'shopping';
  }

  // If filter is 'tourist_spots', match tourist spots / cultural attractions
  if (selectedCategory === 'tourist_spots') {
    return place.category === 'tourist_spots';
  }

  return false;
}

/**
 * Performs case-insensitive, multi-token matching for an Event.
 */
export function matchEventSearch(event: ShendamEvent, query: string): boolean {
  const q = normalizeSearchTerm(query);
  if (!q) return true;

  const tokens = q.split(' ').filter(Boolean);

  const parts: (string | undefined)[] = [
    event.title,
    event.category,
    event.location,
    event.description,
    event.tag,
    event.organizer,
    event.date,
    event.time
  ];

  const fullText = parts
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toLowerCase())
    .join(' ');

  if (fullText.includes(q)) return true;
  if (tokens.length > 1 && tokens.every((token) => fullText.includes(token))) return true;

  return false;
}

/**
 * Performs case-insensitive, multi-token matching for an Opportunity / Job.
 */
export function matchOpportunitySearch(opp: Opportunity, query: string): boolean {
  const q = normalizeSearchTerm(query);
  if (!q) return true;

  const tokens = q.split(' ').filter(Boolean);

  const parts: (string | undefined)[] = [
    opp.title,
    opp.organization,
    opp.category,
    opp.location,
    opp.description,
    opp.remoteStatus,
    opp.compensation,
    ...(opp.requirements || [])
  ];

  const fullText = parts
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toLowerCase())
    .join(' ');

  if (fullText.includes(q)) return true;
  if (tokens.length > 1 && tokens.every((token) => fullText.includes(token))) return true;

  return false;
}
