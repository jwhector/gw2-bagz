import os
import csv
import json
import glob
import re # Regular expressions for finding numbers

# --- Configuration ---

# Directory where your CSV files are stored (relative to script execution)
CSV_DIRECTORY = 'scripts/data'

# --- Fixed Cell Locations (0-based index) ---
SAMPLE_SIZE_ROW = 5  # Corresponds to Row 6
SAMPLE_SIZE_COL = 2  # Corresponds to Column C

DATA_START_ROW = 7   # Corresponds to Row 8
DATA_MAX_ROWS = 40   # Process up to 40 rows of data (Rows 8-47)

RESULT_ITEM_ID_COL = 1  # Corresponds to Column B
RESULT_ITEM_QUANTITY_COL = 2  # Corresponds to Column C
RESULT_ITEM_NAME_COL = 3  # Corresponds to Column D

# --- File Filtering ---
# Patterns in filenames to skip processing
SKIP_PATTERNS = ['template', 'summary', 'investment', 'datasheet']

# Fallback value if sample size cannot be found or parsed
DEFAULT_SAMPLE_SIZE = 0

# --- Helper Functions ---

def parse_number(value_str):
    """Safely parses a string into an integer, handling commas and potential decimals."""
    if not value_str:
        return None
    try:
        # Remove commas, handle potential decimals before converting to int
        cleaned_value = value_str.strip().replace(',', '')
        # Handle potential scientific notation from some CSV exports
        if 'e' in cleaned_value.lower():
             return int(float(cleaned_value))
        # Try int first, then float then int for robustness
        try:
            return int(cleaned_value)
        except ValueError:
            return int(float(cleaned_value))
    except (ValueError, TypeError):
        return None

def extract_sample_size_fixed(all_rows):
    """Extracts sample size from the fixed cell C6."""
    if len(all_rows) <= SAMPLE_SIZE_ROW:
        print(f"    - Warning: File has fewer than {SAMPLE_SIZE_ROW + 1} rows. Cannot get sample size.")
        return DEFAULT_SAMPLE_SIZE
    if len(all_rows[SAMPLE_SIZE_ROW]) <= SAMPLE_SIZE_COL:
        print(f"    - Warning: Row {SAMPLE_SIZE_ROW + 1} has fewer than {SAMPLE_SIZE_COL + 1} columns. Cannot get sample size.")
        return DEFAULT_SAMPLE_SIZE

    potential_value = all_rows[SAMPLE_SIZE_ROW][SAMPLE_SIZE_COL]
    size = parse_number(potential_value)

    if size is None:
        print(f"    - Warning: Could not parse numeric value from sample size cell (R{SAMPLE_SIZE_ROW+1}C{SAMPLE_SIZE_COL+1}). Value: '{potential_value}'")
        return DEFAULT_SAMPLE_SIZE
    else:
        print(f"    - Extracted sample size: {size} (from R{SAMPLE_SIZE_ROW+1}C{SAMPLE_SIZE_COL+1})")
        return size

# --- Main Processing Logic ---

all_extracted_data = {}
files_processed_count = 0
files_skipped_count = 0

print(f"Looking for CSV files in: {os.path.abspath(CSV_DIRECTORY)}")
# Use glob to find all CSV files, case-insensitive
csv_files = glob.glob(os.path.join(CSV_DIRECTORY, '*.csv')) + \
            glob.glob(os.path.join(CSV_DIRECTORY, '*.CSV'))

print(f"Found {len(csv_files)} CSV files.")

for file_path in csv_files:
    filename = os.path.basename(file_path)
    print(f"\nProcessing: {filename}")

    # --- 1. Skip based on filename patterns ---
    if any(pattern in filename.lower() for pattern in SKIP_PATTERNS):
        print("    - Skipping (Filename matches skip pattern).")
        files_skipped_count += 1
        continue

    # --- 2. Read all rows from the CSV ---
    try:
        with open(file_path, mode='r', encoding='utf-8', errors='ignore') as infile:
            reader = csv.reader(infile)
            all_rows = list(reader)
            if not all_rows or len(all_rows) <= max(SAMPLE_SIZE_ROW, DATA_START_ROW):
                print(f"    - Skipping (File is empty or too short - needs at least {max(SAMPLE_SIZE_ROW, DATA_START_ROW) + 1} rows).")
                files_skipped_count += 1
                continue
    except FileNotFoundError:
        print(f"    - Error: File not found.")
        files_skipped_count += 1
        continue
    except Exception as e:
        print(f"    - Error reading file: {e}")
        files_skipped_count += 1
        continue

    # --- 3. Extract Sample Size ---
    sample_size = extract_sample_size_fixed(all_rows)

    # --- 4. Extract Result Item Data ---
    result_items = []
    # Determine the actual end row index to process
    data_end_row_index = min(len(all_rows), DATA_START_ROW + DATA_MAX_ROWS)

    print(f"    - Reading data rows from index {DATA_START_ROW} to {data_end_row_index - 1} (Max {DATA_MAX_ROWS} rows)")

    for i in range(DATA_START_ROW, data_end_row_index):
        row = all_rows[i]
        row_number = i + 1 # 1-based row number for messages

        # Check if row has enough columns for ID, Quantity, and Name
        required_cols = max(RESULT_ITEM_ID_COL, RESULT_ITEM_QUANTITY_COL, RESULT_ITEM_NAME_COL) + 1
        if len(row) < required_cols:
            # print(f"    - Skipping data row {row_number}: Has only {len(row)} columns, needs {required_cols}.")
            continue # Skip rows that are too short

        # Extract data using fixed column indices
        item_id_str = row[RESULT_ITEM_ID_COL]
        quantity_str = row[RESULT_ITEM_QUANTITY_COL]
        item_name = row[RESULT_ITEM_NAME_COL].strip()

        # Basic validation: Need at least a name and a quantity
        if not item_name or not quantity_str:
            # print(f"    - Skipping data row {row_number}: Empty name or quantity.")
            continue

        # Parse numbers safely
        item_id = parse_number(item_id_str)
        quantity = parse_number(quantity_str)

        if quantity is None:
            # print(f"    - Skipping data row {row_number}: Invalid quantity '{quantity_str}'.")
            continue # Skip if quantity isn't a valid number

        # ID is allowed to be null/invalid if the column doesn't contain a number
        if item_id is None and item_id_str.strip(): # Log if ID had text but wasn't numeric
             # print(f"    - Info: Row {row_number} Item ID '{item_id_str}' is not numeric, storing as null.")
             pass

        result_items.append({
            "id": item_id, # Will be null if ID cell is empty or not a valid number
            "name": item_name,
            "quantity": quantity
        })

    # --- 5. Store Extracted Data ---
    if result_items: # Only add if we actually extracted item data
        all_extracted_data[filename] = {
            "source_item_guesses": { # Add guesses for easier seed script population
                "name_guess": filename.replace('GW2 BAGZ - ', '').replace('.csv', '').replace(' - New', ''),
                "id_placeholder": 0, # Placeholder - needs manual lookup
                "type_guess": "CONTAINER" if "bag" in filename.lower() or "goods" in filename.lower() or "sack" in filename.lower() else "SALVAGEABLE"
            },
            "extracted_sample_size": sample_size,
            "result_items": result_items
        }
        print(f"    - Successfully extracted {len(result_items)} result items.")
        files_processed_count += 1
    else:
        # Check if sample size was extracted even if no items were
        if sample_size != DEFAULT_SAMPLE_SIZE:
             all_extracted_data[filename] = {
                "source_item_guesses": {
                    "name_guess": filename.replace('GW2 BAGZ - ', '').replace('.csv', '').replace(' - New', ''),
                    "id_placeholder": 0,
                    "type_guess": "CONTAINER" if "bag" in filename.lower() or "goods" in filename.lower() or "sack" in filename.lower() else "SALVAGEABLE"
                },
                "extracted_sample_size": sample_size,
                "result_items": [] # Empty list as no valid items found
            }
             print(f"    - Warning: Extracted sample size but found 0 valid result items in data rows.")
             files_processed_count += 1 # Still count as processed if sample size found
        else:
            print(f"    - Skipping (No valid result item data found and sample size extraction failed or was zero).")
            files_skipped_count += 1


# --- 6. Output JSON ---
output_filename = 'extracted_gw2_data.json'
try:
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        json.dump(all_extracted_data, outfile, indent=2, ensure_ascii=False)
    print(f"\nSuccessfully processed {files_processed_count} files.")
    print(f"Skipped {files_skipped_count} files.")
    print(f"Extracted data written to: {output_filename}")
except Exception as e:
    print(f"\nError writing JSON output file: {e}")

