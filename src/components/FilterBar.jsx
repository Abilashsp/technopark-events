import React from 'react';
import {
    Container,
    Paper,
    Box,
    InputBase,
    Divider,
    Select,
    MenuItem,
    Button
} from '@mui/material';
import {
    Search,
    LocationCity,
    CalendarToday
} from '@mui/icons-material';
import { BUILDING_FILTERS, DATE_FILTERS } from '../constants/dateFilters';

export default function FilterBar({
    isMobile,
    localSearch,
    setLocalSearch,
    handleTriggerSearch,
    localBuilding,
    setLocalBuilding,
    localDate,
    setLocalDate
}) {
    return (
        <Container
            maxWidth="lg"
            sx={{
                position: 'absolute',
                top: 'auto',
                bottom: { xs: -220, md: -36 },
                left: 0,
                right: 0,
                zIndex: 10,
                px: { xs: 2, md: 4 }
            }}
        >
            <Paper
                elevation={4}
                sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: '#fff',
                    maxWidth: 1000,
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: { xs: 2, md: 0 }
                }}
            >
                {/* 1. SEARCH INPUT */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1.5, px: { xs: 0, md: 2 }, width: '100%' }}>
                    <Search sx={{ color: 'primary.main', mr: 1.5 }} />
                    <InputBase
                        placeholder="Search events..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTriggerSearch()}
                        fullWidth
                        sx={{ fontSize: '1rem', py: 1 }}
                    />
                </Box>

                {!isMobile && <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto', bgcolor: '#e0e0e0' }} />}
                {isMobile && <Divider flexItem sx={{ width: '100%', bgcolor: '#f0f0f0' }} />}

                {/* 2. BUILDING SELECT */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, px: { xs: 0, md: 2 }, width: '100%' }}>
                    <LocationCity sx={{ color: 'text.secondary', mr: 1.5 }} />
                    <Select
                        value={localBuilding}
                        onChange={(e) => setLocalBuilding(e.target.value)}
                        displayEmpty
                        variant="standard"
                        disableUnderline
                        fullWidth
                        sx={{
                            '.MuiSelect-select': { py: 1, display: 'flex', alignItems: 'center' },
                            fontSize: '0.95rem'
                        }}
                    >
                        <MenuItem value="All">All Buildings</MenuItem>
                        {BUILDING_FILTERS.map((b) => (
                            <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>
                        ))}
                    </Select>
                </Box>

                {!isMobile && <Divider orientation="vertical" flexItem sx={{ height: 32, my: 'auto', bgcolor: '#e0e0e0' }} />}
                {isMobile && <Divider flexItem sx={{ width: '100%', bgcolor: '#f0f0f0' }} />}

                {/* 3. DATE SELECT */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, px: { xs: 0, md: 2 }, width: '100%' }}>
                    <CalendarToday sx={{ color: 'text.secondary', mr: 1.5 }} />
                    <Select
                        value={localDate}
                        onChange={(e) => setLocalDate(e.target.value)}
                        displayEmpty
                        variant="standard"
                        disableUnderline
                        fullWidth
                        sx={{
                            '.MuiSelect-select': { py: 1, display: 'flex', alignItems: 'center' },
                            fontSize: '0.95rem'
                        }}
                    >
                        {DATE_FILTERS.map((d) => (
                            <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                        ))}
                    </Select>
                </Box>

                {/* 4. SEARCH BUTTON */}
                <Button
                    variant="contained"
                    onClick={handleTriggerSearch}
                    disableElevation
                    sx={{
                        px: 4,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '1rem',
                        bgcolor: '#1a73e8',
                        ml: { xs: 0, md: 1 },
                        width: { xs: '100%', md: 'auto' },
                        mt: { xs: 1, md: 0 },
                        height: 48,
                        '&:hover': { bgcolor: '#1557b0' }
                    }}
                >
                    Search
                </Button>
            </Paper>
        </Container>
    );
}
