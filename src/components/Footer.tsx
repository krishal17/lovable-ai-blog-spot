
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blog-purple">Lovable AI Blogspot</h2>
          </div>
          
          <div className="flex space-x-4 mb-8">
            <a href="#" className="text-gray-500 hover:text-blog-purple transition-colors">
              <Facebook size={24} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blog-purple transition-colors">
              <Twitter size={24} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blog-purple transition-colors">
              <Instagram size={24} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blog-purple transition-colors">
              <Linkedin size={24} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blog-purple transition-colors">
              <Youtube size={24} />
            </a>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-8 mb-8 text-center md:text-left">
            <Link to="/" className="text-gray-500 hover:text-blog-purple mb-2 md:mb-0">Home</Link>
            <Link to="/categories" className="text-gray-500 hover:text-blog-purple mb-2 md:mb-0">Categories</Link>
            <Link to="/login" className="text-gray-500 hover:text-blog-purple mb-2 md:mb-0">Admin</Link>
          </div>
          
          <div className="text-center">
            <p className="mb-4 text-gray-600">Lovable AI Blogspot © 2025</p>
            <p className="text-gray-500">Built with ❤️ by Krishal Karna</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
