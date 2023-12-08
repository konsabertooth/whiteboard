const users =[];
const whiteboardState = [];
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

const updateWhiteboardState = (drawData) => {
    whiteboardState.push(drawData);
}

const getWhiteboardState = () => {
    return whiteboardState;
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getallusers,
    updateWhiteboardState,
    getWhiteboardState
};