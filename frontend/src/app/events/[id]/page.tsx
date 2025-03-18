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

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        console.log("API Response:", response.data); // Debug log
        setEvent(response.data);
      } catch (error: any) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Failed to load event details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for events.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    try {
      await api.post(`/events/${id}/register`);
      toast({
        title: "Success",
        description: "You have successfully registered for this event!",
      });
      
      // Refresh event to update the participants list
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to register for event",
        variant: "destructive",
      });
    }
  };

  const handleUnregister = async () => {
    if (!user) {
      return;
    }

    try {
      await api.post(`/events/${id}/unregister`);
      toast({
        title: "Success",
        description: "You have successfully unregistered from this event.",
      });
      
      // Refresh event to update the participants list
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to unregister from event",
        variant: "destructive",
      });
    }
  };

  const isRegistered = () => {
    return user && event && event.participants.includes(user.uid);
  };

  const isPastEvent = () => {
    return event && new Date(event.end_date) < new Date();
  };

  const isActiveEvent = () => {
    if (!event) return false;
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    return now >= startDate && now <= endDate;
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="text-center">Loading event details...</div>
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
      <Link href="/events" className="flex items-center mb-6 text-sm">
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
        Back to Events
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{event.name}</CardTitle>
              <CardDescription className="text-lg">
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isRegistered() && isActiveEvent() && (
                <Link href={`/events/${id}/progress`}>
                  <Button variant="outline">Update Progress</Button>
                </Link>
              )}
              {!isPastEvent() && (
                <div>
                  {isRegistered() ? (
                    <Button variant="destructive" onClick={handleUnregister}>
                      Unregister
                    </Button>
                  ) : (
                    <Button onClick={handleRegister}>Register</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="whitespace-pre-line">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Event Details</h3>
              <div className="space-y-2">
                <p>
                  <strong>Start Date:</strong>{" "}
                  {new Date(event.start_date).toLocaleDateString()} at{" "}
                  {new Date(event.start_date).toLocaleTimeString()}
                </p>
                <p>
                  <strong>End Date:</strong>{" "}
                  {new Date(event.end_date).toLocaleDateString()} at{" "}
                  {new Date(event.end_date).toLocaleTimeString()}
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
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Participants</h3>
              <p>
                <strong>Total Participants:</strong> {event.participants.length}
              </p>
              {isRegistered() && (
                <p className="text-green-600 font-medium mt-2">
                  You are registered for this event!
                </p>
              )}
              {isRegistered() && isPastEvent() && (
                <p className="text-muted-foreground mt-2">
                  This event has ended. Thank you for participating!
                </p>
              )}
              {isRegistered() && isActiveEvent() && (
                <div className="mt-4">
                  <p className="text-primary font-medium mb-2">
                    This event is currently active!
                  </p>
                  <Link href={`/events/${id}/progress`}>
                    <Button size="sm">Log Your Progress</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 