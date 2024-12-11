document.addEventListener('DOMContentLoaded', function() {
	// Initialize Quill editor
	var quill = new Quill('#editor-container', {
	  theme: 'snow',
	  modules: {
		toolbar: '#toolbar'
	  }
	});
  
	// Load previously saved content from data.html if it exists
	fetch('/data.html')
	  .then(response => {
		if (response.status === 200) {
		  return response.text();
		} else {
		  return ''; // no saved content
		}
	  })
	  .then(data => {
		// Insert HTML into the editor. We can use the built-in pasteHTML (deprecated in Quill 1.x) 
		// or we insert it using the clipboard module. For simplicity, we can set contents using innerHTML.
		const editor = document.querySelector('.ql-editor');
		editor.innerHTML = data;
	  });
  
	// Handle save button click
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
  