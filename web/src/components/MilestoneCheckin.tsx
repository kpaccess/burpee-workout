'use client';

import React, { useState } from 'react';
import { Box, Button, Card, Typography, TextField, Stack } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { motion } from 'framer-motion';

interface MilestoneCheckinProps {
  onComplete: (data: { endDate: string; endWeight: number; endPictureUrl: string | null }) => void;
  onCancel: () => void;
}

export default function MilestoneCheckin({ onComplete, onCancel }: MilestoneCheckinProps) {
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

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
      endDate,
      endWeight: parseFloat(weight),
      endPictureUrl: pictureUrl,
    });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 2,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h4" gutterBottom align="center" color="secondary" fontWeight={800}>
          6 Month Check-in
        </Typography>
        <Typography variant="body1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
          It's been 6 months! Let's see your progress. Log your current weight and new picture.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Today's Date"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
            
            <TextField
              label="Current Weight (lbs/kg)"
              type="number"
              fullWidth
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <Box sx={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 2, p: 2, textAlign: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-button-file-end"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="icon-button-file-end">
                <Box sx={{ mb: 2 }}>
                  {pictureUrl ? (
                    <img src={pictureUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  ) : (
                    <Typography color="text.secondary">Upload your latest picture</Typography>
                  )}
                </Box>
                <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
                  {pictureUrl ? 'Change Picture' : 'Take Picture'}
                </Button>
              </label>
            </Box>

            <Stack direction="row" spacing={2} mt={2}>
              <Button onClick={onCancel} variant="text" size="large" fullWidth>
                Remind Me Later
              </Button>
              <Button type="submit" variant="contained" color="secondary" size="large" fullWidth>
                Log Progress
              </Button>
            </Stack>
          </Stack>
        </form>
      </Card>
    </Box>
  );
}
