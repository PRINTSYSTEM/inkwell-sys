import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { userApiService, UpdateUserRequest, USER_ROLES, User } from '@/services/userApiService';
import { authAPI } from '@/services/authService';

export default function UserProfile() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load current user info
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUser = authAPI.getCurrentUser();
        if (!currentUser?.username) {
          navigate('/login');
          return;
        }

        // Get full user details from API
        const userDetails = await userApiService.getUserByUsername(currentUser.username);
        setUser(userDetails);
        setProfileData({
          fullName: userDetails.fullName,
          email: userDetails.email,
          phone: userDetails.phone || '',
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error("Lỗi", {
          description: "Không thể tải thông tin profile",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!profileData.fullName || !profileData.email) {
      toast.error("Lỗi", {
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    try {
      setIsUpdating(true);
      const updateData: UpdateUserRequest = {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
      };

      await userApiService.updateUser(user.id, updateData);
      
      // Update user in local state
      setUser(prev => ({ ...prev, ...updateData }));

      toast.success("Thành công", {
        description: "Đã cập nhật thông tin profile thành công",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Lỗi", {
        description: error instanceof Error ? error.message : "Không thể cập nhật thông tin profile",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Lỗi", {
        description: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Lỗi", {
        description: "Mật khẩu mới không khớp",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Lỗi", {
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
      return;
    }

    try {
      setIsUpdating(true);
      await userApiService.changePassword(user.id, passwordData);
      
      toast.success("Thành công", {
        description: "Đã đổi mật khẩu thành công. Bạn sẽ được đăng xuất để đăng nhập lại.",
      });

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowChangePassword(false);

      // Logout after 2 seconds
      setTimeout(async () => {
        await authAPI.logout();
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("Lỗi", {
        description: error instanceof Error ? error.message : "Không thể đổi mật khẩu",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = USER_ROLES.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'design': return 'secondary';
      case 'production': return 'outline';
      case 'accounting': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải thông tin profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy thông tin người dùng</p>
        <Button onClick={() => navigate('/login')} className="mt-4">
          Đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thông tin cá nhân</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và cập nhật thông tin profile của bạn
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto">
              <AvatarFallback className="text-lg">
                {user.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{user.fullName}</CardTitle>
            <CardDescription>@{user.username}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cập nhật thông tin</CardTitle>
            <CardDescription>
              Thay đổi thông tin cá nhân của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên *</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nhập họ và tên"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Nhập địa chỉ email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  (Liên hệ admin để thay đổi vai trò)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </Button>
              
              <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Đổi mật khẩu</DialogTitle>
                    <DialogDescription>
                      Nhập mật khẩu hiện tại và mật khẩu mới. Bạn sẽ được đăng xuất sau khi đổi thành công.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mật khẩu hiện tại *</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Mật khẩu mới *</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Nhập mật khẩu mới"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Xác nhận mật khẩu mới *</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Nhập lại mật khẩu mới"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowChangePassword(false)}
                      disabled={isUpdating}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleChangePassword} disabled={isUpdating}>
                      {isUpdating ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}