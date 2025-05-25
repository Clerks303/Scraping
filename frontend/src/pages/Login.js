import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

const validationSchema = yup.object({
  username: yup.string().required('Nom d\'utilisateur requis'),
  password: yup.string().required('Mot de passe requis'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState('');

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        await login(values.username, values.password);
        navigate('/dashboard');
      } catch (err) {
        setError('Identifiants incorrects');
      }
    },
  });

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" align="center" gutterBottom>
          M&A Intelligence Platform
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
          Connectez-vous pour accéder à la plateforme
        </Typography>
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            id="username"
            name="username"
            label="Nom d'utilisateur"
            value={formik.values.username}
            onChange={formik.handleChange}
            error={formik.touched.username && Boolean(formik.errors.username)}
            helperText={formik.touched.username && formik.errors.username}
            margin="normal"
          />
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Mot de passe"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            margin="normal"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={formik.isSubmitting}
          >
            Se connecter
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 2 }}>
          Utilisateur: admin / Mot de passe: secret
        </Typography>
      </Paper>
    </Box>
  );
}