import React, { useEffect, useState } from "react"
import './ProductsPage.css'
import { Box, Divider, Grid, selectClasses, Typography } from "@mui/material";
import SearchBox from "./SearchBox";
import ItemsList from "./ItemsList/ItemsList";
import axiosInstance from "../services/axios";
import { apiRoutes } from "../app.constants";
import Filters from "./Filters";
import { useParams } from 'react-router-dom';

const ProductsPage = ({ }) => {
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [skipItems, setSkipItems] = useState(0);
    const [query, setQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        brand: [],
        length: [],
        ring: [],
        strength: [],
        origin: [],
        shape: []
    });

    const { id } = useParams();

    useEffect(() => {
        if (id && !(query || Object.values(selectedFilters).some(filter => filter.length > 0))) {
            console.log("Id: ", id);
            fetchCigarById(id);
        } else {
            fetchQueriedProducts({ query, ...selectedFilters, page });
        }
    }, []);

    const fetchCigarById = async (id) => {
        try {
            const response = await axiosInstance.get(`${apiRoutes.getCigarById}/${id}`);
            setProducts([response.data]);
            setTotalPages(1);
            setTotalRecords(1)
            setSkipItems(0)
        } catch (error) {
            console.error('Error fetching queried products:', error);
        }
    };

    const fetchQueriedProducts = async (queryWithFilters) => {
        try {
            const response = await axiosInstance.get(apiRoutes.search, { params: { ...queryWithFilters, limit: 20 } });
            setProducts(response.data.cigars);
            setTotalPages(response.data.totalPages);
            setTotalRecords(response.data.totalRecords)
            setSkipItems(response.data.skip)
            window.scrollTo({ top: 0 })
        } catch (error) {
            console.error('Error fetching queried products:', error);
        }
    };

    const applyFilters = (filters) => {
        setSelectedFilters(filters);
        setPage(1);
        fetchQueriedProducts({ query, ...filters, page: 1 });
    }

    const handleSearch = (searchTerm) => {
        setQuery(searchTerm);
        setPage(1);
        fetchQueriedProducts({ query: searchTerm, ...selectedFilters, page: 1 });
    }

    const handlePageChange = (page) => {
        setPage(page);
        fetchQueriedProducts({ query, ...selectedFilters, page });
    }

    return (
        <Box>
            <Grid container
                rowSpacing='10px'
                sx={{
                    p: { xs: '20px 5%', md: '30px 10% 30px' },
                    borderBottom: '1px solid #EEEEEE',
                }}>
                <Grid item xs={12} justifyContent='center'>
                    <Typography
                        component='h1'
                        sx={{
                            color: '#00ADB5',
                            fontWeight: '700',
                            fontSize: '1.5rem',
                            textAlign: 'center'
                        }}>
                        The Best Cigar Deal Search
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

            <Box sx={{
                padding: { xs: '0', md: '0 10%' },
                background: '#EEEEEE',
            }}>
                <ItemsList
                    itemsList={products}
                    page={page}
                    totalPages={totalPages}
                    setPage={setPage}
                    totalRecords={totalRecords}
                    startItems={skipItems}
                    onPageChange={handlePageChange}
                />
            </Box>
        </Box>
    );
}

export default ProductsPage;


// const dataItem = {
//     "_id": {
//         "$oid": "66c11fdf7e10dc4db93f4013"
//     },
//     "unique_id": "flordelasantillastoro6*52",
//     "brand": "Flor de las Antillas",
//     "length": "6\"",
//     "name": "Flor de las Antillas Toro 6\" * 52",
//     "origin": "Nicaragua",
//     "packs": [
//         {
//             "name": "Box of 20",
//             "availability": "In stock",
//             "price": "$161.95"
//         },
//         {
//             "name": "Single",
//             "availability": "In stock",
//             "price": "$8.55"
//         }
//     ],
//     "prod_url": "https://www.neptunecigar.com/cigars/flor-de-las-antillas-toro",
//     "ring": "52",
//     "scraped_at": {
//         "$date": "2024-08-17T22:09:34.274Z"
//     },
//     "shape": "Toro",
//     "site_name": "Neptune Cigar",
//     "strength": "Medium"
// }