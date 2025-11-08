import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DesignerActionsProps {
  designerId: string;
  onRefresh: () => void;
}

export const DesignerActions: React.FC<DesignerActionsProps> = ({ designerId, onRefresh }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate('/design/management')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold">Chi tiết Designer</h1>
        <p className="text-muted-foreground mt-1">
          Thông tin chi tiết và hiệu suất làm việc
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </Button>
        <Button 
          onClick={() => navigate(`/design/assignments/new?designer=${designerId}`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Phân công mới
        </Button>
      </div>
    </div>
  );
};