import { createTheme, ThemeOptions } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const themeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6",
    },
    secondary: {
      main: "#743ee4",
    },
    success: {
      main: "#10b981",
    },
    warning: {
      main: "#f59e0b",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    htmlFontSize: 14,
    h1: { color: "#6b7280", fontSize: "16px",fontWeight: 700 },
    h2: { color: "#6b7280",fontSize: "14px",fontWeight: 700 },
    h3: { color: "#6b7280" },
    h4: { color: "#6b7280" },
    h5: { color: "#6b7280" },
    h6: { color: "#6b7280", fontSize: "12px",fontWeight: 400 },
    body1: { color: "#6b7280" },  // default for <p>
    body2: { color: "#6b7280" },  // secondary body style
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid #E2E8F0",
          fontSize: "14px",
        },
        columnSeparator: {
          display: "none",   // remove separator
        },
        columnHeaders: {
          fontSize: "12px",
          fontWeight: 700,
          backgroundColor: "#F8FAFC",
          color: "#6b7280",
          minHeight: 36,
          maxHeight: 36,
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          
          '&:focus': {
            outline: "none",
          },
          "& .MuiDataGrid-sortIcon": {
            fontSize: "14px", 
            marginLeft: "2px",
          },
        },
        row: {
          fontSize: "12px",
          fontWeight: 400,
          minHeight: 36,
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          '&.MuiDataGrid-row--lastVisible': {
            borderBottom: "none",
          },
          '&:hover': {
            backgroundColor: "#f5f5f5",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            // 0 0 12px #76867926
          },
        },
        cell: {
          paddingTop: 12,
          paddingBottom: 12,
          color: "#6b7280",  
        },
      },
      defaultProps: {
        rowHeight: 36,
        columnHeaderHeight: 36,
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
         '& .MuiTablePagination-root': {
        minHeight: "36px",
        height: "36px",
        padding: 0,
        margin: 0,
      },
        },
        actions: {
          margin: 0,
          padding: 0,                 //  remove padding
          '& .MuiIconButton-root': {
            padding: 4,               //  smaller button padding
            margin: 0,
          },
          '& .MuiIconButton-root svg': {
            fontSize: 16,             // smaller arrow icons
          },
        },
        toolbar: {
          fontSize: "12px", // entire pagination toolbar text
          color: "#6b7280",
          minHeight: "36px",
        },
        selectLabel: {
          fontSize: "12px", // "Rows per page:" label
          color: "#6b7280",
        },
        displayedRows: {
          fontSize: "12px", // "1–10 of 50"
          color: "#6b7280",
        },
        select: {
          fontSize: "12px !important", // dropdown number (10, 25, 50)
          color: "#6b7280",
          minWidth:'35px !important',
        },
      },
    },
    
    MuiTextField: {
        styleOverrides: {
          root: {
            fontSize: "12px", // affects outer wrapper (for label)
          },
        },
      },
  
      // 🔹 Controls input font size, placeholder, and paddings
      MuiInputBase: {
        styleOverrides: {
          input: {
            fontSize: "12px", // 👈 input text size
            padding: "8px 12px",
            "::placeholder": {
              fontSize: "12px", // 👈 placeholder font size
              opacity: 0.4, // optional styling
            },
          },
        },
      },
  
      // 🔹 Controls Outlined variant borders, label, and font
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
          padding: "0px 8px !important",
        },
        root: {
            fontSize: "12px",
            padding: "8px 8px",
          },
          notchedOutline: {
          borderColor: "#cbd5e1",
        },
      },
    },
      // 🔹 Label styling (the floating label)
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: "12px",
          },
        },
      },
  
      // 🔹 Applies to Select fields (uses same InputBase)
      MuiSelect: {
        styleOverrides: {
          select: {
          padding: "0px 8px !important", // FIX EXTRA SPACE
          display: "flex",
          alignItems: "center",
          },
          icon: {
            fontSize: "14px", // Decrease dropdown icon size
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "12px", // font size of dropdown options
            paddingTop: 6,
            paddingBottom: 6,
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          option: {
            fontSize: "12px",
            minHeight: "28px",
          },
          noOptions: {
            fontSize: "12px",
          },
          popupIndicator: {
            fontSize: "14px", 
            // padding: "0 4px",
            "& svg": {
              fontSize: "14px", 
            },
          },
          clearIndicator: {
            fontSize: "14px",  
            // padding: "0 4px",
            "& svg": {
              fontSize: "14px", 
            },
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontSize: "14px",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          contained: {
            borderRadius: "8px",
            fontSize: "14px",
            textTransform: "none",
            // fontWeight: 700,
            // "&:hover": {
            //   backgroundColor: "transparent",
            //   color: "#743ee4",
            //   border: "1px solid #743ee4",
            // },
          },
          outlined: {
            borderRadius: "8px",
            fontSize: "14px",
            textTransform: "none",
            // fontWeight: 700,
            // "&:hover": {
            //   backgroundColor: "#743ee4", 
            //   color: "#ffffff", 
            // },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          label: {
            fontSize: "12px",   
            color: "#6b7280",   
            paddingLeft: "4px", // Add small padding between radio/checkbox and label
          },
          root: {
            marginLeft: 0, // optional tighter spacing
            marginRight: 0,
          }
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: "12px", 
            marginLeft: "0px",
            color: "#ef4444 !important", 
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardInfo: {
            borderRadius: "8px",
            backgroundColor: "#eff5ff",
            fontSize: "14px",
            color: "#3b82f6",    
            padding: "4px 16px",       
            // border: "1px solid #7dd3fc", 
            "& .MuiAlert-icon": {
            color: "#3b82f6",
          },
          },
         
        },
      },
      // 🔹 Calendar icon size for DatePicker/DateTimePicker
      MuiInputAdornment: {
        styleOverrides: {
          root: {
            "& .MuiIconButton-root": {
              // padding: "4px",
              "& svg": {
                fontSize: "14px", // Decrease calendar icon size
              },
            },
          },
        },
      },
      // 🔹 Chip size styling
      MuiChip: {
        styleOverrides: {
          root: {
            height: "20px", // Decrease chip height
            fontSize: "12px", // Decrease chip text size
            "& .MuiChip-label": {
              padding: "0 8px", // Decrease label padding
            },
            "& .MuiChip-icon": {
              fontSize: "14px", // Decrease icon size in chip
              marginLeft: "4px",
              marginRight: "-4px",
            },
            "& .MuiChip-deleteIcon": {
              fontSize: "14px", // Decrease delete icon size
              marginLeft: "4px",
              marginRight: "4px",
            },
          },
          sizeSmall: {
            height: "20px",
            fontSize: "12px",
            "& .MuiChip-label": {
              padding: "0 6px",
            },
            "& .MuiChip-icon": {
              fontSize: "12px",
            },
            "& .MuiChip-deleteIcon": {
              fontSize: "12px",
            },
          },
        },
      },
      // 🔹 RadioGroup and Radio size styling
      MuiRadio: {
        styleOverrides: {
          root: {
            padding: "4px", // Decrease radio button padding
            "& svg": {
              fontSize: "18px", // Decrease radio icon size (default is 20px)
            },
          },
          sizeSmall: {
            padding: "2px",
            "& svg": {
              fontSize: "16px",
            },
          },
        },
      },
      
    },

};

const muiTheme = createTheme(themeOptions);

export default muiTheme;
