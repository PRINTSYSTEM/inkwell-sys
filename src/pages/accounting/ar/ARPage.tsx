import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ARSummaryPage from "./ARSummaryPage";
import ARDetailPage from "./ARDetailPage";
import ARAgingPage from "./ARAgingPage";

export default function ARPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "summary";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    // Keep customerId if switching to detail tab
    if (value !== "detail") {
      newParams.delete("customerId");
    }
    setSearchParams(newParams);
  };

  return (
    <>
      <Helmet>
        <title>Công nợ phải thu | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý công nợ phải thu - Tổng hợp, Chi tiết và Phân tích tuổi nợ"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Công nợ phải thu
          </h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi công nợ phải thu từ khách hàng
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Tổng hợp</TabsTrigger>
            <TabsTrigger value="detail">Chi tiết</TabsTrigger>
            <TabsTrigger value="aging">Phân tích tuổi nợ</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <ARSummaryPage />
          </TabsContent>

          <TabsContent value="detail" className="mt-6">
            <ARDetailPage />
          </TabsContent>

          <TabsContent value="aging" className="mt-6">
            <ARAgingPage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

