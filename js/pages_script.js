var options; // Declare options globally to make it accessible across functions


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
    if (!groupBox) {
        console.error(`Group box not found for index: ${groupIndex}`);
        return;
    }
    const udvidetItems = groupBox.querySelectorAll('.udvidet-item');
    udvidetItems.forEach(item => {
        item.style.display = item.style.display === 'none' || item.style.display === '' ? 'block' : 'none';
    });
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

// Clear Selections
function clearSelections() {
    const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    inputs.forEach(input => (input.checked = false));    
}

//
//function displayCurrentPageId() {
//    const pageId = document.body.getAttribute("data-page-id");
//    if (!pageId) {
//        console.error("Page ID is missing.");
//        return;
//    }
//    const pageIdElement = document.getElementById("pageIdDisplay") || document.createElement("div");
//    pageIdElement.id = "pageIdDisplay";
//    pageIdElement.innerText = `Current Page ID: ${pageId}`;
//    document.body.appendChild(pageIdElement);
//}
//document.addEventListener("DOMContentLoaded", displayCurrentPageId);

//document.addEventListener("DOMContentLoaded", () => {
//    const pageId = document.body.getAttribute("data-page-id");
//    if (!pageId) {
//        console.error("data-page-id is missing in the <body> tag.");
//        alert("Page ID is missing. Please contact the administrator.");
//        return;
//    }
//
//    console.log(`Page ID detected on load: ${pageId}`); // Debug Page ID
//});



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

function showSummary() {
    const summaryContent = document.getElementById('summaryContent');
    let content = '<table class="table table-striped"><thead><tr><th>Group</th><th>SKS-navn - SKS</th></tr></thead><tbody>';

    const selectedValues = document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    if (selectedValues.length === 0) {
        alert("No selections have been made.");
        summaryContent.innerHTML = "<p>No selections available to display.</p>";
        return;
    }

    selectedValues.forEach(selected => {
        const groupName = selected.getAttribute('name'); // The name attribute links to the group heading
        const labelText = selected.value; // The selected value is the LabelText

        // Find the group and item data in options
        const groupData = options.Groups.find(group => group.GroupHeading === groupName);
        if (groupData) {
            const itemData = groupData.Items.find(item => item.LabelText === labelText);
            if (itemData) {
                const SKSnavn = itemData.SKScode || "Unknown"; // Use SKScode if available
                const SKS = itemData.LabelText; // Display the label text
                content += `<tr><td>${SKS}</td><td>${SKSnavn}</td></tr>`;
            }
        }
    });

    content += '</tbody></table>';
    summaryContent.innerHTML = content;
    $('#summaryModal').modal('show'); // Show the modal
}


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
        })
        .catch(error => {
            console.error(`Error fetching data from ${dataFilePath}:`, error);
            alert("Unable to load data. Please try again later.");
        });
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

var printWindow; // Declare printWindow variable in the global scope

// Function to open CPR modal and initiate printing
function printWithCPR() {
  // Open CPR modal
  $('#cprModal').modal('show');
}

// Function to clear the input fields and reset focus
function clearInputFields() {
  document.getElementById('cprInputFirst').value = '';
  document.getElementById('cprInputSecond').value = '';
  document.getElementById('cprInputFirst').classList.remove('is-invalid');
  document.getElementById('cprInputSecond').classList.remove('is-invalid');

  // Add focus back to the first input field
  document.getElementById('cprInputFirst').focus();
}

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
    summaryContent += '<tr><td>' + group + '</td><td>' + SKSnavn + '</td><td>' + SKS + '</td></tr>';
  });

  summaryContent += '</tbody></table>';

  // Append CPR to the summary content
  var summaryWithCPR = '<h3>CPR: ' + cprInput + '</h3>' + summaryContent;

  return summaryWithCPR; // Return the generated HTML table string with CPR
}

// Event listener for the submit button in the CPR modal
document.getElementById('cprSubmit').addEventListener('click', function () {
  // Get the input values for the CPR number
  var cprFirstPart = document.getElementById('cprInputFirst').value;
  var cprSecondPart = document.getElementById('cprInputSecond').value;
  var cprInput = cprFirstPart + '-' + cprSecondPart;

  // Validate the CPR number format
  if (/^\d{6}-\d{4}$/.test(cprInput) || cprInput === '--' || cprInput === '-') {
      // Hide the CPR modal
      $('#cprModal').modal('hide');
      // Call the print summary function with the CPR input
      printSummaryToA4(cprInput);
      // Clear input fields after successful submission
      clearInputFields();
  } else {
      // Add 'is-invalid' class to inputs if validation fails
      document.getElementById('cprInputFirst').classList.add('is-invalid');
      document.getElementById('cprInputSecond').classList.add('is-invalid');
  }
});

// Event listener for the "Clear All" button
document.getElementById('clearAll').addEventListener('click', function () {
    clearInputFields();
});

// Event listener for the modal dismissal
$('#cprModal').on('hidden.bs.modal', function () {
    // Ensure the printWindow variable is defined
    if (typeof printWindow !== 'undefined' && printWindow) {
        // Close the print window if the modal is canceled
        printWindow.close();
    }
    // Clear the input fields when the modal is closed
    clearInputFields();
});

// Event listener for when the modal is shown
$('#cprModal').on('shown.bs.modal', function () {
    // Clear input fields when the modal is opened
    clearInputFields();
    // Focus on the first CPR input field
    document.getElementById('cprInputFirst').focus();
});

// Automatically move the cursor to the second input field when the first is filled
document.getElementById('cprInputFirst').addEventListener('input', function () {
  if (this.value.length === 6 || this.value.length === 0) {
      document.getElementById('cprInputSecond').focus();
  }
});

// Automatically move the cursor to the submit button when the second input field is filled
document.getElementById('cprInputSecond').addEventListener('input', function () {
  if ((this.value.length === 4 || this.value.length === 0) && (document.getElementById('cprInputFirst').value.length === 6 || document.getElementById('cprInputFirst').value.length === 0)) {
      document.getElementById('cprSubmit').focus();
  }
});
