"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor, EditorRefHandle } from "@/components/editor/RichTextEditor";
import { ChevronLeft } from "lucide-react";

export default function CreateArticlePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<EditorRefHandle>(null);
  const [articleData, setArticleData] = useState({
    title: "",
    subtitle: "",
    category: "",
    content: "",
  });

  const categoryOptions = [
    { value: "food-nutrition", label: "Food and Nutrition" },
    { value: "posture-breathing", label: "Posture and Breathing" },
    { value: "injuries-gear", label: "Injuries and Running Gears" },
    { value: "performance", label: "Running Performance" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setArticleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = () => {
    // Intentionally left empty - we don't want to save content on every change
  };

  const handleCategoryChange = (value: string) => {
    setArticleData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Always get the latest content directly from the editor
    const content = editorRef.current?.getContent() || articleData.content || "";
    const updatedArticleData = {
      ...articleData,
      content
    };

    if (!updatedArticleData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!updatedArticleData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (!updatedArticleData.content.trim()) {
      toast({
        title: "Error",
        description: "Article content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/articles", updatedArticleData);
      toast({
        title: "Success",
        description: "Article created successfully",
      });
      router.push("/admin/articles");
    } catch (error) {
      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/articles"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Articles
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
          <CardDescription>
            Write an informative article for your users. Use the rich text editor to format your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={articleData.title}
                onChange={handleInputChange}
                placeholder="Enter article title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Input
                id="subtitle"
                name="subtitle"
                value={articleData.subtitle}
                onChange={handleInputChange}
                placeholder="Enter a short description or subtitle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={articleData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                ref={editorRef}
                content={articleData.content}
                onChange={handleEditorChange}
                placeholder="Write your article here..."
                shouldAutoSave={false}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/admin/articles">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 