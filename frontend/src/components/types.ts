export interface Arena {
  id: string;
  name: string;
  location: string;
  sportType: string;
  pricePerHour: number;
  imageUrl?: string;
  active?: boolean;
}

export interface Booking {
  id: string;
  arena: Arena;
  userEmail: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}
