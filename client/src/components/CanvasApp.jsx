import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Line, Arrow, RegularPolygon, Text, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";

// --- STYLES ---

const backgroundStyle = {
  backgroundColor: "#f9f9f9", // Beige/White mix
  backgroundImage: "radial-gradient(#cfcfcf 1px, transparent 1px)", // Dot grid
  backgroundSize: "20px 20px",
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
  position: "relative",
  outline: "none" // Remove focus outline
};

const toolbarStyle = {
  position: "absolute",
  top: 20,
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "white",
  padding: "8px 12px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  display: "flex",
  gap: "8px",
  zIndex: 100,
  alignItems: "center"
};

const COLORS = ["#000000", "#E0534C", "#26C159", "#448AFF", "#F5C342"];

// --- HELPERS ---

const getShapeCenter = (shape) => {
  if (shape.type === 'rect') {
    return {
      x: shape.x + (shape.width * shape.scaleX) / 2,
      y: shape.y + (shape.height * shape.scaleY) / 2
    };
  }
  return { x: shape.x, y: shape.y };
};

const isPointInsideShape = (point, shape) => {
  if (shape.type === 'rect') {
     const width = shape.width * shape.scaleX;
     const height = shape.height * shape.scaleY;
     return (point.x >= shape.x && point.x <= shape.x + width &&
             point.y >= shape.y && point.y <= shape.y + height);
  }
  if (shape.type === 'circle') {
      const dx = point.x - shape.x;
      const dy = point.y - shape.y;
      const r = shape.radius * shape.scaleX;
      return (dx*dx + dy*dy <= r*r);
  }
  return false;
};

const CanvasApp = () => {
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select"); // select, rect, circle, arrow, pen, text
  const [color, setColor] = useState("#000000");
  const [editParams, setEditParams] = useState(null); // For text editing

  const isDrawing = useRef(false);
  const stageRef = useRef();
  const transformerRef = useRef();
  const textareaRef = useRef();

  // --- DELETE KEY LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Check if user pressed Delete or Backspace
      if ((e.key === "Delete" || e.key === "Backspace")) {
        // 2. Check if user is typing in a text box (don't delete shape then)
        const activeTag = document.activeElement.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

        // 3. Delete the selected shape
        if (selectedId) {
          setShapes((prev) => prev.filter((s) => s.id !== selectedId));
          setSelectedId(null);
          e.preventDefault(); // Prevent browser back navigation
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);


  // --- SELECTION TRANSFORMER ---
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne("#" + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);


  // --- MOUSE HANDLERS ---

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const target = e.target;

    // 1. CLICKING EMPTY SPACE -> DESELECT
    if (target === stage) {
      setSelectedId(null);
      setEditParams(null);
      if (transformerRef.current) transformerRef.current.nodes([]);
      
      // If using Select tool and clicking empty space, just return
      if (tool === 'select') return;
    }

    // 2. CLICKING A SHAPE (Select Tool)
    if (tool === "select" && target !== stage) {
        // If clicking a shape, select it
        const clickedId = target.id();
        setSelectedId(clickedId);
        return; 
    }

    // 3. DRAWING LOGIC (If not Select tool)
    if (tool !== "select") {
      // We are drawing, so ensure nothing is selected (hides the box)
      setSelectedId(null); 
      
      if (tool === "text") {
        const id = uuidv4();
        const newShape = { id, type: "text", x: pos.x, y: pos.y, text: "Type here...", fontSize: 20, fill: color };
        setShapes([...shapes, newShape]);
        setSelectedId(id);
        setTool("select"); // Text switches back to select immediately
        return;
      }

      isDrawing.current = true;
      const id = uuidv4();
      let newShape = null;

      // Smart Arrow Logic
      if (tool === "arrow") {
        const clickedShape = shapes.slice().reverse().find(s => isPointInsideShape(pos, s) && s.type !== 'arrow' && s.type !== 'pen');
        let startX = pos.x, startY = pos.y, startShapeId = null;

        if(clickedShape) {
            const center = getShapeCenter(clickedShape);
            startX = center.x; startY = center.y;
            startShapeId = clickedShape.id;
        }
        newShape = { id, type: "arrow", points: [startX, startY, pos.x, pos.y], stroke: color, strokeWidth: 2, startShapeId, endShapeId: null };
      } 
      else if (tool === "pen") {
        newShape = { id, type: "pen", points: [pos.x, pos.y], stroke: color, strokeWidth: 3 }; // Thicker stroke for pencil
      } 
      else if (tool === "rect") {
        newShape = { id, type: "rect", x: pos.x, y: pos.y, width: 1, height: 1, fill: color, scaleX:1, scaleY:1 };
      } 
      else if (tool === "circle") {
        newShape = { id, type: "circle", x: pos.x, y: pos.y, radius: 1, fill: color, scaleX:1, scaleY:1 };
      }
      else if (tool === "triangle") {
        newShape = { id, type: "triangle", x: pos.x, y: pos.y, sides: 3, radius: 1, fill: color, scaleX:1, scaleY:1 };
      }

      if(newShape) setShapes([...shapes, newShape]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool === "select") return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setShapes((prev) => {
      const newShapes = [...prev];
      const lastShape = newShapes[newShapes.length - 1];

      if (lastShape.type === "arrow") {
        const hoveredShape = shapes.slice().reverse().find(s => s.id !== lastShape.startShapeId && isPointInsideShape(pos, s) && s.type !== 'arrow');
        if(hoveredShape) {
            const center = getShapeCenter(hoveredShape);
            lastShape.points = [lastShape.points[0], lastShape.points[1], center.x, center.y];
        } else {
            lastShape.points = [lastShape.points[0], lastShape.points[1], pos.x, pos.y];
        }
      } 
      else if (lastShape.type === "pen") {
        lastShape.points = lastShape.points.concat([pos.x, pos.y]);
      } 
      else if (lastShape.type === "rect") {
        lastShape.width = pos.x - lastShape.x;
        lastShape.height = pos.y - lastShape.y;
      } 
      else if (lastShape.type === "circle" || lastShape.type === "triangle") {
        const dx = pos.x - lastShape.x;
        const dy = pos.y - lastShape.y;
        lastShape.radius = Math.sqrt(dx*dx + dy*dy);
      }
      return newShapes;
    });
  };

  const handleMouseUp = (e) => {
    if(!isDrawing.current) return;
    isDrawing.current = false;
    
    // Arrow Logic: Attach to end shape
    if (tool === "arrow") {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setShapes((prev) => {
        const newShapes = [...prev];
        const arrow = newShapes[newShapes.length - 1];
        const droppedShape = shapes.slice().reverse().find(s => s.id !== arrow.startShapeId && isPointInsideShape(pos, s) && s.type !== 'arrow');
        if(droppedShape) arrow.endShapeId = droppedShape.id;
        return newShapes;
      });
    }

    // --- TOOL SWITCHING LOGIC ---
    // If Pen, keep drawing. If Rectangle/Arrow/Circle, switch back to Select (Figma behavior)
    if (tool === "pen") {
        // Do nothing, stay in pen mode
    } else {
        setTool("select");
    }
  };

  // --- DRAGGING & TRANSFORMING ---
  const handleDragMove = (e) => {
    const shapeId = e.target.id();
    const node = e.target;

    const newShapes = shapes.map((s) => {
        if (s.id === shapeId) {
            return {
                ...s, x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY(),
            };
        }
        return s;
    });

    // Update Arrows
    const updatedWithArrows = newShapes.map((s) => {
        if(s.type === 'arrow') {
            const startNode = newShapes.find(n => n.id === s.startShapeId);
            const endNode = newShapes.find(n => n.id === s.endShapeId);
            let newPoints = [...s.points];

            if(startNode) {
                const center = getShapeCenter(startNode);
                newPoints[0] = center.x; newPoints[1] = center.y;
            }
            if(endNode) {
                const center = getShapeCenter(endNode);
                newPoints[2] = center.x; newPoints[3] = center.y;
            }
            return { ...s, points: newPoints };
        }
        return s;
    });

    setShapes(updatedWithArrows);
  };

  // --- TEXT EDITING ---
  const handleTextDblClick = (e, shape) => {
    const textNode = e.target;
    textNode.hide(); 
    if(transformerRef.current) transformerRef.current.hide();
    
    const textPosition = textNode.getAbsolutePosition();
    const stageBox = stageRef.current.container().getBoundingClientRect();

    setEditParams({
      id: shape.id,
      text: shape.text,
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
      fontSize: shape.fontSize,
      fill: shape.fill
    });
  };

  const handleTextEditEnd = (e) => {
    if(!editParams) return;
    setShapes(shapes.map(s => s.id === editParams.id ? { ...s, text: e.target.value } : s));
    const node = stageRef.current.findOne('#'+editParams.id);
    if(node) node.show();
    if(transformerRef.current) transformerRef.current.show();
    setEditParams(null);
  };

  const changeColor = (c) => {
    setColor(c);
    if(selectedId) {
        setShapes(shapes.map(s => {
            if(s.id === selectedId) {
                const isLine = s.type === 'arrow' || s.type === 'pen';
                return { ...s, [isLine ? 'stroke' : 'fill']: c };
            }
            return s;
        }));
    }
  };

  return (
    <div style={backgroundStyle} tabIndex={1}>
      {/* TOOLBAR */}
      <div style={toolbarStyle}>
        {['select', 'rect', 'circle', 'triangle', 'arrow', 'pen', 'text'].map(t => (
            <button 
                key={t}
                onClick={() => {
                    setTool(t);
                    setSelectedId(null); // Deselect shapes when picking a tool
                }}
                style={{
                    padding: "8px",
                    background: tool === t ? "#eef" : "transparent",
                    border: tool === t ? "1px solid #448AFF" : "1px solid transparent",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
                title={t}
            >
                {t === 'select' ? '↖' : t === 'rect' ? '⬜' : t === 'circle' ? '○' : t === 'triangle' ? '△' : t === 'arrow' ? '↝' : t === 'text' ? 'T' : '✎'}
            </button>
        ))}
        <div style={{width: 1, height: 20, background: '#eee', margin: '0 5px'}} />
        {COLORS.map(c => (
            <div 
                key={c}
                onClick={() => changeColor(c)}
                style={{
                    width: 20, height: 20, borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                    border: color === c ? "2px solid #333" : "1px solid #ccc"
                }}
            />
        ))}
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {shapes.map((shape) => {
             return (
               <React.Fragment key={shape.id}>
                 {shape.type === "rect" && (
                   <Rect {...shape} draggable={tool === 'select'} onClick={() => tool==='select' && setSelectedId(shape.id)} onDragMove={handleDragMove} onTransformEnd={handleDragMove} />
                 )}
                 {shape.type === "circle" && (
                   <Circle {...shape} draggable={tool === 'select'} onClick={() => tool==='select' && setSelectedId(shape.id)} onDragMove={handleDragMove} onTransformEnd={handleDragMove} />
                 )}
                 {shape.type === "triangle" && (
                   <RegularPolygon {...shape} sides={3} draggable={tool === 'select'} onClick={() => tool==='select' && setSelectedId(shape.id)} onDragMove={handleDragMove} onTransformEnd={handleDragMove} />
                 )}
                 {shape.type === "arrow" && (
                    <Arrow {...shape} onClick={() => tool === 'select' && setSelectedId(shape.id)} />
                 )}
                 {shape.type === "pen" && (
                    <Line {...shape} tension={0.5} lineCap="round" lineJoin="round" draggable={tool === 'select'} onClick={() => tool === 'select' && setSelectedId(shape.id)} />
                 )}
                 {shape.type === "text" && (
                    <Text 
                        {...shape} 
                        draggable={tool === 'select'} 
                        onClick={() => tool === 'select' && setSelectedId(shape.id)} 
                        onDblClick={(e) => handleTextDblClick(e, shape)}
                    />
                 )}
               </React.Fragment>
             );
          })}
          
          <Transformer
            ref={transformerRef}
            borderStroke="#0099ff"
            anchorStroke="#0099ff"
            anchorFill="#ffffff"
            anchorSize={8}
            padding={2}
            borderDash={[2, 2]}
            // If Text, Arrow, or Pen is selected, hide the resize handles, show only box
            enabledAnchors={
                selectedId && (shapes.find(s => s.id === selectedId)?.type === 'pen' || shapes.find(s => s.id === selectedId)?.type === 'arrow' || shapes.find(s => s.id === selectedId)?.type === 'text') 
                ? [] 
                : ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']
            }
          />
        </Layer>
      </Stage>

      {editParams && (
        <textarea
          ref={textareaRef}
          value={editParams.text}
          onChange={(e) => setEditParams({...editParams, text: e.target.value})}
          onBlur={handleTextEditEnd}
          onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) handleTextEditEnd(e); }}
          style={{
            position: "absolute",
            top: editParams.y,
            left: editParams.x,
            fontSize: editParams.fontSize + "px",
            lineHeight: editParams.fontSize + "px",
            fontFamily: "Arial, sans-serif",
            color: editParams.fill,
            border: "1px dashed #0099ff",
            background: "transparent",
            outline: "none",
            resize: "none",
            overflow: "hidden",
            margin: 0,
            padding: 0,
            zIndex: 200,
            minWidth: "100px"
          }}
          autoFocus
        />
      )}
    </div>
  );
};

export default CanvasApp;