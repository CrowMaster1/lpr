
import xml.etree.ElementTree as ET
import json
import os

def process_sks_xml():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_xml_path = os.path.join(script_dir, 'SKS_klassifikation.xml')
    output_json_path = os.path.join(script_dir, 'sks_processed.json')

    if not os.path.exists(input_xml_path):
        print(f"Error: Input file not found at {input_xml_path}")
        return

    print(f"Starting processing of {input_xml_path}...")

    sks_data = {}
    for _, elem in ET.iterparse(input_xml_path, events=('end',)):
        if elem.tag == 'SKS_klass_record':
            rec_art = elem.find('sks_recart').text
            kode = elem.find('sks_kode').text
            dato_til = elem.find('sks_datoTil').text
            kort_tekst = elem.find('sks_korttekst').text

            if dato_til == '25000101':
                final_kode = kode[3:] if rec_art == 'adm' and kode.startswith('adm') else kode
                if final_kode and kort_tekst:
                    sks_data[final_kode] = kort_tekst

            elem.clear()  # ponytail: keeps peak memory flat; remove if switching to DOM parsing

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
