import os

# المجلدات التي نريد تجاهلها تماماً
IGNORE_DIRS = {'node_modules', '.git', '.expo', 'android', 'ios', '.vscode', 'dist', 'assets'}
# الملفات التي نريد تجاهلها
IGNORE_FILES = {'package-lock.json', 'yarn.lock'}

def print_tree(startpath, prefix=''):
    try:
        entries = sorted(os.listdir(startpath))
    except PermissionError:
        return

    # فلترة الملفات والمجلدات
    entries = [e for e in entries if not e.startswith('.') and e not in IGNORE_DIRS and e not in IGNORE_FILES]

    for i, entry in enumerate(entries):
        path = os.path.join(startpath, entry)
        is_last = (i == len(entries) - 1)
        
        # رسم الخطوط
        connector = '└── ' if is_last else '├── '
        print(f"{prefix}{connector}{entry}")

        # إذا كان مجلداً، ندخل فيه
        if os.path.isdir(path):
            extension = '    ' if is_last else '│   '
            print_tree(path, prefix + extension)

if __name__ == '__main__':
    print("QuranApp/")
    print_tree(os.getcwd())