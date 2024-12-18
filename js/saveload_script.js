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
    const savedDataIndicator = document.getElementById('savedDataIndicator');

    if (!savedDataIndicator) {
        console.warn("Element with ID 'savedDataIndicator' not found.");
        return;
    }

    if (savedSelections.length > 0) {
        savedDataIndicator.style.display = 'block';
    } else {
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