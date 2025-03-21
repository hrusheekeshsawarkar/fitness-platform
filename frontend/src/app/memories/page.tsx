"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { PlusIcon, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, photoApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { auth } from "@/lib/firebase";

interface Photo {
  _id: string;
  title: string;
  description: string;
  image_url: string;
  photo_date: string;
  created_at: string;
  created_by: string;
  // Frontend computed properties
  photo_url?: string;
  thumbnail_url?: string;
}

export default function MemoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use react-intersection-observer to detect when the sentinel comes into view
  const { ref, inView } = useInView({
    threshold: 0,
  });

  // Fetch photos when page changes or component mounts
  const fetchPhotos = useCallback(async (pageNumber: number) => {
    try {
      const skip = (pageNumber - 1) * 12;
      const response = await api.get(`/photos/?skip=${skip}&limit=12`);
      
      if (response.data && Array.isArray(response.data.items)) {
        // Process photos to ensure they have proper URLs
        const processedPhotos = response.data.items.map((photo: Photo) => {
          // Make sure all image URLs are absolute
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
          
          // Handle the case where image_url might already be a complete URL
          if (!photo.image_url.startsWith('http')) {
            photo.image_url = `${apiBaseUrl}${photo.image_url}`;
          }
          
          // Set photo_url if not provided or convert to absolute URL
          if (!photo.photo_url) {
            photo.photo_url = photo.image_url;
          } else if (!photo.photo_url.startsWith('http')) {
            photo.photo_url = `${apiBaseUrl}${photo.photo_url}`;
          }
          
          // Set thumbnail_url if not provided
          if (!photo.thumbnail_url) {
            photo.thumbnail_url = photo.photo_url;
          } else if (!photo.thumbnail_url.startsWith('http')) {
            photo.thumbnail_url = `${apiBaseUrl}${photo.thumbnail_url}`;
          }
          
          return photo;
        });
        
        // If it's the first page, replace photos; otherwise append
        if (pageNumber === 1) {
          setPhotos(processedPhotos);
        } else {
          setPhotos(prev => [...prev, ...processedPhotos]);
        }
        
        // Check if we have more photos to load
        setHasMore(response.data.total > (skip + processedPhotos.length));
      } else {
        console.error("Invalid response format:", response.data);
        setError("Failed to load photos. Invalid response format.");
      }
    } catch (err: any) {
      console.error("Error fetching photos:", err);
      setError(err.response?.data?.detail || "Failed to load photos.");
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to load photos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load more photos when the sentinel comes into view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchPhotos(nextPage);
        return nextPage;
      });
    }
  }, [inView, hasMore, loading, fetchPhotos]);

  // Initial load
  useEffect(() => {
    fetchPhotos(1);
  }, [fetchPhotos]);

  // Add a function to handle photo deletion
  const handleDeletePhoto = async (photoId: string) => {
    if (!user?.customClaims?.admin) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to delete photos.",
        variant: "destructive",
      });
      return;
    }

    // Confirm before deleting
    if (!confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // Ensure we have a fresh token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to delete photos");
      }
      
      // Get a fresh token before making the request
      await currentUser.getIdToken(true);
      
      // Format photo ID properly (remove MongoDB ObjectId wrapper if present)
      const cleanId = photoId.toString().replace(/^ObjectId\(['"](.+)['"]\)$/, '$1');
      console.log(`Deleting photo with ID: ${cleanId}`);
      
      // Delete the photo
      await photoApi.deletePhoto(cleanId);
      
      // Close the modal
      setSelectedPhoto(null);
      
      // Remove the deleted photo from the state
      setPhotos(photos.filter(photo => photo._id !== photoId));
      
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      
      let errorMessage = "Failed to delete photo";
      
      // Handle specific error conditions
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "You must be logged in to delete photos";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to delete photos";
        } else if (error.response.status === 404) {
          errorMessage = "Photo not found or already deleted";
          // Close the modal and remove from state if it's gone
          setSelectedPhoto(null);
          setPhotos(photos.filter(photo => photo._id !== photoId));
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Memories</h1>
        {user?.customClaims?.admin && (
          <Link href="/admin/photos/create">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Upload Photo
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading && photos.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-gray-100">
              <Skeleton className="h-48 w-full" />
              <div className="p-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-xl font-medium text-gray-500">No photos yet</h3>
          {user?.customClaims?.admin && (
            <Link href="/admin/photos/create">
              <Button className="mt-4">Upload Your First Photo</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <div 
                key={photo._id} 
                className="rounded-lg overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={photo.thumbnail_url || photo.photo_url || photo.image_url || '/placeholder.jpg'}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium line-clamp-1">{photo.title}</h3>
                  {photo.photo_date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(photo.photo_date), "MMMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator at the bottom that serves as the sentinel */}
          {hasMore && (
            <div ref={ref} className="flex justify-center mt-8 pb-8">
              <div className="animate-pulse flex space-x-4">
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[60vh]">
              <Image
                src={selectedPhoto.photo_url || selectedPhoto.image_url || '/placeholder.jpg'}
                alt={selectedPhoto.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="object-contain"
              />
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold">{selectedPhoto.title}</h2>
              {selectedPhoto.photo_date && (
                <p className="text-sm text-muted-foreground mb-2">
                  {format(new Date(selectedPhoto.photo_date), "MMMM d, yyyy")}
                </p>
              )}
              {selectedPhoto.description && (
                <p className="text-gray-600">{selectedPhoto.description}</p>
              )}
            </div>
            <div className="border-t p-4 flex justify-end gap-2">
              {user?.customClaims?.admin && (
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeletePhoto(selectedPhoto._id)}
                  disabled={isDeleting}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 