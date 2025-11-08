import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Employee } from '@/types/employee';
import { DesignerWorkload } from '@/types/design-monitoring';

interface DesignerInfoProps {
  designer: Employee;
  workload: DesignerWorkload;
}

export const DesignerInfo: React.FC<DesignerInfoProps> = ({ designer, workload }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={designer.avatar} />
            <AvatarFallback className="text-lg">
              {designer.fullName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">{designer.fullName}</h2>
                <p className="text-lg text-muted-foreground capitalize">{designer.role}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {designer.email}
                  </div>
                  {designer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {designer.phone}
                    </div>
                  )}
                  {designer.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {designer.address}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={workload.availabilityStatus === 'available' ? 'default' : 
                          workload.availabilityStatus === 'busy' ? 'secondary' : 'destructive'}
                  className="mb-2"
                >
                  {workload.availabilityStatus === 'available' && 'Rảnh'}
                  {workload.availabilityStatus === 'busy' && 'Bận'}
                  {workload.availabilityStatus === 'overloaded' && 'Quá tải'}
                  {workload.availabilityStatus === 'offline' && 'Offline'}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Gia nhập: {new Date(designer.hireDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Kỹ năng:</p>
              <div className="flex gap-2">
                {designer.skills?.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {designer.certifications && designer.certifications.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Chứng chỉ:</p>
                <div className="flex gap-2">
                  {designer.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};