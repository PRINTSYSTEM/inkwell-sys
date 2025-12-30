import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import APSummaryPage from "./APSummaryPage";
import APDetailPage from "./APDetailPage";
import APAgingPage from "./APAgingPage";

export default function APPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "summary";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    // Keep vendorId if switching to detail tab
    if (value !== "detail") {
      newParams.delete("vendorId");
    }
    setSearchParams(newParams);
  };

  return (
    <>
      <Helmet>
        <title>Công nợ phải trả | Print Production ERP</title>
        <meta
          name="description"
          content="Quản lý công nợ phải trả - Tổng hợp, Chi tiết và Phân tích tuổi nợ"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Công nợ phải trả
          </h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi công nợ phải trả cho nhà cung cấp
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
            <APSummaryPage />
          </TabsContent>

          <TabsContent value="detail" className="mt-6">
            <APDetailPage />
          </TabsContent>

          <TabsContent value="aging" className="mt-6">
            <APAgingPage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

