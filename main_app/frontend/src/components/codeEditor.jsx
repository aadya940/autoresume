import React, { useEffect, useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import "./styles/codeEditor.css";
import { buildUrl } from "./pdfview";

export default function LatexCodeEditor({ code, setCode }) {
  const pdfUrl = "/api/serve_pdf?file_type=tex"; 
  const [url, setUrl] = useState(buildUrl(pdfUrl));
  const [lastReady, setLastReady] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((response) => response.json())
      .then((data) => setCode(data.code))
      .catch((error) => console.log(error));
  }, [setCode, url]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/pdf-status");
      if (!res.ok) {
        console.error("Error checking status");
        return;
      }
      const { ready } = await res.json();

      if (ready && !lastReady) {
        // Status just switched from false -> true
        setUrl(buildUrl(pdfUrl));
      }
      setLastReady(ready);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastReady, pdfUrl]);

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
