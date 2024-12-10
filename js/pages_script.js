var options; // Declare options globally to make it accessible across functions


document.addEventListener("DOMContentLoaded", () => {
    const currentPageId = document.body.getAttribute("data-page-id");
    if (!currentPageId) {
        console.error("data-page-id is missing in the <body> tag.");
        alert("Page ID is missing. Please contact the administrator.");
        return;
    }

    const dataFilePath = `data/${currentPageId}_data.json`;

    // Fetch navigation content
    fetch('navigation.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Navigation fetch failed with status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            document.querySelector('.navigation-container').innerHTML = data;

            // After loading the navigation, mark pages with saved data
            markPagesWithSavedData();
        })
        .catch(error => console.error('Error fetching navigation:', error));

    // Fetch page-specific data
    fetch(dataFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Data fetch failed with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Data loaded successfully:", data);
            options = data;
            generateDataEntry(data);

            // Load saved data into fields
            loadSavedData();
        })
        .catch(error => {
            console.error(`Error fetching data from ${dataFilePath}:`, error);
            alert("Unable to load data. Please try again later.");
        });

    // Check for saved data on the current page
    checkForSavedData();
});



document.getElementById('addSelectedValue').addEventListener('click', () => {
    const selectedOptions = document.querySelectorAll('#selectModalBody .form-check-input:checked');
    if (selectedOptions.length === 0) {
        alert('Please select at least one option.');
        return;
    }

    const groupName = "Additional Selections";
    let group = options.Groups.find(g => g.GroupHeading === groupName);

    if (!group) {
        group = {
            GroupHeading: groupName,
            AllowsMultipleSelections: true,
            Description: "User-selected additional options.",
            Items: []
        };
        options.Groups.push(group);
    }

    selectedOptions.forEach(option => {
        if (!group.Items.some(item => item.LabelText === option.value)) {
            group.Items.push({
                LabelText: option.value,
                Vejledning: "User-selected value",
                SKScode: "USER",
                Show: true
            });
        }
    });

    generateDataEntry(options);
    $('#selectModal').modal('hide');
});

///////////////Gem data knap FUNKTION///////////////////////////////////////////////////////
document.getElementById('saveDataButton').addEventListener('click', saveData);

/////////////////////////////check////////////////////////
document.getElementById('clearAllButton').addEventListener('click', clearSelections);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Hent data til siden/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function generateDataEntry(data) {
    const dataEntryDiv = document.getElementById('dataEntry');
    dataEntryDiv.innerHTML = ''; // Clear current content to refresh

    if (!data || !data.Groups || !Array.isArray(data.Groups)) {
        console.error("Invalid data structure:", data);
        dataEntryDiv.innerHTML = "<p>Data could not be loaded. Please contact support.</p>";
        return;
    }

    data.Groups.forEach((group, groupIndex) => {
        const inputType = group.AllowsMultipleSelections ? 'checkbox' : 'radio';

        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-box');

        const groupHeading = createGroupHeading(group, groupIndex);
        groupDiv.appendChild(groupHeading);

        const itemContainer = document.createElement('div');
        itemContainer.classList.add('item-container');

        group.Items.forEach(item => {
            if (!item.Show) return;
            const itemElement = createItemElement(item, group.GroupHeading, inputType);
            itemContainer.appendChild(itemElement);
        });

        groupDiv.appendChild(itemContainer);
        dataEntryDiv.appendChild(groupDiv);
    });
}

function createGroupHeading(group, groupIndex) {
    const groupHeading = document.createElement('div');
    groupHeading.classList.add('group-heading-container');
    groupHeading.innerHTML = `
        <label class="group-heading">
            ${group.GroupHeading}
            <button class="info-button btn btn-link" data-group-index="${groupIndex}" onclick="showGroupInfo(${groupIndex})">
                <i class="fas fa-question-circle"></i>
            </button>
            <button class="btn btn-outline-primary btn-sm toggle-udvidet" data-group-index="${groupIndex}" onclick="toggleUdvidet(${groupIndex})">
                Udvid
            </button>
        </label>`;
    return groupHeading;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////gem data/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function saveData() {
    const selectedValues = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    if (selectedValues.length === 0) return;

    const currentPageId = document.body.getAttribute('data-page-id'); // Use page ID from body attribute
    let savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');

    selectedValues.forEach(selected => {
        const groupName = selected.getAttribute('name');
        const labelText = selected.value;

        const isAlreadySaved = savedSelections.some(selection =>
            selection.pageId === currentPageId &&
            selection.group === groupName &&
            selection.label === labelText
        );

        if (!isAlreadySaved) {
            const groupData = options.Groups.find(group => group.GroupHeading === groupName);
            if (groupData) {
                const itemData = groupData.Items.find(item => item.LabelText === labelText);
                if (itemData) {
                    savedSelections.push({
                        pageId: currentPageId,
                        group: groupName,
                        label: labelText,
                        SKSnavn: itemData.SKScode || "Unknown",
                        SKS: itemData.LabelText
                    });
                }
            }
        }
    });

    localStorage.setItem('savedSelections', JSON.stringify(savedSelections));

    // Update the navigation icons
    markPagesWithSavedData();
}



////////////////Undersøg om der er gemte data//////////////////////////////////
function checkForSavedData() {
    const savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');

    // Get the saved data indicator element
    const savedDataIndicator = document.getElementById('savedDataIndicator');

    if (savedSelections.length > 0) {
        // Show the indicator if saved data exists
        savedDataIndicator.style.display = 'block';
    } else {
        // Hide the indicator if no saved data exists
        savedDataIndicator.style.display = 'none';
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////load data/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function loadSavedData() {
    // Retrieve saved selections from localStorage
    const savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');

    if (savedSelections.length === 0) {
        console.log("No saved data to load.");
        return;
    }

    // Loop through saved selections and pre-fill the fields
    savedSelections.forEach(selection => {
        // Find the input element based on group name and label text
        const inputElement = document.querySelector(`input[name="${selection.group}"][value="${selection.label}"]`);
        if (inputElement) {
            inputElement.checked = true; // Pre-fill the selection
        }
    });

    console.log("Saved data has been loaded and fields are pre-filled.");
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Mere & Mindre Funktion/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function createItemElement(item, groupName, inputType) {
    const itemClass = item.DisplayType === 'udvidet' ? 'udvidet-item' : 'simple-item';
    const itemElement = document.createElement('label');
    itemElement.className = `custom${inputType === 'checkbox' ? 'Checkbox' : 'RadioButton'}Wrapper customTooltip ${itemClass}`;
    itemElement.style.display = itemClass === 'udvidet-item' ? 'none' : 'block';
    itemElement.innerHTML = `
        <input class="custom${inputType === 'checkbox' ? 'Checkbox' : 'RadioButton'}Input" type="${inputType}" name="${groupName}" value="${item.LabelText}">
        <div class="custom${inputType === 'checkbox' ? 'Checkbox' : 'RadioButton'}">${item.LabelText}</div>
        <span class="tooltipText">
            <div>${item.SKScode}</div>
        </span>`;
    return itemElement;
}

function toggleUdvidet(groupIndex) {
    const groupBox = document.querySelectorAll('.group-box')[groupIndex];
    const udvidetItems = groupBox.querySelectorAll('.udvidet-item');
    const toggleButton = groupBox.querySelector('.toggle-udvidet');

    // Toggle visibility of the "udvidet" items
    const isExpanded = Array.from(udvidetItems).some(item => item.style.display === 'block');
    udvidetItems.forEach(item => {
        item.style.display = isExpanded ? 'none' : 'block';
    });

    // Update the button text based on the current state
    toggleButton.textContent = isExpanded ? 'Mere' : 'Mindre';
}

function showGroupInfo(groupIndex) {
    if (!options || !options.Groups || !options.Groups[groupIndex]) {
        console.error(`Group data not found for index: ${groupIndex}`);
        return;
    }

    const group = options.Groups[groupIndex];
    const modalBody = document.getElementById('groupInfoModalBody');
    if (!modalBody) {
        console.error("Modal body element not found.");
        return;
    }

    let content = `<h5>${group.GroupHeading}</h5>`;
    if (group.Description) content += `<p>${group.Description}</p>`;
    if (group.SeeAlso) {
        content += `
            <p>
                <strong>See Also:</strong>
                <a href="${group.SeeAlso.URL}" target="_blank">${group.SeeAlso.LinkText}</a>
            </p>`;
    }
    content += '<ul>';
    group.Items.forEach(item => {
        content += `<li><strong>${item.LabelText}:</strong> ${item.Vejledning || "No details available."}</li>`;
    });
    content += '</ul>';
    modalBody.innerHTML = content;
    $('#groupInfoModal').modal('show');
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Ryd Valg////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function clearSelections() {
    // Clear radio and checkbox selections
    const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    inputs.forEach(input => (input.checked = false));

    // Clear saved data from localStorage
    localStorage.removeItem('savedSelections');

    // Clear all save icons from the navigation
    const icons = document.querySelectorAll('.save-icon');
    icons.forEach(icon => icon.remove());
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Ekstra Valg////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Open Modal for Additional Selections
function openSelectModal() {
    const pageId = document.body.getAttribute('data-page-id'); // Get pageId dynamically
    if (!pageId) {
        console.error("Page ID is not defined in the <body> tag.");
        alert("Unable to determine page context. Please contact support.");
        return;
    }

    const dataFilePath = `data/${pageId}_data_secondary.json?_=${new Date().getTime()}`; // Cache busting
    console.log(`Fetching additional selections for Page ID: ${pageId} from ${dataFilePath}`);

    fetch(dataFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.statusText} (Status: ${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Data successfully fetched for Page ID: ${pageId}`);
            populateSelectModal(data);
            $('#selectModal').modal('show');
        })
        .catch(error => {
            console.error(`Error fetching secondary data for Page ID: ${pageId}`, error);
            alert("Unable to load additional selections. Please try again later.");
        });
}


function populateSelectModal(data) {
    const modalBody = document.getElementById('selectModalBody');
    modalBody.innerHTML = ''; // Clear previous content

    if (!data || !data.Groups || !Array.isArray(data.Groups)) {
        console.error("Invalid secondary data structure:", data);
        modalBody.innerHTML = "<p>No additional options available.</p>";
        return;
    }

    data.Groups.forEach(group => {
        group.Items.forEach((item, index) => {
            const option = document.createElement('div');
            option.className = 'form-check';
            option.innerHTML = `
                <input class="form-check-input" type="checkbox" id="option${index}" value="${item.LabelText}">
                <label class="form-check-label" for="option${index}">
                    ${item.LabelText}
                </label>`;
            modalBody.appendChild(option);
        });
    });
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Markering af sider med gemte data///////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function markPagesWithSavedData() {
    // Retrieve saved selections from localStorage
    const savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');

    if (savedSelections.length === 0) return; // Exit if no saved data exists

    // Create a set of unique page IDs from the saved selections
    const pagesWithSavedData = new Set(savedSelections.map(selection => selection.pageId));

    // Iterate over navigation items and mark pages with saved data
    const navigationItems = document.querySelectorAll('.navigation [data-page-id]');
    navigationItems.forEach(item => {
        const pageId = item.getAttribute('data-page-id');

        // Check if the page has saved data
        if (pagesWithSavedData.has(pageId)) {
            // Add an icon if it doesn't already exist
            if (!item.querySelector('.save-icon')) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-save save-icon'; // FontAwesome icon
                icon.style.color = 'green';
                icon.style.marginLeft = '8px';
                item.appendChild(icon);
            }
        } else {
            // Remove the icon if no saved data exists for this page
            const existingIcon = item.querySelector('.save-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
        }
    });
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Vis SKS////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function showSummary() {
    const summaryContent = document.getElementById('summaryContent');
    let content = '<table class="table table-striped"><thead><tr><th>Group</th><th>SKS-navn - SKS</th></tr></thead><tbody>';

    const selectedValues = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    const savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');

    const displayedSelections = new Set();

    // Display current selections
    selectedValues.forEach(selected => {
        const groupName = selected.getAttribute('name');
        const labelText = selected.value;

        if (!displayedSelections.has(`${groupName}-${labelText}`)) {
            const groupData = options.Groups.find(group => group.GroupHeading === groupName);
            if (groupData) {
                const itemData = groupData.Items.find(item => item.LabelText === labelText);
                if (itemData) {
                    const SKSnavn = itemData.SKScode || "Unknown";
                    const SKS = itemData.LabelText;
                    content += `<tr><td>${SKS}</td><td>${SKSnavn}</td></tr>`;
                    displayedSelections.add(`${groupName}-${labelText}`);
                }
            }
        }
    });

    // Display saved selections (if not already displayed)
    savedSelections.forEach(selection => {
        if (!displayedSelections.has(`${selection.group}-${selection.label}`)) {
            content += `<tr><td>${selection.label}</td><td>${selection.SKSnavn}</td></tr>`;
            displayedSelections.add(`${selection.group}-${selection.label}`);
        }
    });

    content += '</tbody></table>';
    summaryContent.innerHTML = content;
    $('#summaryModal').modal('show');
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////Vejledning//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Show Vejledning Modal
function showVejledning() {
    const currentPage = window.location.pathname.split('/').pop();
    const modalContentFile = `/vejledninger/${currentPage.replace('.html', '')}_vejledning.html`;

    fetch(modalContentFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Vejledning fetch failed with status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('vejledningModalContent').innerHTML = data;
            $('#vejledningModal').modal('show');
        })
        .catch(error => {
            console.error('Error fetching vejledning content:', error);
            alert("Could not load the vejledning. Please try again later.");
        });
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////CPR FUNKTION///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////CPR FUNKTION///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////CPR FUNKTION///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////CPR FUNKTION///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////CPR FUNKTION///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////CPR FUNKTION///////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var printWindow; // Declare printWindow variable in the global scope

// Function to build the summary table
function buildSummaryTable(cprInput) {
    var summaryContent = '<table class="table table-striped"><thead><tr><th>Group</th><th>SKS-navn</th><th>SKS</th></tr></thead><tbody>';

    var selectedValues = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    selectedValues.forEach(selected => {
        var group = selected.getAttribute('name');
        var labelText = selected.getAttribute('value');
        var groupData = options.Groups.find(e => e.GroupHeading === group);
        var itemData = groupData.Items.find(item => item.LabelText === labelText);
        var SKSnavn = itemData.SKSnavn;
        var SKS = itemData.SKScode;
        summaryContent += `<tr><td>${group}</td><td>${SKSnavn}</td><td>${SKS}</td></tr>`;
    });

    summaryContent += '</tbody></table>';

    // Append CPR to the summary content
    var summaryWithCPR = `<h3>CPR: ${cprInput}</h3>${summaryContent}`;

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
    var cprInput = `${cprInputFirst.value}-${cprInputSecond.value}`;

    // Validate the CPR number format
    if (/^\d{6}-\d{4}$/.test(cprInput)) {
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

