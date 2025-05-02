
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBlogPosts, BlogPost, deleteBlogPost } from '@/lib/firestore';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminDashboard: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const blogPosts = await getAllBlogPosts();
      setBlogs(blogPosts);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load blog posts. Please try again."
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Refresh blogs list
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };

  // Delete blog
  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      await deleteBlogPost(blogToDelete);
      
      // Remove from local state to update UI immediately
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== blogToDelete));
      
      toast({
        title: "Blog deleted",
        description: "The blog post has been deleted successfully.",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
      });
      
      // Refresh the list after deletion to ensure sync with server
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the blog post. Please try again."
      });
    } finally {
      setBlogToDelete(null);
    }
  };

  return (
    <div className="blog-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Blog Post
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ) : (
        <>
          {blogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Title</TableHead>
                    <TableHead className="w-[20%]">Category</TableHead>
                    <TableHead className="w-[20%]">Date</TableHead>
                    <TableHead className="w-[20%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.title}</TableCell>
                      <TableCell>{blog.category}</TableCell>
                      <TableCell>{formatDate(new Date(blog.createdAt))}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link to={`/admin/edit/${blog.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setBlogToDelete(blog.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Link to={`/blog/${blog.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-gray-500 mb-4">No blog posts found.</p>
              <Link to="/admin/create">
                <Button>Create your first blog post</Button>
              </Link>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!blogToDelete} onOpenChange={() => setBlogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog
              post and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBlog} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
