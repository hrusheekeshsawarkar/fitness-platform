"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function MyEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your events.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    const fetchUserEvents = async () => {
      try {
        const response = await api.get("/events");
        console.log("API Response:", response.data); // Debug log
        
        if (Array.isArray(response.data)) {
          // Filter events where the user is a participant
          const userEvents = response.data.filter(
            (event) => event.participants.includes(user.uid)
          );
          setEvents(userEvents);
          
          // Fetch progress for each event
          for (const event of userEvents) {
            try {
              const progressResponse = await api.get(`/progress/event/${event._id}`);
              if (Array.isArray(progressResponse.data)) {
                setProgress((prev) => ({
                  ...prev,
                  [event._id]: progressResponse.data,
                }));
              }
            } catch (error) {
              console.error(`Error fetching progress for event ${event._id}:`, error);
            }
          }
        } else {
          console.log("Response is not an array:", response.data);
          setEvents([]);
        }
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load your events. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [user, authLoading, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isEventActive = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return now >= startDate && now <= endDate;
  };

  const isEventUpcoming = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    return now < startDate;
  };

  const isEventCompleted = (event: Event) => {
    const now = new Date();
    const endDate = new Date(event.end_date);
    return now > endDate;
  };

  const getEventProgress = (eventId: string) => {
    if (!progress[eventId]) return null;
    
    // Calculate total distance and time
    return progress[eventId].reduce(
      (acc, p) => {
        return {
          totalDistance: acc.totalDistance + (p.distance || 0),
          totalTime: acc.totalTime + (p.time || 0),
        };
      },
      { totalDistance: 0, totalTime: 0 }
    );
  };

  const getProgressPercentage = (event: Event) => {
    const eventProgress = getEventProgress(event._id);
    if (!eventProgress) return 0;
    
    if (event.target_distance && eventProgress.totalDistance) {
      return Math.min(
        Math.round((eventProgress.totalDistance / event.target_distance) * 100),
        100
      );
    }
    
    if (event.target_time && eventProgress.totalTime) {
      return Math.min(
        Math.round((eventProgress.totalTime / event.target_time) * 100),
        100
      );
    }
    
    return 0;
  };

  const filteredEvents = events.filter((event) => {
    if (activeTab === "active") return isEventActive(event);
    if (activeTab === "upcoming") return isEventUpcoming(event);
    if (activeTab === "completed") return isEventCompleted(event);
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading your events...</div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">My Events</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">No events found</h2>
          <p className="text-muted-foreground mb-6">
            You haven't registered for any {activeTab} events yet.
          </p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="line-clamp-3 mb-4">{event.description}</p>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Start:</strong> {formatDate(event.start_date)}
                  </p>
                  <p>
                    <strong>End:</strong> {formatDate(event.end_date)}
                  </p>
                  {event.target_distance && (
                    <p>
                      <strong>Target Distance:</strong> {event.target_distance} km
                    </p>
                  )}
                  {event.target_time && (
                    <p>
                      <strong>Target Time:</strong> {event.target_time} minutes
                    </p>
                  )}
                </div>

                {isEventActive(event) && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-medium">
                        {getProgressPercentage(event)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${getProgressPercentage(event)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {isEventActive(event) ? (
                  <Link href={`/events/${event._id}/progress`} className="w-full">
                    <Button className="w-full">Update Progress</Button>
                  </Link>
                ) : (
                  <Link href={`/events/${event._id}`} className="w-full">
                    <Button className="w-full" variant={isEventCompleted(event) ? "outline" : "default"}>
                      View Details
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 