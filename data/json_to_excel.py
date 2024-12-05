import json
import pandas as pd
import tkinter as tk
from tkinter import filedialog, messagebox

def json_to_excel():
    root = tk.Tk()
    root.withdraw()  # Hide the main window

    # Select the JSON file to convert
    input_file = filedialog.askopenfilename(
        title="Select JSON File",
        filetypes=[("JSON files", "*.json")]
    )

    if not input_file:
        messagebox.showerror("Error", "No input file selected.")
        return

    # Specify where to save the Excel file
    output_file = filedialog.asksaveasfilename(
        title="Save Excel File As",
        defaultextension=".xlsx",
        filetypes=[("Excel files", "*.xlsx")]
    )

    if not output_file:
        messagebox.showerror("Error", "No output file specified.")
        return

    try:
        # Load JSON data
        with open(input_file, "r", encoding="utf-8") as file:
            data = json.load(file)

        # Convert JSON data to a structured format for Excel
        rows = []
        for group in data.get("Groups", []):
            group_heading = group.get("GroupHeading", "")
            description = group.get("Description", "")
            allows_multiple = group.get("AllowsMultipleSelections", False)
            see_also_url = group.get("SeeAlso", {}).get("URL", "")
            see_also_text = group.get("SeeAlso", {}).get("LinkText", "")
            
            for item in group.get("Items", []):
                rows.append({
                    "Group Heading": group_heading,
                    "Description": description,
                    "Allows Multiple Selections": allows_multiple,
                    "See Also URL": see_also_url,
                    "See Also LinkText": see_also_text,
                    "Label Text": item.get("LabelText", ""),
                    "SKS Name": item.get("SKSnavn", ""),
                    "SKS Code": item.get("SKScode", ""),
                    "Guidance": item.get("Vejledning", ""),
                    "Display Type": item.get("DisplayType", ""),
                    "Show": item.get("Show", True)
                })

        # Create a DataFrame and save to Excel
        df = pd.DataFrame(rows)
        df.to_excel(output_file, index=False, engine="openpyxl")

        messagebox.showinfo("Success", f"JSON data successfully converted to Excel:\n{output_file}")

    except Exception as e:
        messagebox.showerror("Error", f"An error occurred:\n{e}")

if __name__ == "__main__":
    json_to_excel()
