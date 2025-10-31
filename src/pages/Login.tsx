import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../hooks/use-auth';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    try {
      const success = await login(user, pass);
      if (success) {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng nhập');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const success = await login(username, password);
      if (success) {
        toast.success('Đăng nhập thành công!');
        navigate('/dashboard');
      } else {
        toast.error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng nhập');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
              PS
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">PrintSys</CardTitle>
          <CardDescription>Hệ thống quản lý in ấn nội bộ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground font-medium mb-3">🔐 Tài khoản demo - Các Role trong hệ thống:</p>
            
            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-red-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-red-700">👑 Admin (Toàn quyền)</p>
                  <p className="text-muted-foreground">admin / admin123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-purple-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-purple-700">💼 Cổ đông (View only)</p>
                  <p className="text-muted-foreground">shareholder1 / shareholder123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('shareholder1', 'shareholder123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-blue-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-blue-700">👥 CSKH - Trưởng phòng Thiết kế</p>
                  <p className="text-muted-foreground">designmanager / designmanager123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('designmanager', 'designmanager123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-cyan-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-cyan-700">📞 CSKH (Chăm sóc khách hàng)</p>
                  <p className="text-muted-foreground">cskh1 / cskh123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('cskh1', 'cskh123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-green-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-green-700">💰 Kế toán (Chỉ thấy tài chính)</p>
                  <p className="text-muted-foreground">accountant1 / account123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('accountant1', 'account123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-yellow-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-yellow-700">🎨 Thiết kế Staff (Không thấy giá)</p>
                  <p className="text-muted-foreground">designer1 / designer123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('designer1', 'designer123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-orange-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-orange-700">📄 Bình bài (Không biết khách hàng)</p>
                  <p className="text-muted-foreground">prepress1 / prepress123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('prepress1', 'prepress123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-indigo-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-indigo-700">🏭 Quản lý sản xuất</p>
                  <p className="text-muted-foreground">manager1 / manager123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('manager1', 'manager123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
              
              <div className="border-l-2 border-gray-500 pl-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-700">⚙️ Vận hành máy in</p>
                  <p className="text-muted-foreground">operator1 / operator123</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleQuickLogin('operator1', 'operator123')}
                  className="text-xs h-6"
                >
                  Demo
                </Button>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
              <strong>💡 Mỗi role thấy dashboard và dữ liệu khác nhau!</strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
