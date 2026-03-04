// Using const because the name will not change
// const userName = "Sufiyan";

// Using let because age could be updated 
// let userAge = 23;

// Using const because student status remain the same for this session
// const isStudent = true;


const skills = ["HTML", "CSS", "JavaScript"];

function greetUser(name) {
  console.log(`Hello, ${name}!`);
  document.getElementById("greeting").textContent = `Hello, ${name}!`;
}

function checkAge(age) {
  if (age < 5) {
    console.log("You're too young to take this quiz.");
    document.getElementById("age-check").textContent = "You're too young to take this quiz.";
  } else {
    console.log("Welcome to the quiz!");
    document.getElementById("age-check").textContent = "Welcome to the quiz!";
  }
}

function displaySkills() {
  document.getElementById("skills-list").textContent = "Skills: " + skills.join(", ");
}

function startQuiz() {
  const userName = document.getElementById("username").value;
  const userAge = document.getElementById("age").value;

  console.log("Name:", userName);
  console.log("Age:", userAge);

  greetUser(userName);
  checkAge(userAge);
  displaySkills();
}

document.getElementById("start-quiz").addEventListener("click", startQuiz);

  // greetUser(userName);
  // checkAge(userAge);
