// ── Quiz functionality (index.html) ──────────────────────────────────────────
const skills = ["HTML", "CSS", "JavaScript"];

function greetUser(name) {
  console.log(`Hello, ${name}!`);
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) greetingEl.textContent = `Hello, ${name}!`;
}

function checkAge(age) {
  const ageCheckEl = document.getElementById("age-check");
  if (age < 5) {
    console.log("You're too young to take this quiz.");
    if (ageCheckEl) ageCheckEl.textContent = "You're too young to take this quiz.";
  } else {
    console.log("Welcome to the quiz!");
    if (ageCheckEl) ageCheckEl.textContent = "Welcome to the quiz!";
  }
}

function displaySkills() {
  const skillsListEl = document.getElementById("skills-list");
  if (skillsListEl) skillsListEl.textContent = "Skills: " + skills.join(", ");
}

function startQuiz() {
  const userName = document.getElementById("username")?.value;
  const userAge = document.getElementById("age")?.value;

  console.log("Name:", userName);
  console.log("Age:", userAge);

  greetUser(userName);
  checkAge(userAge);
  displaySkills();
}

const startQuizBtn = document.getElementById("start-quiz");
if (startQuizBtn) {
  startQuizBtn.addEventListener("click", startQuiz);
}

// Event logs
function logEvent(type, element) {
  fetch('/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: type,
      elementName: element,
      timestamp: new Date().toString()
    })
  }).catch(err => console.error('Failed to log event:', err));
}

const submitBtn = document.getElementById('submit-btn');
const messageInput = document.getElementById('message');

if (submitBtn) {
  submitBtn.addEventListener('click', () => logEvent('click', 'submit-button'));
}
if (messageInput) {
  messageInput.addEventListener('mouseover', () => logEvent('hover', 'message-input'));
  messageInput.addEventListener('focus', () => logEvent('focus', 'message-input'));
}

// chatbot
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const message = document.getElementById("message").value;
    const responseDiv = document.getElementById("response");

    responseDiv.textContent = "waiting the response";

    try {
      const res = await fetch("/submit-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (data.botResponse) {
        responseDiv.textContent = data.botResponse;
      } else {
        responseDiv.textContent = "Error: " + (data.error || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      responseDiv.textContent = "An error occurred. Please try again.";
    }
  });
}

// document upload
const uploadBtn = document.getElementById("upload-btn");

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("document-upload");
    const file = fileInput.files[0];

    if (!file) {
      alert("Choose a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await fetch("/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        alert(data.error || "Failed to upload document.");
        return;
      }

      fileInput.value = "";
      await loadDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading the document.");
    }
  });
}

async function loadDocuments() {
  const documentsList = document.getElementById("documents-list");
  if (!documentsList) return;

  try {
    const response = await fetch("/documents");
    const docs = await response.json();

    documentsList.innerHTML = "";

    docs.forEach((doc) => {
      const li = document.createElement("li");
      li.textContent = `${doc.filename} - ${doc.processingStatus}`;
      documentsList.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to load documents:", error);
    documentsList.innerHTML = "<li>Failed to load documents.</li>";
  }
}

loadDocuments();
