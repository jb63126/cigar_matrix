import React, { useEffect, useState } from 'react'
import './ProductsPage.css'
import { Box, Divider, Grid, Typography } from '@mui/material'
import SearchBox from './SearchBox'
import axiosInstance from '../services/axios'
import { apiRoutes } from '../app.constants'
import Filters from './Filters'
import { useParams } from 'react-router-dom'
import CompareCard from './CompareCard'
import PaginationComponent from './Pagination'

const ProductsPage = () => {
    const [products, setProducts] = useState([])
    const [totalPages, setTotalPages] = useState(0)
    const [page, setPage] = useState(1)
    const [totalRecords, setTotalRecords] = useState(0)
    const [skipItems, setSkipItems] = useState(0)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedFilters, setSelectedFilters] = useState({
        brand: [], length: [], ring: [], strength: [], origin: [], shape: []
    })

    const { id } = useParams()

    useEffect(() => {
        if (id) {
            fetchById(id)
        } else {
            fetchProducts({ query, ...selectedFilters, page })
        }
    }, [])

    const fetchById = async (id) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get(`${apiRoutes.compareById}/${id}`)
            setProducts([response.data])
            setTotalPages(1)
            setTotalRecords(1)
            setSkipItems(0)
        } catch (error) {
            console.error('Error fetching cigar:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async (queryWithFilters) => {
        try {
            setLoading(true)
            const response = await axiosInstance.get(apiRoutes.compareSearch, {
                params: { ...queryWithFilters, limit: 20 }
            })
            setProducts(response.data.cigars)
            setTotalPages(response.data.totalPages)
            setTotalRecords(response.data.totalRecords)
            setSkipItems(response.data.skip)
            window.scrollTo({ top: 0 })
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = (filters) => {
        setSelectedFilters(filters)
        setPage(1)
        fetchProducts({ query, ...filters, page: 1 })
    }

    const handleSearch = (searchTerm) => {
        setQuery(searchTerm)
        setPage(1)
        fetchProducts({ query: searchTerm, ...selectedFilters, page: 1 })
    }

    const handlePageChange = (page) => {
        setPage(page)
        fetchProducts({ query, ...selectedFilters, page })
    }

    return (
        <Box>
            <Grid container rowSpacing='10px' sx={{
                p: { xs: '20px 5%', md: '30px 10% 30px' },
                borderBottom: '1px solid #EEEEEE',
            }}>
                <Grid item xs={12}>
                    <Typography component='h1' sx={{
                        color: '#00ADB5', fontWeight: '700',
                        fontSize: '1.5rem', textAlign: 'center'
                    }}>
                        Compare Cigar Prices Across 5 Retailers
                    </Typography>
                    <Typography sx={{
                        textAlign: 'center', color: '#888',
                        fontSize: '0.85rem', mt: 0.5
                    }}>
                        CigarPage · Neptune · Famous Smoke · JR Cigars · Best Cigar Prices
                    </Typography>
                </Grid>
                <Grid item xs={12} mt='10px'>
                    <SearchBox onSearch={handleSearch} />
                </Grid>
                <Grid item xs={12}>
                    <Typography p='5px 0'><b>Filters:</b></Typography>
                    <Filters onFilterChange={applyFilters} />
                </Grid>
            </Grid>

            <Box sx={{ padding: { xs: '10px 4%', md: '20px 10%' }, background: '#f7f7f7', minHeight: '60vh' }}>
                {loading ? (
                    <Typography textAlign='center' color='#aaa' pt={4}>Loading...</Typography>
                ) : products.length ? (
                    <>
                        <PaginationComponent
                            page={page} totalPages={totalPages} setPage={setPage}
                            totalRecords={totalRecords} startItems={skipItems}
                            endItems={skipItems + products.length} onPageChange={handlePageChange}
                        />
                        {products.map((item, i) => <CompareCard key={i} item={item} />)}
                        <PaginationComponent
                            page={page} totalPages={totalPages} setPage={setPage}
                            totalRecords={totalRecords} startItems={skipItems}
                            endItems={skipItems + products.length} onPageChange={handlePageChange}
                        />
                    </>
                ) : (
                    <Typography textAlign='center' color='#aaa' pt={4}>
                        No results found. Try searching for a brand or cigar name.
                    </Typography>
                )}
            </Box>
        </Box>
    )
}

export default ProductsPage
