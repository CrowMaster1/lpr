/**
 * Object to store VPH data keyed by item label.
 */
let vphData = {};

/**
 * Initialize event listeners and modal setup on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const vphModal = document.getElementById('vphModal');
    const vphInput = document.getElementById('vphInput');
    const saveVphButton = document.getElementById('saveVphButton');

    if (vphModal && vphInput && saveVphButton) {
        // Reset modal input when shown
        $('#vphModal').on('show.bs.modal', () => {
            vphInput.value = '';
        });

        // Save button click handler
        saveVphButton.onclick = function () {
            var vphCode = vphInput.value.trim();

            // Validate VPH code (must be 4 digits)
            if (!/^\d{4}$/.test(vphCode)) {
                console.error("VPH kode. Skal være minimum 4 tal");
                document.getElementById('vphError').style.display = 'block';
                return;
            }

            // Save VPH code and update UI
            const labelText = vphInput.dataset.labelText;
            const sksCode = vphInput.dataset.sksCode;

            vphData[labelText] = vphCode;
            saveVphData();

            const labelElement = document.querySelector(`label[data-label-text="${labelText}"]`);
            if (labelElement) {
                labelElement.innerHTML = `${sksCode} + VPH${vphCode}`;
            }

            $('#vphModal').modal('hide');
        };
    } else {
        console.warn("VPH Modal components not found in the DOM.");
    }

    // Load saved VPH data
    loadVphData();
});

/**
 * Attaches click handlers to items with "VPH": true.
 */
function addVphCodeHandler() {
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
    const saveButton = document.getElementById('saveVphButton');
    const modalTitle = document.getElementById('vphModalLabel');

    // Retrieve the VPHtext for the item from the JSON data
    const group = options.Groups.find(group => group.Items.some(item => item.LabelText === labelText));
    const item = group?.Items.find(item => item.LabelText === labelText);

    modalTitle.textContent = item?.VPHtext || "Enter VPH Code";

    // Pre-fill modal input
    vphInput.value = vphData[labelText] || '0000';
    vphInput.dataset.labelText = labelText;
    vphInput.dataset.sksCode = sksCode;

    // Show modal
    $('#vphModal').modal('show');
    vphError.style.display = 'none';

    // Focus on the input field when the modal is shown
    $('#vphModal').on('shown.bs.modal', () => {
        vphInput.focus();
    });

    // Input behavior: Replace digits from the right
	vphInput.addEventListener('input', () => {
		// Remove non-numeric characters
		let inputVal = vphInput.value.replace(/\D/g, '');

    // Limit to 4 digits and pad from the left
		inputVal = inputVal.slice(-4); // Take the last 4 digits
		vphInput.value = inputVal.padStart(4, '0');
});

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
