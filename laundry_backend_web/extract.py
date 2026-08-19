import json
import os

path = r'C:\Users\Lenovo\.gemini\antigravity-ide\brain\2d2cc901-5bb4-4780-a10c-59af730aa07a\.system_generated\logs\transcript_full.jsonl'
output = r'C:\Users\Lenovo\.gemini\antigravity\scratch\SmartLaundryManagement\laundry_backend_web\patch_history.txt'

res = []
if not os.path.exists(path):
    res.append("No transcript found")
else:
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'server.js' not in line: continue
            try:
                data = json.loads(line)
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        if 'args' in tc and 'TargetFile' in tc['args'] and 'server.js' in tc['args']['TargetFile']:
                            res.append(f"TOOL: {tc['name']} - {tc['args'].get('Instruction', '')}")
                            if tc['name'] == 'default_api:write_to_file':
                                res.append('WROTE ENTIRE FILE!')
                            elif tc['name'] in ['default_api:replace_file_content', 'default_api:multi_replace_file_content']:
                                chunks = tc['args'].get('ReplacementChunks', [])
                                if not chunks and 'ReplacementContent' in tc['args']:
                                    chunks = [tc['args']]
                                res.append(f'CHUNKS: {len(chunks)}')
            except Exception as e:
                pass

with open(output, 'w', encoding='utf-8') as f:
    f.write('\n'.join(res))
print('Done!')
