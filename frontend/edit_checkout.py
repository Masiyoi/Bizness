import shutil
import sys

path = "src/pages/Checkout.tsx"  # relative to where you run this (frontend/)

# List of (old_str, new_str) edits. Each old_str must appear exactly once.
EDITS = [
    (
        """  // Shared state
  const [failMsg, setFailMsg]                   = useState('');
  const [serverError, setServerError]           = useState('');
  const [flashSaleMap, setFlashSaleMap]         = useState<Record<number, number>>({});""",
        """  // Shared state
  const [failMsg, setFailMsg]                   = useState('');
  const [serverError, setServerError]           = useState('');
  const [flashSaleMap, setFlashSaleMap]         = useState<Record<number, number>>({});
  const [orderNumber, setOrderNumber]           = useState('');
  const [orderDate, setOrderDate]               = useState('');""",
    ),
]

def main():
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    backup_path = path + ".bak"
    shutil.copy(path, backup_path)
    print(f"Backup written to {backup_path}")

    missing = []
    for i, (old, new) in enumerate(EDITS):
        count = content.count(old)
        if count == 0:
            missing.append(i)
        elif count > 1:
            print(f"WARNING: edit {i} old_str matches {count} times, skipping to avoid corrupting file")
            missing.append(i)
        else:
            content = content.replace(old, new)

    if missing:
        print(f"Edits skipped (old_str not found or ambiguous): {missing}")
        print("No changes made for those — file NOT written for skipped edits.")
        sys.exit(1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Done. Edited {path} in place ({len(EDITS)} replacement(s) applied).")

if __name__ == "__main__":
    main()
