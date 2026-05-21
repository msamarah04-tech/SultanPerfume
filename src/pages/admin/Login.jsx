import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch {
      setError('Incorrect username or password');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-jet flex flex-col items-center justify-center p-4">
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 md:p-12 shadow-2xl rounded"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-jet" />
          </div>
          <h1 className="font-serif text-3xl text-jet mb-2">Admin Access</h1>
          <p className="font-sans text-sm text-gray-500">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            placeholder="admin"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            autoFocus
          />
          <Input
            type="password"
            label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            error={error}
          />
          <Button variant="primary" fullWidth type="submit" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
