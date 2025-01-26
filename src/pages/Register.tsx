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
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../backend/firebase';
import { generateCustomId } from '../utils/generateCustomId';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Şifre kontrolü
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }

      // Firebase'de kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Email doğrulama gönder
      await sendEmailVerification(userCredential.user);

      // Kullanıcı için benzersiz ID oluştur
      const customId = generateCustomId();

      // Firestore'a kullanıcı bilgilerini kaydet
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        username: formData.username,
        customId,
        avatar: '',
        bio: '',
        theme: 'light',
        interests: [],
        createdAt: new Date(),
        isEmailVerified: false
      });

      // Kullanıcı ayarlarını oluştur
      await setDoc(doc(db, 'userSettings', userCredential.user.uid), {
        emailNotifications: true,
        privateProfile: false,
        theme: 'light',
        language: 'tr'
      });

      setActiveStep(1);
      setVerificationDialogOpen(true);
      setSuccess('Hesabınız oluşturuldu! Lütfen email adresinizi doğrulayın.');

      // LocalStorage'a kullanıcı bilgilerini kaydet
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: formData.email,
        username: formData.username,
        customId
      }));
      localStorage.setItem('isLoggedIn', 'true');

    } catch (error: any) {
      setError(error.message);
      console.error('Kayıt hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    setVerificationChecking(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          // Firestore'da email doğrulama durumunu güncelle
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            isEmailVerified: true
          });

          setActiveStep(2);
          setVerificationDialogOpen(false);
          setSuccess('Email doğrulandı! Hesabınız başarıyla oluşturuldu.');
          
          // Kullanıcıyı ana sayfaya yönlendir
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setError('Email henüz doğrulanmamış. Lütfen email adresinizi kontrol edin.');
        }
      }
    } catch (error) {
      setError('Doğrulama kontrolü sırasında bir hata oluştu.');
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccess('Doğrulama emaili tekrar gönderildi.');
      }
    } catch (error) {
      setError('Doğrulama emaili gönderilirken bir hata oluştu.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" align="center">
            Kayıt Ol
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="username"
                label="Kullanıcı Adı"
                fullWidth
                required
                value={formData.username}
                onChange={handleChange}
                disabled={loading || activeStep > 0}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={handleChange}
                disabled={loading || activeStep > 0}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label="Şifre"
                type="password"
                fullWidth
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading || activeStep > 0}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="confirmPassword"
                label="Şifre Tekrar"
                type="password"
                fullWidth
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading || activeStep > 0}
              />
            </Grid>
          </Grid>

          {activeStep === 0 && (
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Kayıt Ol'}
            </Button>
          )}
        </form>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" align="center">
            Zaten hesabınız var mı?{' '}
            <Link component={RouterLink} to="/login">
              Giriş Yap
            </Link>
          </Typography>
        </Box>
      </Paper>

      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)}>
        <DialogTitle>Email Doğrulama</DialogTitle>
        <DialogContent>
          <Typography>
            Lütfen email adresinize gönderilen doğrulama linkine tıklayın ve ardından doğrulama
            durumunu kontrol edin.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResendVerification} disabled={verificationChecking}>
            Tekrar Gönder
          </Button>
          <Button onClick={checkVerification} disabled={verificationChecking}>
            {verificationChecking ? <CircularProgress size={24} /> : 'Doğrulama Durumunu Kontrol Et'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        message={success}
      />
    </Container>
  );
};

export default Register; 