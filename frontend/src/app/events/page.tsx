"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/events");
        console.log("API Response:", response.data); // Debug log
        
        if (Array.isArray(response.data)) {
          setEvents(response.data);
          setFilteredEvents(response.data);
        } else {
          console.log("Response is not an array:", response.data);
          setEvents([]);
          setFilteredEvents([]);
        }
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events. Please try again later.",
          variant: "destructive",
        });
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search query and event type
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (eventType !== "all") {
      filtered = filtered.filter((event) => event.event_type === eventType);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, eventType, events]);

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for events.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post(`/events/${eventId}/register`);
      toast({
        title: "Success",
        description: "You have successfully registered for this event!",
      });
      
      // Refresh events to update the participants list
      const response = await api.get("/events/");
      const sortedEvents = response.data.sort(
        (a: Event, b: Event) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      setEvents(sortedEvents);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to register for event",
        variant: "destructive",
      });
    }
  };

  const isRegistered = (event: Event) => {
    return user && event.participants.includes(user.uid);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Browse and register for fitness events
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="cycling">Cycling</SelectItem>
              <SelectItem value="swimming">Swimming</SelectItem>
              <SelectItem value="triathlon">Triathlon</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">No events found</h2>
          <p className="text-muted-foreground mb-6">
            There are no events matching your criteria at the moment.
          </p>
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
                <div className="text-sm text-muted-foreground">
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
                  <p>
                    <strong>Participants:</strong> {event.participants.length}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event._id}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
                {isRegistered(event) ? (
                  <Button disabled variant="secondary" className="ml-2">
                    Registered
                  </Button>
                ) : (
                  <Button onClick={() => handleRegister(event._id)} className="ml-2">
                    Register
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 