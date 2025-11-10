#!/usr/bin/env python3
"""
Generate repository tree structure (depth ≤ 2) for docs/repo-tree.md.
"""
from pathlib import Path

# Directories to ignore
IGNORE_DIRS = {
    '.git', '.next', '.turbo', 'node_modules', '__pycache__',
    '.pytest_cache', 'target', 'dist', 'build', '.venv',
    'coverage', '.coverage'
}

# Files to ignore
IGNORE_FILES = {
    '.DS_Store', 'Thumbs.db'
}

def should_ignore(name: str) -> bool:
    """Check if a file/directory should be ignored."""
    return name in IGNORE_DIRS or name in IGNORE_FILES or name.startswith('.')

def generate_tree(root_path: Path, max_depth: int = 2) -> list[str]:
    """Generate tree structure up to max_depth."""
    lines = []
    
    def walk_dir(path: Path, prefix: str = "", depth: int = 0):
        if depth > max_depth:
            return
        
        try:
            items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name))
        except PermissionError:
            return
        
        # Filter out ignored items
        items = [item for item in items if not should_ignore(item.name)]
        
        for item in items:
            if item.is_dir():
                lines.append(f"{prefix}- {item.name}/")
                if depth < max_depth:
                    walk_dir(item, prefix + "  ", depth + 1)
            else:
                lines.append(f"{prefix}- {item.name}")
    
    walk_dir(root_path)
    return lines

def main():
    repo_root = Path(__file__).parent.parent
    
    # Generate tree
    tree_lines = generate_tree(repo_root, max_depth=2)
    
    # Format output
    output = ["# Repository Structure (Depth≤2)", "", "```text"]
    output.extend(tree_lines)
    output.append("```")
    output.append("")
    
    # Write to stdout
    print("\n".join(output))

if __name__ == "__main__":
    main()
