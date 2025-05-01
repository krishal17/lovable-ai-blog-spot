
import React, { useState, useEffect } from 'react';
import { Comment, addComment, getCommentsByBlogId, deleteComment } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistance } from 'date-fns';
import { MessageSquare, Trash2, User } from 'lucide-react';

interface CommentSectionProps {
  blogId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ blogId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const commentsData = await getCommentsByBlogId(blogId);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load comments."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [blogId, toast]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post a comment",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      const comment = await addComment(blogId, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post your comment. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment. Please try again."
      });
    }
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-semibold flex items-center mb-6">
        <MessageSquare className="mr-2 h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="min-h-24 mb-3"
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center">
          <p className="mb-2">Sign in to join the conversation</p>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.avatarUrl || undefined} />
                <AvatarFallback>
                  <User className="h-5 w-5 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {comment.username || 'Anonymous User'}
                  </h4>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">
                      {formatDistance(new Date(comment.createdAt), new Date(), { addSuffix: true })}
                    </span>
                    
                    {(currentUser && currentUser.id === comment.userId) || isAdmin ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-2 h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
