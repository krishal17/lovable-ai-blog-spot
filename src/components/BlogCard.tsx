
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/lib/firestore';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  blog: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <Link to={`/blog/${blog.id}`} className="block">
      <div className="blog-card h-full flex flex-col">
        <div className="relative h-48 sm:h-56">
          <img 
            src={blog.imageUrl || "/placeholder.svg"} 
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-blog-purple">
            {blog.category}
          </div>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{blog.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">{blog.description}</p>
          <p className="text-gray-500 text-xs mt-auto">{formatDate(blog.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
