import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  User,
  Briefcase,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

import {
  Assignment,
  AssignmentTemplate,
  WorkloadBalance,
  AssignmentSuggestion,
  AssignmentFilter,
  AssignmentMetrics,
  TeamWorkload,
  AssignmentFormData,
  EmployeeAvailability
} from '@/types/assignment';
import { AssignmentManagementService } from '@/services/assignmentService';


// Assignment Card Component
const AssignmentCard: React.FC<{
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onAssign: (assignment: Assignment) => void;
  onViewDetails: (assignment: Assignment) => void;
  isDragging?: boolean;
}> = ({ assignment, onEdit, onAssign, onViewDetails, isDragging = false }) => {
  const getPriorityColor = () => {
    switch (assignment.priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = () => {
    switch (assignment.status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-purple-600 bg-purple-50';
      case 'assigned': return 'text-orange-600 bg-orange-50';
      case 'unassigned': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = () => {
    switch (assignment.type) {
      case 'design': return <Briefcase className="h-3 w-3" />;
      case 'review': return <Eye className="h-3 w-3" />;
      case 'production': return <Settings className="h-3 w-3" />;
      case 'quality_check': return <CheckCircle className="h-3 w-3" />;
      case 'maintenance': return <Settings className="h-3 w-3" />;
      default: return <Briefcase className="h-3 w-3" />;
    }
  };

  const isOverdue = new Date(assignment.deadline) < new Date() && assignment.status !== 'completed';
  const daysUntilDeadline = Math.ceil((new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={`hover:shadow-md transition-all cursor-pointer ${isDragging ? 'opacity-50' : ''} ${isOverdue ? 'border-red-300' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              {getTypeIcon()}
              <CardTitle className="text-sm line-clamp-2">{assignment.title}</CardTitle>
            </div>
            <CardDescription className="text-xs line-clamp-1">
              {assignment.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(assignment)}>
                <Eye className="h-4 w-4 mr-2" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(assignment)}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              {!assignment.assignedTo && (
                <DropdownMenuItem onClick={() => onAssign(assignment)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Phân công
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`text-xs ${getPriorityColor()}`}>
            {assignment.priority}
          </Badge>
          <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
            {assignment.status}
          </Badge>
        </div>

        {assignment.assignedTo && (
          <div className="flex items-center space-x-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Nhân viên {assignment.assignedTo.slice(-3)}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiến độ:</span>
            <span className="font-medium">{Math.round(assignment.progress)}%</span>
          </div>
          <Progress value={assignment.progress} className="h-1" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {assignment.estimatedHours}h
            </span>
          </div>
          <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
            <Calendar className="h-3 w-3" />
            <span>
              {isOverdue ? 'Trễ hạn' : daysUntilDeadline > 0 ? `${daysUntilDeadline} ngày` : 'Hôm nay'}
            </span>
          </div>
        </div>

        {assignment.clientName && (
          <div className="text-xs text-muted-foreground">
            <strong>Khách hàng:</strong> {assignment.clientName}
          </div>
        )}

        {assignment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {assignment.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {assignment.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{assignment.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Workload Balance Card Component
const WorkloadCard: React.FC<{ workload: WorkloadBalance }> = ({ workload }) => {
  const getUtilizationColor = () => {
    if (workload.utilizationRate > 0.9) return 'text-red-600';
    if (workload.utilizationRate > 0.7) return 'text-orange-600';
    return 'text-green-600';
  };

  const getPerformanceIcon = () => {
    if (workload.performance.averageRating >= 4) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (workload.performance.averageRating >= 3) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    return <TrendingDown className="h-4 w-4 text-orange-600" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm">{workload.employeeName}</CardTitle>
          </div>
          {getPerformanceIcon()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Workload:</span>
            <span className={`font-medium ${getUtilizationColor()}`}>
              {Math.round(workload.utilizationRate * 100)}%
            </span>
          </div>
          <Progress value={workload.utilizationRate * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(workload.currentLoad)}h</span>
            <span>{workload.capacity}h</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Hoàn thành</p>
            <p className="font-medium">{Math.round(workload.performance.completionRate * 100)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Đúng hạn</p>
            <p className="font-medium">{Math.round(workload.performance.onTimeRate * 100)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Đánh giá</p>
            <p className="font-medium">{workload.performance.averageRating.toFixed(1)}/5.0</p>
          </div>
          <div>
            <p className="text-muted-foreground">Assignments</p>
            <p className="font-medium">{workload.assignments.length}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">Kỹ năng chính:</p>
          <div className="flex flex-wrap gap-1">
            {workload.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Assignment Form Dialog
const AssignmentFormDialog: React.FC<{
  assignment?: Assignment;
  templates: AssignmentTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssignmentFormData) => void;
}> = ({ assignment, templates, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    type: 'design',
    priority: 'medium',
    estimatedHours: 8,
    deadline: '',
    requirements: [],
    skills: [],
    materials: [],
    tags: [],
    complexity: 'medium'
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description,
        type: assignment.type,
        priority: assignment.priority,
        assignedTo: assignment.assignedTo,
        estimatedHours: assignment.estimatedHours,
        deadline: assignment.deadline.split('T')[0],
        requirements: assignment.requirements,
        skills: assignment.skills,
        materials: assignment.materials,
        tags: assignment.tags,
        complexity: assignment.complexity,
        collaborators: assignment.collaborators,
        dependencies: assignment.dependencies,
        designId: assignment.designId,
        clientId: assignment.clientId
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'design',
        priority: 'medium',
        estimatedHours: 8,
        deadline: '',
        requirements: [],
        skills: [],
        materials: [],
        tags: [],
        complexity: 'medium'
      });
    }
  }, [assignment, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Chỉnh sửa Assignment' : 'Tạo Assignment mới'}
          </DialogTitle>
          <DialogDescription>
            {assignment ? 'Cập nhật thông tin assignment' : 'Tạo assignment mới cho nhân viên'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề assignment"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Loại công việc</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Assignment['type'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Thiết kế</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="production">Sản xuất</SelectItem>
                  <SelectItem value="quality_check">Kiểm tra chất lượng</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết assignment"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Assignment['priority'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="complexity">Độ phức tạp</Label>
              <Select value={formData.complexity} onValueChange={(value) => setFormData({ ...formData, complexity: value as Assignment['complexity'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Đơn giản</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="complex">Phức tạp</SelectItem>
                  <SelectItem value="expert">Chuyên gia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedHours">Ước tính (giờ)</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                min="0.5"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
            />
          </div>

          <Tabs defaultValue="requirements" className="w-full">
            <TabsList>
              <TabsTrigger value="requirements">Yêu cầu</TabsTrigger>
              <TabsTrigger value="skills">Kỹ năng</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
            </TabsList>

            <TabsContent value="requirements" className="space-y-4">
              <div>
                <Label>Yêu cầu công việc</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Thêm yêu cầu mới"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.requirements.map((req, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{req}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div>
                <Label>Kỹ năng cần thiết</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Thêm kỹ năng"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="designId">Design ID</Label>
                  <Input
                    id="designId"
                    value={formData.designId || ''}
                    onChange={(e) => setFormData({ ...formData, designId: e.target.value })}
                    placeholder="ID thiết kế liên quan"
                  />
                </div>
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    placeholder="ID khách hàng"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              {assignment ? 'Cập nhật' : 'Tạo Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Assignment Suggestions Dialog
const AssignmentSuggestionsDialog: React.FC<{
  assignment: Assignment | null;
  suggestions: AssignmentSuggestion[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignmentId: string, employeeId: string) => void;
}> = ({ assignment, suggestions, isOpen, onClose, onAssign }) => {
  if (!assignment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gợi ý phân công - {assignment.title}</DialogTitle>
          <DialogDescription>
            Hệ thống AI đề xuất nhân viên phù hợp nhất cho assignment này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.employeeId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{suggestion.employeeName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Độ tin cậy: {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Khớp kỹ năng</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={suggestion.skillMatch * 100} className="h-2 flex-1" />
                        <span className="text-xs">{Math.round(suggestion.skillMatch * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sẵn sàng</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={suggestion.availabilityScore * 100} className="h-2 flex-1" />
                        <span className="text-xs">{Math.round(suggestion.availabilityScore * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tác động workload</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={suggestion.workloadImpact * 100} className="h-2 flex-1" />
                        <span className="text-xs">+{Math.round(suggestion.workloadImpact * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-green-600">Lý do phù hợp:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {suggestion.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {suggestion.concerns.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-600">Lưu ý:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {suggestion.concerns.map((concern, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <strong>Dự kiến hoàn thành:</strong> {new Date(suggestion.estimatedCompletion).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <Button
                  onClick={() => onAssign(assignment.id, suggestion.employeeId)}
                  className="ml-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Phân công
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EmployeeAssignmentInterface: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
  const [workloads, setWorkloads] = useState<WorkloadBalance[]>([]);
  const [teamWorkload, setTeamWorkload] = useState<TeamWorkload[]>([]);
  const [metrics, setMetrics] = useState<AssignmentMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'workload'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Dialog states
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        assignmentsResponse,
        templatesData,
        workloadData,
        teamWorkloadData,
        metricsData
      ] = await Promise.all([
        AssignmentManagementService.getAssignments(),
        AssignmentManagementService.getAssignmentTemplates(),
        AssignmentManagementService.getTeamWorkload(),
        AssignmentManagementService.getTeamWorkload('dept_design'),
        AssignmentManagementService.getAssignmentMetrics()
      ]);

      setAssignments(assignmentsResponse.assignments);
      setTemplates(templatesData);
      setWorkloads(teamWorkloadData[0]?.employees || []);
      setTeamWorkload(teamWorkloadData);
      setMetrics(metricsData);
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể tải dữ liệu assignments",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle create assignment
  const handleCreateAssignment = async (data: AssignmentFormData) => {
    try {
      await AssignmentManagementService.createAssignment(data);
      toast.success("Thành công", {
        description: "Tạo assignment mới thành công",
      });
      setAssignmentFormOpen(false);
      loadData();
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể tạo assignment",
      });
    }
  };

  // Handle update assignment
  const handleUpdateAssignment = async (data: AssignmentFormData) => {
    if (!editingAssignment) return;

    try {
      await AssignmentManagementService.updateAssignment(editingAssignment.id, data);
      toast.success("Thành công", {
        description: "Cập nhật assignment thành công",
      });
      setAssignmentFormOpen(false);
      setEditingAssignment(null);
      loadData();
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể cập nhật assignment",
      });
    }
  };

  // Handle assignment suggestions
  const handleGetSuggestions = async (assignment: Assignment) => {
    try {
      setSelectedAssignment(assignment);
      const suggestionsData = await AssignmentManagementService.getAssignmentSuggestions(assignment.id);
      setSuggestions(suggestionsData);
      setSuggestionsDialogOpen(true);
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể tải gợi ý phân công",
      });
    }
  };

  // Handle assign task
  const handleAssignTask = async (assignmentId: string, employeeId: string) => {
    try {
      await AssignmentManagementService.assignToEmployee(assignmentId, employeeId);
      toast.success("Thành công", {
        description: "Phân công thành công",
      });
      setSuggestionsDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể phân công assignment",
      });
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || assignment.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group assignments by status for board view
  const groupedAssignments = {
    unassigned: filteredAssignments.filter(a => a.status === 'unassigned'),
    assigned: filteredAssignments.filter(a => a.status === 'assigned'),
    in_progress: filteredAssignments.filter(a => a.status === 'in_progress'),
    review: filteredAssignments.filter(a => a.status === 'review'),
    completed: filteredAssignments.filter(a => a.status === 'completed')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phân công công việc</h1>
          <p className="text-muted-foreground">
            Quản lý và phân công assignments cho nhân viên
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => {
            setEditingAssignment(null);
            setAssignmentFormOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Assignment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Assignments</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.unassigned} chưa phân công
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang thực hiện</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.byStatus.in_progress}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.byStatus.review} đang review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.byStatus.completed}</div>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ đúng hạn: {Math.round(metrics.onTimeRate * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trễ hạn</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Thời gian TB: {metrics.avgCompletionTime.toFixed(1)} ngày
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="unassigned">Chưa phân công</SelectItem>
              <SelectItem value="assigned">Đã phân công</SelectItem>
              <SelectItem value="in_progress">Đang thực hiện</SelectItem>
              <SelectItem value="review">Đang review</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="urgent">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Hiển thị
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setViewMode('board')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Bảng Kanban
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <Users className="h-4 w-4 mr-2" />
                Danh sách
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('workload')}>
                <Target className="h-4 w-4 mr-2" />
                Workload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'board' | 'list' | 'workload')}>
        <TabsList>
          <TabsTrigger value="board">Bảng Kanban</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        {/* Board View */}
        <TabsContent value="board" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(groupedAssignments).map(([status, assignments]) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium capitalize">
                    {status === 'unassigned' ? 'Chưa phân công' :
                      status === 'assigned' ? 'Đã phân công' :
                        status === 'in_progress' ? 'Đang thực hiện' :
                          status === 'review' ? 'Đang review' :
                            'Hoàn thành'}
                  </h3>
                  <Badge variant="outline">{assignments.length}</Badge>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onEdit={(assignment) => {
                        setEditingAssignment(assignment);
                        setAssignmentFormOpen(true);
                      }}
                      onAssign={handleGetSuggestions}
                      onViewDetails={(assignment) => {
                        // Handle view details
                        console.log('View details:', assignment);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Độ ưu tiên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người phụ trách</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {assignment.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          assignment.priority === 'urgent' ? 'text-red-600' :
                            assignment.priority === 'high' ? 'text-orange-600' :
                              assignment.priority === 'medium' ? 'text-blue-600' :
                                'text-green-600'
                        }>
                          {assignment.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.assignedTo ? (
                          <span>Nhân viên {assignment.assignedTo.slice(-3)}</span>
                        ) : (
                          <span className="text-muted-foreground">Chưa phân công</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={assignment.progress} className="h-2 w-16" />
                          <span className="text-xs">{Math.round(assignment.progress)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingAssignment(assignment);
                              setAssignmentFormOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            {!assignment.assignedTo && (
                              <DropdownMenuItem onClick={() => handleGetSuggestions(assignment)}>
                                <Brain className="h-4 w-4 mr-2" />
                                Gợi ý phân công
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload View */}
        <TabsContent value="workload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workloads.map((workload) => (
              <WorkloadCard key={workload.employeeId} workload={workload} />
            ))}
          </div>

          {/* Team Workload Summary */}
          {teamWorkload.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tổng quan Workload theo phòng ban</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamWorkload.map((team) => (
                    <div key={team.departmentId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{team.departmentName}</span>
                        <Badge variant="outline">
                          {Math.round(team.utilizationRate * 100)}% utilization
                        </Badge>
                      </div>
                      <Progress value={team.utilizationRate * 100} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{Math.round(team.totalLoad)}h / {team.totalCapacity}h</span>
                        <span>{team.employees.length} nhân viên</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AssignmentFormDialog
        assignment={editingAssignment}
        templates={templates}
        isOpen={assignmentFormOpen}
        onClose={() => {
          setAssignmentFormOpen(false);
          setEditingAssignment(null);
        }}
        onSave={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
      />

      <AssignmentSuggestionsDialog
        assignment={selectedAssignment}
        suggestions={suggestions}
        isOpen={suggestionsDialogOpen}
        onClose={() => {
          setSuggestionsDialogOpen(false);
          setSelectedAssignment(null);
          setSuggestions([]);
        }}
        onAssign={handleAssignTask}
      />
    </div>
  );
};

export default EmployeeAssignmentInterface;