import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Design } from '@/types';
import { DesignCodeGenerator, designCodeTemplates } from '@/services/designCodeService';
import { designService } from '@/lib/mockData';

type Props = {
  design: Design;
  onSaved?: (updated: Design) => void;
};

type LocalDesignExtras = {
  paperType?: string;
  material?: string;
  volume?: string;
  weight?: string;
};

export default function AutoDesignCode({ design, onSaved }: Props) {
  const [saving, setSaving] = useState(false);

  const template = useMemo(() => {
    const t = DesignCodeGenerator.getTemplateByType(design.designType);
    return t || designCodeTemplates[0];
  }, [design.designType]);

  const values = useMemo(() => {
    const extras = design as LocalDesignExtras;
    const v: Record<string, string> = {
      orderCode: design.orderNumber || design.orderId || '',
      designType: design.designType || '',
      productType: design.designName || '',
      material: extras.paperType || extras.material || '',
      volume: extras.volume || extras.weight || '',
      dimensions: design.dimensions || '',
      date: design.deliveryDate 
        ? new Date(design.deliveryDate).toLocaleDateString('vi-VN')
        : new Date().toLocaleDateString('vi-VN'),
    };
    return v;
  }, [design]);

  const generated = useMemo(() => {
    try {
      return DesignCodeGenerator.generateCode(template, { ...values });
    } catch (e) {
      return null;
    }
  }, [template, values]);

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.code);
      toast.success('Đã sao chép mã thiết kế');
    } catch (err) {
      toast.error('Không thể sao chép');
    }
  };

  const handleSaveToDesign = async () => {
    if (!generated) return;
    try {
      setSaving(true);
      const updated = await designService.updateDesign(design.id, { designCode: generated.code });
      toast.success('Đã lưu mã thiết kế vào thiết kế');
      onSaved?.(updated);
    } catch (err) {
      toast.error('Không thể lưu mã thiết kế');
    } finally {
      setSaving(false);
    }
  };

  if (!generated) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mã thiết kế (gửi khách)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <code className="font-mono break-all">{generated.code}</code>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" onClick={handleSaveToDesign} disabled={saving}>
              Lưu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}