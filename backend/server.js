const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connnectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const  chatRoutes  = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
dotenv.config();
connnectDB();

const app = express()

app.use(express.json()); //to accept JSON Data

app.get('/', (req, res) => {
    res.send('API is Running succecfully');
});


app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log(`Server Started on PORT ${ PORT }`.yellow.bold));

const io = require('socket.io')(server,{
    pingTimeout: 60000,
    cors:{
        origin: "http://localhost:3000",
    },
});

io.on("connection",(socket) =>{
    console.log("connected to socket.io");

    socket.on("setup",(userData) =>{
       socket.join(userData._id);
    //    console.log(userData._id);
       socket.emit("connected");
    });

    socket.on("join chat",(room) => {
       socket.join(room);
       console.log("User joined Room : "+room);
    });

    socket.on("typing",(room) => socket.in(room).emit("typing"));
    socket.on("stop typing",(room) => socket.in(room).emit("stop typing"));
    socket.on("new message",(newMessageReceived) =>{
         var chat = newMessageReceived.chat;
         if(!chat.users) return console.log('chat.users not defeined');

         chat.users.forEach(user => {
             if(user._id === newMessageReceived.sender._id) return;
             socket.in(user._id).emit("message received",newMessageReceived);

         });
    });

    socket.off("setup",() => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});