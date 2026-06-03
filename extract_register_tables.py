#!/usr/bin/env python3
"""
Deep extraction of Modbus register details from VFD manuals.
Focuses on finding and parsing register address tables.
"""

import os
import pdfplumber
import re
import json

BASE_PATH = r"d:\MEGA\Unmanaged\VFD Manuals"

def extract_register_tables(pdf_path, search_terms=None):
    """Extract register table data from PDF by searching for table patterns."""
    if search_terms is None:
        search_terms = ['frequency', 'current', 'voltage', 'power', 'fault', 'rpm', 'speed', 'address']
    
    registers_found = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Try to extract tables from all pages
            for page_num, page in enumerate(pdf.pages, 1):
                # Try to extract tables
                tables = page.extract_tables()
                if tables:
                    for table in tables:
                        for row in table:
                            row_text = str(row).lower()
                            # Check if row contains register-like information
                            if any(term in row_text for term in search_terms):
                                registers_found.append({
                                    'page': page_num,
                                    'data': row,
                                    'keywords': [t for t in search_terms if t in row_text]
                                })
    except Exception as e:
        pass
    
    return registers_found

def main():
    print("DEEP REGISTER TABLE EXTRACTION")
    print("="*70)
    
    # Priority PDFs for detailed register extraction
    register_extraction_pdfs = [
        ("VACON", "VACON/Vacon-100-Modbus-User-Manual-DPD00156D-UK.pdf"),
        ("TECO", "TECO/SETUP GUIDE AND PARAMETERS/TECO-A510-A510S-REGISTER-ADDRESS-LIST.pdf"),
        ("FRENIC_MEGA", "FRENIC/FRENIC-MEGA/FRENIC-MEGA-User-Manual.pdf"),
        ("FRENIC_ACE", "FRENIC/FRENIC-ACE/FRENIC-Ace-Instruction-Manual-INR-SI47-1733f-E.pdf"),
        ("HITACHI_SJ700", "HITACHI/HITACHI-SJ700-SERIES/HITACHI-SJ7002-Instruction-Manual.pdf"),
        ("HITACHI_SH1", "HITACHI/HITACHI-P1-SERIES-SH1-SERIES/Hitachi-SH1-Register-Address.pdf"),
        ("YASKAWA", "YASKAWA/YASKAWA A1000 USER MANUAL.pdf"),
        ("SCHNEIDER", "SCHNEIDER/ATV320_Modbus_manual_EN_NVE41308_01.pdf"),
    ]
    
    results = {}
    
    for model_name, pdf_rel_path in register_extraction_pdfs:
        pdf_path = os.path.join(BASE_PATH, pdf_rel_path)
        
        if not os.path.exists(pdf_path):
            print(f"\n[NOT FOUND] {model_name}")
            continue
        
        print(f"\n[{model_name}]")
        print(f"  Extracting register tables...")
        
        regs = extract_register_tables(pdf_path)
        
        if regs:
            print(f"  Found {len(regs)} register references")
            for reg in regs[:3]:  # Show first 3
                print(f"    Page {reg['page']}: {reg['keywords']}")
        else:
            print(f"  No structured register tables found (may be text-based)")
        
        results[model_name] = {
            'registers_found': len(regs),
            'sample_references': regs[:2] if regs else None
        }
    
    print("\n" + "="*70)
    print("Deep extraction complete!")
    print("Note: For complete register mappings, consult PDF files directly")

if __name__ == "__main__":
    main()
