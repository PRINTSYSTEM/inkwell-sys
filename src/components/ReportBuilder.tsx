import React, { useState, useEffect } from 'react';
import {
  Plus,
  Save,
  X,
  Settings,
  FileText,
  BarChart3,
  Table,
  Image,
  Type,
  Move,
  Trash2,
  Copy,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportService } from '@/services/reportService';
import {
  Report,
  ReportTemplate,
  ReportSection,
  ReportSectionConfig,
  ReportType,
  ReportCategory
} from '@/types/report';

const reportService = new ReportService();

interface ReportBuilderProps {
  templateId?: string;
  reportId?: string;
  onSave?: (report: Report) => void;
  onCancel?: () => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  templateId,
  reportId,
  onSave,
  onCancel
}) => {
  const [report, setReport] = useState<Partial<Report>>({
    name: '',
    description: '',
    type: 'performance',
    category: 'operational',
    status: 'draft',
    parameters: [],
    isPublic: false,
    tags: []
  });
  
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const templatesData = await reportService.getTemplates();
        setTemplates(templatesData);

        if (reportId) {
          // Edit existing report
          const existingReport = await reportService.getReportById(reportId);
          if (existingReport) {
            setReport(existingReport);
            setSections(existingReport.template?.sections || []);
          }
        } else if (templateId) {
          // Create from template
          const template = templatesData.find(t => t.id === templateId);
          if (template) {
            setReport({
              name: `New ${template.name}`,
              description: template.description,
              type: template.type,
              category: template.category as ReportCategory,
              status: 'draft',
              parameters: [],
              isPublic: false,
              tags: []
            });
            setSections(template.sections || []);
            setSelectedTemplate(templateId);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [templateId, reportId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        ...report as Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
        template: selectedTemplate ? templates.find(t => t.id === selectedTemplate)! : {} as ReportTemplate,
        createdBy: 'current_user' // This should come from auth context
      };

      let savedReport: Report;
      if (reportId) {
        savedReport = await reportService.updateReport(reportId, reportData);
      } else {
        savedReport = await reportService.createReport(reportData);
      }

      onSave?.(savedReport);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      title: `New ${type} Section`,
      type,
      config: getDefaultSectionConfig(type),
      order: sections.length + 1,
      isRequired: false
    };
    
    setSections(prev => [...prev, newSection]);
    setActiveSection(newSection.id);
    setSectionDialog(false);
  };

  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newSection: ReportSection = {
        ...section,
        id: `section_${Date.now()}`,
        title: `${section.title} (Copy)`,
        order: sections.length + 1
      };
      setSections(prev => [...prev, newSection]);
    }
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const index = prev.findIndex(s => s.id === sectionId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newSections = [...prev];
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
      
      // Update order
      newSections.forEach((section, idx) => {
        section.order = idx + 1;
      });
      
      return newSections;
    });
  };

  const getDefaultSectionConfig = (type: ReportSection['type']): ReportSectionConfig => {
    switch (type) {
      case 'chart':
        return {
          dataSource: '',
          chartType: 'bar',
          columns: [],
          filters: [],
          groupBy: []
        };
      case 'table':
        return {
          dataSource: '',
          columns: [],
          filters: []
        };
      case 'summary':
        return {
          dataSource: '',
          aggregations: []
        };
      case 'text':
        return {
          dataSource: 'static'
        };
      case 'image':
        return {
          dataSource: 'upload'
        };
      default:
        return {
          dataSource: ''
        };
    }
  };

  const getSectionIcon = (type: ReportSection['type']) => {
    switch (type) {
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'summary': return <FileText className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {reportId ? 'Edit Report' : 'Create New Report'}
          </h1>
          <p className="text-gray-600">
            {selectedTemplate && 'Based on template: ' + templates.find(t => t.id === selectedTemplate)?.name}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={report.name}
                  onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={report.description}
                  onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Report Type</Label>
                <Select
                  value={report.type}
                  onValueChange={(value: ReportType) => 
                    setReport(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={report.category}
                  onValueChange={(value: ReportCategory) => 
                    setReport(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={report.isPublic}
                  onCheckedChange={(checked) => 
                    setReport(prev => ({ ...prev, isPublic: Boolean(checked) }))
                  }
                />
                <Label htmlFor="isPublic">Make report public</Label>
              </div>
              
              {!selectedTemplate && (
                <div className="space-y-2">
                  <Label htmlFor="template">Use Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                      const template = templates.find(t => t.id === value);
                      if (template) {
                        setSections(template.sections);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Builder */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Sections</CardTitle>
                <Button onClick={() => setSectionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sections added</h3>
                  <p className="text-gray-600 mb-4">
                    Start building your report by adding sections.
                  </p>
                  <Button onClick={() => setSectionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <Card 
                      key={section.id} 
                      className={`border-2 transition-colors ${
                        activeSection === section.id ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getSectionIcon(section.type)}
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary">{section.type}</Badge>
                                <span className="text-xs text-gray-600">
                                  Order: {section.order}
                                </span>
                                {section.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                            >
                              <Move className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === sections.length - 1}
                            >
                              <Move className="h-4 w-4 rotate-180" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateSection(section.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveSection(
                                activeSection === section.id ? null : section.id
                              )}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSection(section.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {activeSection === section.id && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Section Title</Label>
                              <Input
                                value={section.title}
                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Data Source</Label>
                              <Input
                                value={section.config.dataSource}
                                onChange={(e) => updateSection(section.id, {
                                  config: { ...section.config, dataSource: e.target.value }
                                })}
                                placeholder="Enter data source"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${section.id}`}
                                checked={section.isRequired}
                                onCheckedChange={(checked) => 
                                  updateSection(section.id, { isRequired: Boolean(checked) })
                                }
                              />
                              <Label htmlFor={`required-${section.id}`}>Required section</Label>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { type: 'summary' as const, title: 'Summary', description: 'Key metrics and totals' },
              { type: 'chart' as const, title: 'Chart', description: 'Visual data representation' },
              { type: 'table' as const, title: 'Table', description: 'Detailed data in rows' },
              { type: 'text' as const, title: 'Text', description: 'Static text content' },
              { type: 'image' as const, title: 'Image', description: 'Pictures and graphics' }
            ].map(({ type, title, description }) => (
              <Card
                key={type}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addSection(type)}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2">{getSectionIcon(type)}</div>
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-sm text-gray-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};