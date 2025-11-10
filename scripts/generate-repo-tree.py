#!/usr/bin/env python3
"""
Generate repository tree structure (depth ≤ 2) for docs/repo-tree.md.
"""
import os
import sys
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
    """
    Determine whether a filesystem name should be ignored by the tree generator.
    
    Returns:
        `true` if the name is listed in IGNORE_DIRS, listed in IGNORE_FILES, or starts with a dot, `false` otherwise.
    """
    return name in IGNORE_DIRS or name in IGNORE_FILES or name.startswith('.')

def generate_tree(root_path: Path, max_depth: int = 2) -> list[str]:
    """
    Produce a list of text lines representing the directory tree rooted at `root_path` up to a given depth.
    
    Each returned string is a single tree line formatted as "- name/" for directories and "- name" for files. Entries are indented by two spaces per depth level. Directories appear before files and entries are ordered by name. Names present in the module's ignore sets or that start with a dot are omitted. If a directory cannot be read due to permissions, that subtree is skipped.
    
    Parameters:
        root_path (Path): Root directory to generate the tree from.
        max_depth (int): Maximum recursion depth (0 lists only root's immediate children, 1 includes one level of subdirectories, etc.).
    
    Returns:
        list[str]: Lines representing the repository tree in textual form.
    """
    lines = []
    
    def walk_dir(path: Path, prefix: str = "", depth: int = 0) -> None:
        """
        Recursively traverse a directory tree up to a containing scope's `max_depth` and append formatted lines describing files and directories to the enclosing `lines` list.
        
        Parameters:
            path (Path): Directory path to walk.
            prefix (str): Indentation prefix used for nested entries (each level adds two spaces).
            depth (int): Current recursion depth relative to the initial call.
        
        Notes:
            - Skips entries whose names are filtered by `should_ignore`.
            - Stops recursing when `depth` exceeds `max_depth`.
            - Silently skips directories that raise `PermissionError` when iterated.
        """
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

def main() -> None:
    """
    Generate a Markdown-formatted repository tree up to depth 2 and print it to stdout.
    
    Determines the repository root as two levels up from this script, builds a textual tree by calling `generate_tree` with `max_depth=2`, wraps the tree in a header and a fenced "text" code block, and writes the resulting Markdown to standard output.
    """
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