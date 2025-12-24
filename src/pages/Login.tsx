import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogin = async (loginCredentials: {
    username: string;
    password: string;
  }) => {
    if (!loginCredentials.username || !loginCredentials.password) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    try {
      const success = await login(loginCredentials);

      if (success) {
        toast.success(`Đăng nhập thành công!`);
        navigate("/dashboard");
      } else {
        toast.error("Tên đăng nhập hoặc mật khẩu không đúng");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error("Có lỗi xảy ra khi đăng nhập");
    }
  };

  const handleQuickLogin = async (username: string, password: string) => {
    const quickCredentials = { username, password };
    setCredentials(quickCredentials);
    await handleLogin(quickCredentials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo.png"
              alt="QUANG DAT DESIGN - PRINTING"
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Quang Đạt</CardTitle>
          <CardDescription>Hệ thống quản lý in ấn nội bộ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={credentials.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vui lòng đăng nhập bằng tài khoản được cung cấp bởi quản trị viên
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
