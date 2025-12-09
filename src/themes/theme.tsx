// themes/baseTheme.ts
import { border, extendTheme } from "@chakra-ui/react";
import { roleColors } from "./colors";

export const getRoleTheme = (role: string = 'user') => {
  const colors = roleColors[role] || roleColors["user"];

  return extendTheme({
    textStyles: {
      xxl: { fontSize: "24px", fontWeight: "700" },
      xl: { fontSize: "18px", fontWeight: "700" },
      lg: { fontSize: "16px", fontWeight: "700" },
      md: { fontSize: "14px", fontWeight: "700" },
      sm: { fontSize: "12px", fontWeight: "400" },
      xs: { fontSize: "11px", fontWeight: "400" },
    },
    styles: {
      global: {
        body: {
          bg: colors.background,
          // color: colors.text,
          color: "#6b7280",
        },
        ".chakra-card": {
        // backgroundColor: "#f9fafb", 
        // border: "1px solid #e2e8f0", 
        borderRadius: "8px !important",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        fontFamily: "Inter, sans-serif",
      },
      // Card Header
      ".chakra-card__header": {
        padding: "8px 16px !important",
        // backgroundColor: "#edf2f7", 
        borderBottom: "1px solid #e2e8f0",
        fontWeight: "700",
        fontSize: "18px",
        color: "#6b7280",
        borderRadius:'8px 8px 0 0 !important'
      },
      // Card Body
      ".chakra-card__body": {
        padding: "16px !important",
        fontSize: "14px",
        color: "#4a5568",
      },
      // Card Footer
      // ".chakra-card__footer": {
      //   padding: "6px 16px !important",
        
      // },
        
      },
    },
    colors: {
        role: {
          background: colors.background,
          cardBg: colors.cardBg,
          text: colors.text,
        },
      },
    components: {
      Card: {
        baseStyle: {
          bg: colors.cardBg,
          borderColor: colors.cardBorder,
          borderWidth: "1px",
          borderRadius: "md",
          boxShadow: "sm",
        },
      },
      Tabs: {
        variants: {
          "soft-rounded": {
            tab: {
              borderRadius: "8px",
              fontWeight: "400",
              color:'#6b7280',
              fontSize: "14px",
              _selected: {
                bg: "#1e3a8a",
                color: "white",
              },
            },
          },
        },
      },
      Heading: {
        baseStyle: {
          color: "#6b7280", 
        },
        sizes: {
          xxl: { fontSize: "24px", fontWeight: "700" },  // H1 style
          xl: { fontSize: "18px", fontWeight: "700" },   // H2 style
          lg: { fontSize: "16px", fontWeight: "700" },   // H3 style
          md: { fontSize: "14px", fontWeight: "700" },   // H4 style
          sm: { fontSize: "12px", fontWeight: "400" },   // H5 style
          xs: { fontSize: "11px", fontWeight: "400" },   // H6 style
        },
        
      },
    },
    fonts: {
        heading: `'Inter', sans-serif`,  
        body: `'Inter', sans-serif`,    
      },
  });
};
