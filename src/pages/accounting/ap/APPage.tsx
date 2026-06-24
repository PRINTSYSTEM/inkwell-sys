import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import APUnifiedPage from "./APUnifiedPage";
import APAgingPage from "./APAgingPage";
import APItemsPage from "./APItemsPage";
import APDetailPage from "./APDetailPage";

export default function APPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "debt";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    // When switching tabs, clean up detail query params like vendorId
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
          content="Quản lý công nợ phải trả - Tổng hợp, Chi tiết và Bảng kê chi phí"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header - Show only if not in detail ledger view */}
        {activeTab !== "detail" && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Công nợ phải trả
            </h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi công nợ phải trả cho nhà cung cấp
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {activeTab !== "detail" && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="debt">Tổng hợp công nợ</TabsTrigger>
              <TabsTrigger value="items">Bảng kê chi phí</TabsTrigger>
              <TabsTrigger value="aging">Phân tích tuổi nợ</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="debt" className="mt-6">
            <APUnifiedPage />
          </TabsContent>

          <TabsContent value="items" className="mt-6">
            <APItemsPage />
          </TabsContent>

          <TabsContent value="aging" className="mt-6">
            <APAgingPage />
          </TabsContent>

          <TabsContent value="detail" className="mt-6">
            <APDetailPage />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
