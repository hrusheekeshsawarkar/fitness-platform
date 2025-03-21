"use client";

import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return config;
    }
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions for events
export const eventApi = {
  getEvents: async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const response = await api.get(`/events?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  getEvent: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  createEvent: async (eventData: any) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
  updateEvent: async (id: string, eventData: any) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },
  deleteEvent: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
  registerForEvent: async (id: string) => {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },
  unregisterFromEvent: async (id: string) => {
    const response = await api.post(`/events/${id}/unregister`);
    return response.data;
  },
  getUserEvents: async () => {
    const response = await api.get('/events/user/registered');
    return response.data;
  },
};

// API functions for progress
export const progressApi = {
  createProgress: async (progressData: any) => {
    const response = await api.post('/progress', progressData);
    return response.data;
  },
  getUserProgress: async (eventId?: string) => {
    const url = eventId ? `/progress?event_id=${eventId}` : '/progress';
    const response = await api.get(url);
    return response.data;
  },
  getProgress: async (id: string) => {
    const response = await api.get(`/progress/${id}`);
    return response.data;
  },
  updateProgress: async (id: string, progressData: any) => {
    const response = await api.put(`/progress/${id}`, progressData);
    return response.data;
  },
  deleteProgress: async (id: string) => {
    const response = await api.delete(`/progress/${id}`);
    return response.data;
  },
  getEventProgress: async (eventId: string) => {
    const response = await api.get(`/progress/event/${eventId}`);
    return response.data;
  },
  getLeaderboard: async (eventId: string) => {
    const response = await api.get(`/progress/event/${eventId}/leaderboard`);
    return response.data;
  },
};

// API functions for users
export const userApi = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  updateCurrentUser: async (userData: any) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },
  createUser: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
};

// API functions for photos
export const photoApi = {
  getPhotos: async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const response = await api.get(`/photos?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  getPhoto: async (id: string) => {
    const response = await api.get(`/photos/${id}`);
    return response.data;
  },
  uploadPhoto: async (formData: FormData) => {
    const response = await api.post('/photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deletePhoto: async (id: string) => {
    try {
      const response = await api.delete(`/photos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw error;
    }
  },
  updatePhoto: async (id: string, photoData: any) => {
    const response = await api.put(`/photos/${id}`, photoData);
    return response.data;
  },
};

export { api }; 