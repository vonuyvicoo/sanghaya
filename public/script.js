document.addEventListener('DOMContentLoaded', function() {
	// Initialize Quill editor
	var quill = new Quill('#editor-container', {
	  theme: 'snow',
	  modules: {
		toolbar: '#toolbar'
	  }
	});
  

	fetch('/data.html')
	  .then(response => {
		if (response.status === 200) {
		  return response.text();
		} else {
		  return ''; // no saved content
		}
	  })
	  .then(data => {

		const editor = document.querySelector('.ql-editor');
		editor.innerHTML = data;
	  });
  

	const saveButton = document.getElementById('save-button');
	saveButton.addEventListener('click', () => {
	  const htmlContent = document.querySelector('.ql-editor').innerHTML;
	  fetch('/save', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content: htmlContent })
	  })
	  .then(res => res.json())
	  .then(response => {
		if (response.status === 'success') {
		  alert('Content saved!');
		} else {
		  alert('Error saving content.');
		}
	  })
	  .catch(err => console.error(err));
	});
  });
  