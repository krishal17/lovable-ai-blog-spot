
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/lib/firestore';
import { formatDate, truncateText } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BlogCardProps {
  blog: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <Link to={`/blog/${blog.id}`} className="group block hover-transform">
      <div className="fancy-card h-full flex flex-col overflow-hidden">
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img 
            src={blog.imageUrl || "/placeholder.svg"} 
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Badge className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-blog-purple hover:text-blog-purple font-medium shadow-sm">
            {blog.category}
          </Badge>
        </div>
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-blog-purple transition-colors">
            {truncateText(blog.title, 60)}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
            {blog.excerpt || truncateText(blog.description, 120)}
          </p>
          <div className="flex justify-between items-center mt-auto border-t pt-3 text-sm text-gray-500">
            <span>{formatDate(new Date(blog.createdAt))}</span>
            <span className="text-blog-purple font-medium group-hover:underline flex items-center">
              Read more
              <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
