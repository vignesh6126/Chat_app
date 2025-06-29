import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserProfile } from '../services/userService';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  facebookProvider,
  googleProvider,
  twitterProvider,
  auth,
} from '../firebase';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGoogle,
  faFacebookF,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import {
  faEnvelope,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Divider,
  Paper,
  InputAdornment,
} from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user);
      } else {
        if (password !== confirmPassword) throw new Error("Passwords don't match");
        if (password.length < 6) throw new Error('Password should be at least 6 characters');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(userCredential.user, {
            displayName: fullName,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`,
          });
        }

        await saveUserToFirestore(userCredential.user);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.code === 'auth/account-exists-with-different-credential'
          ? 'An account already exists with this email'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#c3cfe2', p: 2 }}>
      <Paper elevation={4} sx={{ maxWidth: 460, width: '100%', p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom align="center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Typography>

        {error && (
          <Typography variant="body2" color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => handleSocialLogin(googleProvider)} disabled={loading} sx={{ bgcolor: '#db4437', color: '#fff' }}>
            <FontAwesomeIcon icon={faGoogle} />
          </IconButton>
          <IconButton onClick={() => handleSocialLogin(facebookProvider)} disabled={loading} sx={{ bgcolor: '#4267B2', color: '#fff' }}>
            <FontAwesomeIcon icon={faFacebookF} />
          </IconButton>
          <IconButton onClick={() => handleSocialLogin(twitterProvider)} disabled={loading} sx={{ bgcolor: '#1DA1F2', color: '#fff' }}>
            <FontAwesomeIcon icon={faTwitter} />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }}>or</Divider>

        <form onSubmit={handleEmailLogin}>
          {!isLogin && (
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faUser} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faEnvelope} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faLock} />
                </InputAdornment>
              ),
            }}
          />

          {!isLogin && (
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faLock} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2, py: 1 }}
            disabled={loading}
          >
            {loading ? <><CircularProgress size={20} sx={{ mr: 1 }} /> Processing...</> : isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        <Typography align="center" sx={{ mt: 2 }}>
          {isLogin ? (
            <>Don't have an account? <Button onClick={toggleForm}>Sign Up</Button></>
          ) : (
            <>Already have an account? <Button onClick={toggleForm}>Login</Button></>
          )}
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
