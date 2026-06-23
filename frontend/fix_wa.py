import pathlib

path = pathlib.Path("src/pages/Homepage.tsx")
src = path.read_text()

# Find the broken anchor and fix it
lines = src.splitlines()
out = []
i = 0
while i < len(lines):
    line = lines[i]
    # Detect the broken comment + bare href pattern
    if '{/* Floating WhatsApp Button */}' in line:
        # Check next line — if it's just whitespace/empty (missing <a), fix it
        next_line = lines[i+1] if i+1 < len(lines) else ''
        if next_line.strip().startswith('href='):
            out.append(line)
            out.append('      <a')  # inject the missing 
            i += 1
            continue
    out.append(line)
    i += 1

result = '\n'.join(out)
path.write_text(result)
print("SUCCESS: <a tag injected before href")
