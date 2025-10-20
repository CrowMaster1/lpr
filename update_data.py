
import requests
import csv
import json
from io import StringIO

def fetch_sks_data(classification_code):
    """
    Fetches SKS data from medinfo.dk for a given classification.

    Args:
        classification_code (str): The code for the classification (e.g., 'D' for Diagnoser).

    Returns:
        str: The raw CSV data as a string, or None if the request fails.
    """
    dump_url = "https://www.medinfo.dk/sks/dump.php"
    payload = {
        "klass": classification_code,
        "format": "csv",
        "submit": "Dan fil"
    }
    
    print(f"Fetching data for classification: {classification_code}...")
    try:
        response = requests.post(dump_url, data=payload)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # The response is in ISO-8859-1 encoding, decode it correctly
        response.encoding = 'ISO-8859-1'
        print("Data fetched successfully.")
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def parse_and_transform_to_json(csv_data):
    """
    Parses the raw CSV data and transforms it into the required JSON structure.
    This function will need to be adapted based on the specific structure of your pages.
    This is a placeholder implementation.

    Args:
        csv_data (str): The raw CSV data.

    Returns:
        dict: The transformed data in the desired JSON format.
    """
    print("Parsing CSV data and transforming to JSON...")
    
    # Using StringIO to treat the string data as a file
    csv_file = StringIO(csv_data)
    
    # The CSV is semicolon-separated
    reader = csv.reader(csv_file, delimiter=';')
    
    # Skip header row
    header = next(reader, None)
    print(f"CSV Header: {header}")

    # This is a simplified transformation. You will need to adjust this logic
    # to correctly group items as they appear on your web pages.
    groups = []
    current_group = None
    
    # Example: Let's assume we are creating one big group called "Diagnoser"
    diagnoser_group = {
        "GroupHeading": "Diagnoser",
        "Description": "Liste over diagnoser hentet fra medinfo.dk",
        "AllowsMultipleSelections": True,
        "Items": []
    }

    for row in reader:
        if len(row) >= 2:
            code = row[0]
            text = row[1]
            
            # Simple transformation: each row becomes an item.
            item = {
                "LabelText": f"{code} {text}",
                "SKScode": code,
                "Vejledning": text,
                "DisplayType": "simple", # or "udvidet"
                "Show": True
            }
            diagnoser_group["Items"].append(item)

    groups.append(diagnoser_group)
    
    print(f"Transformation complete. Found {len(diagnoser_group['Items'])} items.")
    return {"Groups": groups}

def save_json_to_file(json_data, file_path):
    """
    Saves the JSON data to a file.

    Args:
        json_data (dict): The JSON data to save.
        file_path (str): The path to the output file.
    """
    print(f"Saving JSON data to {file_path}...")
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
        print("File saved successfully.")
    except IOError as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    # --- Configuration ---
    # Set the classification code you want to fetch.
    # 'D' = Diagnoser
    # 'K' = Procedurer (Koder)
    # 'B' = Anæstesiologiske procedurer
    # 'U' = Tillægskoder
    CLASSIFICATION_TO_FETCH = 'D'
    
    # Set the output file path.
    OUTPUT_FILE_PATH = f"data/page1_data.json"

    # --- Execution ---
    raw_csv = fetch_sks_data(CLASSIFICATION_TO_FETCH)
    
    if raw_csv:
        transformed_json = parse_and_transform_to_json(raw_csv)
        save_json_to_file(transformed_json, OUTPUT_FILE_PATH)

    print("\nTo use this script, you need to install the 'requests' library.")
    print("You can do this by running: pip install requests")
