import React from "react";
import Navbar from "./Navbar";
import { Box } from "@mui/material";

import textLogo from '../assets/Logo-nobg.png'
import logo from '../assets/logo.png'

const Header = () => {
    return (
        <div>
            <Box
                display="flex"
                justifyContent="center"
                alignItems='center'
            >
                {/* <img width='70px' height='70px' src={logo} /> */}
                <img src={textLogo} />
            </Box>
            <Navbar />
        </div>
    )

}

export default Header;