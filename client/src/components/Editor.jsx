import React, { useRef, useEffect } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/addon/edit/closetag.js";
import "codemirror/addon/edit/closebrackets.js";

const Editor = () => {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = Codemirror.fromTextArea(
      document.getElementById("realTimeEditor"),
      {
        mode: { name: "javascript", json: true },
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      }
    );
    editor.setSize(null, "115.5%");
    editorRef.current = editor;
  }, []);

  return (
    <div style={{ height: "600px" }}>
      <textarea id="realTimeEditor" />
    </div>
  );
};

export default Editor;
