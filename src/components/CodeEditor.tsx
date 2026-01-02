import {
Box,
Button,
Text,
Flex,
Spinner,
VStack,
HStack,
Avatar,
AvatarBadge,
Heading,
Divider
} from "@chakra-ui/react"


import { Editor } from "@monaco-editor/react"
import { useState, useRef, useEffect, useCallback } from "react"
import "./CodeEditor.css"
import * as Prompts from "./prompts.tsx"
import * as Models from "./models.tsx"
import * as Roles from "./roles.tsx"

import ollama from 'ollama'

import PivnoySlava from "../assets/characters/PivnoySlava.png";
import BoomerMarina from "../assets/characters/BoomerMarina.png";
import SnobArtem from "../assets/characters/SnobArtem.png";
import ZoomerLiza from "../assets/characters/ZoomerLiza.png";
import BadOleg from "../assets/characters/BadOleg.png";


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

const startSimulation = async (text) => {
  console.log("симуляция запущена");
  try {
    const response = await ollama.chat({
      model: Models.bielik11b,
      messages: [{role: Prompts.linterModelRole, content: Prompts.simulationPrompt + Roles.BoomerMarina + "\n----------------\n" +text}],
      options: {
        temperature: 1,
        num_ctx: 10000,
      },
      format: "json"
    });
    console.log(response);
    return response;
  } catch {error} {
    console.error("error:", error);
    return null;

  }

}

const smartParse = (rawContent) => {
  try {
    let clean = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const firstBrace = clean.search(/[\[\{]/);
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));

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
  // try {
  // const response = await ollama.chat({
  //   model: Models.bielik11b,
  //   messages: [{role: linterModelRole, content: linterModelSystemPrompt + text}],
  //   options: {
  //     temperature: 0.1,
  //     num_ctx: 4096,
  //     top_p: 0.9,
  //     repeat_penalty: 1.1,
  //     num_predict: 500
  //   },
  //   format: "json"
  // });
  return text;
  // } catch (error) {
  //   console.error("error message: ", error);
  //   return null;
  // }
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
        console.log(content);
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
      direction="row"
      height="90vh"
      gap={4}
      p={4}
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

      <Button
        colorScheme="purple"
        size="lg"
        isDisabled={!value.trim()}
        onClick = {() => startSimulation(value)}
      >Запустить симуляцию</Button>
    </Box>

    <Box
      flex="1"
      maxW="300px"
      p={4}
      bg="gray.800"
      borderRadius="md"
      borderColor="gray.600"
    >
      <Text mb={4} fontWeight="bold" color="gray.300" fonSize="sm">Виртуальный зал</Text>
      <VStack spacing={4} align="stretch">
      <HStack spacing={3} p={2} _hover={{ bg: "gray.700" }} borderRadius="md" transition="0.2s">
        <Avatar name="Slavik" src={PivnoySlava} size="md">
          <AvatarBadge boxSize="1.25em" bg="green.500" /> {/* Зеленый - значит готов слушать */}
        </Avatar>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="sm">Славик</Text>
          <Text fontSize="xs" color="gray.400">Ждет прикола</Text>
        </VStack>
      </HStack>
      </VStack>

      <VStack spacing={4} align="stretch">
      <HStack spacing={3} p={2} _hover={{ bg: "gray.700" }} borderRadius="md" transition="0.2s">
        <Avatar name="Slavik" src={BoomerMarina} size="md">
          <AvatarBadge boxSize="1.25em" bg="green.500" /> {/* Зеленый - значит готов слушать */}
        </Avatar>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="sm">Марина</Text>
          <Text fontSize="xs" color="gray.400">В ожидании катарсиса</Text>
        </VStack>
      </HStack>
      </VStack>

      <VStack spacing={4} align="stretch">
      <HStack spacing={3} p={2} _hover={{ bg: "gray.700" }} borderRadius="md" transition="0.2s">
        <Avatar name="Slavik" src={SnobArtem} size="md">
          <AvatarBadge boxSize="1.25em" bg="green.500" /> {/* Зеленый - значит готов слушать */}
        </Avatar>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="sm">Артем</Text>
          <Text fontSize="xs" color="gray.400">Ушел в анализ</Text>
        </VStack>
      </HStack>
      </VStack>

      <VStack spacing={4} align="stretch">
      <HStack spacing={3} p={2} _hover={{ bg: "gray.700" }} borderRadius="md" transition="0.2s">
        <Avatar name="Slavik" src={BadOleg} size="md">
          <AvatarBadge boxSize="1.25em" bg="green.500" /> {/* Зеленый - значит готов слушать */}
        </Avatar>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="sm">Олег</Text>
          <Text fontSize="xs" color="gray.400">Хочет жести</Text>
        </VStack>
      </HStack>
      </VStack>

      <VStack spacing={4} align="stretch">
      <HStack spacing={3} p={2} _hover={{ bg: "gray.700" }} borderRadius="md" transition="0.2s">
        <Avatar name="Slavik" src={ZoomerLiza} size="md">
          <AvatarBadge boxSize="1.25em" bg="green.500" /> {/* Зеленый - значит готов слушать */}
        </Avatar>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="sm">Лиза</Text>
          <Text fontSize="xs" color="gray.400">Ща тик-ток досмотрю сори</Text>
        </VStack>
      </HStack>
      </VStack>

    </Box>
    </Flex>

  )
};
export default CodeEditor;
