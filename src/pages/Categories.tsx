
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCategories } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const cats = await getAllCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load categories. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  // Define background colors for categories
  const categoryColors = [
    'bg-blog-mint',
    'bg-blog-lavender',
    'bg-blog-peach',
    'bg-blog-blue',
    'bg-blog-pink',
  ];

  const getCategoryColor = (index: number) => {
    return categoryColors[index % categoryColors.length];
  };

  return (
    <div className="blog-container">
      <h1 className="text-3xl font-bold mb-8 text-center">Blog Categories</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blog-purple" />
        </div>
      ) : (
        <>
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Link 
                  to={`/?category=${encodeURIComponent(category)}`} 
                  key={category}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className={`flex items-center justify-center h-32 ${getCategoryColor(index)} rounded-xl`}>
                      <h3 className="text-xl font-semibold">{category}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No categories found.</p>
              <p className="text-gray-500 mt-2">
                Categories will appear here as blog posts are created.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Categories;
