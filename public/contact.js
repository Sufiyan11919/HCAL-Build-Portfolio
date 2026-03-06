async function handleFormSubmit(event) {
  event.preventDefault();  

  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value
  };


  const response = await fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });


  const data = await response.json();


  document.getElementById('response-message').textContent = data.confirmation;


  console.log(data);
}


document.getElementById('contact-form').addEventListener('submit', handleFormSubmit);
