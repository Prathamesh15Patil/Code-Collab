import React, { useRef, useEffect } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";

// Import modes for supported languages
import "codemirror/mode/javascript/javascript.js"; // Used for JS/JSON (default for editor in your code)
import "codemirror/mode/clike/clike.js"; // Required for Java, C++, C#
import "codemirror/mode/python/python.js"; // Required for Python

import "codemirror/addon/edit/closetag.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";


const Editor = ({ socketRef, roomId, onCodeChange, language }) => { // New: receive 'language' prop
  const editorRef = useRef(null);
  const initialized = useRef(false); // To prevent re-initialization of Codemirror

  useEffect(() => {
    // Only initialize Codemirror once
    if (!initialized.current) {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realTimeEditor"),
        {
          mode: { name: "javascript", json: true }, // Initial mode, will be updated by language prop
          theme: "dracula",
          autoCloseTags: true, // Only applicable for XML/HTML-like modes, can be removed for pure code
          autoCloseBrackets: true,
          lineNumbers: true,
          // Add extra keys for basic auto-indent on Enter
          extraKeys: {
            "Ctrl-Space": "autocomplete", // Basic autocomplete
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection(cm.getOption("indentWithTabs") ? "\t" :
                        Array(cm.getOption("indentUnit") + 1).join(" "), "end");
                }
            },
            "Shift-Tab": function(cm) {
                cm.indentSelection("subtract");
            }
          }
        }
      );
      editorRef.current.setSize(null, "100%");

      editorRef.current.on('change', (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);

        // Only emit if the change wasn't from the server setting the value
        if (origin !== "setValue") {
          socketRef.current.emit("code-change", {
            roomId,
            code
          });
        }
      });
      initialized.current = true;
    }

    // This effect runs whenever the 'language' prop changes
    if (editorRef.current && language) {
      let mode;
      switch (language) {
        case "python":
          mode = "python";
          break;
        case "java":
          mode = "text/x-java"; // Codemirror mode for Java
          break;
        case "javascript": // Keeping JS mode for general debugging or future expansion
          mode = { name: "javascript", json: true };
          break;
        default:
          mode = "javascript"; // Default to JS if unknown
      }
      editorRef.current.setOption("mode", mode);
      console.log("Codemirror mode set to:", mode);
    }

  }, [language]); // Depend on 'language' prop

  // Sync code from server
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("code-change", ({ code }) => {
        // Prevent infinite loop: check if the incoming code is different
        // and if the change wasn't initiated by the current editor
        if (code !== null && editorRef.current.getValue() !== code) {
          editorRef.current.setValue(code);
        }
      });
      return () => {
        socketRef.current.off("code-change");
      };
    }
  }, [socketRef.current]);

  return (
    <div className="h-1/2">
      <textarea id="realTimeEditor"></textarea>
    </div>
  );
};

export default Editor;