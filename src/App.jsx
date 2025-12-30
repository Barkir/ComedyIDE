import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEditor.tsx";

function App() {
  return (
    <Box minH="100vh" bg="#0f0a19" color="gray.100" py={10}>
      <CodeEditor />
    </Box>
  );
}

export default App;

