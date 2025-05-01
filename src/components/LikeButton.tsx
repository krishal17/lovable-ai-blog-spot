import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LikeButtonProps {
  postId: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({ postId }) => {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchLikes();
  }, [postId]);

  const fetchLikes = async () => {
    try {
      // Fetch total likes
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('post_id', postId);

      if (likesError) throw likesError;

      setLikes(likesData?.length || 0);

      // Check if current user has liked
      if (currentUser) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', currentUser.id)
          .single();

        if (userLikeError && userLikeError.code !== 'PGRST116') throw userLikeError;
        setIsLiked(!!userLike);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load likes",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to like posts",
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              post_id: postId,
              user_id: currentUser.id,
              user_name: currentUser.user_metadata.full_name || currentUser.email,
              user_avatar: currentUser.user_metadata.avatar_url || '',
            }
          ]);

        if (error) throw error;
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update like",
      });
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Heart className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
    >
      <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
      {likes} {likes === 1 ? 'Like' : 'Likes'}
    </Button>
  );
};

export default LikeButton;
