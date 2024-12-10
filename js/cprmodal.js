var printWindow; // Declare printWindow variable in the global scope

// Function to build the summary table
function buildSummaryTable(cprInput) {
    var summaryContent = '<table class="table table-striped"><thead><tr><th>Group</th><th>SKS-navn</th><th>SKS</th></tr></thead><tbody>';

    // Get selected values from the current page
    var selectedValues = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');

    // Retrieve saved data from localStorage
    var savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');

    // Use a Set to track displayed items and prevent duplicates
    var displayedSelections = new Set();

    // Add current selections to the summary
    selectedValues.forEach(selected => {
        var group = selected.getAttribute('name');
        var labelText = selected.getAttribute('value');
        var groupData = options.Groups.find(e => e.GroupHeading === group);
        if (groupData) {
            var itemData = groupData.Items.find(item => item.LabelText === labelText);
            if (itemData && !displayedSelections.has(`${group}-${labelText}`)) {
                var SKSnavn = itemData.SKSnavn || "Unknown";
                var SKS = itemData.SKScode || "Unknown";
                summaryContent += `<tr><td>${group}</td><td>${SKSnavn}</td><td>${SKS}</td></tr>`;
                displayedSelections.add(`${group}-${labelText}`); // Mark as displayed
            }
        }
    });

    // Add saved selections to the summary
    savedSelections.forEach(selection => {
        if (!displayedSelections.has(`${selection.group}-${selection.label}`)) {
            summaryContent += `<tr><td>${selection.group}</td><td>${selection.SKSnavn}</td><td>${selection.SKS}</td></tr>`;
            displayedSelections.add(`${selection.group}-${selection.label}`); // Mark as displayed
        }
    });

    summaryContent += '</tbody></table>';

    // Append CPR to the summary content (only if provided)
    var summaryWithCPR = cprInput ? `<h3>CPR: ${cprInput}</h3>${summaryContent}` : summaryContent;

    return summaryWithCPR; // Return the generated HTML table string with CPR
}

// Function to open CPR modal and initiate printing
function printWithCPR() {
    // Open CPR modal
    $('#cprModal').modal('show');
}

// Function to clear the input fields and reset focus
function clearInputFields() {
    const cprInputFirst = document.getElementById('cprInputFirst');
    const cprInputSecond = document.getElementById('cprInputSecond');

    if (cprInputFirst && cprInputSecond) {
        cprInputFirst.value = '';
        cprInputSecond.value = '';
        cprInputFirst.classList.remove('is-invalid');
        cprInputSecond.classList.remove('is-invalid');

        // Add focus back to the first input field
        cprInputFirst.focus();
    }
}

// Function to print summary to A4 with CPR
function printSummaryToA4(cprInput) {
    // Generate summary content as an HTML string
    var summaryContent = buildSummaryTable(cprInput);

    // Create a temporary print window with A4 size and basic styling
    var printWindow = window.open('', '_blank', 'width=800,height=600'); // A4 dimensions (approximate)

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Printable Summary with CPR</title>
            <style>
                @page { size: A4; margin: 20px; } /* Set A4 size and margins */
                body { padding: 20px; font-family: 'Arial', sans-serif; } /* Basic styling with padding and font */
                h3 { font-family: 'Arial', serif; margin-bottom: 20px; } /* Fancy font for CPR header */
                table { width: 100%; border-collapse: collapse; margin-top: 20px; } /* Ensure table fills available width */
                th, td { border: 2px solid #000; padding: 8px; text-align: left; font-family: 'Arial', sans-serif; } /* Table cell styling with borders */
                th { background-color: #f2f2f2; } /* Light background for header cells */
            </style>
        </head>
        <body>
            ${summaryContent}
        </body>
        </html>
    `);

    printWindow.document.close();

    // Trigger printing and close the window after a short delay
    printWindow.focus(); // Bring the window to focus (optional)
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 1000); // Adjust timeout if needed
}

// Event listener for the submit button in the CPR modal
document.getElementById('cprSubmit').addEventListener('click', function () {
    // Get the input values for the CPR number
    const cprInputFirst = document.getElementById('cprInputFirst');
    const cprInputSecond = document.getElementById('cprInputSecond');
    var cprInput = cprInputFirst.value && cprInputSecond.value ? `${cprInputFirst.value}-${cprInputSecond.value}` : '';

    // Validate the CPR number format or allow empty
    if (cprInput === '' || /^\d{6}-\d{4}$/.test(cprInput)) {
        // Hide the CPR modal
        $('#cprModal').modal('hide');
        // Call the print summary function with the CPR input
        printSummaryToA4(cprInput);
        // Clear input fields after successful submission
        clearInputFields();
    } else {
        // Add 'is-invalid' class to inputs if validation fails
        cprInputFirst.classList.add('is-invalid');
        cprInputSecond.classList.add('is-invalid');
    }
});

// Event listener for the modal dismissal
$('#cprModal').on('hidden.bs.modal', function () {
    clearInputFields();
});

// Event listener for when the modal is shown
$('#cprModal').on('shown.bs.modal', function () {
    clearInputFields();
});

// Automatically move the cursor to the second input field when the first is filled
document.getElementById('cprInputFirst').addEventListener('input', function () {
    if (this.value.length === 6) {
        document.getElementById('cprInputSecond').focus();
    }
});

// Automatically move the cursor to the submit button when the second input field is filled
document.getElementById('cprInputSecond').addEventListener('input', function () {
    if (this.value.length === 4) {
        document.getElementById('cprSubmit').focus();
    }
});
