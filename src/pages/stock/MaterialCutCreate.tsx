import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Calendar,
  CheckCircle2,
  Loader2,
  Scissors,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMaterials } from "@/hooks/use-material";
import { useCreateMaterialCut } from "@/hooks/use-stock";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import type { MaterialResponse } from "@/Schema/material.schema";

interface MaterialSelectorProps {
  value?: number;
  onSelect: (id: number) => void;
  materials: MaterialResponse[];
  placeholder?: string;
  className?: string;
}

function MaterialSelector({
  value,
  onSelect,
  materials,
  placeholder = "Chọn chất liệu",
  className,
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedMaterial = materials.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between text-sm bg-slate-50/50 font-normal border-slate-200",
            className
          )}
        >
          <span className="truncate">
            {selectedMaterial
              ? selectedMaterial.name || selectedMaterial.materialTypeName
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Tìm chất liệu..."
              className="h-9 border-none focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>Không tìm thấy chất liệu nào.</CommandEmpty>
            <CommandGroup>
              {materials.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.name || m.materialTypeName || ""}
                  onSelect={() => {
                    if (m.id) onSelect(m.id);
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === m.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{m.name || m.materialTypeName}</span>
                    <span className="text-xs text-slate-500">Tồn kho: {m.quantity?.toLocaleString() || 0}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function MaterialCutCreatePage() {
  const navigate = useNavigate();
  const { data: materialsData } = useMaterials({ page: 1, size: 1000 });
  const materials = materialsData?.items || [];

  const { mutate: createMaterialCut, isPending } = useCreateMaterialCut();

  const [formData, setFormData] = useState({
    inputMaterialId: null as number | null,
    quantityUsed: 0,
    quantityWasted: 0,
    cutAt: new Date().toISOString().slice(0, 16),
    notes: "",
  });

  const [outputs, setOutputs] = useState<{ outputMaterialId: number | null; quantityProduced: number }[]>([
    { outputMaterialId: null, quantityProduced: 0 },
  ]);

  const handleAddOutput = () => {
    setOutputs([...outputs, { outputMaterialId: null, quantityProduced: 0 }]);
  };

  const handleRemoveOutput = (index: number) => {
    if (outputs.length === 1) return;
    setOutputs(outputs.filter((_, i) => i !== index));
  };

  const handleOutputChange = (index: number, field: string, value: any) => {
    const newOutputs = [...outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    setOutputs(newOutputs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.inputMaterialId) {
      toast.error("Vui lòng chọn nguyên liệu đầu vào");
      return;
    }

    if (formData.quantityUsed + formData.quantityWasted <= 0) {
      toast.error("Tổng số lượng sử dụng và hao hụt phải lớn hơn 0");
      return;
    }

    const validOutputs = outputs.filter(o => o.outputMaterialId !== null && o.quantityProduced >= 1);
    
    if (validOutputs.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm đầu ra hợp lệ (số lượng >= 1)");
      return;
    }

    // Check for duplicate outputs
    const outputIds = validOutputs.map(o => o.outputMaterialId);
    if (new Set(outputIds).size !== outputIds.length) {
      toast.error("Không được chọn trùng sản phẩm đầu ra");
      return;
    }

    // Check if input is same as any output
    if (outputIds.includes(formData.inputMaterialId)) {
      toast.error("Sản phẩm đầu ra không được trùng với nguyên liệu đầu vào");
      return;
    }

    createMaterialCut({
      inputMaterialId: formData.inputMaterialId,
      quantityUsed: formData.quantityUsed,
      quantityWasted: formData.quantityWasted,
      cutAt: formData.cutAt ? new Date(formData.cutAt).toISOString() : undefined,
      notes: formData.notes.trim() || undefined,
      outputs: validOutputs.map(o => ({
        outputMaterialId: o.outputMaterialId!,
        quantityProduced: o.quantityProduced
      }))
    }, {
      onSuccess: (data: any) => {
        if (data?.id) {
          navigate(`/stock/material-cuts/${data.id}`);
        } else {
          navigate("/stock/material-cuts");
        }
      }
    });
  };

  const selectedInputMaterial = materials.find(m => m.id === formData.inputMaterialId);

  return (
    <>
      <Helmet>
        <title>Tạo phiếu cắt nguyên liệu | Print Production ERP</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tạo phiếu cắt nguyên liệu</h1>
                <p className="text-sm text-muted-foreground">Lập phiếu chia nhỏ vật tư, cập nhật tồn kho</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Lưu phiếu nháp
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Header Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-base">Thông tin nguyên liệu</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Nguyên liệu cần cắt *</Label>
                    <MaterialSelector
                      value={formData.inputMaterialId || undefined}
                      onSelect={(id) => setFormData({ ...formData, inputMaterialId: id })}
                      materials={materials}
                    />
                    {selectedInputMaterial && (
                      <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 flex justify-between">
                        <span>Tồn kho hiện tại:</span>
                        <span className="font-bold">{selectedInputMaterial.quantity?.toLocaleString() || 0} {selectedInputMaterial.unit || ""}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantityUsed" className="text-sm font-semibold">Số lượng sử dụng *</Label>
                      <Input
                        id="quantityUsed"
                        type="number"
                        min="0"
                        value={formData.quantityUsed}
                        onChange={(e) => setFormData({ ...formData, quantityUsed: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantityWasted" className="text-sm font-semibold">Hao hụt</Label>
                      <Input
                        id="quantityWasted"
                        type="number"
                        min="0"
                        value={formData.quantityWasted}
                        onChange={(e) => setFormData({ ...formData, quantityWasted: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cutAt" className="text-sm font-semibold">Ngày thực hiện</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="cutAt"
                        type="datetime-local"
                        className="pl-10"
                        value={formData.cutAt}
                        onChange={(e) => setFormData({ ...formData, cutAt: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ghi chú thêm về việc cắt nguyên liệu..."
                      className="min-h-[100px] resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Outputs List */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 shadow-sm h-full">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-base">Sản phẩm đầu ra</CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOutput}
                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm sản phẩm
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/30">
                        <TableHead className="w-[50px] text-center">STT</TableHead>
                        <TableHead>Sản phẩm đầu ra (Chất liệu mới) *</TableHead>
                        <TableHead className="w-[200px] text-right">Số lượng sản xuất *</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outputs.map((output, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center font-medium text-slate-400">{index + 1}</TableCell>
                          <TableCell>
                            <MaterialSelector
                              value={output.outputMaterialId || undefined}
                              onSelect={(id) => handleOutputChange(index, "outputMaterialId", id)}
                              materials={materials}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              className="text-right h-10"
                              value={output.quantityProduced}
                              onChange={(e) => handleOutputChange(index, "quantityProduced", Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOutput(index)}
                              disabled={outputs.length === 1}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {outputs.length === 0 && (
                    <div className="py-12 text-center text-slate-500">
                      Chưa có sản phẩm đầu ra nào. Nhấn "Thêm sản phẩm" để bắt đầu.
                    </div>
                  )}
                  
                  <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                      <span>Tổng sản lượng dự kiến:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {outputs.reduce((sum, o) => sum + (o.quantityProduced || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    {selectedInputMaterial && (
                      <div className="mt-2 flex justify-between items-center text-xs text-slate-500 italic">
                        <span>Lưu ý: Hiệu suất cắt = {(outputs.reduce((sum, o) => sum + (o.quantityProduced || 0), 0) / (formData.quantityUsed || 1) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
