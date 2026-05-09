import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ARSummaryPage from "./ARSummaryPage";
import ARAgingPage from "./ARAgingPage";

export default function ARPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const defaultTab = tabFromUrl || "summary";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Ensure default tab is "summary" and sync with URL on mount
  useEffect(() => {
    if (!tabFromUrl) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "summary");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams);
  };

  return (
    <>
      <Helmet>
        <title>Công nợ phải thu</title>
        <meta
          name="description"
          content="Quản lý công nợ phải thu - Tổng hợp và Phân tích tuổi nợ"
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Công nợ</TabsTrigger>
            <TabsTrigger value="aging">Phân tích tuổi nợ</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <ARSummaryPage />
          </TabsContent>

          <TabsContent value="aging" className="mt-6">
            <ARAgingPage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
