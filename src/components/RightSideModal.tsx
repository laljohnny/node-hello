import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";

type RightSideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const RightSideModal: React.FC<RightSideModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      PaperProps={{
        sx: {
          position: "fixed",
          right: 0,
          top: 0,
          height: "100vh",
          maxHeight: "100vh",
          width: { xs: "100vw", sm: 400, md: 500 },
          maxWidth: { xs: "100vw", sm: 400, md: 500 },
          borderRadius: 0,
          boxShadow: 8,
          display: "flex",
          flexDirection: "column",
          margin: "0px",
          ml: "auto",
        },
      }}
    >
      <DialogTitle
        sx={{
          py: 1,
          px: 3,
          // color: "#1e3a8a",
          // bgcolor: "#e2ebf7",
          color:'#6b7280',
          bgcolor:'#fff',
          display: "flex",
          borderBottom: '1px solid #EFEFEF',
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box component="span" sx={{ flex: 1, fontWeight: 700,fontSize: "16px" }}>
          {title}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          edge="end"
          sx={{ color: "#1e3a8a" }}
        >
          <CloseIcon sx={{ fontSize: "16px" }} />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          flex: 1,
          p: 0,
          overflowY: "auto",
        }}
      >
        
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default RightSideModal;