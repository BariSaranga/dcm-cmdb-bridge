import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Skeleton,
  Alert,
  alpha,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { PageContainer } from '../../components/layout';
import { usePricingTiers } from '../../api/hooks/useBilling';
import { colors } from '../../theme/theme';

const tierIcons: Record<string, React.ReactNode> = {
  free: <StarIcon />,
  team: <RocketLaunchIcon />,
  business: <BusinessIcon />,
  enterprise: <WorkspacePremiumIcon />,
};

const tierColors: Record<string, string> = {
  free: colors.text.secondary,
  team: colors.info.main,
  business: colors.primary.main,
  enterprise: colors.secondary.main,
};

export function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const { data: tiers, isLoading, error } = usePricingTiers();

  if (error) {
    return (
      <PageContainer title="Pricing">
        <Alert severity="error">
          Failed to load pricing data. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Pricing">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: `linear-gradient(135deg, ${colors.text.primary} 0%, ${colors.primary.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Stop maintaining your CMDB manually. Let runtime truth drive organizational accountability.
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={annual}
              onChange={(e) => setAnnual(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: colors.primary.main,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: colors.primary.main,
                },
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Annual billing</Typography>
              <Chip
                label="Save 20%"
                size="small"
                sx={{
                  backgroundColor: alpha(colors.success.main, 0.15),
                  color: colors.success.light,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
          }
        />
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={500}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))
          : tiers?.map((tier) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={tier.tier}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    background: tier.popular
                      ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.15)} 0%, ${alpha(colors.primary.dark, 0.1)} 100%)`
                      : `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
                    border: tier.popular
                      ? `2px solid ${colors.primary.main}`
                      : `1px solid ${colors.divider}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${alpha(tierColors[tier.tier] || colors.primary.main, 0.3)}`,
                    },
                  }}
                >
                  {tier.popular && (
                    <Chip
                      label="Most Popular"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
                        color: colors.text.primary,
                        fontWeight: 600,
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          backgroundColor: alpha(tierColors[tier.tier] || colors.primary.main, 0.15),
                          color: tierColors[tier.tier] || colors.primary.main,
                          display: 'flex',
                        }}
                      >
                        {tierIcons[tier.tier]}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                          {tier.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tier.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      {tier.price_monthly === null ? (
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 700, color: colors.text.primary }}
                        >
                          Custom
                        </Typography>
                      ) : tier.price_monthly === 0 ? (
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 700, color: colors.text.primary }}
                        >
                          Free
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography
                            variant="h4"
                            sx={{ fontWeight: 700, color: colors.text.primary }}
                          >
                            ${annual ? tier.price_annual : tier.price_monthly}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            /month
                          </Typography>
                        </Box>
                      )}
                      {tier.price_monthly !== null && tier.price_monthly !== 0 && annual && (
                        <Typography
                          variant="caption"
                          sx={{ color: colors.success.main }}
                        >
                          Save ${((tier.price_monthly! - tier.price_annual!) * 12).toLocaleString()}/year
                        </Typography>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant={tier.popular ? 'contained' : 'outlined'}
                      size="large"
                      sx={{
                        mb: 3,
                        py: 1.5,
                        ...(tier.popular
                          ? {}
                          : {
                              borderColor: tierColors[tier.tier] || colors.divider,
                              color: tierColors[tier.tier] || colors.text.primary,
                              '&:hover': {
                                borderColor: tierColors[tier.tier],
                                backgroundColor: alpha(tierColors[tier.tier] || colors.primary.main, 0.1),
                              },
                            }),
                      }}
                    >
                      {tier.cta}
                    </Button>

                    <List dense sx={{ p: 0 }}>
                      {tier.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon
                              sx={{
                                fontSize: 18,
                                color: tierColors[tier.tier] || colors.success.main,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: colors.text.secondary,
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Need a Custom Solution?
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          Contact our sales team for custom enterprise deployments, on-premise options,
          and volume discounts.
        </Typography>
        <Button
          variant="outlined"
          size="large"
          sx={{
            borderColor: colors.secondary.main,
            color: colors.secondary.main,
            '&:hover': {
              borderColor: colors.secondary.light,
              backgroundColor: alpha(colors.secondary.main, 0.1),
            },
          }}
        >
          Contact Sales
        </Button>
      </Box>

      <Box
        sx={{
          mt: 8,
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.1)} 0%, ${alpha(colors.secondary.main, 0.1)} 100%)`,
          border: `1px solid ${colors.divider}`,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Start your 14-day free trial
            </Typography>
            <Typography color="text.secondary">
              No credit card required. Full access to all Business features.
              Cancel anytime.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button variant="contained" size="large" sx={{ px: 4 }}>
              Start Free Trial
            </Button>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
