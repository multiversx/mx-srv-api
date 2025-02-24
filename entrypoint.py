import os
import json
from ruamel.yaml import YAML

yaml = YAML(typ='rt')
yaml.preserve_quotes = True
yaml.default_flow_style = False
yaml.width = 4096  # to avoid long string values being placed on the next line

# Load the YAML file
def load_yaml(file_path):
    with open(file_path, 'r') as file:
        return yaml.load(file)

# Save the updated YAML file
def save_yaml(file_path, data):
    with open(file_path, 'w') as file:
        yaml.dump(data, file)

# Load the JSON file
def load_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

# Save the updated JSON file
def save_json(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

# Function to convert string to the proper type based on the prefix (bool, num, raw)
def convert_value(value_str):
    # Check if the value string contains a colon
    if ":" not in value_str:
        # If no colon, assume it's a plain string
        return value_str

    # Split the string by the ':' delimiter
    prefix, value = value_str.split(":", 1)

    match prefix:
        # BOOLEAN
        case 'bool':
            return value.lower() == 'true'  # Convert to boolean (True/False)
        # NUMBER
        case 'num':
            try:
                return int(value)  # Convert to integer
            except ValueError:
                print(f"Error: Cannot convert '{value_str}' to a number.")
                return None
        # ARRAY
        case 'arr':   
            # Check if the value looks like a JSON array (starts with '[' and ends with ']')
            if value.startswith('[') and value.endswith(']'):
                try:
                    return json.loads(value)  # Convert the string to a list
                except json.JSONDecodeError:
                    print(f"Error: Cannot decode '{value_str}' as a JSON array.")
                    return None
            print(f"Error: '{value_str}' is not a valid array format.")
            return None  # Return None if the array format is incorrect            
        # RAW
        case 'raw':
            return value  # Return exactly as received (raw string)
        # DEFAULT STRING
        case _:
            return value_str  # Default to string if no match

# Modify the value in the YAML structure based on the variable name
def modify_yaml_variable(data, variable_name, new_value):
    keys = variable_name[4:].split('_')  # Remove 'CFG_' prefix
    sub_data = data
    
    # Traverse the YAML structure using the keys to reach the variable and modify its value
    for key in keys[:-1]:
        if key in sub_data:
            sub_data = sub_data[key]
        else:
            print(f"Key '{key}' not found in the YAML structure.")
            return
    
    # Check if the final key exists in the structure
    final_key = keys[-1]
    if final_key in sub_data:
        # Check if it's an array (arr: prefix)
        if isinstance(new_value, str) and new_value.startswith('arr:'):
            try:
                # Parse the value as a JSON array
                sub_data[final_key] = json.loads(new_value[4:])  # Strip 'arr:' and parse
            except json.JSONDecodeError:
                print(f"Error decoding JSON array in value: {new_value}")
        else:
            sub_data[final_key] = new_value
    else:
        print(f"Key '{final_key}' not found at the end of the path.")
        return

# Modify the value in the JSON structure based on the variable name
def modify_json_variable(data, variable_name, new_value):
    keys = variable_name[5:].split('_')  # Remove 'DAPP_' prefix
    sub_data = data
    
    # Traverse the JSON structure using the keys to reach the variable and modify its value
    for key in keys[:-1]:
        if key in sub_data:
            sub_data = sub_data[key]
        else:
            print(f"Key '{key}' not found in the JSON structure.")
            return
    
    # Check if the value is a JSON array (list) and parse it
    final_key = keys[-1]
    if final_key in sub_data:
        # If the new value is a string representing a JSON array, parse it
        if isinstance(new_value, str) and new_value.startswith('[') and new_value.endswith(']'):
            try:
                # Parse the string as a JSON array
                sub_data[final_key] = json.loads(new_value)
            except json.JSONDecodeError:
                print(f"Error decoding JSON array in value: {new_value}")
        else:
            sub_data[final_key] = new_value
    else:
        print(f"Key '{final_key}' not found at the end of the path.")
        return

# Main function
def main():
    # Input and output file paths
    default_cfg_file = os.getenv('DEFAULT_CFG_FILE', 'devnet')
    
    config_yaml_input_file = f'config/config.{default_cfg_file}.yaml'
    config_yaml_output_file = '/app/dist/config/config.yaml'

    dapp_config_json_input_file = f'config/dapp.config.{default_cfg_file}.json'
    dapp_config_json_output_file = f'config/dapp.config.{default_cfg_file}.json'

    # Load the YAML file
    config_yaml = load_yaml(config_yaml_input_file)

    # Load the JSON file
    config_json = load_json(dapp_config_json_input_file)

    # Iterate over all environment variables starting with 'CFG_' for YAML
    for variable_name, new_value in os.environ.items():
        if variable_name.startswith('CFG_'):
            print(f"Updating YAML variable: {variable_name} with value: {new_value}")
            # Convert value based on the type (bool, num, raw, or default to string)
            converted_value = convert_value(new_value)
            if converted_value is not None:
                modify_yaml_variable(config_yaml, variable_name, converted_value)

    # Iterate over all environment variables starting with 'DAPP_' for JSON
    for variable_name, new_value in os.environ.items():
        if variable_name.startswith('DAPP_'):
            print(f"Updating JSON variable: {variable_name} with value: {new_value}")
            # Convert value based on the type (bool, num, raw, or default to string)
            converted_value = convert_value(new_value)
            if converted_value is not None:
                modify_json_variable(config_json, variable_name, converted_value)

    # Save the updated YAML file
    save_yaml(config_yaml_output_file, config_yaml)
    print(f"Updated YAML file saved as {config_yaml_output_file}")

    # Save the updated JSON file
    save_json(dapp_config_json_output_file, config_json)
    print(f"Updated JSON file saved as {dapp_config_json_output_file}")

    os.execvp('node', ['node', 'dist/src/main.js'])

if __name__ == "__main__":
    main()
