import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import transpileBanglaScript from '../parser';
import { CiPlay1 } from "react-icons/ci";
import horizontalLogo from "../../public/images/bs_horizontal_logo.png";

const Home: React.FC = () => {
  const [editorValue, setEditorValue] = useState<string>('console.log("Hello World!");');
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
    <Container fluid>
      {/* Header Row */}
      <Row>
        <Col md={6}>
          <img className="horizontal-logo" src={horizontalLogo} />
          <span>Bangla Script: A programming Language</span>
        </Col>
        <Col md={6} className='d-flex flex-row-reverse'>
          <Button variant="primary" onClick={handleRun}>
            <CiPlay1 /> Run
          </Button>
          <Button variant="secondary" onClick={() => setEditorValue('')}>
            Clear Editor
          </Button>
        </Col>
      </Row>

      {/* Editor and Preview Rows */}
      <Row className="mb-1">
        <Col>
          {/* Monaco Editor */}
          <MonacoEditor
            height="350px"
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
      </Row>
      <Row className="m-2">
        <Col className="bg-dark">
          <Card className="bg-dark">
            <Card.Body className="bg-dark text-light h-100">
              <pre>{finalOutput}</pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
