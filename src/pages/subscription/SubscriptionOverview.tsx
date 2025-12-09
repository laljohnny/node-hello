import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SavingsIcon from "@mui/icons-material/Savings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { Download } from "lucide-react";
import SubscriptionPlanDialog from "./SubscriptionPlanDialog";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { subscriptionPlans } from "./subscriptionPlans";

type CardFormState = {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

const defaultCardForm: CardFormState = {
  cardholder: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

const paymentHistory = [
  { id: "INV-009", date: "Nov 01, 2025", amount: "$299.00", status: "Paid" },
  { id: "INV-008", date: "Oct 01, 2025", amount: "$299.00", status: "Paid" },
  { id: "INV-007", date: "Sep 01, 2025", amount: "$299.00", status: "Paid" },
];

const SubscriptionOverview: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cardForm, setCardForm] = useState<CardFormState>(defaultCardForm);
  const [savedCard, setSavedCard] = useState<CardFormState | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const maskedCardNumber = useMemo(() => {
    if (!savedCard?.cardNumber) {
      return "";
    }
    const last4 = savedCard.cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }, [savedCard]);

  const selectedPlan = useMemo(
    () => subscriptionPlans.find((plan) => plan.selected) ?? subscriptionPlans[0],
    []
  );

  const handleInputChange =
    (field: keyof CardFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setCardForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSaveCard = () => {
    setSavedCard(cardForm);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const isSaveDisabled =
    !cardForm.cardholder || !cardForm.cardNumber || !cardForm.expiry || !cardForm.cvv;

  const handleDownload = (invoiceId: string) => {
    // Handle download action
    console.log("Download invoice:", invoiceId);
    // Add your download logic here
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "Invoice", flex: 1, minWidth: 120 },
    { field: "date", headerName: "Date", flex: 1, minWidth: 150 },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => <span className="green-badge"  data-priority={params.value} > {params.value as string}  </span>,
      // <Chip sx={{fontSize:'12px',color:'#fff',padding:'2px 10px'}} label={params.value as string} color="success" size="small" />,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          color="primary"
          onClick={() => handleDownload(params.row.id)}
          startIcon={<Download size={16} />}
          sx={{ textTransform: "none", fontSize: "12px" }}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <Box>

      <div className="row mx-0">
        <div className="col-md-6 mb-3">
          <div className="card custom-card">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <div>
                <Typography variant="h2" sx={{marginBottom:'2px'}}>Current Plan</Typography>
                <Typography variant="h6"  fontWeight={400}>Your subscription details</Typography>
              </div>
              <div>
              <span className="green-badge"> Active  </span>
              </div>
            </div>
            <div className="card-body">
            {selectedPlan && (
            
              <div className="subscription-plan-card" >
                <div className="subscription-plan-card-header">
                    <div className='d-flex align-items-center'>
                    <Box
                    sx={{
                      bgcolor: "#FFFFFF33",
                      color: "#fff",
                      p: "12px",
                      borderRadius: "8px",
                      display: "inline-flex",
                    }}
                  >
                    {(() => {
                      const IconComponent = selectedPlan.icon;
                      return <IconComponent strokeWidth={1.5} size={24} />;
                    })()}
                  </Box>
                    <div className="ps-3">
                      <Typography variant="h1"  color="#fff" letterSpacing={'1px'}>{selectedPlan.name} Plan</Typography>
                      <Typography variant="h6" fontWeight={400} color="#DBEAFE">Professional features</Typography>
                    </div>
                    </div>
                    {selectedPlan.billedPrice && selectedPlan.period && (
                    <Box className="subscription-plan-price ">
                          <Typography className="my-3"
                            variant="h3"
                            fontWeight={400}
                            sx={{
                              color: '#fff',
                              fontSize: '48px',
                            }}
                          >
                            ${selectedPlan.price}<Typography variant="h6" sx={{display:'inline-block', marginLeft: '4px',fontSize:'14px',color:'#BEDBFF',position: 'relative', top: '-2px' }}>
                            {/* / {selectedPlan.period} */}/month
                          </Typography>
                          </Typography>
                          
                          <Typography variant="h2" fontWeight={400} color="#BEDBFF">
                            billed at ${selectedPlan.billedPrice}/yr
                          </Typography>
                        </Box>
                  )}
                </div>
                <div className="subscription-plan-card-body my-3">
                   <Typography variant="h6" className="mb-1" fontWeight={400}>Plan includes:</Typography>
                   <div className="row" style={{margin:'-4px'}}>
                    <div className="col-md-3" style={{padding:'4px'}}>
                     <div className="subscription-plan-card-feature">
                        <h5>Users</h5>
                        <p>1</p>
                      </div>
                    </div>
                    <div className="col-md-3" style={{padding:'4px'}}>
                     <div className="subscription-plan-card-feature">
                        <h5>Locations</h5>
                        <p>1</p>
                      </div>
                    </div>
                    <div className="col-md-3" style={{padding:'4px'}}>
                     <div className="subscription-plan-card-feature">
                        <h5>Assets</h5>
                        <p>100</p>
                      </div>
                    </div>
                    <div className="col-md-3" style={{padding:'4px'}}>
                     <div className="subscription-plan-card-feature">
                        <h5>Assets Storage</h5>
                        <p>100GB</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Stack spacing={2.5} alignItems="center">
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    fullWidth
                    onClick={() => setDialogOpen(true)}
                  >
                    Change Plan
                  </Button>
                </Stack>
              </div>
            )}
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card custom-card h-100">
            <div className="card-header py-2">
              <Typography variant="h2" sx={{marginBottom:'2px'}}>Payment Method</Typography>
              <Typography variant="h6" fontWeight='400'>Update your billing information</Typography>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-12 mb-3">
                  <TextField
                    label="Cardholder Name"
                    value={cardForm.cardholder}
                    onChange={handleInputChange("cardholder")}
                    fullWidth
                    size="small"
                  />
                </div>
                <div className="col-md-12 mb-3">
                  <TextField
                    label="Card Number"
                    value={cardForm.cardNumber}
                    onChange={handleInputChange("cardNumber")}
                    placeholder="1234 5678 9012 3456"
                    fullWidth
                    inputProps={{ maxLength: 19 }}
                    size="small"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <TextField
                      label="Expiry"
                      value={cardForm.expiry}
                      onChange={handleInputChange("expiry")}
                      placeholder="MM/YY"
                      fullWidth
                      size="small"
                    />
                </div>
                <div className="col-md-6 mb-3">
                <TextField
                      label="CVV"
                      value={cardForm.cvv}
                      onChange={handleInputChange("cvv")}
                      placeholder="123"
                      fullWidth
                      inputProps={{ maxLength: 4 }}
                      size="small"
                    />
                </div>
              </div>
              <Button className="my-3" variant="contained" size="small" color="primary" fullWidth onClick={handleSaveCard}>
                Save Card Details
              </Button>

              <Alert severity="info" >Your payment information is encrypted and secure</Alert>

            </div>
          </div>
        </div>
        <div className="col-md-12">
          <div className="card custom-card">
            <div className="card-header">
              <Typography variant="h2">Payment History</Typography>
              <Typography variant="h6" fontWeight='400'>View and download your past invoices</Typography>

            </div>
            <div className="card-body">
              <DataGrid
                  rows={paymentHistory}
                  columns={columns}
                  disableColumnMenu
                  disableRowSelectionOnClick
                  autoHeight
                  hideFooter
                />
            </div>
          </div>
        </div>
      </div>


      {/* <Grid container spacing={3}>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<ReceiptLongIcon color="action" fontSize="large" />}
              title={<Typography variant="h6">Payment History</Typography>}
              subheader="Recent invoices"
            />
            <CardContent>
              <Box sx={{ width: "100%" }}>
                <DataGrid
                  rows={paymentHistory}
                  columns={columns}
                  disableColumnMenu
                  disableRowSelectionOnClick
                  autoHeight
                  hideFooter
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      <SubscriptionPlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        currentPlan={selectedPlan?.name || "Premium"}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Card details saved successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionOverview;
