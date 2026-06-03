#!/usr/bin/env python3
"""Enrich manuals.json with verified data from vfd.json"""
import json, os

vfdPath = 'data/vfd.json'
manualsPath = 'data/manuals.json'

with open(vfdPath, 'r', encoding='utf-8') as f:
    vfd = json.load(f)
with open(manualsPath, 'r', encoding='utf-8') as f:
    manuals = json.load(f)

# Build lookup from vfd by id
vfdModels = vfd['models']

for manual in manuals['manuals']:
    mid = manual['id']
    vm = vfdModels.get(mid)
    
    if not vm:
        # Try fuzzy match: CHZIRI, DANAHE, TECO etc
        print(f"  WARN: No vfd.json match for {mid}")
        continue
    
    # ---- Enrich details ----
    manual['description'] = f"{vm.get('manufacturer','')} - {vm.get('family','')}. {vm.get('unitsDeployed',0)} units deployed across {len(vm.get('locations',[]))} production areas. Voltage: {vm.get('voltage','')}."
    
    manual['details'] = [
        {'label': 'Manufacturer', 'value': vm.get('manufacturer','')},
        {'label': 'Model Family', 'value': vm.get('family','')},
        {'label': 'Voltage', 'value': vm.get('voltage','')},
        {'label': 'Units Deployed', 'value': str(vm.get('unitsDeployed',0))},
        {'label': 'Communication', 'value': ', '.join(vm.get('communicationPorts',['RS-485']))},
    ]
    
    # Add locations
    locs = vm.get('locations', [])
    if locs:
        manual['details'].append({'label': 'Production Areas', 'value': ', '.join(locs)})
    
    # ---- Enrich installation ----
    inst = []
    ms = vm.get('modbusSettings', {})
    if ms:
        inst.append(f"Set {ms.get('slaveAddress',{}).get('parameter','slave address parameter')} = desired slave ID (1-247)")
        inst.append(f"Set {ms.get('baudRate',{}).get('parameter','baud rate parameter')} = 9600 bps")
        inst.append(f"Set {ms.get('parity',{}).get('parameter','parity parameter')} = 8N1 (No parity)")
        if ms.get('runCommandSource'):
            inst.append(f"Set {ms['runCommandSource'].get('parameter','run source param')} = {ms['runCommandSource'].get('requiredValue','Modbus')} ({ms['runCommandSource'].get('description','')})")
        if ms.get('frequencyCommandSource'):
            inst.append(f"Set {ms['frequencyCommandSource'].get('parameter','freq source param')} = {ms['frequencyCommandSource'].get('requiredValue','Modbus')} ({ms['frequencyCommandSource'].get('description','')})")
        if ms.get('powerCycleRequired'):
            inst.append("⚠️ POWER CYCLE the VFD after changing communication parameters")
    
    # Wiring notes
    wiring = vm.get('rs485Wiring', {})
    if wiring.get('terminals'):
        terms = ', '.join(f"{k}={v}" for k,v in wiring['terminals'].items())
        inst.append(f"RS-485 terminals: {terms}")
    if wiring.get('connectorTypes'):
        for ct in wiring['connectorTypes']:
            inst.append(f"Connector: {ct.get('type','')} - {ct.get('pins','')}")
    if wiring.get('requiresExternalTermination'):
        inst.append("⚠️ External 120Ω termination resistors REQUIRED at both ends")
    if wiring.get('builtInTermination'):
        inst.append("✅ Built-in termination available (enable via DIP switch or parameter)")
    
    manual['installation'] = inst
    
    # ---- Enrich remarks ----
    remarks = []
    regs = vm.get('registerMap', {})
    ctrl = regs.get('control', [])
    mon = regs.get('monitor', [])
    faults = vm.get('faultCodes', {})
    if ctrl or mon:
        remarks.append(f"Register Map: {len(ctrl)} control + {len(mon)} monitor registers documented.")
    if faults:
        remarks.append(f"Fault Codes: {len(faults)} fault codes documented.")
    if vm.get('quickTest'):
        remarks.append(f"Quick Test: {vm['quickTest'].get('description','')}")
    
    # Add any special notes
    if ms.get('note'):
        remarks.append(f"Note: {ms['note']}")
    if ms.get('enableLinkNote'):
        remarks.append(ms['enableLinkNote'])
    
    manual['remarks'] = ' | '.join(remarks) if remarks else "See full details on the VFD dashboard."
    
    # ---- Add Modbus settings summary for quick reference ----
    manual['modbusSummary'] = {
        'baudRate': ms.get('baudRate',{}).get('default','9600') if isinstance(ms.get('baudRate'), dict) else '9600',
        'parity': ms.get('parity',{}).get('default','8N1') if isinstance(ms.get('parity'), dict) else '8N1',
        'slaveIdParam': ms.get('slaveAddress',{}).get('parameter','') if isinstance(ms.get('slaveAddress'), dict) else '',
        'powerCycleRequired': ms.get('powerCycleRequired', False),
        'quickSteps': ms.get('quickSetupSteps', []),
    }
    
    # ---- Add register summary ----
    manual['registerSummary'] = {
        'control': [{'name': r.get('name',''), 'address': r.get('address','')} for r in ctrl],
        'monitor': [{'name': r.get('name',''), 'address': r.get('address',''), 'unit': r.get('unit',''), 'scale': r.get('scale','')} for r in mon],
    }
    
    # ---- Add fault summary ----
    manual['faultSummary'] = faults
    
    # ---- Add wiring summary ----
    manual['wiringSummary'] = {
        'terminals': wiring.get('terminals', {}),
        'connectorTypes': wiring.get('connectorTypes', []),
        'builtInTermination': wiring.get('builtInTermination', False),
        'requiresExternalTermination': wiring.get('requiresExternalTermination', False),
        'terminationValue': wiring.get('terminationValue', '120Ω 0.25W'),
        'terminationPlacement': wiring.get('terminationPlacement', ''),
        'cableType': wiring.get('cableType', 'Shielded twisted pair'),
        'note': wiring.get('note', ''),
    }
    
    # ---- Add quick test ----
    manual['quickTest'] = vm.get('quickTest', {})
    
    # ---- Sync images if vfd has more specific ones ----
    vfdImages = vm.get('images', [])
    vfdTermImages = wiring.get('terminationImages', [])
    vfdPinout = wiring.get('pinoutImage', '')
    vfdNotes = wiring.get('notesImage', '')
    allVfdImgs = [img for img in [*vfdImages, *vfdTermImages, vfdPinout, vfdNotes] if img]
    if allVfdImgs and not manual.get('images'):
        manual['images'] = allVfdImgs
    
    # ---- Ensure PDFs are consistent with vfd.json ----
    vfdPdfs = vm.get('pdfs', [])
    if vfdPdfs:
        # Keep existing pdfs that aren't in vfd, add vfd ones
        existingUrls = {p.get('url','') for p in manual.get('pdfs', [])}
        for p in vfdPdfs:
            if p.get('url','') not in existingUrls:
                manual['pdfs'].append(p)
    
    print(f"  ✓ {mid}: enriched")

# Write
with open(manualsPath, 'w', encoding='utf-8') as f:
    json.dump(manuals, f, indent=2, ensure_ascii=False)

print(f"\nEnriched {len(manuals['manuals'])} manuals")
