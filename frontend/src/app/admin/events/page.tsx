"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

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
  created_at: string;
}

export default function AdminEventsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!user.customClaims?.admin) {
      router.push("/");
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      return;
    }

    fetchEvents();
  }, [user, router]);

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events/");
      setEvents(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/events/${eventId}`);
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <Link href="/admin/events/create">
          <Button>Create New Event</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {events.map((event) => (
          <Card key={event._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>
                    Type: {event.event_type} | Participants:{" "}
                    {event.participants.length}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/events/${event._id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteEvent(event._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {event.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Start Date:</strong>{" "}
                  {new Date(event.start_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>End Date:</strong>{" "}
                  {new Date(event.end_date).toLocaleDateString()}
                </div>
                {event.target_distance && (
                  <div>
                    <strong>Target Distance:</strong> {event.target_distance} km
                  </div>
                )}
                {event.target_time && (
                  <div>
                    <strong>Target Time:</strong> {event.target_time} minutes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 