import React from 'react';
import { Container, Grid, Link, Typography, Box } from '@mui/material';
import logo from '../assets/logo.png'

const Footer = () => {
    return (
        <Box component="footer" py={3} bgcolor="primary.main" color="white">
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={4} md={6}>
                        <Typography variant="h6" gutterBottom>
                            About Us
                        </Typography>
                        <Typography variant="body2">
                            We compare the best cigars available in the market. Our goal is to provide you with the best information to make your cigar choices easier.
                        </Typography>
                    </Grid>
                    {/* <Grid item xs={12} sm={4} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Quick Links
                        </Typography>
                        <Link href="/home" color="inherit" variant="body2" display="block">
                            Home
                        </Link>
                        <Link href="/compare" color="inherit" variant="body2" display="block">
                            Compare Cigars
                        </Link>
                        <Link href="/contact" color="inherit" variant="body2" display="block">
                            Contact Us
                        </Link>
                        <Link href="/about" color="inherit" variant="body2" display="block">
                            About Us
                        </Link>
                    </Grid> */}
                    {/* <Grid item xs={12} sm={4} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Resources
                        </Typography>
                        <Link href="/blogs" color="inherit" variant="body2" display="block">
                            Blogs
                        </Link>
                        <Link href="/guides" color="inherit" variant="body2" display="block">
                            Guides
                        </Link>
                        <Link href="/reviews" color="inherit" variant="body2" display="block">
                            Reviews
                        </Link>
                        <Link href="/faq" color="inherit" variant="body2" display="block">
                            FAQ
                        </Link>
                    </Grid> */}
                    <Grid item xs={12} sm={4} md={6} sx={{ display: { xs: 'block', md: 'flex' } }} justifyContent='right'>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Legal
                            </Typography>
                            {/* <Link href="/terms" color="inherit" variant="body2" display="block">
                            Terms of Service
                        </Link> */}
                            <Link href="/privacy-policy" color="inherit" variant="body2" display="block">
                                Privacy Policy
                            </Link>
                            {/* <Link href="/cookie-policy" color="inherit" variant="body2" display="block">
                            Cookie Policy
                        </Link> */}
                        </Box>
                    </Grid>
                </Grid>
                <Box mt={3} textAlign="center">
                    <Typography variant="body2">
                        © {new Date().getFullYear()} Cigar Matrix. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;