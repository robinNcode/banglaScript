import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import transpileBanglaScript from '../parser';

const Home: React.FC = () => {
  const [editorValue, setEditorValue] = useState<string>('console.log("Hello World!");');

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setEditorValue(value);
    }
  };

  const handleSave = () => {
    try {
      const tsCode = transpileBanglaScript(editorValue);
      console.log("Generated TypeScript Code:\n", tsCode);
    }
    catch (error) {
      console.error(error);
    }
  };

  return (
    <Container fluid className="my-5">
      <Row>
        <Col xs={8} md={8} className="position-relative">
          <Card className="h-100">
            <Card.Body className="position-relative">
              <Card.Title>
                <h2>Bangla Script</h2>
              </Card.Title>

              {/* Monaco Editor */}
              <MonacoEditor
                height="400px"
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

              {/* Save Button */}
              <div className="position-absolute top-0 end-0 p-3">
                <Button variant="primary" onClick={handleSave}>
                  Save Code
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Code Preview Column */}
        <Col xs={4} md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Code Preview</Card.Title>
              <pre>{editorValue}</pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
