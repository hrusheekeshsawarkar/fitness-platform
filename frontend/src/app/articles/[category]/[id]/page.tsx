"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

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

interface CategoryInfo {
  id: string;
  title: string;
}

const categories: Record<string, CategoryInfo> = {
  "food-nutrition": { id: "food-nutrition", title: "Food and Nutrition" },
  "posture-breathing": { id: "posture-breathing", title: "Posture and Breathing" },
  "injuries-gear": { id: "injuries-gear", title: "Injuries and Running Gears" },
  "performance": { id: "performance", title: "Running Performance" },
};

export default function ArticleDetailPage({
  params,
}: {
  params: { category: string; id: string };
}) {
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const categoryTitle = categories[params.category]?.title || "Articles";

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get<Article>(`/articles/${params.id}`);
        setArticle(response.data);
      } catch (error) {
        console.error("Error fetching article:", error);
        toast({
          title: "Error",
          description: "Failed to load article. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [params.id, toast]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center items-center h-64">
          <Spinner />
          <span className="ml-2">Loading article...</span>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for does not exist or may have been removed.
          </p>
          <Link href="/articles">
            <Button>Return to Articles</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link
          href="/articles"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to {categoryTitle}
        </Link>
      </div>

      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          {article.subtitle && (
            <h2 className="text-xl text-muted-foreground mb-4">{article.subtitle}</h2>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <time dateTime={article.created_at}>
              {new Date(article.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="mx-2">•</span>
            <span>By {article.author_name 
              ? article.author_name 
              : article.author && article.author.includes('@') 
                ? article.author.split('@')[0] 
                : article.author || 'Anonymous'}
            </span>
          </div>
        </header>

        <div 
          className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
} 