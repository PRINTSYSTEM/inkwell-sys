import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Settings, 
  Play,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Share2,
  Eye,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReportService } from '@/services/reportService';
import { Report, ReportTemplate, ReportGeneration, ExportFormat } from '@/types/report';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const reportService = new ReportService();

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generations, setGenerations] = useState<ReportGeneration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('reports');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, templatesData, generationsData] = await Promise.all([
        reportService.getReports(),
        reportService.getTemplates(),
        reportService.getGenerations()
      ]);
      
      setReports(reportsData);
      setTemplates(templatesData);
      setGenerations(generationsData);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    try {
      setGeneratingReports(prev => new Set([...prev, reportId]));
      const generation = await reportService.generateReport(reportId, {}, 'pdf');
      
      // Update generations list
      setGenerations(prev => [generation, ...prev]);
      
      // Show success message or download automatically
      console.log('Report generated:', generation);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReports(prev => {
        const updated = new Set(prev);
        updated.delete(reportId);
        return updated;
      });
    }
  };

  const handleExportReport = async (reportId: string, format: ExportFormat) => {
    try {
      const exportResult = await reportService.exportReport(reportId, {}, {
        format,
        includeCharts: true,
        includeRawData: false,
        pageOrientation: 'portrait',
        pageSize: 'A4'
      });
      
      // Create download link
      const a = document.createElement('a');
      a.href = exportResult.fileUrl;
      a.download = exportResult.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportService.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter generations for recent activity
  const recentGenerations = generations.slice(0, 5);

  // Get report stats
  const reportStats = {
    total: reports.length,
    active: reports.filter(r => r.status === 'active').length,
    scheduled: reports.filter(r => r.schedule?.isActive).length,
    generated: generations.filter(g => g.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getGenerationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'attendance': return <Clock className="h-4 w-4" />;
      case 'employee': return <Users className="h-4 w-4" />;
      case 'department': return <BarChart3 className="h-4 w-4" />;
      case 'analytics': return <PieChart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate, schedule, and export comprehensive reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Report</DialogTitle>
                </DialogHeader>
                {/* Report creation form will go here */}
                <div className="p-4 text-center text-gray-600">
                  Report creation form coming soon...
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{reportStats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{reportStats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{reportStats.scheduled}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Generated</p>
                  <p className="text-2xl font-bold text-gray-900">{reportStats.generated}</p>
                </div>
                <Download className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generations">Recent Generations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(report.category)}
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      {report.schedule?.isActive && (
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Created: {new Date(report.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(report.updatedAt).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={generatingReports.has(report.id)}
                        className="flex-1"
                      >
                        {generatingReports.has(report.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-2" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleExportReport(report.id, 'pdf')}>
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportReport(report.id, 'excel')}>
                            Export as Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportReport(report.id, 'csv')}>
                            Export as CSV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'No reports match your current filters.'
                    : 'Get started by creating your first report.'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {template.sections.length} sections
                      </span>
                      <Button size="sm">Use Template</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recent Generations Tab */}
          <TabsContent value="generations" className="space-y-6">
            <div className="space-y-4">
              {recentGenerations.map((generation) => (
                <Card key={generation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{generation.reportName}</h3>
                          <Badge className={getGenerationStatusColor(generation.status)}>
                            {generation.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span>Started: {new Date(generation.startedAt).toLocaleString()}</span>
                          {generation.completedAt && (
                            <span>Completed: {new Date(generation.completedAt).toLocaleString()}</span>
                          )}
                          {generation.generationTime && (
                            <span>Duration: {generation.generationTime}ms</span>
                          )}
                        </div>
                        {generation.status === 'generating' && generation.progress && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{generation.progress}%</span>
                            </div>
                            <Progress value={generation.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {generation.status === 'completed' && generation.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generation.downloadUrl, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {generation.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateReport(generation.reportId)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                    {generation.error && (
                      <Alert className="mt-4">
                        <AlertDescription>{generation.error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Detailed analytics and insights coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

export default Reports;