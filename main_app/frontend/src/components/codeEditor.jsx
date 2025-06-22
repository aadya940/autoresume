import React, { useEffect } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import "./styles/codeEditor.css";

export default function LatexCodeEditor({ code, setCode, refreshKey }) {
  useEffect(() => {
    fetch("/api/serve_pdf?file_type=tex")
      .then(response => response.json())
      .then(data => setCode(data.code))
      .catch(error => console.error(error));
  }, [setCode, refreshKey]);  

  return (
    <div className="code-editor-container">
      <CodeEditor
        value={code}
        language="latex"
        placeholder="Please enter TeX code..."
        onChange={(evn) => setCode(evn.target.value)}
        padding={15}
        style={{
          fontSize: "1rem",
          fontFamily:
            "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
          backgroundColor: "#f5f5f5",
          height: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
