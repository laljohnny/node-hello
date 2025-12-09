import { useState, useEffect, useRef } from "react";
import { Box, useBreakpointValue } from "@chakra-ui/react";
import MainMenu from "./MainMenu";
import Chatbot from "./Chatbot";
import MiniSidebar from "./MiniSidebar";

type ParentProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onMobileClose?: () => void;
};

const SideNav: React.FC<ParentProps> = ({ isOpen, setIsOpen, onMobileClose }) => {
  // Initialize with menu open if sidebar is open (for initial login)
  const [activePanel, setActivePanel] = useState<"menu" | "chat" | null>(isOpen ? "menu" : null);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const prevIsOpenRef = useRef<boolean | undefined>(undefined);

  // Sync activePanel with isOpen prop changes
  useEffect(() => {
    const prevIsOpen = prevIsOpenRef.current;
    
    if (!isOpen) {
      // When sidebar is closed externally, clear active panel
      setActivePanel(null);
    } else if (isOpen && (prevIsOpen === undefined || !prevIsOpen)) {
      // When sidebar is opened (changed from false to true, or initial mount with isOpen=true)
      // Open menu by default - this is especially important on mobile when the toggle button in Layout is clicked
      setActivePanel("menu");
    }
    
    // Update ref after handling the state change
    prevIsOpenRef.current = isOpen;
  }, [isOpen, isMobile]);
  
  // Handle panel toggle
  const handlePanelToggle = (panel: "menu" | "chat") => {
    if (isMobile) {
      // On mobile, opening a panel should also open the drawer
      setIsOpen(true);
      setActivePanel(activePanel === panel ? null : panel);
    } else {
      // On desktop, toggle the panel and sidebar state
      if (activePanel === panel) {
        // If clicking the same panel, minimize
        setActivePanel(null);
        setIsOpen(false);
      } else {
        // Switch to the clicked panel
        setActivePanel(panel);
        setIsOpen(true);
      }
    }
  };

  const handleChatbotClose = () => {
    setActivePanel(null);
    setIsOpen(false);
  };

  // Mobile View - Mini sidebar always visible, panels overlay
  if (isMobile) {
    return (
      <>
        {/* Mini Sidebar - Always visible on mobile */}
        <MiniSidebar
          activePanel={activePanel}
          isOpen={isOpen}
          onMenuClick={() => handlePanelToggle("menu")}
          onChatClick={() => handlePanelToggle("chat")}
          zIndex={2}
        />

        {/* Menu Panel - Overlay on mobile */}
        {activePanel === "menu" && isOpen && (
          <>
            <Box
              position="fixed"
              top={0}
              left="60px"
              bottom={0}
              backgroundColor="black"
              color="white"
              width="250px"
              zIndex={1000}
              overflowY="auto"
              borderRight="1px solid #333"
              boxShadow="2xl"
            >
              <MainMenu onMobileClose={onMobileClose} />
            </Box>
            {/* Overlay backdrop */}
            <Box
              position="fixed"
              top={0}
              left="310px"
              right={0}
              bottom={0}
              bg="blackAlpha.600"
              zIndex={999}
              onClick={() => {
                setIsOpen(false);
                if (onMobileClose) onMobileClose();
              }}
            />
          </>
        )}

        {/* Chatbot Panel - Overlay on mobile */}
        {activePanel === "chat" && isOpen && (
          <>
            <Box
              position="fixed"
              top={0}
              left="60px"
              bottom={0}
              backgroundColor="black"
              color="white"
              width="350px"
              zIndex={1000}
              display="flex"
              flexDirection="column"
              borderRight="1px solid #333"
              boxShadow="2xl"
            >
              <Chatbot
                onClose={handleChatbotClose}
                onMobileClose={onMobileClose}
              />
            </Box>
            {/* Overlay backdrop */}
            <Box
              position="fixed"
              top={0}
              left="410px"
              right={0}
              bottom={0}
              bg="blackAlpha.600"
              zIndex={999}
              onClick={() => {
                setIsOpen(false);
                if (onMobileClose) onMobileClose();
              }}
            />
          </>
        )}
      </>
    );
  }

  // Desktop View - Panels push content to the right
  return (
    <>
      {/* ---------- LEFT MINI SIDEBAR ---------- */}
      <MiniSidebar
        activePanel={activePanel}
        isOpen={isOpen}
        onMenuClick={() => handlePanelToggle("menu")}
        onChatClick={() => handlePanelToggle("chat")}
      />

      {/* ---------- RIGHT MAIN PANEL ---------- */}
      {activePanel === "menu" && isOpen && (
        <Box
          backgroundColor="black"
          color="white"
          minH="100vh"
          overflowY="auto"
          overflowX="hidden"
          borderRightWidth="1px"
          borderColor="gray.700"
          width="250px"
          transition="all 0.3s ease"
          position="relative"
          flexShrink={0}
        >
          <MainMenu />
        </Box>
      )}

      {/* ---------- CHATBOT PANEL ---------- */}
      {activePanel === "chat" && isOpen && (
        <Box
          backgroundColor="black"
          color="white"
          minH="100vh"
          width="350px"
          borderRight="1px solid #333"
          transition="all 0.3s ease"
          display="flex"
          flexDirection="column"
          position="relative"
          flexShrink={0}
        >
          <Chatbot onClose={handleChatbotClose} />
        </Box>
      )}
    </>
  );
};

export default SideNav;
