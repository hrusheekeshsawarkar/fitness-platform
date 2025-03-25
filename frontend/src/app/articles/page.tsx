"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings } from "lucide-react";

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

interface ArticleCategory {
  id: string;
  title: string;
  description: string;
  articles: Article[];
}

export default function ArticlesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("food-nutrition");
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<Record<string, ArticleCategory>>({
    "food-nutrition": {
      id: "food-nutrition",
      title: "Food and Nutrition",
      description: "Explore articles about proper nutrition for runners and fitness enthusiasts",
      articles: [],
    },
    "posture-breathing": {
      id: "posture-breathing",
      title: "Posture and Breathing",
      description: "Articles about proper form, posture, and breathing techniques",
      articles: [],
    },
    "injuries-gear": {
      id: "injuries-gear",
      title: "Injuries and Running Gears",
      description: "Prevention and treatment of common injuries, plus gear recommendations",
      articles: [],
    },
    "performance": {
      id: "performance",
      title: "Running Performance",
      description: "Tips and strategies to improve your running speed and endurance",
      articles: [],
    },
  });

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get("/articles");
        const articles: Article[] = response.data;
        
        // Group articles by category
        const groupedArticles = { ...categoryData };
        
        // Clear existing articles first
        Object.keys(groupedArticles).forEach(category => {
          groupedArticles[category].articles = [];
        });
        
        // Then add each article to its category
        articles.forEach(article => {
          if (groupedArticles[article.category]) {
            groupedArticles[article.category].articles.push(article);
          }
        });
        
        setCategoryData(groupedArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
        toast({
          title: "Error",
          description: "Failed to load articles. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [toast]);

  const articleCategories = Object.values(categoryData);
  
  return (
    <div className="py-8 container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center">Articles</h1>
        
        {user?.customClaims?.admin && (
          <div className="flex gap-2">
            <Link href="/admin/articles/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Article
              </Button>
            </Link>
            <Link href="/admin/articles">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Manage Articles
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
          <span className="ml-2">Loading articles...</span>
        </div>
      ) : (
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
            {articleCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {articleCategories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">{category.title}</h2>
                <p className="text-muted-foreground mb-6">{category.description}</p>
                
                {category.articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.articles.map((article) => (
                      <Card key={article.id} className="h-full flex flex-col">
                        <CardHeader>
                          <CardTitle>{article.title}</CardTitle>
                          <CardDescription>
                            {new Date(article.created_at).toLocaleDateString()}
                            {article.subtitle && <p className="mt-1">{article.subtitle}</p>}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div 
                            className="line-clamp-3"
                            dangerouslySetInnerHTML={{ 
                              __html: article.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                            }} 
                          />
                        </CardContent>
                        <CardFooter>
                          <Link href={`/articles/${category.id}/${article.id}`} className="w-full">
                            <button className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                              Read Article
                            </button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <p className="mb-4">No articles available in this category yet.</p>
                    {user?.customClaims?.admin && (
                      <Link href={`/admin/articles/create`}>
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create First Article in {category.title}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
