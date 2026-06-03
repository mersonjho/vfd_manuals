#!/usr/bin/env python3
"""
Comprehensive Modbus RTU data extraction from VFD manuals.
Manually extracts pages from key documents and structures the data.
"""

import os
import pdfplumber
import json
import re
from typing import Dict, Any, List

BASE_PATH = r"d:\MEGA\Unmanaged\VFD Manuals"

# Priority list - PDFs most likely to have Modbus info
PRIORITY_DOCS = {
    "VACON_0100": {
        "path": "VACON/Vacon-100-Modbus-User-Manual-DPD00156D-UK.pdf",
        "pages_to_check": [1, 3, 4, 5, 6, 10, 24, 25, 30, 40, 50],  # Key pages
        "model": "VACON 0100",
    },
    "TECO_A510": {
        "path": "TECO/A510-Communication-Addendum.pdf",
        "pages_to_check": [1, 2, 4, 11, 27, 39],
        "model": "TECO A510/A510s",
    },
    "TECO_A510_SETUP": {
        "path": "TECO/SETUP GUIDE AND PARAMETERS/TECO-A510-A510S-MODBUS-SETUP.pdf",
        "pages_to_check": [1, 2, 3],
        "model": "TECO A510/A510s Setup",
    },
    "FRENIC_MEGA": {
        "path": "FRENIC/FRENIC-MEGA/FRENIC-MEGA-User-Manual.pdf",
        "pages_to_check": [1, 7, 8, 14, 30, 50, 100],
        "model": "FRENIC MEGA",
    },
    "FRENIC_ACE": {
        "path": "FRENIC/FRENIC-ACE/FRENIC-Ace-Instruction-Manual-INR-SI47-1733f-E.pdf",
        "pages_to_check": [1, 3, 7, 8, 50, 100],
        "model": "FRENIC ACE",
    },
    "HITACHI_SJ700": {
        "path": "HITACHI/HITACHI-SJ700-SERIES/HITACHI-SJ7002-Instruction-Manual.pdf",
        "pages_to_check": [1, 12, 14, 28, 100, 200],
        "model": "HITACHI SJ700",
    },
    "HITACHI_SJ700N": {
        "path": "HITACHI/HITACHI-SJ700N-SERIES/HITACHI-SJ700N.pdf",
        "pages_to_check": [1, 5, 10, 20, 30],
        "model": "HITACHI SJ700N",
    },
    "HITACHI_SH1": {
        "path": "HITACHI/HITACHI-P1-SERIES-SH1-SERIES/Hitachi-SH1-Register-Address.pdf",
        "pages_to_check": [1, 6, 7, 30, 40, 50],
        "model": "HITACHI SH1",
    },
    "YASKAWA_A1000": {
        "path": "YASKAWA/YASKAWA A1000 USER MANUAL.pdf",
        "pages_to_check": [1, 10, 20, 30, 50, 100],
        "model": "YASKAWA A1000",
    },
    "SCHNEIDER_ATV320": {
        "path": "SCHNEIDER/ATV320_Modbus_manual_EN_NVE41308_01.pdf",
        "pages_to_check": [1, 10, 15, 20, 30, 40],
        "model": "SCHNEIDER ALTIVAR 320",
    },
}

def extract_specific_pages(pdf_path: str, page_numbers: List[int]) -> Dict[int, str]:
    """Extract specific pages from PDF."""
    pages_data = {}
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            for page_num in page_numbers:
                if 0 < page_num <= total_pages:
                    page = pdf.pages[page_num - 1]
                    text = page.extract_text() or ""
                    pages_data[page_num] = text
    except Exception as e:
        print(f"  Error reading {pdf_path}: {e}")
    return pages_data

def extract_modbus_register_table(text: str) -> List[Dict]:
    """Extract register address tables from text."""
    registers = []
    
    # Look for patterns like "Address: 0x0001" or "Reg: 1000 (hex: 0x3E8)"
    patterns = [
        r'(?:address|reg(?:ister)?)[:\s]+0?[xX]?([0-9A-Fa-f]+)',
        r'(?:frequency|current|voltage|power|fault|rpm)[:\s]+0?[xX]?([0-9A-Fa-f]+)',
    ]
    
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            addr_str = match.group(1)
            # Get context
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end]
            
            registers.append({
                'address': addr_str,
                'context': context.strip()[:150]
            })
    
    return registers

def main():
    results = {}
    
    for doc_id, doc_info in PRIORITY_DOCS.items():
        pdf_path = os.path.join(BASE_PATH, doc_info["path"])
        
        if not os.path.exists(pdf_path):
            print(f"[NOT FOUND] {doc_info['model']}: {doc_info['path']}")
            continue
        
        print(f"\n[PROCESSING] {doc_info['model']}")
        print(f"  Path: {doc_info['path']}")
        
        # Get file size as indicator of content
        file_size = os.path.getsize(pdf_path)
        print(f"  File size: {file_size/1024:.1f} KB")
        
        # Extract pages
        pages_content = extract_specific_pages(pdf_path, doc_info["pages_to_check"])
        print(f"  Pages extracted: {len(pages_content)}")
        
        # Combine all text
        full_text = "\n".join(pages_content.values())
        
        # Look for key information
        doc_results = {
            "model": doc_info["model"],
            "file_path": doc_info["path"],
            "pages_analyzed": list(pages_content.keys()),
            "modbus_settings": {},
            "rs485_info": {},
            "register_samples": [],
        }
        
        # Search for baud rates
        baud_patterns = [r'9600', r'19200', r'38400', r'57600', r'115200', r'1200', r'2400', r'4800']
        found_bauds = set()
        for pattern in baud_patterns:
            if re.search(pattern, full_text):
                found_bauds.add(pattern)
        
        if found_bauds:
            doc_results["modbus_settings"]["possible_baud_rates"] = sorted(list(found_bauds))
        
        # Search for parity settings
        if re.search(r'8[Nn]1|eight[Nn]one[Nn]one', full_text):
            doc_results["modbus_settings"]["parity_8N1"] = True
        
        parity_match = re.search(r'(?:parity)[:\s]+(even|odd|none)', full_text, re.IGNORECASE)
        if parity_match:
            doc_results["modbus_settings"]["parity"] = parity_match.group(1).lower()
        
        # Search for slave ID / Node address
        node_match = re.search(r'(?:slave\s+id|node\s+address)[:\s=]+([0-9\-]+)', full_text, re.IGNORECASE)
        if node_match:
            doc_results["modbus_settings"]["slave_id_range"] = node_match.group(1)
        
        # RS485 information
        if 'RS485' in full_text or 'rs485' in full_text.lower():
            doc_results["rs485_info"]["documented"] = True
            # Find page
            for page_num, text in pages_content.items():
                if 'RS485' in text or 'rs485' in text.lower():
                    doc_results["rs485_info"]["found_on_page"] = page_num
                    # Extract context
                    rs485_context = re.search(r'RS485.*?(?:\n\n|$)', text, re.IGNORECASE | re.DOTALL)
                    if rs485_context:
                        doc_results["rs485_info"]["context_sample"] = rs485_context.group(0)[:300]
                    break
        
        # Extract register samples
        reg_samples = extract_modbus_register_table(full_text)
        if reg_samples:
            doc_results["register_samples"] = reg_samples[:5]  # Keep first 5
        
        results[doc_id] = doc_results
    
    # Save results
    output_file = os.path.join(BASE_PATH, "MODBUS_EXTRACTION_RESULTS.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Results saved to: {output_file}")
    print(f"{'='*60}")
    
    # Summary
    print("\nEXTRACTION SUMMARY:")
    for doc_id, doc_results in results.items():
        print(f"\n{doc_results['model']}:")
        if doc_results.get("modbus_settings"):
            for key, value in doc_results["modbus_settings"].items():
                print(f"  - {key}: {value}")
        if doc_results.get("rs485_info", {}).get("documented"):
            print(f"  - RS485 info found")
        if doc_results.get("register_samples"):
            print(f"  - {len(doc_results['register_samples'])} register samples found")

if __name__ == "__main__":
    main()
