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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

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
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("start_date");
  const [sortOrder, setSortOrder] = useState<string>("asc");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/events");
        console.log("API Response:", response.data); // Debug log
        
        if (Array.isArray(response.data)) {
          setAllEvents(response.data);
          setFilteredEvents(response.data);
        } else {
          console.log("Response is not an array:", response.data);
          setAllEvents([]);
          setFilteredEvents([]);
        }
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events. Please try again later.",
          variant: "destructive",
        });
        setAllEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search query and event type
    let filtered = allEvents;

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
  }, [searchQuery, eventType, allEvents]);

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
      setAllEvents(sortedEvents);
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
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Fitness Events</h1>
      
      <div className="mb-8 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="eventType">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="cycling">Cycling</SelectItem>
                <SelectItem value="walking">Walking</SelectItem>
                <SelectItem value="swimming">Swimming</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sortBy">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sortBy">
                <SelectValue placeholder="Start Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start_date">Start Date</SelectItem>
                <SelectItem value="end_date">End Date</SelectItem>
                <SelectItem value="target_distance">Target Distance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sortOrder">
                <SelectValue placeholder="Ascending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <Spinner />
          <p className="mt-2">Loading events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-2">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3">{event.description}</p>
                <div className="mt-4 text-sm">
                  <p>
                    <strong>Start:</strong>{" "}
                    {new Date(event.start_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>End:</strong>{" "}
                    {new Date(event.end_date).toLocaleDateString()}
                  </p>
                  {event.target_distance && (
                    <p>
                      <strong>Target Distance:</strong> {event.target_distance} km
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event._id}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p>No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );
} 