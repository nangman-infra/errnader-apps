export type UserRole = 'traveler' | 'errander';

export interface UserProfile {
  id: string;
  initial: string;
  name: string;
  email: string;
  joinedAt: string;
  activeCount: number;
  completedCount: number;
  totalSpentLabel: string;
  paymentMethod: string;
  language: string;
  role: UserRole;
  avatarUrl?: string;
  areas?: string[];
  linePayProfileUrl?: string | null;
  paymentNote?: string | null;
}

export type WhenOption = 'now' | 'today' | 'tomorrow' | 'custom';
export type ErrandStatus = 'PENDING' | 'CONFIRMED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface Errand {
  errandId: string;
  userId: string;
  status: ErrandStatus;
  title: string;
  category: string;
  when: string;
  areaId: string | null;
  where: string;
  photoUrls: string[];
  detail: string | null;
  budgetAmount?: number | null;
  budgetCurrency?: 'KRW' | null;
  erranderId: string | null;
  travelerId?: string | null;
  travelerName?: string | null;
  confirmedErranderId?: string | null;
  confirmedPriceAmount?: number | null;
  confirmedCurrency?: 'KRW' | null;
  confirmedScheduledAt?: string | null;
  confirmedPlace?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  canReview?: boolean;
  reviewedUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type BadgeType = 'popular' | 'fast_response' | 'top_rated' | 'new' | 'native_en';

export interface Errander {
  id: string;
  initial: string;
  name: string;
  avatarColor: string;
  badge?: BadgeType;
  specialty: string;
  rating: number;
  completedJobs: number;
  languages: string[];
  pricePerHour: number;
  city: string;
  areas: string[];
  isAvailable: boolean;
}

export interface ChatRoom {
  id: string;
  erranderName: string;
  erranderInitial: string;
  avatarColor: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

export interface Inquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  answer: string | null;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  reviewId: string;
  errandId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  content?: string | null;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  initial: string;
  avatarUrl?: string | null;
  role: UserRole;
  areas: string[];
  completedCount: number;
  averageRating: number | null;
  reviewCount: number;
  recentReviews: ReviewSummary[];
}

export interface ErrandConfirmationCard {
  type: 'ERRAND_CONFIRMATION';
  cardId: string;
  errandId: string;
  proposerId: string;
  receiverId: string;
  priceAmount: number;
  currency: 'KRW';
  scheduledAt: string;
  place: string;
  note?: string | null;
  errandTitle?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  respondedAt?: string | null;
}

export interface ErrandCompletionRequest {
  requestId: string;
  errandId: string;
  requesterId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  respondedAt?: string | null;
}
