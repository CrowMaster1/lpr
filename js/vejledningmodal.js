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
