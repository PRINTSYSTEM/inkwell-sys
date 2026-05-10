import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendor } from "@/hooks/use-vendor";
import { VendorHeader, VendorProfile } from "@/components/vendors";
import { VendorHistoryTab } from "@/components/vendors/tabs/VendorHistoryTab";
import { VendorDebtTab } from "@/components/vendors/tabs/VendorDebtTab";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vendorId = id && !isNaN(Number(id)) && Number(id) > 0 ? Number(id) : null;
  const [activeTab, setActiveTab] = useState("debt");

  const { data: vendor, isLoading, error } = useVendor(vendorId, !!vendorId);

  if (isLoading) {
    return (
      <div className="h-full bg-background">
        <div className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-[380px_1fr] gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            ID nhà cung cấp không hợp lệ
          </p>
          <p className="text-sm text-muted-foreground">
            Vui lòng kiểm tra lại đường dẫn URL
          </p>
        </div>
      </div>
    );
  }

  if (error || (!isLoading && !vendor)) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            Không tìm thấy nhà cung cấp
          </p>
          <p className="text-sm text-muted-foreground">
            Nhà cung cấp với ID {vendorId} không tồn tại hoặc đã bị xóa
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {vendor.name || "Nhà cung cấp"} - Nhà cung cấp | Print System
        </title>
      </Helmet>

      <div className="h-full bg-background flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <VendorHeader 
          vendor={vendor} 
          onEdit={() => navigate(`/vendors/${vendor.id}/edit`)} 
        />

        {/* Body */}
        <div className="flex-1 overflow-hidden p-6">
          {/* Layout 2 cột cho Admin/Accounting */}
          <div className="grid grid-cols-[380px_1fr] gap-6 h-full">
            {/* Left Column: Profile */}
            <VendorProfile vendor={vendor} />

            {/* Right Column: Tabs */}
            <div className="flex flex-col min-w-0 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col min-w-0 overflow-hidden"
              >
                <TabsList className="w-fit mb-3 flex-shrink-0">
                  <TabsTrigger value="debt" className="text-sm">
                    Công nợ
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-sm">
                    Lịch sử giao dịch
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="debt"
                  className="flex-1 mt-0 overflow-hidden bg-card border rounded-lg p-6 shadow-sm"
                >
                  <VendorDebtTab vendor={vendor} />
                </TabsContent>

                <TabsContent
                  value="history"
                  className="flex-1 mt-0 min-w-0 overflow-hidden bg-card border rounded-lg p-6 shadow-sm"
                >
                  <VendorHistoryTab vendorId={vendor.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
