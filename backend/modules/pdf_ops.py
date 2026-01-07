import pikepdf
import os
import shutil
import zipfile
from typing import List, Union

def merge_pdfs(input_files: List[str], output_path: str):
    """
    Merges multiple PDFs into one using pikepdf.
    """
    try:
        pdf = pikepdf.Pdf.new()
        for file_path in input_files:
            src = pikepdf.Pdf.open(file_path)
            pdf.pages.extend(src.pages)
        pdf.save(output_path)
    except Exception as e:
        print(f"Error merging PDFs: {e}")
        raise e

def parse_range_string(range_str: str, total_pages: int) -> List[int]:
    """
    Parses a string like "1, 3-5, 8" into a list of 0-based indices [0, 2, 3, 4, 7].
    Handles validity checks.
    """
    pages = set()
    parts = range_str.split(',')
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        if '-' in part:
            start, end = part.split('-')
            start, end = int(start), int(end)
            # Python range is exclusive at the end, users expect inclusive
            # User input 1-based, we want 0-based.
            # 1-3 -> indices 0, 1, 2
            for i in range(start - 1, end):
                if 0 <= i < total_pages:
                    pages.add(i)
        else:
            i = int(part) - 1
            if 0 <= i < total_pages:
                pages.add(i)
                
    return sorted(list(pages))

def split_pdf(input_path: str, output_dir: str, mode: str, ranges: str = "") -> str:
    """
    Splits a PDF.
    
    Args:
        mode: 'all' (split every page) or 'ranges' (use specific ranges)
        ranges: string argument if mode is ranges, e.g. "1-5, 6-10"
        
    Returns:
        Path to the resulting ZIP file.
    """
    try:
        src = pikepdf.Pdf.open(input_path)
        generated_files = []
        
        if mode == 'all':
            # Split every page
            for i, page in enumerate(src.pages):
                dst = pikepdf.Pdf.new()
                dst.pages.append(page)
                out_name = f"page_{i+1}.pdf"
                out_path = os.path.join(output_dir, out_name)
                dst.save(out_path)
                generated_files.append(out_path)
                
        elif mode == 'ranges':
            # ranges string format: "1-5, 6-10" or just "1-5"
            # This logic assumes the prompt means "Split INTO these ranges"
            # i.e. 1-5 becomes file1, 6-10 becomes file2.
            # We need to split the master string by comma first for distinct files?
            # Or does "1, 3-5" mean "Extract pages 1, 3, 4, 5 into ONE file"?
            # Usually Split means "Extract specific parts".
            # Let's interpret "Ranges" as: User provides a list of ranges, EACH becomes a separate file.
            # If user enters "1-5, 6-10", we output 2 files.
            
            range_groups = [r.strip() for r in ranges.split(',') if r.strip()]
            
            for idx, r_group in enumerate(range_groups):
                # r_group is e.g. "1-5" or "1"
                dst = pikepdf.Pdf.new()
                # We reuse parse_range_string but treat it as a single group definition
                indices = parse_range_string(r_group, len(src.pages))
                
                if not indices:
                   continue

                for i in indices:
                    dst.pages.append(src.pages[i])
                
                out_name = f"split_{idx+1}_{r_group}.pdf".replace("-", "to")
                out_path = os.path.join(output_dir, out_name)
                dst.save(out_path)
                generated_files.append(out_path)

        # Create ZIP
        zip_name = "split_files.zip"
        zip_path = os.path.join(output_dir, zip_name)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in generated_files:
                zipf.write(file, os.path.basename(file))
                
        return zip_path

    except Exception as e:
        print(f"Error splitting PDF: {e}")
        raise e

def delete_pages(input_path: str, output_path: str, pages_to_delete: str):
    """
    Deletes specific pages from a PDF.
    pages_to_delete: "1, 3-5"
    """
    try:
        src = pikepdf.Pdf.open(input_path)
        # Parse what to delete
        indices_to_delete = set(parse_range_string(pages_to_delete, len(src.pages)))
        
        dst = pikepdf.Pdf.new()
        
        for i, page in enumerate(src.pages):
            if i not in indices_to_delete:
                dst.pages.append(page)
                
        dst.save(output_path)
        
    except Exception as e:
        print(f"Error deleting pages: {e}")
        raise e

def cleanup_files(file_paths: List[str]):
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error deleting {path}: {e}")
