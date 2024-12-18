/**
 * Object to store VPH data keyed by item label.
 */
let vphData = {};

document.addEventListener('DOMContentLoaded', () => {
    const vphModal = document.getElementById('vphModal');
    const vphInput = document.getElementById('vphInput');
    const saveVphButton = document.getElementById('saveVphButton');

    if (vphModal && vphInput && saveVphButton) {
        saveVphButton.addEventListener('click', () => {
            const vphCode = vphInput.value.trim();
            
            // Validate VPH code (must be 4 digits)
            if (!/^\d{4}$/.test(vphCode)) {
                console.error("Invalid VPH code. Must be 4 digits.");
                return;
            }

            // Save VPH code logic
            console.log(`VPH Code saved: ${vphCode}`);
            $('#vphModal').modal('hide');
        });

        $('#vphModal').on('show.bs.modal', () => {
            vphInput.value = ''; // Reset the input value when the modal is shown
        });
    } else {
        console.warn("VPH Modal components not found in the DOM.");
    }
});

/**
 * Attaches click handlers to items with "VPH": true.
 */
function addVphCodeHandler() {
    // Attach handler to each "VPH": true item
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        const groupName = input.name;
        const labelText = input.value;
        const group = options.Groups.find(g => g.GroupHeading === groupName);
        const item = group?.Items.find(i => i.LabelText === labelText);

        if (item?.VPH) {
            input.addEventListener('change', () => {
                if (input.checked) {
                    openVphModal(labelText, item.SKScode);
                }
            });
        }
    });
}

/**
 * Opens the VPH modal and binds the input to the selected item.
 * @param {string} labelText - The label of the selected item.
 * @param {string} sksCode - The SKScode of the selected item.
 */
function openVphModal(labelText, sksCode) {
    const vphInput = document.getElementById('vphInput');
    const vphError = document.getElementById('vphError');

    // Pre-fill modal input
    vphInput.value = vphData[labelText] || '';
    vphInput.dataset.labelText = labelText;
    vphInput.dataset.sksCode = sksCode;

    // Show modal
    $('#vphModal').modal('show');

    // Reset error state
    vphError.style.display = 'none';

    // Save button handler
    document.getElementById('saveVphButton').onclick = () => {
        const vphCode = vphInput.value.trim();

        // Validate input
        if (!/^\d{4}$/.test(vphCode)) {
            vphError.style.display = 'block';
            return;
        }

        // Save VPH code and update UI
        vphData[labelText] = vphCode;
        saveVphData(); // Persist updated VPH data to localStorage

        const labelElement = document.querySelector(`label[data-label-text="${labelText}"]`);
        if (labelElement) {
            labelElement.innerHTML = `${sksCode} + VPH${vphCode}`;
        }

        // Close modal
        $('#vphModal').modal('hide');
    };
}

/**
 * Saves VPH data to localStorage.
 */
function saveVphData() {
    localStorage.setItem('vphData', JSON.stringify(vphData));
}

/**
 * Loads VPH data from localStorage.
 */
function loadVphData() {
    vphData = JSON.parse(localStorage.getItem('vphData') || '{}');
}

// Load VPH data on

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//Modal functionallity
/////////////////////////////
function openVphModal(labelText, sksCode) {
    const vphInput = document.getElementById('vphInput');
    const vphError = document.getElementById('vphError');
    const saveButton = document.getElementById('saveVphButton');
    const modalTitle = document.getElementById('vphModalLabel');

    // Retrieve the VPHtext for the item from the JSON data
    const group = options.Groups.find(group => group.Items.some(item => item.LabelText === labelText));
    const item = group?.Items.find(item => item.LabelText === labelText);

    // Update the modal title with the VPHtext
    if (item?.VPHtext) {
        modalTitle.textContent = item.VPHtext;
    } else {
        modalTitle.textContent = "Enter VPH Code"; // Default if VPHtext is not found
    }

    // Pre-fill modal input
    vphInput.value = vphData[labelText] || '';
    vphInput.dataset.labelText = labelText;
    vphInput.dataset.sksCode = sksCode;

    // Show modal
    $('#vphModal').modal('show');

    // Reset error state
    vphError.style.display = 'none';

    // Focus on the input field when the modal is shown
    $('#vphModal').on('shown.bs.modal', () => {
        vphInput.focus();
    });

    // Move focus to save button when 4 digits are entered
    vphInput.addEventListener('input', () => {
        if (vphInput.value.trim().length === 4) {
            saveButton.focus();
        }
    });

    // Save button handler
    saveButton.onclick = () => {
        const vphCode = vphInput.value.trim();

        // Validate input
        if (!/^\d{4}$/.test(vphCode)) {
            vphError.style.display = 'block';
            return;
        }

        // Save VPH code and update UI
        vphData[labelText] = vphCode;
        saveVphData(); // Persist updated VPH data to localStorage

        const labelElement = document.querySelector(`label[data-label-text="${labelText}"]`);
        if (labelElement) {
            labelElement.innerHTML = `${sksCode} + VPH${vphCode}`;
        }

        // Close modal
        $('#vphModal').modal('hide');
    };
}

