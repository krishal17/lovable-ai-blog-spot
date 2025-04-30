
import React, { useState, useEffect } from 'react';
import BlogCard from '@/components/BlogCard';
import { getAllBlogPosts, BlogPost, getAllCategories } from '@/lib/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const blogPosts = await getAllBlogPosts();
        setBlogs(blogPosts);
        setFilteredBlogs(blogPosts);
        
        // Get all categories
        const cats = await getAllCategories();
        setCategories(['all', ...cats]);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load blog posts. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [toast]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'all') {
      setFilteredBlogs(blogs);
    } else {
      setFilteredBlogs(blogs.filter(blog => blog.category === category));
    }
  };

  return (
    <div className="blog-container">
      <div className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blog-purple to-blog-dark-purple bg-clip-text text-transparent">
          Lovable AI Blogspot
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore the latest insights and stories from the world of AI and technology
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 rounded-full bg-blog-lavender"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-blog-lavender rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-blog-lavender rounded"></div>
                <div className="h-4 bg-blog-lavender rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {categories.length > 0 && (
            <Tabs defaultValue="all" className="mb-8">
              <div className="flex justify-center">
                <TabsList className="overflow-x-auto max-w-full flex-wrap">
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      onClick={() => handleCategoryChange(category)}
                      className="capitalize"
                    >
                      {category === 'all' ? 'All Posts' : category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.length > 0 ? (
              filteredBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No blog posts found in this category.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
