
import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getAllCategories, getBlogPostsByCategory, BlogPost } from '@/lib/firestore';
import BlogCard from '@/components/BlogCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const { toast } = useToast();
  const location = useLocation();

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load categories. Please try again.",
        });
      }
    };

    fetchCategories();
  }, [toast]);

  // Fetch blog posts by category
  useEffect(() => {
    const fetchPostsByCategory = async () => {
      if (!activeCategory) {
        setBlogPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const posts = await getBlogPostsByCategory(activeCategory);
        console.log(`Fetched ${posts.length} posts for category '${activeCategory}'`);
        setBlogPosts(posts);
      } catch (error) {
        console.error(`Error fetching posts for category '${activeCategory}':`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load blog posts. Please try again.",
        });
        setBlogPosts([]);
      } finally {
        setLoading(false);
      }
    };

    // Update URL search params when activeCategory changes
    if (activeCategory) {
      setSearchParams({ category: activeCategory });
    } else {
      setSearchParams({});
    }

    fetchPostsByCategory();
  }, [activeCategory, setSearchParams, toast]);

  // Set active category from URL on initial load
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category === activeCategory ? null : category);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Blog Categories</h1>
      
      {/* Categories filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => handleCategoryClick(category)}
            variant={category === activeCategory ? "default" : "outline"}
            className="mb-2"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Active category indicator */}
      {activeCategory && (
        <div className="flex justify-center mb-8">
          <Badge className="px-4 py-2 text-lg">
            {activeCategory}
            <button 
              className="ml-2 text-sm hover:text-gray-300"
              onClick={() => setActiveCategory(null)}
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      {/* Blog posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4 bg-gray-100 rounded-b-lg">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeCategory ? (
            <>
              {blogPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogPosts.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600 mb-4">
                    No blog posts found in the "{activeCategory}" category.
                  </p>
                  <Button onClick={() => setActiveCategory(null)}>
                    View all categories
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">
                Select a category to view related blog posts.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Categories;
