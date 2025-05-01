
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/lib/firestore';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  blog: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <Link to={`/blog/${blog.id}`} className="group block">
      <div className="blog-card h-full flex flex-col overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img 
            src={blog.imageUrl || "/placeholder.svg"} 
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-blog-purple font-medium shadow-sm">
            {blog.category}
          </div>
        </div>
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-blog-purple transition-colors">
            {blog.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
            {blog.excerpt || blog.description}
          </p>
          <div className="flex justify-between items-center mt-auto border-t pt-3 text-sm text-gray-500">
            <span>{formatDate(new Date(blog.createdAt))}</span>
            <span className="text-blog-purple font-medium group-hover:underline">Read more</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
