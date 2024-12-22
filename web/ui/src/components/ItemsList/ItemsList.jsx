import { Box, Card, Grid, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React, { useState } from 'react'
import ListItem from './ListItem'
import PaginationComponent from '../Pagination'

const ItemsList = ({ itemsList, page, totalPages, setPage, totalRecords, startItems, onPageChange }) => {

    return (
        <Box sx={{ background: 'white' }}>
            <Grid
                container
                justifyContent="center"
                alignItems="center"
                padding={{ xs: '0', md: '0 10% 40px 10%' }}
            >
                {itemsList.length ?
                    <>
                        <Grid item xs={12}>
                            <PaginationComponent
                                page={page}
                                totalPages={totalPages}
                                setPage={setPage}
                                totalRecords={totalRecords}
                                startItems={startItems}
                                endItems={startItems + itemsList.length}
                                onPageChange={onPageChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            {itemsList.map((item, i) => (<ListItem key={i} item={item} />))}
                        </Grid>
                        <Grid item xs={12} >
                            <PaginationComponent
                                page={page}
                                totalPages={totalPages}
                                setPage={setPage}
                                totalRecords={totalRecords}
                                startItems={startItems}
                                endItems={startItems + itemsList.length}
                                onPageChange={onPageChange}
                            />
                        </Grid>
                    </> :
                    <Grid item xs={12} pt='20px' textAlign='center'>
                        No Results Found
                    </Grid>}
            </Grid>
        </Box>
    )
}

export default ItemsList