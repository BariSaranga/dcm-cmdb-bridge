import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  alpha,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import WarningIcon from '@mui/icons-material/Warning';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import HistoryIcon from '@mui/icons-material/History';
import PaymentsIcon from '@mui/icons-material/Payments';
import { colors } from '../../theme/theme';

const DRAWER_WIDTH = 260;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/ai-assistant', label: 'AI Assistant', icon: <SmartToyIcon />, highlight: true },
  { path: '/lie-detector', label: 'Lie Detector', icon: <PsychologyIcon /> },
  { path: '/graph', label: 'Infrastructure Graph', icon: <AccountTreeIcon /> },
  { path: '/architecture', label: 'Architecture', icon: <ArchitectureIcon /> },
  { path: '/drifts', label: 'Drifts', icon: <WarningIcon /> },
  { path: '/actions', label: 'Actions', icon: <PlaylistAddCheckIcon /> },
  { path: '/audit', label: 'Audit Log', icon: <HistoryIcon /> },
  { path: '/pricing', label: 'Pricing', icon: <PaymentsIcon /> },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
        },
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.4)}`,
          }}
        >
          <AccountTreeIcon sx={{ fontSize: 20, color: '#fff' }} />
        </Box>
        <Box>
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: `linear-gradient(135deg, ${colors.text.primary} 0%, ${colors.primary.light} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            DCM-CMDB
          </Box>
          <Box
            sx={{
              fontSize: '0.7rem',
              color: colors.text.secondary,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Bridge
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, borderColor: colors.divider }} />

      {/* Navigation */}
      <List sx={{ pt: 2, px: 1.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  backgroundColor: isActive
                    ? alpha(colors.primary.main, 0.15)
                    : 'transparent',
                  border: isActive
                    ? `1px solid ${alpha(colors.primary.main, 0.3)}`
                    : '1px solid transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: isActive
                      ? alpha(colors.primary.main, 0.2)
                      : alpha(colors.text.primary, 0.04),
                    transform: 'translateX(4px)',
                  },
                  ...(isActive && {
                    boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.2)}`,
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? colors.primary.light : colors.text.secondary,
                    minWidth: 40,
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.875rem',
                      color: isActive ? colors.text.primary : colors.text.secondary,
                      transition: 'color 0.2s ease-in-out',
                    },
                  }}
                />
                {item.highlight && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: colors.success.main,
                      boxShadow: `0 0 8px ${colors.success.main}`,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: colors.divider }} />
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(colors.primary.main, 0.08),
            border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: colors.primary.light,
              mb: 0.5,
            }}
          >
            Infrastructure Lie Detector
          </Box>
          <Box
            sx={{
              fontSize: '0.7rem',
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            Detect drift between runtime and CMDB
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
