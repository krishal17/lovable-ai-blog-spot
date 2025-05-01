
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

  const getFeaturedBlog = () => {
    // Try to find a featured blog, or use the first blog
    return blogs.find(blog => blog.is_featured) || (blogs.length > 0 ? blogs[0] : null);
  };

  return (
    <div className="blog-container">
      <div className="mb-16 text-center">
        <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-blog-purple via-pink-500 to-blog-dark-purple bg-clip-text text-transparent font-heading">
          Babita Writes
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Explore heartfelt stories, insightful perspectives, and creative expressions
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
          {/* Featured Post */}
          {getFeaturedBlog() && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-center">
                <span className="border-b-2 border-blog-purple pb-2">Featured Post</span>
              </h2>
              <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img 
                      src={getFeaturedBlog()?.imageUrl || "/placeholder.svg"} 
                      alt={getFeaturedBlog()?.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <div className="mb-3">
                        <span className="bg-blog-lavender text-blog-purple px-3 py-1 rounded-full text-xs">
                          {getFeaturedBlog()?.category}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-4">{getFeaturedBlog()?.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {getFeaturedBlog()?.excerpt || getFeaturedBlog()?.description}
                      </p>
                    </div>
                    <div className="mt-4">
                      <a 
                        href={`/blog/${getFeaturedBlog()?.id}`}
                        className="inline-block bg-blog-purple text-white px-6 py-2 rounded-full hover:bg-blog-dark-purple transition-colors"
                      >
                        Read More
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <Tabs defaultValue="all" className="mb-12">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.length > 0 ? (
              // Skip the featured blog in the grid if it exists
              filteredBlogs
                .filter(blog => !blog.is_featured || blog.id !== getFeaturedBlog()?.id)
                .map((blog) => (
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
