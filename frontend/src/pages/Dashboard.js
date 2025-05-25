import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business,
  TrendingUp,
  People,
  Email,
  Phone,
  Euro,
  Refresh
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import api from '../services/api';

const COLORS = {
  'à contacter': '#2196f3',
  'en discussion': '#ff9800',
  'en négociation': '#f44336',
  'deal signé': '#4caf50',
  'abandonné': '#9e9e9e'
};

function StatCard({ title, value, subtitle, icon, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.3 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, refetch } = useQuery('stats', 
    () => api.get('/stats').then(res => res.data)
  );

  if (isLoading) {
    return <LinearProgress />;
  }

  const statusData = stats?.par_statut ? 
    Object.entries(stats.par_statut).map(([name, value]) => ({ name, value })) : [];

  const formatMoney = (amount) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Mds€`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} M€`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)} K€`;
    }
    return `${amount?.toFixed(0) || 0}€`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Tableau de bord
        </Typography>
        <Tooltip title="Actualiser">
          <IconButton onClick={() => refetch()}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Entreprises"
            value={stats?.total || 0}
            subtitle="Total unique"
            icon={<Business sx={{ fontSize: 40 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="CA Moyen"
            value={formatMoney(stats?.ca_moyen)}
            subtitle="Par entreprise"
            icon={<Euro sx={{ fontSize: 40 }} />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="CA Total"
            value={formatMoney(stats?.ca_total)}
            subtitle="Marché adressable"
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Emails"
            value={stats?.avec_email || 0}
            subtitle={`${stats?.taux_email?.toFixed(1) || 0}% de couverture`}
            icon={<Email sx={{ fontSize: 40 }} />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Téléphones"
            value={stats?.avec_telephone || 0}
            subtitle={`${stats?.taux_telephone?.toFixed(1) || 0}% de couverture`}
            icon={<Phone sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Effectif Moyen"
            value={Math.round(stats?.effectif_moyen || 0)}
            subtitle="Collaborateurs"
            icon={<People sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Répartition par statut
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Pipeline de prospection
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#3282b8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Activity Timeline */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Activité récente
        </Typography>
        <Box sx={{ mt: 2 }}>
          {[
            { time: 'Il y a 2 min', action: 'Nouveau scraping Pappers lancé', type: 'info' },
            { time: 'Il y a 15 min', action: 'Entreprise KPMG mise à jour', type: 'success' },
            { time: 'Il y a 1h', action: 'Export CSV généré (250 entreprises)', type: 'default' },
            { time: 'Il y a 2h', action: 'Enrichissement Infogreffe terminé', type: 'success' },
          ].map((activity, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption" sx={{ minWidth: 100, color: 'text.secondary' }}>
                {activity.time}
              </Typography>
              <Chip label={activity.action} size="small" color={activity.type} />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}