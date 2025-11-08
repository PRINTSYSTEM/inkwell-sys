import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useTableData, 
  useFormValidation, 
  useAsyncData, 
  useFilters,
  filterHelpers,
  createFieldProps
} from '@/hooks';
import { z } from 'zod';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
}

interface TableParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

// Mock data and services
const mockUsers: User[] = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a@example.com', age: 25, department: 'IT' },
  { id: 2, name: 'Trần Thị B', email: 'b@example.com', age: 30, department: 'HR' },
  { id: 3, name: 'Lê Văn C', email: 'c@example.com', age: 28, department: 'Finance' },
  { id: 4, name: 'Phạm Thị D', email: 'd@example.com', age: 35, department: 'IT' },
  { id: 5, name: 'Hoàng Văn E', email: 'e@example.com', age: 22, department: 'Marketing' },
];

const mockUserService = {
  async getUsers(params: TableParams) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let filtered = [...mockUsers];
    
    // Apply search
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) || 
        user.email.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[params.sortBy as keyof typeof a];
        const bValue = b[params.sortBy as keyof typeof b];
        const modifier = params.sortOrder === 'desc' ? -1 : 1;
        return aValue > bValue ? modifier : aValue < bValue ? -modifier : 0;
      });
    }
    
    // Apply pagination
    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    const data = filtered.slice(start, end);
    
    return {
      data,
      totalItems: filtered.length
    };
  }
};

// Form schema
const userFormSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  age: z.number().min(18, 'Tuổi phải từ 18 trở lên').max(100, 'Tuổi không được quá 100'),
  department: z.string().min(1, 'Vui lòng chọn phòng ban')
});

type UserFormData = z.infer<typeof userFormSchema>;

// Table Data Example
function TableDataExample() {
  const [tableState, tableActions] = useTableData({
    loadData: mockUserService.getUsers,
    initialPageSize: 3,
    autoLoad: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>useTableData Hook Example</CardTitle>
        <CardDescription>
          Quản lý state cho bảng với pagination, sorting, và search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Tìm kiếm</Label>
          <Input
            id="search"
            placeholder="Tìm theo tên hoặc email..."
            value={tableState.searchQuery}
            onChange={(e) => tableActions.setSearch(e.target.value)}
          />
        </div>

        {/* Data */}
        <div>
          {tableState.loading ? (
            <div>Đang tải...</div>
          ) : tableState.error ? (
            <div className="text-red-500">Lỗi: {tableState.error}</div>
          ) : (
            <div className="space-y-2">
              {tableState.data.map((user: User) => (
                <div key={user.id} className="p-2 border rounded">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email} - {user.age} tuổi - {user.department}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {tableState.startIndex}-{tableState.endIndex} của {tableState.totalItems} kết quả
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => tableActions.setPage(tableState.currentPage - 1)}
              disabled={!tableState.hasPreviousPage}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tableActions.setPage(tableState.currentPage + 1)}
              disabled={!tableState.hasNextPage}
            >
              Sau
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => tableActions.refresh()}>Tải lại</Button>
          <Button variant="outline" onClick={() => tableActions.reset()}>Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Form Validation Example
function FormValidationExample() {
  const [formState, formActions] = useFormValidation<UserFormData>({
    schema: userFormSchema,
    initialValues: {
      name: '',
      email: '',
      age: 0,
      department: ''
    },
    validateOnBlur: true,
    onSubmit: async (values) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', values);
      alert('Đã lưu thành công!');
    }
  });

  const nameProps = createFieldProps('name', formState, formActions);
  const emailProps = createFieldProps('email', formState, formActions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>useFormValidation Hook Example</CardTitle>
        <CardDescription>
          Form validation với schema Zod và error handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          formActions.handleSubmit();
        }}>
          <div className="space-y-4">
            {/* Name field */}
            <div>
              <Label htmlFor="name">Tên *</Label>
              <Input
                id="name"
                value={nameProps.value as string}
                onChange={(e) => nameProps.onChange(e.target.value)}
                onBlur={nameProps.onBlur}
                className={nameProps.error ? 'border-red-500' : ''}
              />
              {nameProps.error && (
                <div className="text-red-500 text-sm mt-1">{nameProps.error}</div>
              )}
            </div>

            {/* Email field */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={emailProps.value as string}
                onChange={(e) => emailProps.onChange(e.target.value)}
                onBlur={emailProps.onBlur}
                className={emailProps.error ? 'border-red-500' : ''}
              />
              {emailProps.error && (
                <div className="text-red-500 text-sm mt-1">{emailProps.error}</div>
              )}
            </div>

            {/* Age field */}
            <div>
              <Label htmlFor="age">Tuổi *</Label>
              <Input
                id="age"
                type="number"
                value={formState.values.age}
                onChange={(e) => formActions.setValue('age', Number(e.target.value))}
                onBlur={() => formActions.setTouched('age')}
                className={formState.errors.age ? 'border-red-500' : ''}
              />
              {formState.errors.age && (
                <div className="text-red-500 text-sm mt-1">{formState.errors.age}</div>
              )}
            </div>

            {/* Department field */}
            <div>
              <Label htmlFor="department">Phòng ban *</Label>
              <select
                id="department"
                value={formState.values.department}
                onChange={(e) => formActions.setValue('department', e.target.value)}
                onBlur={() => formActions.setTouched('department')}
                className={`w-full px-3 py-2 border rounded-md ${formState.errors.department ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Chọn phòng ban</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
              </select>
              {formState.errors.department && (
                <div className="text-red-500 text-sm mt-1">{formState.errors.department}</div>
              )}
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              disabled={formState.isSubmitting || !formState.isValid}
              className="w-full"
            >
              {formState.isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>

        {/* Form status */}
        <div className="text-sm text-gray-600">
          <div>Valid: {formState.isValid ? 'Yes' : 'No'}</div>
          <div>Dirty: {formState.isDirty ? 'Yes' : 'No'}</div>
          <div>Submit count: {formState.submitCount}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Async Data Example
function AsyncDataExample() {
  const [asyncState, asyncActions] = useAsyncData({
    fetcher: async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        message: 'Data loaded successfully!',
        timestamp: new Date().toISOString(),
        randomValue: Math.random()
      };
    },
    cacheTime: 30000, // 30 seconds
    retryCount: 3
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>useAsyncData Hook Example</CardTitle>
        <CardDescription>
          Async data loading với caching và retry logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="text-sm">
          <div>Loading: {asyncState.loading ? 'Yes' : 'No'}</div>
          <div>Last fetch: {asyncState.lastFetch?.toLocaleTimeString() || 'Never'}</div>
        </div>

        {/* Data */}
        {asyncState.loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : asyncState.error ? (
          <div className="text-red-500">Lỗi: {asyncState.error}</div>
        ) : asyncState.data ? (
          <div className="p-4 bg-gray-50 rounded">
            <div>Message: {asyncState.data.message}</div>
            <div>Timestamp: {asyncState.data.timestamp}</div>
            <div>Random: {asyncState.data.randomValue.toFixed(4)}</div>
          </div>
        ) : (
          <div>Chưa có dữ liệu</div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => asyncActions.refetch()}>Tải lại</Button>
          <Button variant="outline" onClick={() => asyncActions.reset()}>Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Filters Example
function FiltersExample() {
  const [filterState, filterActions] = useFilters({
    persistKey: 'user-filters'
  });

  const filteredUsers = filterActions.applyFilters(mockUsers, {
    searchFields: ['name', 'email'],
    caseSensitive: false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>useFilters Hook Example</CardTitle>
        <CardDescription>
          Advanced filtering, sorting và search functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Label htmlFor="filter-search">Tìm kiếm</Label>
          <Input
            id="filter-search"
            placeholder="Tìm theo tên hoặc email..."
            value={filterState.searchQuery}
            onChange={(e) => filterActions.setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age-filter">Tuổi tối thiểu</Label>
            <Input
              id="age-filter"
              type="number"
              placeholder="Nhập tuổi..."
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  filterActions.setFilter('age', filterHelpers.greaterThanOrEqual(Number(value)));
                } else {
                  filterActions.removeFilter('age');
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="department-filter">Phòng ban</Label>
            <select
              id="department-filter"
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  filterActions.setFilter('department', filterHelpers.equals(value));
                } else {
                  filterActions.removeFilter('department');
                }
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Tất cả</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div>
          <Label>Sắp xếp theo</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={filterState.sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => filterActions.setSort('name')}
            >
              Tên {filterState.sortBy === 'name' && (filterState.sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={filterState.sortBy === 'age' ? 'default' : 'outline'}
              size="sm"
              onClick={() => filterActions.setSort('age')}
            >
              Tuổi {filterState.sortBy === 'age' && (filterState.sortOrder === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              {filteredUsers.length} kết quả ({filterState.activeFiltersCount} bộ lọc đang áp dụng)
            </div>
            <Button variant="outline" size="sm" onClick={() => filterActions.reset()}>
              Reset tất cả
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-2 border rounded">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email} - {user.age} tuổi - {user.department}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Example Component
export function HooksExample() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Custom Hooks Examples</h1>
        <p className="text-gray-600">
          Demonstration của các custom hooks để quản lý state và logic phức tạp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableDataExample />
        <FormValidationExample />
        <AsyncDataExample />
        <FiltersExample />
      </div>
    </div>
  );
}