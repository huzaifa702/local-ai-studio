import os
import json
import csv
from pathlib import Path
from typing import Dict, Any, Optional

class DocumentService:
    @staticmethod
    def extract_text(file_path: Path, filename: str) -> Dict[str, Any]:
        ext = file_path.suffix.lower()
        text = ""
        metadata = {
            "filename": filename,
            "extension": ext,
            "size_bytes": os.path.getsize(file_path) if file_path.exists() else 0
        }

        try:
            if ext in [".txt", ".md", ".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".json", ".sql", ".sh", ".yaml", ".yml", ".env", ".c", ".cpp", ".rs", ".go", ".java"]:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    text = f.read()

            elif ext == ".csv":
                rows = []
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    reader = csv.reader(f)
                    for i, row in enumerate(reader):
                        if i > 100:  # Cap preview rows to keep context efficient
                            rows.append(f"... (truncated {metadata['size_bytes']} bytes)")
                            break
                        rows.append(" | ".join(row))
                text = "\n".join(rows)

            elif ext == ".json":
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    data = json.load(f)
                    text = json.dumps(data, indent=2)[:20000]

            elif ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]:
                text = f"[Image File: {filename}]"
                metadata["is_image"] = True

            elif ext == ".pdf":
                # Basic text extraction if pypdf is installed, fallback to binary notice
                try:
                    import pypdf
                    reader = pypdf.PdfReader(str(file_path))
                    pages_text = []
                    for i, page in enumerate(reader.pages[:20]):
                        pages_text.append(f"--- Page {i+1} ---\n" + (page.extract_text() or ""))
                    text = "\n\n".join(pages_text)
                except Exception:
                    text = f"[PDF Document: {filename} - Local PDF parser loaded metadata]"

            elif ext == ".docx":
                try:
                    import docx
                    doc = docx.Document(str(file_path))
                    text = "\n".join([p.text for p in doc.paragraphs])
                except Exception:
                    text = f"[Word Document: {filename}]"

            else:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                        text = f.read(50000)
                except Exception:
                    text = f"[Binary/Unrecognized File: {filename}]"

        except Exception as e:
            text = f"[Error reading file {filename}: {str(e)}]"

        metadata["char_count"] = len(text)
        metadata["preview"] = text[:300] if text else ""
        return {"text": text, "metadata": metadata}

doc_service = DocumentService()
