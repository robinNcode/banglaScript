import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import transpileBanglaScript from '../parser';
import { CiPlay1 } from "react-icons/ci";

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
      <Row className="mb-4">
        <Col md={2}>
          <h2>Bangla Script</h2>
        </Col>
        <Col md={1}>
          <Button variant="primary" onClick={handleRun}>
            <CiPlay1 /> Run
          </Button>
        </Col>
        <Col md={9}>
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
