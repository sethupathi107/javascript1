import fs from "fs"


// first we will see how to read a file by chunk by chunk

const stream = fs.createReadStream("text.csv",{
    encoding: "utf-8"
})

// stream.on("data",function(chunk){
//     console.log("data is taken from the computer");
//     console.log(chunk)
// })

// stream.on("end",()=>{
//     console.log("data is downloaded")
// })

// stream.on("error",(err)=>{
//     console.log(err)
// })


async function* readcsv(file){
    // this is for the line the chunk does not have to the a complete line is may be a small line so if we get 1.5 line we can't just print it as one line
    let extra = "";
    for await (const chunk of stream){
        //the 0.5 line + now current 1.5line
        extra+=chunk;

        // split the line
        const lines = extra.split("\n")

        // we pop the last line that might be imcomplete.
        extra = lines.pop();
        
        for(const line of lines){
            yield line;
        }
    }
    // if any thing left in the extra it will be the final
    if(extra){
        yield extra;
    }
}
// Read CSV line by line
async function main() {
    for await (const line of readcsv("text.csv")) {
        if(line!==""){
            console.log(line);
            console.log("this is so far done\n")
        }
    }
}
main();