#!/usr/bin/env python3
"""
Fast targeted extraction of Modbus data from key VFD manuals.
Focuses on specific pages where Modbus info is typically found.
"""

import os
import pdfplumber
import re
from collections import defaultdict

BASE_PATH = r"d:\MEGA\Unmanaged\VFD Manuals"

# Key PDFs likely to contain Modbus info
KEY_PDFS = {
    "VACON": [
        "Vacon-100-Modbus-User-Manual-DPD00156D-UK.pdf",
        "VACON-100-MODBUS-SETUP.pdf",
        "VACON-100-REGISTER-ADDRESS-LIST.pdf",
    ],
    "TECO": [
        "A510-Communication-Addendum.pdf",
        "TECO-A510-A510S-MODBUS-SETUP.pdf",
        "TECO-A510-A510S-REGISTER-ADDRESS-LIST.pdf",
    ],
    "FRENIC": [
        "FRENIC-MEGA/FRENIC-MEGA-User-Manual.pdf",
        "FRENIC-ACE/FRENIC-Ace-Instruction-Manual-INR-SI47-1733f-E.pdf",
    ],
    "HITACHI": [
        "HITACHI-SJ700-SERIES/HITACHI-SJ7002-Instruction-Manual.pdf",
        "HITACHI-SJ700N-SERIES/HITACHI-SJ700N.pdf",
        "HITACHI-P1-SERIES-SH1-SERIES/Hitachi-SH1-Register-Address.pdf",
        "HITACHI-P1-SERIES-SH1-SERIES/HITACHI-SH1-MODBUS-SETUP.docx",
    ],
    "TEK DRIVE": [
        "TDS-V8-Instruction-Manual.pdf",
        "TDS-F8-Instruction-Manual.pdf",
    ],
    "YASKAWA": [
        "YASKAWA A1000 USER MANUAL.pdf",
    ],
    "SCHNEIDER": [
        "ATV320_Modbus_manual_EN_NVE41308_01.pdf",
        "ATV320_CommunicationParameters_NVE41316_V3.5.xlsx",
    ],
    "DANAHE": [
        "D31-USER-MANUAL.pdf",
    ],
}

def search_pdf_for_keywords(pdf_path, keywords, max_pages=None):
    """Search PDF for specific keywords and extract context."""
    results = defaultdict(list)
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages_to_check = pdf.pages[:max_pages] if max_pages else pdf.pages
            
            for page_num, page in enumerate(pages_to_check, 1):
                text = page.extract_text()
                if not text:
                    continue
                
                for keyword in keywords:
                    # Case-insensitive search
                    pattern = rf'{re.escape(keyword)}.*?(?:\n|$)'
                    matches = re.finditer(pattern, text, re.IGNORECASE)
                    
                    for match in matches:
                        # Get surrounding context
                        start = max(0, match.start() - 50)
                        end = min(len(text), match.end() + 100)
                        context = text[start:end].strip()
                        
                        results[keyword].append({
                            'page': page_num,
                            'context': context,
                            'full_match': match.group(0)[:100]
                        })
    except Exception as e:
        print(f"  ERROR: {e}")
    
    return results

def extract_hex_addresses(text):
    """Extract hex register addresses from text."""
    # Look for patterns like 0x0001, 0x1234, or just hex numbers
    hex_pattern = r'0[xX]([0-9A-Fa-f]{4})|([0-9A-Fa-f]{4})(?:\s+hex|\s+0[xX])'
    matches = re.findall(hex_pattern, text)
    return [match[0] or match[1] for match in matches]

def main():
    """Extract Modbus data from key VFD manuals."""
    
    modbus_keywords = [
        'baud rate', 'baud', '9600', '19200', '38400',
        'parity', '8N1', 'slave id', 'node address',
        'modbus rtu', 'modbus', 'rs485', 'communication',
        'register', 'holding register', 'input register',
        'frequency', 'current', 'voltage', 'power', 'fault',
        'rpm', 'speed'
    ]
    
    print("FAST MODBUS DATA EXTRACTION")
    print("="*70)
    
    all_results = {}
    
    for manufacturer, pdf_list in KEY_PDFS.items():
        print(f"\n{manufacturer}")
        print("-" * 70)
        
        mfg_results = {}
        
        for pdf_rel_path in pdf_list:
            pdf_path = os.path.join(BASE_PATH, manufacturer, pdf_rel_path)
            
            if not os.path.exists(pdf_path):
                print(f"  ✗ NOT FOUND: {pdf_rel_path}")
                continue
            
            pdf_name = os.path.basename(pdf_path)
            print(f"\n  {pdf_name}")
            
            if pdf_path.lower().endswith('.xlsx'):
                print(f"    [SKIPPED - XLSX format]")
                continue
            
            if pdf_path.lower().endswith('.docx'):
                print(f"    [SKIPPED - DOCX format]")
                continue
            
            # Search first 30 pages for Modbus keywords
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    num_pages = len(pdf.pages)
                    print(f"    Pages: {num_pages}")
            except:
                print(f"    [ERROR opening PDF]")
                continue
            
            results = search_pdf_for_keywords(pdf_path, modbus_keywords, max_pages=30)
            
            if results:
                print(f"    Found {len(results)} keyword matches")
                for keyword, matches in sorted(results.items()):
                    if matches:
                        first_match = matches[0]
                        print(f"      • {keyword:20} (page {first_match['page']})")
                        if 'baud' in keyword.lower() or '9600' in keyword.lower():
                            print(f"        Context: {first_match['context'][:60]}")
            
            mfg_results[pdf_name] = results
        
        all_results[manufacturer] = mfg_results
    
    print("\n" + "="*70)
    print("Extraction complete!")
    
    # Save detailed results
    import json
    output_file = r"d:\MEGA\GITHUB\vfd_manuals\fast_extraction_results.json"
    
    # Convert for JSON serialization
    json_results = {}
    for mfg, files in all_results.items():
        json_results[mfg] = {}
        for pdf_name, results in files.items():
            json_results[mfg][pdf_name] = {
                keyword: matches[:3]  # Keep first 3 matches per keyword
                for keyword, matches in results.items()
            }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(json_results, f, indent=2)
    
    print(f"Results saved to: {output_file}")

if __name__ == "__main__":
    main()
