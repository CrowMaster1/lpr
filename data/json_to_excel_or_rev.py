import tkinter as tk
from tkinter import filedialog, messagebox
import json
import pandas as pd

def json_to_excel(json_file, save_file):
    # Load JSON data
    with open(json_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    # Convert JSON data to a structured format for Excel
    rows = []
    for group in data["Groups"]:
        group_heading = group["GroupHeading"]
        description = group.get("Description", "")
        allows_multiple = group.get("AllowsMultipleSelections", False)
        see_also_url = group.get("SeeAlso", {}).get("URL", "")
        see_also_text = group.get("SeeAlso", {}).get("LinkText", "")
        
        for item in group["Items"]:
            rows.append({
                "Group Heading": group_heading,
                "Description": description,
                "Allows Multiple Selections": allows_multiple,
                "See Also URL": see_also_url,
                "See Also LinkText": see_also_text,
                "Label Text": item["LabelText"],
                "SKS Name": item["SKSnavn"],
                "SKS Code": item["SKScode"],
                "Guidance": item["Vejledning"],
                "Display Type": item["DisplayType"],
                "Show": item["Show"]
            })

    # Create a DataFrame and save to Excel
    df = pd.DataFrame(rows)
    df.to_excel(save_file, index=False, engine="openpyxl")
    messagebox.showinfo("Success", f"JSON data successfully converted to Excel: {save_file}")

def excel_to_json(excel_file, save_file):
    # Load the Excel file
    df = pd.read_excel(excel_file, engine="openpyxl")

    # Convert Excel data back to JSON structure
    data = {"Groups": []}
    for group_heading, group_df in df.groupby("Group Heading"):
        group_data = {
            "GroupHeading": group_heading,
            "Description": group_df["Description"].iloc[0],
            "AllowsMultipleSelections": bool(group_df["Allows Multiple Selections"].iloc[0]),
            "SeeAlso": {
                "URL": group_df["See Also URL"].iloc[0],
                "LinkText": group_df["See Also LinkText"].iloc[0]
            },
            "Items": []
        }
        
        for _, row in group_df.iterrows():
            group_data["Items"].append({
                "LabelText": row["Label Text"],
                "SKSnavn": row["SKS Name"],
                "SKScode": row["SKS Code"],
                "Vejledning": row["Guidance"],
                "DisplayType": row["Display Type"],
                "Show": bool(row["Show"])
            })
        
        data["Groups"].append(group_data)

    # Save JSON data
    with open(save_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, ensure_ascii=False)
    messagebox.showinfo("Success", f"Excel data successfully converted to JSON: {save_file}")

def select_file():
    file_path = filedialog.askopenfilename(title="Select a File", filetypes=(("JSON & Excel files", "*.json *.xlsx"),))
    return file_path

def save_file(default_extension):
    file_path = filedialog.asksaveasfilename(title="Save File", defaultextension=default_extension,
                                             filetypes=((f"{default_extension.upper()} files", f"*{default_extension}"),))
    return file_path

def convert_to_excel():
    json_file = select_file()
    if json_file.endswith(".json"):
        save_path = save_file(".xlsx")
        if save_path:
            json_to_excel(json_file, save_path)
    else:
        messagebox.showerror("Error", "Please select a JSON file.")

def convert_to_json():
    excel_file = select_file()
    if excel_file.endswith(".xlsx"):
        save_path = save_file(".json")
        if save_path:
            excel_to_json(excel_file, save_path)
    else:
        messagebox.showerror("Error", "Please select an Excel file.")

# GUI setup
root = tk.Tk()
root.title("File Converter")

frame = tk.Frame(root, padx=20, pady=20)
frame.pack()

tk.Label(frame, text="Select Conversion Type:", font=("Arial", 14)).grid(row=0, column=0, columnspan=2, pady=10)

tk.Button(frame, text="Convert JSON to Excel", command=convert_to_excel, width=20).grid(row=1, column=0, padx=10, pady=10)
tk.Button(frame, text="Convert Excel to JSON", command=convert_to_json, width=20).grid(row=1, column=1, padx=10, pady=10)

root.mainloop()
