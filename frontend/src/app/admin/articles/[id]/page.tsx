"use client";

import { useState, useEffect, useRef } from "react";
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
import { Spinner } from "@/components/ui/spinner";

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  content: string;
  author: string;
  author_name?: string;
  created_at: string;
  updated_at?: string;
}

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<EditorRefHandle>(null);
  const [articleData, setArticleData] = useState<Partial<Article>>({
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

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get<Article>(`/articles/${params.id}`);
        setArticleData(response.data);
      } catch (error) {
        console.error("Error fetching article:", error);
        toast({
          title: "Error",
          description: "Failed to load article. Please try again later.",
          variant: "destructive",
        });
        router.push("/admin/articles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [params.id, router, toast]);

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

    if (!updatedArticleData.title?.trim()) {
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

    if (!updatedArticleData.content?.trim()) {
      toast({
        title: "Error",
        description: "Article content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/articles/${params.id}`, updatedArticleData);
      toast({
        title: "Success",
        description: "Article updated successfully",
      });
      router.push("/admin/articles");
    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Error",
        description: "Failed to update article. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

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
          <CardTitle>Edit Article</CardTitle>
          <CardDescription>
            Update your article content and details.
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
                value={articleData.subtitle || ""}
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
                content={articleData.content || ""}
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
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 