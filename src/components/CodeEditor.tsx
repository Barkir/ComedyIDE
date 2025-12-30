import { Box, Button, Text, Flex, Spinner } from "@chakra-ui/react"
import { Editor } from "@monaco-editor/react"
import { useState, useRef, useEffect, useCallback } from "react"
import "./CodeEditor.css"

// fakeLLMEmulation
const fakeLLMApiCall = (text) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = {
        weak_spots: [
          {word: "короче", reason: "слово-паразит", cringe: 4}
        ]
      };
      resolve(response);
    }, 1000);
  })
}


const CodeEditor = () => {
  const [value, setValue] = useState('')
  const keywords = ["something"];
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const decorationsRef = useRef([]);

  const debounceTimerRef = useRef(null);

  const handleCreateCharacter = () => {
    console.log("Создали персонажа");
    console.log(value);
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const applyDecorations = (weakSpots) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    const newDecorations = [];

    weakSpots.forEach((item) => {
      const regex = new RegExp(`${item.word}`, "gi")
      let match;
      console.log(value)
      console.log(regex);
      console.log(item.word);
      while ((match = regex.exec(value)) !== null) {
        const start = model.getPositionAt(match.index);
        const end = model.getPositionAt(match.index + item.word.length);
        console.log(match);
        newDecorations.push({
          range: new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column
          ),
          options: {
            inlineClassName: "keyword-glow",
            hoverMessage: { value: `кринжа навалил братик`}
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      const editor = editorRef.current;
      if (editor) decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      console.log("wassup");
      setIsAnalyzing(true);

      try {
        const data = await fakeLLMApiCall(value);
        console.log(data);
        applyDecorations(data.weak_spots);
      } catch (e) {
        console.error("Analysis error");
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);

    return () => clearTimeout(debounceTimerRef.current);
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
