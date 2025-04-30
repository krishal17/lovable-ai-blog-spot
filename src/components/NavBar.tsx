
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NavBar: React.FC = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blog-purple">Lovable AI BlogSpot</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pr-10"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
            
            <nav className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-blog-purple">Home</Link>
              <Link to="/categories" className="text-gray-600 hover:text-blog-purple">Categories</Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-600 hover:text-blog-purple">Dashboard</Link>
              )}
              {currentUser ? (
                <Button onClick={handleLogout} variant="outline">Logout</Button>
              ) : (
                <Link to="/login">
                  <Button variant="outline">Admin Login</Button>
                </Link>
              )}
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={toggleMenu} className="md:hidden">
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 py-3 animate-fade-in">
            <form onSubmit={handleSearch} className="relative mb-4">
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-blog-purple py-2 border-b border-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/categories" 
                className="text-gray-600 hover:text-blog-purple py-2 border-b border-gray-100"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-gray-600 hover:text-blog-purple py-2 border-b border-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {currentUser ? (
                <Button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }} 
                  variant="outline"
                  className="w-full"
                >
                  Logout
                </Button>
              ) : (
                <Link 
                  to="/login" 
                  className="w-full" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">Admin Login</Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
