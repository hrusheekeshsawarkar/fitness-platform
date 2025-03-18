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
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead,
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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

interface ProgressUpdate {
  _id: string;
  user_id: string;
  event_id: string;
  distance: number;
  time: number;
  date?: string;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  name?: string;
  email?: string;
  total_distance: number;
  update_count: number;
  average_pace?: number;
}

export default function EventDetail({ params }: { params: { id: string } }) {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userUpdates, setUserUpdates] = useState<ProgressUpdate[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

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
      setRegistering(true);
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
    } finally {
      setRegistering(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      await api.post(`/events/${id}/progress`, { distance, time, date });
      toast({
        title: "Success",
        description: "Progress updated successfully!",
      });
      
      // Refresh user updates
      const response = await api.get(`/events/${id}/updates`);
      setUserUpdates(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update progress",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchUserUpdates = async () => {
      try {
        const response = await api.get(`/events/${id}/updates`);
        setUserUpdates(response.data);
      } catch (error: any) {
        console.error("Error fetching user updates:", error);
        toast({
          title: "Error",
          description: "Failed to load user updates. Please try again later.",
          variant: "destructive",
        });
      }
    };

    if (id) {
      fetchUserUpdates();
    }
  }, [id]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get(`/events/${id}/leaderboard`);
        setLeaderboard(response.data);
      } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
        toast({
          title: "Error",
          description: "Failed to load leaderboard. Please try again later.",
          variant: "destructive",
        });
      }
    };

    if (id) {
      fetchLeaderboard();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="text-center py-12">
          <Spinner />
          <p className="mt-2">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-8 px-4">
        <div className="text-center py-12">
          <p>Event not found.</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>About This Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2">
                <p>{event.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Event Type:</strong>{" "}
                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                </div>
                <div>
                  <strong>Duration:</strong>{" "}
                  {new Date(event.start_date).toLocaleDateString()} -{" "}
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
                <div>
                  <strong>Participants:</strong> {event.participants?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  {isRegistered() ? (
                    <>
                      <Badge className="mb-2">Registered</Badge>
                      <p className="text-sm text-muted-foreground">
                        You are registered for this event
                      </p>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleRegister} 
                        className="w-full"
                        disabled={loading || registering}
                      >
                        {registering ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Registering...
                          </>
                        ) : (
                          "Register Now"
                        )}
                      </Button>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Join this event to track your progress
                      </p>
                    </>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Event Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Registration</span>
                      <span>Open</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Start Date</span>
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date</span>
                      <span>{new Date(event.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress updates section */}
        {isRegistered() && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Update Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (km)</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.01"
                        value={distance}
                        onChange={(e) => setDistance(parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time (minutes)</Label>
                      <Input
                        id="time"
                        type="number"
                        step="0.01"
                        value={time}
                        onChange={(e) => setTime(parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Progress"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <h3 className="text-xl font-semibold mb-4">Recent Updates</h3>
            {userUpdates.length > 0 ? (
              <div className="space-y-4">
                {userUpdates.map((update) => (
                  <Card key={update._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {update.distance} km in {update.time} minutes
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(update.date || update.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            <span className="font-medium">Pace:</span>{" "}
                            {(update.time / update.distance).toFixed(2)} min/km
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  No progress updates yet. Start tracking your progress!
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Leaderboard section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
          {leaderboard.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Total Distance</TableHead>
                    <TableHead>Updates</TableHead>
                    <TableHead className="text-right">Avg Pace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => (
                    <TableRow key={entry.user_id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{entry.name || entry.email || entry.user_id}</TableCell>
                      <TableCell>{entry.total_distance.toFixed(2)} km</TableCell>
                      <TableCell>{entry.update_count}</TableCell>
                      <TableCell className="text-right">
                        {entry.average_pace ? `${entry.average_pace.toFixed(2)} min/km` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No participants have logged progress yet. Be the first!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 