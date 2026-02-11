# File: project-scanner.py
# Position: Tools/project-scanner.py
# Description: Scanner de projet avec surveillance automatique des modifications

import os
import json
import shutil
import time
import hashlib
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# ============================================================
# CONFIGURATION
# ============================================================
SKIP_DIRS = {
    'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache',
    'Scanned_files', '.venv', 'venv', 'env', '.tox', '.eggs',
    '*.egg-info', '.next', 'build', 'coverage'
}

IMPORTANT_FILES = {
    '.env', '.gitignore', 'package.json', 'tsconfig.json',
    'vite.config.ts', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js',
    'eslint.config.js', '.eslintrc.js', '.eslintrc.json',
    'index.html', 'main.tsx', 'main.jsx', 'main.ts', 'main.js',
    'App.tsx', 'App.jsx', 'App.ts', 'App.js'
}

IMPORTANT_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.env', '.py', '.cs'
}

# ============================================================
# UTILITAIRES
# ============================================================

def is_venv_directory(path):
    try:
        items = set(os.listdir(path))
        if 'pyvenv.cfg' in items and ('bin' in items or 'Scripts' in items):
            return True
    except (PermissionError, OSError):
        pass
    return False


def is_important_file(filename, current_path=""):
    if filename == 'package-lock.json':
        return False
    if 'mock_data' in current_path and filename.endswith('.json'):
        return True
    return (filename in IMPORTANT_FILES or
            any(filename.endswith(ext) for ext in IMPORTANT_EXTENSIONS))


def get_flat_filename(original_path):
    flat_name = original_path.replace(os.sep, '_')
    return ('dot_' + flat_name[1:]) if flat_name.startswith('.') else flat_name


def file_hash(filepath):
    """Hash MD5 rapide pour détecter les vrais changements."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except (OSError, PermissionError):
        return None


def should_skip(path, project_path):
    """Vérifie si un chemin doit être ignoré."""
    rel = os.path.relpath(path, project_path)
    parts = Path(rel).parts
    return any(p in SKIP_DIRS for p in parts)


# ============================================================
# SCAN & SYNC
# ============================================================

def scan_and_sync(project_path, dest_path):
    """Scan complet + sync incrémentale avec détection de suppressions."""
    os.makedirs(dest_path, exist_ok=True)

    current_files = {}  # rel_path -> flat_name
    copied, updated, unchanged = 0, 0, 0

    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs
                   if d not in SKIP_DIRS
                   and not is_venv_directory(os.path.join(root, d))]

        for file in files:
            current_rel = os.path.relpath(root, project_path)
            if not is_important_file(file, current_rel):
                continue

            src = os.path.join(root, file)
            rel_path = os.path.relpath(src, project_path)
            flat_name = get_flat_filename(rel_path)
            dest_file = os.path.join(dest_path, flat_name)
            current_files[rel_path] = flat_name

            src_hash = file_hash(src)
            dest_hash = file_hash(dest_file) if os.path.exists(dest_file) else None

            if src_hash != dest_hash:
                shutil.copy2(src, dest_file)
                if dest_hash is None:
                    copied += 1
                else:
                    updated += 1
            else:
                unchanged += 1

    # Supprimer les fichiers obsolètes du dossier scanné
    existing_flat = set(current_files.values())
    existing_flat.add('scan_report.json')
    removed = 0
    for f in os.listdir(dest_path):
        if f not in existing_flat:
            os.remove(os.path.join(dest_path, f))
            removed += 1

    # Générer le rapport
    generate_report(list(current_files.keys()), dest_path)

    return {
        'total': len(current_files),
        'copied': copied,
        'updated': updated,
        'unchanged': unchanged,
        'removed': removed
    }


def generate_report(files, dest_path):
    mock_files = [f for f in files if 'mock_data' in f]
    other_files = [f for f in files if 'mock_data' not in f]

    report = {
        "last_sync": time.strftime("%Y-%m-%d %H:%M:%S"),
        "scan_summary": {
            "total_files": len(files),
            "mock_files_count": len(mock_files),
            "other_files_count": len(other_files)
        },
        "mock_data_files": [
            {"original_path": f, "flat_name": get_flat_filename(f)}
            for f in mock_files
        ],
        "project_files": [
            {"original_path": f, "flat_name": get_flat_filename(f),
             "extension": os.path.splitext(f)[1]}
            for f in other_files
        ]
    }

    with open(os.path.join(dest_path, 'scan_report.json'), 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)


# ============================================================
# FILE WATCHER
# ============================================================

class ProjectWatcher(FileSystemEventHandler):
    """Surveille les modifications et déclenche un re-sync."""

    def __init__(self, project_path, dest_path, debounce=2.0):
        self.project_path = project_path
        self.dest_path = dest_path
        self.debounce = debounce
        self._last_trigger = 0
        self._pending = False

    def _should_handle(self, event):
        path = event.src_path
        if should_skip(path, self.project_path):
            return False
        if event.is_directory:
            return False
        filename = os.path.basename(path)
        rel_dir = os.path.relpath(os.path.dirname(path), self.project_path)
        return is_important_file(filename, rel_dir)

    def _trigger_sync(self):
        now = time.time()
        if now - self._last_trigger < self.debounce:
            self._pending = True
            return
        self._last_trigger = now
        self._pending = False
        self._do_sync()

    def _do_sync(self):
        print(f"\n🔄 [{time.strftime('%H:%M:%S')}] Modification détectée, synchronisation...")
        try:
            stats = scan_and_sync(self.project_path, self.dest_path)
            parts = []
            if stats['copied']:
                parts.append(f"+{stats['copied']} nouveaux")
            if stats['updated']:
                parts.append(f"~{stats['updated']} mis à jour")
            if stats['removed']:
                parts.append(f"-{stats['removed']} supprimés")
            if not parts:
                parts.append("aucun changement")
            print(f"   ✅ {stats['total']} fichiers | {' | '.join(parts)}")
        except Exception as e:
            print(f"   ❌ Erreur: {e}")

    def on_modified(self, event):
        if self._should_handle(event):
            self._trigger_sync()

    def on_created(self, event):
        if self._should_handle(event):
            self._trigger_sync()

    def on_deleted(self, event):
        if self._should_handle(event):
            self._trigger_sync()

    def on_moved(self, event):
        self._trigger_sync()

    def check_pending(self):
        """Appelé périodiquement pour traiter les events debounced."""
        if self._pending and (time.time() - self._last_trigger >= self.debounce):
            self._trigger_sync()


# ============================================================
# MAIN
# ============================================================

def main():
    project_path = os.getcwd()
    dest_path = os.path.join(project_path, 'Scanned_files')

    print("\n" + "=" * 60)
    print("📡 SCANNER VELIKO - MODE SURVEILLANCE AUTO")
    print("=" * 60)

    # Scan initial
    print("\n🔍 Scan initial en cours...")
    stats = scan_and_sync(project_path, dest_path)
    print(f"   ✅ {stats['total']} fichiers synchronisés")
    print(f"      ({stats['copied']} copiés, {stats['updated']} mis à jour, "
          f"{stats['unchanged']} inchangés, {stats['removed']} supprimés)")
    print(f"   📂 Dossier: {dest_path}")

    # Démarrer la surveillance
    print(f"\n👁️  Surveillance active... (Ctrl+C pour arrêter)")
    print("-" * 60)

    handler = ProjectWatcher(project_path, dest_path, debounce=2.0)
    observer = Observer()
    observer.schedule(handler, project_path, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
            handler.check_pending()
    except KeyboardInterrupt:
        print("\n\n🛑 Arrêt de la surveillance.")
        observer.stop()
    observer.join()
    print("✅ Scanner arrêté proprement.")


if __name__ == "__main__":
    main()