#!/usr/bin/env node
const program = require('commander');
const { prompt } = require('inquirer');
const fs = require('fs');
const path = require('path');
const util = require('util');

//some information
program
    .version('0.0.1')
    .description('The first ToDo application');

//variables

const mypath = path.resolve('./file.json');

const {O_APPEND, O_RDONLY , O_CREAT} = fs.constants;

const  userID =1;

const forOpen = util.promisify(fs.open);
const forReading = util.promisify(fs.readFile);
const forWriting = util.promisify(fs.writeFile);

//functions

//for opening or creating file

function OpenOrCreate() {
    return forReading(mypath, {encoding: 'utf8', flag: O_RDONLY | O_CREAT})
        .then((inf) => {
            let json = inf;
            if (!json) json = '{}';
            return JSON.parse(json);
        })
        .then((depot) => {
            return depot.todos || [];
        });

}
//for adding in file

function addInFile(todos) {
    return forOpen(mypath, O_APPEND | O_CREAT)
        .then(() => {
            forWriting(mypath, JSON.stringify({todos}));
        });
}

//for indexation

function searchById(id, todos) {
    return todos.findIndex((todo) => todo.id === id);
}
    


//read by id

function readById(id) {
    OpenOrCreate()
        .then((todos) => {
            const index = searchById(id, todos);
            if(index===-1){
                return console.log("TODO item " + id + " not found");
            }else {
                const element = todos[index];
                console.log(element);
                return element;
            }
        })
}

//about ID

function giveIndexes() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x100)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4();
}
//printing

function print(...args) {
    console.info(...args);
}

//for creating new ToDo

function create(infa) {
    const currtime= new Date();
    return {
        comment: null,
        dateOfCreating: currtime,
        creatingByUserID: userID,
        id: giveIndexes(),
        isLiked: false,
        lastUpdating: currtime,
        lastUpdatingByUserID: userID,
        ...infa,
    };
    }

    //for updating out ToDo
function Uptading(uptd, todo) {
    return {
        ...todo,
        ...uptd,
        lastUpdating: new Date(),
        lastUpdatingByUserID: userID,
        dateOfCreating: todo.dateOfCreating,
        creatingByUserID: todo.creatingByUserID,

    };
}

//for creating ToDo element

function creatingToDoEl(infa) {
    let elID;

    return OpenOrCreate()
        .then((todos)=> {
            const todo = create(infa);
            elID = todo.id;
            const result = [...todos, todo];
            return addInFile(result);
        })
        .then(()=> elID);
 }
 
 //for updating ToDo element

function updatingTodoEl(id, uptd) {
    return OpenOrCreate()
    .then((todos)=>{
        const index = searchById(id, todos);
    const untitled = todos[index];
    const result = [...todos];

    result.splice(index,1,Uptading(uptd, untitled));
    return addInFile(result);
    })
        .then(()=>id);
}

//removing ToDo element

function removingToDoEl(id) {
    return OpenOrCreate()
        .then((todos)=>{
            const index = searchById(id, todos);

            const result = [...todos];
            if(index===-1){
                return 0;
            }else{
                const removedEl = result.splice(index,1);
                return addInFile(result).then(()=> removedEl.length);
            }
        });
}


//inquiring

const Questions =[
    {
        type: 'input',
        name: 'title',
        message: 'Write title:'
    },
    {
        type: 'input',
        name: 'description',
        message: 'Write description:'
    },
];

const UpQuestions = [
    {
        type: 'input',
        name: 'title',
        message:'Please, write new title: '
    },

    {
        type:'input' ,
        name: 'description',
        message: 'Please, write new description:'
    },
];
const commentQuestion =[
{
    type: 'input',
        name: 'comment',
    message:'Please, write you comment: '
}
];
//commands

//command for creating

program
    .command('create')
    .alias('cr')
    .description('Creating new action')
    .action(()=>{
       prompt(Questions)
           .then(({title, description})=> creatingToDoEl({title, description}))
           .then(print)
           .catch((e)=>{
           throw e;
           });
    });

// command for output list with all elements

program
    .command('list')
    .alias('ls')
    .description('Output list with all ToDos elements')
    .action(()=>{
        OpenOrCreate().then(print)
    });

//for reading only one element

program
    .command('read <id>')
    .alias('rd')
    .description('Read element by ID')
    .action((id)=>{
     readById(id)
    });


// command for removing element by ID
program
.command('remove <id>')
    .alias('rm')
    .description('Remove element by Id')
    .action((id)=>{
        removingToDoEl(id)
            .then(print)
            .catch((e)=>{
                throw e;
            });
    });

//command for updating element by Id

program
    .command('update <id>')
    .alias('up')
    .description('Update your ToDo element')
    .action((id)=>{
        prompt(UpQuestions)
            .then(({title, description})=> updatingTodoEl(id, {title, description}))
        .then(print)
            .catch((e)=>{
                throw e;
            });
    });

//command for likes
program
    .command('like <id>')
    .alias('lk')
    .description('Like your ToDo element')
    .action((id)=>{
        updatingTodoEl(id, {isLiked: true})
            .then(print)
            .catch((e)=> {
                throw e;
            });
    });

//command for comments
program
    .command('comment <id>')
    .alias('cm')
    .description('Comment your ToDo element')
    .action((id)=>{
        prompt(commentQuestion)
            .then(({comment})=> updatingTodoEl(id, {comment}))
            .then(print)
            .catch((e)=>{
            throw e;
            });
    });

//for unlike

program
    .command('unlike <id>')
    .alias('ulk')
    .description('Unlike your ToDo element')
    .action((id)=>{
        updatingTodoEl(id, {isLiked: false})
            .then(print)
            .catch((e)=> {
                throw e;
            });
    });

//delete comment
program
    .command('dcomment <id>')
    .alias('dcm')
    .description('Delete comment at your ToDo element')
    .action((id)=>{
        updatingTodoEl(id, {comment: null})
            .then(print)
            .catch((e)=> {
                throw e;
            });
    });

program.parse(process.argv);
