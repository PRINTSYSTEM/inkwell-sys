import React, { useEffect, useState } from 'react';
import { useCustomers, useCreateCustomer } from '@/hooks/use-customer';
import { CustomerListItem } from '@/Schema/customer.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CustomerServiceTest: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing CustomerService.getCustomers...');
      const customerService = getCustomerService();
      console.log('CustomerService instance:', customerService);
      
      const response = await customerService.getCustomers({
        pageNumber: 1,
        pageSize: 5
      });
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        setCustomers(response.data.items || []);
        console.log('Customers loaded:', response.data.items?.length || 0);
      } else {
        setError(response.message || 'Failed to load customers');
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testCustomerStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing CustomerService.getCustomerStats...');
      const customerService = getCustomerService();
      const response = await customerService.getCustomerStats();
      
      console.log('Stats Response:', response);
      
      if (response.success) {
        alert(`Stats: Total: ${response.data?.total}, Total Debt: ${response.data?.totalDebt}`);
      } else {
        setError(response.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Stats test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Customer Service Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testGetCustomers} 
            disabled={loading}
          >
            Test Get Customers
          </Button>
          
          <Button 
            onClick={testCustomerStats} 
            disabled={loading}
            variant="outline"
          >
            Test Get Stats
          </Button>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading...
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
            Error: {error}
          </div>
        )}
        
        {customers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Customers ({customers.length})</h3>
            <div className="space-y-2">
              {customers.map((customer, index) => (
                <div key={customer.id || index} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">
                    Code: {customer.code} | Company: {customer.companyName}
                  </div>
                  <div className="text-sm text-gray-600">
                    Debt: {customer.currentDebt}/{customer.maxDebt} | Status: {customer.debtStatus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerServiceTest;