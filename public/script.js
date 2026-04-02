const skills = ['HTML', 'CSS', 'JavaScript'];

function greetUser(name) {
  const greeting = document.getElementById('greeting');
  if (greeting) {
    greeting.textContent = `Hello, ${name}!`;
  }
}

function checkAge(age) {
  const ageCheck = document.getElementById('age-check');
  if (!ageCheck) {
    return;
  }

  if (age < 5) {
    ageCheck.textContent = "You're too young to take this quiz.";
  } else {
    ageCheck.textContent = 'Welcome to the quiz!';
  }
}

function displaySkills() {
  const skillsList = document.getElementById('skills-list');
  if (skillsList) {
    skillsList.textContent = `Skills: ${skills.join(', ')}`;
  }
}

function startQuiz() {
  const userName = document.getElementById('username')?.value || '';
  const userAge = document.getElementById('age')?.value || '';

  greetUser(userName);
  checkAge(userAge);
  displaySkills();
}

function logEvent(type, element) {
  fetch('/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: type,
      elementName: element,
      timestamp: new Date().toString(),
    }),
  }).catch(error => console.error('Failed to log event:', error));
}

function formatScore(score) {
  return Number.isFinite(score) ? score.toFixed(4) : '0.0000';
}

function prettifyStatus(status) {
  return status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : 'Unknown';
}

function createEmptyState(message) {
  const paragraph = document.createElement('p');
  paragraph.className = 'muted';
  paragraph.textContent = message;
  return paragraph;
}

function renderDocuments(documents = []) {
  const documentList = document.getElementById('document-list');
  if (!documentList) {
    return;
  }

  documentList.innerHTML = '';

  if (!documents.length) {
    documentList.appendChild(createEmptyState('No uploaded documents yet.'));
    return;
  }

  documents.forEach(documentItem => {
    const wrapper = document.createElement('div');
    wrapper.className = 'document-item';

    const header = document.createElement('div');
    header.className = 'document-item-header';

    const name = document.createElement('strong');
    name.textContent = documentItem.filename;

    const badge = document.createElement('span');
    badge.className = `status-badge ${documentItem.processingStatus || 'processing'}`;
    badge.textContent = prettifyStatus(documentItem.processingStatus);

    header.appendChild(name);
    header.appendChild(badge);

    const details = document.createElement('p');
    details.className = 'muted small-text';
    details.textContent = documentItem.processedAt
      ? `Processed: ${new Date(documentItem.processedAt).toLocaleString()}`
      : 'Processing timestamp not available yet.';

    wrapper.appendChild(header);
    wrapper.appendChild(details);
    documentList.appendChild(wrapper);
  });
}

function renderEvidence(retrievedDocuments = []) {
  const evidenceList = document.getElementById('evidence-list');
  if (!evidenceList) {
    return;
  }

  evidenceList.innerHTML = '';

  if (!retrievedDocuments.length) {
    evidenceList.appendChild(createEmptyState('No evidence was retrieved for this prompt.'));
    return;
  }

  retrievedDocuments.forEach(documentItem => {
    const wrapper = document.createElement('article');
    wrapper.className = 'evidence-item';

    const title = document.createElement('h4');
    title.textContent = `${documentItem.docName} • Chunk ${documentItem.chunkIndex}`;

    const score = document.createElement('p');
    score.className = 'muted small-text';
    score.textContent = `Relevance score: ${formatScore(documentItem.relevanceScore)}`;

    const chunkText = document.createElement('p');
    chunkText.textContent = documentItem.chunkText;

    wrapper.appendChild(title);
    wrapper.appendChild(score);
    wrapper.appendChild(chunkText);
    evidenceList.appendChild(wrapper);
  });
}

function renderConfidenceMetrics(metrics) {
  const metricsContainer = document.getElementById('confidence-metrics');
  if (!metricsContainer) {
    return;
  }

  metricsContainer.innerHTML = '';

  if (!metrics) {
    metricsContainer.appendChild(createEmptyState('Confidence metrics will appear after a prompt is submitted.'));
    return;
  }

  const metricEntries = [
    ['Overall Confidence', metrics.overallConfidence],
    ['Retrieval Confidence', metrics.retrievalConfidence],
    ['Response Confidence', metrics.responseConfidence],
    ['Retrieval Method', metrics.retrievalMethod || 'N/A'],
  ];

  metricEntries.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'metric-card';

    const metricLabel = document.createElement('span');
    metricLabel.className = 'metric-label';
    metricLabel.textContent = label;

    const metricValue = document.createElement('strong');
    metricValue.className = 'metric-value';
    metricValue.textContent = typeof value === 'number' ? formatScore(value) : value;

    card.appendChild(metricLabel);
    card.appendChild(metricValue);
    metricsContainer.appendChild(card);
  });
}

async function loadDocuments() {
  const documentList = document.getElementById('document-list');
  if (!documentList) {
    return;
  }

  try {
    const response = await fetch('/documents');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load documents.');
    }

    renderDocuments(data.documents || []);
  } catch (error) {
    documentList.innerHTML = '';
    documentList.appendChild(createEmptyState(error.message));
  }
}

const startQuizBtn = document.getElementById('start-quiz');
if (startQuizBtn) {
  startQuizBtn.addEventListener('click', startQuiz);
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

const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', async event => {
    event.preventDefault();

    const fileInput = document.getElementById('document-file');
    const uploadStatus = document.getElementById('upload-status');
    const selectedFile = fileInput?.files?.[0];

    if (!selectedFile) {
      uploadStatus.textContent = 'Select a PDF, TXT, or MD file to upload.';
      uploadStatus.classList.add('error-text');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);

    uploadStatus.textContent = 'Uploading and processing document...';
    uploadStatus.classList.remove('error-text');

    try {
      const response = await fetch('/upload-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      uploadStatus.textContent = `${data.document.filename} uploaded successfully.`;
      fileInput.value = '';
      await loadDocuments();
    } catch (error) {
      uploadStatus.textContent = error.message;
      uploadStatus.classList.add('error-text');
    }
  });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();

    const promptInput = document.getElementById('message');
    const responseDiv = document.getElementById('response');
    const retrievalMethod = document.getElementById('retrieval-method')?.value || 'semantic';
    const input = promptInput?.value?.trim() || '';

    if (!input) {
      responseDiv.textContent = 'Enter a prompt before submitting.';
      renderEvidence([]);
      renderConfidenceMetrics(null);
      return;
    }

    responseDiv.textContent = 'Waiting for a response...';

    try {
      const response = await fetch('/submit-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          retrievalMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }

      responseDiv.textContent = data.botResponse || 'No response returned.';
      renderEvidence(data.retrievedDocuments || []);
      renderConfidenceMetrics(data.confidenceMetrics || null);
    } catch (error) {
      console.error(error);
      responseDiv.textContent = error.message || 'An error occurred. Please try again.';
      renderEvidence([]);
      renderConfidenceMetrics(null);
    }
  });
}

if (document.getElementById('document-list')) {
  loadDocuments();
}
