
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, UserProfile } from '@/lib/firestore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Ban, UserCheck, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabling, setDisabling] = useState<string | null>(null);
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Only allow admin access
    if (!currentUser || !isAdmin) {
      navigate('/');
      return;
    }
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, isAdmin, navigate, toast]);
  
  const disableUser = async (userId: string) => {
    try {
      setDisabling(userId);
      
      // Admin action: This requires admin access
      const { error } = await supabase.functions.invoke('disable-user', {
        body: { user_id: userId }
      });
      
      if (error) throw error;
      
      // Update the UI by refetching users
      const usersData = await getAllUsers();
      setUsers(usersData);
      
      toast({
        title: "User disabled",
        description: "The user has been disabled successfully"
      });
    } catch (error) {
      console.error('Error disabling user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disable user"
      });
    } finally {
      setDisabling(null);
    }
  };

  if (loading) {
    return (
      <div className="blog-container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="blog-container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">User</TableHead>
                    <TableHead className="w-[30%]">Joined</TableHead>
                    <TableHead className="w-[30%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(user.createdAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={disabling === user.id || user.id === currentUser?.id}
                            onClick={() => disableUser(user.id)}
                          >
                            {user.id === currentUser?.id ? (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <Ban className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
