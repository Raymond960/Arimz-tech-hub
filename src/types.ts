export type CategoryId = 
  | 'hotels'
  | 'restaurants'
  | 'businesses'
  | 'tourist_spots'
  | 'more'
  | 'transport'
  | 'events'
  | 'shopping'
  | 'services'
  | 'health'
  | 'emergency';

export interface PlaceReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Place {
  id: string;
  name: string;
  category: CategoryId;
  categoryLabel: string;
  rating: number;
  reviewsCount: number;
  image: string;
  gallery?: string[];
  address: string;
  area: string;
  description: string;
  phone?: string;
  whatsapp?: string;
  priceRange?: '₦' | '₦₦' | '₦₦₦' | 'Free';
  priceDetails?: string;
  openingHours?: string;
  featured?: boolean;
  popular?: boolean;
  amenities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapPosition?: {
    x: number; // percentage on map
    y: number; // percentage on map
  };
  reviews?: PlaceReview[];
}

export interface HeroSlide {
  id: string;
  tagline: string;
  title: string;
  description: string;
  image: string;
  categoryTarget?: CategoryId;
}

export interface NotificationItem {
  id: string;
  title: string;
  category: string;
  time: string;
  content: string;
  read: boolean;
}

export interface ShendamEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  image: string;
  attendeesCount?: number;
  description: string;
  tag?: string;
}

export type TabId = 'home' | 'explore' | 'map' | 'saved' | 'profile';
