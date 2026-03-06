// const http = require('http');
// const fs = require('fs');
// const path = require('path');
// // TODO: Assign the `http` module to a variable
// // This will allow us to create a server in Node.js

// // TODO: Assign the `fs` (File System) module to a variable
// // We will use this to read and serve our files (HTML, CSS, JS)

// // TODO: Assign the `path` module to a variable
// // This will help us build file paths in a way that works across operating systems

// // 2. Create the server
// const server = http.createServer((req, res) => {
//   // 3. Handle the incoming request (req) and generate a response (res)
  
//   // TODO: Use an if/else block to check the value of `req.url` and serve the correct file:
//   // - If `req.url` is `'/'` or `'/index.html'`, serve the HTML file
//   // - If `req.url` is `'/style.css'`, serve the CSS file
//   // - If `req.url` is `'/script.js'`, serve the JavaScript file
//   // - If the file is not found, return a 404 error

//   // Example: Serving the index.html file if the request URL is `/` or `/index.html`
//   if (req.url === '/' || req.url === '/index.html') {
//     fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
//       if (err) {
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Server Error');
//       } else {
//         res.writeHead(200, { 'Content-Type': 'text/html' });
//         res.end(data);
//       }
//     });
//   } else if (req.url === '/style.css') {
//     fs.readFile(path.join(__dirname, 'public', 'style.css'), (err, data) => {
//       if (err) {
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Server Error');
//       } else {
//         res.writeHead(200, { 'Content-Type': 'text/css' });
//         res.end(data);
//       }
//     });
//   } else if (req.url === '/script.js') {
//     fs.readFile(path.join(__dirname, 'public', 'script.js'), (err, data) => {
//       if (err) {
//         res.writeHead(500, { 'Content-Type': 'text/plain' });
//         res.end('Server Error');
//       } else {
//         res.writeHead(200, { 'Content-Type': 'application/javascript' });
//         res.end(data);
//       }
//     });
//   } else if (req.url.startsWith('/images/') && req.url.endsWith('.jpg')) {
//     // Extra Credit
//     fs.readFile(path.join(__dirname, 'public', req.url), (err, data) => {
//       if (err) {
//         res.writeHead(404, { 'Content-Type': 'text/plain' });
//         res.end('404 Not Found');
//       } else {
//         res.writeHead(200, { 'Content-Type': 'image/jpeg' });
//         res.end(data);
//       }
//     });
//   } else {
//   // TODO: If the URL does not match any known files, return a 404 response
//   // Send a 404 status code with a message like '404 Not Found'
//     res.writeHead(404, { 'Content-Type': 'text/plain' });
//     res.end('404 Not Found');
//   }
// });

//   // TODO: Add more checks to handle the CSS and JavaScript files similarly
//   // Follow the same pattern as above with serving the index.html file

 

// // 5. Define the port your server will listen on
// // TODO: Define the port to listen on 3000
// let PORT = 3000

// // 6. Start the server
// // Once the server is running, it will listen for requests on the defined port (3000)
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

bodyParser.urlencoded()

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});


app.post('/submit', (req, res) => {
// Destructuring: pull name/email OUT of req.body into variables
const { name, email } = req.body;
console.log(`Name: ${name}, Email: ${email}`);
console.log(req.body)
console.log('Form submission received:');
// Create a new object with a confirmation field and send it back as JSON
res.json({ confirmation: `Thank you, ${name}, for your submission!` });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});