import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMediaAssets, type MediaAsset } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Upload,
  Copy,
  Trash2,
  ImageIcon,
  Film,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/midia")({
  component: MidiaAdmin,
});

const FOLDERS = [
  "geral",
  "hero",
  "banners",
  "marcas",
  "produtos",
  "logos",
  "videos",
];

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function MidiaAdmin() {
  const qc = useQueryClient();
  const [folder, setFolder] = useState("all");
  const [uploadFolder, setUploadFolder] = useState("geral");
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { data: assets, isLoading } = useMediaAssets(folder);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "bin";
        const safe = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .slice(0, 50);
        const path = `${uploadFolder}/${Date.now()}-${safe}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
        const isVideo = file.type.startsWith("video");
        const { error: insErr } = await supabase.from("media_assets").insert({
          file_url: pub.publicUrl,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          media_type: isVideo ? "video" : "image",
          folder: uploadFolder,
          size_bytes: file.size,
        });
        if (insErr) throw insErr;
      }
      toast.success("Mídia enviada com sucesso");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) {
      toast.error("Erro ao enviar: " + (e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(asset: MediaAsset) {
    if (!confirm(`Excluir "${asset.file_name}"?`)) return;
    try {
      if (asset.file_path) {
        await supabase.storage.from("media").remove([asset.file_path]);
      }
      const { error } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", asset.id);
      if (error) throw error;
      toast.success("Mídia excluída");
      qc.invalidateQueries({ queryKey: ["media_assets"] });
    } catch (e) {
      toast.error("Erro ao excluir: " + (e as Error).message);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de Mídia</h1>
          <p className="text-sm text-muted-foreground">
            Envie e gerencie imagens e vídeos usados no site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={folder} onValueChange={setFolder}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as pastas</SelectItem>
              {FOLDERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload zone */}
      <div className="rounded-xl border border-dashed border-border bg-background p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label>Pasta de destino</Label>
            <Select value={uploadFolder} onValueChange={setUploadFolder}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLDERS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Enviar imagens / vídeos
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (assets ?? []).length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nenhuma mídia ainda. Envie a primeira acima.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(assets ?? []).map((a) => (
            <div
              key={a.id}
              className="group overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="relative aspect-square bg-surface">
                {a.media_type === "video" ? (
                  <video
                    src={a.file_url}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={a.file_url}
                    alt={a.alt_text ?? a.file_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-xs backdrop-blur">
                  {a.media_type === "video" ? (
                    <Film className="h-3 w-3" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                  {a.folder}
                </span>
              </div>
              <div className="space-y-1 p-2.5">
                <p className="truncate text-xs font-medium" title={a.file_name}>
                  {a.file_name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(a.size_bytes)}
                </p>
                <div className="flex gap-1 pt-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyUrl(a.file_url)}
                    title="Copiar URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(a)}
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => remove(a)}
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditMediaDialog
        asset={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["media_assets"] });
        }}
      />
    </div>
  );
}

function EditMediaDialog({
  asset,
  onClose,
  onSaved,
}: {
  asset: MediaAsset | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [alt, setAlt] = useState("");
  const [desc, setDesc] = useState("");
  const [folder, setFolder] = useState("geral");
  const [saving, setSaving] = useState(false);

  // sync when asset changes
  if (asset && asset.id !== (window as any).__lastMediaId) {
    (window as any).__lastMediaId = asset.id;
    setAlt(asset.alt_text ?? "");
    setDesc(asset.description ?? "");
    setFolder(asset.folder ?? "geral");
  }

  async function save() {
    if (!asset) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("media_assets")
        .update({ alt_text: alt, description: desc, folder })
        .eq("id", asset.id);
      if (error) throw error;
      toast.success("Mídia atualizada");
      onSaved();
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar mídia</DialogTitle>
        </DialogHeader>
        {asset && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Texto alternativo (alt)</Label>
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pasta</Label>
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
