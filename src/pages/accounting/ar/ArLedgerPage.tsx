import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useArLedgerList, useArLedgerSummary } from "@/hooks/use-ar-ledger";

export default function ArLedgerPage() {
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [input, setInput] = useState<string>("");

  const summaryQuery = useArLedgerSummary(customerId);
  const listQuery = useArLedgerList(customerId ? { customerId } : undefined);

  const onSearch = () => {
    const parsed = parseInt(input || "", 10);
    if (!isNaN(parsed)) setCustomerId(parsed);
  };

  return (
    <>
      <Helmet>
        <title>Tra cứu AR Ledger</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tra cứu Ar Ledger</h1>
          <p className="text-muted-foreground">Nhập `customerId` để xem sổ chi tiết và tổng hợp.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="input input-bordered"
            placeholder="Customer ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn-primary" onClick={onSearch}>Tìm</button>
        </div>

        <div>
          <h3 className="font-semibold">Tổng hợp</h3>
          {summaryQuery.isLoading ? (
            <div>Đang tải...</div>
          ) : summaryQuery.data ? (
            <div className="space-y-1 text-sm">
              <div>Khách hàng: {summaryQuery.data.customerName}</div>
              <div>Tổng phải thu: {summaryQuery.data.totalReceivable?.toLocaleString()}</div>
              <div>Đã thu: {summaryQuery.data.totalPaid?.toLocaleString()}</div>
              <div>Còn lại: {summaryQuery.data.totalRemaining?.toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">Chưa có dữ liệu</div>
          )}
        </div>

        <div>
          <h3 className="font-semibold">Chi tiết dòng ledger</h3>
          {listQuery.isLoading ? (
            <div>Đang tải danh sách...</div>
          ) : listQuery.data && listQuery.data.length > 0 ? (
            <table className="w-full table-auto text-sm border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Ngày</th>
                  <th className="p-2">Mã đơn</th>
                  <th className="p-2">Mã thiết kế</th>
                  <th className="p-2">Số lượng</th>
                  <th className="p-2">Thành tiền</th>
                  <th className="p-2">Đã thu</th>
                  <th className="p-2">Còn lại</th>
                  <th className="p-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : "-"}</td>
                    <td className="p-2">{r.orderCode || "-"}</td>
                    <td className="p-2">{r.designCode || "-"}</td>
                    <td className="p-2">{r.deliveredQuantity?.toLocaleString()}</td>
                    <td className="p-2">{r.lineAmount?.toLocaleString()}</td>
                    <td className="p-2">{r.paidAmount?.toLocaleString()}</td>
                    <td className="p-2">{r.remainingAmount?.toLocaleString()}</td>
                    <td className="p-2">{r.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-muted-foreground">Không có dòng nào</div>
          )}
        </div>
      </div>
    </>
  );
}
