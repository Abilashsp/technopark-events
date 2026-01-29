import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop';

export default function HeroSection({ isMobile, children }) {
    return (
        <Box
            sx={{
                position: 'relative',
                height: { xs: 320, md: 480 }, // Taller on mobile to fit text
                width: '100%',
                bgcolor: '#ebf2fa',
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                // RESPONSIVE MARGIN BOTTOM: 
                // Mobile needs huge space (240px) because the filter bar stacks vertically.
                // Desktop needs less space (64px) because the bar is horizontal.
                mb: { xs: 30, md: 8 }
            }}
        >
            {/* Background Image */}
            <Box
                component="img"
                src={HERO_IMAGE_URL}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.15,
                    zIndex: 0
                }}
            />

            {/* Hero Text */}
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: { xs: 4, md: 6 }, px: 2 }}>
                <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                        fontWeight: 800,
                        color: '#1a1a1a',
                        letterSpacing: '-0.02em',
                        mb: 2,
                        fontSize: { xs: '2rem', md: '3.5rem' },
                        lineHeight: 1.2
                    }}
                >
                    Discover TechnoPark Events
                </Typography>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#555',
                        fontWeight: 400,
                        maxWidth: 600,
                        mx: 'auto',
                        fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                >
                    Connect, Collaborate, and Celebrate in Your Campus
                </Typography>
            </Container>

            {children}
        </Box>
    );
}
