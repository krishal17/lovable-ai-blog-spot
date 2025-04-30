
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllBlogPosts, BlogPost } from '@/lib/firestore';
import BlogCard from '@/components/BlogCard';
import { useToast } from '@/hooks/use-toast';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  
  const { toast } = useToast();

  // Fetch all blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const allBlogs = await getAllBlogPosts();
        setBlogs(allBlogs);
        
        // Filter blogs based on search query
        if (query) {
          filterBlogs(allBlogs, query);
        } else {
          setFilteredBlogs([]);
        }
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
  }, [query, toast]);

  // Filter blogs based on search term
  const filterBlogs = (blogsToFilter: BlogPost[], term: string) => {
    const lowerTerm = term.toLowerCase();
    const filtered = blogsToFilter.filter(blog => 
      blog.title.toLowerCase().includes(lowerTerm) || 
      blog.description.toLowerCase().includes(lowerTerm) ||
      blog.category.toLowerCase().includes(lowerTerm)
    );
    setFilteredBlogs(filtered);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  return (
    <div className="blog-container">
      <h1 className="text-3xl font-bold mb-8 text-center">Search Results</h1>
      
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by title, content, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit">
            <SearchIcon className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
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
          {query ? (
            <>
              {filteredBlogs.length > 0 ? (
                <>
                  <p className="text-center mb-8 text-gray-600">
                    Found {filteredBlogs.length} result{filteredBlogs.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-2">No results found for "{query}"</p>
                  <p className="text-gray-500">Try different keywords or check out our categories</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">Enter a search term to find blog posts</p>
              <p className="text-gray-500">Search by title, content, or category</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
