import React, { useEffect, useState, useLayoutEffect, useCallback } from "react";
import rough from "roughjs";

const roughgenerator = rough.generator();

const Whiteboard = ({ canvasRef, ctxRef, elements, setElements, tool, color, thicknessvalue, socket, user, setUsers }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);

    // #region translating rgba to hex for roughjs
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

    // #region useEffect used on initializing the page
    useEffect(() => {
        socket.on("userJoined", (data) => {
            const { userId } = data;
        });

        socket.on("whiteboardState", (whiteboardState) => {
            setElements((prevElements) => prevElements.concat(whiteboardState["whiteboardState"]));
        });

        socket.on("drawUpdatesuccess", (drawData) => {
            setElements((prevElements) => [...prevElements, drawData]);
        });

        // On the client side
        socket.on("stateUpdated", (data) => {
            const { success, users, whiteboardState } = data;
            if (success) {
                // Handle the updated state, e.g., update UI or perform any necessary actions
                console.log("State has been updated:", users, whiteboardState);
                setUsers(users);
            } else {
                console.error("Failed to update state");
            }
        });

        return () => {
            socket.off("userJoined");
            socket.off("drawUpdatesuccess");
            socket.off("whiteboardState");;
            socket.off("stateUpdated");
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;

        ctx.strokeStyle = hexcolor;
        ctx.lineWidth = thicknessvalue;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctxRef.current = ctx;

        const handleResize = () => {
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [hexcolor]);

    useEffect(() => {
        ctxRef.current.strokeStyle = hexcolor;
    }, [hexcolor]);
    // #endregion

    // #region draw on canvas
    useLayoutEffect(() => {
        const roughcanvas = rough.canvas(canvasRef.current);

        if (elements.length > 0) {
            ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }

        elements.forEach((element) => {
            if (element.type === "pencil") {
                roughcanvas.linearPath(element.path, {
                    stroke: element.stroke,
                    strokeWidth: element.thickness,
                    roughness: 0,
                });
            } else if (element.type === "eraser") {
                ctxRef.current.globalCompositeOperation = "destination-out";
                roughcanvas.linearPath(element.path, {
                    stroke: "blue",
                    strokeWidth: element.thickness,
                    roughness: 0,
                });
                ctxRef.current.globalCompositeOperation = "source-over";
            } else if (element.type === "line") {
                roughcanvas.draw(
                    roughgenerator.line(element.offsetX, element.offsetY, element.width, element.height, {
                        stroke: element.stroke,
                        strokeWidth: element.thickness,
                        roughness: 0,
                    })
                );
            } else if (element.type === "rectangle") {
                roughcanvas.draw(
                    roughgenerator.rectangle(element.offsetX, element.offsetY, element.width, element.height, {
                        stroke: element.stroke,
                        strokeWidth: element.thickness,
                        roughness: 0,
                    })
                );
            } else if (element.type === "circle") {
                roughcanvas.draw(
                    roughgenerator.circle(element.offsetX, element.offsetY, element.radius, {
                        stroke: element.stroke,
                        strokeWidth: element.thickness,
                        roughness: 0,
                    })
                );
            }
        });

        const canvasImage = canvasRef.current.toDataURL();
        socket.emit("whiteboard", canvasImage);
    }, [elements]);

    //#endregion

    const emitDrawUpdate = (drawData) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set a new timeout to emit the drawing data after a delay (e.g., 500 milliseconds)
        const newTimeoutId = setTimeout(() => {
            socket.emit("drawUpdate", drawData);
        }, 50);

        // Update the timeoutId state
        setTimeoutId(newTimeoutId);
    };

    // #region handle mouse
    const handlemousedown = useCallback((e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        console.log(tool);

        if (tool === "pencil") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "pencil",
                    offsetX,
                    offsetY,
                    path: [[offsetX, offsetY]],
                    thickness: thicknessvalue,
                    stroke: hexcolor,
                },
            ]);
        } else if (tool === "eraser") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "eraser",
                    offsetX,
                    offsetY,
                    thickness: thicknessvalue,
                    path: [[offsetX, offsetY]],
                },
            ]);
        } else if (tool === "line") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "line",
                    offsetX,
                    offsetY,
                    width: offsetX,
                    height: offsetY,
                    thickness: thicknessvalue,
                    stroke: hexcolor,
                },
            ]);
        } else if (tool === "rectangle") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "rectangle",
                    offsetX,
                    offsetY,
                    width: 0,
                    height: 0,
                    thickness: thicknessvalue,
                    stroke: hexcolor,
                },
            ]);
        } else if (tool === "circle") {
            setElements((prevElements) => [
                ...prevElements,
                {
                    type: "circle",
                    offsetX,
                    offsetY,
                    radius: 0,
                    thickness: thicknessvalue,
                    stroke: hexcolor,
                },
            ]);
        }
        setIsDrawing(true);
    }, [tool, thicknessvalue, hexcolor, setElements]);

    const handlemousemove = useCallback(
        (e) => {
            const { offsetX, offsetY } = e.nativeEvent;

            if (isDrawing) {
                setElements((prevElements) => {
                    return prevElements.map((ele, index) => {
                        if (index === prevElements.length - 1) {
                            // Update the position based on the tool type
                            if (tool === "pencil" || tool === "eraser") {
                                const { path } = ele;
                                const newPath = [...path, [offsetX, offsetY]];
                                return {
                                    ...ele,
                                    path: newPath,
                                };
                            } else if (tool === "line") {
                                return {
                                    ...ele,
                                    width: offsetX,
                                    height: offsetY,
                                };
                            } else if (tool === "rectangle") {
                                return {
                                    ...ele,
                                    width: offsetX - ele.offsetX,
                                    height: offsetY - ele.offsetY,
                                };
                            } else if (tool === "circle") {
                                return {
                                    ...ele,
                                    radius: offsetX - ele.offsetX,
                                };
                            }
                        } else {
                            return ele;
                        }
                    });
                });
            }
        },
        [isDrawing, tool, setElements]
    );

    const handlemouseup = useCallback(() => {
        setIsDrawing(false);

        setElements((prevElements) => {
            const lastElement = prevElements[prevElements.length - 1];

            if (lastElement && lastElement.type === tool) {
                emitDrawUpdate({
                    type: tool,
                    ...lastElement, // Include the properties of the last drawn element
                    thickness: thicknessvalue,
                    stroke: hexcolor,
                });
            }

            return prevElements;
        });

        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }, [setIsDrawing, setElements, tool, thicknessvalue, hexcolor, timeoutId, emitDrawUpdate]);

    // #endregion

    return (
        <div onMouseDown={handlemousedown} onMouseMove={handlemousemove} onMouseUp={handlemouseup}>
            <canvas ref={canvasRef} className="h-100 w-100"></canvas>
        </div>
    );
};

export default Whiteboard;
