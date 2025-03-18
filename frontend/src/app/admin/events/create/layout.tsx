"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AdminCreateEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link href="/admin/events">
          <Button variant="outline" size="sm" className="mr-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Create New Event</h2>
      </div>
      {children}
    </div>
  );
} 