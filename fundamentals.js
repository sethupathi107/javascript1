// hii this is my first js file created in this computer'


// Variables

/*
Variable naming
There are two limitations on variable names in JavaScript:

The name must contain only letters, digits, or the symbols $ and _.
The first character must not be a digit.
*/

/*

let $ = 1; // declared a variable with the name "$"
let _ = 2; // and now a variable with the name "_"

alert($ + _); // 3
*/




/*
Non-Latin letters are allowed, but not recommended
It is possible to use any language, including Cyrillic letters, Chinese logograms and so on, like this:

let имя = '...';
let 我 = '...';
Technically, there is no error here. 
Such names are allowed, but there is an international convention to use English in variable names. 
Even if we’re writing a small script, it may have a long life ahead. People from other countries may need to read it sometime.
 */

let user1 = 'John',
  age1 = 25,
  message1= 'Hello';


let user2 = 'John'
  , age2 = 25
  , message2 = 'Hello';

// let , var , const



// javascript is a dynamically typed 
// types of data type

Number 
// -> (2power53-1), -(2power53-1)

BigInt 
// -> In JavaScript, the “number” type cannot safely represent integer values larger 
//           than (253-1) (that’s 9007199254740991), or less than -(253-1) for negatives.

String
// In JavaScript, there are 3 types of quotes.

// Double quotes: "Hello".
// Single quotes: 'Hello'.
// Backticks: `Hello`.

// alert( `Hello, ${name}!` ); // Hello, John!


Object
Symbol

// The typeof operator
// The typeof operator returns the type of the operand. It’s useful when we want to process values of different types differently or just want to do a quick check.

// A call to typeof x returns a string with the type name:

typeof "foo" // "string"

typeof Symbol("id") // "symbol"

typeof Math // "object"  (1)

typeof null // "object"  (2)

typeof alert // "function"  (3)




// Interaction: alert, prompt, confirm

// alert

// normal alert we use to show some message in the alert

// prompt 

// this is used to get the data from the user in alert 

// let age = prompt('How old are you?', 100);

// alert(`You are ${age} years old!`); // You are 100 years old!

// CONFIRM

// result = confirm(question);

// a alert is created if the select ok the value is true and false if i select cancel

// 0, null, undefined, NaN, ""	--> falsy value



// Terms: “unary”, “binary”, “operand”

// unary -> + -



// while loop

while(true){}

// while -> keyword 
// () -> condition
// {} -> statement

for(let i=0;i<10;i++){}


if(true){}

// same as normal forloop