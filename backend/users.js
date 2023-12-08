let users =[];
let whiteboardState = [];
let temporaryWhiteboardState = [];

// dead code start
const addUser = ( { roomId, userId}) => {

    const user ={roomId,userId};
    users.push(user);
    return users.filter(user => user.roomId === roomId);
};

const removeUser = (id) => {
    const index = users.findIndex(user => user.userId === id);
    if(index!== -1){
        return users.splice(index, 1)[0];
    }
};

const getUser = (id) => {
    return users.find(user => user.userId === id);
};

const getallusers=(roomId) => {
    return users.filter(user => user.roomId === roomId);
}
// dead code end

const getWhiteboardState = () => {
    return whiteboardState;
}

const setWhiteboardState = (payload) => {
    whiteboardState = payload;
}

const getTemporaryWhiteboardState = () => {
    return temporaryWhiteboardState;
}

const setTemporaryWhiteboardState = (payload) => {
    temporaryWhiteboardState = payload;
}

const updateTemporaryWhiteboardState = (drawData) => {
    temporaryWhiteboardState.push(drawData);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getallusers,
    getWhiteboardState,
    setWhiteboardState,
    getTemporaryWhiteboardState,
    setTemporaryWhiteboardState,
    updateTemporaryWhiteboardState,
};