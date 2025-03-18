"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface Event {
  _id: string;
  name: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  target_distance?: number;
  target_time?: number;
  participants: string[];
}

interface Progress {
  _id: string;
  user_id: string;
  event_id: string;
  distance: number;
  time: number;
  date: string;
  notes: string;
}

export default function ProgressUpdatePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [distance, setDistance] = useState<number | "">("");
  const [time, setTime] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update your progress.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch event details
        const eventResponse = await api.get(`/events/${id}`);
        setEvent(eventResponse.data);
        
        // Check if user is registered for this event
        if (!eventResponse.data.participants.includes(user.uid)) {
          toast({
            title: "Not Registered",
            description: "You are not registered for this event.",
            variant: "destructive",
          });
          router.push(`/events/${id}`);
          return;
        }
        
        // Fetch user's progress for this event
        const progressResponse = await api.get(`/progress/event/${id}`);
        if (Array.isArray(progressResponse.data)) {
          setProgress(progressResponse.data);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load event data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !event) return;
    
    // Validate form
    if (
      (event.target_distance && distance === "") ||
      (event.target_time && time === "")
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const progressData = {
        event_id: id,
        distance: distance || 0,
        time: time || 0,
        notes,
      };
      
      await api.post("/progress", progressData);
      
      toast({
        title: "Success",
        description: "Your progress has been updated successfully",
      });
      
      // Reset form
      setDistance("");
      setTime("");
      setNotes("");
      
      // Refresh progress data
      const progressResponse = await api.get(`/progress/event/${id}`);
      if (Array.isArray(progressResponse.data)) {
        setProgress(progressResponse.data);
      }
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update progress",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalProgress = () => {
    if (!progress.length) return { totalDistance: 0, totalTime: 0 };
    
    return progress.reduce(
      (acc, p) => {
        return {
          totalDistance: acc.totalDistance + (p.distance || 0),
          totalTime: acc.totalTime + (p.time || 0),
        };
      },
      { totalDistance: 0, totalTime: 0 }
    );
  };

  const getProgressPercentage = () => {
    if (!event) return 0;
    
    const { totalDistance, totalTime } = getTotalProgress();
    
    if (event.target_distance && totalDistance) {
      return Math.min(
        Math.round((totalDistance / event.target_distance) * 100),
        100
      );
    }
    
    if (event.target_time && totalTime) {
      return Math.min(
        Math.round((totalTime / event.target_time) * 100),
        100
      );
    }
    
    return 0;
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Link href={`/events/${id}`} className="flex items-center mb-6 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Event
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Update Your Progress</CardTitle>
              <CardDescription>
                Log your progress for {event.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {event.target_distance && (
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (km)</Label>
                    <Input
                      id="distance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value ? parseFloat(e.target.value) : "")}
                      required
                    />
                  </div>
                )}
                
                {event.target_time && (
                  <div className="space-y-2">
                    <Label htmlFor="time">Time (minutes)</Label>
                    <Input
                      id="time"
                      type="number"
                      step="0.01"
                      min="0"
                      value={time}
                      onChange={(e) => setTime(e.target.value ? parseFloat(e.target.value) : "")}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about your progress..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Updating..." : "Update Progress"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm font-medium">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Stats</h3>
                <div className="space-y-2">
                  {event.target_distance && (
                    <div>
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="font-medium">
                        {getTotalProgress().totalDistance.toFixed(2)} / {event.target_distance} km
                      </p>
                    </div>
                  )}
                  
                  {event.target_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {getTotalProgress().totalTime.toFixed(2)} / {event.target_time} minutes
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Entries</p>
                    <p className="font-medium">{progress.length}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Recent Updates</h3>
                {progress.length > 0 ? (
                  <div className="space-y-3">
                    {progress.slice(0, 3).map((p) => (
                      <div key={p._id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(p.date).toLocaleDateString()}
                            </p>
                            {p.distance > 0 && (
                              <p className="text-sm">Distance: {p.distance} km</p>
                            )}
                            {p.time > 0 && (
                              <p className="text-sm">Time: {p.time} minutes</p>
                            )}
                          </div>
                        </div>
                        {p.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No progress updates yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 