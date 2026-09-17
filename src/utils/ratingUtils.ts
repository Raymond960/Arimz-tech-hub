import { Place } from '../types';

export interface RatingStats {
  rating: number;
  reviewsCount: number;
  hasReviews: boolean;
  formattedRating: string;
  reviewLabel: string;
}

export function getPlaceRatingStats(place: Place): RatingStats {
  const reviews = place.reviews || [];
  const reviewsCount = reviews.length;

  if (reviewsCount > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = Number((sum / reviewsCount).toFixed(1));
    return {
      rating: avg,
      reviewsCount,
      hasReviews: true,
      formattedRating: avg.toFixed(1),
      reviewLabel: `${reviewsCount} review${reviewsCount === 1 ? '' : 's'}`
    };
  }

  return {
    rating: 0,
    reviewsCount: 0,
    hasReviews: false,
    formattedRating: '0.0',
    reviewLabel: 'No reviews yet'
  };
}
