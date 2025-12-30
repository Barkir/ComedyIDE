import { Box, Button, Text, Flex } from "@chakra-ui/react"
import { Editor } from "@monaco-editor/react"
import { useState, useRef, useEffect } from "react"
import "./CodeEditor.css"


const CodeEditor = () => {
  const [value, setValue] = useState('')
  const keywords = ["something"];

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const decorationsRef = useRef([]);

  const handleCreateCharacter = () => {
    console.log("Создали персонажа");
    console.log(value);
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;
    console.log("using effect");
    const newDecorations = [];
    keywords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");

      let match;
      while ((match = regex.exec(value)) !== null) {
        const start = model.getPositionAt(match.index);
        const end = model.getPositionAt(match.index + word.length);

        newDecorations.push({
          range: new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column
          ),
          options: {
            inlineClassName: "keyword-glow",
            hoverMessage: {value: "this is a keyword!"}
          }
        })
      }
    });

  decorationsRef.current = editor.deltaDecorations(
    decorationsRef.current,
    newDecorations
  );

  }, [value]);

  return (
    <Flex
      direction="column"
      height="80vh"
      width="100%">
    <Box flex="1" borderRight="1px solid" borderColor="gray.700">
      <Editor
        height="100%"
        theme="vs-dark"
        value={value}
        onMount={handleEditorDidMount}
        onChange={(newValue) => setValue(newValue || "")}
        options={{minimap: {enabled: false},
                  fontSize: 16,
                  fontFamily: "'IBM Plex Mono'",
                  cursorStyle: "block",
                  renderWhitespace: "none",
                  lineNumbers: "off",
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    vertical: "hidden",
                    horizontal: "hidden"
                  },
                  overviewRulerLanes: 0,
        }}
        />
    </Box>

    <Box flex="1" p={4} bg="gray.900" color="white" overflow="auto">
      <Text whiteSpace="pre-wrap" fontSize="sm">
      {value}
      </Text>
    </Box>

    <Box
      p={3}
      bg="gray.900"
      borderTop="1px solid"
      borderColor="gray.700"
      display="flex"
      justifyContent="flex-end"
    >
      <Button
        colorScheme="green"
        size="lg"
        onClick={handleCreateCharacter}
        isDisabled={!value.trim()}
      >Создать персонажа</Button>
    </Box>
    </Flex>

  )
};
export default CodeEditor;
