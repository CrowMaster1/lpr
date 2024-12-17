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

