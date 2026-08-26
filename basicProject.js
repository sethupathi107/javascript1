//Hii

let message;
login='Director'

// if (login == 'Employee') {
//   message = 'Hello';
// } else if (login == 'Director') {
//   message = 'Greetings';
// } else if (login == '') {
//   message = 'No login';
// } else {
//   message = '';
// }

message = (login=="Employee") ? 'Hello': (login=='Director') ?'Greetings': (login=='')?'No login':"";

console.log(message)




// lets start a project

function counter(){
    let count=0;
    const increase=()=>{
        count+=1;
    }
    const decrease = ()=>{
        count-=1;
    }
    const display = ()=>{
        console.log(count);
    }
    return [increase,decrease,display];
}

const [increase,decrease,display] = counter();

increase()
increase()
increase()
display()
decrease()
decrease()
decrease()
display()

// debugger; 

// https://javascript.info/debugging-chrome



let a = +prompt('user role', '');


switch(a){
    case "admin":
        alert("admin is present")
        break;
    case "user":
        alert("user is present");
        break;
    case "visitor":
    case "relatives":
        alert("guest is present");
        break;
    default:
        alert("Everybody is absent")
}


let user = new Object(); // "object constructor" syntax
let user1 = {
    name:"sethu",
    age:9
};  
delete user1.age;


function makeUser(name, age) {
  return {
    name,
    age
  };
}

let user3 = { name: "John", age: 30 };

alert( "age" in user ); 
alert( "blabla" in user ); 


let id = Symbol("id");

let user4 = {
  name: "John",
  [id]: 123 // not "id": 123
};

present=true

let isPresent = present ? "present" : "Not present";



const person = "Mike";
const age = 28;

function myTag(strings, personExp, ageExp) {
  const str0 = strings[0]; // "That "
  const str1 = strings[1]; // " is a "
  const str2 = strings[2]; // "."

  const ageStr = ageExp < 100 ? "youngster" : "centenarian";

  return `${str0}${personExp}${str1}${ageStr}${str2}`;
}

const output = myTag`That ${person} is a ${age}.`;

console.log(output);
// That Mike is a youngster.

// Array

arr = ["sethu",'jayaprakash','arjitha','chandru'];
console.log(arr[0])
console.log(arr[1])
console.log(arr[2])
console.log(arr[3])


arr.push(()=>{console.log("sethu this is from function")});
// arr[4]()

let sethu = arr.at(-1)()
console.log(sethu)

// Array methods
/*
filter
reduce
map
find 
for each
some -> it will return true if it has the condition which give true it will return true otherwise it will return false
every -> this wil return true if every item in the arr follow the condition if not it will return false;
*/

const ress= arr.some((item)=> {
    return item=="sethu";
} )

const res1=arr.reduce( (acc,curr) => acc+=" " + curr , "");
console.log(res1);

console.log(ress)