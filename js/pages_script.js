var options; // Declare options globally to make it accessible across functions

document.addEventListener("DOMContentLoaded", async () => {
    // Fetch the page ID dynamically from the <body> attribute
    const currentPageId = document.body.getAttribute("data-page-id");
    if (!currentPageId) {
        console.error("data-page-id is missing in the <body> tag.");
        alert("Page ID is missing. Please contact the administrator.");
        return; // Stop execution if the page ID is not available
    }

    const dataFilePath = `data/${currentPageId}_data.json`;

    try {
        // Fetch navigation content and handle it gracefully
        const navResponse = await fetch('navigation.html');
        if (!navResponse.ok) {
            throw new Error(`Navigation fetch failed with status: ${navResponse.status}`);
        }
        const navData = await navResponse.text();
        document.querySelector('.navigation-container').innerHTML = navData;

        // After loading navigation, mark pages with saved data
        markPagesWithSavedData();
    } catch (error) {
        console.error('Error fetching navigation:', error);
        alert("Failed to load navigation. Please try again later.");
    }

    try {
        // Fetch page-specific data
        const dataResponse = await fetch(dataFilePath);
        if (!dataResponse.ok) {
            throw new Error(`Data fetch failed with status: ${dataResponse.status}`);
        }
        const pageData = await dataResponse.json();

        console.log("Data loaded successfully:", pageData);
        options = pageData;

        // Render dynamic content and attach event handlers
        generateDataEntry(pageData);
        addVphCodeHandler(); // Add VPH handlers
        loadSavedData(); // Load any previously saved data
        enableRadioUndo(); // Allow undo functionality for radio buttons
    } catch (error) {
        console.error(`Error fetching data from ${dataFilePath}:`, error);
        alert("Unable to load data. Please try again later.");
    }

    // Check for saved data on the current page
    checkForSavedData();
});

// Suggestion: Use a named function for "Add Selected Value" logic for better readability and reuse
function handleAddSelectedValue() {
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

    generateDataEntry(options); // Re-generate the data entry section
    $('#selectModal').modal('hide'); // Hide the modal
}

// Attach "Add Selected Value" handler with error prevention
const addSelectedValueButton = document.getElementById('addSelectedValue');
if (addSelectedValueButton) {
    addSelectedValueButton.addEventListener('click', handleAddSelectedValue);
} else {
    console.warn("#addSelectedValue button not found in the DOM.");
}

// Suggestion: Add a named function for "Save Data" logic for better readability
function handleSaveData() {
    saveData(); // Call the saveData function directly
}

// Attach "Save Data" handler with error prevention
const saveDataButton = document.getElementById('saveDataButton');
if (saveDataButton) {
    saveDataButton.addEventListener('click', handleSaveData);
} else {
    console.warn("#saveDataButton not found in the DOM.");
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function to add "undo" functionality to radio buttons
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function enableRadioUndo() {
    let lastCheckedRadio = null;

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('click', function () {
            // If the same radio is clicked again, deselect it
            if (lastCheckedRadio === this) {
                this.checked = false; // Deselect
                lastCheckedRadio = null; // Reset last checked radio
            } else {
                // Update the last checked radio
                lastCheckedRadio = this;
            }
        });
    });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Hent data til siden/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function generateDataEntry(data) {
    const dataEntryDiv = document.getElementById('dataEntry');
    
    if (!dataEntryDiv) {
        console.error("Element with ID 'dataEntry' not found in the DOM.");
        return;
    }

    dataEntryDiv.innerHTML = ''; // Clear current content to refresh

    if (!data || !data.Groups || !Array.isArray(data.Groups)) {
        console.error("Invalid data structure:", data);
        dataEntryDiv.innerHTML = "<p>Data could not be loaded. Please contact support.</p>";
        return;
    }

    // Iterate through each group in the data
    data.Groups.forEach((group, groupIndex) => {
        const inputType = group.AllowsMultipleSelections ? 'checkbox' : 'radio';

        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-box');
        groupDiv.setAttribute('data-group-index', groupIndex); // Add data attribute for debugging
        groupDiv.setAttribute('data-group-name', group.GroupHeading); // For better visibility and tracking

        const groupHeading = createGroupHeading(group, groupIndex);
        groupDiv.appendChild(groupHeading);

        const itemContainer = document.createElement('div');
        itemContainer.classList.add('item-container');

        group.Items.forEach((item, itemIndex) => {
            if (!item.Show) return;
            
            const itemElement = createItemElement(item, group.GroupHeading, inputType);
            itemElement.setAttribute('data-item-index', itemIndex); // Add data attribute for debugging
            itemElement.setAttribute('data-item-label', item.LabelText); // Track label
            itemElement.setAttribute('data-item-code', item.SKScode); // Track SKS code

            itemContainer.appendChild(itemElement);
        });

        groupDiv.appendChild(itemContainer);
        dataEntryDiv.appendChild(groupDiv);
    });

    // Attach event listeners and initialize visibility
    attachVisibilityHandlers(); // Attach handlers to new inputs
    updateGroupVisibility(); // Ensure visibility reflects initial data

    console.log("Data entry successfully generated.", { groupsRendered: data.Groups.length });
}



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

function createGroupHeading(group, groupIndex) {
    const groupHeading = document.createElement('div');
    groupHeading.classList.add('group-heading-container');

    // Check if the group has items with "udvidet" display type
    const hasUdvidetItems = Array.isArray(group.Items) && group.Items.some(item => item.DisplayType === 'udvidet');

    let buttonHTML = '';
    if (hasUdvidetItems) {
        buttonHTML = `<button class="btn btn-outline-primary btn-sm toggle-udvidet" data-group-index="${groupIndex}" onclick="toggleUdvidet(${groupIndex})">
                Mere
            </button>`;
    }

    groupHeading.innerHTML = `
        <label class="group-heading">
            ${group.GroupHeading}
            <button class="info-button btn btn-link" data-group-index="${groupIndex}" onclick="showGroupInfo(${groupIndex})">
                <i class="fas fa-question-circle"></i>
            </button>
            ${buttonHTML}
        </label>`;

    return groupHeading;
}
///////////////////////////////////////////
// Function to update visibility of groups based on selected SKScode
function updateGroupVisibility() {
    if (!options || !options.Groups) {
        console.error("Options or Groups not defined.");
        return;
    }

    const selectedSKScodes = new Set();

    // Collect all selected SKScodes
    document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(selected => {
        const groupName = selected.getAttribute('name');
        const labelText = selected.value;

        const groupData = options.Groups.find(group => group.GroupHeading === groupName);
        if (groupData) {
            const itemData = groupData.Items.find(item => item.LabelText === labelText);
            if (itemData) {
                selectedSKScodes.add(itemData.SKScode);
            }
        }
    });

    console.log("Selected SKScodes:", Array.from(selectedSKScodes));

    // Iterate over groups and handle visibility
    options.Groups.forEach((group, groupIndex) => {
        const groupElement = document.querySelector(`.group-box[data-group-index="${groupIndex}"]`);

        if (!groupElement) {
            console.warn(`Group element for "${group.GroupHeading}" not found in the DOM.`);
            return;
        }

        if (group.showIf) {
            // Handle groups with showIf condition
            const { Condition, Value } = group.showIf;
            const shouldShow = selectedSKScodes.has(Condition) === Value;

            console.log(`Group: ${group.GroupHeading}, Condition: ${Condition}, Should Show: ${shouldShow}`);
            groupElement.style.display = shouldShow ? 'block' : 'none';
        } else {
            // Always display groups without showIf
            groupElement.style.display = 'block';
        }
    });

    console.log("Group visibility updated.");
}



// Attach visibility update to all input changes dynamically after rendering
function attachVisibilityHandlers() {
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.removeEventListener('change', updateGroupVisibility); // Prevent duplicate handlers
        input.addEventListener('change', updateGroupVisibility);
    });
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////gem data/////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////load data/////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////Mere & Mindre Funktion/////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
///////////////////////////////////////////Ryd Valg////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Define a handler for "Clear All"
function handleClearAll() {
    clearSelections(); // Call the clearSelections function directly
}

// Attach "Clear All" handler after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const clearAllButton = document.getElementById('clearAllButton');
    if (clearAllButton) {
        clearAllButton.addEventListener('click', handleClearAll);
    } else {
        console.warn("#clearAllButton not found in the DOM.");
    }
});

function clearSelections() {
    // Clear radio and checkbox selections
    const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    inputs.forEach(input => (input.checked = false));

    // Clear saved data from localStorage
    localStorage.removeItem('savedSelections');

    // Clear all save icons from the navigation
    const icons = document.querySelectorAll('.save-icon');
    icons.forEach(icon => icon.remove());

    console.log("All selections and saved data have been cleared.");
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Ekstra Valg////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////Markering af sider med gemte data///////////////////////////////////////////////////////
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
///////////////////////////////////////////Vis SKS////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function showSummary() {
    const summaryContent = document.getElementById('summaryContent');
    let content = '<table class="table table-striped"><thead><tr><th>SKS-navn</th><th>SKS-kode & VPH</th></tr></thead><tbody>';

    const selectedValues = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    const savedSelections = JSON.parse(localStorage.getItem('savedSelections') || '[]');
    const vphData = JSON.parse(localStorage.getItem('vphData') || '{}'); // Load VPH data from storage

    const displayedSelections = new Set();

    // Log loaded VPH data
    console.log("Loaded VPH Data:", vphData);

    // Display current selections
    selectedValues.forEach(selected => {
        const groupName = selected.getAttribute('name');
        const labelText = selected.value;

        console.log("Processing selected item:", { groupName, labelText });

        if (!displayedSelections.has(`${groupName}-${labelText}`)) {
            const groupData = options.Groups.find(group => group.GroupHeading === groupName);
            if (groupData) {
                console.log("Found group data:", groupData);
                const itemData = groupData.Items.find(item => item.LabelText === labelText);
                if (itemData) {
                    console.log("Found item data:", itemData);
                    const SKScode = itemData.SKScode || "Unknown";
                    const SKSnavn = itemData.LabelText;

                    // Combine SKScode with VPH data if available
                    const sksAndVph = vphData[labelText] ? `${SKScode} + VPH${vphData[labelText]}` : SKScode;

                    content += `<tr><td>${SKSnavn}</td><td>${sksAndVph}</td></tr>`;
                    displayedSelections.add(`${groupName}-${labelText}`);
                } else {
                    console.warn("Item data not found for label:", labelText);
                }
            } else {
                console.warn("Group data not found for group name:", groupName);
            }
        }
    });

    // Display saved selections (if not already displayed)
    savedSelections.forEach(selection => {
        console.log("Processing saved selection:", selection);
        if (!displayedSelections.has(`${selection.group}-${selection.label}`)) {
            const sksAndVph = vphData[selection.label] ? `${selection.SKS} + VPH${vphData[selection.label]}` : selection.SKS;
            content += `<tr><td>${selection.SKSnavn}</td><td>${sksAndVph}</td></tr>`;
            displayedSelections.add(`${selection.group}-${selection.label}`);
        }
    });

    content += '</tbody></table>';
    summaryContent.innerHTML = content;
    $('#summaryModal').modal('show');

    // Log final summary content
    console.log("Final Summary Content:", content);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////Vejledning//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

