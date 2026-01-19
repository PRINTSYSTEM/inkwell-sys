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

      <div className="h-auto flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="flex-shrink-0 px-6 py-3 border-b bg-background">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Công nợ phải thu
            </h1>
            <p className="text-xs text-muted-foreground">
              Quản lý và theo dõi công nợ phải thu từ khách hàng
            </p>
          </div>
        </div>

        {/* Content with Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex-shrink-0 px-6 pt-3 border-b bg-background">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Tổng hợp</TabsTrigger>
                <TabsTrigger value="aging">Phân tích tuổi nợ</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent
              value="summary"
              className="flex-1 mt-0 min-h-0 overflow-hidden"
            >
              <ARSummaryPage />
            </TabsContent>

            <TabsContent
              value="aging"
              className="flex-1 mt-0 min-h-0 overflow-hidden"
            >
              <ARAgingPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
