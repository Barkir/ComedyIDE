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


import { keyframes } from "@emotion/react"
import { Editor } from "@monaco-editor/react"
import { useState, useRef, useEffect, useCallback } from "react"
import "./CodeEditor.css"
import * as Prompts from "./prompts.tsx"
import * as Models from "./models.tsx"
import * as Roles from "./roles.tsx"
import { db } from "./indexedDB.tsx"
import { useLiveQuery } from "dexie-react-hooks";

import ollama from 'ollama'

import PivnoySlava from "../assets/characters/PivnoySlava.png";
import BoomerMarina from "../assets/characters/BoomerMarina.png";
import SnobArtem from "../assets/characters/SnobArtem.png";
import ZoomerLiza from "../assets/characters/ZoomerLiza.png";
import BadOleg from "../assets/characters/BadOleg.png";


const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const getPulseAnim = (color) => keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0px ${color}
  }
  50% {
    transform: scale(1.05);
    /* Внутреннее плотное свечение + внешнее мягкое облако */
    box-shadow: 0 0 15px 5px ${color}
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0px ${color}
`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 0 0px rgba(72, 187, 120, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
  100% { box-shadow: 0 0 0 0px rgba(72, 187, 120, 0); }
`;

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

export const FileSideBar = ({ onSelectFile }) => {
  const jokes = useLiveQuery(() => db.jokes.toArray());

  const createNewJoke = async () => {
    const name = prompt("Your new beat");
    if (name) {
      await db.jokes.add({
        name,
        content: "Hello",
        updatedAt: Date.now()
      })
    }
  };

  return (
    <Box width="100px" borderRight="1px solid" borderColor="gray.800">
      <Button onClick={createNewJoke} size="sm" m={4} colorScheme="purple">
      +
      </Button>

      <VStack align="stretch">
        {jokes.map((joke) => (
          <HStack>

          <Text>📄 {joke.name}</Text>

          </HStack>
        ))}
      </VStack>
    </Box>
  );


};

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

const getGlowColor = (score) => {
  if (score >= 7) return "#38A169"; // Аналог green.500
  if (score >= 5) return "#ECC94B"; // Аналог yellow.400
  if (score >= 0) return "#E53E3E"; // Аналог red.500
  return "#A0AEC0";                // Аналог gray.500
}

const getStatusColor = (score) => {
  if (score >= 7) return "green.500";
  if (score >= 5) return "yellow.400";
  if (score >= 0) return "red.500";
  return "gray.500";
}

const CharacterCard = ({name, status, icon, score}) => {
  const badgeColor = getStatusColor(score);
  const glowColor = getGlowColor(score);
  return <VStack spacing={4} align="stretch">
      <HStack spacing={3} p={2} _hover={{ bg: "gray.700" }} borderRadius="md" transition="0.2s">
        <Avatar
        _hover={{
          animation: `${getPulseAnim(glowColor)} 1.5s infinite ease-in-out`,
          cursor: "pointer",
          // border: `2px solid ${glowColor}`,
          zIndex: 10, // Чтобы свечение было поверх других элементов
        }}
        name={name} src={icon} size="md" border="2px solid" borderColor={badgeColor}>
          <AvatarBadge boxSize="1.25em" bg={badgeColor} /> {/* Зеленый - значит готов слушать */}
        </Avatar>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="sm">{name}</Text>
          <Text fontSize="xs" color="gray.400">{status}</Text>
        </VStack>
      </HStack>
      </VStack>
}

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

  const [currentFileId, setCurrentFileId] = useState<number | null>(null);
  const jokes = useLiveQuery(() => db.jokes.toArray()) || [];

  const [scores, setScores] = useState({
    "Славик":   -1,
    "Марина":   -1,
    "Артем":    -1,
    "Олег":     -1,
    "Лиза":     -1,
  });


  const activeCharacters = [
    {id: "Лиза", role: Roles.ZoomerLiza},
    {id: "Артем", role: Roles.SnobArtem},
    {id: "Славик", role: Roles.PivnoySlava},
    {id: "Олег", role: Roles.BadOleg},
    {id: "Марина", role: Roles.BoomerMarina}
  ];

  const [isSimulating, setIsSimulating] = useState(false);

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




const handleRunSimulation = async (text) => {
  for (const char of activeCharacters) {
    const simulationResult  = await startSimulation(
      text, char.role
    );


  console.log("Ставим оценки");
  setScores(prevScores => ({
    ...prevScores,
    [char.id]: simulationResult.score
  }));
  };
}

const startSimulation = async (text, characterRole) => {
  console.log("симуляция запущена");
  try {
    const response = await ollama.chat({
      model: Models.bielik11b,
      messages: [{role: Prompts.linterModelRole, content: Prompts.simulationPrompt + characterRole + "\n----------------\n" +text}],
      options: {
        temperature: 1,
        num_ctx: 10000,
      },
      format: "json"
    });
    console.log(response);
    const jsonResult = JSON.parse(response.message.content);
    return jsonResult;
  } catch {error} {
    console.error("error:", error);
    return null;

  }
}



  const handleEditorChange = async (newValue: string | undefined) => {
    const text = newValue || "";
    setValue(text);

    if (currentFileId) {
      await db.jokes.update(currentFileId, {
        content: text,
        updatedAt: Date.now(),
      });
    }
  };

  const handleCreateNewFile = async () => {
  const name = prompt("Введите название бита:");
  if (name) {
    const id = await db.jokes.add({
      name: name.endsWith('.txt') ? name : `${name}.txt`,
      content: "",
      updatedAt: Date.now()
    });
    // Сразу переключаемся на новый файл
    setCurrentFileId(id as number);
    setValue("");
  }
  }

  const handleSelectFile = (joke) => {
    setCurrentFileId(joke.id);
    setValue(joke.content);
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
      <Box
      width="260px"
      borderRight="1px solid"
      borderColor="gray.800"
      display="flex"
      flexDirection="column"
      >
      <HStack justify="space-between" p={4}>
        <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wider">
          EXPLORER
        </Text>
        <Button size="xs" colorScheme="purple" variant="ghost" onClick={handleCreateNewFile}>
          +
        </Button>
      </HStack>

      <VStack align="stretch" spacing={1} px={2} overflowY="auto">
        {jokes.map((joke) => (
          <HStack
            key={joke.id}
            p={2}
            cursor="pointer"
            borderRadius="md"
            _hover={{ bg: "gray.800" }}
            bg={currentFileId === joke.id ? "gray.700" : "transparent"}
            onClick={() => handleSelectFile(joke)}
          >
            <Text color="orange.400" fontSize="sm">TXT</Text>
            <Text fontSize="sm" isTruncated>{joke.name}</Text>
          </HStack>
        ))}
      </VStack>
    </Box>


    <Box flex="1" borderRight="1px solid" borderColor="gray.700">
      <Editor
        height="100%"
        theme="vs-dark"
        value={value}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
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
        onClick = {() => handleRunSimulation(value)}
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
      <CharacterCard
      name="Славик"
      status="Ждет прикола"
      icon={PivnoySlava}
      score={scores["Славик"]}
      />

      <CharacterCard
      name="Марина"
      status="В ожидании катарсиса"
      icon={BoomerMarina}
      score={scores["Марина"]}
      />

      <CharacterCard
      name="Артем"
      status="wtf...."
      icon={SnobArtem}
      score={scores["Артем"]}
      />

      <CharacterCard
      name="Олег"
      status="да, это жестко"
      icon={BadOleg}
      score={scores["Олег"]}
      />

      <CharacterCard
      name="Лиза"
      status="я тик-ток"
      icon={ZoomerLiza}
      score={scores["Лиза"]}
      />

    </Box>
    </Flex>

  )
};
export default CodeEditor;
