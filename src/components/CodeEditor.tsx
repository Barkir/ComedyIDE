import { Box, Button, Text, Flex, Spinner } from "@chakra-ui/react"
import { Editor } from "@monaco-editor/react"
import { useState, useRef, useEffect, useCallback } from "react"
import "./CodeEditor.css"
import { linterModelRole, linterModelSystemPrompt } from "./prompts.tsx"
import * as Models from "./models.tsx"

import ollama from 'ollama'


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

const smartParse = (rawContent) => {
  try {
    // 1. Очищаем от маркдаун-оберток ```json ... ```
    let clean = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    // 2. Находим границы реального JSON (на случай если модель добавила текст "от себя")
    const firstBrace = clean.search(/[\[\{]/); // Находит первую { или [
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']')); // Находит последнюю } или ]

    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(clean);
  } catch (err) {
    console.error("❌ Не удалось распарсить даже после очистки!");
    console.log("Сырые данные:", rawContent);
    return null;
  }
};

const makeQwenResponse = async (text) => {
  console.log("making response to qwen with this text:");
  console.log(text);
  try {
  const response = await ollama.chat({
    model: Models.bielik11b,
    messages: [{role: linterModelRole, content: linterModelSystemPrompt + text}],
    options: {
      temperature: 0.1,
      num_ctx: 4096,
      top_p: 0.9,
      repeat_penalty: 1.1,
      num_predict: 500
    },
    format: "json"
  });
  return response;
  } catch (error) {
    console.error("error message: ", error);
    return null;
  }
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

  const applyDecorations = (data) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    const newDecorations = [];

    data.analyzed.forEach((item) => {
      const regex = new RegExp(`${item.text}`, "gi")
      let match;
      // console.log(value)
      // console.log(regex);
      console.log(item.text);
      while ((match = regex.exec(value)) !== null) {
        const start = model.getPositionAt(match.index);
        const end = model.getPositionAt(match.index + item.text.length);
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
            hoverMessage: { value: item.cure}
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
        const data = await makeQwenResponse(value);
        const content = data?.message.content;
        const parsedContent = smartParse(content);
        console.log(parsedContent);
        applyDecorations(parsedContent);
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
      justifyContent="center"
    >
      <Button
        colorScheme="purple"
        size="lg"
        isDisabled={!value.trim()}
      >Запустить симуляцию</Button>
    </Box>
    </Flex>

  )
};
export default CodeEditor;
