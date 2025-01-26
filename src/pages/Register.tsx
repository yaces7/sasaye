import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Step,
  Stepper,
  StepLabel
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createUser, checkEmailVerification, resendVerificationEmail } from '../backend/services/userService';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const steps = [
    'Hesap Bilgileri',
    'Email Doğrulama',
    'Kayıt Tamamlandı'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkVerification = async () => {
    setVerificationChecking(true);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setActiveStep(2);
        setVerificationDialogOpen(false);
        setSuccess('Email doğrulandı! Hesabınız başarıyla oluşturuldu.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError('Email henüz doğrulanmamış. Lütfen email adresinizi kontrol edin.');
      }
    } catch (error) {
      setError('Doğrulama kontrolü sırasında bir hata oluştu.');
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setSuccess('Doğrulama emaili tekrar gönderildi.');
    } catch (error) {
      setError('Doğrulama emaili gönderilirken bir hata oluştu.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form doğrulama
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await createUser(formData.name, formData.email, formData.password);
      setSuccess('Hesap oluşturuldu! Lütfen email adresinizi doğrulayın.');
      setActiveStep(1);
      setVerificationDialogOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, rgba(0,184,169,0.1) 0%, rgba(72,229,194,0.1) 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Kayıt Ol
          </Typography>

          {activeStep === 0 && (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: '1.1rem', py: 1.5 } }}
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: '1.1rem', py: 1.5 } }}
              />
              
              <TextField
                fullWidth
                label="Şifre"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                helperText="En az 6 karakter"
                sx={{ mb: 2, '& .MuiInputBase-input': { fontSize: '1.1rem', py: 1.5 } }}
              />
              
              <TextField
                fullWidth
                label="Şifre Tekrar"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                sx={{ mb: 3, '& .MuiInputBase-input': { fontSize: '1.1rem', py: 1.5 } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 2, 
                  mb: 3,
                  height: 48,
                  fontSize: '1.1rem'
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Kayıt Ol'}
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body1">
                  Zaten hesabınız var mı?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/login"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Giriş Yap
                  </Link>
                </Typography>
              </Box>
            </form>
          )}

          {activeStep === 1 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Email Doğrulama
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                Lütfen email adresinize gönderilen doğrulama linkine tıklayın.
              </Typography>
              <Button
                variant="contained"
                onClick={checkVerification}
                disabled={verificationChecking}
                sx={{ mr: 2, height: 48 }}
              >
                {verificationChecking ? <CircularProgress size={24} /> : 'Doğrulamayı Kontrol Et'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleResendVerification}
                disabled={verificationChecking}
                sx={{ height: 48 }}
              >
                Tekrar Gönder
              </Button>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Kayıt Tamamlandı!
              </Typography>
              <Typography variant="body1" paragraph>
                Hesabınız başarıyla oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...
              </Typography>
            </Box>
          )}
        </Paper>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        <Dialog 
          open={verificationDialogOpen} 
          onClose={() => setVerificationDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Email Doğrulama</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Email adresinize bir doğrulama bağlantısı gönderdik. Lütfen emailinizi kontrol edin ve bağlantıya tıklayın.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email gelmediyse spam klasörünü kontrol edin veya tekrar gönder butonuna tıklayın.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResendVerification}>Tekrar Gönder</Button>
            <Button onClick={checkVerification} variant="contained">
              Doğrulamayı Kontrol Et
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Register; 