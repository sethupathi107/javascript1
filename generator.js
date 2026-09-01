function* quiz() {
    const answer1 = yield "What is 2 + 2?";
    console.log("Your answer:", answer1);

    const answer2 = yield "What is 3 + 3?";
    console.log("Your answer:", answer2);
}

const q = quiz();

console.log(q.next().value);
console.log(q.next(4).value);
console.log(q.next(3));



async function* readLogs() {
    while (true) {
        const log = await getLog();
        yield log;
    }
}


async function getLog(){
    // const ans = fetch("something")
    return ans;
}

const req = readLogs();
console.log(req.next().value);
console.log(req.next().value);
console.log(req.next().value);
console.log(req.next().value);



// curring

function multiply(a) {
    return function(b) {
        return a * b;
    };
}

const two = multiply(2);
const three = multiply(3);

console.log(two(10));
console.log(two(50)); 
console.log(three(10)); 
console.log(three(50)); 


function multiply(a, b) {
    return a * b;
}


const double = multiply.bind(null, 2);
console.log(double(10));
console.log(double(50));
console.log(double(100)); 




alert(location.href); // shows current URL
if (confirm("Go to Wikipedia?")) {
    location.href = "https://wikipedia.org"; // redirect the browser to another URL
}

// SEARCHING DOM

const form = document.querySelector(".register");
const nameInput = document.querySelector("#name");

const emailInput = document.querySelector("#email");
const ageInput = document.querySelector("#age");

const message = document.querySelector("#message");

const users = document.querySelector("#users");


// INPUT EVENT

nameInput.addEventListener("input", function(event) {
    console.log("Name:", event.target.value);
});


emailInput.addEventListener("input", function(event) {

    console.log("Email:", event.target.value);
});


// KEYBOARD EVENT

nameInput.addEventListener("keydown", function(event) {

    console.log("Key pressed:", event.key);
    if (event.key === "Enter") {
        console.log("User pressed Enter");
    }
});


// FORM SUBMIT

form.addEventListener("submit", function(event) {

    // Stop browser's default form submission
    event.preventDefault();


    const name = nameInput.value.trim();

    const email = emailInput.value.trim();

    const age = ageInput.value;


    
    // VALIDATION
    if (name === "") {

        document.querySelector("#nameError")
            .textContent = "Name is required";

        return;
    }


    if (email === "") {

        document.querySelector("#emailError")
            .textContent = "Email is required";

        return;
    }


    // Clear errors
    document.querySelector("#nameError")
        .textContent = "";

    document.querySelector("#emailError")
        .textContent = "";

    // CREATE DOM ELEMENT
 
    const userDiv = document.createElement("div");
    // MODIFY CONTENT
 
    userDiv.textContent =
        `${name} - ${email} - ${age}`;

    // ADD CLASS
    userDiv.classList.add("user");

    // SET ATTRIBUTE
    userDiv.setAttribute("data-user", name);

    // ADD ELEMENT TO DOM
    users.append(userDiv);

    // STYLE MANIPULATION
    message.textContent = "Registration successful!";
    message.classList.add("success");

    // CUSTOM EVENT
    const registrationEvent =
        new CustomEvent("userRegistered", {
            detail: {
                name: name,
                email: email
            }
        });
    document.dispatchEvent(registrationEvent);


    // Clear form
    form.reset();
});


// CUSTOM EVENT LISTENER

document.addEventListener(
    "userRegistered",
    function(event) {

        console.log(
            "New user:",
            event.detail.name
        );

    }
);

// BUBBLING
form.addEventListener("click", function() {
    console.log("FORM clicked");
});


// CAPTURING

document.addEventListener(
    "click",
    function() {

        console.log("Document capturing");

    },
    true
);


// ELEMENT SIZE

console.log(
    "Form width:",
    form.offsetWidth
);

const add = a => b => a + b;

const add10 = add(10);

const numbers = [1, 2, 3, 4];

const result = numbers.map(add10);

console.log(result);

const filterByName = (list, name) => {
  return list.filter(item => item.name !== name);
}

console.log(filterByName(list, 'John'));
/*
[
  { id: 1, name: 'Steve', email: 'steve@example.com' },
  { id: 3, name: 'Pamela', email: 'pam@example.com' },
  { id: 4, name: 'Liz', email: 'liz@example.com' }
]
*/