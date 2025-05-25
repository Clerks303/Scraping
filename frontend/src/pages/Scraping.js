import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Storage,
  Language,
  Description,
  PlayArrow,
  Stop,
  CheckCircle,
  Error,
  Info,
  Upload,
  Refresh
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function ScrapingSource({ source, onStart }) {
  const [status, setStatus] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  React.useEffect(() => {
    checkStatus();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/scraping/status/${source.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
      
      if (!response.data.is_running && intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleStart = async () => {
    await onStart();
    const id = setInterval(checkStatus, 2000);
    setIntervalId(id);
    checkStatus();
  };

  const handleStop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const getIcon = () => {
    switch (source.id) {
      case 'pappers':
        return <Storage sx={{ fontSize: 40, color: 'primary.main' }} />;
      case 'societe':
        return <Language sx={{ fontSize: 40, color: 'secondary.main' }} />;
      case 'infogreffe':
        return <Description sx={{ fontSize: 40, color: 'success.main' }} />;
      default:
        return <Info sx={{ fontSize: 40 }} />;
    }
  };

  const getStatusChip = () => {
    if (!status) return null;
    
    if (status.is_running) {
      return <Chip label="En cours" color="primary" size="small" />;
    } else if (status.error) {
      return <Chip label="Erreur" color="error" size="small" />;
    } else if (status.progress === 100) {
      return <Chip label="Terminé" color="success" size="small" />;
    }
    return <Chip label="Prêt" color="default" size="small" />;
  };

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            {getIcon()}
            <Box>
              <Typography variant="h6">{source.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {source.description}
              </Typography>
            </Box>
          </Box>
          {getStatusChip()}
        </Box>

        {status && status.is_running && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">{status.message}</Typography>
              <Typography variant="body2">{status.progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={status.progress} />
            {(status.new_companies > 0 || status.skipped_companies > 0) && (
              <Box display="flex" gap={2} mt={1}>
                <Typography variant="caption" color="success.main">
                  +{status.new_companies} nouvelles
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {status.skipped_companies} ignorées
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {status && status.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {status.error}
          </Alert>
        )}
      </CardContent>

      <CardActions>
        {status && status.is_running ? (
          <Button 
            size="small" 
            color="error" 
            startIcon={<Stop />}
            onClick={handleStop}
            disabled
          >
            Arrêter
          </Button>
        ) : (
          <Button 
            size="small" 
            color="primary" 
            startIcon={<PlayArrow />}
            onClick={handleStart}
            disabled={status?.is_running}
          >
            Lancer
          </Button>
        )}
        <Button 
          size="small" 
          startIcon={<Refresh />}
          onClick={checkStatus}
        >
          Actualiser
        </Button>
      </CardActions>
    </Card>
  );
}

function UploadDialog({ open, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('update_existing', updateExisting);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/companies/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      setResult({ error: error.response?.data?.detail || 'Erreur upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importer un fichier CSV</DialogTitle>
      <DialogContent>
        {!result ? (
          <>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                mb: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography>
                Glissez-déposez votre fichier CSV ici ou cliquez pour sélectionner
              </Typography>
            </Box>

            {acceptedFiles.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Fichier sélectionné: {acceptedFiles[0].name}
              </Alert>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                />
              }
              label="Mettre à jour les entreprises existantes"
            />
          </>
        ) : (
          <Box>
            {result.error ? (
              <Alert severity="error">{result.error}</Alert>
            ) : (
              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  Import terminé avec succès !
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Total lignes traitées"
                      secondary={result.total_rows}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Nouvelles entreprises"
                      secondary={result.new_companies}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Entreprises mises à jour"
                      secondary={result.updated_companies}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Entreprises ignorées"
                      secondary={result.skipped_companies}
                    />
                  </ListItem>
                </List>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
        {!result && (
          <Button 
            variant="contained" 
            onClick={handleUpload}
            disabled={acceptedFiles.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
          >
            {uploading ? 'Upload en cours...' : 'Importer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default function Scraping() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [enrichmentParams, setEnrichmentParams] = useState({
    min_ca: 10000000,
    min_score: 70,
    siren: ''
  });

  const sources = [
    {
      id: 'pappers',
      name: 'Pappers API',
      description: 'Recherche via l\'API Pappers (quota: 1000/mois)'
    },
    {
      id: 'societe',
      name: 'Société.com',
      description: 'Scraping du site Société.com'
    },
    {
      id: 'infogreffe',
      name: 'Infogreffe',
      description: 'Enrichissement des données financières'
    }
  ];

  const startScrapingMutation = useMutation(
    async (sourceId) => {
      const token = localStorage.getItem('token');
      return axios.post(
        `${API_URL}/scraping/${sourceId}`,
        sourceId === 'infogreffe' ? enrichmentParams : {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    }
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Collecte de données
      </Typography>

      {/* Upload CSV */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import de données
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Importez vos propres listes d'entreprises au format CSV
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => setUploadOpen(true)}
        >
          Importer un fichier CSV
        </Button>
      </Paper>

      {/* Scraping Sources */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Sources de scraping
      </Typography>
      <Grid container spacing={3}>
        {sources.map((source) => (
          <Grid item xs={12} md={4} key={source.id}>
            <ScrapingSource
              source={source}
              onStart={() => startScrapingMutation.mutate(source.id)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Enrichment Parameters */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Paramètres d'enrichissement
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="CA minimum (€)"
              type="number"
              fullWidth
              value={enrichmentParams.min_ca}
              onChange={(e) => setEnrichmentParams({
                ...enrichmentParams,
                min_ca: parseInt(e.target.value)
              })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Score minimum"
              type="number"
              fullWidth
              value={enrichmentParams.min_score}
              onChange={(e) => setEnrichmentParams({
                ...enrichmentParams,
                min_score: parseInt(e.target.value)
              })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="SIREN spécifique (optionnel)"
              fullWidth
              value={enrichmentParams.siren}
              onChange={(e) => setEnrichmentParams({
                ...enrichmentParams,
                siren: e.target.value
              })}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Activity Log */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Historique récent
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Import CSV terminé"
              secondary="il y a 5 minutes - 150 nouvelles entreprises"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Info color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Scraping Pappers en cours"
              secondary="Département 75 - 45% complété"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Error color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Erreur Société.com"
              secondary="il y a 1 heure - Captcha détecté"
            />
          </ListItem>
        </List>
      </Paper>

      <UploadDialog 
        open={uploadOpen} 
        onClose={() => setUploadOpen(false)} 
      />
    </Box>
  );
}