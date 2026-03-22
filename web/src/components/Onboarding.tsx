'use client';

import React, { useState } from 'react';
import { Box, Button, Card, Typography, TextField, Stack, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { motion } from 'framer-motion';
import { LEVELS } from '../types';

interface OnboardingProps {
  onComplete: (data: { startDate: string; startWeight: number; startPictureUrl: string | null; currentLevelId: string }) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [level, setLevel] = useState('1B');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    onComplete({
      startDate,
      startWeight: parseFloat(weight),
      startPictureUrl: pictureUrl,
      currentLevelId: level,
    });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h4" gutterBottom align="center" color="primary" fontWeight={800}>
          The Busy Dad Program
        </Typography>
        <Typography variant="body1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
          It's time to begin your journey. Start with your day 1 stats.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            
            <TextField
              label="Weight (lbs/kg)"
              type="number"
              fullWidth
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <FormControl fullWidth required>
              <InputLabel id="level-label">Starting Level</InputLabel>
              <Select
                labelId="level-label"
                value={level}
                label="Starting Level"
                onChange={(e) => setLevel(e.target.value)}
              >
                {LEVELS.map(lvl => (
                  <MenuItem key={lvl.id} value={lvl.id}>{lvl.name} - {lvl.description}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="icon-button-file">
                <Box sx={{ mb: 2 }}>
                  {pictureUrl ? (
                    <img src={pictureUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  ) : (
                    <Typography color="text.secondary">Upload a picture of yourself</Typography>
                  )}
                </Box>
                <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                  {pictureUrl ? 'Change Picture' : 'Take Picture'}
                </Button>
              </label>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2, py: 1.5, fontSize: '1.1rem' }}
            >
              Start the Program
            </Button>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
