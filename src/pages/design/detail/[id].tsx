import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Badge, 
  Button, 
  Separator,
  Avatar,
  AvatarFallback,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label
} from '@/components/ui/index';
import { 
  ArrowLeft,
  Download,
  Upload,
  Eye,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Camera,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Design, DesignProgressImage, DesignComment } from '@/types';
import { designService, users } from '@/lib/mockData';
import { statusConfig, priorityConfig } from '@/lib/mockData';

export default function DesignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchDesign = async () => {
      if (!id) {
        navigate('/design/all');
        return;
      }

      try {
        setLoading(true);
        const data = await designService.getById(id);
        if (!data) {
          throw new Error('Design not found');
        }
        setDesign(data);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin thiết kế",
          variant: "destructive",
        });
        navigate('/design/all');
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [id, navigate, toast]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.fullName || 'Không xác định';
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingImageFile(file);
    setImageDescription('');
    setShowImageDialog(true);
  };

  const confirmImageUpload = async () => {
    if (!pendingImageFile || !design) return;

    try {
      setUploadingImage(true);
      const imageUrl = URL.createObjectURL(pendingImageFile);
      await designService.uploadProgressImage(design.id, {
        imageUrl,
        description: imageDescription || `Hình tiến độ ${new Date().toLocaleString()}`,
        status: 'in_progress',
        uploadedBy: 'current-user',
        uploadedAt: new Date().toISOString(),
        isVisibleToCustomer: false,
      });
      
      // Refresh design data
      const updatedDesign = await designService.getById(design.id);
      if (updatedDesign) {
        setDesign(updatedDesign);
      }

      toast({
        title: "Thành công",
        description: "Đã tải lên hình tiến độ",
      });

      setShowImageDialog(false);
      setPendingImageFile(null);
      setImageDescription('');
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lên hình",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDesignFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !design) return;

    try {
      setUploadingFile(true);
      const fileUrl = URL.createObjectURL(file);
      
      // Update design with new file
      const updatedDesign = { 
        ...design, 
        designFile: {
          url: fileUrl,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'current-user'
        }
      };
      
      setDesign(updatedDesign);

      toast({
        title: "Thành công",
        description: "Đã tải lên file bảng thiết kế",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lên file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!design) return;

    try {
      setUpdatingStatus(true);
      // TODO: Call API to update status
      const updatedDesign = { ...design, status: newStatus as Design['status'] };
      setDesign(updatedDesign);

      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái thiết kế",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadFile = () => {
    if (design?.designFile) {
      const link = document.createElement('a');
      link.href = design.designFile.url;
      link.download = design.designFile.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải thông tin thiết kế...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy thiết kế</p>
        <Button onClick={() => navigate('/design/all')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const status = statusConfig[design.status];
  const priority = priorityConfig[design.priority];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/design/all')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{design.designName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{design.designCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${status.color} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            <Select value={design.status} onValueChange={handleStatusUpdate} disabled={updatingStatus}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Khách hàng</label>
                  <p className="font-medium">{design.customerName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Số đơn hàng</label>
                  <p className="font-mono">{design.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Loại thiết kế</label>
                  <Badge variant="outline" className="font-mono">{design.designType}</Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Độ ưu tiên</label>
                  <Badge className={priority.color}>{priority.label}</Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Kích thước</label>
                  <p className="font-mono">{design.dimensions}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Số lượng</label>
                  <p>{design.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Thiết kế viên</label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getUserName(design.assignedTo).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{getUserName(design.assignedTo)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Hạn hoàn thành</label>
                  <p className={design.dueDate && new Date(design.dueDate) < new Date() ? 'text-red-600' : ''}>
                    {design.dueDate ? formatDateTime(design.dueDate) : 'Chưa đặt'}
                  </p>
                </div>
              </div>
              
              {design.notes && (
                <div>
                  <label className="text-sm text-muted-foreground">Ghi chú</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{design.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Design Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File bảng thiết kế
                </span>
                <div>
                  <input
                    type="file"
                    id="design-file-upload"
                    accept=".ai,.psd,.pdf,.png,.jpg,.jpeg"
                    onChange={handleDesignFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('design-file-upload')?.click()}
                    disabled={uploadingFile}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingFile ? 'Đang tải...' : 'Tải lên'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {design.designFile ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{design.designFile.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        Tải lên {formatDateTime(design.designFile.uploadedAt)} bởi {getUserName(design.designFile.uploadedBy)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadFile}>
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có file bảng thiết kế</p>
                  <p className="text-sm">Tải lên file AI, PSD, PDF hoặc hình ảnh</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hình tiến độ ({design.progressImages.length})
                </span>
                <div>
                  <input
                    type="file"
                    id="progress-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('progress-image-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploadingImage ? 'Đang tải...' : 'Thêm hình'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {design.progressImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {design.progressImages
                    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .map((image) => (
                    <div key={image.id} className="space-y-2">
                      <div 
                        className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(image.imageUrl)}
                      >
                        <img 
                          src={image.imageUrl} 
                          alt={image.description}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <p className="font-medium truncate">{image.description}</p>
                        <p className="text-muted-foreground">
                          {formatDateTime(image.uploadedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có hình tiến độ</p>
                  <p className="text-sm">Thêm hình để theo dõi tiến độ thiết kế</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Thiết kế được tạo</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(design.createdAt)}</p>
                  </div>
                </div>
                
                {design.progressImages.map((image, index) => (
                  <div key={image.id} className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Cập nhật hình tiến độ</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(image.uploadedAt)}</p>
                      <p className="text-xs text-muted-foreground">{image.description}</p>
                    </div>
                  </div>
                ))}

                {design.designFile && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Tải lên file thiết kế</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(design.designFile.uploadedAt)}</p>
                      <p className="text-xs text-muted-foreground">{design.designFile.fileName}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm hình tiến độ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-description">Tên/Mô tả hình ảnh</Label>
              <Input
                id="image-description"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="VD: Bản phác thảo ban đầu, hoàn thiện 80%, sẵn sàng review..."
                className="mt-1"
              />
            </div>
            {pendingImageFile && (
              <div className="text-sm text-muted-foreground">
                File: {pendingImageFile.name}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImageDialog(false);
                  setPendingImageFile(null);
                  setImageDescription('');
                }}
                disabled={uploadingImage}
              >
                Hủy
              </Button>
              <Button 
                onClick={confirmImageUpload}
                disabled={uploadingImage}
              >
                <Save className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Đang tải...' : 'Tải lên'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Xem hình tiến độ</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="max-h-[80vh] overflow-auto">
              <img 
                src={selectedImage} 
                alt="Progress" 
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}