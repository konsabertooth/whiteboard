import { useEffect,useState ,useLayoutEffect, useCallback} from "react";
import rough from "roughjs"

const roughgenerator = rough.generator();

const Whiteboard = ({canvasRef, ctxRef,elements,setElements, tool, color,thicknessvalue, socket,user})=> {

    const [isDrawing, setIsDrawing] = useState(false);
    
    // #region translating rgba to hex  for roughjs
    function rgbaToHex(rgba) {
        const hex = (number) => {
          const hexValue = Math.round(number).toString(16);
          return hexValue.length === 1 ? `0${hexValue}` : hexValue;
        };
      
        const { r, g, b, a } = rgba;
      
        const alphaHex = Math.round(a * 255).toString(16);
        const alphaHexPadded = alphaHex.length === 1 ? `0${alphaHex}` : alphaHex;
      
        return `#${hex(r)}${hex(g)}${hex(b)}${alphaHexPadded}`;
      }

    const hexcolor = rgbaToHex(color);
    // #endregion

    // #region  useEffect used on initializing the page
    useEffect (() =>{
        
        socket.on("userJoined", (data) => {
            const { userId} = data;

        });

        socket.on("drawUpdatesuccess", (drawData) => {
            
            console.log(drawData);
            setElements((prevElements) => [...prevElements, drawData]);
        });

        return () => {
            socket.off ("userJoined");
            socket.off("drawUpdatesuccess");
        };

    },[]);



    useEffect(()=>{
      
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        
        ctx.strokeStyle = hexcolor;
        ctx.lineWidth = thicknessvalue;
        ctx.lineCap= "round";
        ctx.lineJoin = "round"


        ctxRef.current = ctx;

        const handleResize = () => {
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    },[])

    useEffect(() => {

        ctxRef.current.strokeStyle = hexcolor;
    },[hexcolor]);
    // #endregion

    // #region draw on canvas
    useLayoutEffect(() => {
        const roughcanvas = rough.canvas(canvasRef.current)

        if(elements.length > 0) {
         ctxRef.current.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
        }

        elements.forEach((element) => {
            if(element.type === "pencil" ){
                roughcanvas.linearPath(element.path, {
                    stroke: element.stroke, strokeWidth: element.thickness, roughness: 0});
            }else if(element.type === "eraser"){
                ctxRef.current.globalCompositeOperation = "destination-out";
                roughcanvas.linearPath(element.path, {
                    stroke: "blue", strokeWidth:  element.thickness, roughness: 0});
                ctxRef.current.globalCompositeOperation = "source-over";
            }
        });

        const canvasImage = canvasRef.current.toDataURL();
        socket.emit("whiteboard",canvasImage);

    },[elements])
    //#endregion
    
    const emitDrawUpdate = (drawData) => {
        socket.emit("drawUpdate", drawData);
    };

    // #region  handle mouse
    const handlemousedown =useCallback( (e)=>{
        const {offsetX,offsetY} = e.nativeEvent;

        if (tool === "pencil" ) {
            setElements((prevElements) => [...prevElements, {
                type:"pencil",
                offsetX,
                offsetY,
                path:[[offsetX,offsetY]],
                thickness:thicknessvalue,
                stroke:hexcolor}]);

            emitDrawUpdate({
                type: tool,
                offsetX,
                offsetY,
                path: [[offsetX, offsetY]],
                thickness: thicknessvalue,
                stroke: hexcolor,
            });

        }else if(tool === "eraser" ) {
            setElements((prevElements) => [...prevElements, {
                type:"eraser",
                offsetX,
                offsetY,
                thickness:thicknessvalue,
                path:[[offsetX,offsetY]],}]);
            
            emitDrawUpdate({
                type: tool,
                offsetX,
                offsetY,
                path: [[offsetX, offsetY]],
                thickness: thicknessvalue,
                stroke: hexcolor,
            });
        }
        setIsDrawing(true);
    }, [tool, thicknessvalue, hexcolor, setElements, elements, setIsDrawing]);

    const handlemousemove = useCallback((e)=>{
        const {offsetX,offsetY} = e.nativeEvent;
        if (isDrawing) {
            if (tool === "pencil" || tool==="eraser") {
                const {path} = elements[elements.length - 1];
                const newpath = [...path, [offsetX, offsetY]];
                setElements((prevElements) =>
                    prevElements.map((ele,index) =>{
                        if(index === elements.length - 1){
                            return{
                                ...ele,
                                path:newpath,
                            }
                        }else{
                            return ele;
                        }
                    })
                );

                emitDrawUpdate({
                    type: tool,
                    offsetX,
                    offsetY,
                    path: newpath, // Include the updated path in the socket data
                    thickness: thicknessvalue,
                    stroke: hexcolor,
                  });
                }
            }
    }, [tool, elements, setElements]);
    
    const handlemouseup = useCallback((e) => {
        setIsDrawing(false);

        emitDrawUpdate({
            type: tool,
            elements,
            thickness: thicknessvalue,
            stroke: hexcolor,
          });

    }, [setIsDrawing]);
    // #endregion
    
    return(
        <div 
            onMouseDown={handlemousedown}
            onMouseMove={handlemousemove}
            onMouseUp={handlemouseup}>
            <canvas ref={canvasRef} 
            className="h-100 w-100"></canvas>
        </div>
    )
}

export default Whiteboard;