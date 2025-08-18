import json
import os

# Function to create directories if they don't exist
def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Created directory: {directory}")

# Read the JSON file
try:
    with open('all-code.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    print("Error: 'all-code.json' not found in the current directory.")
    exit()
except json.JSONDecodeError:
    print("Error: Could not decode JSON. Make sure the file content is valid.")
    exit()


print("Starting to create project files and folders...")

# Loop through the files and create them
for file_path, content in data.items():
    # Skip the JSON file itself
    if file_path == "src/app/all-code.json":
        continue

    try:
        ensure_dir(file_path)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully created: {file_path}")
    except Exception as e:
        print(f"Could not create file {file_path}. Error: {e}")

print("\nProject setup complete! All files have been created.")