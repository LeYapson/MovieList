# File: project-scanner.py
# Position: Tools/project-scanner.py
# Description: Scanner de projet modifié pour inclure les mock_data JSON

import os
import json
import shutil
from pathlib import Path

def is_venv_directory(path):
    """Vérifie si un dossier est un virtual environment Python."""
    venv_indicators = {'pyvenv.cfg', 'activate', 'activate.ps1', 'activate.fish'}
    
    try:
        items = set(os.listdir(path))
        has_pyvenv = 'pyvenv.cfg' in items
        has_bin_or_scripts = 'bin' in items or 'Scripts' in items
        
        if has_pyvenv and has_bin_or_scripts:
            return True
            
        bin_path = os.path.join(path, 'bin') or os.path.join(path, 'Scripts')
        if os.path.isdir(bin_path):
            if any(indicator in os.listdir(bin_path) for indicator in venv_indicators):
                return True
                
    except (PermissionError, OSError):
        pass
    
    return False

def is_important_file(filename, current_path=""):
    """Détermine si un fichier est important pour la compilation."""
    important_files = {
        # Fichiers de configuration
        '.env', '.gitignore', 'package.json', 'tsconfig.json',
        'vite.config.ts', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js',
        'eslint.config.js', '.eslintrc.js', '.eslintrc.json',
        # Fichiers source principaux
        'index.html', 'main.tsx', 'main.jsx', 'main.ts', 'main.js',
        'App.tsx', 'App.jsx', 'App.ts', 'App.js'
    }
    
    important_extensions = {
        '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.env',
        '.py',  # Fichiers Python
        '.cs'   # Fichiers C#
    }
    
    # Vérifier si on est dans le dossier mock_data
    is_mock_data = 'mock_data' in current_path
    
    # Si c'est un fichier JSON dans mock_data, l'inclure
    if is_mock_data and filename.endswith('.json'):
        return True
    
    # Exclure explicitement package-lock.json
    if filename == 'package-lock.json':
        return False
        
    return (filename in important_files or 
            any(filename.endswith(ext) for ext in important_extensions))

def get_flat_filename(original_path):
    """Convertit un chemin de fichier en nom de fichier plat."""
    flat_name = original_path.replace(os.sep, '_')
    if flat_name.startswith('.'):
        flat_name = 'dot_' + flat_name[1:]
    return flat_name

def copy_mock_data_files(project_path, dest_path):
    """Copie spécifiquement les fichiers JSON du dossier mock_data."""
    mock_files_copied = []
    mock_data_path = os.path.join(project_path, 'Front_Veliko', 'Veliko_Front_ju_V2', 'src', 'mock_data')
    
    if os.path.exists(mock_data_path):
        print(f"Dossier mock_data trouvé : {mock_data_path}")
        
        for file in os.listdir(mock_data_path):
            if file.endswith('.json'):
                src_file = os.path.join(mock_data_path, file)
                rel_path = os.path.relpath(src_file, project_path)
                flat_name = get_flat_filename(rel_path)
                dest_file = os.path.join(dest_path, flat_name)
                
                try:
                    shutil.copy2(src_file, dest_file)
                    mock_files_copied.append(rel_path)
                    print(f"Mock file copié : {file} -> {flat_name}")
                except Exception as e:
                    print(f"Erreur lors de la copie de {file}: {str(e)}")
    else:
        print("Dossier mock_data non trouvé à l'emplacement attendu")
    
    return mock_files_copied

def scan_and_copy_project(project_path, dest_path):
    """Scanne le projet et copie les fichiers importants."""
    important_files = []
    
    # Dossiers à ignorer
    skip_dirs = {'node_modules', 'dist', '.git', '__pycache__', '.pytest_cache', 
                 'Scanned_files', '.venv', 'venv', 'env', '.tox', '.eggs', '*.egg-info'}
    
    try:
        os.makedirs(dest_path, exist_ok=True)
        
        # D'abord, copier spécifiquement les fichiers mock_data
        mock_files = copy_mock_data_files(project_path, dest_path)
        important_files.extend(mock_files)
        
        # Ensuite, scanner le reste du projet
        for root, dirs, files in os.walk(project_path):
            # Filtrer les dossiers à ignorer
            dirs[:] = [d for d in dirs if d not in skip_dirs and not is_venv_directory(os.path.join(root, d))]
            
            for file in files:
                current_rel_path = os.path.relpath(root, project_path)
                
                if is_important_file(file, current_rel_path):
                    rel_path = os.path.relpath(os.path.join(root, file), project_path)
                    
                    # Éviter les doublons des fichiers mock_data déjà copiés
                    if rel_path not in mock_files:
                        important_files.append(rel_path)
                        
                        src_file = os.path.join(root, file)
                        flat_name = get_flat_filename(rel_path)
                        dest_file = os.path.join(dest_path, flat_name)
                        
                        shutil.copy2(src_file, dest_file)
                
        important_files.sort()
        return important_files
        
    except Exception as e:
        return f"Erreur lors du scan et de la copie: {str(e)}"

def generate_report(files, dest_path):
    """Génère un rapport détaillé avec séparation des fichiers mock."""
    mock_files = [f for f in files if 'mock_data' in f]
    other_files = [f for f in files if 'mock_data' not in f]
    
    report = {
        "scan_summary": {
            "total_files": len(files),
            "mock_files_count": len(mock_files),
            "other_files_count": len(other_files)
        },
        "mock_data_files": [],
        "project_files": []
    }
    
    for file in mock_files:
        report["mock_data_files"].append({
            "original_path": file,
            "flat_name": get_flat_filename(file),
            "type": "mock_data"
        })
    
    for file in other_files:
        report["project_files"].append({
            "original_path": file,
            "flat_name": get_flat_filename(file),
            "extension": os.path.splitext(file)[1]
        })
    
    report_path = os.path.join(dest_path, 'scan_report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    return report_path

def main():
    project_path = os.getcwd()
    dest_path = os.path.join(project_path, 'Scanned_files')
    
    print("\n" + "="*60)
    print("SCAN DU PROJET REACT/VITE + MOCK DATA")
    print("="*60 + "\n")
    
    files = scan_and_copy_project(project_path, dest_path)
    
    if isinstance(files, list):
        mock_files = [f for f in files if 'mock_data' in f]
        other_files = [f for f in files if 'mock_data' not in f]
        
        print(f"📁 FICHIERS MOCK DATA ({len(mock_files)} fichiers):")
        print("-" * 40)
        for file in mock_files:
            flat_name = get_flat_filename(file)
            print(f"  {file} -> {flat_name}")
        
        print(f"\n📁 AUTRES FICHIERS ({len(other_files)} fichiers):")
        print("-" * 40)
        for file in other_files[:10]:  # Limiter l'affichage pour la lisibilité
            flat_name = get_flat_filename(file)
            print(f"  {file} -> {flat_name}")
        
        if len(other_files) > 10:
            print(f"  ... et {len(other_files) - 10} autres fichiers")
        
        print("\n" + "="*60)
        print(f"TOTAL: {len(files)} fichiers copiés")
        print(f"  - Mock data: {len(mock_files)} fichiers")
        print(f"  - Autres: {len(other_files)} fichiers")
        print("="*60)
        
        # Générer le rapport
        report_path = generate_report(files, dest_path)
        print(f"\nRapport JSON généré: {report_path}")
        print(f"Tous les fichiers sont dans: {dest_path}")
        print("\n✅ Mock data JSON inclus dans le scan!")
        
    else:
        print(files)

if __name__ == "__main__":
    main()