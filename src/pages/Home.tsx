import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import transpileBanglaScript from '../parser';

// Images and Icons
import { CiPlay1, CiUndo } from "react-icons/ci";
import horizontalLogo from "../assets/images/bs_horizontal_logo.png";

const Home: React.FC = () => {
  const [editorValue, setEditorValue] = useState<string>('দেখাও("Hello World!");');
  const [finalOutput, getOutput] = useState<string>('');

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setEditorValue(value);
    }
  };

  const handleRun = () => {
    try {
      const tsCode = transpileBanglaScript(editorValue);
      let output = "";

      // Override console.log to capture output
      const originalConsoleLog = console.log;
      console.log = (msg) => {
        output += msg + "\n";
      };

      const fn = new Function(tsCode);
      fn(); // Execute the function

      // Restore console.log
      console.log = originalConsoleLog;

      // Set captured output
      getOutput(output);
    }
    catch (error: any) {
      console.error(error);
      getOutput("Error: " + error.message);
    }
  };

  return (
    <Container className="mt-2">
      {/* Header Row */}
      <Row className="mb-2">
        <Col md={6}>
          <img className="horizontal-logo" src={horizontalLogo}  alt="Bangla Script Logo"/>
          <span>Bangla Script: A Bengali Programming Language</span>
        </Col>
        <Col md={6} className='d-flex flex-row-reverse'>
          <Button className="m-2" variant="primary" onClick={handleRun}>
            <CiPlay1 /> Run
          </Button>
          <Button className="m-2" variant="secondary" onClick={() => setEditorValue('')}>
            <CiUndo /> Clear
          </Button>
        </Col>
      </Row>

      {/* Editor and Preview Rows */}
      <Row className="mb-2">
        <Col md={8}>
          {/* Monaco Editor */}
          <MonacoEditor
            height="80vh"
            language="javascript"
            value={editorValue}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              wordWrap: "on",
              wrappingIndent: "indent",
              lineNumbers: "on",
              scrollBeyondLastLine: false,
            }}
          />
        </Col>
        <Col md={4} className="bg-dark text-light">
          <pre>{finalOutput}</pre>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
