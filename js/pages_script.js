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

        // Ensure savedDataIndicator exists in the DOM
        let savedDataIndicator = document.getElementById('savedDataIndicator');
        if (!savedDataIndicator) {
            savedDataIndicator = document.createElement('div');
            savedDataIndicator.id = 'savedDataIndicator';
            savedDataIndicator.style.display = 'none'; // Default state
            document.body.appendChild(savedDataIndicator);
        }

        // Mark pages with saved data
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

/**
 * Save Data Handler
 */
function handleSaveData() {
    saveData(); // Call the saveData function directly
}

/**
 * Attach Save Data Handler
 */
const saveDataButton = document.getElementById('saveDataButton');
if (saveDataButton) {
    saveDataButton.addEventListener('click', handleSaveData);
} else {
    console.warn("#saveDataButton not found in the DOM.");
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

    // Create the wrapper div for consistent spacing and structure
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `custom${inputType === 'checkbox' ? 'Checkbox' : 'RadioButton'}Wrapper customTooltip ${itemClass}`;
    wrapperDiv.style.display = itemClass === 'udvidet-item' ? 'none' : 'block';

    // Create the input element
    const inputElement = document.createElement('input');
    inputElement.className = `custom${inputType === 'checkbox' ? 'Checkbox' : 'RadioButton'}Input`;
    inputElement.type = inputType;
    inputElement.name = groupName;
    inputElement.id = `${groupName}-${item.LabelText.replace(/\s+/g, '-')}`; // Unique ID based on groupName and label text
    inputElement.value = item.LabelText;

    // Create the label element associated with the input
    const labelElement = document.createElement('label');
    labelElement.className = `custom${inputType === 'checkbox' ? 'Checkbox' : 'RadioButton'}`;
    labelElement.htmlFor = inputElement.id; // Link label to the input
    labelElement.textContent = item.LabelText;

    // Create the tooltip span
    const tooltipSpan = document.createElement('span');
    tooltipSpan.className = 'tooltipText';
    tooltipSpan.innerHTML = `<div>${item.SKScode}</div>`;

    // Assemble the elements in order
    wrapperDiv.appendChild(inputElement);
    wrapperDiv.appendChild(labelElement);
    wrapperDiv.appendChild(tooltipSpan);

    return wrapperDiv;
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
                <strong>Se mere:</strong>
                <a href="${group.SeeAlso.URL}" target="_blank">${group.SeeAlso.LinkText}</a>
            </p>`;
    }
    content += '<ul>';
    group.Items.forEach(item => {
        content += `<li><strong>${item.LabelText}:</strong> ${item.Vejledning || "--"}</li>`;
    });
    content += '</ul>';
    modalBody.innerHTML = content;
    $('#groupInfoModal').modal('show');
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




