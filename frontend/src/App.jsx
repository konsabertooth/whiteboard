
import Board from "./pages/whiteboard"
import './App.css'
import { Route, Routes } from 'react-router-dom'
import io from "socket.io-client";
import React, { useState,useEffect} from "react";

//enstablishes a connection with the server
// const server = "192.168.56.11:31978"
const server = "localhost:5000"

const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 100000,
  transports: ["websocket"],
}

const socket = io(server, connectionOptions)

const App= ()=> {

  const [user,setUser] = useState(null);
  const [users,setUsers] = useState([]);

  // manages the user list 
  useEffect(() => {
    socket.on("userHasJoined", (data) => {
      if(data.success) {
        setUsers(data.users);
      }else{
        console.log("user has not joined");
      }
    });

    socket.on("allusers", (data) => {
      setUsers(data);
    });
    
    socket.on("userDisconnected", (data) => {
      setUsers(data);
    })

  },[]);

  //making  a user id for every use joining the session
  const uuid =()=>{
    let s4 =()=>{
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
  }

  

  //calls the index.jsx in the pages/whiteboard 
  return (
    <div >
      <Routes>
        
        <Route path="/" element={<Board uuid={uuid} socket={socket} user={user} setUser={setUser} users={users} setUsers={setUsers}/>}/>
      </Routes>
    </div>
  )
}

export default App
