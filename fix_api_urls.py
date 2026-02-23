import os
import re

directory = "apps/web/src"
pattern = r"process\.env\.NEXT_PUBLIC_API_URL"
replacement = "API_BASE"
import_line = 'import { API_BASE } from "@/lib/api";\n'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "process.env.NEXT_PUBLIC_API_URL" in content:
                print(f"Fixing {path}")
                # Replace the pattern
                new_content = re.sub(pattern, replacement, content)
                
                # Add import if not present
                if 'from "@/lib/api"' not in new_content and 'from \'@/lib/api\'' not in new_content:
                    # Find a good place for the import (after the last import or at the top)
                    lines = new_content.splitlines()
                    last_import_idx = -1
                    for i, line in enumerate(lines):
                        if line.startswith("import "):
                            last_import_idx = i
                    
                    if last_import_idx != -1:
                        lines.insert(last_import_idx + 1, import_line.strip())
                    else:
                        lines.insert(0, import_line.strip())
                    new_content = "\n".join(lines)
                
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
