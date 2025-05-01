
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, updateUserProfile, getUserProfile } from '@/lib/firestore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Upload, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const { currentUser, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await getUserProfile(currentUser.id);
        setProfile(userProfile);
        setUsername(userProfile.username || '');
        
        // Check for OAuth avatar first, then profile avatar
        const oauthAvatar = session?.user?.user_metadata?.avatar_url;
        setAvatarUrl(userProfile.avatarUrl || oauthAvatar || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, navigate, toast, session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !currentUser) return null;
    
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('profile_images')
        .upload(fileName, avatarFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase
        .storage
        .from('profile_images')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setUpdating(true);
      
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }
      
      // Update profile
      const updatedProfile = await updateUserProfile(currentUser.id, {
        username,
        avatarUrl: newAvatarUrl
      });
      
      setProfile(updatedProfile);
      setUsername(updatedProfile.username || '');
      setAvatarUrl(updatedProfile.avatarUrl);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
      
      // Clear the file input
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again."
      });
    } finally {
      setUpdating(false);
    }
  };

  // Determine if user signed in via OAuth
  const isOAuthUser = !!session?.user?.app_metadata?.provider && 
                      session.user.app_metadata.provider !== 'email';

  if (loading) {
    return (
      <div className="blog-container py-12">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-slate-200"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container py-12">
      <div className="max-w-md mx-auto">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blog-lavender to-blog-purple text-white rounded-t-xl">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 ring-4 ring-white">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-gray-100">
                  <User className="h-12 w-12 text-gray-400" />
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl font-heading">Your Profile</CardTitle>
            {isOAuthUser && (
              <p className="text-white/80 text-sm">
                Signed in with {session.user.app_metadata.provider}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('avatar')?.click()}
                    className="flex items-center h-10"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-500">
                    {avatarFile ? avatarFile.name : 'No file chosen'}
                  </span>
                </div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, 500x500 pixels or larger
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  This is how you'll appear to other users
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blog-purple hover:bg-blog-dark-purple" 
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
