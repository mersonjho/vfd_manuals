#!/usr/bin/env python3
"""Build comprehensive vfd.json from verified manual extractions."""
import json, os

OUT = "data/vfd.json"

vfd = {
    "universal": {
        "protocol": "Modbus RTU",
        "hardware": "RS-485 half-duplex multi-drop",
        "defaultBaud": 9600,
        "defaultParity": "8N1 (8 data bits, No parity, 1 stop bit)",
        "slaveIdRange": "1-247",
        "cable": "Shielded twisted pair, 120\u03a9 impedance, 18-22 AWG",
        "termination": "120\u03a9 0.25W resistors at BOTH ends of the RS-485 line",
        "maxDistance": "~1000m @ 9600 bps",
        "topology": "Multi-drop daisy chain (no long stubs)",
        "wiringPins": {
            "A_plus": "Positive / Non-Inverting (A+)",
            "B_minus": "Negative / Inverting (B-)",
            "GND": "Ground reference (connect all devices)",
            "Shield": "Ground at ONE end only (master side)"
        },
        "bestPractices": [
            "Use shielded twisted pair rated for industrial environments (Cat5e or better)",
            "Terminate BOTH ends of the RS-485 line with 120\u03a9 resistors",
            "Shield grounded at ONE end only (preferably at master/PLC)",
            "Keep cable runs under 1000m",
            "Separate RS-485 cables from high-current power cables (min 6 inches)",
            "Test communication after installation with a Modbus tool"
        ],
        "commonMistakes": [
            "Using non-shielded cable \u2192 noise and communication errors",
            "Connecting termination resistor to only one end \u2192 signal reflections",
            "Grounding shield at both ends \u2192 ground loop current",
            "Using different cable types for segments",
            "Daisy-chaining devices with long stubs"
        ],
        "terminationDiagram": "Master PLC [A+]----120\u03a9----[B-] ===== bus ===== [A+]----120\u03a9----[B-] Last VFD"
    },
    "models": {}
}

m = vfd["models"]

# ============================================================
# TECO A510 / A510s  (25 units deployed - most common)
# ============================================================
m["TECO"] = {
    "id": "TECO",
    "title": "TECO A510 / A510s",
    "manufacturer": "TECO (Taiwan)",
    "family": "A510 Series",
    "unitsDeployed": 25,
    "locations": ["Small Batch Area", "Medium Batch", "Milling Area", "New Platform", "Old Platform"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (S+/S- terminals)"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "Sn-37",
            "options": {"0": 1200, "1": 2400, "2": 4800, "3": 9600, "4": 19200, "5": 38400}
        },
        "parity": {
            "default": "8N1 (No Parity)",
            "parameter": "Sn-38",
            "options": {"0": "No Parity (8N1)", "1": "Even Parity", "2": "Odd Parity"}
        },
        "slaveAddress": {"range": "1-31", "default": 1, "parameter": "Sn-36"},
        "runCommandSource": {
            "parameter": "Sn-04",
            "requiredValue": 2,
            "description": "Set to 2 = Operation Command from RS-485 port"
        },
        "frequencyCommandSource": {
            "parameter": "Sn-05",
            "requiredValue": 2,
            "description": "Set to 2 = Frequency Command from RS-485 port"
        },
        "commFaultTimeout": {
            "parameter": "Cn-27",
            "default": "1.0s",
            "range": "0.0-25.5s",
            "note": "00.0 = Communication fault detection disabled"
        },
        "commFaultStopMethod": {
            "parameter": "Sn-39",
            "default": 0,
            "options": {"0": "Decelerate to stop", "1": "Free-run stop", "2": "Fast deceleration", "3": "Continue running"}
        },
        "powerCycleRequired": True,
        "powerCycleNote": "After changing Sn-37 or Sn-38, power inverter OFF then ON to apply new settings.",
        "quickSetupSteps": [
            "1. Set Sn-36 = desired slave address (1-31)",
            "2. Set Sn-37 = 3 (9600 bps)",
            "3. Set Sn-38 = 0 (8N1, No Parity)",
            "4. Set Sn-04 = 2 (Run command via RS-485)",
            "5. Set Sn-05 = 2 (Frequency command via RS-485)",
            "6. Power cycle the inverter",
            "7. Verify: LED shows blinking \u2018CE-r\u2019 when waiting for Modbus data"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "S(+)", "B_minus": "S(-)"},
        "builtInTermination": False,
        "requiresExternalTermination": True,
        "terminationValue": "120\u03a9 0.25W",
        "terminationPlacement": "Between S(+) and S(-) at BOTH ends of the RS-485 bus",
        "cableType": "Shielded twisted pair"
    },
    "registerMap": {
        "control": [
            {"name": "Run/Stop", "address": "0001H (Coil 1)", "function": "01H Read / 05H Write", "description": "Write 1 = RUN, 0 = STOP. Sn-04 must = 2 first.", "example": "01 05 00 01 FF 00 [CRC]"},
            {"name": "Frequency Reference", "address": "0002H (Register 2)", "function": "06H Write / 03H Read", "unit": "0.01 Hz", "description": "Write frequency setpoint. Value = Hz \u00d7 100. E.g. 5000 = 50.00 Hz.", "example": "01 06 00 02 13 88 [CRC] (50.00Hz)"},
            {"name": "Fault Reset", "address": "0004H (Coil 4)", "function": "05H Write", "description": "Write 1 to reset trip (rising edge)."},
            {"name": "Forward/Reverse", "address": "0001H Bit 1", "function": "Coil control word", "description": "Bit 1: 0=Forward, 1=Reverse"}
        ],
        "monitor": [
            {"name": "Status Word", "address": "0020H (32)", "function": "03H Read", "unit": "Bitfield", "description": "Bit 0=RUN, 1=ZeroSpeed, 2=Reverse, 3=Ready, 4=PRG/DRV, 6=Alarm, 7=Fault"},
            {"name": "Output Frequency", "address": "0025H (37)", "function": "03H Read", "unit": "0.01 Hz", "scale": "\u00f7 100", "example": "Value 5000 = 50.00 Hz"},
            {"name": "Output Current", "address": "0027H (39)", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10", "example": "Value 125 = 12.5 A"},
            {"name": "Output Voltage", "address": "0026H (38)", "function": "03H Read", "unit": "1 V", "scale": "\u00d7 1"},
            {"name": "DC Bus Voltage", "address": "0028H (40)", "function": "03H Read", "unit": "1 V"},
            {"name": "Frequency Command (Monitor)", "address": "0024H (36)", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Digital Input Status", "address": "002CH (44)", "function": "03H Read", "unit": "Bitfield"}
        ],
        "faultStatus": [
            {"name": "Fault Word 1", "address": "0021H (33)", "function": "03H Read", "bits": [
                "0: Under Voltage (UV1)", "1: Over Current (OC)", "2: Over Voltage (OV)",
                "3: Over Heat (OH)", "4: Motor Overload (OL1)", "5: Inverter Overload (OL2)",
                "6: Over Torque (OL3)", "7: External Fault 3", "8: External Fault 5",
                "9: External Fault 6", "10: External Fault 7", "11: External Fault 8",
                "12: EEPROM Fault", "13: CPU A/D Fault", "14: Ground Fault (GF)"
            ]},
            {"name": "Fault Word 2 (Alarms)", "address": "0022H (34)", "function": "03H Read", "bits": [
                "2: Braking Resistor Overheat", "3: RS-485 Communication Fault"
            ]},
            {"name": "Alarm Word", "address": "0023H (35)", "function": "03H Read", "bits": [
                "0: Under Voltage Alarm", "1: Over Voltage Alarm", "2: Over Heat Alarm",
                "3: Over Torque Alarm", "4: External Alarm", "12: RS-485 Communication Alarm"
            ]}
        ]
    },
    "faultCodes": {
        "OC": "Over Current - Check motor load and cable integrity",
        "OV": "Over Voltage - Check input supply and deceleration time",
        "UV1": "Under Voltage - Verify power supply stability",
        "OH": "Over Heat - Improve ventilation, check ambient temperature",
        "OL1": "Motor Overload - Reduce load, check mechanical friction",
        "OL2": "Inverter Overload - Reduce load or increase capacity",
        "OL3": "Over Torque - Check mechanical binding",
        "GF": "Ground Fault - Check motor winding isolation",
        "CE-r": "RS-485 Communication Error - Verify wiring, baud rate, and address",
        "EEPROM": "EEPROM Fault - Possible hardware issue",
        "CPU": "CPU A/D Fault - Hardware fault"
    },
    "quickTest": {
        "description": "Verify with Modbus master tool (ModScan, Simply Modbus, etc.)",
        "readOutputFrequency": "01 03 00 25 00 01 [CRC16] \u2192 Response should contain frequency value",
        "note": "LED display stops blinking 'CE-r' once communication is established"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/TECO/guide/TECO-A510-A510S-MODBUS-SETUP.pdf"},
        {"label": "Register Address List", "url": "/manuals/TECO/guide/TECO-A510-A510S-REGISTER-ADDRESS-LIST.pdf"},
        {"label": "A510 Communication Addendum", "url": "/manuals/TECO/A510-Communication-Addendum.pdf"},
        {"label": "A510 Instruction Manual", "url": "/manuals/TECO/A510-Instruction-Manual.pdf"},
        {"label": "A510s Instruction Manual", "url": "/manuals/TECO/A510s-Instruction-Manual.pdf"}
    ],
    "images": []
}

# ============================================================
# VACON 100  (11 units deployed)
# ============================================================
m["VACON-100"] = {
    "id": "VACON-100",
    "title": "VACON 100",
    "manufacturer": "VACON / Danfoss (Finland)",
    "family": "VACON 100 Series (Industrial, Flow, HVAC, X)",
    "unitsDeployed": 11,
    "locations": ["Small Batch Area", "Medium Batch", "Milling Area", "EE Room 1", "EE Room 2", "New Platform"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (RJ-45 or terminal block)", "Ethernet (Modbus TCP/UDP)"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "P5.8.3.1.2 (Communication speed)",
            "options": {"1200": 1200, "2400": 2400, "4800": 4800, "9600": 9600, "19200": 19200, "38400": 38400, "57600": 57600, "115200": 115200}
        },
        "parity": {
            "default": "8N1",
            "parameter": "P5.8.3.1.3 (Communication format)",
            "options": {"8N1": "8 data, No parity, 1 stop", "8E1": "8 data, Even parity, 1 stop", "8O1": "8 data, Odd parity, 1 stop"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "P5.8.3.1.1 (Slave address)"},
        "protocolSelection": {"parameter": "P5.8.3.1.4 (Communication protocol)", "default": "Modbus RTU", "pageRef": 10},
        "controlPlace": {"parameter": "P3.2.1 (Control Place)", "requiredValue": "Fieldbus", "description": "Set to Fieldbus for Modbus control"},
        "fieldbusControl": True,
        "quickSetupSteps": [
            "1. Set P5.8.3.1.1 = desired slave address (1-247)",
            "2. Set P5.8.3.1.2 = 9600 (baud rate)",
            "3. Set P5.8.3.1.3 = 8N1 (format)",
            "4. Set P5.8.3.1.4 = Modbus RTU",
            "5. Set P3.2.1 = Fieldbus (for Modbus control of Run/Ref)",
            "6. Power cycle recommended"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "RJ-45 pin or terminal A+", "B_minus": "RJ-45 pin or terminal B-"},
        "builtInTermination": True,
        "terminationNote": "Built-in 120\u03a9 termination can be enabled via DIP switch or parameter",
        "cableType": "Shielded twisted pair, Cat5e or better"
    },
    "registerMap": {
        "control": [
            {"name": "Control Word (CiA402)", "address": "8501 (0x2135)", "function": "06H / 10H Write", "unit": "Bitfield", "description": "Bit 0=SwitchOn, Bit 1=EnableVoltage, Bit 2=QuickStop, Bit 3=EnableOperation, Bit 7=FaultReset", "note": "Standard CiA402 state machine"},
            {"name": "Extended Control Word", "address": "8504 (0x2138)", "function": "06H / 10H Write", "unit": "Bitfield"},
            {"name": "Frequency Reference (LFR)", "address": "8502 (0x2136)", "function": "06H / 10H Write", "unit": "0.01 Hz", "scale": "\u00f7 100", "example": "Write 5000 = 50.00 Hz"},
            {"name": "Fault Reset Command", "address": "7124 (0x1BD4)", "function": "06H Write", "unit": "UINT16", "description": "Write 1 to reset fault"},
            {"name": "Run/Enable", "address": "Control Word 8501", "function": "See CiA402 state machine", "description": "Sequence: 0x06 \u2192 0x07 \u2192 0x0F (Run)"}
        ],
        "monitor": [
            {"name": "Status Word (CiA402)", "address": "3201 (0x0C81)", "function": "03H Read", "unit": "Bitfield", "description": "Standard CiA402 status bits"},
            {"name": "Output Frequency (RFR)", "address": "3202 (0x0C82)", "function": "03H Read", "unit": "0.1 Hz", "scale": "\u00f7 10", "example": "Value 500 = 50.0 Hz"},
            {"name": "Output Current", "address": "3203 (0x0C83)", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10"},
            {"name": "Output Voltage", "address": "3204 (0x0C84)", "function": "03H Read", "unit": "1 V"},
            {"name": "Output Power", "address": "3205 (0x0C85)", "function": "03H Read", "unit": "0.01 kW"},
            {"name": "Motor Speed (RPM)", "address": "3210 (0x0C8A)", "function": "03H Read", "unit": "1 RPM"},
            {"name": "DC Bus Voltage", "address": "3215 (0x0C8F)", "function": "03H Read", "unit": "1 V"},
            {"name": "Active Fault Code", "address": "7121 (0x1BD1)", "function": "03H Read", "unit": "UINT16", "description": "See fault code enumeration"}
        ]
    },
    "faultCodes": {
        "0x0000": "No Fault",
        "0x0001": "Over Current",
        "0x0002": "Over Voltage",
        "0x0003": "Under Voltage",
        "0x0004": "Over Temperature",
        "0x0005": "Motor Overload",
        "0x0006": "Inverter Overload",
        "0x0009": "Earth/Ground Fault",
        "0x000B": "Brake Chopper Fault",
        "0x000F": "Communication Fault (Fieldbus)",
        "0x0011": "External Fault",
        "0x0028": "Encoder Fault"
    },
    "quickTest": {
        "description": "Read Output Frequency register to verify communication",
        "readCommand": "01 03 0C 82 00 01 [CRC16]",
        "expectedResponse": "01 03 02 [XX XX] [CRC16] where XX XX = frequency \u00d7 10"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/VACON/guide/VACON-100-MODBUS-SETUP.pdf"},
        {"label": "Register Address List", "url": "/manuals/VACON/guide/VACON-100-REGISTER-ADDRESS-LIST.pdf"},
        {"label": "Modbus User Manual (Full)", "url": "/manuals/VACON/Vacon-100-Modbus-User-Manual-DPD00156D-UK.pdf"},
        {"label": "FLOW Application Manual", "url": "/manuals/VACON/Vacon-100-FLOW-Application-Manual-DPD01083D-UK.pdf"}
    ],
    "images": []
}

# ============================================================
# TEK DRIVE TDS-V8  (13 units deployed)
# ============================================================
m["TEK-V8"] = {
    "id": "TEK-V8",
    "title": "TEK DRIVE TDS-V8",
    "manufacturer": "TEK DRIVE (Taiwan)",
    "family": "TDS-V8 Series",
    "unitsDeployed": 13,
    "locations": ["Small Batch Area", "Medium Batch"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (S+/S- terminals)"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "Sn-37",
            "options": {"0": 1200, "1": 2400, "2": 4800, "3": 9600}
        },
        "parity": {
            "default": "8N1 (No Parity)",
            "parameter": "Sn-38",
            "options": {"0": "No Parity (8N1)", "1": "Even Parity", "2": "Odd Parity"}
        },
        "slaveAddress": {"range": "1-31", "default": 1, "parameter": "Sn-36"},
        "runCommandSource": {
            "parameter": "Sn-04",
            "requiredValue": 2,
            "description": "Set to 2 = Operation Command from RS-485 port"
        },
        "frequencyCommandSource": {
            "parameter": "Sn-05",
            "requiredValue": 2,
            "description": "Set to 2 = Frequency Command from RS-485 port"
        },
        "commFaultTimeout": {
            "parameter": "Cn-27",
            "default": "1.0s",
            "note": "Set to 00.0 to disable communication fault detection"
        },
        "commFaultStopMethod": {
            "parameter": "Sn-39",
            "default": 0,
            "options": {"0": "Decelerate to stop (bn-02)", "1": "Free-run stop", "2": "Fast deceleration", "3": "Continue running"}
        },
        "powerCycleRequired": True,
        "powerCycleNote": "After changing Sn-37 or Sn-38, POWER OFF then ON to apply.",
        "standbyIndicator": "LED shows blinking 'CE-r' when correctly configured and waiting for Modbus master.",
        "quickSetupSteps": [
            "1. Set Sn-36 = desired slave address (1-31)",
            "2. Set Sn-37 = 3 (9600 bps)",
            "3. Set Sn-38 = 0 (8N1, No Parity)",
            "4. Set Sn-04 = 2 (Run command via RS-485)",
            "5. Set Sn-05 = 2 (Frequency command via RS-485)",
            "6. Optional: Set Cn-27 (comm fault time) and Sn-39 (fault stop method)",
            "7. Power cycle the inverter",
            "8. Check LED display: blinking 'CE-r' = waiting for Modbus data"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "S(+)", "B_minus": "S(-)"},
        "builtInTermination": False,
        "requiresExternalTermination": True,
        "terminationValue": "120\u03a9 0.25W",
        "terminationPlacement": "Between S(+) and S(-) at BOTH ends of the RS-485 bus",
        "cableType": "Shielded twisted pair",
        "note": "NO BUILT-IN TERMINATION. MUST use external 120\u03a9 resistors at both ends."
    },
    "registerMap": {
        "control": [
            {"name": "Control Word (Run/Stop)", "address": "0000H (0)", "function": "06H / 10H Write", "unit": "Bitfield", "description": "Bit 0: 0=STOP, 1=RUN | Bit 1: 0=Forward, 1=Reverse | Bit 2: External Fault | Bit 3: Fault Reset (rising edge) | Bit 8: Switch to DRV mode | Bit 9: Switch to PRG mode"},
            {"name": "Frequency Reference", "address": "0001H (1)", "function": "06H / 10H Write", "unit": "0.01% of Cn-02", "description": "30000 = 100% of Max Output Frequency (Cn-02). E.g. 15000 = 50% of Cn-02.", "example": "Write 15000 = 50.00 Hz if Cn-02=100.00Hz"},
            {"name": "Output Terminal Control", "address": "0007H (7)", "function": "06H / 10H Write", "unit": "Bitfield", "description": "Bit 0: R1A-R1B-R1C | Bit 1: DO1-DOG | Bit 2: R2A-R2C"}
        ],
        "monitor": [
            {"name": "Status Word 1", "address": "0020H (32)", "function": "03H Read", "unit": "Bitfield", "description": "Bit 0=RUN, 1=ZeroSpeed, 2=Reverse, 3=Ready, 4=DRV mode, 5=440V series, 6=Alarm, 7=Fault"},
            {"name": "Output Frequency", "address": "0025H (37)", "function": "03H Read", "unit": "0.01% of Cn-02", "scale": "30000 = 100%", "example": "15000 = 50.00 Hz (if Cn-02=100Hz)"},
            {"name": "Output Current", "address": "0027H (39)", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10"},
            {"name": "Output Voltage", "address": "0026H (38)", "function": "03H Read", "unit": "1 V"},
            {"name": "DC Bus Voltage", "address": "0028H (40)", "function": "03H Read", "unit": "1 V"},
            {"name": "Frequency Command (Monitor)", "address": "0024H (36)", "function": "03H Read", "unit": "0.01%"},
            {"name": "Analog Input VIN", "address": "0029H (41)", "function": "03H Read", "unit": "10V = 100.0%"},
            {"name": "Analog Input AIN", "address": "002AH (42)", "function": "03H Read", "unit": "20mA = 100.0%"},
            {"name": "Digital Input Status", "address": "002CH (44)", "function": "03H Read", "unit": "Bitfield"}
        ],
        "faultStatus": [
            {"name": "Fault Word 1", "address": "0021H (33)", "function": "03H Read", "bits": [
                "0: Under Voltage (UV1)", "1: Over Current (OC)", "2: Over Voltage (OV)",
                "3: Over Heat (OH)", "4: Motor Overload (OL1)", "5: Inverter Overload (OL2)",
                "6: Over Torque (OL3)", "7: External Fault 3", "8: External Fault 5",
                "9: External Fault 6", "10: External Fault 7", "11: External Fault 8",
                "12: EEPROM Fault", "13: CPU A/D Fault", "14: Ground Fault (GF)"
            ]},
            {"name": "Alarm/Status Words", "address": "0022H-0023H (34-35)", "function": "03H Read", "bits": [
                "0022H Bit 2: Braking Resistor Overheat Alarm", "0022H Bit 3: RS-485 Communication Alarm",
                "0023H Bit 0: Under Voltage Alarm", "0023H Bit 1: Over Voltage Alarm",
                "0023H Bit 12: RS-485 Communication Alarm"
            ]}
        ]
    },
    "faultCodes": {
        "UV1": "Under Voltage",
        "OC": "Over Current",
        "OV": "Over Voltage",
        "OH": "Over Heat",
        "OL1": "Motor Overload",
        "OL2": "Inverter Overload",
        "OL3": "Over Torque",
        "GF": "Ground Fault",
        "CE-r": "RS-485 Communication Error",
        "EEPROM": "EEPROM Fault"
    },
    "quickTest": {
        "description": "Read Output Frequency (0025H) to verify communication",
        "readCommand": "01 03 00 25 00 01 [CRC16]"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/TEK DRIVE/guide/TDS-V8/TDS-V8-MODBUS-SETUP.pdf"},
        {"label": "Register Address List", "url": "/manuals/TEK DRIVE/guide/TDS-V8/TDS-V8-REGISTER-ADDRESS-LIST.pdf"},
        {"label": "TDS-V8 Instruction Manual", "url": "/manuals/TEK DRIVE/TDS-V8-Instruction-Manual.pdf"},
        {"label": "Modbus Instruction Details", "url": "/manuals/TEK DRIVE/guide/TDS-V8/tds-v8-modbus-instuction.pdf"}
    ],
    "images": []
}

# ============================================================
# TEK DRIVE TDS-F8  (1 unit deployed)
# ============================================================
m["TEK-F8"] = {
    "id": "TEK-F8",
    "title": "TEK DRIVE TDS-F8",
    "manufacturer": "TEK DRIVE (Taiwan)",
    "family": "TDS-F8 Series",
    "unitsDeployed": 1,
    "locations": ["Small Batch Area"],
    "voltage": "220VAC",
    "communicationPorts": ["RS-485 (S+/S- terminals)"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "09-02",
            "options": {"0": 1200, "1": 2400, "2": 4800, "3": 9600}
        },
        "parity": {
            "default": "8N1 (No Parity)",
            "parameter": "09-03",
            "options": {"0": "No Parity (8N1)", "1": "Even Parity", "2": "Odd Parity"}
        },
        "slaveAddress": {"range": "1-31", "default": 1, "parameter": "09-01"},
        "runCommandSource": {
            "parameter": "02-01",
            "requiredValue": 2,
            "description": "Set to 2 = Operation Command from RS-485"
        },
        "frequencyCommandSource": {
            "parameter": "02-02",
            "requiredValue": 2,
            "description": "Set to 2 = Frequency Command from RS-485"
        },
        "commFaultStopMethod": {
            "parameter": "09-04",
            "default": 0,
            "options": {"0": "Decelerate (1-13)", "1": "Free-run stop", "2": "Fast decel (1-15)", "3": "Continue running"}
        },
        "commFaultTimeout": {
            "parameter": "09-05",
            "default": "1.0s",
            "range": "0.0-25.5s",
            "note": "00.0 = communication fault detection disabled"
        },
        "powerCycleRequired": True,
        "powerCycleNote": "After changing 09-02 or 09-03, POWER OFF then ON to apply.",
        "quickSetupSteps": [
            "1. Set 09-01 = desired slave address (1-31)",
            "2. Set 09-02 = 3 (9600 bps)",
            "3. Set 09-03 = 0 (8N1, No Parity)",
            "4. Set 02-01 = 2 (Run command via RS-485)",
            "5. Set 02-02 = 2 (Frequency command via RS-485)",
            "6. Set 09-04 and 09-05 as needed (fault behavior)",
            "7. Power cycle the inverter"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "S(+)", "B_minus": "S(-)"},
        "builtInTermination": False,
        "requiresExternalTermination": True,
        "terminationValue": "120\u03a9 0.25W",
        "terminationPlacement": "Between S(+) and S(-) at BOTH ends",
        "cableType": "Shielded twisted pair",
        "note": "Up to 31 inverters on one RS-485 link"
    },
    "registerMap": {
        "control": [
            {"name": "Run/Stop", "address": "0001H (1)", "function": "05H / 06H Write", "description": "Coil or Register write. 1=RUN, 0=STOP."},
            {"name": "Frequency Reference", "address": "0002H (2)", "function": "06H / 10H Write", "unit": "0.01 Hz", "description": "Write frequency setpoint. Value = Hz \u00d7 100."},
            {"name": "Fault Reset", "address": "0004H (4)", "function": "05H Write", "description": "Write 1 to reset trip."}
        ],
        "monitor": [
            {"name": "Output Frequency", "address": "0025H (37)", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Output Current", "address": "0027H (39)", "function": "03H Read", "unit": "0.1 A"},
            {"name": "Output Voltage", "address": "0026H (38)", "function": "03H Read", "unit": "1 V"},
            {"name": "Status Word", "address": "0020H (32)", "function": "03H Read", "unit": "Bitfield"}
        ],
        "faultStatus": [
            {"name": "Fault Word", "address": "0021H (33)", "function": "03H Read", "description": "Same bit mapping as TDS-V8 fault words"}
        ]
    },
    "faultCodes": {
        "OC": "Over Current", "OV": "Over Voltage", "UV1": "Under Voltage",
        "OH": "Over Heat", "OL1": "Motor Overload", "OL2": "Inverter Overload",
        "GF": "Ground Fault", "CE-r": "RS-485 Communication Error"
    },
    "quickTest": {
        "readCommand": "01 03 00 25 00 01 [CRC16]",
        "description": "Read Output Frequency to verify Modbus communication"
    },
    "pdfs": [
        {"label": "Modbus Communication Manual", "url": "/manuals/TEK DRIVE/guide/TDS-F8/TDS-F8-MODBUS-Communication-Manual.pdf"},
        {"label": "TDS-F8 Instruction Manual", "url": "/manuals/TEK DRIVE/TDS-F8-Instruction-Manual.pdf"},
        {"label": "TDS-F8 Brief Manual", "url": "/manuals/TEK DRIVE/TDS-F8-Brief-Manual.pdf"}
    ],
    "images": []
}

# ============================================================
# SCHNEIDER ALTIVAR ATV320  (5 units deployed)
# ============================================================
m["SCHNEIDER-ATV320"] = {
    "id": "SCHNEIDER-ATV320",
    "title": "SCHNEIDER ALTIVAR ATV320",
    "manufacturer": "Schneider Electric (France)",
    "family": "Altivar 320 Series",
    "unitsDeployed": 5,
    "locations": ["Medium Batch"],
    "voltage": "220VAC",
    "communicationPorts": ["RS-485 (Modbus RTU)", "Ethernet (Modbus TCP)"],
    "modbusSettings": {
        "baudRate": {
            "default": 19200,
            "parameter": "tbr (Modbus baud rate)",
            "options": {"4800": 4800, "9600": 9600, "19200": 19200, "38400": 38400}
        },
        "parity": {
            "default": "8E1",
            "parameter": "tFO (Modbus format)",
            "options": {"8n1": "8 data, No parity, 1 stop", "8E1": "8 data, Even parity, 1 stop", "8O1": "8 data, Odd parity, 1 stop"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "Add (Modbus address)"},
        "note": "ATV320 factory defaults: 19200 bps, 8E1. Change to 9600, 8N1 to match your network standard.",
        "quickSetupSteps": [
            "1. Navigate to CONF \u2192 FULL \u2192 COMMUNICATION \u2192 Modbus",
            "2. Set Add = desired slave address (1-247)",
            "3. Set tbr = 9600 (match network standard)",
            "4. Set tFO = 8n1 (match network standard)",
            "5. Cycle power to apply changes"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "RJ-45 or terminal D1 (A+)", "B_minus": "RJ-45 or terminal D0 (B-)"},
        "builtInTermination": True,
        "terminationNote": "Built-in termination can be configured. Check manual for DIP switch settings.",
        "cableType": "Shielded twisted pair"
    },
    "registerMap": {
        "control": [
            {"name": "Control Word (CMD - CiA402)", "address": "8501 (0x2135)", "function": "06H / 10H Write", "unit": "UINT16", "description": "CiA402 state machine. Bit 0=SwitchOn, Bit 1=EnableVoltage, Bit 3=EnableOperation, Bit 7=FaultReset", "note": "State transitions: 06h \u2192 07h \u2192 0Fh = Run"},
            {"name": "Extended Control Word (CMI)", "address": "8504 (0x2138)", "function": "06H / 10H Write", "unit": "UINT16"},
            {"name": "Frequency Reference (LFR)", "address": "8502 (0x2136)", "function": "06H / 10H Write", "unit": "0.1 Hz", "scale": "\u00f7 10", "example": "Write 500 = 50.0 Hz (note: 0.1Hz/LSB, not 0.01Hz)"},
            {"name": "Fault Reset (RSF)", "address": "7124 (0x1BD4)", "function": "06H Write", "unit": "UINT16", "description": "Write 1 to reset fault"}
        ],
        "monitor": [
            {"name": "Status Word (ETA - CiA402)", "address": "3201 (0x0C81)", "function": "03H Read", "unit": "UINT16", "description": "CiA402 status bits"},
            {"name": "Output Frequency (RFR)", "address": "3202 (0x0C82)", "function": "03H Read", "unit": "0.1 Hz", "scale": "\u00f7 10", "example": "Value 500 = 50.0 Hz"},
            {"name": "Output Current (LCR)", "address": "3204 (0x0C84)", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10"},
            {"name": "Output Voltage", "address": "3205 (0x0C85)", "function": "03H Read", "unit": "1 V"},
            {"name": "Output Power (OPR)", "address": "3206 (0x0C86)", "function": "03H Read", "unit": "0.01 kW"},
            {"name": "Motor Speed (SPD)", "address": "3203 (0x0C83)", "function": "03H Read", "unit": "1 RPM"},
            {"name": "Active Fault Code (LFT)", "address": "7121 (0x1BD1)", "function": "03H Read", "unit": "UINT16", "description": "See ATV320 fault code enumeration"}
        ]
    },
    "faultCodes": {
        "0x0000": "No Fault",
        "0x2310": "Over Current (OCF)",
        "0x2330": "Motor Short Circuit (SCF3)",
        "0x3210": "Over Voltage (SOF)",
        "0x3220": "Under Voltage (USF)",
        "0x4210": "Drive Overheat (OHF)",
        "0x4310": "Motor Overload (OLF)",
        "0x5110": "Modbus Communication Fault (SLF1)",
        "0x7110": "External Fault (EPF1/EPF2)",
        "0x7310": "Ground Fault (GFF)"
    },
    "quickTest": {
        "description": "Read Output Frequency (RFR = 3202) to verify communication",
        "readCommand": "01 03 0C 82 00 01 [CRC16]",
        "note": "ATV320 factory defaults to 19200/8E1. Change to 9600/8N1 to match network."
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/SCHNEIDER/guide/ALTIVAR-320D11M3C-MODBUS-SETUP.pdf"},
        {"label": "Register Address List", "url": "/manuals/SCHNEIDER/guide/ALTIVAR-320D11M3C-REGISTER-ADDRESS-LIST.pdf"},
        {"label": "Modbus Manual (EN)", "url": "/manuals/SCHNEIDER/ATV320_Modbus_manual_EN_NVE41308_01.pdf"},
        {"label": "Programming Manual", "url": "/manuals/SCHNEIDER/ATV320_Programming_Manual_EN_NVE41295_06.pdf"},
        {"label": "ATV320 User Manual", "url": "/manuals/SCHNEIDER/ATV320 MANUAL.pdf"}
    ],
    "images": []
}

# ============================================================
# HITACHI SJ700 / SJ700N  (3 + 2 = 5 units deployed)
# ============================================================
m["HITACHI-SJ700"] = {
    "id": "HITACHI-SJ700",
    "title": "HITACHI SJ700 / SJ700N Series",
    "manufacturer": "HITACHI (Japan)",
    "family": "SJ700 / SJ700N Series",
    "unitsDeployed": 5,
    "locations": ["EE Room 2", "EE Room 3", "New Platform", "Old Platform"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (terminal block)", "Optional: Profibus, CANopen"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "C071 (Communication speed selection)",
            "options": {"02": 2400, "03": 4800, "04": 9600, "05": 19200, "06": 38400, "07": 57600, "08": 115200}
        },
        "parity": {
            "default": "8N1 (No Parity)",
            "parameter": "C074 (Parity) + C075 (Stop bits)",
            "options": {"C074=00": "No Parity", "C074=01": "Even Parity", "C074=02": "Odd Parity", "C075=1": "1 Stop bit", "C075=2": "2 Stop bits"}
        },
        "slaveAddress": {"range": "1-32", "default": 1, "parameter": "C072 (Communication station number)"},
        "runCommandSource": {
            "parameter": "A002",
            "requiredValue": "03 (Modbus)",
            "description": "Set A002=03 for run command via Modbus"
        },
        "frequencyCommandSource": {
            "parameter": "A001",
            "requiredValue": "03 (Modbus)",
            "description": "Set A001=03 for frequency reference via Modbus"
        },
        "quickSetupSteps": [
            "1. Set C071 = 04 (9600 bps)",
            "2. Set C072 = desired slave address (1-32)",
            "3. Set C074 = 00 (No parity)",
            "4. Set C075 = 1 (1 stop bit) for 8N1",
            "5. Set A001 = 03 (Frequency via Modbus)",
            "6. Set A002 = 03 (Run command via Modbus)",
            "7. Cycle power to apply"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "SP (Send/Receive +)", "B_minus": "SN (Send/Receive -)"},
        "builtInTermination": True,
        "terminationNote": "Built-in 120\u03a9 termination resistor. Enable by setting DIP switch or shorting terminal.",
        "cableType": "Shielded twisted pair"
    },
    "registerMap": {
        "control": [
            {"name": "Run Command", "address": "4610 (0x1202)", "function": "06H / 10H Write", "unit": "UINT16", "description": "1=Terminal, 2=Keypad, 3=Modbus (matches A002)"},
            {"name": "Frequency Reference", "address": "1101H & 1102H (F001)", "function": "06H / 10H Write", "unit": "0.01 Hz", "description": "32-bit value. Write frequency \u00d7 100.", "example": "5000 = 50.00 Hz"},
            {"name": "Run/Stop Coil", "address": "0001H (Coil)", "function": "05H Write", "description": "Write 1=RUN, 0=STOP. A002 must = 03."},
            {"name": "Fault Reset Coil", "address": "0004H (Coil)", "function": "05H Write", "description": "Write 1 to reset trip."}
        ],
        "monitor": [
            {"name": "Output Frequency", "address": "1001H & 1002H (d001)", "function": "03H Read", "unit": "0.01 Hz", "scale": "\u00f7 100", "description": "32-bit value"},
            {"name": "Output Current", "address": "1003H (d002)", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10"},
            {"name": "Trip Factor (Fault Code)", "address": "0012H (d081)", "function": "03H Read", "unit": "UINT16", "description": "Upper byte = fault code, lower byte = inverter status"},
            {"name": "Parity Error Status", "address": "4917 (0x1335)", "function": "03H Read", "unit": "UINT16", "description": "1=Error, 0=No Error (Coil 004Dh)"},
            {"name": "Output Voltage", "address": "1004-1006H range", "function": "03H Read", "unit": "1 V"}
        ]
    },
    "faultCodes": {
        "E01": "Over Current (OC1-OC3)",
        "E02": "Over Current (OC4)",
        "E03": "Overload (OL1/OL2)",
        "E04": "Overload (TH)",
        "E07": "Over Voltage (OV)",
        "E09": "Under Voltage (UV)",
        "E10": "CT Error",
        "E12": "External Fault (EXT)",
        "E14": "Ground Fault (GFF)",
        "E21": "Inverter Thermal Trip",
        "E23": "Gate Array Error",
        "E30": "Driver Error",
        "E35": "Thermistor Error",
        "E40": "Communication Error (Modbus)",
        "E43": "Operator Connection Error",
        "E60": "Option Error"
    },
    "quickTest": {
        "readCommand": "01 03 10 03 00 01 [CRC16] (read Output Current from slave 1)",
        "description": "Master settings: Address=1, Baud=9600, Data=8, Parity=None, Stop=1"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/HITACHI/HITACHI-SJ700-SERIES/SETUP GUIDE AND PARAMETERS/HITACHI-SJ7000-SJ7000N-MODBUS-SETUP.pdf"},
        {"label": "Register Address List", "url": "/manuals/HITACHI/HITACHI-SJ700-SERIES/SETUP GUIDE AND PARAMETERS/HITACHI-SJ7000-SJ7000N-REGISTER-ADDRESS-LIST.pdf"},
        {"label": "RS-485 Setup Guide", "url": "/manuals/HITACHI/HITACHI-SJ700-SERIES/SETUP GUIDE AND PARAMETERS/Hitachi-SJ7002-RS485-SETUP.pdf"},
        {"label": "SJ700 Instruction Manual", "url": "/manuals/HITACHI/HITACHI-SJ700-SERIES/HITACHI-SJ7002-Instruction-Manual.pdf"},
        {"label": "SJ700N Manual", "url": "/manuals/HITACHI/HITACHI-SJ700N-SERIES/HITACHI-SJ700N.pdf"}
    ],
    "images": []
}

# ============================================================
# HITACHI SH1 / P1 Series  (2 units deployed)
# ============================================================
m["HITACHI-SH1"] = {
    "id": "HITACHI-SH1",
    "title": "HITACHI SH1 / P1 Series",
    "manufacturer": "HITACHI (Japan)",
    "family": "SH1 / P1 Series",
    "unitsDeployed": 2,
    "locations": ["EE Room 4 (Putty Expansion Platform)"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (RJ-45 or terminal block)", "CANopen"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "CF-01 (RS-485 baud rate)",
            "options": {"0": 4800, "1": 9600, "2": 19200, "3": 38400, "4": 57600, "5": 115200}
        },
        "parity": {
            "default": "8N1",
            "parameter": "CF-03 (RS-485 parity)",
            "options": {"0": "No Parity (8N1)", "1": "Even Parity", "2": "Odd Parity"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "CF-02 (RS-485 address)"},
        "runCommandSource": {
            "parameter": "CA-71 (RUN command source)",
            "description": "Set to Modbus/RS-485 for communication control"
        },
        "frequencyCommandSource": {
            "parameter": "PA-02 (Frequency reference source)",
            "description": "Set to Modbus/RS-485"
        },
        "note": "SH1 uses CiA402-based control word (6040h) and status word (6041h)",
        "quickSetupSteps": [
            "1. Set CF-01 = 1 (9600 bps)",
            "2. Set CF-02 = desired slave address (1-247)",
            "3. Set CF-03 = 0 (8N1, No Parity)",
            "4. Set CA-71 = Modbus/RS-485",
            "5. Set PA-02 = Modbus/RS-485",
            "6. Power cycle to apply"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "RJ-45 or terminal A+", "B_minus": "RJ-45 or terminal B-"},
        "builtInTermination": True,
        "terminationNote": "DIP switch for built-in termination resistor. Check manual for position.",
        "cableType": "Shielded twisted pair",
        "faultResetNote": "Control word 6040h = 0x80 resets the inverter"
    },
    "registerMap": {
        "control": [
            {"name": "Control Word (6040h)", "address": "6040H", "function": "06H / 10H Write", "unit": "UINT16", "description": "CiA402 control word. 0x80 = Fault Reset. 0x06 \u2192 0x07 \u2192 0x0F = Run."},
            {"name": "Frequency Reference", "address": "via CANopen/Modbus mapping", "function": "06H / 10H Write", "unit": "0.01 Hz", "description": "Frequency setpoint. Value = Hz \u00d7 100."}
        ],
        "monitor": [
            {"name": "Status Word (6041h)", "address": "6041H", "function": "03H Read", "unit": "UINT16", "description": "CiA402 status word"},
            {"name": "Output Frequency (dA-01)", "address": "2001H", "function": "03H Read", "unit": "0.01 Hz", "scale": "\u00f7 100"},
            {"name": "Output Current (dA-02)", "address": "2002H", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10"},
            {"name": "Frequency Reference Monitor (dA-04)", "address": "2004H", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "RUN Command Reference (dC-10)", "address": "203EH", "function": "03H Read", "unit": "UINT16"},
            {"name": "Output Frequency Signed (dA-12)", "address": "2438H", "function": "03H Read", "unit": "0.01 Hz"}
        ]
    },
    "faultCodes": {
        "E01": "Over Current", "E02": "Overload", "E07": "Over Voltage",
        "E09": "Under Voltage", "E12": "External Fault", "E14": "Ground Fault",
        "E40": "Communication Error", "E43": "Operator Error"
    },
    "quickTest": {
        "readCommand": "01 03 20 01 00 01 [CRC16] (read Output Frequency dA-01)",
        "description": "Read status word 6041h or output frequency to verify"
    },
    "pdfs": [
        {"label": "SH1 Register Address List", "url": "/manuals/HITACHI/HITACHI-P1-SERIES-SH1-SERIES/Hitachi-SH1-Register-Address.pdf"},
        {"label": "SH1 User Manual", "url": "/manuals/HITACHI/HITACHI-P1-SERIES-SH1-SERIES/Hitachi-SH1-User-Manual.pdf"},
        {"label": "SH1 Basic Guide", "url": "/manuals/HITACHI/HITACHI-P1-SERIES-SH1-SERIES/Hitachi-SH1-Basic-Guide.pdf"}
    ],
    "images": []
}

# ============================================================
# YASKAWA A1000  (3 units deployed)
# ============================================================
m["YASKAWA-A1000"] = {
    "id": "YASKAWA-A1000",
    "title": "YASKAWA A1000",
    "manufacturer": "YASKAWA (Japan)",
    "family": "A1000 Series",
    "unitsDeployed": 3,
    "locations": ["EE Room 1 (Milling Area)"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (terminal block)", "Optional: Ethernet, CANopen, Profibus"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "H5-02 (Communication speed selection)",
            "options": {"0": 1200, "1": 2400, "2": 4800, "3": 9600, "4": 19200, "5": 38400, "6": 57600, "7": 115200}
        },
        "parity": {
            "default": "8N1 (No Parity)",
            "parameter": "H5-03 (Communication parity)",
            "options": {"0": "No Parity (8N1)", "1": "Even Parity", "2": "Odd Parity"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "H5-01 (Serial communication address)"},
        "runCommandSource": {
            "parameter": "b1-02 (Run command selection)",
            "requiredValue": 2,
            "description": "Set b1-02 = 2 for Serial Communication (Modbus) run command"
        },
        "frequencyCommandSource": {
            "parameter": "b1-01 (Frequency reference selection)",
            "requiredValue": 2,
            "description": "Set b1-01 = 2 for Serial Communication (Modbus) frequency reference"
        },
        "commFaultTimeout": {
            "parameter": "H5-09 (Communication fault detection time)",
            "default": "2.0s",
            "range": "0.0-10.0s",
            "note": "0.0 = disabled"
        },
        "commFaultStopMethod": {
            "parameter": "H5-04 (Stopping method after communication error)",
            "default": 3,
            "options": {"0": "Ramp to stop", "1": "Coast to stop", "2": "Fast-stop", "3": "Alarm only (continue running)"}
        },
        "rs485WaitTime": {
            "parameter": "H5-06 (Transmit wait time)",
            "default": "5 ms",
            "range": "5-65 ms"
        },
        "quickSetupSteps": [
            "1. Set H5-01 = desired slave address (1-247)",
            "2. Set H5-02 = 3 (9600 bps)",
            "3. Set H5-03 = 0 (8N1, No Parity)",
            "4. Set b1-01 = 2 (Frequency via Serial Comm)",
            "5. Set b1-02 = 2 (Run command via Serial Comm)",
            "6. Set H5-04 = 3 (Alarm only on comm fault - optional)",
            "7. Set H5-09 = 2.0s (comm fault detection time - optional)",
            "8. Power cycle to apply"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "R+ (Send/Receive +)", "B_minus": "R- (Send/Receive -)", "GND": "IG (Signal Ground)"},
        "builtInTermination": True,
        "terminationNote": "Built-in termination via DIP switch S2 on terminal board. Set to ON at line ends.",
        "cableType": "Shielded twisted pair"
    },
    "registerMap": {
        "control": [
            {"name": "Run Command", "address": "0001H (1)", "function": "05H Write (Coil)", "unit": "Bit", "description": "Write 1=RUN, 0=STOP. b1-02 must = 2."},
            {"name": "Frequency Reference", "address": "0002H (2)", "function": "06H Write", "unit": "0.01 Hz", "description": "Write frequency setpoint. Value = Hz \u00d7 100.", "example": "Write 5000 = 50.00 Hz"},
            {"name": "Fault Reset", "address": "0005H (5)", "function": "05H Write (Coil)", "unit": "Bit", "description": "Write 1 to reset fault"},
            {"name": "Forward/Reverse", "address": "0001H Bit", "function": "Bit in Run command", "description": "Forward: Write 1 to 0001H. Reverse: Write 1 to 0002H coil."},
            {"name": "External Fault EF0", "address": "0003H (3)", "function": "05H Write", "description": "External fault input via Modbus"},
            {"name": "Multi-Function Inputs", "address": "0009H-000FH (9-15)", "function": "05H Write", "description": "Coils mapped to multi-function inputs"}
        ],
        "monitor": [
            {"name": "Status Word", "address": "0020H (32)", "function": "03H Read", "unit": "Bitfield", "description": "Bit 0=RUN, Bit 1=ZeroSpeed, Bit 2=Reverse, Bit 3=ResetSignal, Bit 4=SpeedAgree, Bit 5=Ready, Bit 6=Alarm, Bit 7=Fault"},
            {"name": "Output Frequency", "address": "0031H (49)", "function": "03H Read", "unit": "0.01 Hz", "scale": "\u00f7 100", "example": "Value 5000 = 50.00 Hz"},
            {"name": "Output Current", "address": "0033H (51)", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10", "example": "Value 125 = 12.5 A"},
            {"name": "Output Voltage", "address": "0035H (53)", "function": "03H Read", "unit": "1 V", "scale": "\u00d7 1"},
            {"name": "Output Power", "address": "0037H (55)", "function": "03H Read", "unit": "0.01 kW", "scale": "\u00f7 100"},
            {"name": "Motor Speed (RPM)", "address": "0044H (68)", "function": "03H Read", "unit": "1 RPM"},
            {"name": "DC Bus Voltage", "address": "0040H (64)", "function": "03H Read", "unit": "1 V"},
            {"name": "Torque Reference", "address": "0046H (70)", "function": "03H Read", "unit": "0.1%"},
            {"name": "Frequency Reference Monitor", "address": "0030H (48)", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Fault Code", "address": "0070H (112)", "function": "03H Read", "unit": "UINT16"},
            {"name": "Alarm Code", "address": "0071H (113)", "function": "03H Read", "unit": "UINT16"}
        ]
    },
    "faultCodes": {
        "OC": "Over Current",
        "OV": "Over Voltage (DC Bus)",
        "UV1": "Under Voltage (DC Bus)",
        "OH": "Over Heat (Heatsink)",
        "OL1": "Motor Overload",
        "OL2": "Inverter Overload",
        "GF": "Ground Fault",
        "SC": "Short Circuit",
        "PF": "Input Phase Loss",
        "LF": "Output Phase Loss",
        "CE": "Modbus Communication Error",
        "BUS": "Option Communication Error",
        "EF0-EF7": "External Fault",
        "CPF": "Control Circuit Fault",
        "rr": "Braking Resistor Overheat",
        "ov": "Over Voltage (AC Input)"
    },
    "quickTest": {
        "readCommand": "01 03 00 31 00 01 [CRC16] (read Output Frequency 0031H from slave 1)",
        "description": "Use Modbus master to read any known monitor register"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/YASKAWA/guide/YASKAWA-A1000 Modbus communication SETUP.pdf"},
        {"label": "Register Address Mapping", "url": "/manuals/YASKAWA/guide/YASKAWA A1000 Modbus REGISTER ADDRESS MAPPING .pdf"},
        {"label": "A1000 User Manual", "url": "/manuals/YASKAWA/YASKAWA A1000 USER MANUAL.pdf"}
    ],
    "images": []
}

# ============================================================
# DANAHE D31  (1 unit deployed)
# ============================================================
m["DANAHE"] = {
    "id": "DANAHE",
    "title": "DANAHE D31 Series",
    "manufacturer": "DANAHE (China)",
    "family": "D31 Series",
    "unitsDeployed": 1,
    "locations": ["Small Batch Area"],
    "voltage": "220VAC",
    "communicationPorts": ["RS-485 (terminal A+/B-)"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "f900 (Communication baud rate)",
            "options": {"0": 1200, "1": 2400, "2": 4800, "3": 9600, "4": 19200, "5": 38400}
        },
        "parity": {
            "default": "8N1",
            "parameter": "f901 (Communication data format)",
            "options": {"0": "8N1 (No parity)", "1": "8E1 (Even parity)", "2": "8O1 (Odd parity)"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "f902 (Local address)"},
        "commandSource": {
            "parameter": "F001 (RUN command selection)",
            "requiredValue": 2,
            "description": "Set F001 = 2 for communication (Modbus) control"
        },
        "frequencySource": {
            "parameter": "F002 (Frequency source selection)",
            "requiredValue": 9,
            "description": "Set F002 = 9 for Modbus communication frequency reference"
        },
        "note": "Supports function codes 03H (Read), 06H (Write single), 10H (Write multiple). Max 5 words per read/write.",
        "quickSetupSteps": [
            "1. Set F001 = 2 (RUN command via communication)",
            "2. Set F002 = 9 (Frequency via Modbus)",
            "3. Set f900 = 3 (9600 bps)",
            "4. Set f901 = 0 (8N1, No Parity)",
            "5. Set f902 = desired slave address (1-247)",
            "6. Power cycle to apply"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "A+ (RS-485 Positive)", "B_minus": "B- (RS-485 Negative)", "GND": "GND (Signal Ground)"},
        "builtInTermination": False,
        "requiresExternalTermination": True,
        "terminationValue": "120\u03a9 0.25W",
        "terminationPlacement": "Between A+ and B- at BOTH ends",
        "cableType": "Shielded twisted pair",
        "note": "Up to 31 slaves on one RS-485 link"
    },
    "registerMap": {
        "control": [
            {"name": "Control Word", "address": "FA05", "function": "06H Write", "unit": "Bitfield", "description": "Bit 2: 0=Stop, 1=Run | Bit 3: 0=Normal, 1=Free Stop | Bit 4: 0=Normal, 1=Emergency Stop | Bit 5: 0=Normal, 1=Fault Reset"},
            {"name": "Frequency Reference", "address": "FA08", "function": "06H Write", "unit": "0.01 Hz", "description": "Write frequency \u00d7 100. Hexadecimal: 50Hz = 1388H (5000 decimal).", "example": "50Hz = write 1388H to FA08"}
        ],
        "monitor": [
            {"name": "Real-time Status", "address": "FD03", "function": "03H Read", "unit": "Bitfield", "description": "Bit 1=Fault, Bit 9=Reverse, Bit 10=Run/Stop"},
            {"name": "Real-time Frequency", "address": "FD12", "function": "03H Read", "unit": "0.01 Hz", "scale": "\u00f7 100"},
            {"name": "Actual Output Frequency", "address": "FE18", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Output Voltage", "address": "FE10", "function": "03H Read", "unit": "0.01% of rated"},
            {"name": "Output Current", "address": "FE08", "function": "03H Read", "unit": "0.01% of rated"},
            {"name": "Output Power", "address": "FE29", "function": "03H Read", "unit": "0.01 kW"},
            {"name": "Motor Speed", "address": "FE50", "function": "03H Read", "unit": "1 RPM"},
            {"name": "DC Bus Voltage", "address": "FE09", "function": "03H Read", "unit": "0.01%"},
            {"name": "Fault Monitoring", "address": "FC39", "function": "03H Read", "unit": "UINT16", "description": "Active fault code"},
            {"name": "Digital Input Status", "address": "FE11", "function": "03H Read", "unit": "Bitfield"},
            {"name": "Digital Output Status", "address": "FE12", "function": "03H Read", "unit": "Bitfield"}
        ]
    },
    "faultCodes": {
        "OC": "Over Current",
        "OV": "Over Voltage",
        "UV": "Under Voltage",
        "OH": "Over Heat",
        "OL": "Overload",
        "GF": "Ground Fault",
        "CE": "Communication Error"
    },
    "quickTest": {
        "readCommand": "01 03 FD 12 00 01 [CRC16] (read Real-time Frequency FD12)",
        "description": "Master: address=1, baud=9600, data=8, parity=None, stop=1"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide (Quick Reference)", "url": "/manuals/DANAHE/guide/D31 MODBUS COMMUNICATION SETUP.pdf"},
        {"label": "Register Address Mapping", "url": "/manuals/DANAHE/guide/D31 Modbus REGISTER ADDRESS MAPPING.pdf"},
        {"label": "D31 User Manual", "url": "/manuals/DANAHE/D31-USER-MANUAL.pdf"},
        {"label": "D31 Brochure", "url": "/manuals/DANAHE/D31 SERIES  VFD BROCHURE.pdf"}
    ],
    "images": []
}

# ============================================================
# CHZIRI ZVF300  (1 unit deployed)
# ============================================================
m["CHZIRI"] = {
    "id": "CHZIRI",
    "title": "CHZIRI V-ZVF300",
    "manufacturer": "CHZIRI (China)",
    "family": "ZVF300 Series",
    "unitsDeployed": 1,
    "locations": ["EE Room 1 (Milling Area)"],
    "voltage": "220VAC",
    "communicationPorts": ["RS-485 (terminal block)"],
    "modbusSettings": {
        "baudRate": {
            "default": 9600,
            "parameter": "P3.00 (Communication baud rate)",
            "options": {"0": 1200, "1": 2400, "2": 4800, "3": 9600, "4": 19200, "5": 38400}
        },
        "parity": {
            "default": "8N1",
            "parameter": "P3.01 (Data format)",
            "options": {"0": "8N1 (No parity)", "1": "8E1 (Even parity)", "2": "8O1 (Odd parity)"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "P3.02 (Local address)"},
        "commandSource": {
            "parameter": "P0.01 (Command source selection)",
            "requiredValue": 2,
            "description": "Set P0.01 = 2 for Modbus communication control"
        },
        "frequencySource": {
            "parameter": "P0.03 (Frequency source selection)",
            "requiredValue": 9,
            "description": "Set P0.03 = 9 for Modbus frequency reference"
        },
        "quickSetupSteps": [
            "1. Set P0.01 = 2 (Command via Modbus)",
            "2. Set P0.03 = 9 (Frequency via Modbus)",
            "3. Set P3.00 = 3 (9600 bps)",
            "4. Set P3.01 = 0 (8N1, No Parity)",
            "5. Set P3.02 = desired slave address (1-247)",
            "6. Power cycle to apply"
        ]
    },
    "rs485Wiring": {
        "terminals": {"A_plus": "RS485+ / A", "B_minus": "RS485- / B"},
        "builtInTermination": False,
        "requiresExternalTermination": True,
        "terminationValue": "120\u03a9 0.25W",
        "terminationPlacement": "Between RS485+ and RS485- at BOTH ends",
        "cableType": "Shielded twisted pair"
    },
    "registerMap": {
        "control": [
            {"name": "Control Word", "address": "3200H", "function": "06H Write", "description": "Bit-based control: Run/Stop, Forward/Reverse, Fault Reset"},
            {"name": "Frequency Reference", "address": "3201H", "function": "06H Write", "unit": "0.01 Hz", "description": "Write frequency \u00d7 100"}
        ],
        "monitor": [
            {"name": "Output Frequency", "address": "3000H", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Output Current", "address": "3001H", "function": "03H Read", "unit": "0.1 A"},
            {"name": "Output Voltage", "address": "3002H", "function": "03H Read", "unit": "1 V"},
            {"name": "DC Bus Voltage", "address": "3003H", "function": "03H Read", "unit": "1 V"},
            {"name": "Status Word", "address": "3004H", "function": "03H Read", "unit": "Bitfield"}
        ]
    },
    "faultCodes": {
        "OC": "Over Current", "OV": "Over Voltage", "UV": "Under Voltage",
        "OH": "Over Heat", "OL": "Overload", "GF": "Ground Fault",
        "CE": "Communication Error"
    },
    "quickTest": {
        "readCommand": "01 03 30 00 00 01 [CRC16] (read Output Frequency 3000H)",
        "description": "Master settings: Address=1, Baud=9600, Data=8, Parity=None, Stop=1"
    },
    "pdfs": [
        {"label": "Modbus Setup Guide", "url": "/manuals/CHZIRI/guide/CHZIRI-ZVF300H-MODBUS-SETUP.pdf"},
        {"label": "Register Address List", "url": "/manuals/CHZIRI/guide/CHZIRI-ZVF-300H-REGISTER-ADDRESS-LIST.pdf"},
        {"label": "RS-485 Setup Guide", "url": "/manuals/CHZIRI/guide/CHZIRI-ZVF-300H-RS485-SETUP.pdf"},
        {"label": "User Manual", "url": "/manuals/CHZIRI/CHZIRI-ZVF300H-User-Manual.pdf"},
        {"label": "Catalog", "url": "/manuals/CHZIRI/CHZIRI-ZVF300H-Series-Catalog.pdf"}
    ],
    "images": []
}

# ============================================================
# FRENIC ACE  (3 units deployed)
# ============================================================
m["FRENIC-ACE"] = {
    "id": "FRENIC-ACE",
    "title": "FRENIC ACE",
    "manufacturer": "Fuji Electric (Japan)",
    "family": "FRENIC ACE Series",
    "unitsDeployed": 3,
    "locations": ["Medium Batch"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (RJ-45 Port 1 standard, Terminal Port 2 optional)", "CANopen"],
    "modbusSettings": {
        "baudRate": {
            "default": 19200,
            "parameter": "y04 (Baud rate, Port 1) / y14 (Port 2)",
            "options": {"0": 19200, "1": 38400, "2": 9600, "3": 4800, "4": 2400, "5": 1200},
            "note": "FRENIC default is 19200. Set to 2 (9600) to match network standard."
        },
        "parity": {
            "default": "8N1",
            "parameter": "y06 (Parity/Stop bits, Port 1) / y16 (Port 2)",
            "options": {"0": "8N1 (No parity, 1 stop)", "1": "8N2 (No parity, 2 stop)", "2": "8E1 (Even, 1 stop)", "3": "8O1 (Odd, 1 stop)"}
        },
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "y01 (Station address, Port 1) / y11 (Port 2)"},
        "protocolSelection": {
            "parameter": "y03 (Protocol, Port 1) / y13 (Port 2)",
            "options": {"0": "Modbus RTU", "1": "Fuji General-Purpose Inverter Protocol", "2": "Modbus RTU + Fuji Protocol"},
            "note": "Set y03 = 0 for Modbus RTU only"
        },
        "runCommandSource": {
            "parameter": "y98 (Run command source via RS-485)",
            "options": {"0": "Terminal block (FWD/REV)", "1": "RS-485 (enable LE link command)"},
            "description": "Set y98 = 1 to enable Run command via RS-485"
        },
        "frequencyCommandSource": {
            "parameter": "y99 (Frequency command source via RS-485)",
            "options": {"0": "Analog/keypad", "1": "RS-485 frequency"},
            "description": "Set y99 = 1 to enable frequency command via RS-485"
        },
        "terminationResistor": {
            "parameter": "y02 (Port 1) / y12 (Port 2)",
            "options": {"0": "OFF", "1": "ON"},
            "note": "Set to 1 (ON) if this drive is at the end of the RS-485 bus",
            "builtIn": True
        },
        "commFaultDetection": {
            "parameter": "y08 (Comm fault timer, Port 1) / y18 (Port 2)",
            "default": "2.0s",
            "range": "0.0-60.0s",
            "note": "0.0 = disabled"
        },
        "commFaultStopMethod": {
            "parameter": "y09 (Port 1) / y19 (Port 2)",
            "default": 0,
            "options": {"0": "Continue running (display Er8)", "1": "Coast to stop", "2": "Decelerate to stop"}
        },
        "quickSetupSteps": [
            "1. Set y01 = desired slave address (1-247)",
            "2. Set y03 = 0 (Modbus RTU protocol)",
            "3. Set y04 = 2 (9600 bps \u2190 changes from default 19200)",
            "4. Set y06 = 0 (8N1 format)",
            "5. Set y02 = 1 if drive at bus end (enable built-in termination)",
            "6. Set y98 = 1 (Run command via RS-485)",
            "7. Set y99 = 1 (Frequency via RS-485)",
            "8. Set y08 = 2.0s (comm fault timeout, or 0 to disable)",
            "9. Set y09 = 0 or as needed (fault behavior)",
            "10. Send LE command (Enable Link) to activate RS-485 control"
        ],
        "enableLinkNote": "FRENIC requires sending 'LE' (Link Enable) command via RS-485 to activate remote control. Without LE, keypad retains priority."
    },
    "rs485Wiring": {
        "connectorTypes": [
            {"type": "RJ-45 (Port 1)", "pins": "DX+ (pin 1/2), DX- (pin 5/6), GND (pin 7/8)", "note": "Standard RS-485 on keypad port, always available"},
            {"type": "Terminal Block (Port 2)", "pins": "DX+ terminal, DX- terminal, SD terminal", "note": "Available only on specific models (FRN-E2S-4C)"}
        ],
        "builtInTermination": True,
        "terminationMethod": "DIP switch or parameter y02/y12. Slide switch ON at line ends, OFF for middle devices.",
        "terminationImages": [
            "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH.png",
            "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH-LAYOUT.png"
        ],
        "cableType": "Shielded twisted pair, Cat5e (for RJ-45) or terminal (for block)",
        "pinoutImage": "/manuals/FRENIC/RS485-PINOUT.png",
        "notesImage": "/manuals/FRENIC/RS485-NOTES.png"
    },
    "registerMap": {
        "control": [
            {"name": "Run/Stop (Function S06)", "address": "S06 (Coil 0001H)", "function": "05H Write", "description": "Write S06: 1=RUN Forward, 2=RUN Reverse, 0=STOP"},
            {"name": "Frequency Reference (Function S05)", "address": "S05 (Register)", "function": "06H Write", "unit": "0.01 Hz", "description": "Write frequency \u00d7 100. E.g. 5000 = 50.00 Hz."},
            {"name": "Fault Reset (Function S08)", "address": "S08", "function": "05H Write", "description": "Write 1 to reset alarm/trip"},
            {"name": "Link Enable (LE)", "address": "LE command", "function": "Special command", "description": "Must send LE command to enable RS-485 control. Without LE, keypad retains control."}
        ],
        "monitor": [
            {"name": "Output Frequency (M06)", "address": "M06", "function": "03H Read", "unit": "0.01 Hz", "scale": "\u00f7 100"},
            {"name": "Output Current (M07)", "address": "M07", "function": "03H Read", "unit": "0.1 A", "scale": "\u00f7 10"},
            {"name": "Output Voltage (M08)", "address": "M08", "function": "03H Read", "unit": "1 V"},
            {"name": "Output Power (M10)", "address": "M10", "function": "03H Read", "unit": "0.01 kW"},
            {"name": "Motor Speed (M09)", "address": "M09", "function": "03H Read", "unit": "1 RPM"},
            {"name": "Status (M14)", "address": "M14", "function": "03H Read", "unit": "Bitfield", "description": "Bit 0=RUN, Bit 1=Alarm, Bit 2=Tripped, etc."},
            {"name": "Trip Code (M20)", "address": "M20", "function": "03H Read", "unit": "UINT16", "description": "Active alarm/trip code"}
        ]
    },
    "faultCodes": {
        "0c1-0c3": "Over Current (OC1-OC3)",
        "0u1-0u3": "Over Voltage (OU1-OU3)",
        "lu": "Under Voltage (LU)",
        "0h1-0h2": "Over Heat (OH1-OH2)",
        "0l1-0l4": "Overload (OL1-OL4)",
        "ef": "Ground Fault (EF)",
        "er1": "Memory Error",
        "er2": "Keypad Communication Error",
        "er3": "CPU Error",
        "er4": "Option Communication Error",
        "er8/erp": "RS-485 Communication Error (Port 1/Port 2)",
        "ert": "CAN Communication Error",
        "pbf": "Charger Circuit Fault",
        "cof": "PID Feedback Wire Break",
        "dbh": "Braking Resistor Overheat",
        "dba": "Braking Transistor Error",
        "ecf": "EN Circuit Failure",
        "ecl": "Customized Logic Failure"
    },
    "quickTest": {
        "description": "Read Output Frequency (M06) to verify Modbus communication",
        "note": "Ensure RJ-45 cable is properly connected. Default baud is 19200 unless changed.",
        "readCommand": "01 03 [M06 address] 00 01 [CRC16]"
    },
    "pdfs": [
        {"label": "FRENIC-Ace User Manual (RS-485 Chapter)", "url": "/manuals/FRENIC/FRENIC-ACE/FRENIC-Ace-User-Manual-E-24A7-E-0043.pdf"},
        {"label": "FRENIC-Ace Instruction Manual", "url": "/manuals/FRENIC/FRENIC-ACE/FRENIC-Ace-Instruction-Manual-INR-SI47-1733f-E.pdf"},
        {"label": "FRENIC-Ace Global Model Manual", "url": "/manuals/FRENIC/FRENIC-ACE/FRENIC-Ace-Global-Model-User-Manual.pdf"}
    ],
    "images": [
        "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH.png",
        "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH-LAYOUT.png",
        "/manuals/FRENIC/RS485-NOTES.png",
        "/manuals/FRENIC/RS485-PINOUT.png"
    ]
}

# ============================================================
# FRENIC ECO  (also Fuji Electric)
# ============================================================
m["FRENIC-ECO"] = {
    "id": "FRENIC-ECO",
    "title": "FRENIC ECO",
    "manufacturer": "Fuji Electric (Japan)",
    "family": "FRENIC ECO Series",
    "unitsDeployed": 0,
    "locations": ["Reference Only"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (RJ-45)"],
    "modbusSettings": {
        "baudRate": {"default": 19200, "parameter": "y04", "options": {"0": 19200, "1": 38400, "2": 9600, "3": 4800, "4": 2400, "5": 1200}},
        "parity": {"default": "8N1", "parameter": "y06", "options": {"0": "8N1", "1": "8N2", "2": "8E1", "3": "8O1"}},
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "y01"},
        "protocolSelection": {"parameter": "y03", "options": {"0": "Modbus RTU", "1": "Fuji Protocol", "2": "Both"}},
        "note": "FRENIC ECO shares the same communication parameter structure (y-codes) as FRENIC ACE.",
        "quickSetupSteps": [
            "1. Set y01 = slave address",
            "2. Set y03 = 0 (Modbus RTU)",
            "3. Set y04 = 2 (9600 bps, to match network standard)",
            "4. Set y06 = 0 (8N1)",
            "5. Set y02 = 1 if at bus end (built-in termination ON)",
            "6. Set y98 = 1, y99 = 1 for RS-485 control"
        ]
    },
    "rs485Wiring": {
        "connectorTypes": [{"type": "RJ-45", "pins": "DX+, DX-, GND"}],
        "builtInTermination": True,
        "terminationMethod": "DIP switch or parameter y02",
        "cableType": "Shielded twisted pair, Cat5e",
        "terminationImages": [
            "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH.png",
            "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH-LAYOUT.png"
        ],
        "pinoutImage": "/manuals/FRENIC/RS485-PINOUT.png",
        "notesImage": "/manuals/FRENIC/RS485-NOTES.png"
    },
    "registerMap": {
        "control": [
            {"name": "Run/Stop", "address": "S06 (Coil)", "function": "05H Write", "description": "Same as FRENIC ACE command structure"},
            {"name": "Frequency Reference", "address": "S05 (Register)", "function": "06H Write", "unit": "0.01 Hz"}
        ],
        "monitor": [
            {"name": "Output Frequency", "address": "M06", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Output Current", "address": "M07", "function": "03H Read", "unit": "0.1 A"},
            {"name": "Output Voltage", "address": "M08", "function": "03H Read", "unit": "1 V"}
        ]
    },
    "faultCodes": {"er8": "RS-485 Communication Error", "0c1-0c3": "Over Current", "0u1-0u3": "Over Voltage"},
    "pdfs": [
        {"label": "FRENIC-Eco Parameter List", "url": "/manuals/FRENIC/FRENIC-ECO/FRENIC-Eco-Parameter-List.pdf"}
    ],
    "images": [
        "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH.png",
        "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH-LAYOUT.png",
        "/manuals/FRENIC/RS485-NOTES.png",
        "/manuals/FRENIC/RS485-PINOUT.png"
    ]
}

# ============================================================
# FRENIC MEGA  (2 units deployed)
# ============================================================
m["FRENIC-MEGA"] = {
    "id": "FRENIC-MEGA",
    "title": "FRENIC MEGA",
    "manufacturer": "Fuji Electric (Japan)",
    "family": "FRENIC MEGA Series",
    "unitsDeployed": 2,
    "locations": ["Small Batch Area"],
    "voltage": "220VAC / 440VAC",
    "communicationPorts": ["RS-485 (RJ-45)", "Optional: Profibus, CANopen"],
    "modbusSettings": {
        "baudRate": {"default": 19200, "parameter": "y04", "options": {"0": 19200, "1": 38400, "2": 9600, "3": 4800, "4": 2400, "5": 1200}},
        "parity": {"default": "8N1", "parameter": "y06"},
        "slaveAddress": {"range": "1-247", "default": 1, "parameter": "y01"},
        "protocolSelection": {"parameter": "y03", "options": {"0": "Modbus RTU", "1": "Fuji Protocol"}},
        "note": "FRENIC MEGA shares the same communication parameter structure (y-codes) as FRENIC ACE and ECO.",
        "quickSetupSteps": [
            "1. Set y01 = slave address",
            "2. Set y03 = 0 (Modbus RTU)",
            "3. Set y04 = 2 (9600 bps)",
            "4. Set y06 = 0 (8N1)",
            "5. Set y02 = 1 if at bus end (built-in termination ON)",
            "6. Set y98 = 1, y99 = 1 for RS-485 control"
        ]
    },
    "rs485Wiring": {
        "connectorTypes": [{"type": "RJ-45", "pins": "DX+, DX-, GND"}],
        "builtInTermination": True,
        "terminationMethod": "DIP switch or parameter y02",
        "terminationImages": [
            "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH.png",
            "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH-LAYOUT.png"
        ],
        "cableType": "Shielded twisted pair, Cat5e",
        "pinoutImage": "/manuals/FRENIC/RS485-PINOUT.png",
        "notesImage": "/manuals/FRENIC/RS485-NOTES.png"
    },
    "registerMap": {
        "control": [
            {"name": "Run/Stop", "address": "S06 (Coil)", "function": "05H Write",
             "description": "Same as FRENIC ACE. Must send LE command first to enable link."},
            {"name": "Frequency Reference", "address": "S05 (Register)", "function": "06H Write", "unit": "0.01 Hz"}
        ],
        "monitor": [
            {"name": "Output Frequency", "address": "M06", "function": "03H Read", "unit": "0.01 Hz"},
            {"name": "Output Current", "address": "M07", "function": "03H Read", "unit": "0.1 A"},
            {"name": "Output Voltage", "address": "M08", "function": "03H Read", "unit": "1 V"}
        ]
    },
    "faultCodes": {"er8": "RS-485 Communication Error (Port 1)", "erp": "RS-485 Error (Port 2)"},
    "pdfs": [
        {"label": "FRENIC-MEGA User Manual", "url": "/manuals/FRENIC/FRENIC-MEGA/FRENIC-MEGA-User-Manual.pdf"}
    ],
    "images": [
        "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH.png",
        "/manuals/FRENIC/RESISTOR-TERMINATION-DIP-SWITCH-LAYOUT.png",
        "/manuals/FRENIC/RS485-NOTES.png",
        "/manuals/FRENIC/RS485-PINOUT.png"
    ]
}

# Write the JSON
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(vfd, f, indent=2, ensure_ascii=False)

# Count models
print(f"Written {OUT} with {len(m)} models")
for mid, data in m.items():
    print(f"  {mid}: {data['title']} ({data['unitsDeployed']} units) - {len(data.get('registerMap',{}).get('control',[]))} control regs, {len(data.get('registerMap',{}).get('monitor',[]))} monitor regs")
