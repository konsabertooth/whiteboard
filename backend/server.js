const express = require("express");
const app = express();

const server = require("http").createServer(app);
const { Server } = require("socket.io");
const {
    getWhiteboardState,
    setWhiteboardState,
    getTemporaryWhiteboardState,
    setTemporaryWhiteboardState,
    updateTemporaryWhiteboardState
} = require("./users");
const dotenv = require('dotenv');
const redis = require('redis');

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 5000;

// initialize redis
const redisClient = redis.createClient({ url: `redis://${process.env.REDIS_SERVER_IP}:${process.env.REDIS_PORT}` });
const initializeRedis = async () => {
    await redisClient.connect();
}
initializeRedis();

redisClient.on('error', (err) => {
    console.log('Error occured while connecting or accessing redis server');
    throw (err)
});

// create server object
const io = new Server(server);

// Function to acquire a distributed lock
const acquireLock = async (lockKey, lockValue, lockExpiration) => {
    return await redisClient.set(lockKey, lockValue, 'NX', 'EX', lockExpiration);
};

// Function to release a distributed lock
const releaseLock = async (lockKey, lockValue) => {
    const currentLockValue = await redisClient.get(lockKey);
    if (currentLockValue === lockValue) {
        await redisClient.del(lockKey);
    }
};

const addUserInCache = async (user) => {
    const lockKey = 'userStateLock';
    const lockValue = Date.now().toString();
    const lockExpiration = 5; // Lock expiration time in seconds

    try {
        // Acquire distributed lock
        const lockAcquired = await acquireLock(lockKey, lockValue, lockExpiration);
        if (!lockAcquired) {
            console.log('Failed to acquire lock. Another node is updating the state.');
            return;
        }

        // fetch users from state
        let latest_state_users = await redisClient.get('users', redis.print);
        latest_state_users = latest_state_users != 'null' && JSON.parse(latest_state_users) != null ? JSON.parse(latest_state_users) : [];
        latest_state_users.push(user);
        await redisClient.set('users', JSON.stringify(latest_state_users), redis.print);

        console.log("Successfully added user in cache");
        return latest_state_users;
    } catch (err){
        console.log(err);
    } finally {
        // Release the distributed lock
        await releaseLock(lockKey, lockValue);
    }

}

const removeUserFromCache = async (userId) => {
    const lockKey = 'userStateLock';
    const lockValue = Date.now().toString();
    const lockExpiration = 5; // Lock expiration time in seconds

    try {
        // Acquire distributed lock
        const lockAcquired = await acquireLock(lockKey, lockValue, lockExpiration);
        if (!lockAcquired) {
            console.log('Failed to acquire lock. Another node is updating the state.');
            return;
        }

        // fetch users from state
        let latest_state_users = await redisClient.get('users', redis.print);
        latest_state_users = latest_state_users != 'null' && JSON.parse(latest_state_users) != null ? JSON.parse(latest_state_users) : [];
        const index = latest_state_users.findIndex(user => user.userId === userId);
        if (index !== -1) {
            latest_state_users.splice(index, 1)[0];
        }
        await redisClient.set('users', JSON.stringify(latest_state_users), redis.print);
        return latest_state_users;
    } catch (err) {
        console.log(err);
    } finally {
        // Release the distributed lock
        await releaseLock(lockKey, lockValue);
    }

}

const updateStateInCache = async () => {
    const lockKey = 'whiteboardStateLock';
    const lockValue = Date.now().toString();
    const lockExpiration = 5; // Lock expiration time in seconds

    try {
        // Acquire distributed lock
        const lockAcquired = await acquireLock(lockKey, lockValue, lockExpiration);
        if (!lockAcquired) {
            console.log('Failed to acquire lock. Another node is updating the state.');
            return;
        }

        console.log('Updating State in Cache...');
        let whiteboardState_temp = getTemporaryWhiteboardState();

        // fetch latest users and whiteboard state
        let latest_state_users = await redisClient.get('users', redis.print);
        latest_state_users = latest_state_users != 'null' ? JSON.parse(latest_state_users) : [];
        let latest_state_whiteboard = await redisClient.get('whiteboardState', redis.print);

        // bring states in harmony
        if (latest_state_whiteboard != 'null' && JSON.parse(latest_state_whiteboard) != null && typeof JSON.parse(latest_state_whiteboard) == typeof []) {
            console.log("get whiteboard state")
            latest_state_whiteboard = JSON.parse(latest_state_whiteboard);
            latest_state_whiteboard = latest_state_whiteboard.concat(whiteboardState_temp);
        } else {
            latest_state_whiteboard = [];
        }

        // update cache
        await redisClient.set('whiteboardState', JSON.stringify(latest_state_whiteboard), redis.print);
        setWhiteboardState(latest_state_whiteboard);
        setTemporaryWhiteboardState([]);
        console.log('Succesfully updated state in cache...');

        // Emit a message to all connected users
        io.to("mywhiteboard").emit("stateUpdated", { success: true, users: latest_state_users, whiteboardState: latest_state_whiteboard });            
    } catch (err) {
        console.log(err);
    } finally {
        // Release the distributed lock
        await releaseLock(lockKey, lockValue);
    }
}

// Update state every 5 seconds
const intervalId = setInterval(updateStateInCache, process.env.INTERVAL);

app.get("/", (req, res) => {
    res.send("this is realitime whiteboaard");
});

let roomIdglobal, imgUrlglobal, userIdglobal;;


// establish socket connection
io.on("connection", (socket) => {

    socket.on("userJoined", (data) => {
        const { roomId, userId } = data;
        roomIdglobal = roomId;
        userIdglobal = userId;
        socket.join(roomId);

        const users = addUserInCache(data);
        socket.broadcast.to(roomId).emit("allusers", users);
        socket.emit("userHasJoined", { success: true, users });
        const whiteboardState = getWhiteboardState();
        socket.emit("whiteboardState", { success: true, whiteboardState })


        console.log("User has joined " + userIdglobal);
    });

    socket.on("disconnect", () => {
        const users = removeUserFromCache(userIdglobal)
        socket.broadcast.to(roomIdglobal).emit("userDisconnected", users);
        console.log("User has disconnected");
    });

    socket.on("drawUpdate", (drawData) => {
        updateTemporaryWhiteboardState(drawData);
        socket.broadcast.to(roomIdglobal).emit("drawUpdatesuccess", drawData);
    });
})

server.listen(port, () => {
    // Close the interval when the server is stopped
    process.on('SIGINT', () => {
        clearInterval(intervalId);
        console.log('Server is shutting down. Bye!');
        process.exit();
    });

    console.log(`Server is Running on http://localhost:${port}`)
});