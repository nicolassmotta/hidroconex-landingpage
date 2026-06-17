import { DragEvent, useState } from "react";
import { ImagePlus, UploadCloud } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ImageDropzoneProps {
  preview: string;
  maxSizeMb: number;
  onFile: (file: File) => void;
}

/**
 * Upload area that accepts both click and drag-and-drop, validating type and
 * size on the client so the admin gets an immediate, friendly message instead
 * of a server rejection after the upload.
 */
export function ImageDropzone({ preview, maxSizeMb, onFile }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function validateAndSend(file: File | null) {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado", { description: "Use PNG, JPG ou WebP." });
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      toast.error("Imagem muito grande", {
        description: `O limite é ${maxSizeMb} MB e esta tem ${sizeMb} MB. Reduza a imagem e tente de novo.`,
      });
      return;
    }

    onFile(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSend(event.dataTransfer.files?.[0] || null);
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "min-h-48 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 p-5 cursor-pointer transition-colors text-center",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/60",
      )}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="Prévia do produto"
            className="max-h-40 max-w-full object-contain"
          />
          <span className="text-xs text-muted-foreground">
            Clique ou arraste para trocar a imagem
          </span>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            {isDragging ? (
              <UploadCloud className="w-6 h-6 text-primary" />
            ) : (
              <ImagePlus className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <span className="block text-sm font-medium text-foreground">
              {isDragging ? "Solte a imagem aqui" : "Arraste uma imagem ou clique para selecionar"}
            </span>
            <span className="block text-xs text-muted-foreground mt-1">
              PNG, JPG ou WebP · até {maxSizeMb} MB
            </span>
          </div>
        </>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => validateAndSend(event.target.files?.[0] || null)}
      />
    </label>
  );
}
