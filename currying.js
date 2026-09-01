// without currying the this is the code for filtering

let user = [{
        username:"sethu",
        age:21
    },
    {
        username:"sriram",
        age:20
    },
    {
        username:"manoj",
        age:18
    }
    ]

const filter = user.filter((user)=>user.username=="sethu")
console.log(filter)

// here the username is fixed or hardcoded

const filtername = (list,namee) => {
    return list.filter((user)=>user.username==namee)
}

const result=filtername(user,"sethu")

console.log(result);



// ok now we the function general

// function
function filtering1(name){
    return function (item) {
      return item.username==name;  
    } 
}

// arrow function
const filtering2 = (name) => (item) => item.username==name;

const filtername2 = (list,name)=>{
    return list.filter(filtering2(name))
}
console.log(filtername2(user,'sethu'))


// i can now do the filter with the name without repeating the code 

