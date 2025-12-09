import { useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Text,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const AIChatBox = ({ onClose }: { onClose: () => void }) => {
    const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { sender: "user", text: input }]);

        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: "This is an AI response to: " + input },
            ]);
        }, 600);

        setInput("");
    };

    return (
        <Box
            border="1px solid #ddd"
            borderRadius="md"
            w="380px"
            h="550px"
            bg="white"
            display="flex"
            flexDirection="column"
            boxShadow="lg"
        >
            {/* Header */}
            <HStack
                p={3}
                justify="space-between"
                borderBottom="1px solid #eee"
                bg="#1e3a8a"
                color="white"
            >
                <Text fontWeight="bold" fontSize="sm">
                    Copilot
                </Text>
                <IconButton
                    size="sm"
                    icon={<CloseIcon />}
                    aria-label="close"
                    variant="ghost"
                    color="white"
                    _hover={{ bg: "whiteAlpha.300" }}
                    onClick={onClose}
                />
            </HStack>

            {/* Messages */}
            <VStack
                flex="1"
                p={3}
                spacing={3}
                align="stretch"
                overflowY="auto"
                fontSize="sm"
            >
                {messages.length === 0 ? (
                    <Text color="gray.500" textAlign="center" mt="10">
                        Start chatting...
                    </Text>
                ) : (
                    messages.map((msg, idx) => (
                        <HStack
                            key={idx}
                            alignSelf={msg.sender === "user" ? "flex-end" : "flex-start"}
                            spacing={2}
                            maxW="80%"
                        >
                            {/* Icon before AI message */}
                            {msg.sender === "ai" && (
                                <Box
                                    as="span"
                                    className="material-symbols-outlined"
                                    fontSize="22px"
                                    color="gray.600"
                                >
                                    smart_toy
                                </Box>
                            )}

                            {/* Message Bubble */}
                            <Box
                                bg={msg.sender === "user" ? "#1e3a8a" : "gray.100"}
                                color={msg.sender === "user" ? "white" : "black"}
                                p={2}
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                {msg.text}
                            </Box>

                            {/* Icon before User message (placed after bubble but aligned right) */}
                            {msg.sender === "user" && (
                                <Box
                                    as="span"
                                    className="material-symbols-outlined"
                                    fontSize="22px"
                                    color="#1e3a8a"
                                >
                                    person
                                </Box>
                            )}
                        </HStack>
                    ))
                )}
            </VStack>

            {/* Input */}
            <Box p={3} borderTop="1px solid #eee">
                <InputGroup>
                    <Input
                        placeholder="Message Copilot"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <InputRightElement>
                        <IconButton
                            aria-label="Send"
                            size="sm"
                            bg="#1e3a8a"
                            color="white"
                            _hover={{ bg: "#152c63" }}
                            icon={
                                <Box
                                    as="span"
                                    className="material-symbols-outlined"
                                    fontSize="20px"
                                >
                                    send
                                </Box>
                            }
                            onClick={handleSend}
                        />
                    </InputRightElement>
                </InputGroup>
            </Box>
        </Box>
    );
};

export default AIChatBox;
