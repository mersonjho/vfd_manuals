#!/usr/bin/env python3
"""
Extract Modbus RTU communication settings from VFD manuals.
Searches for:
- Baud rates, parity, data bits, stop bits
- Slave ID/Node address ranges
- RS485 wiring information
- Modbus register addresses and descriptions
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import pdfplumber

# Define folder structure
BASE_PATH = r"d:\MEGA\Unmanaged\VFD Manuals"
MANUFACTURERS = {
    "VACON": {
        "models": ["0100 series"],
        "path": "VACON",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "TECO": {
        "models": ["A510", "A510s"],
        "path": "TECO",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "FRENIC": {
        "models": ["MEGA", "ACE"],
        "path": "FRENIC",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "TEK DRIVE": {
        "models": ["TDS V8", "TDS F8"],
        "path": "TEK DRIVE",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "HITACHI": {
        "models": ["SJ700", "SJ700N", "SH1"],
        "path": "HITACHI",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "DANAHE": {
        "models": ["D31 series"],
        "path": "DANAHE",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "YASKAWA": {
        "models": ["A1000"],
        "path": "YASKAWA",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    },
    "SCHNEIDER": {
        "models": ["ALTIVAR 320"],
        "path": "SCHNEIDER",
        "expected_register_points": ["Output Frequency", "Output Current", "Output Voltage", 
                                    "Output Power", "Fault Code", "Output RPM"]
    }
}

def extract_text_from_pdf(pdf_path: str, max_pages: Optional[int] = None, focus_pages: Optional[List[int]] = None) -> str:
    """Extract text from PDF file."""
    try:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            
            if focus_pages:
                # Extract specific pages (e.g., first, last, and middle sections)
                pages_to_process = [pdf.pages[i] for i in focus_pages if i < total_pages]
            elif max_pages:
                pages_to_process = pdf.pages[:max_pages]
            else:
                pages_to_process = pdf.pages
            
            for page in pages_to_process:
                extracted = page.extract_text()
                if extracted:
                    text += extracted
                    text += f"\n[PAGE {page.page_number}]\n"
        return text
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {e}")
        return ""

def find_modbus_settings(text: str) -> Dict[str, Any]:
    """Extract Modbus communication settings from text."""
    settings = {
        "baud_rate": "NOT DOCUMENTED",
        "parity": "NOT DOCUMENTED",
        "data_bits": "NOT DOCUMENTED",
        "stop_bits": "NOT DOCUMENTED",
        "slave_id_range": "NOT DOCUMENTED",
        "communication_procedure": "NOT DOCUMENTED",
        "page_references": []
    }
    
    # Search for baud rate (typically 9600, 19200, etc.)
    baud_patterns = [
        r'(?:baud|baud\s*rate)[:\s]+(\d+)',
        r'(\d+)\s*baud',
        r'9600|19200|38400|57600|115200'
    ]
    
    for pattern in baud_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Extract context
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end]
            
            if "modbus" in context.lower() or "rtus" in context.lower():
                baud_value = match.group(1) if match.groups() else match.group(0)
                if settings["baud_rate"] == "NOT DOCUMENTED":
                    settings["baud_rate"] = baud_value
                    # Extract page number
                    page_match = re.search(r'\[PAGE (\d+)\]', text[:match.start()])
                    if page_match:
                        settings["page_references"].append(f"Page {page_match.group(1)}")
    
    # Search for parity/data bits/stop bits
    parity_patterns = [
        r'8[Nn]1',  # 8N1
        r'(?:parity)[:\s]+(even|odd|none)',
        r'(?:data\s+bits?)[:\s]+(\d+)',
        r'(?:stop\s+bits?)[:\s]+(\d+)',
    ]
    
    for pattern in parity_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end]
            
            if "modbus" in context.lower() or "communication" in context.lower():
                if "8N1" in match.group(0) or "8n1" in match.group(0):
                    if settings["parity"] == "NOT DOCUMENTED":
                        settings["parity"] = "8N1"
                elif "parity" in pattern.lower():
                    if settings["parity"] == "NOT DOCUMENTED":
                        settings["parity"] = match.group(1).capitalize()
                elif "data" in pattern.lower():
                    if settings["data_bits"] == "NOT DOCUMENTED":
                        settings["data_bits"] = match.group(1)
                elif "stop" in pattern.lower():
                    if settings["stop_bits"] == "NOT DOCUMENTED":
                        settings["stop_bits"] = match.group(1)
    
    # Search for slave ID or node address
    node_patterns = [
        r'(?:slave\s+id|node\s+address|address)[:\s]+(\d+(?:\s*-\s*\d+)?)',
        r'(?:modbus\s+address)[:\s]+(\d+(?:\s*-\s*\d+)?)',
    ]
    
    for pattern in node_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end]
            
            if "modbus" in context.lower():
                if settings["slave_id_range"] == "NOT DOCUMENTED":
                    settings["slave_id_range"] = match.group(1)
                    page_match = re.search(r'\[PAGE (\d+)\]', text[:match.start()])
                    if page_match:
                        settings["page_references"].append(f"Page {page_match.group(1)}")
    
    return settings

def find_rs485_info(text: str) -> Dict[str, Any]:
    """Extract RS485 wiring information."""
    rs485_info = {
        "page_location": "NOT DOCUMENTED",
        "pin_description": "NOT DOCUMENTED",
        "termination_info": "NOT DOCUMENTED",
        "special_notes": "NOT DOCUMENTED",
        "page_references": []
    }
    
    # Search for RS485 or serial communication sections
    rs485_patterns = [
        r'(?:RS[4]85|serial\s+port)[:\s]+(.*?)(?:\n\n|$)',
        r'(?:wiring|pin\s+assignment|connection)[:\s]+(.*?)(?:\n\n|$)',
    ]
    
    for pattern in rs485_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            section = match.group(1)
            if "RS485" in section or "A+" in section or "B-" in section:
                rs485_info["pin_description"] = section[:200]
                page_match = re.search(r'\[PAGE (\d+)\]', text[:match.start()])
                if page_match:
                    rs485_info["page_references"].append(f"Page {page_match.group(1)}")
                    rs485_info["page_location"] = page_match.group(1)
    
    # Search for termination info
    term_patterns = [
        r'termination.*?(\d+)\s*(?:ohm|Ω)',
        r'resistor.*?(\d+)\s*(?:ohm|Ω)',
        r'pull[- ]?up.*?(\d+)\s*(?:ohm|Ω)',
    ]
    
    for pattern in term_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            if rs485_info["termination_info"] == "NOT DOCUMENTED":
                rs485_info["termination_info"] = f"{match.group(1)} ohm resistor"
                page_match = re.search(r'\[PAGE (\d+)\]', text[:match.start()])
                if page_match:
                    rs485_info["page_references"].append(f"Page {page_match.group(1)}")
    
    return rs485_info

def find_register_addresses(text: str) -> Dict[str, Any]:
    """Extract Modbus register addresses."""
    registers = {
        "Output Frequency": {"NOT_FOUND": True},
        "Output Current": {"NOT_FOUND": True},
        "Output Voltage": {"NOT_FOUND": True},
        "Output Power": {"NOT_FOUND": True},
        "Fault Code": {"NOT_FOUND": True},
        "Output RPM": {"NOT_FOUND": True},
    }
    
    # Look for register tables and listings
    register_patterns = [
        r'(?:frequency|speed)[:\s]*(?:register\s+)?(?:address\s*)?0?[xX]?([0-9A-Fa-f]+)',
        r'(?:current)[:\s]*(?:register\s+)?(?:address\s*)?0?[xX]?([0-9A-Fa-f]+)',
        r'(?:voltage)[:\s]*(?:register\s+)?(?:address\s*)?0?[xX]?([0-9A-Fa-f]+)',
        r'(?:power|kW)[:\s]*(?:register\s+)?(?:address\s*)?0?[xX]?([0-9A-Fa-f]+)',
        r'(?:fault|error)[:\s]*(?:register\s+)?(?:address\s*)?0?[xX]?([0-9A-Fa-f]+)',
        r'(?:rpm|speed|rotation)[:\s]*(?:register\s+)?(?:address\s*)?0?[xX]?([0-9A-Fa-f]+)',
    ]
    
    # Extract context around register addresses
    for i, key in enumerate(registers.keys()):
        # Create a simple search pattern
        search_term = key.lower().split()[0]  # Get first word
        
        pattern = rf'{search_term}.*?(?:0x)?([0-9A-Fa-f]{{4}}|[0-9]{{1,5}})'
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        
        if matches:
            for match in matches:
                start = max(0, match.start() - 150)
                end = min(len(text), match.end() + 150)
                context = text[start:end]
                
                # Extract hex and decimal
                addr_str = match.group(1)
                page_match = re.search(r'\[PAGE (\d+)\]', text[:match.start()])
                page_num = page_match.group(1) if page_match else "Unknown"
                
                registers[key] = {
                    "address_hex": addr_str if not addr_str.isdigit() else hex(int(addr_str)),
                    "address_decimal": addr_str if addr_str.isdigit() else str(int(addr_str, 16)),
                    "context": context[:150],
                    "page": page_num,
                    "NOT_FOUND": False
                }
                break
    
    # Mark not found ones
    for key in registers:
        if registers[key].get("NOT_FOUND") is None:
            registers[key] = {"error": "NOT DOCUMENTED", "NOT_FOUND": True}
    
    return registers

def process_vfd_manuals():
    """Main function to process all VFD manuals."""
    results = {}
    
    for manufacturer, config in MANUFACTURERS.items():
        print(f"\n{'='*60}")
        print(f"Processing {manufacturer}...")
        print(f"{'='*60}")
        
        results[manufacturer] = {}
        mfg_path = os.path.join(BASE_PATH, config["path"])
        
        if not os.path.exists(mfg_path):
            print(f"Path not found: {mfg_path}")
            results[manufacturer]["ERROR"] = f"Path not found: {mfg_path}"
            continue
        
        # Find all PDF files
        pdf_files = []
        for root, dirs, files in os.walk(mfg_path):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        
        print(f"Found {len(pdf_files)} PDF files")
        
        for pdf_path in pdf_files:
            pdf_name = os.path.basename(pdf_path)
            print(f"\n  Extracting from: {pdf_name}")
            
            # Smart page selection based on document type
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"    Total pages: {total_pages}")
            
            # Focus on first 50, last 20, and middle sections
            focus_pages = list(range(min(50, total_pages))) + list(range(max(0, total_pages-20), total_pages))
            focus_pages = sorted(list(set(focus_pages)))  # Remove duplicates
            
            # Extract text from focused pages
            text = extract_text_from_pdf(pdf_path, focus_pages=focus_pages)
            
            if not text or len(text) < 100:
                print(f"    Skipping - insufficient text extracted")
                continue
            
            # Extract Modbus settings
            modbus_settings = find_modbus_settings(text)
            rs485_info = find_rs485_info(text)
            register_addrs = find_register_addresses(text)
            
            results[manufacturer][pdf_name] = {
                "modbus_communication": modbus_settings,
                "rs485_wiring": rs485_info,
                "register_addresses": register_addrs,
                "text_length": len(text)
            }
            
            # Print summary
            if modbus_settings["baud_rate"] != "NOT DOCUMENTED":
                print(f"    ✓ Baud Rate: {modbus_settings['baud_rate']}")
            if modbus_settings["parity"] != "NOT DOCUMENTED":
                print(f"    ✓ Parity: {modbus_settings['parity']}")
            if modbus_settings["slave_id_range"] != "NOT DOCUMENTED":
                print(f"    ✓ Slave ID Range: {modbus_settings['slave_id_range']}")
            if rs485_info["page_location"] != "NOT DOCUMENTED":
                print(f"    ✓ RS485 info found on page {rs485_info['page_location']}")
    
    return results

if __name__ == "__main__":
    print("Starting Modbus extraction from VFD manuals...")
    print(f"Base path: {BASE_PATH}\n")
    
    results = process_vfd_manuals()
    
    # Save results to JSON
    output_path = r"d:\MEGA\GITHUB\vfd_manuals\modbus_extraction_results.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n\n{'='*60}")
    print(f"Results saved to: {output_path}")
    print(f"{'='*60}\n")
    
    # Print detailed summary
    print("EXTRACTION SUMMARY")
    print("="*60)
    for mfg, files in results.items():
        print(f"\n{mfg}:")
        found_modbus = 0
        for pdf_name, data in files.items():
            if isinstance(data, dict) and "modbus_communication" in data:
                comm = data.get('modbus_communication', {})
                if comm.get('baud_rate') != "NOT DOCUMENTED":
                    found_modbus += 1
                    print(f"  [{found_modbus}] {pdf_name}")
                    print(f"      Baud: {comm.get('baud_rate', 'N/A')}")
                    print(f"      Parity: {comm.get('parity', 'N/A')}")
        if found_modbus == 0:
            print(f"  No Modbus data found in extracted PDFs")
    
    print("\nExtraction complete!")
