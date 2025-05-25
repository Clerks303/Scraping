import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Edit,
  Delete,
  Visibility,
  SwapHoriz,
  Euro,
  People,
  Email,
  Phone,
  Business
} from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import api from '../services/api';

function CompanyDetailsDialog({ open, onClose, siren }) {
  const [tabValue, setTabValue] = useState(0);
  const { data: company, isLoading } = useQuery(
    ['company', siren],
    () => api.get(`/companies/${siren}`).then(res => res.data),
    { enabled: !!siren }
  );

  if (isLoading) return <LinearProgress />;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {company?.nom_entreprise}
        <Chip 
          label={company?.statut} 
          size="small" 
          sx={{ ml: 2 }}
          color={company?.statut === 'deal signé' ? 'success' : 'default'}
        />
      </DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Informations générales" />
          <Tab label="Données financières" />
          <Tab label="Dirigeants" />
          <Tab label="Historique" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">SIREN</Typography>
                <Typography>{company?.siren}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Forme juridique</Typography>
                <Typography>{company?.forme_juridique || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography>{company?.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Téléphone</Typography>
                <Typography>{company?.telephone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Adresse</Typography>
                <Typography>{company?.adresse || 'N/A'}</Typography>
              </Grid>
              {company?.score_prospection && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Score de prospection</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={company.score_prospection} 
                      sx={{ flexGrow: 1, mr: 2 }}
                    />
                    <Typography>{Math.round(company.score_prospection)}%</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Chiffre d'affaires</Typography>
                <Typography variant="h6">
                  {company?.chiffre_affaires ? 
                    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(company.chiffre_affaires) 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Résultat</Typography>
                <Typography variant="h6">
                  {company?.resultat ? 
                    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(company.resultat) 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Effectif</Typography>
                <Typography variant="h6">{company?.effectif || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Capital social</Typography>
                <Typography>
                  {company?.capital_social ? 
                    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(company.capital_social) 
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date de création</Typography>
                <Typography>
                  {company?.date_creation ? 
                    format(new Date(company.date_creation), 'dd/MM/yyyy') 
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ mt: 2 }}>
            {company?.dirigeant_principal && (
              <>
                <Typography variant="subtitle2" gutterBottom>Dirigeant principal</Typography>
                <Typography>{company.dirigeant_principal}</Typography>
              </>
            )}
            {company?.dirigeants_json && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>Autres dirigeants</Typography>
                <List>
                  {JSON.parse(company.dirigeants_json).map((d, i) => (
                    <ListItem key={i}>
                      <ListItemText 
                        primary={d.nom_complet} 
                        secondary={d.qualite}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <Box sx={{ mt: 2 }}>
            <List>
              {company?.activity_logs?.map((log, i) => (
                <React.Fragment key={i}>
                  <ListItem>
                    <ListItemText
                      primary={log.action}
                      secondary={format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    />
                  </ListItem>
                  {i < company.activity_logs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button variant="contained" startIcon={<Edit />}>Modifier</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Companies() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    ca_min: '',
    effectif_min: '',
    ville: 'all',
    statut: 'all',
    search: ''
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: companies = [], isLoading } = useQuery(
    ['companies', filters],
    () => api.post('/companies/filter', filters).then(res => res.data)
  );

  const { data: cities = [] } = useQuery(
    'cities',
    () => api.get('/stats/cities').then(res => res.data.cities)
  );

  const deleteMutation = useMutation(
    (siren) => api.delete(`/companies/${siren}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
      }
    }
  );

  const columns = [
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" />
      )
    },
    {
      field: 'score_prospection',
      headerName: 'Score',
      width: 80,
      renderCell: (params) => params.value ? `${Math.round(params.value)}%` : '-'
    },
    { field: 'nom_entreprise', headerName: 'Entreprise', width: 250, flex: 1 },
    { field: 'siren', headerName: 'SIREN', width: 100 },
    {
      field: 'chiffre_affaires',
      headerName: 'CA (€)',
      width: 120,
      valueFormatter: (params) => params.value ? 
        new Intl.NumberFormat('fr-FR').format(params.value) : '-'
    },
    { field: 'effectif', headerName: 'Effectif', width: 80 },
    { field: 'dirigeant_principal', headerName: 'Dirigeant', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'telephone', headerName: 'Téléphone', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedCompany(params.row.siren);
              setDetailsOpen(true);
            }}
          >
            <Visibility />
          </IconButton>
          <IconButton size="small">
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              if (window.confirm('Supprimer cette entreprise ?')) {
                deleteMutation.mutate(params.row.siren);
              }
            }}
          >
            <Delete />
          </IconButton>
        </>
      )
    }
  ];

  const handleExport = async () => {
    const response = await api.post('/companies/export', filters, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Bibliothèque d'entreprises</Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Exporter CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              label="CA Minimum"
              type="number"
              fullWidth
              value={filters.ca_min}
              onChange={(e) => setFilters({ ...filters, ca_min: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Effectif Min"
              type="number"
              fullWidth
              value={filters.effectif_min}
              onChange={(e) => setFilters({ ...filters, effectif_min: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><People /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Ville</InputLabel>
              <Select
                value={filters.ville}
                onChange={(e) => setFilters({ ...filters, ville: e.target.value })}
                label="Ville"
              >
                <MenuItem value="all">Toutes</MenuItem>
                {cities.map(city => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                label="Statut"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="à contacter">À contacter</MenuItem>
                <MenuItem value="en discussion">En discussion</MenuItem>
                <MenuItem value="en négociation">En négociation</MenuItem>
                <MenuItem value="deal signé">Deal signé</MenuItem>
                <MenuItem value="abandonné">Abandonné</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Recherche"
              fullWidth
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setFilters({
                ca_min: '',
                effectif_min: '',
                ville: 'all',
                statut: 'all',
                search: ''
              })}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={companies}
          columns={columns}
          pageSize={50}
          rowsPerPageOptions={[25, 50, 100]}
          loading={isLoading}
          getRowId={(row) => row.siren}
          components={{
            Toolbar: GridToolbar,
          }}
          sx={{
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main',
            },
          }}
        />
      </Paper>

      {/* Company Details Dialog */}
      <CompanyDetailsDialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedCompany(null);
        }}
        siren={selectedCompany}
      />
    </Box>
  );
}