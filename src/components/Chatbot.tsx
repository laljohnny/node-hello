import { useState } from "react";
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Send } from "lucide-react";

type ChatbotProps = {
  onClose?: () => void;
  onMobileClose?: () => void;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const Chatbot: React.FC<ChatbotProps> = ({ onClose, onMobileClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", text: "Hello! How can I help you today?" },
    { id: 2, role: "user", text: "Show me today's work orders." },
    { id: 3, role: "assistant", text: "Here are your assigned work orders." },
  ]);
  const [input, setInput] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), role: "user", text: input }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "assistant", text: "This is an AI response" },
      ]);
    }, 600);
    setInput("");
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 3,
          borderBottom: "1px solid #333",
        }}
      >
        <Typography fontWeight="bold" sx={{ color: "#fff" }}>
          Chatbot
        </Typography>
        <IconButton
          aria-label="Close"
          size="small"
          onClick={handleClose}
          sx={{
            color: "#fff",
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            sx={{ fontSize: "20px" }}
          >
            close
          </Box>
        </IconButton>
      </Box>

      {/* Messages */}
      <Stack
        spacing={3}
        sx={{
          flex: 1,
          p: 3,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            background: "#555",
            borderRadius: "3px",
          },
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              gap: 3,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
            }}
          >
            <Box
              sx={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: msg.role === "assistant" ? "#1f2937" : "#3b82f6",
              }}
            >
              <Box
                component="span"
                className="material-symbols-outlined"
                sx={{
                  fontSize: "20px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                {msg.role === "assistant" ? "smart_toy" : "person"}
              </Box>
            </Box>
            <Box
              sx={{
                px: 4,
                py: 2,
                borderRadius: "16px",
                bgcolor: msg.role === "assistant" ? "#1f2937" : "#3b82f6",
                color: "#fff",
              }}
            >
              {msg.text}
            </Box>
          </Box>
        ))}
      </Stack>

      {/* Input */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #333",
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          fullWidth
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#1f2937",
              color: "#fff",
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "none",
              },
              "& input::placeholder": {
                color: "#9ca3af",
                opacity: 1,
              },
            },
          }}
        />
        <IconButton
          type="submit"
          aria-label="Send"
          size="medium"
          sx={{
            bgcolor: "#3b82f6",
            color: "#fff",
            "&:hover": { bgcolor: "#2563eb" },
            flexShrink: 0,
          }}
        >
          <Send size={16} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chatbot;


