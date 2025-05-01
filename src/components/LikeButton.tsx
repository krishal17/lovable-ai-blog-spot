
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toggleLike, isPostLiked, getLikesCount } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface LikeButtonProps {
  blogId: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ blogId }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
      });
      return;
    }

    try {
      const isNowLiked = await toggleLike(blogId);
      setLiked(isNowLiked);
      setLikesCount(prev => isNowLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update like status"
      });
    }
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
      >
        <Heart className={`h-5 w-5 mr-1 ${liked ? 'fill-current' : ''}`} />
        <span>{likesCount || 0}</span>
      </Button>
    </div>
  );
};

export default LikeButton;
