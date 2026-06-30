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
import { CreateMaterialDialog } from "./components/CreateMaterialDialog";

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
            "h-10 w-full justify-between text-sm font-normal",
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
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
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
                    <span className="text-xs text-slate-500">Tồn kho: {m.currentStock?.toLocaleString() || 0}</span>
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
  
  const inputMaterials = materials.filter(m => m.type === "cuon");
  const outputMaterials = materials.filter(m => m.type === "to");

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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeOutputIndex, setActiveOutputIndex] = useState<number | null>(null);

  const handleCreateSuccess = (newMaterialId: number) => {
    if (activeOutputIndex !== null) {
      handleOutputChange(activeOutputIndex, "outputMaterialId", newMaterialId);
    } else {
      // If activeOutputIndex is null, it was for the input material
      setFormData({ ...formData, inputMaterialId: newMaterialId });
    }
    setActiveOutputIndex(null);
  };

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
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }

    const validOutputs = outputs.filter(o => o.outputMaterialId !== null && o.quantityProduced >= 1);
    
    if (validOutputs.length === 0) {
      toast.error("Vui lòng thêm sản phẩm đầu ra");
      return;
    }

    createMaterialCut({
      inputMaterialId: formData.inputMaterialId,
      quantityUsed: Math.round(formData.quantityUsed),
      quantityWasted: Math.round(formData.quantityWasted),
      cutAt: formData.cutAt ? new Date(formData.cutAt).toISOString() : undefined,
      notes: formData.notes.trim() || undefined,
      outputs: validOutputs.map(o => ({
        outputMaterialId: o.outputMaterialId!,
        quantityProduced: o.quantityProduced
      }))
    }, {
      onSuccess: (data: any) => {
        navigate(data?.id ? `/stock/material-cuts/${data.id}` : "/stock/material-cuts");
      }
    });
  };

  const selectedInputMaterial = materials.find(m => m.id === formData.inputMaterialId);

  return (
    <>
      <Helmet>
        <title>Tạo phiếu cắt | Inkwell System</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
              </Button>
              <h1 className="text-xl font-bold text-slate-900">Tạo phiếu cắt nguyên liệu</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={isPending}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Lưu phiếu
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="py-4 border-b border-slate-100">
                  <CardTitle className="text-base font-semibold">Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Nguyên liệu đầu vào *</Label>
                     <MaterialSelector
                       value={formData.inputMaterialId || undefined}
                       onSelect={(id) => setFormData({ ...formData, inputMaterialId: id })}
                       materials={inputMaterials}
                     />
                    {selectedInputMaterial && (
                      <p className="text-xs text-blue-600 font-medium">Tồn hiện tại: {selectedInputMaterial.currentStock?.toLocaleString()} {selectedInputMaterial.unit}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Sử dụng *</Label>
                      <Input type="number" min="0" value={formData.quantityUsed} onChange={(e) => setFormData({ ...formData, quantityUsed: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Hao hụt</Label>
                      <Input type="number" min="0" value={formData.quantityWasted} onChange={(e) => setFormData({ ...formData, quantityWasted: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Ngày thực hiện</Label>
                    <Input type="datetime-local" value={formData.cutAt} onChange={(e) => setFormData({ ...formData, cutAt: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Ghi chú</Label>
                    <Textarea className="min-h-[80px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Sản phẩm đầu ra</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOutput} className="h-8 text-blue-600 border-blue-200">
                    <Plus className="h-4 w-4 mr-1" /> Thêm dòng
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[50px] text-center">STT</TableHead>
                        <TableHead>Vật liệu đầu ra *</TableHead>
                        <TableHead className="w-[150px] text-right">Số lượng *</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outputs.map((output, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center text-slate-400">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <MaterialSelector
                                value={output.outputMaterialId || undefined}
                                onSelect={(id) => handleOutputChange(index, "outputMaterialId", id)}
                                materials={outputMaterials}
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                className="h-10 w-10 shrink-0"
                                onClick={() => {
                                  setActiveOutputIndex(index);
                                  setCreateDialogOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="1" className="text-right" value={output.quantityProduced} onChange={(e) => handleOutputChange(index, "quantityProduced", Number(e.target.value))} />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOutput(index)} disabled={outputs.length === 1} className="text-slate-400 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-600">Tổng sản lượng:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {outputs.reduce((sum, o) => sum + (o.quantityProduced || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>

      <CreateMaterialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        showQuantity={false}
        defaultMaterialTypeId={selectedInputMaterial?.materialTypeId}
      />
    </>
  );
}
