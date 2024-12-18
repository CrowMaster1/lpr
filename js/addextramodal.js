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
            populateSelectModal(data); // Populate modal with fetched data
            $('#selectModal').modal('show'); // Show modal
        })
        .catch(error => {
            console.error(`Error fetching secondary data for Page ID: ${pageId}`, error);
            // Populate modal with "Ingen ekstra valg" message
            populateSelectModalWithError("Ingen ekstra valg på denne side");
            $('#selectModal').modal('show'); // Show modal
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

function populateSelectModalWithError(message) {
    const modalBody = document.getElementById('selectModalBody');
    if (!modalBody) {
        console.error("#selectModalBody not found in the DOM.");
        return;
    }

    modalBody.innerHTML = ''; // Clear previous content
    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorMessage.className = 'text-danger'; // Optional styling
    modalBody.appendChild(errorMessage);
}
