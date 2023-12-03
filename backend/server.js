const  express =  require ("express");
const app = express();

const server = require("http").createServer(app);
const {Server} = require ("socket.io");
const { addUser,removeUser,getallusers,clearUsers } = require("./users");

const io = new Server(server);
const port = process.env.PORT||5000;

app.get("/",(req,res)=>{
    res.send("this is realitime whiteboaard");
});

let roomIdglobal , imgUrlglobal, userIdglobal; ;

io.on("connection",(socket)=>{

    socket.on("userJoined", (data) => {
        const { roomId, userId} = data;
        roomIdglobal = roomId;
        userIdglobal = userId;
        socket.join(roomId);
        const users = addUser(data);

        socket.broadcast.to(roomId).emit("allusers", users);
        socket.emit("userHasJoined", { success: true, users});
        
        console.log("User has joined "+ userIdglobal);
    });

    socket.on("disconnect", () => {
        const users = removeUser(userIdglobal);
        socket.broadcast.to(roomIdglobal).emit("userDisconnected", getallusers(roomIdglobal) );
        console.log("User has disconnected");
    });

   socket.on("drawUpdate", (drawData) => {
    
    socket.broadcast.to(roomIdglobal).emit("drawUpdatesuccess", drawData);
});
})

server.listen(port,()=>console.log("Server is Running on http://localhost:5000"));