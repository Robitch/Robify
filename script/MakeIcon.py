import sys

TEMPLATE = """import {{ {icon_name} }} from 'lucide-react-native';
import {{ iconWithClassName }} from './iconWithClassName';
iconWithClassName({icon_name});
export {{ {icon_name} }};
"""

def create_tsx_file(icon_name):
    filename = f"lib/icons/{icon_name}.tsx"
    content = TEMPLATE.format(icon_name=icon_name)

    with open(filename, "w", encoding="utf-8") as file:
        file.write(content)
    
    print(f"Fichier '{filename}' créé avec succès.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_icons_tsx.py <IconName1> <IconName2> ...")
        sys.exit(1)
    
    icon_names = sys.argv[1:]  # Récupère tous les noms d'icônes passés en argument

    for icon_name in icon_names:
        create_tsx_file(icon_name)
