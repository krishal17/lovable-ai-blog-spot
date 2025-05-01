import React, { useState, useEffect } from 'react';
import BlogCard from '@/components/BlogCard';
import { getAllBlogPosts, BlogPost, getAllCategories } from '@/lib/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const { toast } = useToast();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-white dark:from-purple-900 dark:via-pink-900 dark:to-gray-900" />
        <div className="relative container mx-auto px-4">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h1
              variants={item}
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Welcome to Babita's Blog
            </motion.h1>
            <motion.p
              variants={item}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Discover stories, thoughts, and ideas from a passionate writer and movie critic
            </motion.p>
            <motion.div variants={item}>
              <Link to="/categories">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Explore Posts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Featured Posts
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Add your featured posts here */}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Categories
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Add your categories here */}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
