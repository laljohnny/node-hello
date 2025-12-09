import React, { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  IconButton,
  Slide,
  Stack,
  Toolbar,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { TransitionProps } from "@mui/material/transitions";
import { Check, X, Phone, Mail } from "lucide-react";
import {
  subscriptionPlans,
  planFeatureMeta,
  featureRows,
  PlanId,
} from "./subscriptionPlans";

type BillingCycle = "monthly" | "annual";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type SubscriptionPlanDialogProps = {
  open: boolean;
  onClose: () => void;
  currentPlan: string;
};

const SubscriptionPlanDialog: React.FC<SubscriptionPlanDialogProps> = ({
  open,
  onClose,
  currentPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check size={18} color={theme.palette.success.main} />
      ) : (
        <X size={18} color={theme.palette.error.main} />
      );
    }

    return (
      <Typography variant="body2" color="text.primary">
        {value}
      </Typography>
    );
  };
  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <AppBar sx={{ position: "sticky", top: 0 }}>
        <Toolbar>
          
          <Typography  sx={{  flex: 1, color:'#fff', fontSize:'16px' }} variant="h2" component="div">
            Choose a subscription plan
          </Typography>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box p={{ xs: 3, md: 3 }} bgcolor="background.default">
      <Alert severity="info" sx={{fontSize:'14px'}}>14-day free trial for all plans. No risk! Upgrade, downgrade or cancel any time.</Alert>
        <Stack>
          {/* <Box>
            <Typography variant="h4" gutterBottom>
              Stay aligned with your resilience objectives
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compare plans, adjust billing cycles, and select the coverage that matches your
              portfolio.
            </Typography>
          </Box> */}

          {/* <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant={billingCycle === "monthly" ? "contained" : "outlined"}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly Billing
            </Button>
            <Button
              variant={billingCycle === "annual" ? "contained" : "outlined"}
              onClick={() => setBillingCycle("annual")}
            >
              Annual Billing <Chip label="Save 2 months" color="success" size="small" sx={{ ml: 1 }} />
            </Button>
          </Stack> */}

          <div className="subscription-plans-container row mx-0 mt-4 mb-3">
          {subscriptionPlans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12" key={plan.id}>
                <Box className="subscription-plan-card position-relative" sx={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                }}>
                <Card
                  elevation={plan.id === 'premium' ? 12 : 2}
                  sx={{
                    height: '100%',
                    // position: 'relative',
                    borderRadius: '16px',
                    boxShadow: '0 0 6px #7faee052',
                    bgcolor: plan.color,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: plan.id === 'premium' ? '2px solid #3b82f6' : '2px solid transparent',
                    '&:hover': {
                    //   transform: 'translateY(-8px)',
                      // boxShadow: theme.shadows[16],
                      border: '2px solid #3b82f6',
                    },
                  }}
                >
                  {plan.badge && (
                    <Box className="subscription-plan-badge"
                    >
                      <Typography>
                        {plan.badge}
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ padding:'20px 12px 12px !important', textAlign: 'left' }}>
                  <div className='d-flex align-items-center'>
                    <Box
                    sx={{
                      bgcolor: "#1e3a8a",
                      color: "#fff",
                      p: "12px",
                      borderRadius: "8px",
                      display: "inline-flex",
                    }}
                  >
                    <IconComponent strokeWidth={1.5} size={24} />
                    
                  </Box>
                    <div className="ps-3">
                      <Typography variant="h1"  color="#1e3a8a" letterSpacing={'1px'}> {plan.name} Plan</Typography>
                      <Typography variant="h6" fontWeight={400} color="#1e3a8a">{plan.subText}</Typography>
                    </div>
                    </div>
                    <Stack spacing={2.5} alignItems="left">
                      {/* <Box
                        sx={{
                          border: "1px solid #743ee4",
                          color: "#743ee4",
                          p: 1.25,
                          borderRadius: 2,
                          display: 'inline-flex',
                        }}
                      >
                        <IconComponent size={28} />
                      </Box>

                      <Typography
                        variant="h2" sx={{fontSize:'16px'}}
                        fontWeight={600}
                        color={plan.id === 'professional' ? '#743ee4' : '#743ee4'}
                      >
                        {plan.name}
                      </Typography> */}

                      {plan.contactSales ? (
                        <Box className="subscription-plan-contact-sales mt-3" sx={{paddingBottom:'4px', minHeight:'80px'}}>
                          <Typography variant="h6" className="mb-2" gutterBottom>
                            Contact Sales
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Phone size={14} color="#1e3a8a" />
                            <Typography variant="h2" color="#1e3a8a">
                              833-744-1010
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Mail size={14} color="#1e3a8a" />
                            <Typography variant="h2" color="#1e3a8a" sx={{ wordBreak: 'break-word' }}>
                              sales@criticalasset.com
                            </Typography>
                          </Box>
                          {/* {plan.id === 'professional' && (
                        <Typography variant="h2">
                          For Approved Contractors only
                        </Typography>
                      )} */}
                        </Box>
                      ) : (
                        <Box className="subscription-plan-price">
                          <Typography className="mt-3 mb-1"
                            variant="h3"
                            fontWeight={700}
                            sx={{
                              color: plan.id === 'premium' ? '#1e3a8a' : '#1e3a8a',
                              fontSize: '48px',
                            }}
                          >
                            ${plan.price}<Typography variant="h6" sx={{display:'inline-block', marginLeft: '4px',fontSize:'14px',position: 'relative', top: '-2px' }}>
                            / {plan.period}
                          </Typography>
                          </Typography>
                          
                          <Typography variant="h6">
                            billed at ${plan.billedPrice}/yr
                          </Typography>
                        </Box>
                      )}

                      <Button
                        // variant={plan.id === 'ultimate' || plan.id === 'professional' ? 'contained' : 'outlined'}
                        variant='contained'
                        size="small"
                        color='primary'
                        fullWidth
                        // sx={{
                        //   py: 1.25,
                        //   fontWeight: 600,
                        //   fontSize: '0.75rem',
                        //   bgcolor:
                        //     plan.id === 'ultimate'
                        //       ? '#f59e0b'
                        //       : plan.id === 'professional'
                        //       ? '#f59e0b'
                        //       : 'transparent',
                        //   color:
                        //     plan.id === 'ultimate'
                        //       ? '#1F2937'
                        //       : plan.id === 'professional'
                        //       ? '#1F2937'
                        //       : plan.id === 'premium'
                        //       ? '#3b82f6'
                        //       : '#1e3a8a',
                        //   borderColor:
                        //     plan.id === 'ultimate' || plan.id === 'professional'
                        //       ? 'transparent'
                        //       : plan.id === 'premium'
                        //       ? '#3b82f6'
                        //       : '#1e3a8a',
                        //   border: '2px solid',
                        //   textTransform: 'uppercase',
                        //   letterSpacing: 0.5,
                        //   '&:hover': {
                        //     bgcolor:
                        //       plan.id === 'ultimate' || plan.id === 'professional'
                        //         ? '#d97706'
                        //         : 'rgba(255, 255, 255, 0.5)',
                        //     borderColor:
                        //       plan.id === 'ultimate' || plan.id === 'professional'
                        //         ? 'transparent'
                        //         : plan.id === 'premium'
                        //         ? '#3b82f6'
                        //         : '#1e3a8a',
                        //   },
                        // }}
                      >
                        {plan.contactSales ? 'Apply' : 'Start Your Free Trial'}
                      </Button>

                      <div className="row mt-3" style={{margin:'-4px'}}>
                      <Typography variant="h6" fontWeight={400}>Plan includes:</Typography>
                      {plan.features && (
                        <>
                        {planFeatureMeta.map(({ key, label }) => (
                              <div className="col-md-6 mt-1" style={{padding:'4px'}}>
                              <div className="subscription-plan-card-feature">
                                  <h5> {label}</h5>
                                  <p>{plan.features?.[key]}</p>
                                </div>
                              </div>
                            ))}
                       
                        </>
                      )}
                      </div>
                    </Stack>
                  </CardContent>
                </Card>
                </Box>
              </div>
            );
          })}
        </div>

        <div className="subscription-feature-comparison-container">
            <div className='card custom-card'>
                <div className='card-header'>
                <Typography variant="h2">Feature Comparison</Typography>
                </div>
                <div className='card-body p-0'>
                    <div className='table-responsive'>
                     <TableContainer
                       sx={{
                         overflowX: "auto",
                         maxHeight: isMobile ? 360 : "unset",
                       }}
                     >
                       <Table className="subscription-feature-comparison-table"
                         sx={{
                           minWidth: isTablet ? 720 : 960,
                           "& .MuiTableCell-root": {
                             borderColor: theme.palette.divider,
                           },
                         }}
                       >
                         <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                           <TableRow
                             sx={{
                               "& .MuiTableCell-root": {
                                 fontSize: "14px",
                                 fontWeight: 600,
                                 textAlign: "center",
                                 color: theme.palette.text.secondary,
                                 py: 1.5,
                               },
                             }}
                           >
                             <TableCell
                               align="center"
                               sx={{
                                 position: "sticky",
                                 left: 0,
                                 zIndex: 3,
                                //  backgroundColor: theme.palette.background.paper,
                                 backgroundColor: '#F8FAFC',
                                 boxShadow: `inset -1px 0 0 #EFEFEF`,
                                 borderColor:'#EFEFEF !important',
                               }}
                             >
                               Features
                             </TableCell>
                              {subscriptionPlans.map((plan) => (
                                <TableCell sx={{ borderColor: '#EFEFEF' }} key={plan.id} align="center">
                                  {plan.name}
                                </TableCell>
                              ))}
                           </TableRow>
                         </TableHead>
                         <TableBody>
                           {featureRows.map((row) => (
                             <TableRow
                               key={row.label}
                               sx={{
                                 "&:nth-of-type(odd)": {
                                   backgroundColor: theme.palette.action.hover,
                                 },
                                 "& .MuiTableCell-root": {
                                   fontSize: "14px",
                                   textAlign: "center",
                                   py: 1.25,
                                 },
                               }}
                             >
                               <TableCell
                                 align="center"
                                 sx={{
                                   position: "sticky",
                                   left: 0,
                                   zIndex: 2,
                                   backgroundColor: theme.palette.background.paper,
                                   boxShadow: `inset -1px 0 0 #EFEFEF`,
                                   borderColor:'#EFEFEF !important',
                                 }}
                               >
                                 <Stack
                                   direction="row"
                                   spacing={0.75}
                                   alignItems="center"
                                   justifyContent="flex-start"
                                 >
                                   <Typography fontSize="14px" fontWeight={700}>{row.label}</Typography>
                                   {row.tooltip && (
                                     <Tooltip title={row.tooltip}>
                                       <InfoOutlinedIcon sx={{ fontSize: '18px' }} color="disabled" />
                                     </Tooltip>
                                   )}
                                 </Stack>
                               </TableCell>
                               {subscriptionPlans.map((plan) => (
                                 <TableCell
                                   key={plan.id}
                                   align="center"
                                   sx={{
                                     minWidth: 140,
                                     px: 2,
                                     borderColor:'#EFEFEF !important',
                                   }}
                                 >
                                   <Box
                                     display="flex"
                                     alignItems="center"
                                     justifyContent="center"
                                   >
                                     {renderFeatureValue(row.values[plan.id as PlanId])}
                                   </Box>
                                 </TableCell>
                               ))}
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                     </TableContainer>
                    </div>
                </div>
            </div>
        </div>
          
        </Stack>
      </Box>
    </Dialog>
  );
};

export default SubscriptionPlanDialog;