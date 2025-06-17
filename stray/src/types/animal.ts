export type AnimalStatus = 'healthy' | 'sick' | 'injured' | 'unknown';

export interface Animal {
  id: string;
  name?: string;
  status: AnimalStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // user id
  lastUpdatedBy: string; // user id
}

export interface CreateAnimalDTO {
  name?: string;
  status: AnimalStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  photos: string[];
}

export interface UpdateAnimalDTO {
  name?: string;
  status?: AnimalStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  photos?: string[];
} 