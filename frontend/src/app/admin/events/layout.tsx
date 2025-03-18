import React from "react";

export default function AdminEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Events Management</h2>
        <p className="text-muted-foreground">
          Create, edit, and manage fitness events
        </p>
      </div>
      {children}
    </div>
  );
} 