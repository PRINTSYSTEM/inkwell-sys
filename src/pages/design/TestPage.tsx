import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TestTube,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Filter
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

import { DesignAssignmentService } from '@/services/designAssignmentService';
import DesignerList from '@/components/DesignerList';
import DesignAssignmentList from '@/components/DesignAssignmentList';
import { DesignerWorkload, DesignAssignment } from '@/types/design-monitoring';
import { Employee } from '@/types/employee';

// Mock designers for testing
const mockDesigners: Employee[] = [
  {
    id: 'emp-001',
    fullName: 'Nguyễn Văn A',
    email: 'designer1@company.com',
    role: 'designer',
    departmentId: 'dept-design',
    status: 'active',
    avatar: '',
    phoneNumber: '+84 123 456 789',
    address: 'Hà Nội, Việt Nam',
    hireDate: new Date('2023-01-15'),
    currentWorkload: 85,
    metrics: {
      totalDesigns: 24,
      completedDesigns: 22,
      completionRate: 92,
      averageRating: 4.6
    },
    skills: ['UI/UX Design', 'Graphic Design'],
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'emp-002',
    fullName: 'Trần Thị B',
    email: 'designer2@company.com',
    role: 'designer',
    departmentId: 'dept-design',
    status: 'active',
    avatar: '',
    phoneNumber: '+84 987 654 321',
    address: 'TP.HCM, Việt Nam',
    hireDate: new Date('2023-03-10'),
    currentWorkload: 92,
    metrics: {
      totalDesigns: 21,
      completedDesigns: 19,
      completionRate: 90,
      averageRating: 4.5
    },
    skills: ['Packaging Design', 'Print Design'],
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'emp-003',
    fullName: 'Lê Minh C',
    email: 'designer3@company.com',
    role: 'designer',
    departmentId: 'dept-design',
    status: 'active',
    avatar: '',
    phoneNumber: '+84 456 789 123',
    address: 'Đà Nẵng, Việt Nam',
    hireDate: new Date('2023-06-01'),
    currentWorkload: 45,
    metrics: {
      totalDesigns: 15,
      completedDesigns: 13,
      completionRate: 87,
      averageRating: 4.3
    },
    skills: ['Web Design', 'Logo Design'],
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'emp-004',
    fullName: 'Phạm Thu D',
    email: 'designer4@company.com',
    role: 'designer',
    departmentId: 'dept-design',
    status: 'active',
    avatar: '',
    phoneNumber: '+84 789 123 456',
    address: 'Hà Nội, Việt Nam',
    hireDate: new Date('2023-08-15'),
    currentWorkload: 70,
    metrics: {
      totalDesigns: 18,
      completedDesigns: 16,
      completionRate: 89,
      averageRating: 4.4
    },
    skills: ['Illustration', 'Packaging Design'],
    assignments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  duration?: number;
}

const DesignSystemTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [workloads, setWorkloads] = useState<DesignerWorkload[]>([]);
  const [assignments, setAssignments] = useState<DesignAssignment[]>([]);
  const [selectedDesigner, setSelectedDesigner] = useState<string>('all');

  // Generate mock workloads
  const generateMockWorkloads = (): DesignerWorkload[] => {
    return mockDesigners.map(designer => ({
      designerId: designer.id,
      designer,
      activeAssignments: Math.floor(Math.random() * 6) + 1,
      totalWorkload: Math.floor(Math.random() * 100),
      overdueAssignments: Math.floor(Math.random() * 3),
      completedThisMonth: Math.floor(Math.random() * 10) + 5,
      completedThisWeek: Math.floor(Math.random() * 3) + 1,
      averageCompletionTime: Math.random() * 5 + 2,
      onTimeCompletionRate: Math.floor(Math.random() * 30) + 70,
      assignmentsByStatus: {
        pending: Math.floor(Math.random() * 3),
        in_progress: Math.floor(Math.random() * 4) + 1,
        review: Math.floor(Math.random() * 2),
        revision: Math.floor(Math.random() * 2),
        approved: Math.floor(Math.random() * 2)
      },
      assignmentsByPriority: {
        low: Math.floor(Math.random() * 2),
        medium: Math.floor(Math.random() * 3) + 1,
        high: Math.floor(Math.random() * 2) + 1,
        urgent: Math.floor(Math.random() * 1)
      },
      estimatedHoursRemaining: Math.floor(Math.random() * 50) + 10,
      actualHoursThisWeek: Math.floor(Math.random() * 40) + 10,
      isAvailable: Math.random() > 0.3,
      availabilityStatus: (['available', 'busy', 'overloaded'] as const)[Math.floor(Math.random() * 3)] as 'available' | 'busy' | 'overloaded'
    }));
  };

  // Test functions
  const runTest = async (testName: string, testFn: () => Promise<void>): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      return {
        name: testName,
        status: 'success',
        message: 'Test passed successfully',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: testName,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  };

  const testDesignAssignmentService = async () => {
    // Test getAssignmentsByDesigner
    const designerAssignments = await DesignAssignmentService.getAssignmentsByDesigner('emp-001');
    if (!designerAssignments.data || designerAssignments.data.length === 0) {
      throw new Error('No assignments found for designer');
    }

    // Test getAssignmentsByDepartment
    const deptAssignments = await DesignAssignmentService.getAssignmentsByDepartment('dept-design');
    if (!deptAssignments.data) {
      throw new Error('No department assignments found');
    }

    // Test getDesignerWorkload
    const workload = await DesignAssignmentService.getDesignerWorkload('emp-001');
    if (!workload || typeof workload.totalWorkload !== 'number') {
      throw new Error('Invalid workload data');
    }

    // Test getDepartmentStats
    const stats = await DesignAssignmentService.getDepartmentStats('dept-design');
    if (!stats || typeof stats.total !== 'number') {
      throw new Error('Invalid department stats');
    }
  };

  const testFilteringAndSorting = async () => {
    const allAssignments = await DesignAssignmentService.getAssignmentsByDepartment('dept-design');
    
    // Test status filter
    const inProgressFilter = await DesignAssignmentService.getAssignmentsByDepartment('dept-design', {
      status: 'in_progress'
    });
    
    // Test priority filter
    const highPriorityFilter = await DesignAssignmentService.getAssignmentsByDepartment('dept-design', {
      priority: 'high'
    });

    // Test search
    const searchResults = await DesignAssignmentService.getAssignmentsByDepartment('dept-design', {
      search: 'thiết kế'
    });

    if (!inProgressFilter.data || !highPriorityFilter.data || !searchResults.data) {
      throw new Error('Filtering not working properly');
    }
  };

  const testAssignmentOperations = async () => {
    // Test create assignment
    const newAssignment = await DesignAssignmentService.createAssignment({
      designCodeId: 'dc-test',
      designerId: 'emp-001',
      assignedBy: 'emp-manager-001',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
      priority: 'medium',
      title: 'Test Assignment',
      description: 'This is a test assignment created during testing'
    });

    if (!newAssignment.id) {
      throw new Error('Failed to create assignment');
    }

    // Test update assignment
    const updatedAssignment = await DesignAssignmentService.updateAssignmentStatus(
      newAssignment.id,
      { status: 'in_progress', progressPercentage: 25 }
    );

    if (updatedAssignment.status !== 'in_progress') {
      throw new Error('Failed to update assignment status');
    }

    // Test delete assignment (cleanup)
    const deleted = await DesignAssignmentService.deleteAssignment(newAssignment.id);
    if (!deleted) {
      throw new Error('Failed to delete test assignment');
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setTestResults([]);

    const tests = [
      { name: 'Design Assignment Service', fn: testDesignAssignmentService },
      { name: 'Filtering and Sorting', fn: testFilteringAndSorting },
      { name: 'Assignment Operations', fn: testAssignmentOperations }
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      setTestResults(prev => [...prev, { name: test.name, status: 'pending', message: 'Running...' }]);
      
      const result = await runTest(test.name, test.fn);
      results.push(result);
      
      setTestResults(prev => 
        prev.map(r => r.name === test.name ? result : r)
      );

      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRunning(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    toast({
      title: "Tests Completed",
      description: `${successCount}/${results.length} tests passed`,
      variant: successCount === results.length ? "default" : "destructive"
    });
  };

  const loadData = useCallback(async () => {
    try {
      // Load workloads
      const mockWorkloads = generateMockWorkloads();
      setWorkloads(mockWorkloads);

      // Load assignments
      const assignmentData = await DesignAssignmentService.getAssignmentsByDepartment('dept-design');
      setAssignments(assignmentData.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load test data",
        variant: "destructive"
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design System Testing</h1>
          <p className="text-muted-foreground mt-1">
            Test các functionality của hệ thống quản lý thiết kế
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload Data
          </Button>
          <Button 
            onClick={runAllTests} 
            disabled={running}
            className="gap-2"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="designers">Designers List</TabsTrigger>
          <TabsTrigger value="assignments">Assignments List</TabsTrigger>
          <TabsTrigger value="demo">Demo Features</TabsTrigger>
        </TabsList>

        {/* Test Results Tab */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Results
              </CardTitle>
              <CardDescription>
                Kết quả kiểm tra các chức năng của hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Click "Run Tests" để bắt đầu kiểm tra</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {result.status === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                        {result.status === 'pending' && <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />}
                        <div>
                          <h3 className="font-medium">{result.name}</h3>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                        )}
                        <Badge variant={
                          result.status === 'success' ? 'default' :
                          result.status === 'error' ? 'destructive' : 'secondary'
                        }>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designers List Tab */}
        <TabsContent value="designers">
          <DesignerList
            workloads={workloads}
            loading={false}
            onRefresh={loadData}
            viewMode="card"
            showActions={true}
          />
        </TabsContent>

        {/* Assignments List Tab */}
        <TabsContent value="assignments">
          <DesignAssignmentList
            assignments={assignments}
            designers={mockDesigners}
            loading={false}
            onRefresh={loadData}
            viewMode="table"
            allowFiltering={true}
          />
        </TabsContent>

        {/* Demo Features Tab */}
        <TabsContent value="demo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Links</CardTitle>
                <CardDescription>Test các trang trong hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => navigate('/design/management')}
                >
                  <Eye className="h-4 w-4" />
                  Design Manager Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => navigate('/design/designers/emp-001')}
                >
                  <Eye className="h-4 w-4" />
                  Designer Detail View
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => navigate('/design/all')}
                >
                  <Eye className="h-4 w-4" />
                  All Designs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Data Summary</CardTitle>
                <CardDescription>Tóm tắt dữ liệu test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Mock Designers:</span>
                  <Badge>{mockDesigners.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Mock Assignments:</span>
                  <Badge>{assignments.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Active Workloads:</span>
                  <Badge>{workloads.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Test Coverage:</span>
                  <Badge variant="outline">Core Features</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignSystemTestPage;