import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Client,
  ClientGroup,
  ClientGroupInput,
  ClientId,
  ClientInput,
  GroupId,
  Script,
  ScriptInput,
} from "./backend.d";
import {
  CallStatus,
  type ColdCallEntry,
  type ColdCallEntryInput,
  useColdCalls,
} from "./hooks/useColdCalls";
import { useHostingState } from "./hooks/useHostingState";
import {
  useAddClient,
  useAddClientGroup,
  useAddScript,
  useDeleteClient,
  useDeleteClientGroup,
  useDeleteScript,
  useGetClientGroups,
  useGetClients,
  useGetScripts,
  useUpdateClient,
  useUpdateClientGroup,
  useUpdateScript,
} from "./hooks/useQueries";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  CallStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  [CallStatus.interested]: {
    label: "Interested",
    color: "text-emerald-300",
    bg: "bg-emerald-950/60 border border-emerald-700/40",
    dot: "bg-emerald-400",
  },
  [CallStatus.callback]: {
    label: "Callback",
    color: "text-blue-300",
    bg: "bg-blue-950/60 border border-blue-700/40",
    dot: "bg-blue-400",
  },
  [CallStatus.noAnswer]: {
    label: "No Answer",
    color: "text-slate-400",
    bg: "bg-slate-800/60 border border-slate-600/40",
    dot: "bg-slate-500",
  },
  [CallStatus.notInterested]: {
    label: "Not Interested",
    color: "text-red-300",
    bg: "bg-red-950/60 border border-red-700/40",
    dot: "bg-red-400",
  },
  [CallStatus.voicemail]: {
    label: "Voicemail",
    color: "text-amber-300",
    bg: "bg-amber-950/60 border border-amber-700/40",
    dot: "bg-amber-400",
  },
  [CallStatus.purchased]: {
    label: "Purchased",
    color: "text-violet-300",
    bg: "bg-violet-950/60 border border-violet-700/40",
    dot: "bg-violet-500",
  },
};

const STATUS_ORDER: CallStatus[] = [
  CallStatus.interested,
  CallStatus.callback,
  CallStatus.noAnswer,
  CallStatus.notInterested,
  CallStatus.voicemail,
  CallStatus.purchased,
];

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CallStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}

// ── Blank call form ────────────────────────────────────────────────────────
const BLANK_CALL_FORM: ColdCallEntryInput = {
  contactName: "",
  company: "",
  phone: "",
  callDate: new Date().toISOString().split("T")[0],
  status: CallStatus.noAnswer,
  notes: "",
};

// ── Call Form Dialog ───────────────────────────────────────────────────────
interface CallFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingEntry: ColdCallEntry | null;
  onAdd: (input: ColdCallEntryInput) => void;
  onUpdate: (id: string, input: ColdCallEntryInput) => void;
}

function CallFormDialog({
  open,
  onOpenChange,
  editingEntry,
  onAdd,
  onUpdate,
}: CallFormDialogProps) {
  const [form, setForm] = useState<ColdCallEntryInput>(
    editingEntry
      ? {
          contactName: editingEntry.contactName,
          company: editingEntry.company,
          phone: editingEntry.phone,
          callDate: editingEntry.callDate,
          status: editingEntry.status,
          notes: editingEntry.notes ?? "",
        }
      : BLANK_CALL_FORM,
  );
  const [isPending, setIsPending] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        editingEntry
          ? {
              contactName: editingEntry.contactName,
              company: editingEntry.company,
              phone: editingEntry.phone,
              callDate: editingEntry.callDate,
              status: editingEntry.status,
              notes: editingEntry.notes ?? "",
            }
          : {
              ...BLANK_CALL_FORM,
              callDate: new Date().toISOString().split("T")[0],
            },
      );
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const input: ColdCallEntryInput = {
        ...form,
        notes: form.notes || undefined,
      };
      if (editingEntry) {
        onUpdate(editingEntry.id, input);
        toast.success("Call updated successfully");
      } else {
        onAdd(input);
        toast.success("Call logged successfully");
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const set = <K extends keyof ColdCallEntryInput>(
    key: K,
    val: ColdCallEntryInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="call_form.dialog"
        className="bg-card border-border text-foreground max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {editingEntry ? "Edit Call" : "Log New Call"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="cf-contactName"
                className="text-sm font-medium text-muted-foreground"
              >
                Contact Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="cf-contactName"
                data-ocid="call_form.contact_input"
                required
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="Jane Smith"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="cf-company"
                className="text-sm font-medium text-muted-foreground"
              >
                Company <span className="text-primary">*</span>
              </Label>
              <Input
                id="cf-company"
                data-ocid="call_form.company_input"
                required
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Corp"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="cf-phone"
                className="text-sm font-medium text-muted-foreground"
              >
                Phone <span className="text-primary">*</span>
              </Label>
              <Input
                id="cf-phone"
                data-ocid="call_form.phone_input"
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="cf-callDate"
                className="text-sm font-medium text-muted-foreground"
              >
                Call Date <span className="text-primary">*</span>
              </Label>
              <Input
                id="cf-callDate"
                data-ocid="call_form.date_input"
                required
                type="date"
                value={form.callDate}
                onChange={(e) => set("callDate", e.target.value)}
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cf-status"
              className="text-sm font-medium text-muted-foreground"
            >
              Status <span className="text-primary">*</span>
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as CallStatus)}
            >
              <SelectTrigger
                id="cf-status"
                data-ocid="call_form.status_select"
                className="bg-muted border-border focus:ring-primary"
              >
                <SelectValue placeholder="Select status…" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`}
                      />
                      {STATUS_CONFIG[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cf-notes"
              className="text-sm font-medium text-muted-foreground"
            >
              Notes{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="cf-notes"
              data-ocid="call_form.notes_textarea"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Add any relevant notes…"
              rows={3}
              className="bg-muted border-border focus-visible:ring-primary resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="call_form.cancel_button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="call_form.submit_button"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingEntry ? "Save Changes" : "Log Call"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Script Form Dialog ─────────────────────────────────────────────────────
interface ScriptFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingScript: Script | null;
}

const BLANK_SCRIPT_FORM: ScriptInput = {
  title: "",
  content: "",
  category: "",
};

function ScriptFormDialog({
  open,
  onOpenChange,
  editingScript,
}: ScriptFormDialogProps) {
  const [form, setForm] = useState<ScriptInput>(
    editingScript
      ? {
          title: editingScript.title,
          content: editingScript.content,
          category: editingScript.category ?? "",
        }
      : BLANK_SCRIPT_FORM,
  );

  const addScript = useAddScript();
  const updateScript = useUpdateScript();
  const isPending = addScript.isPending || updateScript.isPending;

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        editingScript
          ? {
              title: editingScript.title,
              content: editingScript.content,
              category: editingScript.category ?? "",
            }
          : { ...BLANK_SCRIPT_FORM },
      );
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const input: ScriptInput = {
        title: form.title,
        content: form.content,
        category: form.category || undefined,
      };
      if (editingScript) {
        await updateScript.mutateAsync({ id: editingScript.id, input });
        toast.success("Script updated");
      } else {
        await addScript.mutateAsync(input);
        toast.success("Script saved");
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const set = <K extends keyof ScriptInput>(key: K, val: ScriptInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="script_form.dialog"
        className="bg-card border-border text-foreground max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {editingScript ? "Edit Script" : "New Script"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="sf-title"
                className="text-sm font-medium text-muted-foreground"
              >
                Title <span className="text-primary">*</span>
              </Label>
              <Input
                id="sf-title"
                data-ocid="script_form.title_input"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Opening Pitch"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="sf-category"
                className="text-sm font-medium text-muted-foreground"
              >
                Category{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="sf-category"
                data-ocid="script_form.category_input"
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Opener, Objection, Closing"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="sf-content"
              className="text-sm font-medium text-muted-foreground"
            >
              Script Content <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="sf-content"
              data-ocid="script_form.content_textarea"
              required
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Write your script here…"
              rows={10}
              className="bg-muted border-border focus-visible:ring-primary resize-y font-mono text-sm leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="script_form.cancel_button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="script_form.submit_button"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingScript ? "Save Changes" : "Save Script"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [mainTab, setMainTab] = useState<
    "calls" | "scripts" | "future_clients" | "purchased_clients"
  >("calls");
  const [callsFormOpen, setCallsFormOpen] = useState(false);
  const [scriptsFormOpen, setScriptsFormOpen] = useState(false);
  const [clientsGroupFormOpen, setClientsGroupFormOpen] = useState(false);
  const [inlineClientsGroupFormOpen, setInlineClientsGroupFormOpen] =
    useState(false);

  const { entries, addEntry, updateEntry, deleteEntry } = useColdCalls();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Toaster theme="dark" />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header
          data-ocid="header.section"
          className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/hotbox-vault-logo-transparent.dim_200x200.png"
                alt="HotBox Vault Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground leading-none">
                  HotBox Vault
                </h1>
              </div>
            </div>

            {mainTab === "calls" ? (
              <Button
                data-ocid="calls.add_button"
                onClick={() => setCallsFormOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Log Call
              </Button>
            ) : mainTab === "scripts" ? (
              <Button
                data-ocid="scripts.add_button"
                onClick={() => setScriptsFormOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                New Script
              </Button>
            ) : mainTab === "purchased_clients" ? null : (
              <Button
                data-ocid="future_clients.add_button"
                onClick={() => setClientsGroupFormOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Group
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          {/* ── Main Nav Tabs ──────────────────────────────────────────── */}
          <Tabs
            value={mainTab}
            onValueChange={(v) =>
              setMainTab(
                v as
                  | "calls"
                  | "scripts"
                  | "future_clients"
                  | "purchased_clients",
              )
            }
          >
            <TabsList className="bg-card border border-border p-1 h-auto mb-0 w-fit">
              <TabsTrigger
                value="calls"
                data-ocid="calls.tab"
                className="gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2"
              >
                <Phone className="w-4 h-4" />
                Cold Calls
              </TabsTrigger>
              <TabsTrigger
                value="scripts"
                data-ocid="scripts.tab"
                className="gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2"
              >
                <FileText className="w-4 h-4" />
                Scripts
              </TabsTrigger>
              <TabsTrigger
                value="future_clients"
                data-ocid="future_clients.tab"
                className="gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2"
              >
                <Users className="w-4 h-4" />
                Future Clients
              </TabsTrigger>
              <TabsTrigger
                value="purchased_clients"
                data-ocid="purchased_clients.tab"
                className="gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2"
              >
                <UserCheck className="w-4 h-4" />
                Clients
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calls" className="mt-6 space-y-10">
              <CallsSectionWithExternalTrigger
                entries={entries}
                addEntry={addEntry}
                updateEntry={updateEntry}
                deleteEntry={deleteEntry}
                externalFormOpen={callsFormOpen}
                onExternalFormOpenChange={(v) => {
                  setCallsFormOpen(v);
                }}
              />

              {/* ── Future Clients (inline) ──────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-lg font-bold text-foreground">
                      Future Clients
                    </h2>
                  </div>
                  <Button
                    data-ocid="calls.future_clients.add_button"
                    onClick={() => setInlineClientsGroupFormOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:text-foreground gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Group
                  </Button>
                </div>
                <ClientsSectionWithExternalTrigger
                  externalFormOpen={inlineClientsGroupFormOpen}
                  onExternalFormOpenChange={setInlineClientsGroupFormOpen}
                />
              </div>
            </TabsContent>

            <TabsContent value="scripts" className="mt-6">
              <ScriptsSectionWithExternalTrigger
                externalFormOpen={scriptsFormOpen}
                onExternalFormOpenChange={(v) => {
                  setScriptsFormOpen(v);
                }}
              />
            </TabsContent>

            <TabsContent value="future_clients" className="mt-6">
              <ClientsSectionWithExternalTrigger
                externalFormOpen={clientsGroupFormOpen}
                onExternalFormOpenChange={(v) => {
                  setClientsGroupFormOpen(v);
                }}
              />
            </TabsContent>

            <TabsContent value="purchased_clients" className="mt-6">
              <PurchasedClientsTab entries={entries} />
            </TabsContent>
          </Tabs>
        </main>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HotBox Vault. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </TooltipProvider>
  );
}

// ── Purchased Clients Tab ──────────────────────────────────────────────────
interface PurchasedClientsTabProps {
  entries: ColdCallEntry[];
}

function PurchasedClientsTab({ entries }: PurchasedClientsTabProps) {
  const { isHosting, toggle } = useHostingState();
  const purchased = entries.filter((e) => e.status === CallStatus.purchased);

  const formatDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (purchased.length === 0) {
    return (
      <motion.div
        data-ocid="purchased_clients.empty_state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border border-border rounded-xl"
      >
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
          <UserCheck className="w-6 h-6 text-violet-400" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-1">
          No purchased clients yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Mark a cold call as{" "}
          <span className="text-violet-400 font-medium">Purchased</span> to see
          it here.
        </p>
      </motion.div>
    );
  }

  return (
    <div
      data-ocid="purchased_clients.section"
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-violet-950/20 flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-violet-400" />
        <h2 className="font-display text-base font-bold text-foreground">
          Clients
        </h2>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
          {purchased.length} {purchased.length === 1 ? "client" : "clients"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[160px]">
                Contact
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[160px]">
                Company
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[140px]">
                Phone
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[110px]">
                Date
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Notes
              </TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[80px] text-center">
                Hosting?
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {purchased.map((entry, idx) => (
                <motion.tr
                  key={entry.id}
                  data-ocid={`purchased_clients.item.${idx + 1}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="border-border hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="font-medium text-foreground py-3">
                    {entry.contactName}
                  </TableCell>
                  <TableCell className="text-muted-foreground py-3">
                    {entry.company}
                  </TableCell>
                  <TableCell className="py-3">
                    <a
                      href={`tel:${entry.phone}`}
                      className="text-primary hover:underline font-mono text-sm"
                    >
                      {entry.phone}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-3 text-sm">
                    {formatDate(entry.callDate)}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground max-w-[220px]">
                    {entry.notes ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="line-clamp-1 cursor-default">
                            {entry.notes}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-popover border-border">
                          {entry.notes}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground/40 italic text-xs">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Checkbox
                        data-ocid={`purchased_clients.checkbox.${idx + 1}`}
                        checked={isHosting(entry.id)}
                        onCheckedChange={() => toggle(entry.id)}
                        className="border-violet-500/50 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                        aria-label={`Hosting for ${entry.contactName}`}
                      />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Hosting?
                      </span>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Wrappers that accept external open triggers from the header CTA
interface WithExternalTriggerProps {
  externalFormOpen: boolean;
  onExternalFormOpenChange: (v: boolean) => void;
}

interface CallsSectionProps extends WithExternalTriggerProps {
  entries: ColdCallEntry[];
  addEntry: (input: ColdCallEntryInput) => ColdCallEntry;
  updateEntry: (id: string, input: ColdCallEntryInput) => ColdCallEntry;
  deleteEntry: (id: string) => void;
}

function CallsSectionWithExternalTrigger({
  entries,
  addEntry,
  updateEntry,
  deleteEntry,
  externalFormOpen,
  onExternalFormOpenChange,
}: CallsSectionProps) {
  const [editingEntry, setEditingEntry] = useState<ColdCallEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = {
    total: entries.length,
    interested: entries.filter((e) => e.status === CallStatus.interested)
      .length,
    callback: entries.filter((e) => e.status === CallStatus.callback).length,
    noAnswer: entries.filter((e) => e.status === CallStatus.noAnswer).length,
    notInterested: entries.filter((e) => e.status === CallStatus.notInterested)
      .length,
    voicemail: entries.filter((e) => e.status === CallStatus.voicemail).length,
    purchased: entries.filter((e) => e.status === CallStatus.purchased).length,
  };

  const filtered =
    activeFilter === "all"
      ? entries
      : entries.filter((e) => e.status === activeFilter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.callDate).getTime() - new Date(a.callDate).getTime(),
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      deleteEntry(deletingId);
      toast.success("Call removed");
    } catch {
      toast.error("Failed to delete call");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleFormOpenChange = (v: boolean) => {
    onExternalFormOpenChange(v);
    if (!v) setEditingEntry(null);
  };

  return (
    <div data-ocid="calls.section" className="space-y-6">
      {/* Stats */}
      <motion.div
        data-ocid="stats.section"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total
          </span>
          <span className="text-3xl font-display font-extrabold text-foreground">
            {stats.total}
          </span>
        </div>
        {[
          {
            key: "interested",
            label: "Interested",
            count: stats.interested,
            color: "text-emerald-400",
          },
          {
            key: "callback",
            label: "Callback",
            count: stats.callback,
            color: "text-blue-400",
          },
          {
            key: "noAnswer",
            label: "No Answer",
            count: stats.noAnswer,
            color: "text-slate-400",
          },
          {
            key: "notInterested",
            label: "Not Interested",
            count: stats.notInterested,
            color: "text-red-400",
          },
          {
            key: "voicemail",
            label: "Voicemail",
            count: stats.voicemail,
            color: "text-amber-400",
          },
          {
            key: "purchased",
            label: "Purchased",
            count: stats.purchased,
            color: "text-violet-400",
          },
        ].map((s) => (
          <div
            key={s.key}
            className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
              {s.label}
            </span>
            <span className={`text-3xl font-display font-extrabold ${s.color}`}>
              {s.count}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <Tabs
            value={activeFilter}
            onValueChange={setActiveFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-muted p-1 flex flex-wrap gap-0.5 h-auto">
              <TabsTrigger
                value="all"
                data-ocid="calls.filter.tab"
                className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground px-3 py-1.5"
              >
                All ({stats.total})
              </TabsTrigger>
              {STATUS_ORDER.map((s) => {
                const count = entries.filter((e) => e.status === s).length;
                return (
                  <TabsTrigger
                    key={s}
                    value={s}
                    data-ocid="calls.filter.tab"
                    className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground px-3 py-1.5"
                  >
                    {STATUS_CONFIG[s].label} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {sorted.length === 0 ? (
          <div
            data-ocid="calls.empty_state"
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              {activeFilter === "all"
                ? "No calls logged yet"
                : `No ${STATUS_CONFIG[activeFilter as CallStatus]?.label} calls`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {activeFilter === "all"
                ? "Start tracking your cold calls by clicking Log Call above."
                : "No calls with this status. Try a different filter."}
            </p>
            {activeFilter === "all" && (
              <Button
                onClick={() => {
                  setEditingEntry(null);
                  onExternalFormOpenChange(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Log Your First Call
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="calls.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[160px]">
                    Contact
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[160px]">
                    Company
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[140px]">
                    Phone
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[110px]">
                    Date
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-semibond uppercase tracking-wider w-[140px]">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    Notes
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[90px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {sorted.map((entry, idx) => (
                    <motion.tr
                      key={entry.id}
                      data-ocid={`calls.item.${idx + 1}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="border-border hover:bg-accent/30 transition-colors group"
                    >
                      <TableCell className="font-medium text-foreground py-3">
                        {entry.contactName}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-3">
                        {entry.company}
                      </TableCell>
                      <TableCell className="py-3">
                        <a
                          href={`tel:${entry.phone}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {entry.phone}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-3 text-sm">
                        {formatDate(entry.callDate)}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={entry.status} />
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground max-w-[220px]">
                        {entry.notes ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="line-clamp-1 cursor-default">
                                {entry.notes}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-popover border-border">
                              {entry.notes}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground/40 italic text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-ocid={`calls.edit_button.${idx + 1}`}
                                onClick={() => {
                                  setEditingEntry(entry);
                                  onExternalFormOpenChange(true);
                                }}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-ocid={`calls.delete_button.${idx + 1}`}
                                onClick={() => setDeletingId(entry.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Purchased Section */}
      {(() => {
        const purchasedEntries = entries.filter(
          (e) => e.status === CallStatus.purchased,
        );
        return (
          <motion.div
            data-ocid="purchased_clients.section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck className="w-5 h-5 text-violet-400" />
              <h2 className="font-display text-lg font-bold text-foreground">
                Purchased
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                {purchasedEntries.length}
              </span>
            </div>

            {purchasedEntries.length === 0 ? (
              <div
                data-ocid="purchased_clients.empty_state"
                className="bg-card border border-border rounded-xl px-6 py-8 flex items-center gap-3 text-muted-foreground"
              >
                <BadgeCheck className="w-4 h-4 text-violet-400/50 shrink-0" />
                <span className="text-sm italic">
                  No purchased calls yet — mark a call as Purchased to see it
                  here.
                </span>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[160px]">
                          Contact
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[160px]">
                          Company
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[140px]">
                          Phone
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider w-[110px]">
                          Date
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchasedEntries.map((entry, idx) => (
                        <TableRow
                          key={entry.id}
                          data-ocid={`purchased_clients.item.${idx + 1}`}
                          className="border-border hover:bg-accent/30 transition-colors"
                        >
                          <TableCell className="font-medium text-foreground py-3">
                            {entry.contactName}
                          </TableCell>
                          <TableCell className="text-muted-foreground py-3">
                            {entry.company}
                          </TableCell>
                          <TableCell className="py-3">
                            <a
                              href={`tel:${entry.phone}`}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {entry.phone}
                            </a>
                          </TableCell>
                          <TableCell className="text-muted-foreground py-3 text-sm">
                            {formatDate(entry.callDate)}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-muted-foreground max-w-[220px]">
                            {entry.notes ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="line-clamp-1 cursor-default">
                                    {entry.notes}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-popover border-border">
                                  {entry.notes}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground/40 italic text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* Call Form */}
      <CallFormDialog
        open={externalFormOpen}
        onOpenChange={handleFormOpenChange}
        editingEntry={editingEntry}
        onAdd={addEntry}
        onUpdate={updateEntry}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent
          data-ocid="delete_confirm.dialog"
          className="bg-card border-border text-foreground"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold">
              Remove Call Record?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The call record will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="delete_confirm.cancel_button"
              className="bg-muted border-border text-foreground hover:bg-accent"
              onClick={() => setDeletingId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="delete_confirm.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScriptsSectionWithExternalTrigger({
  externalFormOpen,
  onExternalFormOpenChange,
}: WithExternalTriggerProps) {
  const { data: scripts = [], isLoading } = useGetScripts();
  const deleteScript = useDeleteScript();

  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = Array.from(
    new Set(scripts.map((s) => s.category).filter(Boolean) as string[]),
  ).sort();

  const filtered =
    activeCategory === "all"
      ? scripts
      : scripts.filter((s) => s.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    return Number(b.updatedAt) - Number(a.updatedAt);
  });

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      await deleteScript.mutateAsync(deletingId);
      toast.success("Script deleted");
    } catch {
      toast.error("Failed to delete script");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormOpenChange = (v: boolean) => {
    onExternalFormOpenChange(v);
    if (!v) setEditingScript(null);
  };

  return (
    <div data-ocid="scripts.section" className="space-y-6">
      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            All ({scripts.length})
          </button>
          {categories.map((cat) => {
            const count = scripts.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div
          data-ocid="scripts.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {["sk1", "sk2", "sk3"].map((k) => (
            <Skeleton key={k} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <motion.div
          data-ocid="scripts.empty_state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border border-border rounded-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">
            {activeCategory === "all"
              ? "No scripts yet"
              : `No scripts in "${activeCategory}"`}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            {activeCategory === "all"
              ? "Write your cold call scripts to stay consistent on every call."
              : "No scripts in this category. Try a different filter."}
          </p>
          {activeCategory === "all" && (
            <Button
              onClick={() => {
                setEditingScript(null);
                onExternalFormOpenChange(true);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              Write Your First Script
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {sorted.map((script, idx) => (
              <motion.div
                key={script.id.toString()}
                data-ocid={`scripts.item.${idx + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="group bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base text-foreground leading-tight truncate">
                      {script.title}
                    </h3>
                    {script.category && (
                      <Badge
                        variant="secondary"
                        className="mt-1.5 text-xs bg-primary/15 text-primary border-primary/20 border"
                      >
                        {script.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`scripts.edit_button.${idx + 1}`}
                          onClick={() => {
                            setEditingScript(script);
                            onExternalFormOpenChange(true);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`scripts.delete_button.${idx + 1}`}
                          onClick={() => setDeletingId(script.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 flex-1">
                  {script.content}
                </p>

                <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground/60">
                  Updated{" "}
                  {new Date(
                    Number(script.updatedAt) / 1_000_000,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Script Form */}
      <ScriptFormDialog
        open={externalFormOpen}
        onOpenChange={handleFormOpenChange}
        editingScript={editingScript}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(v) => !v && setDeletingId(null)}
      >
        <AlertDialogContent
          data-ocid="script_delete_confirm.dialog"
          className="bg-card border-border text-foreground"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold">
              Delete Script?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The script will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="script_delete_confirm.cancel_button"
              className="bg-muted border-border text-foreground hover:bg-accent"
              onClick={() => setDeletingId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="script_delete_confirm.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
              disabled={deleteScript.isPending}
            >
              {deleteScript.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Client Group Form Dialog ───────────────────────────────────────────────
interface ClientGroupFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingGroup: ClientGroup | null;
}

const BLANK_GROUP_FORM: ClientGroupInput = { name: "", description: "" };

function ClientGroupFormDialog({
  open,
  onOpenChange,
  editingGroup,
}: ClientGroupFormDialogProps) {
  const [form, setForm] = useState<ClientGroupInput>(
    editingGroup
      ? { name: editingGroup.name, description: editingGroup.description ?? "" }
      : BLANK_GROUP_FORM,
  );

  const addGroup = useAddClientGroup();
  const updateGroup = useUpdateClientGroup();
  const isPending = addGroup.isPending || updateGroup.isPending;

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        editingGroup
          ? {
              name: editingGroup.name,
              description: editingGroup.description ?? "",
            }
          : { ...BLANK_GROUP_FORM },
      );
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const input: ClientGroupInput = {
        name: form.name,
        description: form.description || undefined,
      };
      if (editingGroup) {
        await updateGroup.mutateAsync({ id: editingGroup.id, input });
        toast.success("Group updated");
      } else {
        await addGroup.mutateAsync(input);
        toast.success("Group created");
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const set = <K extends keyof ClientGroupInput>(
    key: K,
    val: ClientGroupInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="client_group_form.dialog"
        className="bg-card border-border text-foreground max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {editingGroup ? "Edit Group" : "New Future Client Group"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="cgf-name"
              className="text-sm font-medium text-muted-foreground"
            >
              Group Name <span className="text-primary">*</span>
            </Label>
            <Input
              id="cgf-name"
              data-ocid="client_group_form.name_input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Enterprise Leads, Local Businesses"
              className="bg-muted border-border focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cgf-desc"
              className="text-sm font-medium text-muted-foreground"
            >
              Description{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="cgf-desc"
              data-ocid="client_group_form.description_textarea"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of this group…"
              rows={3}
              className="bg-muted border-border focus-visible:ring-primary resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="client_group_form.cancel_button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="client_group_form.submit_button"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Client Form Dialog ─────────────────────────────────────────────────────
interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingClient: Client | null;
  groupId: GroupId;
}

const BLANK_CLIENT_FORM = {
  name: "",
  company: "",
  phone: "",
  email: "",
  notes: "",
};

function ClientFormDialog({
  open,
  onOpenChange,
  editingClient,
  groupId,
}: ClientFormDialogProps) {
  const [form, setForm] = useState({
    name: editingClient?.name ?? "",
    company: editingClient?.company ?? "",
    phone: editingClient?.phone ?? "",
    email: editingClient?.email ?? "",
    notes: editingClient?.notes ?? "",
  });

  const addClient = useAddClient();
  const updateClient = useUpdateClient();
  const isPending = addClient.isPending || updateClient.isPending;

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        editingClient
          ? {
              name: editingClient.name,
              company: editingClient.company ?? "",
              phone: editingClient.phone ?? "",
              email: editingClient.email ?? "",
              notes: editingClient.notes ?? "",
            }
          : { ...BLANK_CLIENT_FORM },
      );
    }
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const input: ClientInput = {
        name: form.name,
        groupId,
        company: form.company || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        notes: form.notes || undefined,
      };
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, input });
        toast.success("Client updated");
      } else {
        await addClient.mutateAsync(input);
        toast.success("Client added");
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const set = (key: keyof typeof BLANK_CLIENT_FORM, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="client_form.dialog"
        className="bg-card border-border text-foreground max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {editingClient ? "Edit Client" : "Add Client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="clf-name"
              className="text-sm font-medium text-muted-foreground"
            >
              Name <span className="text-primary">*</span>
            </Label>
            <Input
              id="clf-name"
              data-ocid="client_form.name_input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith"
              className="bg-muted border-border focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="clf-company"
                className="text-sm font-medium text-muted-foreground"
              >
                Company{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="clf-company"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Corp"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="clf-phone"
                className="text-sm font-medium text-muted-foreground"
              >
                Phone{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="clf-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-muted border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="clf-email"
              className="text-sm font-medium text-muted-foreground"
            >
              Email{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="clf-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@acme.com"
              className="bg-muted border-border focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="clf-notes"
              className="text-sm font-medium text-muted-foreground"
            >
              Notes{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="clf-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any relevant notes about this client…"
              rows={3}
              className="bg-muted border-border focus-visible:ring-primary resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="client_form.cancel_button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="client_form.submit_button"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Single Group Panel ─────────────────────────────────────────────────────
interface GroupPanelProps {
  group: ClientGroup;
  clients: Client[];
  index: number;
  onEditGroup: (g: ClientGroup) => void;
  onDeleteGroup: (id: GroupId) => void;
  onAddClient: (groupId: GroupId) => void;
  onEditClient: (c: Client, groupId: GroupId) => void;
  onDeleteClient: (id: ClientId) => void;
}

function GroupPanel({
  group,
  clients,
  index,
  onEditGroup,
  onDeleteGroup,
  onAddClient,
  onEditClient,
  onDeleteClient,
}: GroupPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      data-ocid={`clients.group.item.${index}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-muted/30">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left group/expand"
          aria-expanded={expanded}
        >
          <span className="text-muted-foreground group-hover/expand:text-foreground transition-colors">
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-display font-bold text-base text-foreground leading-tight truncate block">
              {group.name}
            </span>
            {group.description && (
              <span className="text-xs text-muted-foreground truncate block mt-0.5">
                {group.description}
              </span>
            )}
          </div>
        </button>

        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium shrink-0">
          {clients.length} {clients.length === 1 ? "client" : "clients"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-ocid={`clients.group.add_client_button.${index}`}
                onClick={() => onAddClient(group.id)}
                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Client</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-ocid={`clients.group.edit_button.${index}`}
                onClick={() => onEditGroup(group)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Group</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-ocid={`clients.group.delete_button.${index}`}
                onClick={() => onDeleteGroup(group.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Group</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Clients list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No clients in this group yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddClient(group.id)}
                  className="border-border text-muted-foreground hover:text-foreground gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add First Client
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {clients.map((client, cIdx) => (
                  <div
                    key={client.id.toString()}
                    data-ocid={`clients.item.${cIdx + 1}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors group/client"
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                      <div className="font-medium text-sm text-foreground truncate">
                        {client.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {client.company || (
                          <span className="italic text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        {client.phone ? (
                          <a
                            href={`tel:${client.phone}`}
                            className="flex items-center gap-1 text-primary hover:underline font-mono"
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            {client.phone}
                          </a>
                        ) : (
                          <span className="italic text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        {client.email ? (
                          <a
                            href={`mailto:${client.email}`}
                            className="flex items-center gap-1 hover:text-foreground transition-colors truncate"
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </a>
                        ) : (
                          <span className="italic text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    {client.notes && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="hidden sm:block text-xs text-muted-foreground/60 italic line-clamp-1 max-w-[140px] cursor-default shrink-0">
                            {client.notes}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-popover border-border">
                          {client.notes}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover/client:opacity-100 transition-opacity shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`clients.edit_button.${cIdx + 1}`}
                            onClick={() => onEditClient(client, group.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`clients.delete_button.${cIdx + 1}`}
                            onClick={() => onDeleteClient(client.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Clients Section ────────────────────────────────────────────────────────
function ClientsSectionWithExternalTrigger({
  externalFormOpen,
  onExternalFormOpenChange,
}: WithExternalTriggerProps) {
  const { data: groups = [], isLoading: groupsLoading } = useGetClientGroups();
  const { data: clients = [], isLoading: clientsLoading } = useGetClients();
  const deleteGroup = useDeleteClientGroup();
  const deleteClient = useDeleteClient();

  const [editingGroup, setEditingGroup] = useState<ClientGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<GroupId | null>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<GroupId | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<ClientId | null>(
    null,
  );

  const isLoading = groupsLoading || clientsLoading;

  const handleGroupFormOpenChange = (v: boolean) => {
    onExternalFormOpenChange(v);
    if (!v) setEditingGroup(null);
  };

  const handleOpenEditGroup = (g: ClientGroup) => {
    setEditingGroup(g);
    onExternalFormOpenChange(true);
  };

  const handleDeleteGroup = async () => {
    if (deletingGroupId === null) return;
    try {
      await deleteGroup.mutateAsync(deletingGroupId);
      toast.success("Group deleted");
    } catch {
      toast.error("Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleAddClient = (groupId: GroupId) => {
    setActiveGroupId(groupId);
    setEditingClient(null);
    setClientFormOpen(true);
  };

  const handleEditClient = (c: Client, groupId: GroupId) => {
    setActiveGroupId(groupId);
    setEditingClient(c);
    setClientFormOpen(true);
  };

  const handleClientFormOpenChange = (v: boolean) => {
    setClientFormOpen(v);
    if (!v) {
      setEditingClient(null);
      setActiveGroupId(null);
    }
  };

  const handleDeleteClient = async () => {
    if (deletingClientId === null) return;
    try {
      await deleteClient.mutateAsync(deletingClientId);
      toast.success("Client removed");
    } catch {
      toast.error("Failed to delete client");
    } finally {
      setDeletingClientId(null);
    }
  };

  const sortedGroups = [...groups].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div data-ocid="clients.section" className="space-y-4">
      {isLoading ? (
        <div data-ocid="clients.loading_state" className="space-y-3">
          {["sk1", "sk2", "sk3"].map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : sortedGroups.length === 0 ? (
        <motion.div
          data-ocid="clients.empty_state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border border-border rounded-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-1">
            No future client groups yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Create a group to organize your future clients — e.g., "Enterprise
            Leads" or "Local Businesses."
          </p>
          <Button
            onClick={() => {
              setEditingGroup(null);
              onExternalFormOpenChange(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Group
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {sortedGroups.map((group, idx) => {
            const groupClients = clients.filter(
              (c) => c.groupId.toString() === group.id.toString(),
            );
            return (
              <GroupPanel
                key={group.id.toString()}
                group={group}
                clients={groupClients}
                index={idx + 1}
                onEditGroup={handleOpenEditGroup}
                onDeleteGroup={(id) => setDeletingGroupId(id)}
                onAddClient={handleAddClient}
                onEditClient={handleEditClient}
                onDeleteClient={(id) => setDeletingClientId(id)}
              />
            );
          })}
        </div>
      )}

      {/* Group Form */}
      <ClientGroupFormDialog
        open={externalFormOpen}
        onOpenChange={handleGroupFormOpenChange}
        editingGroup={editingGroup}
      />

      {/* Client Form */}
      {activeGroupId !== null && (
        <ClientFormDialog
          open={clientFormOpen}
          onOpenChange={handleClientFormOpenChange}
          editingClient={editingClient}
          groupId={activeGroupId}
        />
      )}

      {/* Delete Group confirm */}
      <AlertDialog
        open={deletingGroupId !== null}
        onOpenChange={(v) => !v && setDeletingGroupId(null)}
      >
        <AlertDialogContent
          data-ocid="group_delete_confirm.dialog"
          className="bg-card border-border text-foreground"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold">
              Delete Group?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the group and{" "}
              <strong>all clients</strong> inside it. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="group_delete_confirm.cancel_button"
              className="bg-muted border-border text-foreground hover:bg-accent"
              onClick={() => setDeletingGroupId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="group_delete_confirm.confirm_button"
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Client confirm */}
      <AlertDialog
        open={deletingClientId !== null}
        onOpenChange={(v) => !v && setDeletingClientId(null)}
      >
        <AlertDialogContent
          data-ocid="client_delete_confirm.dialog"
          className="bg-card border-border text-foreground"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold">
              Remove Client?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The client record will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="client_delete_confirm.cancel_button"
              className="bg-muted border-border text-foreground hover:bg-accent"
              onClick={() => setDeletingClientId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="client_delete_confirm.confirm_button"
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
