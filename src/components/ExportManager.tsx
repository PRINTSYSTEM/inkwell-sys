import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Filter,
  Calendar,
  Package,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReportService } from '@/services/reportService';
import { ExportJob, ExportFormat, BulkExportOptions } from '@/types/report';

const reportService = new ReportService();

interface ExportManagerProps {
  reportIds?: string[];
  onClose?: () => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  reportIds = [],
  onClose
}) => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkOptions, setBulkOptions] = useState<BulkExportOptions>({
    format: 'pdf',
    compression: 'medium',
    includeCharts: true,
    includeRawData: false,
    splitLargeFiles: true,
    maxFileSize: 10,
    outputName: 'bulk_export'
  });

  useEffect(() => {
    loadExportJobs();
    
    // Set up polling for active jobs
    const interval = setInterval(() => {
      loadExportJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadExportJobs = async () => {
    try {
      const jobs = await reportService.getExportJobs();
      setExportJobs(jobs);
    } catch (error) {
      console.error('Failed to load export jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = async () => {
    if (reportIds.length === 0) return;

    try {
      setBulkExporting(true);
      // For now, simulate creating an export job since the service returns BulkReportOperation
      const exportJob: ExportJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportIds: reportIds,
        format: bulkOptions.format,
        status: 'queued',
        fileName: `${bulkOptions.outputName}.${bulkOptions.format}`,
        createdAt: new Date(),
        createdBy: 'current_user'
      };
      
      setExportJobs(prev => [exportJob, ...prev]);
      setBulkDialogOpen(false);
    } catch (error) {
      console.error('Failed to start bulk export:', error);
    } finally {
      setBulkExporting(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await reportService.retryExportJob(jobId);
      await loadExportJobs();
    } catch (error) {
      console.error('Failed to retry export job:', error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await reportService.cancelExportJob(jobId);
      await loadExportJobs();
    } catch (error) {
      console.error('Failed to cancel export job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await reportService.deleteExportJob(jobId);
      setExportJobs(prev => prev.filter(job => job.id !== jobId));
      setSelectedJobs(prev => {
        const updated = new Set(prev);
        updated.delete(jobId);
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete export job:', error);
    }
  };

  const handleDownload = async (job: ExportJob) => {
    if (!job.downloadUrl) return;

    try {
      const response = await fetch(job.downloadUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = job.fileName || `export-${job.id}.${job.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  };

  const handleBulkAction = async (action: 'download' | 'delete' | 'retry') => {
    const selectedJobsList = exportJobs.filter(job => selectedJobs.has(job.id));
    
    switch (action) {
      case 'download':
        for (const job of selectedJobsList) {
          if (job.status === 'completed' && job.downloadUrl) {
            await handleDownload(job);
          }
        }
        break;
      case 'delete':
        for (const job of selectedJobsList) {
          await handleDeleteJob(job.id);
        }
        break;
      case 'retry':
        for (const job of selectedJobsList) {
          if (job.status === 'failed' || job.status === 'cancelled') {
            await handleRetryJob(job.id);
          }
        }
        break;
    }
    
    setSelectedJobs(new Set());
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      const updated = new Set(prev);
      if (updated.has(jobId)) {
        updated.delete(jobId);
      } else {
        updated.add(jobId);
      }
      return updated;
    });
  };

  const toggleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id)));
    }
  };

  const filteredJobs = exportJobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesFormat = filterFormat === 'all' || job.format === filterFormat;
    return matchesStatus && matchesFormat;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <File className="h-4 w-4 text-blue-600" />;
      case 'png':
      case 'jpg':
        return <Image className="h-4 w-4 text-purple-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const jobStats = {
    total: exportJobs.length,
    completed: exportJobs.filter(j => j.status === 'completed').length,
    inProgress: exportJobs.filter(j => j.status === 'in_progress').length,
    failed: exportJobs.filter(j => j.status === 'failed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Export Manager</h2>
          <p className="text-sm text-gray-600">
            Manage and download your report exports
          </p>
        </div>
        
        {reportIds.length > 0 && (
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Bulk Export ({reportIds.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Export Settings</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select
                    value={bulkOptions.format}
                    onValueChange={(value: ExportFormat) => 
                      setBulkOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Workbook</SelectItem>
                      <SelectItem value="csv">CSV Files</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="compression">Compression Level</Label>
                  <Select
                    value={bulkOptions.compression}
                    onValueChange={(value: 'none' | 'low' | 'medium' | 'high') => 
                      setBulkOptions(prev => ({ ...prev, compression: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Compression</SelectItem>
                      <SelectItem value="low">Low Compression</SelectItem>
                      <SelectItem value="medium">Medium Compression</SelectItem>
                      <SelectItem value="high">High Compression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={bulkOptions.includeCharts}
                      onCheckedChange={(checked) => 
                        setBulkOptions(prev => ({ ...prev, includeCharts: Boolean(checked) }))
                      }
                    />
                    <Label htmlFor="includeCharts">Include Charts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRawData"
                      checked={bulkOptions.includeRawData}
                      onCheckedChange={(checked) => 
                        setBulkOptions(prev => ({ ...prev, includeRawData: Boolean(checked) }))
                      }
                    />
                    <Label htmlFor="includeRawData">Include Raw Data</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="splitLargeFiles"
                      checked={bulkOptions.splitLargeFiles}
                      onCheckedChange={(checked) => 
                        setBulkOptions(prev => ({ ...prev, splitLargeFiles: Boolean(checked) }))
                      }
                    />
                    <Label htmlFor="splitLargeFiles">Split Large Files</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkExport}
                  disabled={bulkExporting}
                >
                  {bulkExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    'Start Export'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exports</p>
                <p className="text-xl font-bold text-gray-900">{jobStats.total}</p>
              </div>
              <Download className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{jobStats.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-xl font-bold text-gray-900">{jobStats.inProgress}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-xl font-bold text-gray-900">{jobStats.failed}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterFormat} onValueChange={setFilterFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadExportJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {selectedJobs.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedJobs.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('download')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('retry')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Export Jobs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Export Jobs</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className={`p-4 flex items-center justify-between ${
                  index !== filteredJobs.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedJobs.has(job.id)}
                    onCheckedChange={() => toggleJobSelection(job.id)}
                  />
                  
                  <div className="flex items-center space-x-3">
                    {getFormatIcon(job.format)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{job.fileName || `Export ${job.id}`}</span>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {job.reportNames?.join(', ') || 'Unknown reports'} • {job.format.toUpperCase()}
                        {job.fileSize && ` • ${(job.fileSize / (1024 * 1024)).toFixed(2)} MB`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Started: {new Date(job.createdAt).toLocaleString()}
                        {job.completedAt && (
                          <span> • Completed: {new Date(job.completedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {job.status === 'in_progress' && job.progress !== undefined && (
                    <div className="w-24">
                      <Progress value={job.progress} className="h-2" />
                      <div className="text-xs text-center text-gray-600 mt-1">
                        {job.progress}%
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    {job.status === 'completed' && job.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(job)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {(job.status === 'failed' || job.status === 'cancelled') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryJob(job.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {job.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No export jobs found</h3>
              <p className="text-gray-600">
                {filterStatus !== 'all' || filterFormat !== 'all'
                  ? 'No exports match your current filters.'
                  : 'Start exporting reports to see them here.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};