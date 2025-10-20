
import xml.etree.ElementTree as ET
import json
import os

def process_sks_xml():
    """
    Parses the large SKS_klassifikation.xml file, processes the data, 
    and saves it to a clean JSON file.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_xml_path = os.path.join(script_dir, 'SKS_klassifikation.xml')
    output_json_path = os.path.join(script_dir, 'sks_processed.json')

    if not os.path.exists(input_xml_path):
        print(f"Error: Input file not found at {input_xml_path}")
        return

    print(f"Starting processing of {input_xml_path}...")

    # Using a dictionary to store the latest version of each code
    sks_data = {}

    # Use iterparse for memory-efficient streaming parsing
    context = ET.iterparse(input_xml_path, events=('end',))

    for event, elem in context:
        # When an SKS_klass_record element ends, process it
        if elem.tag == 'SKS_klass_record':
            # Find the relevant data within the record
            sks_id = elem.find('sks_id').text
            rec_art = elem.find('sks_recart').text
            kode = elem.find('sks_kode').text
            dato_til = elem.find('sks_datoTil').text
            kort_tekst = elem.find('sks_korttekst').text

            # We only want currently active codes
            if dato_til == '25000101':
                final_kode = kode
                # As per the user's request, remove 'adm' prefix
                if rec_art == 'adm':
                    # This is a more robust way to remove the prefix
                    if final_kode.startswith('adm'):
                         final_kode = final_kode[3:]

                # Store the code and text. This automatically handles duplicates
                # by keeping only the last one seen, which is fine for this file.
                if final_kode and kort_tekst:
                    sks_data[final_kode] = kort_tekst
            
            # Clear the element from memory to keep usage low
            elem.clear()

    print(f"Processing complete. Found {len(sks_data)} unique, active codes.")

    # Save the processed data to a JSON file
    try:
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(sks_data, f, indent=4, ensure_ascii=False)
        print(f"Successfully created clean data file at: {output_json_path}")
    except IOError as e:
        print(f"Error saving JSON file: {e}")

if __name__ == "__main__":
    process_sks_xml()
