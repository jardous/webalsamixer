import subprocess
import re
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
# Card 0 is usually the default hardware sound card. 
# Change to 1 if you are using a USB DAC.
ALSA_CARD_INDEX = 0

def run_amixer(args):
    """Run amixer command on the specific card."""
    cmd = ['amixer', '-c', str(ALSA_CARD_INDEX)] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

def parse_amixer_contents():
    """Parses 'amixer scontents' into a structured list of controls."""
    raw_output = run_amixer(['scontents'])
    controls = []
    
    # Split output into blocks for each control
    # Blocks start with "Simple mixer control..."
    blocks = raw_output.split("Simple mixer control '")
    
    for block in blocks:
        if not block.strip(): 
            continue
            
        try:
            # 1. Extract Name
            name_match = re.search(r"^([^']+)',(\d+)", block)
            if not name_match: continue
            name = name_match.group(1)
            
            # 2. Extract Capabilities/Type
            is_enum = "Items:" in block
            has_volume = "Limits:" in block
            
            # 3. Extract Values
            ctrl = {
                'id': name,
                'name': name,
                'isMuted': False,
                'options': []
            }

            # --- ENUM HANDLING ---
            if is_enum:
                ctrl['type'] = 'ENUM'
                # Parse Options: Items: 'Mic' 'Line' 'CD'
                items_match = re.search(r"Items: (.*)", block)
                if items_match:
                    # Split by quotes to get options
                    raw_opts = items_match.group(1)
                    ctrl['options'] = re.findall(r"'([^']*)'", raw_opts)
                
                # Parse Current Value: Item0: 'Mic'
                val_match = re.search(r"Item0: '([^']*)'", block)
                ctrl['value'] = val_match.group(1) if val_match else ""
                
            # --- VOLUME/INTEGER HANDLING ---
            elif has_volume:
                ctrl['type'] = 'INT'
                
                # Parse Limits: Limits: Playback 0 - 65536
                limits = re.search(r"Limits: .* (\d+) - (\d+)", block)
                if limits:
                    ctrl['min'] = int(limits.group(1))
                    ctrl['max'] = int(limits.group(2))
                else:
                    ctrl['min'], ctrl['max'] = 0, 100

                # Parse Current Value: [80%] or [56]
                # We look for the first occurrence of [number%] or [number]
                val_match = re.search(r"\[(\d+)%\]", block)
                if not val_match:
                    # Fallback to raw value if % missing
                    val_match = re.search(r"Playback (\d+)", block)
                    
                current_val = int(val_match.group(1)) if val_match else 0
                
                # If parsed as %, convert back to raw for consistency if needed, 
                # but amixer sset accepts %, so we normalize to 0-100 for UI usually,
                # or keep raw. Let's stick to raw limits for precision or % if simple.
                # To simplify: We will map everything to 0-100 for the UI if it gave us %.
                if "%" in (val_match.group(0) if val_match else ""):
                    # It's a percentage, adjust min/max to 0-100
                    ctrl['min'] = 0
                    ctrl['max'] = 100
                    ctrl['value'] = current_val
                else:
                    # It's a raw value
                    ctrl['value'] = current_val

                # Check for BOOLEAN disguised as Volume (0-1 range)
                if ctrl['max'] == 1:
                    ctrl['type'] = 'BOOL'

            # --- SWITCH/BOOLEAN HANDLING ---
            else:
                # If no volume limits and no enum, it's likely a simple switch
                ctrl['type'] = 'BOOL'
                ctrl['min'] = 0
                ctrl['max'] = 1
                
                # Check [on] or [off]
                state_match = re.search(r"\[(on|off)\]", block)
                ctrl['value'] = 1 if state_match and state_match.group(1) == 'on' else 0

            # --- MUTE DETECTION (Universal) ---
            # Look for [off] in Playback line if it exists
            mute_match = re.search(r"Playback .* \[(on|off)\]", block)
            if mute_match:
                ctrl['isMuted'] = (mute_match.group(1) == 'off')
            
            # --- ICON ASSIGNMENT ---
            lower_name = name.lower()
            if 'mic' in lower_name or 'capture' in lower_name: ctrl['icon'] = 'mic'
            elif 'headphone' in lower_name: ctrl['icon'] = 'headphone'
            elif 'pcm' in lower_name: ctrl['icon'] = 'chip'
            else: ctrl['icon'] = 'speaker'

            controls.append(ctrl)

        except Exception as e:
            print(f"Error parsing block '{name if 'name' in locals() else 'unknown'}': {e}")
            continue

    return controls

@app.route('/api/controls', methods=['GET'])
def get_controls():
    return jsonify(parse_amixer_contents())

@app.route('/api/controls/<name>', methods=['POST'])
def update_control(name):
    req = request.json
    val = req.get('value')
    muted = req.get('isMuted')
    
    try:
        # Determine current type to format command correctly
        # (Inefficient but safe: fetch type again)
        # For simplicity, we try multiple sset formats
        
        # 1. Handle Value Update
        if val is not None:
            cmd = []
            # Try to determine if it is an Enum (string) or Int
            if isinstance(val, str):
                # Enum: amixer -c 0 sset 'Source' 'Mic'
                cmd = ['sset', name, val]
            elif isinstance(val, int):
                # Check if it's a boolean 1/0
                # We can just send the number, amixer handles it
                # For volume, sending "70%" is safer if we normalized to 100,
                # but we are sending raw values or normalized values.
                # If our parsing logic set min=0 max=100, we send %.
                cmd = ['sset', name, f"{val}%"]
            
            if cmd:
                run_amixer(cmd)
                
        # 2. Handle Mute Update (Switch Toggle)
        if muted is not None:
            # amixer -c 0 sset 'Master' mute / unmute
            state = 'mute' if muted else 'unmute'
            run_amixer(['sset', name, state])
            
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print(f"--- WebAlsaMixer (Direct HW:{ALSA_CARD_INDEX}) ---")
    print("Listening on: http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
