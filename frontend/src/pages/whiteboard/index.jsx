import React ,{useState, useEffect, useRef } from "react";
import"./index.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { 
  faDroplet, 
  faPencil, 
  faEraser,
  faSlash, 
  faSquare, 
  faCircle
} from '@fortawesome/free-solid-svg-icons';

import Whiteboard from "./whiteboad";
import { ChromePicker } from "react-color";


const Board = ({uuid,socket,user,setUser,users}) => {

  // #region initiliase several constants for saving and passing data through the app
  const canvasRef = useRef(null);
  const ctxRef =  useRef(null);

  const [tool,setTool] =useState("pencil");
  const [thicknessvalue, setThicknessvalue] = useState(3);

  const [seletedcolor, setnewColor] = useState({ r: 0, g: 0, b: 0, a: 1 }); // Initial color is black with full opacity
  const [elements, setElements] = useState([]);
  
  const { r, g, b, a } = seletedcolor;

  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  const [roomId, setRoomId] = useState("mywhiteboard");
  
  //#endregion
  
  // #region useEffect for initilising data on load of the page
  useEffect(() => {
    const userdata = {roomId,userId: uuid()};
    setUser(userdata);
    socket.emit("userJoined",userdata);
  }, [socket]);
  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        handleColorPickerClose();
      }
    };

    if (showColorPicker) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showColorPicker]);

  useEffect(() => {
    console.log(users.length)

  },[users])

  // #endregion
  
  // #region  handling the color picker
  const handleToggleColorPicker = (event) => {
    setShowColorPicker(!showColorPicker);
  };

  const handleColorPickerClose = () => {
    setShowColorPicker(false);
  };
  //#endregion
  
  
  return (
    <div className="gridbackground">
      {/* html for head  with buttons*/}
      <div className="container">
        <div className="row align-items-center tools">
          <div className="col-auto">
              <span className="text-dark">users Online: {users.length}</span>
          </div>

          <div className="col-auto">
            <button className="btn btn-outline-primary custom-button"  onClick={(e)=>setTool("pencil")}
             data-toggle="tooltip" data-placement="bottom right" title="Draw with pencil">
              <FontAwesomeIcon icon={faPencil} size="xl" style={{color: "#000000",}} /></button>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-primary custom-button" onClick={(e)=>setTool("eraser")}
             data-toggle="tooltip" data-placement="bottom right" title="Select Eraser">
              <FontAwesomeIcon icon={faEraser} size="xl" style={{color: "#000000",}} /></button>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-dark custom-button" onClick={(e)=>setTool("line")}
            data-toggle="tooltip" data-placement="bottom right" title="Draw a line">
              <FontAwesomeIcon icon={faSlash} rotation={90} size="xl" style={{color: "#000000",}} /></button>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-dark custom-button" onClick={(e)=>setTool("rectangle")}
             data-toggle="tooltip" data-placement="bottom right" title="Draw a rectangle">
              <FontAwesomeIcon icon={faSquare} size="xl" style={{color: "#000000",}} /></button>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-dark custom-button" onClick={(e)=>setTool("circle")}
            data-toggle="tooltip" data-placement="bottom right" title="Draw a circle">
              <FontAwesomeIcon icon={faCircle} size="xl" style={{color: "#000000",}} /></button>
          </div>

          <div className="col-auto">
            <button className="btn btn-outline-dark custom-button1" onClick={handleToggleColorPicker}  data-toggle="tooltip" data-placement="bottom right" title="Select a color">
              <FontAwesomeIcon icon={faDroplet} size="xl" style={{color:`rgba(${r},${g},${b},${a})`}} /></button>
          </div>
          <div className="col-auto">
          <input type="range" className="form-range thicknessslider" min={1} max={50} step={0.5} defaultValue={3}
          onChange={(value) => {setThicknessvalue(value.target.value);}}/>
          </div>
          {showColorPicker && (
            <div className="color-picker-container" ref={colorPickerRef}>
              <ChromePicker color={seletedcolor} onChange={(color) => {setnewColor(color.rgb);}}/>
            </div>
          )}
          
          
        </div>
      </div>
      
      {/* calling the whiteboard.jsx to handle drawing*/}
      <div className=" h-100 w-100" >
        <Whiteboard canvasRef={canvasRef} ctxRef={ctxRef} elements={elements}
        setElements={setElements}  tool={tool} color={seletedcolor} thicknessvalue={thicknessvalue} socket={socket} 
        user={user}
        />
       
      </div>
      
  </div>
  )
}

export default Board;
