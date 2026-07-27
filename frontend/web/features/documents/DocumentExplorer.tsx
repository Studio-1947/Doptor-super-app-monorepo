"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Search, FileText, Link2, UploadCloud, Download, Trash2, Loader2,
    Send, Check, X, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
    documentsService,
    OfficeDocument,
    DocumentStatus,
    isUpload,
} from "@/services/documents.service";

const STATUS_TABS: { id: "all" | DocumentStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "draft", label: "Draft" },
    { id: "pending_review", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
];

const statusChip: Record<DocumentStatus, string> = {
    draft: "text-slate-500 border-slate-100 bg-slate-50",
    pending_review: "text-amber-600 border-amber-100 bg-amber-50",
    approved: "text-emerald-600 border-emerald-100 bg-emerald-50",
    rejected: "text-rose-600 border-rose-100 bg-rose-50",
};

function fmtSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentExplorer() {
    const { hasPermission } = useAuth();
    const canCreate = hasPermission("create", "documents");
    const canApprove = hasPermission("approve", "workflows");
    const canDelete = hasPermission("delete", "documents");

    const [docs, setDocs] = useState<OfficeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"all" | DocumentStatus>("all");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showLink, setShowLink] = useState(false);
    const [linkName, setLinkName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const fileInput = useRef<HTMLInputElement>(null);

    const load = useCallback(() => {
        setLoading(true);
        documentsService
            .list({
                search: search || undefined,
                status: tab === "all" ? undefined : tab,
            })
            .then(setDocs)
            .catch(() => setDocs([]))
            .finally(() => setLoading(false));
    }, [search, tab]);

    useEffect(() => {
        const t = setTimeout(load, 250); // debounce search
        return () => clearTimeout(t);
    }, [load]);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await documentsService.upload(file);
            toast.success("Document uploaded");
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const addLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkName.trim() || !linkUrl.trim()) {
            toast.error("Name and URL are required");
            return;
        }
        try {
            await documentsService.createLink({ name: linkName.trim(), url: linkUrl.trim() });
            toast.success("Link added");
            setShowLink(false); setLinkName(""); setLinkUrl("");
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to add link");
        }
    };

    const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
        setBusyId(id);
        try {
            await fn();
            toast.success(ok);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Action failed");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload, share and get documents approved.</p>
                </div>
                {canCreate && (
                    <div className="flex gap-2">
                        <input ref={fileInput} type="file" className="hidden" onChange={onUpload} />
                        <button
                            onClick={() => fileInput.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700 transition-colors"
                        >
                            {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} Upload
                        </button>
                        <button
                            onClick={() => setShowLink((s) => !s)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-primary-500 transition-colors"
                        >
                            <Plus size={15} /> Link
                        </button>
                    </div>
                )}
            </div>

            {showLink && (
                <form onSubmit={addLink} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-2">
                    <input value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Document name"
                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
                    <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…"
                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800" />
                    <button type="submit" className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-primary-600 text-white hover:bg-primary-700 transition-colors">Add</button>
                </form>
            )}

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…"
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
                </div>
                <div className="flex gap-1">
                    {STATUS_TABS.map((t) => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border ${tab === t.id ? "border-primary-500 text-primary-600" : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" size={26} /></div>
            ) : docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <FileText size={36} className="mb-2 opacity-20" />
                    <p className="text-sm">No documents{tab !== "all" ? ` in ${tab.replace("_", " ")}` : ""} yet.</p>
                </div>
            ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-50 dark:divide-slate-800">
                    {docs.map((doc) => (
                        <div key={doc.id} className="p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-none bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                {isUpload(doc) ? <FileText size={16} /> : <Link2 size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{doc.name}</p>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {doc.category ? `${doc.category} · ` : ""}
                                    {isUpload(doc) ? fmtSize(doc.size_bytes) : "external link"}
                                    {doc.uploadedBy ? ` · ${doc.uploadedBy.first_name} ${doc.uploadedBy.last_name}` : ""}
                                </p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 border shrink-0 ${statusChip[doc.status]}`}>
                                {doc.status.replace("_", " ")}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                                {isUpload(doc) ? (
                                    <button onClick={() => act(doc.id, () => documentsService.download(doc), "Downloaded")}
                                        title="Download" className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                                        <Download size={15} />
                                    </button>
                                ) : doc.url ? (
                                    <a href={doc.url} target="_blank" rel="noreferrer" title="Open link"
                                        className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors inline-flex">
                                        <Link2 size={15} />
                                    </a>
                                ) : null}

                                {(doc.status === "draft" || doc.status === "rejected") && (
                                    <button onClick={() => act(doc.id, () => documentsService.submit(doc.id), "Submitted for review")}
                                        title="Submit for review" disabled={busyId === doc.id}
                                        className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors">
                                        <Send size={15} />
                                    </button>
                                )}
                                {canApprove && doc.status === "pending_review" && (
                                    <>
                                        <button onClick={() => act(doc.id, () => documentsService.approve(doc.id), "Approved")}
                                            title="Approve" disabled={busyId === doc.id}
                                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                                            <Check size={15} />
                                        </button>
                                        <button onClick={() => act(doc.id, () => documentsService.reject(doc.id), "Rejected")}
                                            title="Reject" disabled={busyId === doc.id}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                                            <X size={15} />
                                        </button>
                                    </>
                                )}
                                {canDelete && (
                                    <button onClick={() => act(doc.id, () => documentsService.remove(doc.id), "Deleted")}
                                        title="Delete" disabled={busyId === doc.id}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
