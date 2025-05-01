
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toggleLike, isPostLiked, getLikesCount } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  blogId: string;
  size?: 'sm' | 'md' | 'lg';
}

const LikeButton: React.FC<LikeButtonProps> = ({ blogId, size = 'md' }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        setLoading(true);
        const [isLiked, count] = await Promise.all([
          currentUser ? isPostLiked(blogId) : Promise.resolve(false),
          getLikesCount(blogId)
        ]);
        
        setLiked(isLiked);
        setLikesCount(count);
      } catch (error) {
        console.error('Error fetching like data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeData();
  }, [blogId, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like this post",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
            Sign in
          </Button>
        )
      });
      return;
    }

    try {
      // Optimistic UI update
      const wasLiked = liked;
      setLiked(!wasLiked);
      setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
      setAnimating(true);
      
      // Actual API call
      const isNowLiked = await toggleLike(blogId);
      
      // If the server response differs from our optimistic update, correct it
      if (isNowLiked !== !wasLiked) {
        setLiked(isNowLiked);
        setLikesCount(isNowLiked ? likesCount + 1 : likesCount - 1);
      }
      
      setTimeout(() => setAnimating(false), 300);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert to original state on error
      setLiked(liked);
      setLikesCount(likesCount);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update like status"
      });
      setAnimating(false);
    }
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };
  
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size={size === 'lg' ? 'default' : 'sm'}
        onClick={handleLike}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 transition-all duration-200",
          liked ? "text-red-500" : "text-gray-500 hover:text-red-500",
          sizeClasses[size]
        )}
      >
        <Heart 
          className={cn(
            iconSizes[size], 
            liked ? "fill-current" : "", 
            animating ? "scale-125 transition-transform" : "transition-transform"
          )} 
        />
        <span className={cn(
          "font-medium transition-all", 
          animating ? "scale-110" : ""
        )}>
          {likesCount || 0}
        </span>
      </Button>
    </div>
  );
};

export default LikeButton;
