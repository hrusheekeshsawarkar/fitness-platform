"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { api, photoApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function UploadPhotoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.customClaims?.admin) {
      toast({
        title: "Unauthorized",
        description: "You don't have permission to upload photos.",
        variant: "destructive",
      });
      return;
    }

    if (!title || !photoFile) {
      toast({
        title: "Missing information",
        description: "Please provide a title and select a photo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      
      // Format date in ISO format
      if (date) {
        // Convert date string to Date object and then to ISO string
        const photoDate = new Date(date);
        formData.append("photo_date", photoDate.toISOString());
      }
      
      formData.append("photo", photoFile);

      await photoApi.uploadPhoto(formData);

      toast({
        title: "Success",
        description: "Photo uploaded successfully!",
      });

      // Redirect to photo gallery
      router.push("/memories");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upload Photo</h1>
        <Button variant="outline" onClick={() => router.push("/memories")}>
          Back to Gallery
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Photo Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="photo_date">Date Photo Was Taken</Label>
                <Input
                  id="photo_date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="photo">Photo *</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    {photoFile ? photoFile.name : "No file selected"}
                  </span>
                </div>
              </div>

              {photoPreview && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-80 max-w-full object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 