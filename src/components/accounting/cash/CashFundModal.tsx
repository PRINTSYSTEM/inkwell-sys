import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
// Cash fund endpoints removed from API
// import {
//   useCreateCashFund,
//   useUpdateCashFund,
//   useCashFund,
// } from "@/hooks/use-cash";
// import {
//   CreateCashFundRequestSchema,
//   UpdateCashFundRequestSchema,
//   type CreateCashFundRequest,
//   type UpdateCashFundRequest,
//   type CashFundResponse,
// } from "@/Schema/accounting.schema";

interface CashFundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId?: number | null;
  onSuccess?: () => void;
}

// Cash fund endpoints removed from API - component disabled
export function CashFundModal({
  open,
  onOpenChange,
  fundId,
  onSuccess,
}: CashFundModalProps) {
  return null;
}

