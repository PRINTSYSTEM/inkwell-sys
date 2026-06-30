import { Helmet } from "react-helmet-async";
import ARSummaryPage from "./ARSummaryPage";

export default function ARPage() {
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

        {/* Summary Content */}
        <div className="mt-6">
          <ARSummaryPage />
        </div>
      </div>
    </>
  );
}
