import os

def list_files(startpath, ignore_dirs=[]):
    for root, dirs, files in os.walk(startpath):
        # Skip ignored directories (e.g., node_modules)
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        level = root.replace(startpath, "").count(os.sep)
        indent = " " * 4 * level
        print(f"{indent}{os.path.basename(root)}/")
        sub_indent = " " * 4 * (level + 1)
        for f in files:
            print(f"{sub_indent}{f}")

list_files(".", ignore_dirs=["node_modules",".git"])