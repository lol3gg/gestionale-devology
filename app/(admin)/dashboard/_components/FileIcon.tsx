import { FileArchive, FileImage, FileSpreadsheet, FileText, File as FileGeneric } from "lucide-react";

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const DOC_EXT = ["doc", "docx", "odt", "txt"];
const SHEET_EXT = ["xls", "xlsx", "csv"];
const ARCHIVE_EXT = ["zip", "rar", "7z"];

export function FileIcon({ fileName, className }: { fileName: string; className?: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (IMAGE_EXT.includes(ext)) return <FileImage className={className} />;
  if (DOC_EXT.includes(ext)) return <FileText className={className} />;
  if (SHEET_EXT.includes(ext)) return <FileSpreadsheet className={className} />;
  if (ARCHIVE_EXT.includes(ext)) return <FileArchive className={className} />;
  if (ext === "pdf") return <FileText className={className} />;
  return <FileGeneric className={className} />;
}
