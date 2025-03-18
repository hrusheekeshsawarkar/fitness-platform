"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
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

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/events/");
        console.log("API Response:", response.data); // Debug log
        
        // Check if response.data is an array
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Get the most recent 3 events
          const sortedEvents = response.data.sort((a: Event, b: Event) => 
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          ).slice(0, 3);
          setFeaturedEvents(sortedEvents);
        } else {
          console.log("No events found or invalid response format");
          setFeaturedEvents([]);
        }
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="container py-10">
      {/* Welcome Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Welcome to Fitness Platform</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Join fitness events, compete with others, and track your progress to
          achieve your fitness goals.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/events">
            <Button size="lg">Browse Events</Button>
          </Link>
          <Link href="/my-events">
            <Button size="lg" variant="outline">
              My Events
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Find Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Browse through various fitness events like running, cycling,
                walking, and more.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Register</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Sign up for events that match your interests and fitness goals.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Compete</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Track your progress, update your achievements, and compete on the
                leaderboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Events Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8">Featured Events</h2>
        {loading ? (
          <div className="text-center">Loading events...</div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <Card key={event._id}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                  <Link href={`/events/${event._id}`}>
                    <Button>View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p>No events available at the moment. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
}
