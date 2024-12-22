import { Autocomplete, Box, Checkbox, Chip, Grid, Popper, TextField, Typography } from '@mui/material'
import React, { useEffect, useState, useRef } from 'react'
import axiosInstance from '../services/axios';
import { apiRoutes, capitalize, filtersValues } from '../app.constants';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material'

const CustomPopper = (props) => {
    const { anchorEl, open, ...rest } = props;
    const popperRef = useRef(null);

    useEffect(() => {
        if (anchorEl && open) {
            const width = anchorEl.clientWidth;
            if (popperRef.current) {
                popperRef.current.style.width = `${width}px`;
            }
        }
    }, [anchorEl, open]);

    return <Popper {...props} ref={popperRef} />;
};


const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const Filters = ({ onFilterChange }) => {
    const [uniqueAttributes, setUniqueAttributes] = useState({
        brands: [],
        lengths: [],
        rings: [],
        strengths: [],
        origins: [],
        shapes: []
    });
    const [selectedFilters, setSelectedFilters] = useState({
        brand: [],
        length: [],
        ring: [],
        strength: [],
        origin: [],
        shape: []
    });

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const response = await axiosInstance.get(apiRoutes.filters);
                const data = {};
                Object.entries(response.data).forEach(([key, value]) => {
                    data[key] = value.map(val => capitalize(val))
                })
                setUniqueAttributes(data);
            } catch (error) {
                console.error('Error fetching unique attributes:', error);
            }
        };
        fetchAttributes();
    }, []);

    const handleFilterChange = (event, newValue, attribute) => {
        onFilterChange({ ...selectedFilters, [attribute]: newValue });
        setSelectedFilters({ ...selectedFilters, [attribute]: newValue })
    };

    return (
        <Grid container spacing={1} sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'top'
        }}>
            <Grid item xs={6} md={2}>
                <Autocomplete
                    multiple
                    id="length"
                    size='small'
                    value={selectedFilters.length}
                    onChange={(event, newValue) => handleFilterChange(event, newValue, 'length')}
                    options={filtersValues.cigarLength}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps} style={{ fontSize: '1rem' }}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    sx={{ padding: '5px 8px 5px 0', margin: 0 }}
                                    checked={selected}
                                />
                                {option}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Length" />
                    )}
                />
            </Grid>
            <Grid item xs={6} md={2.4}>
                <Autocomplete
                    multiple
                    id="ring"
                    size='small'
                    options={filtersValues.rings}
                    disableCloseOnSelect
                    value={selectedFilters.ring}
                    onChange={(event, newValue) => handleFilterChange(event, newValue, 'ring')}
                    getOptionLabel={(option) => option}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps} style={{ fontSize: '1rem' }}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    sx={{ padding: '5px 8px 5px 0', margin: 0 }}
                                    checked={selected}
                                />
                                {option}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Rings" />
                    )}
                />
            </Grid>
            <Grid item xs={6} md={2.4}>
                <Autocomplete
                    multiple
                    id="strength"
                    size='small'
                    options={filtersValues.strengths}
                    value={selectedFilters.strength}
                    onChange={(event, newValue) => handleFilterChange(event, newValue, 'strength')}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps} style={{ fontSize: '1rem' }}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    sx={{ padding: '5px 8px 5px 0', margin: 0 }}
                                    checked={selected}
                                />
                                {option}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Strength" />
                    )}
                />
            </Grid>
            <Grid item xs={6} md={2.4}>
                <Autocomplete
                    multiple
                    id="origin"
                    size='small'
                    options={uniqueAttributes.origins}
                    value={selectedFilters.origin}
                    onChange={(event, newValue) => handleFilterChange(event, newValue, 'origin')}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            option && option !== 'N/A' &&
                            <li key={key} {...optionProps} style={{
                                textTransform: 'capitalize',
                                fontSize: '1rem'
                            }}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    sx={{ padding: '5px 8px 5px 0', margin: 0 }}
                                    checked={selected}
                                />
                                {option}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Origin" />
                    )}
                />
            </Grid>
            <Grid item xs={6} md={2.4}>
                <Autocomplete
                    multiple
                    id="shape"
                    size='small'
                    options={uniqueAttributes.shapes}
                    value={selectedFilters.shape}
                    onChange={(event, newValue) => handleFilterChange(event, newValue, 'shape')}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            option && option !== 'N/A' &&
                            <li key={key} {...optionProps} style={{
                                textTransform: 'capitalize',
                                fontSize: '1rem'
                            }}>
                                <Checkbox
                                    size='small'
                                    sx={{ padding: '5px 8px 5px 0', margin: 0 }}
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    checked={selected}
                                />
                                {option}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Shape" />
                    )}
                />
            </Grid>
        </Grid>
    )
}

export default Filters